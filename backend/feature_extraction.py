import os
import json
import requests
import base64
from fastapi import HTTPException, Request
from fastapi.responses import StreamingResponse
from dotenv import load_dotenv

def detect_sections_with_cv(screenshot_path):
    """Stub for computer vision section detection"""
    print(f"[Backend] CV fallback not implemented yet for {screenshot_path}")
    return []

def validate_and_fix_bounding_boxes(sections):
    """Stub for bounding box validation"""
    print("[Backend] Bounding box validation not implemented yet")
    return sections

async def extract_bounding_boxes_only(screenshot_url: str, sections: list, website_url: str):
    """
    Use vision model to detect actual bounding boxes from screenshot
    """
    print(f"[Backend] Starting vision model bounding box detection for {len(sections)} features")
    
    load_dotenv()
    api_key = os.getenv("OPENROUTER_API_KEY")
    if not api_key:
        print("[Backend] No OPENROUTER_API_KEY found!")
        return []
    
    url = "https://openrouter.ai/api/v1/chat/completions"
    
    # Create a focused prompt for bounding box detection
    feature_names = [section.get('featureName', f'Feature {i+1}') for i, section in enumerate(sections)]
    feature_list = '\n'.join([f"- {name}" for name in feature_names])
    
    bounding_box_prompt = (
        f"You are a computer vision expert analyzing a website screenshot from {website_url}.\n\n"
        
        "🎯 TASK: Look at this screenshot and provide PRECISE bounding box coordinates for each feature listed below.\n\n"
        
        f"FEATURES TO LOCATE:\n{feature_list}\n\n"
        
        "📐 COORDINATE REQUIREMENTS:\n"
        "- Provide x, y, width, height as percentages (0-100)\n"
        "- x,y = TOP-LEFT corner of each element\n"
        "- Be precise based on visual inspection of the screenshot\n"
        "- Headers typically: y=0-15%, height=10-15%\n"
        "- Hero/main content: y=15-60%, height=20-50%\n"
        "- Footer sections: y=80-100%, height=10-20%\n\n"
        
        "🔍 ANALYSIS METHOD:\n"
        "1. Carefully examine the screenshot\n"
        "2. Identify each feature by its visual characteristics\n"
        "3. Measure its position and size relative to the full page\n"
        "4. Provide coordinates as percentages\n\n"
        
        "Return ONLY a JSON object with this exact format:\n"
        "{\n"
        '  "bounding_boxes": [\n'
        '    {"featureName": "Header Navigation", "x": 0, "y": 0, "width": 100, "height": 12},\n'
        '    {"featureName": "Hero Section", "x": 0, "y": 15, "width": 100, "height": 45}\n'
        "  ]\n"
        "}\n\n"
        
        "Focus ONLY on precise coordinate detection based on what you can see in the image."
    )
    
    # Build message with screenshot
    message_content = [{"type": "text", "text": bounding_box_prompt}]
    
    # Add screenshot to message
    if screenshot_url:
        if "localhost" in screenshot_url:
            # Handle localhost screenshots by converting to base64
            try:
                import requests
                import base64
                from PIL import Image
                import io
                
                # Download the screenshot
                response = requests.get(screenshot_url)
                if response.ok:
                    # Compress for vision model
                    image = Image.open(io.BytesIO(response.content))
                    image.thumbnail((1280, 720), Image.Resampling.LANCZOS)
                    
                    buffer = io.BytesIO()
                    image.convert('RGB').save(buffer, format='JPEG', quality=85)
                    buffer.seek(0)
                    
                    screenshot_b64 = base64.b64encode(buffer.getvalue()).decode('utf-8')
                    image_data_url = f"data:image/jpeg;base64,{screenshot_b64}"
                    
                    message_content.append({
                        "type": "image_url", 
                        "image_url": {"url": image_data_url}
                    })
                    print(f"[Backend] Added compressed screenshot for vision analysis")
                else:
                    print(f"[Backend] Failed to download screenshot: {response.status_code}")
                    return []
            except Exception as e:
                print(f"[Backend] Failed to process screenshot: {e}")
                return []
        else:
            # External URL - can be used directly
            message_content.append({
                "type": "image_url", 
                "image_url": {"url": screenshot_url}
            })
    
    # Vision model payload
    payload = {
        "model": "openai/gpt-4o",  # Vision-capable model
        "messages": [{"role": "user", "content": message_content}],
        "response_format": {"type": "json_object"}
    }
    
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }
    
    try:
        print("[Backend] Requesting bounding box coordinates from vision model...")
        resp = requests.post(url, json=payload, headers=headers)
        print(f"[Backend] Vision model response status: {resp.status_code}")
        
        if resp.status_code != 200:
            print(f"[Backend] Vision model request failed: {resp.text}")
            return []
        
        result = resp.json()
        content = result["choices"][0]["message"]["content"]
        print(f"[Backend] Vision model response: {content}")
        
        coordinates_data = json.loads(content)
        
        # Extract bounding boxes from response
        if isinstance(coordinates_data, dict) and 'bounding_boxes' in coordinates_data:
            coordinates = coordinates_data['bounding_boxes']
        elif isinstance(coordinates_data, list):
            coordinates = coordinates_data
        else:
            print(f"[Backend] Unexpected response format: {coordinates_data}")
            return []
        
        print(f"[Backend] Successfully received {len(coordinates)} bounding box coordinates from vision model")
        return coordinates
        
    except Exception as e:
        print(f"[Backend] Vision model bounding box detection failed: {e}")
        return []

