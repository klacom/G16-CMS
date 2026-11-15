"""Full-page screenshots of a prototype at desktop (1440) and mobile (390), plus console errors.

Usage (with the `design` server from .claude/launch.json running on :4321):
  python -I design/tools/shot.py http://localhost:4321/design/prototypes/home.html out/home
Writes out/home-desktop.png, out/home-mobile.png and the above-the-fold variants.
Lazy-loaded images below the fold may show blank in full-page shots; that is expected.
"""
import sys
from playwright.sync_api import sync_playwright

url, out = sys.argv[1], sys.argv[2]
errs = []
with sync_playwright() as p:
    b = p.chromium.launch()
    for name, w, h in [("desktop", 1440, 900), ("mobile", 390, 844)]:
        pg = b.new_page(viewport={"width": w, "height": h})
        pg.on("console", lambda m: errs.append(m.text) if m.type == "error" else None)
        pg.on("pageerror", lambda e: errs.append(str(e)))
        pg.goto(url, wait_until="networkidle"); pg.wait_for_timeout(900)
        pg.screenshot(path=f"{out}-{name}.png", full_page=True)
        pg.screenshot(path=f"{out}-{name}-fold.png")
        print(name, "page width:", pg.evaluate("document.documentElement.scrollWidth"), "(should equal", w, ")")
    b.close()
print("console errors:", errs)
