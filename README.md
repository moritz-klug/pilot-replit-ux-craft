# Auto UI - UI Analysis and Screenshot Tool

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Python 3.8+](https://img.shields.io/badge/python-3.8+-blue.svg)](https://www.python.org/downloads/)
[![Node.js 16+](https://img.shields.io/badge/node-16+-green.svg)](https://nodejs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.109.2+-blue.svg)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-18+-blue.svg)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5+-blue.svg)](https://www.typescriptlang.org/)

A comprehensive web application for UI analysis, feature recommendations, and automatic webpage screenshot capture. Built with modern technologies including FastAPI, React, TypeScript, and AI-powered analysis.

## 📋 Table of Contents

- [Features](#-features)
- [Prerequisites Checklist](#-prerequisites-checklist)
- [Configuration](#%EF%B8%8F-configuration)
- [Installation](#%EF%B8%8F-installation)
- [Usage](#-usage)
- [Troubleshooting Common Issues](#-troubleshooting-common-issues)
- [Testing Your Setup](#-testing-your-setup)
- [Project Structure Explained](#-project-structure-explained)
- [What Each Service Does](#-what-each-service-does)
- [URL Handling](#-url-handling)
- [Common Mistakes to Avoid](#-common-mistakes-to-avoid)
- [Getting Help](#-getting-help)
- [Success!](#-success)

## ✨ Features

### 🎯 UI Analysis
- **AI-Powered Analysis**: Advanced feature review and analysis using OpenRouter AI models
- **Scientific Research-Based Recommendations**: Integration with FutureHouse API for research-backed UI improvements
- **Interactive UI Components**: Modern React components with real-time feedback
- **Feature Extraction**: Automatic detection and analysis of website UI sections
- **Bounding Box Detection**: Computer vision-powered element localization

### 🔬 Research Integration
- **FutureHouse API**: Scientific research-based recommendations
- **Academic Paper References**: Citations and research backing for all suggestions
- **Evidence-Based Design**: All recommendations backed by research data

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
## ⚙️ Configuration

### Environment Variables

Create a `.env` file in the backend directory:

```env
# AI Services
OPENROUTER_API_KEY=your_openrouter_api_key_here
FUTURE_HOUSE_API_KEY=your_futurehouse_api_key_here
```

### API Key Setup

#### OpenRouter API Key
1. Visit [OpenRouter](https://openrouter.ai/)
2. Create an account and get your API key
3. Add to `.env` file

#### FutureHouse API Key
1. Visit [FutureHouse](https://www.futurehouse.org)
2. Sign up for research access
3. Get your API key and add to `.env`

## 🛠️ Installation

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

  ➜  Local:   http://localhost:8080/
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
open http://localhost:8080
```

#### 5.2 Test Screenshot Functionality
```bash
cd backend
python test_screenshot.py
```

## 🎯 Usage

### Basic Website Analysis

1. **Open the Application**: Navigate to http://localhost:8080
2. **Enter URL**: Input a website URL in full format, starting with `https://`  
  (e.g., `https://example.com`).  
  ⚠️ URLs without `https://` will not be accepted.
3. **Click Analyze**: The system will automatically:
   - Take a full-page screenshot
   - Extract UI features and elements
4. **Review Results**: View the screenshot alongside feature analysis
5. **Get Recommendations**: Access scientific research-based improvement suggestions

### Feature Analysis

1. **View Extracted Features**: See all detected UI sections
2. **Interactive Screenshot**: Hover over features to see bounding boxes
3. **Get Recommendations**: Request research-backed improvements
4. **Chat with Features**: Use AI-powered chatbots for specific advice
5. **Generate Code**: Get implementation-ready code snippets

### Technology Stack

#### Frontend
- **React 18**: Modern React with hooks and functional components
- **TypeScript**: Type-safe development
- **Tailwind CSS**: Utility-first CSS framework
- **Vite**: Fast build tool and dev server

#### Backend
- **FastAPI**: Modern, fast web framework for building APIs
- **Python 3.11+**: Latest Python with async support
- **Playwright**: Reliable browser automation
- **Uvicorn**: ASGI server for FastAPI

#### AI & External Services
- **OpenRouter**: Access to multiple AI models (GPT-4, Claude, Mistral)
- **FutureHouse**: Scientific research database for UI/UX
- **Computer Vision**: AI-powered bounding box detection

### Data Flow

1. **User Input**: URL entered in frontend
2. **Screenshot Capture**: Playwright takes full-page screenshot
3. **Feature Extraction**: AI analyzes website structure
4. **Research Integration**: FutureHouse provides scientific backing
5. **Recommendations**: AI generates actionable improvements
6. **Results Display**: Interactive UI shows analysis and suggestions

## 🔧 Troubleshooting Common Issues

### Issue 1: "422 Unprocessable Entity" Error
**Cause:** Missing Playwright browser installation OR URL not starting with `https://`
**Solutions:**
```bash
# Install Playwright browsers
cd backend
playwright install chromium

# Or check your URL format
# Valid format: "https://example.com"

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

- **Frontend (Port 8080)**: React web application
- **Main API (Port 8000)**: Handles feature analysis and recommendations
- **Screenshot Server (Port 8001)**: Takes screenshots of websites

## 🌐 URL Handling

All URLs must be entered in full format:

- ✅ `https://example.com`
- ❌ `www.example.com`
- ❌ `example.com`

This strict requirement ensures reliable analysis and avoids errors.

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
- Visit http://localhost:8080
- Enter any website URL
- Click "Analyze" and see both analysis and screenshots

---

**Remember:** The most common cause of 422 errors is missing Playwright browser installation. Always run `playwright install chromium` after installing requirements! 

**Happy Analyzing! 🎉**
