#!/usr/bin/env python3
"""
Check if the Screenshot API Server is running
"""

import requests
import sys

def check_screenshot_server():
    """Check if the screenshot server is running"""
    try:
        response = requests.get('http://localhost:8001/health', timeout=5)
        if response.status_code == 200:
            print("✅ Screenshot server is running!")
            print(f"   Status: {response.json()}")
            return True
        else:
            print(f"❌ Screenshot server responded with status: {response.status_code}")
            return False
    except requests.exceptions.ConnectionError:
        print("❌ Screenshot server is not running")
        print("\nTo start the screenshot server:")
        print("1. Open a new terminal")
        print("2. Navigate to the backend directory:")
        print("   cd pilot-replit-ux-craft/backend")
        print("3. Install dependencies (if not already done):")
        print("   pip install -r requirements.txt")
        print("4. Start the server:")
        print("   python run_screenshot_server.py")
        print("   # Or use: start_screenshot_server.bat (Windows)")
        print("   # Or use: ./start_screenshot_server.sh (Unix)")
        print("\nThe server will be available at: http://localhost:8001")
        return False
    except Exception as e:
        print(f"❌ Error checking screenshot server: {e}")
        return False

if __name__ == "__main__":
    print("🔍 Checking Screenshot API Server...")
    print("=" * 50)
    
    is_running = check_screenshot_server()
    
    if is_running:
        print("\n🎉 You're all set! The screenshot functionality will work.")
        print("   You can now use the 'Analyze' button on the home page.")
    else:
        print("\n⚠️  Screenshot functionality will not work until the server is started.")
        print("   The analysis will still work, but screenshots won't be captured.")
    
    print("=" * 50) 