"""Verify the Campus Desk login concept and capture its interaction states.

Run with the design server on port 4321: python -I design/tools/check_login_identity.py
"""
from pathlib import Path
from playwright.sync_api import sync_playwright, expect

BASE = 'http://127.0.0.1:4321/design/prototypes/'
OUT = Path(__file__).parent / 'out' / 'login-identity-states'
OUT.mkdir(parents=True, exist_ok=True)
errors = []

with sync_playwright() as p:
    browser = p.chromium.launch()
    for name, width, height in [('desktop', 1440, 900), ('mobile', 390, 844)]:
        page = browser.new_page(viewport={'width': width, 'height': height})
        page.on('pageerror', lambda e: errors.append(str(e)))
        page.on('console', lambda m: errors.append(m.text) if m.type == 'error' else None)
        page.goto(BASE + 'login-identity.html', wait_until='networkidle')
        page.evaluate('document.fonts.ready')
        assert page.evaluate('document.documentElement.scrollWidth') == width
        expect(page.locator('#email')).to_have_value('')
        expect(page.locator('#remember')).not_to_be_checked()
        if name == 'mobile':
            assert page.locator('[data-component="LoginBrand"]').bounding_box()['height'] == 110
            assert page.locator('#submit').bounding_box()['y'] < height

        page.locator('#submit').click()
        expect(page.locator('#email')).to_be_focused()
        expect(page.locator('#email')).to_have_attribute('aria-describedby', 'email-hint email-err')
        page.locator('#email').fill('writer@plpasig.edu.ph')
        expect(page.locator('#email')).to_have_attribute('aria-describedby', 'email-hint')
        page.locator('#password').fill('wrong')
        page.get_by_role('button', name='Show password').click()
        expect(page.locator('#password')).to_have_attribute('type', 'text')
        page.get_by_role('button', name='Hide password').click()
        page.locator('#submit').click()
        expect(page.locator('#submit')).to_be_disabled()
        page.screenshot(path=OUT / f'login-loading-{name}.png', full_page=True)
        expect(page.locator('#error-title')).to_have_text("That email and password don't match")
        expect(page.locator('#password')).to_have_value('')
        expect(page.locator('#error-summary')).to_be_focused()
        page.screenshot(path=OUT / f'login-error-{name}.png', full_page=True)

        page.locator('#forgot').click()
        expect(page.locator('#reset-heading')).to_be_focused()
        expect(page.locator('#reset-email')).to_have_value('writer@plpasig.edu.ph')
        page.screenshot(path=OUT / f'login-reset-{name}.png', full_page=True)
        page.get_by_role('button', name='Send reset link').click()
        expect(page.locator('#reset-done')).to_be_focused()
        expect(page.locator('#reset-done')).to_contain_text('If writer@plpasig.edu.ph has an ICG account')
        page.screenshot(path=OUT / f'login-reset-sent-{name}.png', full_page=True)
        page.locator('#back-login').click()
        page.locator('#forgot').click()
        expect(page.locator('#reset-form')).to_be_visible()
        page.locator('#back-login').click()

        page.locator('#password').fill('demo-password')
        page.locator('#submit').click()
        expect(page.locator('#error-title')).to_have_text('Logged in')
        page.screenshot(path=OUT / f'login-success-{name}.png', full_page=True)
        page.wait_for_url('**/dashboard.html')
        page.goto(BASE + 'login-identity.html', wait_until='networkidle')
        page.locator('#email').fill('writer@plpasig.edu.ph')
        page.locator('#password').fill('wrong')
        page.locator('#submit').click()
        expect(page.locator('#error-title')).to_have_text("That email and password don't match")
        expect(page.locator('#error-summary')).to_have_attribute('role', 'alert')

        page.get_by_role('link', name='ask the desk').click()
        expect(page.get_by_role('radio', name='Request an account')).to_be_checked()
        expect(page.locator('#event-fields')).not_to_be_visible()
        page.get_by_role('radio', name='Request an account').focus()
        page.keyboard.press('ArrowRight')
        expect(page.get_by_role('radio', name='Submit an event')).to_be_checked()
        page.keyboard.press('ArrowLeft')
        expect(page.get_by_role('radio', name='Request an account')).to_be_checked()
        assert page.evaluate('document.documentElement.scrollWidth') == width
        page.screenshot(path=OUT / f'contact-account-{name}.png', full_page=True)
        for field, value in {'first': 'Juan', 'last': 'Dela Cruz', 'email': 'writer@plpasig.edu.ph', 'subject': 'ICG account request', 'message': 'Please invite me to the ICG desk so I can contribute campus news.'}.items():
            page.locator('#' + field).fill(value)
        page.locator('#send').click()
        expect(page.locator('#success')).to_be_visible()
        expect(page.locator('#success')).to_be_focused()
        page.screenshot(path=OUT / f'contact-account-sent-{name}.png', full_page=True)
        page.locator('#again').click()
        expect(page.locator('#first')).to_be_focused()
        print(name, 'login, reset, account request: passed')
        page.close()

    page = browser.new_page(reduced_motion='reduce')
    page.goto(BASE + 'login-identity.html', wait_until='networkidle')
    expect(page.locator('.desk-scene')).to_have_attribute('aria-hidden', 'true')
    assert page.evaluate('document.getAnimations().length') == 0
    for target in ['a.desktop-back', '#email', '#forgot', '#password', '#toggle-pw', '#remember', '#submit', 'a[href="contact.html?topic=account"]']:
        page.keyboard.press('Tab')
        expect(page.locator(target)).to_be_focused()
    for width in [320, 390, 768, 1024, 1440]:
        page.set_viewport_size({'width': width, 'height': 900})
        assert page.evaluate('document.documentElement.scrollWidth') == width
        assert page.locator('a.brand-back').count() == 2
        assert sum(page.locator('a.brand-back').nth(i).is_visible() for i in range(2)) == 1
        assert page.locator('#email').bounding_box()['width'] >= min(358, width - 32)
    page.goto(BASE + 'contact.html?topic=unknown', wait_until='networkidle')
    expect(page.get_by_role('radio', name='A question', exact=True)).to_be_checked()
    browser.close()

assert not errors, errors
print('Reduced motion, intermediate widths, unknown topic fallback: passed; console errors: []')