async def extract_features_logic(request: Request):
    """
    Main function to handle feature extraction requests.
    This is the function that main.py imports and calls.
    Uses 3-phase analysis: text → screenshot → vision model bounding boxes
    """
    print("[DEBUG] ===== extract_features_logic started =====")
    try:
        load_dotenv()
        print("[DEBUG] About to parse request body...")
        body = await request.json()
        print(f"[DEBUG] Request body parsed: {body}")
        print(f"[DEBUG] Request body type: {type(body)}")
        
        website_url = body.get("url")
        
        # PHASE 1: Text-only feature extraction
        print("[DEBUG] PHASE 1: Starting text-only feature extraction...")
        result = await build_openrouter_payload(body)
        print(f"[DEBUG] Phase 1 complete. Extracted {len(result.get('websiteFeatures', []))} features")
        
        # PHASE 2: Generate screenshot 
        print("[DEBUG] PHASE 2: Generating screenshot...")
        screenshot_url = None
        try:
            screenshot_response = requests.post("http://localhost:8001/screenshot", 
                json={"url": website_url, "full_page": True, "hide_popups": True}, 
                timeout=30)
            if screenshot_response.ok:
                screenshot_id = screenshot_response.json().get("screenshot_id")
                screenshot_url = f"http://localhost:8001/screenshot/{screenshot_id}"
                
                # Wait for screenshot to be ready
                import time
                for i in range(30):  # Wait up to 30 seconds
                    try:
                        check_response = requests.get(screenshot_url, timeout=5)
                        if check_response.ok:
                            print(f"[DEBUG] Screenshot ready: {screenshot_url}")
                            break
                    except:
                        pass
                    time.sleep(1)
                else:
                    print("[DEBUG] Screenshot timeout")
                    screenshot_url = None
            else:
                print(f"[DEBUG] Screenshot request failed: {screenshot_response.text}")
        except Exception as e:
            print(f"[DEBUG] Screenshot generation failed: {e}")
        
        # PHASE 3: Vision model bounding box detection
        if screenshot_url and result.get('websiteFeatures'):
            print("[DEBUG] PHASE 3: Starting vision model bounding box detection...")
            try:
                bounding_boxes = await extract_bounding_boxes_only(
                    screenshot_url, 
                    result['websiteFeatures'], 
                    website_url
                )
                
                if bounding_boxes:
                    print(f"[DEBUG] Vision model returned {len(bounding_boxes)} bounding boxes")
                    
                    # Merge bounding boxes with features
                    features_with_boxes = []
                    for feature in result['websiteFeatures']:
                        feature_name = feature.get('featureName', '')
                        
                        # Find matching bounding box (case-insensitive)
                        matching_box = None
                        for bbox in bounding_boxes:
                            bbox_name = bbox.get('featureName', '').lower().strip()
                            feature_name_clean = feature_name.lower().strip()
                            
                            if (bbox_name == feature_name_clean or 
                                bbox_name in feature_name_clean or 
                                feature_name_clean in bbox_name):
                                matching_box = bbox
                                break
                        
                        if matching_box:
                            feature['bounding_box'] = {
                                'x': matching_box.get('x', 0),
                                'y': matching_box.get('y', 0),
                                'width': matching_box.get('width', 100),
                                'height': matching_box.get('height', 20)
                            }
                            print(f"[DEBUG] ✅ Added vision-detected bounding box to '{feature_name}': {feature['bounding_box']}")
                        else:
                            print(f"[DEBUG] ❌ No vision bounding box found for '{feature_name}'")
                        
                        features_with_boxes.append(feature)
                    
                    result['websiteFeatures'] = features_with_boxes
                    print(f"[DEBUG] Successfully merged vision model bounding boxes")
                else:
                    print("[DEBUG] No bounding boxes received from vision model")
            except Exception as e:
                print(f"[DEBUG] Vision model bounding box detection failed: {e}")
                import traceback
                traceback.print_exc()
        else:
            print("[DEBUG] Skipping vision model phase (no screenshot or features)")
        
        print("[DEBUG] ===== extract_features_logic completed successfully =====")
        return result
    except Exception as e:
        print(f"[DEBUG] ===== ERROR in extract_features_logic =====")
        print(f"[DEBUG] Exception type: {type(e)}")
        print(f"[DEBUG] Exception message: {str(e)}")
        import traceback
        print(f"[DEBUG] Full traceback:")
        traceback.print_exc()
        print("[DEBUG] ===== END ERROR =====")
        raise HTTPException(status_code=500, detail=str(e))

