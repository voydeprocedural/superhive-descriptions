# Design system

The descriptions continue voydeprocedural.com: a near-black violet panel, a faint 44 px grid, a violet glow in the
top right, Bebas Neue titles, mono labels and violet accents. Values live in `design/tokens.yaml`; the description
template and the widgets both read them.

## Type

| Role | Font | Where it comes from on Superhive |
|---|---|---|
| Display: product name, section titles, stats | Bebas Neue 400 | Superhive's Adobe Fonts kit (`bebas-neue`) |
| Body | Inter 400/600 | Superhive's page font |
| Labels, kickers, chips | IBM Plex Mono 400/500, uppercase, wide tracking | declared by Superhive |

The widgets load the same three from Google Fonts.

## Color

| Token | Value | Use |
|---|---|---|
| `bg` | `#0b0816` | description panel |
| `surface` / `surface2` | `#120d22` / `#191230` | cards / chips |
| `line` / `line_strong` | `#2b1d4a` / `#4a2a85` | borders |
| `brand` / `brand_bright` / `brand_soft` | `#9b30ff` / `#bf5fff` / `#dcc2ff` | buttons, kickers, accents |
| `heading` / `text` / `muted` / `dim` | `#ffffff` / `#e8e4ff` / `#aaa4cf` / `#8a84b0` | text |

## Page structure

Every description has the same order, so the store reads as one family:

1. **Top bar**: `◆ VOYDE PROCEDURAL / <kind> / Blender <versions>`
2. **Hero**: product name (72 px), tagline (violet), headline sentence, intro paragraphs, chips
3. **Hero media**: GIF or image, and/or YouTube video
4. **Stats strip** (optional): 2-4 big numbers
5. **Sections**, numbered `01 — KICKER` with a display title. Types:
   `features` (card grid), `feature` (text + media), `specs` (name / description rows), `chips`, `steps`, `faq`,
   `facts` (side-by-side cards such as Included / Compatibility)
6. **Pairs well with** card (iframe) after the second section, unless `content/<id>.yaml` places `- type: pair`
7. **More from the studio** card (iframe) at the end, unless placed with `- type: more`
8. **Footer bar**: logo, voydeprocedural.com, all products, socials

## Superhive rules the template works around

- No `class` and no `<style>`: every element has inline styles.
- The sanitizer also removes `text-transform`, `gap` and `transform` from inline styles (and `rel` from links).
  Uppercase labels are uppercased in the template, flex rows space their items with margins, and bullets are a `◆`
  character. `build.py` refuses to write a description that uses these properties.
- Superhive forces `font-weight:600 !important` on `h1`-`h6` and `line-height:1.6 !important` on `p`.
  Display titles are therefore `<div>`s (Bebas Neue has a single weight and would be faked bold), and `<p>` is used
  only for body text.
- No media queries inline: rows use `display:flex; flex-wrap:wrap` with `flex-basis`, so they become one column on
  narrow screens.
- Iframes keep their ratio with `aspect-ratio`; the widgets are drawn on a 960 px canvas in `rem` (1/96 of the width)
  and switch to a simpler layout below 560 px.
- Superhive's content security policy (report-only in November 2026) allows `img-src https:` and `frame-src https:`,
  so images and widgets must stay on HTTPS hosts (GitHub Pages, Superhive's own asset CDN).

## Card widgets

- **Pairs well with** (`w/pair.html?p=<id>`, 960x320): rotates through the first three related products every 6.5 s,
  pauses on hover, never rotates with reduced motion.
- **More from the studio** (`w/more.html?p=<id>`, 960x620): studio panel (logo, bundle that contains this product,
  socials, "All N products") and four cards: related products 4-6 plus one random pick from the rest.
- Related products: `pairs` from `products.yaml` first, then the categories in `categories.<cat>.related`, then newest.
- Product links open in the same tab (`target="_top"`); social links in a new tab.

## Writing

English, plain and checkable. Lead with the benefit, then how it works. Don't claim what the product does not do, and
don't name competitors. Keep each feature to one line.
