import asyncio
from playwright.async_api import async_playwright, expect
import os

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page()

        # Get the absolute path to the index.html file
        file_path = os.path.abspath('index.html')

        # Go to the local HTML file
        await page.goto(f'file://{file_path}')

        # Switch to mobile mode to make the settings button visible
        await page.select_option('#ui-mode-select', 'mobile')

        # Click the settings button to open the settings panel
        await page.click('#mobile-settings-toggle')

        # Wait for the panel to be visible
        await expect(page.locator('#mobile-settings-panel')).to_be_visible()

        # Locate the auto-start label within the mobile settings panel
        auto_start_label = page.locator('#mobile-settings-panel .auto-start-label')

        # Click the label to toggle the checkbox
        await auto_start_label.click()

        # Take a screenshot to show the new state
        await page.screenshot(path="jules-scratch/verification/verification_after_click.png")

        await browser.close()

if __name__ == '__main__':
    asyncio.run(main())
