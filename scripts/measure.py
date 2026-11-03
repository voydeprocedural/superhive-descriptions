"""Measure full-page descriptions (`layout: frame`) and store their height as frame_height.

    uv run scripts/measure.py [id ...]     # default: every product with layout: frame

Builds, opens site/full/<id>.html?measure in headless Microsoft Edge at the layout width, reads the height the page
reports once fonts and images have loaded, writes frame_height (plus a small margin) into content/<id>.yaml and
builds again. Run it after changing the content of such a product. Windows only (uses Edge).
"""

import pathlib
import re
import subprocess
import sys
import tempfile

import yaml

ROOT = pathlib.Path(__file__).resolve().parent.parent
MARGIN = 24  # px of slack, so small font differences between browsers never cut the footer off
EDGE = [pathlib.Path(r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"),
        pathlib.Path(r"C:\Program Files\Microsoft\Edge\Application\msedge.exe")]


def build():
    subprocess.run(["uv", "run", "--quiet", str(ROOT / "scripts" / "build.py")], check=True, cwd=ROOT)


def measure(edge, pid, width):
    page = (ROOT / "site" / "full" / f"{pid}.html").as_uri() + "?measure"
    with tempfile.TemporaryDirectory() as profile:
        dom = subprocess.run(
            [str(edge), "--headless=new", "--disable-gpu", "--hide-scrollbars", f"--user-data-dir={profile}",
             f"--window-size={width},3000", "--virtual-time-budget=60000", "--dump-dom", page],
            capture_output=True, text=True, encoding="utf-8", timeout=180).stdout
    m = re.search(r'<meta name="measured-height" content="(\d+)">', dom)
    if not m:
        sys.exit(f"{pid}: the page did not report its height (fonts or images did not finish loading?)")
    return int(m.group(1))


def main():
    edge = next((e for e in EDGE if e.exists()), None)
    if not edge:
        sys.exit("Microsoft Edge not found")
    build()
    for f in sorted((ROOT / "content").glob("*.yaml")):
        d = yaml.safe_load(f.read_text(encoding="utf-8"))
        if d.get("layout") != "frame" or (sys.argv[1:] and f.stem not in sys.argv[1:]):
            continue
        height = measure(edge, f.stem, d.get("frame_width", 660)) + MARGIN
        text = f.read_text(encoding="utf-8")
        text = re.sub(r"^frame_height: *\d*\s*$", f"frame_height: {height}", text, count=1, flags=re.M)
        f.write_text(text, encoding="utf-8", newline="\n")
        print(f"{f.stem}: frame_height {height}")
    build()


if __name__ == "__main__":
    main()
