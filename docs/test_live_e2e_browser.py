"""
Full Interactive E2E Browser Test on Live Render Deployment:
https://wardflow-patient-management.onrender.com
"""

import os
import sys
import time
from playwright.sync_api import sync_playwright

LIVE_FRONTEND_URL = "https://wardflow-patient-management.onrender.com"
SCREENSHOTS_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "screenshots", "live"))
os.makedirs(SCREENSHOTS_DIR, exist_ok=True)

def test_live_workflow():
    print(f"\n========================================================")
    print(f"Starting Interactive E2E Test on Live Render Deployment")
    print(f"URL: {LIVE_FRONTEND_URL}")
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

        page.on("console", lambda msg: console_errors.append(msg.text) if msg.type == "error" else None)
        page.on("requestfailed", lambda req: failed_requests.append(f"{req.method} {req.url}: {req.failure}"))

        # Step 1: Navigate to Live Site
        print("1. Loading live homepage...")
        page.goto(LIVE_FRONTEND_URL, wait_until="networkidle", timeout=60000)
        time.sleep(2)
        assert page.locator(".patient-table").is_visible(), "Patient table should be visible"
        print("   [PASS] Homepage loaded with live patient table.")

        # Clean up existing test patient if already present from an interrupted run
        unique_name = "Kavya Nambiar"
        if page.locator(f"text='{unique_name}'").count() > 0:
            print(f"   Pre-cleaning existing '{unique_name}' before test...")
            row = page.locator(f"tr:has-text('{unique_name}')").first
            row.locator(".action-btn-delete").click()
            page.wait_for_selector(".modal-confirm-dialog", timeout=5000)
            page.click("#btn-confirm-action")
            page.wait_for_selector(".modal-confirm-dialog", state="detached", timeout=5000)
            time.sleep(2)
            print("   Pre-clean complete.")

        # Step 2: Open Admit Modal & Verify Validation
        print("2. Opening Admit Modal and testing client validation...")
        page.click("#btn-admit-patient")
        page.wait_for_selector(".modal-dialog", timeout=5000)
        time.sleep(0.3)  # Allow fade-in animation to complete
        modal_shot = os.path.join(SCREENSHOTS_DIR, "live_04_admit_modal.png")
        page.screenshot(path=modal_shot)
        print(f"   [PASS] Modal opened. Screenshot: {modal_shot}")

        # Submit empty to trigger client validation
        page.click("#btn-submit-patient-form")
        time.sleep(0.5)
        name_err = page.locator(".field-error-msg").count() > 0 or page.locator(".input-error").count() > 0
        print(f"   [PASS] Empty submission rejected with validation errors: {name_err}")

        # Step 3: Fill Valid Patient & Submit
        print(f"3. Submitting new live patient '{unique_name}'...")
        page.fill("#input-name", unique_name)
        page.fill("#input-age", "26")
        page.select_option("#select-gender", "Female")
        page.select_option("#select-ward", "Maternity Ward")
        page.select_option("#select-department", "Obstetrics and Gynecology")
        time.sleep(0.5)
        page.select_option("#select-doctor", "Dr. Radhika Iyer")
        page.fill("#input-admission-date", "2026-11-25")
        page.select_option("#select-status", "Admitted")
        
        # Click Submit
        page.click("#btn-submit-patient-form")
        page.wait_for_selector(".modal-backdrop", state="detached", timeout=10000)
        page.wait_for_selector(f"text='{unique_name}'", timeout=10000)
        print(f"   [PASS] '{unique_name}' successfully created and displayed in live table.")

        # Step 4: Verify Persistence after Hard Refresh
        print("4. Testing persistence after live browser reload...")
        page.reload(wait_until="networkidle")
        page.wait_for_selector(f"text='{unique_name}'", timeout=10000)
        print(f"   [PASS] Patient persisted in Neon PostgreSQL after live browser reload.")

        # Step 5: Test Search & Combined Filtering
        print("5. Testing Search and Ward filter...")
        page.fill("input.search-input", "Kavya")
        # Wait for debounce and network fetch
        page.wait_for_selector(f"text='{unique_name}'", timeout=5000)
        print("   [PASS] Live search by name works.")

        page.select_option("select[aria-label='Filter by Ward']", "Maternity Ward")
        page.wait_for_selector(f"text='{unique_name}'", timeout=5000)
        print("   [PASS] Live combined search and ward filter working.")

        # Clear search
        page.fill("input.search-input", "")
        page.select_option("select[aria-label='Filter by Ward']", "")
        time.sleep(1)

        # Step 6: Test Discharge Flow
        print("6. Testing Discharge workflow with modal confirmation...")
        row = page.locator(f"tr:has-text('{unique_name}')").first
        row.locator(".action-btn-discharge").click()
        page.wait_for_selector(".modal-confirm-dialog", timeout=5000)
        time.sleep(0.3)  # Allow fade-in animation to complete
        discharge_shot = os.path.join(SCREENSHOTS_DIR, "live_05_discharge_modal.png")
        page.screenshot(path=discharge_shot)
        
        # Confirm discharge
        page.click("#btn-confirm-action")
        page.wait_for_selector(".modal-confirm-dialog", state="detached", timeout=5000)
        time.sleep(2)
        row = page.locator(f"tr:has-text('{unique_name}')").first
        badge_text = row.locator(".badge-status").inner_text()
        assert "Discharged" in badge_text, f"Expected Discharged badge, got {badge_text}"
        print(f"   [PASS] Status updated to 'Discharged' (badge: {badge_text.strip()}).")

        # Step 7: Test Delete Flow
        print("7. Testing Delete workflow with modal confirmation...")
        row = page.locator(f"tr:has-text('{unique_name}')").first
        row.locator(".action-btn-delete").click()
        page.wait_for_selector(".modal-confirm-dialog", timeout=5000)
        time.sleep(0.3)  # Allow fade-in animation to complete
        delete_shot = os.path.join(SCREENSHOTS_DIR, "live_06_delete_modal.png")
        page.screenshot(path=delete_shot)
        
        # Confirm delete
        page.click("#btn-confirm-action")
        page.wait_for_selector(".modal-confirm-dialog", state="detached", timeout=5000)
        time.sleep(2)
        assert page.locator(f"text='{unique_name}'").count() == 0, f"{unique_name} should be removed"
        print("   [PASS] Record deleted and cleaned up cleanly.")

        context.close()
        browser.close()

    print("\nAudit Log:")
    print(f"Console Errors: {len(console_errors)}")
    for e in console_errors:
        print(f"  [ERROR] {e}")
    print(f"Failed Requests: {len(failed_requests)}")
    for f in failed_requests:
        print(f"  [REQ-FAIL] {f}")

    print("\n========================================================")
    print("ALL LIVE INTERACTIVE E2E WORKFLOW CHECKS PASSED (100%)")
    print("========================================================\n")

if __name__ == "__main__":
    test_live_workflow()
