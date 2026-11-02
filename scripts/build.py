"""Build the Superhive descriptions and the card widget data from products.yaml.

    uv run scripts/build.py            # everything
    uv run scripts/build.py --check    # fail if the committed output is out of date (CI)

Writes:
    descriptions/<id>.html     paste into Superhive: Product Page > Product Description > code view (</>)
    site/data/products.json    read by the card widgets on GitHub Pages (site/w/)
    site/w/tokens.css          design tokens for the widgets
    site/preview/<id>.html     the description inside a Superhive-like page, with a copy button
    site/index.html            list of all previews
"""

import argparse
import html
import json
import pathlib
import re
import sys

import yaml
from jinja2 import Environment, FileSystemLoader, StrictUndefined
from markupsafe import Markup

ROOT = pathlib.Path(__file__).resolve().parent.parent

# Fixed aspect ratios of the two widgets: the iframe keeps this ratio at every width and the widget scales with it.
WIDGETS = {"pair": {"width": 960, "height": 320}, "more": {"width": 960, "height": 620}}


def load(path):
    return yaml.safe_load((ROOT / path).read_text(encoding="utf-8"))


def md(text, tokens=None):
    """Escape text and allow **bold**, `code` and [links](https://...)."""
    c, f = TOKENS["color"], TOKENS["font"]
    out = html.escape(str(text), quote=False)
    out = re.sub(r"\*\*(.+?)\*\*", rf'<strong style="font-weight:600;color:{c["heading"]};">\1</strong>', out)
    out = re.sub(
        r"`(.+?)`",
        rf'<code style="padding:1px 6px;font-family:{f["mono"]};font-size:0.9em;color:{c["brand_soft"]};'
        rf'background-color:{c["surface2"]};border-radius:4px;">\1</code>',
        out,
    )
    out = re.sub(
        r"\[(.+?)\]\((https?://[^)\s]+)\)",
        rf'<a href="\2" target="_blank" rel="noopener" style="color:{c["brand_bright"]};text-decoration:underline;">\1</a>',
        out,
    )
    return Markup(out)


TOKENS = load("design/tokens.yaml")


def pairs(items):
    """`- Name: text` (or `- [Name, text]`) entries as (name, text) tuples."""
    out = []
    for item in items:
        if isinstance(item, dict):
            (name, text), = item.items()
        else:
            name, text = item
        out.append((str(name), str(text)))
    return out


PAIRED = ("features", "specs", "faq")  # section types whose items are name: text entries


def normalize(d):
    d = dict(d)
    if d.get("stats"):
        d["stats"] = pairs(d["stats"])
    d["sections"] = [dict(s, items=pairs(s["items"])) if s.get("type") in PAIRED else s for s in d.get("sections", [])]
    return d


def validate(catalog):
    errors = []
    ids = [p["id"] for p in catalog["products"]]
    for dup in {i for i in ids if ids.count(i) > 1}:
        errors.append(f"duplicate id: {dup}")
    required = ("id", "name", "tagline", "superhive", "category", "kind", "blender", "summary", "status")
    for p in catalog["products"]:
        for key in required:
            if not p.get(key):
                errors.append(f"{p.get('id', '?')}: missing {key}")
        if p.get("category") not in catalog["categories"]:
            errors.append(f"{p['id']}: unknown category {p.get('category')}")
        for other in p.get("pairs", []):
            if other not in ids:
                errors.append(f"{p['id']}: pairs lists unknown product {other}")
        if p.get("status") == "published" and not (ROOT / "site/img" / f"{p['id']}.webp").exists():
            errors.append(f"{p['id']}: site/img/{p['id']}.webp is missing (960x480 card cover)")
    for b in catalog.get("bundles", []):
        if not (ROOT / "site" / b["image"]).exists():
            errors.append(f"bundle {b['id']}: site/{b['image']} is missing")
        for other in b.get("includes", []):
            if other not in ids:
                errors.append(f"bundle {b['id']}: includes unknown product {other}")
    if errors:
        sys.exit("products.yaml:\n  " + "\n  ".join(errors))


def related(p, catalog):
    """Products to recommend on p's page, best first: hand-picked pairs, then related categories, then newest."""
    published = [q for q in catalog["products"] if q["status"] == "published" and q["id"] != p["id"]]
    by_id = {q["id"]: q for q in published}
    order = [i for i in p.get("pairs", []) if i in by_id]
    for cat in catalog["categories"][p["category"]]["related"]:
        order += [q["id"] for q in published if q["category"] == cat and q["id"] not in order]
    order += [q["id"] for q in published if q["id"] not in order]
    return order


