# Voyde Procedural · Superhive descriptions

One design system for every [Voyde Procedural](https://superhivemarket.com/creators/toprak-tatveren) product
description on Superhive, with live "card" areas that send buyers to the other products.

- **`products.yaml`**: the catalog. Name, Superhive slug, category, summary, badges, hand-picked pairs, bundles.
- **`content/<id>.yaml`**: the long description of one product (sections, features, media).
- **`design/tokens.yaml`**: colors, fonts and sizes (from voydeprocedural.com). See [DESIGN.md](DESIGN.md).
- **`scripts/build.py`**: renders `descriptions/<id>.html` (paste into Superhive) and the widget data.
- **`site/`**: published on GitHub Pages at <https://voydeprocedural.github.io/superhive-descriptions/>:
  the two card widgets (`w/pair.html`, `w/more.html`), their data, card covers and previews.

## Why two kinds of content

Superhive keeps inline styles, links, images and iframes in a description, but drops `class` and `<style>`.

- The **description body** is plain HTML with inline styles, so Superhive shows it directly, search engines read it,
  and it folds to one column on phones. It changes only when it is pasted again.
- The **card areas** ("Pairs well with" and "More from the studio") are iframes from GitHub Pages. They render from
  `site/data/products.json`, so a change to `products.yaml` (a new product, a new pair, a bundle, a NEW flag) reaches
  every description after a push, without touching Superhive.

## Everyday tasks

```bash
uv run scripts/build.py          # after any change to products.yaml, content/ or templates/
uv run scripts/serve.py          # previews on http://127.0.0.1:8766/ (index lists every product)
uv run scripts/fetch_live.py     # save what is live on Superhive now into archive/<date>/
uv run scripts/cover.py <id> <superhive cover URL or file>   # card cover site/img/<id>.webp
```

**Add a product**: add it to the top of `products.yaml`, put a 960x480 cover in `site/img/<id>.webp`, write
`content/<id>.yaml`, build, check `site/preview/<id>.html`, then paste `descriptions/<id>.html` into Superhive.
The new product appears in the cards of the other descriptions after the push.

**Update a description on Superhive**: Edit product → Product Page → Product Description → code view (`</>`),
select all, paste `descriptions/<id>.html` (or use "Copy HTML for Superhive" on the preview page), save, then open the
live page and check it. The editor autosaves, so only open it to publish.

**Roll back**: paste `archive/<date>/<id>.html` the same way.

## Publishing

Every push to `main` runs `.github/workflows/pages.yml`, which builds and publishes `site/` to GitHub Pages.
Browsers may keep the old widget data for up to 10 minutes.

## License

Text and images © Voyde Procedural. The code in `scripts/`, `templates/` and `site/w/` is MIT licensed.
The widgets load Bebas Neue, Inter and IBM Plex Mono from Google Fonts (SIL Open Font License).
