"""Check the connected public design walkthrough with a local server on :4321."""
from pathlib import Path
from urllib.parse import urlparse, parse_qs
from playwright.sync_api import sync_playwright, expect

BASE = 'http://127.0.0.1:4321/design/prototypes/'
OUT = Path(__file__).parent / 'out' / 'public-demo'
OUT.mkdir(parents=True, exist_ok=True)
PAGES = ['home', 'calendar', 'archive', 'article', 'about', 'contact']
ROUTES = dict(zip(['Home', 'Calendar', 'Archive', 'About', 'Contact'],
                  ['home', 'calendar', 'archive', 'about', 'contact']))
errors, failed_requests = [], []

with sync_playwright() as p:
    browser = p.chromium.launch()
    page = browser.new_page(viewport={'width': 1440, 'height': 900}, reduced_motion='reduce')
    page.on('pageerror', lambda e: errors.append(str(e)))
    page.on('console', lambda m: errors.append(m.text) if m.type == 'error' else None)
    page.on('response', lambda r: failed_requests.append((r.status, r.url)) if r.status >= 400 else None)
    for width, height in [(1440, 900), (390, 844)]:
        page.set_viewport_size({'width': width, 'height': height})
        for name in PAGES:
            page.goto(BASE + name + '.html', wait_until='networkidle')
            page.evaluate('document.fonts.ready')
            assert page.evaluate('document.documentElement.scrollWidth') == width, (name, width, 'overflow')
            expect(page.locator('h1')).to_have_count(1)
            nav = page.locator('nav[aria-label="Main"]')
            expect(nav.locator('a')).to_have_count(5)
            expect(page.locator('a[href^="news.html"], a[href^="events.html"]')).to_have_count(0)
            for label, route in ROUTES.items():
                expect(nav.get_by_role('link', name=label, exact=True, include_hidden=True)).to_have_attribute('href', route + '.html')
            expect(nav.locator('[aria-current="page"]')).to_have_count(1)
            if width == 390:
                page.get_by_role('button', name='Open menu', exact=True).click()
                expect(page.get_by_role('dialog', name='Site navigation')).to_be_visible()
                page.keyboard.press('Escape')
                expect(page.get_by_role('dialog', name='Site navigation')).not_to_be_visible()
                expect(page.get_by_role('button', name='Open menu', exact=True)).to_be_focused()
            assert page.locator('a[href="#"]').count() == 0, (name, 'unconnected link')
            assert page.locator('img').evaluate_all('(xs) => xs.every(x => !x.complete || x.naturalWidth > 0)'), name
            page.screenshot(path=OUT / f'{name}-{width}.png', full_page=True)
            print(name, width, 'navigation, layout, and screenshot passed', flush=True)

    page.set_viewport_size({'width': 1440, 'height': 900})
    page.goto(BASE + 'home.html', wait_until='networkidle')
    page.get_by_role('link', name='See event details', exact=True).click()
    expect(page.locator('h1')).to_have_text('Second-semester student assembly')
    expect(page.locator('[data-component="EventStamp"]')).to_contain_text('23')
    page.get_by_role('link', name='See this day on the calendar').click()
    expect(page.locator('#day-title')).to_contain_text('23')
    expect(page.locator('#day-list')).to_contain_text('Second-semester student assembly')

    page.goto(BASE + 'archive.html?q=scholarship', wait_until='networkidle')
    expect(page.locator('#results')).to_contain_text('scholarship')
    first = page.locator('[data-component="ResultRow"]').first
    expected_title = first.locator('.story-title').inner_text()
    first.click()
    expect(page.locator('h1')).to_have_text(expected_title)
    page.reload(wait_until='networkidle')
    expect(page.locator('h1')).to_have_text(expected_title)
    page.go_back(wait_until='networkidle')
    expect(page.locator('#q')).to_have_value('scholarship')

    page.goto(BASE + 'calendar.html', wait_until='networkidle')
    with page.expect_download() as download_info:
        page.get_by_role('button', name='Download calendar', exact=True).click()
    download = download_info.value
    download_path = OUT / download.suggested_filename
    download.save_as(download_path)
    assert 'BEGIN:VCALENDAR' in download_path.read_text(encoding='utf-8')
    assert 'TZID=Asia/Manila' in download_path.read_text(encoding='utf-8')

    for width in [320, 768, 1024]:
        page.set_viewport_size({'width': width, 'height': 900})
        for name in ['home', 'calendar', 'archive', 'article', 'contact']:
            page.goto(BASE + name + '.html', wait_until='networkidle')
            assert page.evaluate('document.documentElement.scrollWidth') == width, (name, width, 'overflow')
        print(width, 'intermediate responsive checks passed', flush=True)
    browser.close()

assert not errors, errors
assert not failed_requests, failed_requests
print('Public navigation, matching details, date links, search, refresh/back, calendar download: passed; console and HTTP errors: []')