def product_json(p, catalog):
    return {
        "id": p["id"],
        "name": p["name"],
        "tagline": p["tagline"],
        "url": f"https://superhivemarket.com/products/{p['superhive']}",
        "img": f"img/{p['id']}.webp",
        "category": catalog["categories"][p["category"]]["label"],
        "kind": p["kind"],
        "blender": p["blender"],
        "summary": p["summary"],
        "badges": p.get("badges", []),
        "flag": p.get("flag", ""),
        "related": related(p, catalog),
    }


def build(catalog):
    store = catalog["store"]
    out = {}
    published = [p for p in catalog["products"] if p["status"] == "published"]

    data = {
        "store": {k: store[k] for k in ("name", "tagline", "superhive", "website")} | {"socials": store["socials"]},
        "count": len(published),
        "products": {p["id"]: product_json(p, catalog) for p in published},
        "order": [p["id"] for p in published],
        "bundles": catalog.get("bundles", []),
    }
    if store.get("announcement"):
        data["store"]["announcement"] = store["announcement"]
    out["site/data/products.json"] = json.dumps(data, indent=1, ensure_ascii=False) + "\n"

    c, f = TOKENS["color"], TOKENS["font"]
    css = [":root {"]
    css += [f"  --{k.replace('_', '-')}: {v};" for k, v in c.items()]
    css += [f"  --font-{k}: {v};" for k, v in f.items()]
    css += ["}"]
    out["site/w/tokens.css"] = "/* Generated by scripts/build.py from design/tokens.yaml. */\n" + "\n".join(css) + "\n"

    env = Environment(loader=FileSystemLoader(ROOT / "templates"), autoescape=True, undefined=StrictUndefined,
                      keep_trailing_newline=True)
    env.filters["md"] = md
    safe = lambda d: {k: Markup(v) if isinstance(v, str) else v for k, v in d.items()}
    footer_links = [("voydeprocedural.com", store["website"]), ("All products", store["superhive"])]
    footer_links += [(name.upper() if name == "x" else name.capitalize(), url) for name, url in store["socials"].items()]

    preview_items = []
    for p in catalog["products"]:
        content_file = ROOT / "content" / f"{p['id']}.yaml"
        if not content_file.exists():
            continue
        d = normalize(yaml.safe_load(content_file.read_text(encoding="utf-8")))
        sections = list(d["sections"])
        types = [s["type"] for s in sections]
        if "pair" not in types:
            sections.insert(min(2, len(sections)), {"type": "pair"})
        if "more" not in types:
            sections.append({"type": "more"})
        ctx = dict(c=safe(c), f=safe(f), z=TOKENS["size"], p=p, d=d, sections=sections, widgets=WIDGETS,
                   footer_links=footer_links)
        desc = env.get_template("description.html.j2").render(base=store["pages"], **ctx)
        desc = re.sub(r"\n{3,}", "\n\n", desc).strip() + "\n"
        out[f"descriptions/{p['id']}.html"] = desc
        # The preview embeds the widgets from this site, so it also works before a push and on localhost.
        local = env.get_template("description.html.j2").render(base="../", **ctx)
        out[f"site/preview/{p['id']}.html"] = env.get_template("preview.html.j2").render(
            p=p, description=Markup(local), paste=desc, store=store, products=published)
        preview_items.append(p)

    out["site/index.html"] = env.get_template("index.html.j2").render(
        store=store, products=catalog["products"], previews={p["id"] for p in preview_items})
    return out


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--check", action="store_true", help="Only report files that would change")
    args = ap.parse_args()

    catalog = load("products.yaml")
    validate(catalog)
    stale = []
    for rel, text in build(catalog).items():
        path = ROOT / rel
        old = path.read_text(encoding="utf-8") if path.exists() else None
        if old == text:
            continue
        stale.append(rel)
        if not args.check:
            path.parent.mkdir(parents=True, exist_ok=True)
            path.write_text(text, encoding="utf-8", newline="\n")
    for rel in stale:
        print(("out of date: " if args.check else "wrote ") + rel)
    if args.check and stale:
        sys.exit("Run `uv run scripts/build.py` and commit the result.")


if __name__ == "__main__":
    main()
