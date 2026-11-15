"""Verify the desk prototypes (overview, My articles, editor, Reviews).

Run with the design server on port 4321: python -I design/tools/check_dashboard.py
"""
from pathlib import Path
from playwright.sync_api import sync_playwright, expect

BASE = 'http://127.0.0.1:4321/design/prototypes/'
OUT = Path(__file__).parent / 'out' / 'desk-states'
OUT.mkdir(parents=True, exist_ok=True)
errors = []

NAV = {
    'writer': ['Overview', 'My articles', 'Inbox', 'Account'],
    'reviewer': ['Overview', 'Reviews', 'Inbox', 'Account'],
    'admin': ['Overview', 'Articles', 'Users', 'Messages', 'Audit log', 'Site settings', 'Inbox', 'Account'],
}


def no_overflow(page, width):
    assert page.evaluate('document.documentElement.scrollWidth') == width, f'overflow at {width}'


with sync_playwright() as p:
    browser = p.chromium.launch()

    # Role-based nav and overview on desktop.
    page = browser.new_page(viewport={'width': 1440, 'height': 900})
    page.on('pageerror', lambda e: errors.append(str(e)))
    page.on('console', lambda m: errors.append(m.text) if m.type == 'error' else None)
    for role, labels in NAV.items():
        page.goto(BASE + f'dashboard.html?role={role}', wait_until='networkidle')
        nav = page.locator('.desk-sidebar nav .nav-item span:first-of-type')
        expect(nav).to_have_text(labels)
        expect(page.locator('.desk-sidebar [aria-current="page"]')).to_contain_text('Overview')
        expect(page.locator('h1')).to_contain_text('Good morning')
        expect(page.locator('#summary')).to_contain_text('Sunday, November 15')
        # Badges never carry a border (The Pressable Outline Rule).
        assert page.evaluate("[...document.querySelectorAll('.badge')].every(b => getComputedStyle(b).borderTopWidth === '0px')")
        no_overflow(page, 1440)

    # Month desk: today selected, chips carry the person's dated work, choosing a day updates the column.
    page.goto(BASE + 'dashboard.html', wait_until='networkidle')
    expect(page.locator('#month-heading')).to_have_text('November 2026')
    today = page.locator('.cell.today')
    expect(today).to_have_attribute('aria-pressed', 'true')
    expect(page.locator('#day-heading')).to_have_text('Sunday, November 15 (today)')
    expect(page.locator('[data-key="2026-11-16"] .chip-ev')).to_have_count(1)
    expect(page.locator('[data-key="2026-11-18"] .chip-ev[data-status="published"]')).to_have_count(1)
    page.get_by_role('button', name='Show Monday').click()
    expect(page.locator('#day-heading')).to_be_focused()
    expect(page.locator('#day-heading')).to_have_text('Monday, November 16')
    expect(page.locator('#day-list')).to_contain_text('Goes live, 8:00 AM')
    page.locator('[data-key="2026-11-18"]').click()
    expect(page.locator('[data-key="2026-11-18"]')).to_have_attribute('aria-pressed', 'true')
    expect(page.locator('[data-key="2026-11-16"]')).to_have_attribute('aria-pressed', 'false')
    expect(page.locator('#day-list')).to_contain_text('Computer Studies hackathon kickoff')
    page.locator('#next').click()
    expect(page.locator('#month-heading')).to_have_text('December 2026')
    expect(page.locator('[data-key="2026-12-05"] .chip-ev[data-status="draft"]')).to_have_count(1)
    page.locator('#prev').click()
    expect(page.locator('#work a')).to_have_count(4)
    page.locator('#needs a', has_text='Edit draft').click()
    page.wait_for_url('**/dashboard-editor.html?id=a2')

    # Proof sheet: month groups, older months on demand, filters, URL sync, search, empty states.
    page.goto(BASE + 'dashboard-articles.html', wait_until='networkidle')
    expect(page.locator('.month h2')).to_have_text(['November 2026', 'October 2026', 'September 2026'])
    expect(page.locator('.proof')).to_have_count(9)
    expect(page.locator('[data-id="a2"] .no-cover')).to_contain_text('No cover photo yet')
    page.locator('#older').click()
    expect(page.locator('.month h2')).to_have_count(4)
    expect(page.locator('.month h2').nth(3)).to_be_focused()
    page.locator('.chip[data-s="draft"]').click()
    expect(page.locator('.chip[data-s="draft"]')).to_have_attribute('aria-pressed', 'true')
    expect(page.locator('.proof')).to_have_count(2)
    assert 'status=draft' in page.url
    page.reload(wait_until='networkidle')
    expect(page.locator('.proof')).to_have_count(2)
    page.locator('#group').select_option('event')
    expect(page.locator('.month h2')).to_have_text(['December 2026'])
    page.locator('#q').fill('zzz')
    expect(page.locator('[data-component="EmptyState"]')).to_contain_text('Nothing matches')
    page.get_by_role('button', name='Clear filters').click()
    expect(page.locator('.proof')).to_have_count(9)
    expect(page.locator('#q')).to_be_focused()
    # The card's link opens that article in the editor.
    page.locator('[data-id="a1"] .stretch').click()
    page.wait_for_url('**/dashboard-editor.html?id=a1')
    expect(page.locator('#title')).to_have_value('What we learned running a bootcamp for 120 students')
    page.goto(BASE + 'dashboard-articles.html', wait_until='networkidle')
    # Row menu: keyboard, Escape returns focus.
    more = page.locator('[data-more="a5"]')
    more.click()
    expect(page.get_by_role('menuitem').first).to_be_focused()
    page.keyboard.press('ArrowDown')
    expect(page.get_by_role('menuitem', name='View on the site')).to_be_focused()
    page.keyboard.press('Escape')
    expect(more).to_be_focused()
    # Archive asks first; Cancel changes nothing, Archive shows an undo toast.
    more.click()
    page.get_by_role('menuitem', name='Archive').click()
    expect(page.locator('#confirm')).to_be_visible()
    expect(page.locator('#confirm-cancel')).to_be_focused()
    page.screenshot(path=OUT / 'articles-confirm-desktop.png')
    page.keyboard.press('Escape')
    expect(page.locator('#confirm')).not_to_be_visible()
    more.click()
    page.get_by_role('menuitem', name='Archive').click()
    page.locator('#confirm-ok').click()
    expect(page.locator('#toast-text')).to_contain_text('is archived')
    expect(page.locator('.chip[data-s="archived"] .count')).to_have_text('2')
    page.get_by_role('button', name='Undo').click()
    expect(page.locator('.chip[data-s="archived"] .count')).to_have_text('1')
    for q in ('empty=1', 'state=loading', 'state=error', 'role=admin'):
        page.goto(BASE + f'dashboard-articles.html?{q}', wait_until='networkidle')
        no_overflow(page, 1440)
    expect(page.locator('#page-heading')).to_have_text('Articles')
    page.close()

    # Editor: Paolo's draft opens with two requests left; fixing them makes it ready; sending moves it to In review.
    page = browser.new_page(viewport={'width': 1440, 'height': 900})
    page.on('pageerror', lambda e: errors.append(str(e)))
    page.on('console', lambda m: errors.append(m.text) if m.type == 'error' else None)
    page.goto(BASE + 'dashboard-editor.html?id=a2', wait_until='networkidle')
    expect(page.locator('#left')).to_have_text('2 left')
    expect(page.locator('#conv-h')).to_have_text('Paolo Cruz asked for changes')
    page.locator('#send').click()
    expect(page.locator('#toast-text')).to_contain_text('2 things left')
    page.locator('[data-go="venue"]').click()
    expect(page.locator('#venue')).to_be_focused()
    page.locator('#venue').fill('Computer Lab 3, Main building')
    expect(page.locator('#saved')).to_have_text('Saved at 10:06 AM')
    page.locator('#body').click(); page.keyboard.press('Control+End')
    page.keyboard.type(' Sign-ups close on November 28.')
    expect(page.locator('#left')).to_have_text('Ready')
    expect(page.locator('#reqs .fixed')).to_have_count(2)
    page.locator('#send').click()
    expect(page.locator('#bar-badge .badge')).to_have_attribute('data-status', 'in_review')
    expect(page.locator('#send')).to_be_disabled()
    expect(page.locator('#saved')).to_contain_text('Sent to Paolo Cruz')
    no_overflow(page, 1440)
    # A published article: new-draft notice, reviewer select, no Paolo requests.
    page.goto(BASE + 'dashboard-editor.html?id=a5', wait_until='networkidle')
    expect(page.locator('.notice')).to_contain_text('published version stays on the site')
    expect(page.locator('#rev')).to_have_value('Paolo Cruz')
    expect(page.locator('[data-asked]')).to_have_count(0)
    # A new article: blank, three required items, events block hidden for News.
    page.goto(BASE + 'dashboard-editor.html?id=new', wait_until='networkidle')
    expect(page.locator('.editbar h1')).to_have_text('New article')
    expect(page.locator('#left')).to_have_text('3 left')
    expect(page.locator('.event-block')).to_be_hidden()
    page.locator('#type').select_option('Event')
    expect(page.locator('.event-block')).to_be_visible()

    # Reviews (the review inbox): the reviewer nav opens it; the second read shows the fixes and highlights.
    page.goto(BASE + 'dashboard.html?role=reviewer', wait_until='networkidle')
    page.locator('.desk-sidebar .nav-item', has_text='Reviews').click()
    page.wait_for_url('**/dashboard-reviews.html?role=reviewer')
    expect(page.locator('.desk-sidebar [aria-current="page"]')).to_contain_text('Reviews')
    expect(page.locator('#tab-waiting')).to_have_text('Waiting 4')
    expect(page.locator('#items [data-id]')).to_have_count(4)
    expect(page.locator('#pane-h')).to_have_text('Code camp for senior high students')
    expect(page.locator('#fx-h')).to_have_text('Lea fixed your 2 requests')
    expect(page.locator('#pane ins')).to_have_count(2)
    # Asking for changes needs at least one request.
    page.locator('[data-ask]').click()
    expect(page.locator('#ask-in-r1')).to_be_focused()
    page.locator('[data-sendback]').click()
    expect(page.locator('#toast-text')).to_contain_text('Add at least one request')
    page.locator('#ask-in-r1').fill('Add a photo credit'); page.keyboard.press('Enter')
    expect(page.locator('.asks li')).to_have_count(1)
    page.locator('[data-sendback]').click()
    expect(page.locator('#decide [role="status"]')).to_have_text('You sent it back to Lea.')
    expect(page.locator('#tab-waiting')).to_have_text('Waiting 3')
    expect(page.locator('.desk-sidebar .nav-item[aria-current] .nav-count')).to_have_text('3')
    page.locator('[data-next]').click()
    expect(page.locator('#pane-h')).to_be_focused()
    expect(page.locator('#pane-h')).to_have_text('Hackathon rules and team sign-up')
    # Stepping down asks first; Cancel keeps the review.
    page.locator('[data-stepdown]').click()
    expect(page.locator('#confirm')).to_be_visible()
    expect(page.locator('#confirm-cancel')).to_be_focused()
    page.locator('#confirm-cancel').click()
    expect(page.locator('[data-approve]')).to_be_visible()
    page.locator('[data-approve]').click()
    expect(page.locator('#decide [role="status"]')).to_have_text('You approved this.')
    # An invitation: accept reveals the decision; decline can be undone.
    page.locator('[data-id="r3"]').click()
    expect(page.locator('[data-accept]')).to_be_visible()
    page.locator('[data-accept]').click()
    expect(page.locator('[data-approve]')).to_be_visible()
    page.locator('[data-id="r4"]').click()
    page.locator('[data-decline]').click()
    expect(page.locator('[data-id="r4"]')).to_have_count(0)
    page.locator('#toast-undo').click()
    expect(page.locator('[data-id="r4"]')).to_have_count(1)
    page.locator('#tab-decided').click()
    expect(page.locator('#items [data-component="DecidedRow"]')).to_have_count(3)
    no_overflow(page, 1440)
    page.screenshot(path=OUT / 'reviews-desktop.png')
    # Nothing waiting.
    page.goto(BASE + 'dashboard-reviews.html?empty=1', wait_until='networkidle')
    expect(page.locator('#items')).to_contain_text('Nothing is waiting for you.')
    expect(page.locator('#pane-h')).to_have_text('You’re all caught up')
    page.close()

    # Reviews on a phone: list first, then the review as its own screen with a way back.
    page = browser.new_page(viewport={'width': 390, 'height': 844})
    page.on('pageerror', lambda e: errors.append(str(e)))
    page.goto(BASE + 'dashboard-reviews.html', wait_until='networkidle')
    expect(page.locator('#pane')).to_be_hidden()
    page.locator('[data-id="r2"]').click()
    expect(page.locator('#items')).to_be_hidden()
    expect(page.locator('#pane-h')).to_have_text('Hackathon rules and team sign-up')
    no_overflow(page, 390)
    page.screenshot(path=OUT / 'reviews-open-mobile.png', full_page=True)
    page.locator('[data-back]').click()
    expect(page.locator('[data-id="r2"]')).to_be_focused()
    page.close()

    # Mobile: drawer opens, traps focus, closes on Escape and returns focus.
    page = browser.new_page(viewport={'width': 390, 'height': 844})
    page.on('pageerror', lambda e: errors.append(str(e)))
    for f in ('dashboard.html', 'dashboard-articles.html', 'dashboard-reviews.html'):
        page.goto(BASE + f, wait_until='networkidle')
        no_overflow(page, 390)
        expect(page.locator('.desk-sidebar')).to_be_hidden()
        page.locator('#menu-open').click()
        expect(page.locator('#menu-open')).to_have_attribute('aria-expanded', 'true')
        expect(page.locator('#drawer [aria-current="page"]')).to_be_focused()
        page.wait_for_timeout(300)
        page.screenshot(path=OUT / f'{f[:-5]}-drawer-mobile.png')
        for _ in range(12):
            page.keyboard.press('Tab')
        assert page.evaluate("document.getElementById('drawer').contains(document.activeElement)"), 'focus left the drawer'
        page.keyboard.press('Escape')
        expect(page.locator('#menu-open')).to_be_focused()
        expect(page.locator('#menu-open')).to_have_attribute('aria-expanded', 'false')
    page.close()

    for width in (320, 768, 1024):
        page = browser.new_page(viewport={'width': width, 'height': 800}, reduced_motion='reduce')
        for f in ('dashboard.html', 'dashboard-articles.html', 'dashboard.html?role=admin', 'dashboard.html?role=reviewer', 'dashboard-editor.html', 'dashboard-editor.html?id=new', 'dashboard-reviews.html', 'dashboard-reviews.html?id=r1', 'dashboard-reviews.html?id=r3'):
            page.goto(BASE + f, wait_until='networkidle')
            no_overflow(page, width)
        page.close()
    browser.close()

assert not errors, errors
print('Desk checks passed; screenshots in', OUT)
