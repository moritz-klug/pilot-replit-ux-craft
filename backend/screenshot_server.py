import os
import uuid
import asyncio
from datetime import datetime
from typing import Optional
from pathlib import Path

from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel, HttpUrl
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

class ScreenshotRequest(BaseModel):
    url: HttpUrl
    width: int = 1920
    height: int = 1080
    wait_time: int = 0
    full_page: bool = False
    element_selector: Optional[str] = None

class ScreenshotResponse(BaseModel):
    screenshot_id: str
    message: str
    url: str
    
async def take_screenshot_async(request: ScreenshotRequest, screenshot_id: str):
    """
    Asynchronously take a screenshot of the specified URL using Playwright.
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
            
            await page.goto(str(request.url), wait_until="networkidle")

            if request.wait_time > 0:
                await asyncio.sleep(request.wait_time)

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
        url=str(request.url)
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
    """Health check endpoint."""
    return {"status": "ok"}

if __name__ == "__main__":
    import uvicorn
    print("Starting Screenshot API Server...")
    print(f"Screenshots will be saved in: {SCREENSHOTS_DIR.resolve()}")
    print("Server will be available at: http://localhost:8001")
    print("API Documentation: http://localhost:8001/docs")
    uvicorn.run(app, host="0.0.0.0", port=8001) 