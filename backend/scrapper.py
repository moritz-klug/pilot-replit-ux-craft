import os
import re
import shutil
import requests
from bs4 import BeautifulSoup
from urllib.parse import urljoin, urlparse
from playwright.sync_api import sync_playwright

def download_asset(asset_url, base_url, output_dir):
    local_filename = os.path.basename(urlparse(asset_url).path)
    if not local_filename:
        local_filename = "index"

    local_path = os.path.join(output_dir, local_filename)
    full_url = urljoin(base_url, asset_url)

    try:
        r = requests.get(full_url, timeout=10)
        r.raise_for_status()
        with open(local_path, 'wb') as f:
            f.write(r.content)
        return local_filename
    except Exception as e:
        print(f"Failed to download {full_url}: {e}")
        return None

def clean_and_save_page(url, output_dir="static_page"):
    if os.path.exists(output_dir):
        shutil.rmtree(output_dir)
    os.makedirs(output_dir, exist_ok=True)

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        page.goto(url, timeout=60000)

        # Dismiss common modals/popups
        modal_selectors = [
            "text=Accept", "text=OK", "text=Got it", "text=Allow", "text=Close",
            "button:has-text('Accept')", "button:has-text('OK')",
            "button[aria-label='Close']", "#onetrust-accept-btn-handler"
        ]

        for sel in modal_selectors:
            try:
                page.locator(sel).first.click(timeout=3000)
            except:
                continue

        page.wait_for_timeout(2000)  # Allow any animations to finish

        html_content = page.content()
        parsed_html = BeautifulSoup(html_content, 'html.parser')

        # Handle <link href="">
        for tag in parsed_html.find_all(['link', 'script', 'img']):
            attr = 'href' if tag.name == 'link' else 'src'
            if tag.has_attr(attr):
                asset_url = tag[attr]
                if asset_url.startswith("data:"):
                    continue
                local_name = download_asset(asset_url, url, output_dir)
                if local_name:
                    tag[attr] = local_name

        # Handle <style>@font-face urls
        for style in parsed_html.find_all("style"):
            css = style.string
            if css:
                matches = re.findall(r'url\((.*?)\)', css)
                for match in matches:
                    cleaned_url = match.strip('\'"')
                    if cleaned_url.startswith("data:"):
                        continue
                    local_name = download_asset(cleaned_url, url, output_dir)
                    if local_name:
                        css = css.replace(match, f"'{local_name}'")
                style.string.replace_with(css)

        # Save updated HTML
        with open(os.path.join(output_dir, "index.html"), "w", encoding="utf-8") as f:
            f.write(str(parsed_html))

        # Save screenshot for verification
        page.screenshot(path=os.path.join(output_dir, "preview.png"), full_page=True)

        browser.close()
        print(f"Saved full offline version in: {output_dir}")

# Example usage
clean_and_save_page("https://www.marketing-lokalhelden.de", output_dir="saved_example")
