from playwright.sync_api import sync_playwright, expect

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # 1. Navigate and take initial screenshot
        page.goto("http://localhost:8007")
        page.wait_for_load_state("networkidle")
        page.wait_for_timeout(2000) # wait for shader
        page.screenshot(path="jules-scratch/verification/final-verification.png")

        # 2. Verify terminal
        terminal_input = page.locator('.xterm-helper-textarea')

        # Type help
        terminal_input.type("help")
        terminal_input.press("Enter")
        page.wait_for_timeout(500)

        # Check command history
        terminal_input.press("ArrowUp")
        page.wait_for_timeout(500)

        # Maximize and restore
        page.locator("#maximize-btn").click()
        page.wait_for_timeout(500)
        page.locator("#restore-btn").click()
        page.wait_for_timeout(500)

        # 3. Verify Snake Game
        page.get_by_title("Play Snake Game").click()
        expect(page.locator("#game-display")).to_be_visible()
        page.keyboard.press("Escape")
        expect(page.locator("#game-display")).not_to_be_visible()

        # 4. Verify Python Games
        page.get_by_title("Python Games").click()
        expect(page.locator(".terminal-content")).to_contain_text("Loading Python game collection...")

        browser.close()
        print("Verification script completed successfully.")

run()
