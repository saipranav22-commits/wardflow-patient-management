import os
import sys
import time
from playwright.sync_api import sync_playwright

LIVE_FRONTEND_URL = "https://wardflow-patient-management.onrender.com"
SCREENSHOTS_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "screenshots", "live"))
os.makedirs(SCREENSHOTS_DIR, exist_ok=True)

def verify_incognito():
    print("========================================================")
    print("Testing Fresh Incognito Context on Live Frontend")
    print(f"URL: {LIVE_FRONTEND_URL}")
    print("========================================================\n")

    console_logs = []
    network_responses = []

    with sync_playwright() as p:
        browser = p.chromium.launch(
            headless=True,
            channel="chrome" if os.path.exists("C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe") else None
        )
        # Fresh incognito context
        context = browser.new_context(viewport={"width": 1440, "height": 900})
        page = context.new_page()

        page.on("console", lambda msg: console_logs.append(f"[{msg.type}] {msg.text}"))
        page.on("response", lambda res: network_responses.append(f"{res.status} {res.request.method} {res.url}"))

        print("1. Navigating to live frontend in fresh incognito context...")
        t0 = time.time()
        page.goto(LIVE_FRONTEND_URL, wait_until="networkidle", timeout=60000)
        load_time = time.time() - t0
        print(f"   [PASS] Page loaded in {load_time:.2f}s.")

        # Settle
        time.sleep(2)

        # Desktop screenshot
        desktop_shot = os.path.join(SCREENSHOTS_DIR, "live_final_incognito_desktop.png")
        page.screenshot(path=desktop_shot)
        print(f"   [PASS] Desktop screenshot: {desktop_shot}")

        # Check UI values
        status_text = page.locator(".header-actions div").first.inner_text().strip()
        stat_cards = page.locator(".stat-card").all_inner_texts()
        table_rows = page.locator("tbody tr").count()
        warning_banner_visible = page.locator("[role='alert']").count() > 0

        print(f"\nLive UI State:")
        print(f"  • Status Pill: '{status_text}'")
        print(f"  • Metric Cards: {stat_cards}")
        print(f"  • Patient Rows Rendered: {table_rows}")
        print(f"  • Warning Banner Visible: {warning_banner_visible}")

        # Mobile screenshot
        page.set_viewport_size({"width": 390, "height": 844})
        time.sleep(1)
        mobile_shot = os.path.join(SCREENSHOTS_DIR, "live_final_incognito_mobile.png")
        page.screenshot(path=mobile_shot)
        print(f"   [PASS] Mobile screenshot: {mobile_shot}")

        context.close()
        browser.close()

    print("\nNetwork Log Summary:")
    for r in network_responses:
        if "api/" in r:
            print(f"  {r}")

    print("\nConsole Errors:")
    err_count = 0
    for c in console_logs:
        if "[error]" in c:
            print(f"  {c}")
            err_count += 1
    if err_count == 0:
        print("  Zero console errors detected.")

    print("\n========================================================")
    assert table_rows == 15, f"Expected 15 patient rows, found {table_rows}"
    assert "Online" in status_text, f"Expected API Online, found {status_text}"
    print("ALL INCOGNITO CHECKS PASSED: 15 RECORDS FULLY LOADED")
    print("========================================================\n")

if __name__ == "__main__":
    verify_incognito()