async def build_openrouter_payload(body, screenshot_image_url=None):
    print("[DEBUG] ===== build_openrouter_payload started =====")
    print(f"[DEBUG] Input body: {body}")
    print(f"[DEBUG] Input body type: {type(body)}")
    
    website_url = body.get("url", "https://www.apple.com")
    print(f"[DEBUG] Website URL: {website_url}")
    
    api_key = os.getenv("OPENROUTER_API_KEY")
    print(f"[DEBUG] API key present: {api_key is not None}")
    print(f"[DEBUG] API key starts with 'sk-': {api_key.startswith('sk-') if api_key else 'N/A'}")
    
    if not api_key:
        print("[DEBUG] ERROR: OpenRouter API key not configured")
        raise HTTPException(status_code=500, detail="OpenRouter API key not configured")
    
    url = "https://openrouter.ai/api/v1/chat/completions"
    print("[Backend] Processing body:", body)
    website_url = body.get("url")
    use_screenshot = body.get("screenshot", False)
    print("[Backend] use_screenshot value:", use_screenshot)
    stream = False  # Always use non-streaming mode for OpenRouter
    
    # Validate and normalize website_url
    if not website_url or not isinstance(website_url, str):
        print("[Backend] Invalid or missing 'url' for screenshot:", website_url)
        raise HTTPException(status_code=400, detail="Invalid or missing 'url' for screenshot.")
    if not (website_url.startswith("http://") or website_url.startswith("https://")):
        website_url = "https://" + website_url
        body["url"] = website_url

    print("[Backend] Starting 2-phase analysis: Text-only first, then bounding boxes")
    print(f"[Backend] Screenshot coordination status: {body.get('screenshot_coordination_success', False)}")
    
    # Get screenshot for bounding box analysis (if needed)
    screenshot_b64 = None
    screenshot_path = None  
    screenshot_url = None
    screenshot_id = None
    
    # Check if screenshot was already coordinated by main.py
    screenshot_coordination_success = body.get('screenshot_coordination_success', False)
    if screenshot_coordination_success:
        print("[Backend] ✅ Using pre-coordinated screenshot from main.py")
        screenshot_id = body.get('screenshot_id')
        screenshot_path = body.get('screenshot_path') 
        screenshot_url = body.get('screenshot_url')
        print(f"[Backend] Pre-coordinated screenshot: ID={screenshot_id}, URL={screenshot_url}")
        
        # Verify the pre-coordinated screenshot is actually ready
        if screenshot_path and os.path.exists(screenshot_path) and os.path.getsize(screenshot_path) > 0:
            print(f"[Backend] ✅ Pre-coordinated screenshot verified: {screenshot_path}")
        else:
            print(f"[Backend] ⚠️ Pre-coordinated screenshot not found, will request new one")
            screenshot_coordination_success = False
            # Reset variables for new request
            screenshot_id = None
            screenshot_path = None
            screenshot_url = None
    
    if use_screenshot and not screenshot_coordination_success:
        try:
            print("[Backend] Requesting screenshot for bounding box analysis...")
            screenshot_response = requests.post("http://localhost:8001/screenshot", 
                json={"url": website_url, "full_page": True, "hide_popups": True}, 
                timeout=30)
            if screenshot_response.ok:
                screenshot_id = screenshot_response.json().get("screenshot_id")
                print(f"[Backend] Screenshot requested with ID: {screenshot_id}")
                
                # Wait for screenshot to be ready and get the image
                import time
                screenshots_dir = os.path.join(os.path.dirname(__file__), 'screenshots')
                print(f"[Backend] Screenshots directory: {screenshots_dir}")
                print(f"[Backend] Directory exists: {os.path.exists(screenshots_dir)}")
                
                pattern = f'_{screenshot_id}.png'
                print(f"[Backend] Looking for files ending with: {pattern}")
                
                screenshot_ready = False
                for i in range(45):  # Increased to 45 seconds
                    try:
                        if not os.path.exists(screenshots_dir):
                            print(f"[Backend] Screenshots directory doesn't exist: {screenshots_dir}")
                            time.sleep(1)
                            continue
                            
                        files_in_dir = os.listdir(screenshots_dir)
                        matching_files = [f for f in files_in_dir if f.endswith(pattern)]
                        
                        if i % 5 == 0:  # Log every 5 seconds
                            print(f"[Backend] Attempt {i+1}/45: Found {len(files_in_dir)} files in screenshots_dir")
                            print(f"[Backend] Looking for pattern: {pattern}")
                            print(f"[Backend] Matching files: {matching_files}")
                        
                        if matching_files:
                            potential_screenshot_path = os.path.join(screenshots_dir, matching_files[0])
                            
                            # Check if file is fully written by testing file size stability
                            try:
                                stat1 = os.stat(potential_screenshot_path)
                                time.sleep(0.5)  # Wait half a second
                                stat2 = os.stat(potential_screenshot_path)
                                
                                # If file size is stable and > 0, consider it ready
                                if stat1.st_size == stat2.st_size and stat1.st_size > 0:
                                    screenshot_path = potential_screenshot_path
                                    screenshot_url = f"http://localhost:8001/screenshot/{screenshot_id}"
                                    screenshot_ready = True
                                    print(f"[Backend] ✅ Screenshot ready at: {screenshot_path}")
                                    print(f"[Backend] File size: {stat1.st_size} bytes")
                                    break
                                else:
                                    print(f"[Backend] File size not stable yet: {stat1.st_size} -> {stat2.st_size}")
                            except OSError as e:
                                print(f"[Backend] Error checking file stability: {e}")
                                
                    except Exception as e:
                        print(f"[Backend] Error while waiting for screenshot: {e}")
                    
                    time.sleep(1)
                
                if not screenshot_ready:
                    print("[Backend] ❌ Screenshot not ready after 45 seconds, proceeding without visual analysis")
                    
                    # Try to check what files actually exist
                    try:
                        all_files = os.listdir(screenshots_dir) if os.path.exists(screenshots_dir) else []
                        print(f"[Backend] All files in screenshots dir: {all_files}")
                        recent_files = [f for f in all_files if screenshot_id in f]
                        print(f"[Backend] Files containing screenshot_id '{screenshot_id}': {recent_files}")
                    except Exception as e:
                        print(f"[Backend] Error listing directory: {e}")
            else:
                print(f"[Backend] Screenshot request failed: {screenshot_response.status_code} - {screenshot_response.text}")
        except Exception as e:
            print(f"[Backend] Screenshot failed: {e}, proceeding without visual analysis")
    
    # Prepare compressed image fallback if we have a valid screenshot (either pre-coordinated or newly requested)
    if screenshot_path and os.path.exists(screenshot_path) and "localhost" in (screenshot_url or ""):
        print("[Backend] Preparing compressed image fallback for bounding box detection")
        try:
            from PIL import Image
            import io
            
            # Compress image for smaller base64
            with Image.open(screenshot_path) as img:
                # Resize to smaller dimensions for analysis
                img.thumbnail((1280, 720), Image.Resampling.LANCZOS)
                
                # Save as JPEG with compression
                buffer = io.BytesIO()
                img.convert('RGB').save(buffer, format='JPEG', quality=85)
                buffer.seek(0)
                
                screenshot_b64 = base64.b64encode(buffer.getvalue()).decode('utf-8')
                print(f"[Backend] Compressed image size: {len(screenshot_b64)} characters")
        except ImportError:
            print("[Backend] PIL not available, skipping compression")
        except Exception as e:
            print(f"[Backend] Image compression failed: {e}")
    
    detailed_prompt = (
    "You are an advanced UI/UX analyst and web expert. "
    f"Based on the website URL {website_url}, provide a comprehensive analysis of ALL typical website sections.\n\n"
    
    "🎯 ANALYZE THESE SECTIONS (extract ALL that are present):\n"
    "1. Header Navigation - Top navigation bar with menu items\n"
    "2. Hero Section - Main banner/intro area\n"
    "3. Services/Features - Product or service offerings\n"
    "4. About Section - Company/business information\n"
    "5. Testimonials - Customer reviews or social proof\n"
    "6. Contact/CTA - Contact information or call-to-action\n"
    "7. Footer - Bottom section with links/info\n\n"
    
    "IMPORTANT: Return ONLY a JSON object. Extract ALL relevant sections you can identify.\n\n"
    
    "Return JSON with this EXACT structure:\n"
    "{\n"
    '  "websiteFeatures": [\n'
    "    {\n"
    '      "featureName": "Header Navigation",\n'
    '      "detailedDescription": "Navigation bar description...",\n'
    '      "htmlStructure": "<header><nav>...</nav></header>",\n'
    '      "cssProperties": "CSS styling details..."\n'
    "    },\n"
    "    {\n"
    '      "featureName": "Hero Section",\n'
    '      "detailedDescription": "Main hero area description...",\n'
    '      "htmlStructure": "<section class=\\"hero\\">...</section>",\n'
    '      "cssProperties": "CSS styling details..."\n'
    "    },\n"
    "    {\n"
    '      "featureName": "Services Section",\n'
    '      "detailedDescription": "Services description...",\n'
    '      "htmlStructure": "<section class=\\"services\\">...</section>",\n'
    '      "cssProperties": "CSS styling details..."\n'
    "    }\n"
    "  ],\n"
    '  "siteUXArchitecture": {\n'
    '    "businessContext": "Business description...",\n'
    '    "targetAudience": "Target audience details...",\n'
    '    "userGoals": "What users want to achieve...",\n'
    '    "navigationStructure": "How the site is organized..."\n'
    "  }\n"
    "}\n\n"
    
    "Extract ALL relevant sections - typically 4-7 features per website."
    )

    # PHASE 1: Text-only analysis (cheap and fast)
    text_only_prompt = (
        "You are an advanced UI/UX analyst and business intelligence extractor. "
        f"Analyze the website {website_url} based on its content and provide a structured breakdown WITHOUT any visual analysis:\n\n"
        
        "1. Content Analysis & Feature Detection\n"
        "Based on typical website patterns, identify likely UI sections and their purposes.\n\n"
        
        "2. Per-Section Breakdown\n"
        "For each section provide:\n"
        "- name (descriptive of likely content)\n"
        "- elements (common UI components for this type of section)\n" 
        "- purpose (what this section likely achieves)\n"
        "- style (typical styling patterns)\n"
        "- mobile_behavior (how it would adapt)\n"
        "- image_crop_url (leave empty)\n\n"
        
        "Analyze these typical sections: Header Navigation, Hero Section, Services/Features, Testimonials, Contact/CTA, Footer.\n\n"
        
        "CRITICAL: Return ONLY the JSON object. Start directly with { and end with }. No other text."
    )
    
    print("[Backend] Building OpenRouter payload for:", website_url)
    openrouter_payload = {
        "model": "openai/gpt-4-turbo",
        "stream": False,
        "structured_outputs": True,
        "require_parameters": True,
        "reasoning": {
            "effort": "high",
            "exclude": True
        },
        "messages": [
            {
                "role": "user",
                "content": [
                    {
                        "type": "text",
                        "text": detailed_prompt
                    }
                ]
            }
        ]
    }
    print(f"[DEBUG] OpenRouter payload built successfully")
    print(f"[DEBUG] Payload keys: {list(openrouter_payload.keys())}")
    print(f"[DEBUG] Messages count: {len(openrouter_payload['messages'])}")
    
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }
    if stream:
        def event_stream():
            print("[Backend] Sending streaming request to OpenRouter...")
            with requests.post(url, json=openrouter_payload, headers=headers, stream=True) as r:
                for line in r.iter_lines():
                    if line:
                        decoded = line.decode()
                        print("[Backend] Stream chunk:", decoded)
                        if decoded.startswith("data: "):
                            data = decoded[6:]
                            if data == "[DONE]":
                                print("[Backend] Stream done.")
                                yield "event: done\ndata: [DONE]\n\n"
                                break
                            yield f"event: result\ndata: {data}\n\n"
                        elif decoded.startswith(":"):
                            yield f"event: progress\ndata: {json.dumps({'message': decoded})}\n\n"
        return StreamingResponse(event_stream(), media_type='text/event-stream')
    else:
        try:
            print("[Backend] Sending request to OpenRouter for text-only analysis...")
            resp = requests.post(url, json=openrouter_payload, headers=headers)
            print("[Backend] OpenRouter response status:", resp.status_code)
            print("[Backend] OpenRouter response text:", resp.text[:500])
            if resp.status_code != 200:
                print("[Backend] OpenRouter error:", resp.text)
                raise HTTPException(status_code=resp.status_code, detail=resp.text)
            if not resp.text:
                print("[Backend] Empty response from OpenRouter!")
                raise HTTPException(status_code=500, detail="Empty response from upstream service")
            try:
                data = resp.json()
            except Exception as e:
                print("[Backend] Failed to parse JSON from OpenRouter:", resp.text)
                raise HTTPException(status_code=500, detail="Invalid JSON from upstream service")
            content_str = data["choices"][0]["message"]["content"]
            print("[Backend] Content string from OpenRouter:", content_str[:500])
            try:
                content_json = json.loads(content_str)
            except Exception as e:
                print("[Backend] Failed to parse content as JSON:", content_str)
                raise HTTPException(status_code=500, detail=f"Failed to parse content as JSON: {e}")
            
            print("[Backend] Text-only analysis complete")
            print(f"[Backend] Current screenshot state: ID={screenshot_id}, URL={screenshot_url}, Path exists={screenshot_path and os.path.exists(screenshot_path) if screenshot_path else False}")
            
            # PHASE 2: Add bounding boxes if screenshot is available
            if use_screenshot and content_json.get('websiteFeatures'):
                print("[Backend] Starting Phase 2: Bounding box detection")
                
                # If we don't have a screenshot URL yet, try one more time to find it
                if not screenshot_url and screenshot_id:
                    print("[Backend] Attempting to find screenshot one more time...")
                    screenshots_dir = os.path.join(os.path.dirname(__file__), 'screenshots')
                    pattern = f'_{screenshot_id}.png'
                    
                    try:
                        files_in_dir = os.listdir(screenshots_dir) if os.path.exists(screenshots_dir) else []
                        matching_files = [f for f in files_in_dir if f.endswith(pattern)]
                        
                        if matching_files:
                            potential_screenshot_path = os.path.join(screenshots_dir, matching_files[0])
                            if os.path.exists(potential_screenshot_path) and os.path.getsize(potential_screenshot_path) > 0:
                                screenshot_path = potential_screenshot_path
                                screenshot_url = f"http://localhost:8001/screenshot/{screenshot_id}"
                                print(f"[Backend] 🔄 Found screenshot on retry: {screenshot_url}")
                    except Exception as e:
                        print(f"[Backend] Error during screenshot retry: {e}")
                
                if screenshot_url:
                    try:
                        bounding_boxes = await extract_bounding_boxes_only(screenshot_url, content_json['websiteFeatures'], website_url)
                        
                        if bounding_boxes:
                            print(f"[Backend] Successfully got {len(bounding_boxes)} bounding boxes")
                            print(f"[Backend] Bounding boxes received: {bounding_boxes}")
                            
                            # Merge bounding boxes with features
                            features_with_boxes = []
                            features_matched = 0
                            
                            for feature in content_json['websiteFeatures']:
                                feature_name = feature.get('featureName', '')
                                print(f"[Backend] Processing feature: '{feature_name}'")
                                
                                # Find matching bounding box (case-insensitive and fuzzy matching)
                                matching_box = None
                                best_match_score = 0
                                
                                for bbox in bounding_boxes:
                                    bbox_name = bbox.get('featureName', '').lower().strip()
                                    feature_name_clean = feature_name.lower().strip()
                                    
                                    # Try different matching strategies
                                    match_score = 0
                                    if bbox_name == feature_name_clean:
                                        match_score = 100  # Perfect match
                                    elif bbox_name in feature_name_clean or feature_name_clean in bbox_name:
                                        match_score = 80   # Partial match
                                    elif any(word in bbox_name for word in feature_name_clean.split() if len(word) > 2):
                                        match_score = 60   # Word match
                                    elif any(word in feature_name_clean for word in bbox_name.split() if len(word) > 2):
                                        match_score = 60   # Word match reverse
                                    
                                    if match_score > best_match_score:
                                        best_match_score = match_score
                                        matching_box = bbox
                                
                                if matching_box and best_match_score >= 60:  # Minimum 60% confidence
                                    feature['bounding_box'] = {
                                        'x': matching_box['x'],
                                        'y': matching_box['y'], 
                                        'width': matching_box['width'],
                                        'height': matching_box['height']
                                    }
                                    features_matched += 1
                                    print(f"[Backend] ✅ Added bounding box to feature '{feature_name}' (score: {best_match_score}): {feature['bounding_box']}")
                                else:
                                    print(f"[Backend] ❌ No matching bounding box found for feature: '{feature_name}' (best score: {best_match_score})")
                                
                                features_with_boxes.append(feature)
                            
                            content_json['websiteFeatures'] = features_with_boxes
                            print(f"[Backend] Final result: {features_matched}/{len(content_json['websiteFeatures'])} features have bounding boxes")
                        else:
                            print("[Backend] No bounding boxes received from AI, trying computer vision fallback")
                            # Apply computer vision fallback if no AI bounding boxes
                            if screenshot_path and os.path.exists(screenshot_path):
                                cv_features = detect_sections_with_cv(screenshot_path)
                                if cv_features:
                                    # Merge AI analysis with CV bounding boxes
                                    for i, cv_feature in enumerate(cv_features):
                                        if i < len(content_json['websiteFeatures']):
                                            content_json['websiteFeatures'][i]['bounding_box'] = cv_feature['bounding_box']
                                            print(f"[Backend] Applied CV bounding box to feature: {content_json['websiteFeatures'][i].get('featureName')}")
                    
                    except Exception as e:
                        print(f"[Backend] Bounding box detection failed: {e}")
                        import traceback
                        print(f"[Backend] Traceback: {traceback.format_exc()}")
                        # Continue without bounding boxes
                else:
                    print("[Backend] ⚠️ No screenshot available for bounding box detection")
                    # Store screenshot info for potential later use
                    if screenshot_id:
                        content_json['screenshot_id'] = screenshot_id
                        print(f"[Backend] Stored screenshot_id for later use: {screenshot_id}")
            
            # Apply validation to any existing bounding boxes
            if content_json.get('websiteFeatures'):
                print("[Backend] Applying bounding box validation...")
                content_json['websiteFeatures'] = validate_and_fix_bounding_boxes(content_json['websiteFeatures'])
                features_with_bboxes = len([f for f in content_json['websiteFeatures'] if 'bounding_box' in f])
                print(f"[Backend] Validation complete. {features_with_bboxes}/{len(content_json['websiteFeatures'])} features have bounding boxes")
                
            
            # ALWAYS include screenshot_id in response when available (for frontend display)
            if screenshot_id:
                content_json['screenshot_id'] = screenshot_id
                content_json['screenshot_url'] = f"http://localhost:8001/screenshot/{screenshot_id}"
                print(f"[Backend] ✅ Added screenshot info to response: ID={screenshot_id}")
            
            # ALWAYS include screenshot_id in response when available (for frontend display)
            if screenshot_id:
                content_json['screenshot_id'] = screenshot_id
                content_json['screenshot_url'] = f"http://localhost:8001/screenshot/{screenshot_id}"
                print(f"[Backend] ✅ Added screenshot info to response: ID={screenshot_id}")
            
            print("[Backend] Returning complete analysis")
            return content_json
        except Exception as e:
            print(f"[DEBUG] Failed to parse content as JSON: {e}")
            print(f"[DEBUG] Content string that failed to parse: {content_str}")
            raise HTTPException(status_code=500, detail=f"Failed to parse content as JSON: {e}")
