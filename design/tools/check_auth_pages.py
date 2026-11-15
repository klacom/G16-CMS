"""Verify reset-password.html and accept-invite.html and capture their states.

Run with the design server on port 4321: python -I design/tools/check_auth_pages.py
"""
from pathlib import Path
from playwright.sync_api import sync_playwright, expect

BASE = 'http://127.0.0.1:4321/design/prototypes/'
OUT = Path(__file__).parent / 'out' / 'auth-states'
OUT.mkdir(parents=True, exist_ok=True)
errors = []


def no_overflow(page, width):
    assert page.evaluate('document.documentElement.scrollWidth') == width, f'overflow at {width}'


with sync_playwright() as p:
    browser = p.chromium.launch()
    for name, width, height in [('desktop', 1440, 900), ('mobile', 390, 844)]:
        page = browser.new_page(viewport={'width': width, 'height': height})
        page.on('pageerror', lambda e: errors.append(str(e)))
        page.on('console', lambda m: errors.append(m.text) if m.type == 'error' else None)

        # ---- Reset password ----
        page.goto(BASE + 'reset-password.html', wait_until='networkidle')
        no_overflow(page, width)
        expect(page.locator('h1:visible')).to_have_count(1)
        expect(page.locator('#password')).to_have_attribute('aria-describedby', 'password-rules')
        expect(page.locator('[data-rule="length"]')).to_have_attribute('data-met', 'false')
        # Empty submit: summary lists both fields, focus lands on it, rules are not red beforehand.
        page.locator('#submit').click()
        expect(page.locator('#form-error-summary')).to_be_focused()
        expect(page.locator('#form-error-summary li')).to_have_count(2)
        expect(page.locator('#password')).to_have_attribute('aria-describedby', 'password-rules password-err')
        page.screenshot(path=OUT / f'reset-errors-{name}.png', full_page=True)
        # Summary link moves focus to its field.
        page.locator('#form-error-summary a').first.click()
        expect(page.locator('#password')).to_be_focused()
        # Rules tick as they are met; the email name is refused.
        page.locator('#password').fill('ana.reyes-2026!')
        expect(page.locator('[data-rule="length"]')).to_have_attribute('data-met', 'true')
        expect(page.locator('[data-rule="email"]')).to_have_attribute('data-met', 'false')
        page.locator('#password').fill('lantern-night-2026')
        expect(page.locator('[data-rule="email"]')).to_have_attribute('data-met', 'true')
        expect(page.locator('#password')).to_have_attribute('aria-invalid', 'false')
        # Mismatch reported after leaving the second field.
        page.locator('#confirm').fill('lantern-night')
        page.locator('#confirm').blur()
        expect(page.locator('#confirm-err')).to_contain_text("don't match")
        page.locator('#confirm').fill('lantern-night-2026')
        expect(page.locator('#confirm')).to_have_attribute('aria-invalid', 'false')
        # Show / hide
        toggle = page.locator('[data-toggles="password"]')
        toggle.click()
        expect(page.locator('#password')).to_have_attribute('type', 'text')
        expect(toggle).to_have_attribute('aria-label', 'Hide password')
        toggle.click()
        # Save: busy, then the done panel takes focus.
        page.locator('#submit').click()
        expect(page.locator('#submit')).to_contain_text('Saving…')
        expect(page.locator('#done')).to_be_focused()
        expect(page.locator('h1:visible')).to_have_text('Password saved')
        page.screenshot(path=OUT / f'reset-done-{name}.png', full_page=True)
        for state, heading in [('expired', 'This reset link has expired'), ('used', 'This reset link has already been used')]:
            page.goto(BASE + f'reset-password.html?state={state}', wait_until='networkidle')
            expect(page.locator('h1:visible')).to_have_text(heading)
            no_overflow(page, width)
        page.get_by_role('link', name='Send a new link').click()
        expect(page.locator('#reset-heading')).to_be_focused()

        # ---- Accept invite ----
        page.goto(BASE + 'accept-invite.html', wait_until='networkidle')
        no_overflow(page, width)
        expect(page.locator('#role-name')).to_have_text('Writer')
        page.locator('#submit').click()
        expect(page.locator('#form-error-summary li')).to_have_count(3)
        page.locator('#name').fill('Lea Mendoza')
        expect(page.locator('#name')).to_have_attribute('aria-invalid', 'false')
        page.locator('#password').fill('lmendoza-2026-desk')
        expect(page.locator('[data-rule="email"]')).to_have_attribute('data-met', 'false')
        page.locator('#password').fill('blue-lantern-desk')
        page.locator('#confirm').fill('blue-lantern-desk')
        page.locator('#submit').click()
        expect(page.locator('#done')).to_be_focused()
        expect(page.locator('#done-link')).to_have_attribute('href', 'dashboard.html?role=writer')
        page.screenshot(path=OUT / f'invite-done-{name}.png', full_page=True)
        page.goto(BASE + 'accept-invite.html?role=reviewer', wait_until='networkidle')
        expect(page.locator('#role-name')).to_have_text('Reviewer')
        for state, heading in [('expired', 'This invite has expired'), ('withdrawn', 'This invite was withdrawn'), ('existing', 'You already have an ICG account')]:
            page.goto(BASE + f'accept-invite.html?state={state}', wait_until='networkidle')
            expect(page.locator('h1:visible')).to_have_text(heading)
            page.screenshot(path=OUT / f'invite-{state}-{name}.png', full_page=True)
        page.close()

    # Extra widths: no horizontal overflow; reduced motion has no running spinner.
    for width in (320, 768, 1024):
        page = browser.new_page(viewport={'width': width, 'height': 800}, reduced_motion='reduce')
        for f in ('reset-password.html', 'accept-invite.html'):
            page.goto(BASE + f, wait_until='networkidle')
            no_overflow(page, width)
        page.close()
    browser.close()

assert not errors, errors
print('Auth pages checks passed; screenshots in', OUT)
