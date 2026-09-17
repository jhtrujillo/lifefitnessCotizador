print("Starting...")
import pandas as pd
print("Pandas imported.")
from playwright.sync_api import sync_playwright
print("Playwright imported.")
with sync_playwright() as p:
    print("Playwright context created.")
    browser = p.chromium.launch(headless=True)
    print("Browser launched.")
    browser.close()
print("Done.")
