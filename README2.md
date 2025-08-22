# Auto UI - Complete Setup Guide

## 🚨 CRITICAL: This is the ONLY setup guide you need to follow

This guide will get you from zero to a fully working Auto UI application. Follow it step-by-step, and you'll avoid the common 422 errors and setup issues.

## 📋 Prerequisites Checklist

Before starting, ensure you have:

- ✅ **Node.js** (v16 or higher) - [Download here](https://nodejs.org/)
- ✅ **Python 3.11** (recommended) or Python 3.8+ - [Download here](https://www.python.org/)
- ✅ **Git** - [Download here](https://git-scm.com/)
- ✅ **Chrome browser** installed (for screenshots)

### Verify Prerequisites
```bash
# Check Node.js
node --version

# Check Python
python --version

# Check Git
git --version
```

## 🚀 Complete Setup Process

### Step 1: Clone and Navigate
```bash
git clone <your-repo-url>
cd pilot-replit-ux-craft
```

### Step 2: Frontend Setup
```bash
# Install Node.js dependencies
npm install

# Verify installation
npm run build
```

### Step 3: Backend Setup (CRITICAL SECTION)

#### 3.1 Navigate to Backend
```bash
cd backend
```

#### 3.2 Create Virtual Environment
```bash
# On macOS/Linux:
python -m venv venv
source venv/bin/activate

# On Windows:
python -m venv venv
venv\Scripts\activate
```

#### 3.3 Install Python Dependencies
```bash
pip install -r requirements.txt
```

#### 3.4 🚨 CRITICAL: Install Playwright Browsers
```bash
# This step is REQUIRED and often forgotten!
playwright install chromium
```

#### 3.5 Verify Backend Setup
```bash
# Test if everything is installed correctly
python -c "import playwright; print('✅ Playwright installed')"
python -c "import fastapi; print('✅ FastAPI installed')"
```

### Step 4: Start All Services

#### 4.1 Start Screenshot Server (Terminal 1)
```bash
cd backend
source venv/bin/activate  # or venv\Scripts\activate on Windows
python run_screenshot_server.py
```

**Expected output:**
```
Starting Screenshot API Server...
Server will be available at: http://localhost:8001
API Documentation: http://localhost:8001/docs
```

#### 4.2 Start Main API Server (Terminal 2)
```bash
cd backend
source venv/bin/activate  # or venv\Scripts\activate on Windows
python main.py
```

**Expected output:**
```
INFO:     Started server process
INFO:     Waiting for application startup.
INFO:     Application startup complete.
INFO:     Uvicorn running on http://0.0.0.0:8000
```

#### 4.3 Start Frontend (Terminal 3)
```bash
cd pilot-replit-ux-craft  # Go back to root directory
npm run dev
```

**Expected output:**
```
  VITE v5.x.x  ready in xxx ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

### Step 5: Verify Everything Works

#### 5.1 Check All Services
```bash
# Check screenshot server
curl http://localhost:8001/health

# Check main API server
curl http://localhost:8000/health

# Check frontend (should show the website)
open http://localhost:5173
```

#### 5.2 Test Screenshot Functionality
```bash
cd backend
python test_screenshot.py
```

## 🔧 Troubleshooting Common Issues

### Issue 1: "422 Unprocessable Entity" Error
**Cause:** Missing Playwright browser installation OR invalid URL format
**Solutions:**
```bash
# Install Playwright browsers
cd backend
playwright install chromium

# Or check URL format - the system now automatically adds https:// to URLs
# Valid formats: "https://example.com", "www.example.com", "example.com"
```

### Issue 2: "Module not found" errors
**Cause:** Virtual environment not activated
**Solution:**
```bash
cd backend
source venv/bin/activate  # macOS/Linux
# or
venv\Scripts\activate     # Windows
```

### Issue 3: "Port already in use" errors
**Cause:** Another process is using the port
**Solution:**
```bash
# Find and kill the process
lsof -ti:8001 | xargs kill -9  # macOS/Linux
# or
netstat -ano | findstr :8001   # Windows
```

### Issue 4: "Chrome not found" errors
**Cause:** Chrome browser not installed or Playwright can't find it
**Solution:**
```bash
# Reinstall Playwright browsers
playwright install --force chromium
```

### Issue 5: "Permission denied" errors
**Cause:** File permission issues
**Solution:**
```bash
# Fix permissions
chmod +x start_screenshot_server.sh
mkdir -p screenshots
chmod 755 screenshots
```

## 🧪 Testing Your Setup

### Quick Test Script
Create a file called `test_setup.py` in the backend directory:

```python
#!/usr/bin/env python3
import requests
import time

def test_setup():
    print("🧪 Testing your Auto UI setup...")
    
    # Test screenshot server
    try:
        response = requests.get("http://localhost:8001/health", timeout=5)
        if response.status_code == 200:
            print("✅ Screenshot server is running")
        else:
            print("❌ Screenshot server not responding correctly")
            return False
    except:
        print("❌ Screenshot server not running")
        return False
    
    # Test screenshot functionality
    try:
        response = requests.post("http://localhost:8001/screenshot", 
            json={"url": "https://www.google.com"}, timeout=10)
        if response.status_code == 200:
            print("✅ Screenshot functionality working")
        else:
            print(f"❌ Screenshot test failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Screenshot test error: {e}")
        return False
    
    print("🎉 All tests passed! Your setup is working correctly.")
    return True

if __name__ == "__main__":
    test_setup()
```

Run it:
```bash
cd backend
python test_setup.py
```

## 📁 Project Structure Explained

```
pilot-replit-ux-craft/
├── backend/                    # Backend servers
│   ├── main.py                # Main API server (port 8000)
│   ├── screenshot_server.py   # Screenshot API server (port 8001)
│   ├── requirements.txt       # Python dependencies
│   ├── venv/                  # Python virtual environment
│   ├── screenshots/           # Generated screenshots
│   └── run_screenshot_server.py  # Screenshot server runner
├── src/                       # Frontend React application
│   ├── components/            # React components
│   └── pages/                 # Page components
├── package.json               # Node.js dependencies
└── README.md                  # Original README
```

## 🎯 What Each Service Does

- **Frontend (Port 5173)**: React web application
- **Main API (Port 8000)**: Handles feature analysis and recommendations
- **Screenshot Server (Port 8001)**: Takes screenshots of websites

## 🌐 URL Handling

The system now automatically handles various URL formats:

- **Full URLs**: `https://example.com` ✅
- **WWW URLs**: `www.example.com` → `https://www.example.com` ✅
- **Domain only**: `example.com` → `https://example.com` ✅

This prevents 422 errors when users forget to add the protocol!

## 🚨 Common Mistakes to Avoid

1. **❌ Forgetting to activate virtual environment**
2. **❌ Not installing Playwright browsers**
3. **❌ Starting services in wrong order**
4. **❌ Using wrong Python version**
5. **❌ Not checking if ports are available**

## 📞 Getting Help

If you're still having issues:

1. **Run the test script**: `python test_setup.py`
2. **Check server logs**: Look for error messages in the terminal
3. **Verify all prerequisites**: Make sure Node.js, Python, and Chrome are installed
4. **Check network**: Ensure no firewall is blocking localhost connections

## 🎉 Success!

Once everything is working, you should be able to:
- Visit http://localhost:5173
- Enter any website URL
- Click "Analyze" and see both analysis and screenshots
- Use the standalone screenshot tool at /screenshot-tool

---

**Remember:** The most common cause of 422 errors is missing Playwright browser installation. Always run `playwright install chromium` after installing requirements! 