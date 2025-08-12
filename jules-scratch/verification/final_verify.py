import asyncio
from playwright.async_api import async_playwright, expect

async def main():
    async with async_playwright() as p:
        # Use a mobile viewport to test auto-detection
        pixel_4 = p.devices['Pixel 4']
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(**pixel_4)
        page = await context.new_page()

        import os
        path = os.path.abspath('index.html')
        await page.goto(f'file://{path}')

        # --- Test 1: UI Mode Auto-Detection ---
        print("Testing UI Mode auto-detection...")

        # Body should initially have 'mobile-device' class
        body = page.locator('body')
        await expect(body).to_have_class('mobile-device')
        print("✅ UI Mode auto-detection works correctly.")

        # --- Test 2: Segmented Timer ---
        print("Testing Segmented Timer...")

        # Open the mobile settings panel to access the toggle
        await page.locator('#mobile-settings-toggle').click()
        mobile_panel = page.locator('#mobile-settings-panel')
        await expect(mobile_panel).to_be_visible()

        # Enable segmented animation
        await mobile_panel.locator('.segmented-animation-label').click()

        # Close the panel by clicking the overlay
        await page.locator('#mobile-overlay').click()
        await expect(mobile_panel).not_to_be_visible()

        # Set time to 5s
        await page.locator('.time-display').first.click()
        await page.locator('#minutes-input').fill('0')
        await page.locator('#seconds-input').fill('5')
        await page.locator('#time-confirm-btn').click()

        # Verify segments are created with correct length
        await expect(page.locator('.segment-wrapper .timer-segment')).to_have_count(5)
        print("✅ Segmented timer created correctly.")

        # Start, wait, and check for hidden segments
        await page.locator('.play-pause-btn').first.click()
        await page.wait_for_timeout(2000)

        current_time = await page.evaluate('window.multiTimerApp.timers[0].currentTime')
        print(f"DEBUG: Timer 0 currentTime is: {current_time}")
        await expect(page.locator('.segment-wrapper .timer-segment.hide')).to_have_count(2)
        print("✅ Segmented timer runs correctly.")

        # Take a screenshot
        await page.screenshot(path='jules-scratch/verification/final_verification.png')

        # Reset timer
        await page.locator('.timer-controls .reset-btn').first.click()
        await expect(page.locator('.segment-wrapper')).to_have_count(0)
        print("✅ Segmented timer resets correctly.")

        print("🎉 All verification checks passed!")
        await browser.close()

if __name__ == '__main__':
    asyncio.run(main())
