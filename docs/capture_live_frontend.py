"""
Live Production Frontend Browser Audit for WardFlow on Render.
Directly navigates to https://wardflow-patient-management.onrender.com
Captures live screenshots and audits console logs and network failures.
"""

import os
import sys
import time
from playwright.sync_api import sync_playwright

LIVE_FRONTEND_URL = "https://wardflow-patient-management.onrender.com"
SCREENSHOTS_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "screenshots", "live"))
os.makedirs(SCREENSHOTS_DIR, exist_ok=True)


def run_live_browser_audit():
    print(f"\n========================================================")
    print(f"Auditing Live Frontend: {LIVE_FRONTEND_URL}")
    print(f"========================================================\n")

    console_errors = []
    failed_requests = []

    with sync_playwright() as p:
        browser = p.chromium.launch(
            headless=True,
            channel="chrome" if os.path.exists("C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe") else None
        )

        context = browser.new_context(viewport={"width": 1440, "height": 900})
        page = context.new_page()

        # Listen for console errors
        page.on("console", lambda msg: console_errors.append(msg.text) if msg.type == "error" else None)
        # Listen for failed network requests
        page.on("requestfailed", lambda req: failed_requests.append(f"{req.method} {req.url}: {req.failure}"))

        print(f"Navigating to {LIVE_FRONTEND_URL}...")
        page.goto(LIVE_FRONTEND_URL, wait_until="networkidle", timeout=60000)
        time.sleep(2)

        # 1. Capture live desktop screenshot
        desktop_shot = os.path.join(SCREENSHOTS_DIR, "live_01_desktop.png")
        page.screenshot(path=desktop_shot)
        print(f"[PASS] 1. Live Desktop Screenshot Captured: {desktop_shot}")

        # Check for visible records or cold start state
        has_table = page.locator(".patient-table").count() > 0
        has_cards = page.locator(".patient-card").count() > 0
        has_warning = page.locator("[role='alert']").count() > 0
        print(f"UI Elements: Table={has_table}, Cards={has_cards}, WarningBanner={has_warning}")

        # 2. Tablet View (768x1024)
        page.set_viewport_size({"width": 768, "height": 1024})
        time.sleep(1)
        tablet_shot = os.path.join(SCREENSHOTS_DIR, "live_02_tablet.png")
        page.screenshot(path=tablet_shot)
        print(f"[PASS] 2. Live Tablet Screenshot Captured: {tablet_shot}")

        # 3. Mobile View (390x844)
        page.set_viewport_size({"width": 390, "height": 844})
        time.sleep(1)
        mobile_shot = os.path.join(SCREENSHOTS_DIR, "live_03_mobile.png")
        page.screenshot(path=mobile_shot)
        print(f"[PASS] 3. Live Mobile Screenshot Captured: {mobile_shot}")

        context.close()
        browser.close()

    print(f"\nAudit Summary:")
    print(f"Console Errors: {len(console_errors)}")
    for err in console_errors:
        print(f"  [ERROR] {err}")
    print(f"Failed Requests: {len(failed_requests)}")
    for freq in failed_requests:
        print(f"  [REQ-FAIL] {freq}")

    print(f"\n========================================================")
    print(f"LIVE BROWSER AUDIT COMPLETED")
    print(f"========================================================\n")


if __name__ == "__main__":
    run_live_browser_audit()
