# Screenshot API Server

A FastAPI-based server for taking screenshots of webpages using Selenium and Chrome WebDriver.

## Features

- Take screenshots of any webpage
- Customizable viewport size
- Full-page screenshots
- Element-specific screenshots
- Automatic ChromeDriver management
- Background task processing
- RESTful API endpoints

## Installation

1. Install the required dependencies:
```bash
pip install -r requirements.txt
```

2. Make sure you have Chrome browser installed on your system.

## Running the Server

### Option 1: Using the runner script
```bash
python run_screenshot_server.py
```

### Option 2: Direct uvicorn command
```bash
uvicorn screenshot_server:app --host 0.0.0.0 --port 8001 --reload
```

The server will start on `http://localhost:8001`

## API Endpoints

### 1. Take Screenshot
**POST** `/screenshot`

Request body:
```json
{
  "url": "https://example.com",
  "width": 1920,
  "height": 1080,
  "wait_time": 3,
  "full_page": false,
  "element_selector": null
}
```

Parameters:
- `url` (required): The webpage URL to screenshot
- `width` (optional): Viewport width (default: 1920)
- `height` (optional): Viewport height (default: 1080)
- `wait_time` (optional): Additional wait time in seconds (default: 3)
- `full_page` (optional): Take full page screenshot (default: false)
- `element_selector` (optional): CSS selector for specific element screenshot

Response:
```json
{
  "screenshot_id": "a1b2c3d4",
  "filename": "screenshot_20241201_143022_a1b2c3d4.png",
  "url": "https://example.com",
  "timestamp": "20241201_143022",
  "file_path": "screenshots/screenshot_20241201_143022_a1b2c3d4.png"
}
```

### 2. Get Screenshot
**GET** `/screenshot/{screenshot_id}`

Returns the actual screenshot image file.

### 3. List Screenshots
**GET** `/screenshots`

Returns a list of all available screenshots.

### 4. Delete Screenshot
**DELETE** `/screenshot/{screenshot_id}`

Deletes a specific screenshot.

### 5. Health Check
**GET** `/health`

Returns server health status.

## Usage Examples

### Basic Screenshot
```bash
curl -X POST "http://localhost:8001/screenshot" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://google.com"}'
```

### Full Page Screenshot
```bash
curl -X POST "http://localhost:8001/screenshot" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com", "full_page": true}'
```

### Element-Specific Screenshot
```bash
curl -X POST "http://localhost:8001/screenshot" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com", "element_selector": ".header"}'
```

### Custom Viewport Size
```bash
curl -X POST "http://localhost:8001/screenshot" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com", "width": 1366, "height": 768}'
```

## File Storage

Screenshots are saved in the `screenshots/` directory with the following naming convention:
`screenshot_YYYYMMDD_HHMMSS_XXXXXXXX.png`

## API Documentation

Once the server is running, you can access the interactive API documentation at:
- Swagger UI: `http://localhost:8001/docs`
- ReDoc: `http://localhost:8001/redoc`

## Error Handling

The API returns appropriate HTTP status codes:
- `200`: Success
- `404`: Screenshot not found
- `500`: Internal server error (e.g., failed to take screenshot)

## Notes

- The server uses Chrome in headless mode for taking screenshots
- ChromeDriver is automatically downloaded and managed by webdriver-manager
- Screenshots are processed in background tasks for better performance
- The server includes CORS middleware for frontend integration 