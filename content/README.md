# content/&lt;id&gt;.yaml

The long description of one product. `<id>` is the product's `id` in `products.yaml`, which also supplies the name,
tagline, kind and Blender versions shown in the top bar and hero. See `freezing-effect.yaml` for a full example.
Text is English. In any text field, `**bold**`, `` `code` `` and `[label](https://...)` work.

```yaml
headline: One sentence, the main benefit.            # required, white, under the tagline
intro:                                               # required, 1-3 paragraphs
  - "**Product** does X for Y."
chips: [Short fact, Short fact]                      # optional, 3-5 pills under the intro
hero: {src: https://..., alt: What the image shows}  # optional, GIF or image under the hero
video: T4sI0QxJfns                                   # optional, YouTube id, shown under the hero image
stats:                                               # optional, 2-4 big numbers
  - 8: modifier controls

sections:                                            # numbered 01, 02 ... in this order
  - type: features                                   # card grid, 4-10 items
    kicker: Key features                             # small violet label
    title: Display title                             # Bebas Neue title
    items:
      - Feature name: One sentence about it.
  - type: feature                                    # text and one image or video
    kicker: How it works
    title: ...
    text: [Paragraph, Paragraph]
    media: {src: https://..., alt: ...}              # or {youtube: <id>, alt: ...}
  - type: gallery                                    # 2-column grid of images or videos
    kicker: ...
    title: ...
    text: [Optional paragraph]
    items:
      - {src: https://..., alt: ..., caption: Optional line under it}
  - type: specs                                      # name / description rows (settings, presets, specs)
    kicker: ...
    title: ...
    media: {src: ..., alt: ...}                      # optional, shown above the rows
    items:
      - Setting name: What it does.
  - type: chips                                      # pills, e.g. "Perfect for"
    kicker: ...
    title: ...
    items: [Use case, Use case]
  - type: steps                                      # numbered steps, e.g. installation or quick start
    kicker: ...
    title: ...
    items: [Step one, Step two]
  - type: faq
    kicker: FAQ
    title: ...
    items:
      - "Question?": Answer.
  - type: facts                                      # side-by-side cards, e.g. Included / Compatibility
    kicker: Details
    title: What you get
    cards:
      - title: Included
        items: [Item, Item]
  - type: embed                                      # an interactive page of this repo in an iframe
    kicker: Try it
    title: ...
    text: [What to do with it]
    src: x/<id>-<name>.html                          # under site/, scales with its width (see x/crawlers-spider.html)
    alt: What it is
    width: 960                                       # aspect ratio of the iframe (default 960 x 360)
    height: 360
  - type: pair                                       # optional: where the "Pairs well with" card goes
  - type: more                                       # optional: where the "More from the studio" card goes
```

Every section except `pair`/`more` accepts optional `text` (paragraphs) and `media`. Without `- type: pair` the
"Pairs well with" card goes after the second section; without `- type: more` the studio card goes at the end.

Rules:

- Keep the product's real claims; never add features, numbers or compatibility that are not in the source.
- Images must be on HTTPS: Superhive's asset CDN (`assets.superhivemarket.com`) or GitHub Pages. Every image gets
  an `alt` that says what it shows.
- In `- Name: text` entries, quote the line if the name itself contains `: ` or starts with a special YAML character.
