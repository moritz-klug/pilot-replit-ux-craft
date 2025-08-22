@echo off
setlocal enabledelayedexpansion

echo 🚀 Auto UI Setup Script
echo ========================

REM Check if we're in the right directory
if not exist "package.json" (
    echo ❌ Please run this script from the project root directory (pilot-replit-ux-craft)
    exit /b 1
)

if not exist "backend" (
    echo ❌ Backend directory not found
    exit /b 1
)

echo.
echo 🔍 Checking Prerequisites
echo ----------------------------------------

REM Check Node.js
node --version >nul 2>&1
if %errorlevel% equ 0 (
    for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%i
    echo ✅ Node.js !NODE_VERSION! is installed
) else (
    echo ❌ Node.js is not installed. Please install Node.js v16 or higher.
    exit /b 1
)

REM Check Python
python --version >nul 2>&1
if %errorlevel% equ 0 (
    for /f "tokens=*" %%i in ('python --version') do set PYTHON_VERSION=%%i
    echo ✅ Python !PYTHON_VERSION! is installed
    set PYTHON_CMD=python
) else (
    python3 --version >nul 2>&1
    if %errorlevel% equ 0 (
        for /f "tokens=*" %%i in ('python3 --version') do set PYTHON_VERSION=%%i
        echo ✅ Python !PYTHON_VERSION! is installed
        set PYTHON_CMD=python3
    ) else (
        echo ❌ Python is not installed. Please install Python 3.8 or higher.
        exit /b 1
    )
)

REM Check Git
git --version >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Git is installed
) else (
    echo ⚠️  Git is not installed (optional but recommended)
)

echo.
echo 🔍 Installing Frontend Dependencies
echo ----------------------------------------

REM Install Node.js dependencies
if exist "node_modules" (
    echo ⚠️  node_modules already exists, skipping npm install
) else (
    echo ✅ Installing Node.js dependencies...
    npm install
)

echo.
echo 🔍 Setting up Backend
echo ----------------------------------------

cd backend

REM Create virtual environment if it doesn't exist
if not exist "venv" (
    echo ✅ Creating Python virtual environment...
    %PYTHON_CMD% -m venv venv
) else (
    echo ⚠️  Virtual environment already exists
)

REM Activate virtual environment
echo ✅ Activating virtual environment...
call venv\Scripts\activate.bat

REM Install Python dependencies
echo ✅ Installing Python dependencies...
pip install -r requirements.txt

REM Install Playwright browsers
echo ✅ Installing Playwright browsers...
playwright install chromium

REM Create screenshots directory
if not exist "screenshots" (
    echo ✅ Creating screenshots directory...
    mkdir screenshots
)

REM Go back to root
cd ..

echo.
echo 🔍 Setup Complete!
echo ----------------------------------------

echo ✅ 🎉 Setup completed successfully!
echo.
echo Next steps:
echo 1. Start the screenshot server:
echo    cd backend ^&^& venv\Scripts\activate.bat ^&^& python run_screenshot_server.py
echo.
echo 2. Start the main API server (in a new terminal):
echo    cd backend ^&^& venv\Scripts\activate.bat ^&^& python main.py
echo.
echo 3. Start the frontend (in a new terminal):
echo    npm run dev
echo.
echo 4. Test your setup:
echo    cd backend ^&^& venv\Scripts\activate.bat ^&^& python test_setup.py
echo.
echo 5. Visit http://localhost:5173 to use the application
echo.
echo ⚠️  Remember to activate the virtual environment before running backend commands!

pause 