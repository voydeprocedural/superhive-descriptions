"""Make the 960x480 card cover a product needs in site/img/<id>.webp.

    uv run scripts/cover.py <id> <image file or https URL>

Takes the Superhive cover (or any 2:1 image), crops it to 2:1 from the centre and saves it as WebP.
"""

import io
import pathlib
import sys
import urllib.request

from PIL import Image

ROOT = pathlib.Path(__file__).resolve().parent.parent


def main():
    if len(sys.argv) != 3:
        sys.exit(__doc__)
    pid, src = sys.argv[1], sys.argv[2]
    if src.startswith("https://"):
        req = urllib.request.Request(src, headers={"User-Agent": "Mozilla/5.0"})
        with urllib.request.urlopen(req, timeout=60) as r:
            im = Image.open(io.BytesIO(r.read()))
    else:
        im = Image.open(src)
    im = im.convert("RGB")
    w, h = im.size
    if w / h > 2:
        nw = 2 * h
        im = im.crop(((w - nw) // 2, 0, (w + nw) // 2, h))
    else:
        nh = w // 2
        im = im.crop((0, (h - nh) // 2, w, (h + nh) // 2))
    out = ROOT / "site" / "img" / f"{pid}.webp"
    im.resize((960, 480), Image.LANCZOS).save(out, quality=82)
    print(f"wrote {out.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
