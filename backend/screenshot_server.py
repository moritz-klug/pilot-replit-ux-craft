import os
import uuid
import asyncio
from datetime import datetime
from typing import Optional
from pathlib import Path

from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel
from playwright.async_api import async_playwright

app = FastAPI(title="Screenshot API", description="API for taking screenshots of webpages")

# CORS middleware for allowing cross-origin requests
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

SCREENSHOTS_DIR = Path("screenshots")
SCREENSHOTS_DIR.mkdir(exist_ok=True)

# CSS to hide common cookie banners and popups
POPUP_HIDING_CSS = """
/* Hide common cookie banner selectors */
[id*="cookie" i],
[class*="cookie" i],
[id*="consent" i],
[class*="consent" i],
[id*="gdpr" i],
[class*="gdpr" i],
[id*="privacy" i],
[class*="privacy" i],
[id*="banner" i],
[class*="banner" i],
[id*="notice" i],
[class*="notice" i],
[id*="popup" i],
[class*="popup" i],
[id*="modal" i],
[class*="modal" i],
[id*="overlay" i],
[class*="overlay" i],
[id*="notification" i],
[class*="notification" i],
[class*="toast" i],
[id*="toast" i],
[class*="alert" i],
[id*="alert" i],

/* Hide common newsletter popups */
[class*="newsletter" i],
[id*="newsletter" i],
[class*="subscribe" i],
[id*="subscribe" i],
[class*="signup" i],
[id*="signup" i],

/* Hide bottom/top banners */
div[style*="position: fixed"][style*="bottom: 0"],
div[style*="position: fixed"][style*="top: 0"],
div[style*="position: sticky"][style*="bottom: 0"],
div[style*="position: sticky"][style*="top: 0"],

/* Hide common popup frameworks */
.swal2-container,
.sweet-alert,
.vex-content,
.bootbox,
.ui-dialog,
.fancybox-container,
.mfp-container,

/* Hide consent management platforms */
#onetrust-consent-sdk,
#CybotCookiebotDialog,
#cookieChoiceInfo,
#cookiescript_injected,
.cc-window,
.cc-banner,
.cookie-law-info-bar,
.gdpr-cookie-notice,
.cookie-notice-container,

/* Hide specific cookie banner services */
.osano-cm-widget,
.trustarc-banner-container,
.evidon-barrier-wrapper,
.ot-sdk-container,
.optanon-alert-box-wrapper,

/* Common z-index overlays */
[style*="z-index: 999"],
[style*="z-index: 9999"],
[style*="z-index: 99999"] {
    display: none !important;
    visibility: hidden !important;
    opacity: 0 !important;
    pointer-events: none !important;
}

/* Remove backdrop/overlay elements */
.modal-backdrop,
.overlay,
.backdrop,
[class*="backdrop" i],
[id*="backdrop" i] {
    display: none !important;
}

/* Remove fixed/sticky positioning that might block content */
body {
    overflow: auto !important;
}
"""

class ScreenshotRequest(BaseModel):
    url: str  # Changed from HttpUrl to str for more flexible URL handling
    width: int = 1920
    height: int = 1080
    wait_time: int = 0
    full_page: bool = True  # Changed default to True for better full-page capture
    element_selector: Optional[str] = None
    hide_popups: bool = True  # New option to hide popups
    
    def __init__(self, **data):
        super().__init__(**data)
        # Normalize URL to ensure it has a protocol
        self.url = self._normalize_url(self.url)
    
    def _normalize_url(self, url: str) -> str:
        """Normalize URL to ensure it has a protocol"""
        url = url.strip()
        
        # If URL doesn't start with http:// or https://, add https://
        if not url.startswith(('http://', 'https://')):
            # If it starts with www., add https://
            if url.startswith('www.'):
                url = 'https://' + url
            # If it doesn't start with www., assume it's a domain and add https://
            else:
                url = 'https://' + url
        
        return url

class ScreenshotResponse(BaseModel):
    screenshot_id: str
    message: str
    url: str
    
