"""
End-to-End browser verification and screenshot capture script for WardFlow.
Validates desktop, tablet, and mobile workflows against DScribe criteria.
"""

import os
import sys
import time
from playwright.sync_api import sync_playwright

os.environ["PLAYWRIGHT_BROWSERS_PATH"] = "D:\\DevTools\\WardFlow\\playwright-browsers"

SCREENSHOTS_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "screenshots"))
os.makedirs(SCREENSHOTS_DIR, exist_ok=True)

BASE_URL = "http://127.0.0.1:5173"


def run_audit():
    print(f"Connecting to WardFlow at {BASE_URL}...")
    with sync_playwright() as p:
        # Launch installed Chrome directly
        browser = p.chromium.launch(
            headless=True,
            channel="chrome" if os.path.exists("C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe") else None
        )

        # 1. Desktop View (1440x900)
        context_desktop = browser.new_context(viewport={"width": 1440, "height": 900})
        page = context_desktop.new_page()
        page.goto(BASE_URL, wait_until="networkidle")
        page.wait_for_selector(".patient-table")
        time.sleep(1)

        desktop_shot = os.path.join(SCREENSHOTS_DIR, "01_desktop_directory.png")
        page.screenshot(path=desktop_shot, full_page=False)
        print(f"[PASS] Desktop directory screenshot: {desktop_shot}")

        # 2. Admission Form Modal
        page.click("#btn-admit-patient")
        page.wait_for_selector(".modal-dialog")
        time.sleep(0.5)

        form_shot = os.path.join(SCREENSHOTS_DIR, "04_admission_form.png")
        page.screenshot(path=form_shot)
        print(f"[PASS] Admission form modal screenshot: {form_shot}")

        # 3. Form Validation Triggering
        # Click submit with empty form
        page.click("#btn-submit-patient-form")
        page.wait_for_selector(".field-error-msg")
        time.sleep(0.5)

        val_shot = os.path.join(SCREENSHOTS_DIR, "05_validation_errors.png")
        page.screenshot(path=val_shot)
        print(f"[PASS] Validation error state screenshot: {val_shot}")

        # 4. Fill Valid Patient and Admit
        page.fill("#input-name", "Deepak Mehta")
        page.fill("#input-age", "38")
        page.select_option("#select-gender", "Male")
        page.select_option("#select-department", "General Medicine")
        page.select_option("#select-doctor", "Dr. Rajesh Sharma")
        page.select_option("#select-ward", "General Ward")
        page.select_option("#select-status", "Admitted")
        time.sleep(0.3)
        page.click("#btn-submit-patient-form")

        # Wait for modal to close and row to appear
        page.wait_for_selector(".modal-backdrop", state="detached")
        page.wait_for_selector("text=Deepak Mehta")
        print("[PASS] Successfully admitted 'Deepak Mehta'")
        time.sleep(0.5)

        # 5. Search and Filter Results
        search_input = page.locator(".search-input")
        search_input.fill("Deepak")
        time.sleep(1)

        search_shot = os.path.join(SCREENSHOTS_DIR, "06_search_and_filter.png")
        page.screenshot(path=search_shot)
        print(f"[PASS] Search & filter results screenshot: {search_shot}")

        # 6. Discharge Confirmation Workflow
        # Click discharge button for the filtered record
        discharge_btn = page.locator(".action-btn-discharge").first
        discharge_btn.click()
        page.wait_for_selector(".modal-confirm-dialog")
        time.sleep(0.5)

        discharge_shot = os.path.join(SCREENSHOTS_DIR, "07_discharge_confirmation.png")
        page.screenshot(path=discharge_shot)
        print(f"[PASS] Discharge confirmation dialog screenshot: {discharge_shot}")

        # Confirm discharge
        page.click("#btn-confirm-action")
        page.wait_for_selector(".modal-confirm-dialog", state="detached")
        time.sleep(1)
        print("[PASS] Successfully discharged 'Deepak Mehta'")

        # Clear search
        page.click(".clear-search-btn")
        time.sleep(0.5)

        context_desktop.close()

        # 7. Tablet View (768x1024)
        context_tablet = browser.new_context(viewport={"width": 768, "height": 1024})
        page_tablet = context_tablet.new_page()
        page_tablet.goto(BASE_URL, wait_until="networkidle")
        page_tablet.wait_for_selector(".workspace-card")
        time.sleep(1)

        tablet_shot = os.path.join(SCREENSHOTS_DIR, "02_tablet_view.png")
        page_tablet.screenshot(path=tablet_shot, full_page=False)
        print(f"[PASS] Tablet layout screenshot: {tablet_shot}")
        context_tablet.close()

        # 8. Mobile View (390x844 - iPhone 12/13/14)
        context_mobile = browser.new_context(viewport={"width": 390, "height": 844})
        page_mobile = context_mobile.new_page()
        page_mobile.goto(BASE_URL, wait_until="networkidle")
        page_mobile.wait_for_selector(".mobile-cards-list")
        time.sleep(1)

        mobile_shot = os.path.join(SCREENSHOTS_DIR, "03_mobile_cards.png")
        page_mobile.screenshot(path=mobile_shot, full_page=False)
        print(f"[PASS] Mobile cards view screenshot: {mobile_shot}")
        context_mobile.close()

        browser.close()
        print("\nAll browser audits and screenshots completed successfully!")


if __name__ == "__main__":
    run_audit()
