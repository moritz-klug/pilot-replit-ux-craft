#!/usr/bin/env python3
"""
Comprehensive Test Script for Auto UI Application
Tests all components: screenshot server, main API, and frontend
"""

import requests
import time
import subprocess
import sys
import os
from pathlib import Path

def test_screenshot_server():
    """Test if screenshot server is running"""
    print("🔍 Testing Screenshot Server...")
    try:
        response = requests.get('http://localhost:8001/health', timeout=5)
        if response.status_code == 200:
            print("✅ Screenshot server is running!")
            return True
        else:
            print(f"❌ Screenshot server responded with status: {response.status_code}")
            return False
    except requests.exceptions.ConnectionError:
        print("❌ Screenshot server is not running")
        return False
    except Exception as e:
        print(f"❌ Error testing screenshot server: {e}")
        return False

def test_main_api():
    """Test if main API server is running"""
    print("\n🔍 Testing Main API Server...")
    try:
        response = requests.get('http://localhost:8000/docs', timeout=5)
        if response.status_code == 200:
            print("✅ Main API server is running!")
            return True
        else:
            print(f"❌ Main API server responded with status: {response.status_code}")
            return False
    except requests.exceptions.ConnectionError:
        print("❌ Main API server is not running")
        return False
    except Exception as e:
        print(f"❌ Error testing main API server: {e}")
        return False

def test_frontend():
    """Test if frontend is running"""
    print("\n🔍 Testing Frontend...")
    try:
        response = requests.get('http://localhost:5173', timeout=5)
        if response.status_code == 200:
            print("✅ Frontend is running!")
            return True
        else:
            print(f"❌ Frontend responded with status: {response.status_code}")
            return False
    except requests.exceptions.ConnectionError:
        print("❌ Frontend is not running")
        return False
    except Exception as e:
        print(f"❌ Error testing frontend: {e}")
        return False

def test_screenshot_functionality():
    """Test screenshot functionality"""
    print("\n🔍 Testing Screenshot Functionality...")
    try:
        # Test taking a screenshot
        response = requests.post('http://localhost:8001/screenshot', 
                               json={
                                   'url': 'https://httpbin.org/html',
                                   'width': 1366,
                                   'height': 768,
                                   'wait_time': 2,
                                   'full_page': False
                               },
                               timeout=30)
        
        if response.status_code == 200:
            result = response.json()
            print(f"✅ Screenshot created successfully!")
            print(f"   Screenshot ID: {result['screenshot_id']}")
            print(f"   Filename: {result['filename']}")
            
            # Test getting the screenshot
            time.sleep(2)  # Wait for processing
            img_response = requests.get(f"http://localhost:8001/screenshot/{result['screenshot_id']}")
            if img_response.status_code == 200:
                print("✅ Screenshot download works!")
                return True
            else:
                print("❌ Screenshot download failed")
                return False
        else:
            print(f"❌ Screenshot creation failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Error testing screenshot functionality: {e}")
        return False

def start_servers():
    """Start all servers"""
    print("\n🚀 Starting Servers...")
    
    # Start screenshot server
    print("Starting Screenshot Server...")
    try:
        subprocess.Popen([sys.executable, "backend/run_screenshot_server.py"], 
                        cwd="pilot-replit-ux-craft",
                        stdout=subprocess.PIPE,
                        stderr=subprocess.PIPE)
        print("✅ Screenshot server started")
    except Exception as e:
        print(f"❌ Failed to start screenshot server: {e}")
    
    # Start main API server
    print("Starting Main API Server...")
    try:
        subprocess.Popen([sys.executable, "backend/main.py"], 
                        cwd="pilot-replit-ux-craft",
                        stdout=subprocess.PIPE,
                        stderr=subprocess.PIPE)
        print("✅ Main API server started")
    except Exception as e:
        print(f"❌ Failed to start main API server: {e}")
    
    # Start frontend
    print("Starting Frontend...")
    try:
        subprocess.Popen(["npm", "run", "dev"], 
                        cwd="pilot-replit-ux-craft",
                        stdout=subprocess.PIPE,
                        stderr=subprocess.PIPE)
        print("✅ Frontend started")
    except Exception as e:
        print(f"❌ Failed to start frontend: {e}")
    
    print("\n⏳ Waiting for servers to start...")
    time.sleep(10)

def main():
    """Main test function"""
    print("🧪 Auto UI Application - Comprehensive Test")
    print("=" * 50)
    
    # Check if we're in the right directory
    if not Path("pilot-replit-ux-craft").exists():
        print("❌ Please run this script from the project root directory")
        return
    
    # Test if servers are already running
    screenshot_running = test_screenshot_server()
    main_api_running = test_main_api()
    frontend_running = test_frontend()
    
    # If not all servers are running, start them
    if not all([screenshot_running, main_api_running, frontend_running]):
        print("\n⚠️  Some servers are not running. Starting them...")
        start_servers()
        
        # Wait and test again
        print("\n⏳ Testing servers after startup...")
        time.sleep(5)
        
        screenshot_running = test_screenshot_server()
        main_api_running = test_main_api()
        frontend_running = test_frontend()
    
    # Test screenshot functionality if server is running
    if screenshot_running:
        screenshot_working = test_screenshot_functionality()
    else:
        screenshot_working = False
    
    # Summary
    print("\n" + "=" * 50)
    print("📊 Test Results Summary:")
    print(f"   Screenshot Server: {'✅ Running' if screenshot_running else '❌ Not Running'}")
    print(f"   Main API Server: {'✅ Running' if main_api_running else '❌ Not Running'}")
    print(f"   Frontend: {'✅ Running' if frontend_running else '❌ Not Running'}")
    print(f"   Screenshot Functionality: {'✅ Working' if screenshot_working else '❌ Not Working'}")
    
    if all([screenshot_running, main_api_running, frontend_running, screenshot_working]):
        print("\n🎉 All tests passed! Your application is ready to use.")
        print("\n🌐 Access your application:")
        print("   Frontend: http://localhost:5173")
        print("   API Documentation: http://localhost:8000/docs")
        print("   Screenshot API: http://localhost:8001/docs")
        
        print("\n📝 Testing Instructions:")
        print("   1. Open http://localhost:5173 in your browser")
        print("   2. Enter a URL (e.g., https://google.com)")
        print("   3. Click 'Analyze now' to see the streaming interface")
        print("   4. Watch the analysis progress with screenshots")
        print("   5. Review features and AI analysis in the Feature Review page")
        
    else:
        print("\n⚠️  Some components are not working properly.")
        print("   Check the error messages above and ensure all dependencies are installed.")
        
        if not screenshot_running:
            print("\n🔧 To start screenshot server manually:")
            print("   cd pilot-replit-ux-craft/backend")
            print("   python run_screenshot_server.py")
        
        if not main_api_running:
            print("\n🔧 To start main API server manually:")
            print("   cd pilot-replit-ux-craft/backend")
            print("   python main.py")
        
        if not frontend_running:
            print("\n🔧 To start frontend manually:")
            print("   cd pilot-replit-ux-craft")
            print("   npm run dev")
    
    print("=" * 50)

if __name__ == "__main__":
    main() 