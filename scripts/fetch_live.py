"""Save the description that is live on Superhive for every product in products.yaml.

    uv run scripts/fetch_live.py [--out archive/YYYY-MM-DD] [id ...]

Reads the public product pages (no login), so the saved HTML is what Superhive shows after its own
clean-up. Pasting a saved file back into the description editor's code view restores that description.
"""

import argparse
import datetime
import pathlib
import urllib.request

import yaml
from bs4 import BeautifulSoup

ROOT = pathlib.Path(__file__).resolve().parent.parent


def live_description(slug):
    req = urllib.request.Request(
        f"https://superhivemarket.com/products/{slug}", headers={"User-Agent": "Mozilla/5.0"}
    )
    with urllib.request.urlopen(req, timeout=30) as r:
        soup = BeautifulSoup(r.read().decode("utf-8"), "html.parser")
    box = soup.select_one("#tab-content-main")
    if box is None:
        raise RuntimeError(f"no description found on {slug}")
    return box.decode_contents().replace("<!-- Content -->", "").strip() + "\n"


def main():
    p = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    p.add_argument("ids", nargs="*", help="Product ids (default: all)")
    p.add_argument("--out", default=f"archive/{datetime.date.today():%Y-%m-%d}")
    args = p.parse_args()

    catalog = yaml.safe_load((ROOT / "products.yaml").read_text(encoding="utf-8"))
    out = ROOT / args.out
    out.mkdir(parents=True, exist_ok=True)
    for prod in catalog["products"]:
        if args.ids and prod["id"] not in args.ids:
            continue
        if prod.get("status") != "published":
            continue
        html = live_description(prod["superhive"])
        (out / f"{prod['id']}.html").write_text(html, encoding="utf-8")
        print(f"{prod['id']:30} {len(html):6} chars")


if __name__ == "__main__":
    main()
