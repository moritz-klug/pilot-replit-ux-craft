# Auto UI - UI Analysis and Screenshot Tool

A comprehensive web application for UI analysis, feature recommendations, and automatic webpage screenshot capture.

## Features

### 🎯 UI Analysis
- Feature review and analysis
- Scientific research-based recommendations
- Interactive UI components

### 📸 Automatic Screenshots
- **Automatic capture**: Screenshots are taken automatically when you click "Analyze" on any URL
- Full-page screenshots for complete website analysis
- Screenshots displayed alongside feature analysis
- Download and manage captured screenshots
- Standalone screenshot tool for manual captures

## Project Structure

```
pilot-replit-ux-craft/
├── backend/                    # Backend servers
│   ├── main.py                # Main API server (recommendations)
│   ├── screenshot_server.py   # Screenshot API server
│   ├── requirements.txt       # Python dependencies
│   ├── run_screenshot_server.py  # Screenshot server runner
│   ├── test_screenshot.py     # Screenshot server tests
│   ├── check_screenshot_server.py # Server status checker
│   ├── start_screenshot_server.bat  # Windows startup script
│   ├── start_screenshot_server.sh   # Unix startup script
│   └── README_screenshot_server.md  # Screenshot server docs
├── src/                       # Frontend React application
│   ├── components/            # React components
│   │   ├── ScreenshotTool.tsx # Standalone screenshot tool
│   │   └── ...                # Other components
│   ├── pages/                 # Page components
│   └── ...                    # Other frontend files
└── ...                        # Other project files
```

## Quick Start

### Prerequisites
- Node.js (for frontend)
- Python 3.8+ (for backend)
- Chrome browser (for screenshots)

### 1. Install Dependencies

**Frontend:**
```bash
cd pilot-replit-ux-craft
npm install
```

**Backend:**
```bash
cd pilot-replit-ux-craft/backend
pip install -r requirements.txt
```

### 2. Start the Servers

**Main API Server (Port 8000):**
```bash
cd pilot-replit-ux-craft/backend
python main.py
```

**Screenshot Server (Port 8001) - REQUIRED for screenshots:**
```bash
cd pilot-replit-ux-craft/backend
python run_screenshot_server.py
```

Or use the provided scripts:
- Windows: `start_screenshot_server.bat`
- Unix/Linux/Mac: `./start_screenshot_server.sh`

**Frontend (Port 5173):**
```bash
cd pilot-replit-ux-craft
npm run dev
```

### 3. Check Server Status
```bash
cd pilot-replit-ux-craft/backend
python check_screenshot_server.py
```

### 4. Access the Application

- **Main App**: http://localhost:5173
- **Screenshot Tool**: http://localhost:5173/screenshot-tool
- **API Documentation**: http://localhost:8001/docs

## How It Works

### 🚀 Automatic Screenshot Workflow

1. **Enter URL**: Go to the home page and enter any website URL
2. **Click Analyze**: Click the "Analyze now" button
3. **Automatic Capture**: The system automatically:
   - Takes a full-page screenshot of the website
   - Extracts UI features and elements
   - Processes both in parallel for faster results
4. **Review Results**: View the screenshot alongside feature analysis
5. **Download**: Download the screenshot or view it in the analysis

### 📸 Standalone Screenshot Tool

For manual screenshot captures, visit `/screenshot-tool` to:
- Take screenshots with custom settings
- Set viewport sizes
- Capture specific elements
- Manage screenshot library

## Screenshot Features

### Automatic Capture (Home Page)
- **Full-page screenshots**: Captures entire website content
- **High resolution**: 1920x1080 viewport with full-page capture
- **Wait time**: 3-second wait for dynamic content to load
- **Error handling**: Graceful fallback if screenshot fails

### Manual Capture (Screenshot Tool)
- **Custom viewport**: Set any width and height
- **Element-specific**: Screenshot specific CSS elements
- **Wait time control**: Configure loading wait time
- **File management**: View, download, and delete screenshots

### API Endpoints

#### Take Screenshot
```bash
POST http://localhost:8001/screenshot
Content-Type: application/json

{
  "url": "https://example.com",
  "width": 1920,
  "height": 1080,
  "wait_time": 3,
  "full_page": true,
  "element_selector": null
}
```

#### Get Screenshot
```bash
GET http://localhost:8001/screenshot/{screenshot_id}
```

#### List Screenshots
```bash
GET http://localhost:8001/screenshots
```

#### Delete Screenshot
```bash
DELETE http://localhost:8001/screenshot/{screenshot_id}
```

## Testing

### Test Screenshot Server
```bash
cd pilot-replit-ux-craft/backend
python test_screenshot.py
```

### Check Server Status
```bash
cd pilot-replit-ux-craft/backend
python check_screenshot_server.py
```

## Configuration

### Environment Variables
Create a `.env` file in the backend directory:

```env
FUTURE_HOUSE_API_KEY=your_api_key_here
```

### Screenshot Storage
Screenshots are automatically saved in the `backend/screenshots/` directory with the naming convention:
`screenshot_YYYYMMDD_HHMMSS_XXXXXXXX.png`

## Troubleshooting

### Common Issues

1. **Screenshot server not running**: 
   ```bash
   python check_screenshot_server.py
   ```
   Follow the instructions to start the server.

2. **ChromeDriver not found**: The server automatically downloads ChromeDriver, but make sure Chrome browser is installed.

3. **Port already in use**: Change the port in `run_screenshot_server.py` or kill the process using the port.

4. **CORS errors**: The server includes CORS middleware, but ensure the frontend is running on the correct port.

5. **Screenshot fails**: Check if the URL is accessible and the page loads properly.

### Debug Mode
Run the screenshot server with debug logging:
```bash
uvicorn screenshot_server:app --host 0.0.0.0 --port 8001 --reload --log-level debug
```

## Development

### Adding New Features
1. Backend: Add new endpoints to `screenshot_server.py`
2. Frontend: Create new components in `src/components/`
3. Routing: Add routes in `src/App.tsx`

### Code Style
- Backend: Follow PEP 8 Python style guide
- Frontend: Use TypeScript and follow React best practices
- Use meaningful commit messages

## License

This project is licensed under the MIT License.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## Support

For issues and questions:
1. Check the troubleshooting section
2. Run `python check_screenshot_server.py` to verify server status
3. Review the API documentation at `/docs`
4. Create an issue in the repository
