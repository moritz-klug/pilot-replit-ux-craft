#!/usr/bin/env python3
"""
Comprehensive setup test script for Auto UI
This script tests all components to ensure everything is working correctly.
"""

import requests
import time
import sys
import os
import subprocess

def print_step(message):
    """Print a formatted step message"""
    print(f"\n🔍 {message}")
    print("-" * 50)

def print_success(message):
    """Print a success message"""
    print(f"✅ {message}")

def print_error(message):
    """Print an error message"""
    print(f"❌ {message}")

def print_warning(message):
    """Print a warning message"""
    print(f"⚠️  {message}")

def check_prerequisites():
    """Check if all prerequisites are installed"""
    print_step("Checking Prerequisites")
    
    # Check Python version
    try:
        import sys
        python_version = sys.version_info
        if python_version.major == 3 and python_version.minor >= 8:
            print_success(f"Python {python_version.major}.{python_version.minor}.{python_version.micro} is installed")
        else:
            print_error(f"Python {python_version.major}.{python_version.minor}.{python_version.micro} is too old. Need Python 3.8+")
            return False
    except Exception as e:
        print_error(f"Could not check Python version: {e}")
        return False
    
    # Check if required packages are installed
    required_packages = ['fastapi', 'playwright', 'requests', 'uvicorn']
    for package in required_packages:
        try:
            __import__(package)
            print_success(f"{package} is installed")
        except ImportError:
            print_error(f"{package} is not installed")
            return False
    
    return True

def check_playwright_browsers():
    """Check if Playwright browsers are installed"""
    print_step("Checking Playwright Browsers")
    
    try:
        from playwright.sync_api import sync_playwright
        
        with sync_playwright() as p:
            # Try to launch chromium
            browser = p.chromium.launch()
            browser.close()
            print_success("Playwright Chromium browser is installed and working")
            return True
    except Exception as e:
        print_error(f"Playwright browsers not properly installed: {e}")
        print_warning("Run: playwright install chromium")
        return False

def test_screenshot_server():
    """Test if screenshot server is running and working"""
    print_step("Testing Screenshot Server")
    
    # Test health endpoint
    try:
        response = requests.get("http://localhost:8001/health", timeout=5)
        if response.status_code == 200:
            print_success("Screenshot server is running")
        else:
            print_error(f"Screenshot server responded with status: {response.status_code}")
            return False
    except requests.exceptions.ConnectionError:
        print_error("Screenshot server is not running")
        print_warning("Start it with: python run_screenshot_server.py")
        return False
    except Exception as e:
        print_error(f"Error connecting to screenshot server: {e}")
        return False
    
    # Test screenshot functionality with different URL formats
    test_urls = [
        "https://www.google.com",
        "www.apple.com",
        "example.com"
    ]
    
    for test_url in test_urls:
        try:
            response = requests.post("http://localhost:8001/screenshot", 
                json={"url": test_url}, timeout=10)
            if response.status_code == 200:
                result = response.json()
                screenshot_id = result.get("screenshot_id")
                normalized_url = result.get("url")
                print_success(f"Screenshot functionality working for '{test_url}' -> '{normalized_url}' (ID: {screenshot_id})")
                return True
            else:
                print_error(f"Screenshot test failed for '{test_url}' with status: {response.status_code}")
                if response.status_code == 422:
                    print_warning("This might be a validation error. Check the URL format.")
                return False
        except Exception as e:
            print_error(f"Screenshot test error for '{test_url}': {e}")
            return False

def test_main_api_server():
    """Test if main API server is running"""
    print_step("Testing Main API Server")
    
    try:
        response = requests.get("http://localhost:8000/health", timeout=5)
        if response.status_code == 200:
            print_success("Main API server is running")
            return True
        else:
            print_error(f"Main API server responded with status: {response.status_code}")
            return False
    except requests.exceptions.ConnectionError:
        print_error("Main API server is not running")
        print_warning("Start it with: python main.py")
        return False
    except Exception as e:
        print_error(f"Error connecting to main API server: {e}")
        return False

def test_frontend():
    """Test if frontend is accessible"""
    print_step("Testing Frontend")
    
    try:
        response = requests.get("http://localhost:5173", timeout=5)
        if response.status_code == 200:
            print_success("Frontend is accessible")
            return True
        else:
            print_error(f"Frontend responded with status: {response.status_code}")
            return False
    except requests.exceptions.ConnectionError:
        print_error("Frontend is not running")
        print_warning("Start it with: npm run dev")
        return False
    except Exception as e:
        print_error(f"Error connecting to frontend: {e}")
        return False

def check_directory_structure():
    """Check if required directories exist"""
    print_step("Checking Directory Structure")
    
    required_dirs = [
        "screenshots",
        "../src",
        "../node_modules"
    ]
    
    for dir_path in required_dirs:
        if os.path.exists(dir_path):
            print_success(f"Directory exists: {dir_path}")
        else:
            print_warning(f"Directory missing: {dir_path}")
            if dir_path == "screenshots":
                try:
                    os.makedirs(dir_path)
                    print_success(f"Created directory: {dir_path}")
                except Exception as e:
                    print_error(f"Could not create directory {dir_path}: {e}")
    
    return True

def main():
    """Run all tests"""
    print("🧪 Auto UI Setup Test")
    print("=" * 60)
    
    tests = [
        ("Prerequisites", check_prerequisites),
        ("Directory Structure", check_directory_structure),
        ("Playwright Browsers", check_playwright_browsers),
        ("Screenshot Server", test_screenshot_server),
        ("Main API Server", test_main_api_server),
        ("Frontend", test_frontend),
    ]
    
    results = []
    for test_name, test_func in tests:
        try:
            result = test_func()
            results.append((test_name, result))
        except Exception as e:
            print_error(f"Test {test_name} failed with exception: {e}")
            results.append((test_name, False))
    
    # Summary
    print_step("Test Summary")
    passed = sum(1 for _, result in results if result)
    total = len(results)
    
    for test_name, result in results:
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{status} {test_name}")
    
    print(f"\n🎯 Results: {passed}/{total} tests passed")
    
    if passed == total:
        print_success("🎉 All tests passed! Your Auto UI setup is working correctly.")
        print("\nYou can now:")
        print("  • Visit http://localhost:5173 to use the application")
        print("  • Enter any website URL and click 'Analyze'")
        print("  • Use the screenshot tool at /screenshot-tool")
    else:
        print_error("Some tests failed. Please check the issues above and fix them.")
        print("\nCommon solutions:")
        print("  • Run: playwright install chromium")
        print("  • Start screenshot server: python run_screenshot_server.py")
        print("  • Start main API server: python main.py")
        print("  • Start frontend: npm run dev")
    
    return passed == total

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1) 