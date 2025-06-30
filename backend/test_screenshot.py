#!/usr/bin/env python3
"""
Test script for the Screenshot API Server (Playwright version)
"""

import requests
import time
import os

BASE_URL = "http://localhost:8001"
SCREENSHOT_ID = None # Global variable to hold the ID for tests

def test_health_check():
    """Test the health check endpoint"""
    print("Testing health check...")
    try:
        response = requests.get(f"{BASE_URL}/health", timeout=5)
        response.raise_for_status()
        print("✅ Health check passed")
        print(f"Response: {response.json()}")
        return True
    except requests.exceptions.RequestException as e:
        print(f"❌ Health check error: {e}")
        return False

def test_screenshot_creation():
    """Test taking a screenshot"""
    global SCREENSHOT_ID
    print("\nTesting screenshot creation...")
    try:
        payload = {
            "url": "https://www.apple.com/",
            "width": 1920,
            "height": 1080,
            "wait_time": 2,
            "full_page": True
        }
        
        response = requests.post(f"{BASE_URL}/screenshot", json=payload, timeout=10)
        response.raise_for_status()
        
        result = response.json()
        SCREENSHOT_ID = result.get("screenshot_id")

        if SCREENSHOT_ID:
            print("✅ Screenshot creation initiated successfully")
            print(f"Screenshot ID: {SCREENSHOT_ID}")
            print(f"URL: {result.get('url')}")
            # Wait for the background task to complete
            print("Waiting 20 seconds for screenshot to be generated...")
            time.sleep(30)
        else:
            print("❌ Screenshot creation failed: No screenshot_id in response")

    except requests.exceptions.RequestException as e:
        print(f"❌ Screenshot test error: {e}")
        if e.response:
            print(f"Response: {e.response.text}")

def test_get_screenshot():
    """Test getting a screenshot by ID"""
    if not SCREENSHOT_ID:
        print("\n⏩ Skipping get screenshot test (no ID)")
        return
        
    print(f"\nTesting get screenshot for ID: {SCREENSHOT_ID}")
    try:
        response = requests.get(f"{BASE_URL}/screenshot/{SCREENSHOT_ID}", timeout=5)
        response.raise_for_status()
        
        print("✅ Get screenshot successful")
        print(f"Content-Type: {response.headers.get('content-type')}")
        print(f"Content-Length: {response.headers.get('content-length')}")

    except requests.exceptions.RequestException as e:
        print(f"❌ Get screenshot failed: {e}")

def test_list_screenshots():
    """Test listing all screenshots"""
    print("\nTesting list screenshots...")
    try:
        response = requests.get(f"{BASE_URL}/screenshots", timeout=5)
        response.raise_for_status()

        result = response.json()
        screenshots = result.get("screenshots", [])
        print("✅ List screenshots successful")
        print(f"Found {len(screenshots)} screenshots")
        for filename in screenshots:
            print(f"  - {filename}")
            
    except requests.exceptions.RequestException as e:
        print(f"❌ List screenshots error: {e}")

def test_delete_screenshot():
    """Test deleting a screenshot by ID"""
    if not SCREENSHOT_ID:
        print("\n⏩ Skipping delete screenshot test (no ID)")
        return

    print(f"\nTesting delete screenshot for ID: {SCREENSHOT_ID}")
    try:
        response = requests.delete(f"{BASE_URL}/screenshot/{SCREENSHOT_ID}", timeout=5)
        response.raise_for_status()
        
        print(f"✅ Delete screenshot successful: {response.json().get('message')}")
        
        # Verify it's gone
        response = requests.get(f"{BASE_URL}/screenshot/{SCREENSHOT_ID}", timeout=5)
        if response.status_code == 404:
            print("✅ Screenshot verified as deleted (404 Not Found).")
        else:
            print(f"❌ Screenshot still exists after deletion (Status: {response.status_code}).")

    except requests.exceptions.RequestException as e:
        print(f"❌ Delete screenshot failed: {e}")

def main():
    """Run all tests"""
    print("🧪 Testing Screenshot API Server (Playwright)")
    print("=" * 40)
    
    if not test_health_check():
        print("\nServer is not running. Aborting tests.")
        return

    test_screenshot_creation()
    test_get_screenshot()
    test_list_screenshots()
    test_delete_screenshot()
    
    print("\n" + "=" * 40)
    print("🏁 Testing completed!")

if __name__ == "__main__":
    main() 