async def take_screenshot_async(request: ScreenshotRequest, screenshot_id: str):
    """
    Asynchronously take a screenshot of the specified URL using Playwright.
    Enhanced to properly capture full scrollable content.
    """
    filename = f"screenshot_{datetime.now().strftime('%Y%m%d_%H%M%S')}_{screenshot_id}.png"
    file_path = SCREENSHOTS_DIR / filename

    try:
        async with async_playwright() as p:
            browser = await p.chromium.launch()
            page = await browser.new_page(
                viewport={'width': request.width, 'height': request.height},
                device_scale_factor=2
            )
            
            # Navigate to the page
            await page.goto(request.url, wait_until="networkidle")

            # Wait for initial page load
            if request.wait_time > 0:
                await asyncio.sleep(request.wait_time)
            else:
                # Default wait for dynamic content
                await asyncio.sleep(3)

            # For full page screenshots, ensure all content is loaded
            if request.full_page:
                print(f"[DEBUG] Preparing full-page screenshot for {request.url}")
                
                # Scroll to trigger lazy loading and get full page height
                await page.evaluate("""
                    async () => {
                        // Disable smooth scrolling for faster execution
                        document.documentElement.style.scrollBehavior = 'auto';
                        
                        // Get initial height
                        let lastHeight = document.body.scrollHeight;
                        
                        // Scroll to bottom to trigger lazy loading
                        for (let i = 0; i < 10; i++) {
                            window.scrollTo(0, document.body.scrollHeight);
                            await new Promise(resolve => setTimeout(resolve, 500));
                            
                            let newHeight = document.body.scrollHeight;
                            if (newHeight === lastHeight) {
                                break; // No new content loaded
                            }
                            lastHeight = newHeight;
                        }
                        
                        // Scroll back to top for the screenshot
                        window.scrollTo(0, 0);
                        await new Promise(resolve => setTimeout(resolve, 500));
                    }
                """)
                
                # Additional wait for content to settle
                await asyncio.sleep(2)

            # Hide popups if requested
            if request.hide_popups:
                print(f"[DEBUG] Injecting popup-hiding CSS for {request.url}")
                await page.add_style_tag(content=POPUP_HIDING_CSS)
                
                # Additional JavaScript to remove elements that might not be caught by CSS
                await page.evaluate("""
                    // Remove elements that commonly contain popups
                    const selectors = [
                        '[role="dialog"]',
                        '[aria-modal="true"]',
                        '.modal',
                        '.popup',
                        '.overlay',
                        '.cookie-banner',
                        '.cookie-notice',
                        '.gdpr-notice',
                        '.consent-banner'
                    ];
                    
                    selectors.forEach(selector => {
                        document.querySelectorAll(selector).forEach(el => {
                            // Check if element has high z-index (likely a popup)
                            const style = window.getComputedStyle(el);
                            const zIndex = parseInt(style.zIndex);
                            if (zIndex > 100 || el.getAttribute('class')?.toLowerCase().includes('popup') || 
                                el.getAttribute('class')?.toLowerCase().includes('modal') ||
                                el.getAttribute('class')?.toLowerCase().includes('cookie')) {
                                el.style.display = 'none';
                                el.remove();
                            }
                        });
                    });
                    
                    // Remove fixed position elements at the bottom (common for cookie banners)
                    document.querySelectorAll('*').forEach(el => {
                        const style = window.getComputedStyle(el);
                        if (style.position === 'fixed') {
                            const rect = el.getBoundingClientRect();
                            // If it's at the bottom and wide, likely a cookie banner
                            if (rect.bottom >= window.innerHeight - 100 && rect.width > window.innerWidth * 0.5) {
                                el.style.display = 'none';
                                el.remove();
                            }
                            // If it covers a large portion of the screen, likely a modal
                            if (rect.width > window.innerWidth * 0.3 && rect.height > window.innerHeight * 0.3) {
                                el.style.display = 'none';
                                el.remove();
                            }
                        }
                    });
                """)
                
                # Wait a bit for the changes to take effect
                await asyncio.sleep(1)

            screenshot_options = {
                "path": str(file_path),
                "full_page": request.full_page,
            }
            
            if request.element_selector:
                element = page.locator(request.element_selector)
                await element.screenshot(**screenshot_options)
            else:
                await page.screenshot(**screenshot_options)

            await browser.close()
            print(f"Screenshot saved to {file_path}")

    except Exception as e:
        print(f"!!!!!!!!!! An error occurred during screenshot generation !!!!!!!!!!")
        print(f"Error type: {type(e).__name__}")
        print(f"Error details: {e}")
        # Clean up failed screenshot file if it exists
        if os.path.exists(file_path):
            os.remove(file_path)

@app.post("/screenshot", response_model=ScreenshotResponse)
async def create_screenshot(request: ScreenshotRequest, background_tasks: BackgroundTasks):
    """
    Accepts a URL and screenshot options, and returns a unique ID for the screenshot.
    The screenshot is generated in the background.
    """
    screenshot_id = str(uuid.uuid4())[:8]
    background_tasks.add_task(take_screenshot_async, request, screenshot_id)
    return ScreenshotResponse(
        screenshot_id=screenshot_id,
        message="Screenshot creation initiated.",
        url=request.url
    )

@app.get("/screenshots")
async def list_screenshots():
    """Lists all available screenshots."""
    files = [f for f in os.listdir(SCREENSHOTS_DIR) if f.endswith(".png")]
    return {"screenshots": files}

@app.get("/screenshot/{screenshot_id}")
async def get_screenshot(screenshot_id: str):
    """Returns the specified screenshot image."""
    # Find the file that contains the screenshot_id
    found_files = list(SCREENSHOTS_DIR.glob(f"*_{screenshot_id}.png"))
    if not found_files:
        raise HTTPException(status_code=404, detail="Screenshot not found.")
    
    file_path = found_files[0]
    return FileResponse(file_path)

@app.delete("/screenshot/{screenshot_id}")
async def delete_screenshot(screenshot_id: str):
    """Deletes the specified screenshot."""
    found_files = list(SCREENSHOTS_DIR.glob(f"*_{screenshot_id}.png"))
    if not found_files:
        raise HTTPException(status_code=404, detail="Screenshot to delete not found.")
    
    file_path = found_files[0]
    try:
        os.remove(file_path)
        return {"message": f"Screenshot {screenshot_id} deleted successfully."}
    except OSError as e:
        raise HTTPException(status_code=500, detail=f"Error deleting file: {e}")

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "message": "Screenshot API is running"}

if __name__ == "__main__":
    import uvicorn
    print("Starting Screenshot API Server...")
    print(f"Screenshots will be saved in: {SCREENSHOTS_DIR.resolve()}")
    print("Server will be available at: http://localhost:8001")
    print("API Documentation: http://localhost:8001/docs")
    uvicorn.run(app, host="0.0.0.0", port=8001) 