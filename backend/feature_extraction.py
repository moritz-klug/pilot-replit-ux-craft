import os
import json
import requests
from fastapi import HTTPException, Request
from fastapi.responses import StreamingResponse

async def extract_features_logic(request: Request):
    """
    Main function to handle feature extraction requests.
    This is the function that main.py imports and calls.
    """
    print("[DEBUG] ===== extract_features_logic started =====")
    try:
        print("[DEBUG] About to parse request body...")
        body = await request.json()
        print(f"[DEBUG] Request body parsed: {body}")
        print(f"[DEBUG] Request body type: {type(body)}")
        
        print("[DEBUG] About to call build_openrouter_payload...")
        result = build_openrouter_payload(body)
        print(f"[DEBUG] build_openrouter_payload returned: {type(result)}")
        print(f"[DEBUG] Result content (first 500 chars): {str(result)[:500]}")
        
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

def build_openrouter_payload(body, screenshot_image_url=None):
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
    stream = body.get("stream", False)
    print(f"[DEBUG] OpenRouter URL: {url}")
    print(f"[DEBUG] Stream mode: {stream}")
    
    print("[DEBUG] Building OpenRouter payload...")
    openrouter_payload = {
        "model": "deepseek/deepseek-chat-v3-0324:free", # anthropic/claude-3.7-sonnet
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
                        "text": f"You are a Website Feature Extraction AI that analyzes websites and identifies distinct UI/UX features, outputting structured JSON data.\n\n**TASK:** Analyze this website: {website_url}\n\n**TOOL TO USE:** \n- Use the \"Airtop\" tool to browse and scrape the website content\n\n**WHAT CONSTITUTES A FEATURE:**\n✅ VALID FEATURES (extract these):\n- Hero section\n- Navigation bar/menu\n- Testimonials section\n- About us section\n- Contact form\n- Footer\n- Product showcase\n- Pricing tables\n- Call-to-action sections\n- Blog/news sections\n- Team/staff sections\n- FAQ sections\n- Search functionality\n- Login/signup areas\n\n❌ NOT FEATURES (ignore these):\n- Individual buttons\n- Single testimonial cards\n- Individual images\n- Specific text blocks\n- Logo alone\n- Single form fields\n\n**ANALYSIS PROCESS:**\n1. Scan the entire webpage systematically\n2. Identify each distinct feature section\n3. For each feature, ask: \"Is this a complete functional/visual section or just a component within a larger section?\"\n4. Extract comprehensive details about each feature's appearance and functionality\n5. Synthesize higher‑level insights:\n   - BusinessContext (offering, value proposition, KPIs)\n   - TargetAudience & UserGoals\n   - NavigationStructure / site IA\n   - Responsiveness & Accessibility observations\n   - BrandIdentity (logo URL, colors, typography, design tone)\n   - CompanyOverview (name, employee count, industry, HQ, founded year, external links)\n6. Assemble the final JSON exactly in the format below.\n\n**OUTPUT FORMAT:**\nReturn a JSON array where each feature is an object with exactly these keys:\n\n```json\n[\n  \"websiteFeatures\": [\n    {{\n      \"featureName\": \"Clear, descriptive name of the feature\",\n      \"detailedDescription\": \"Extremely detailed description including: layout position, color scheme (specific colors/hex codes if visible), typography details, spacing, visual hierarchy, interactive elements, content type, styling (shadows, borders, gradients), responsive behavior if observable, and any unique design elements. Be as comprehensive as possible.\",\n      \"htmlStructure\": \"Cleaned HTML structure of the section. It must exact and accurate copy.\",\n      \"cssProperties\": \"All relevant css styles: layout, spacing rules, typography, colors, media queries, hover/focus states, animations, inherited css properties with values, url for any assets\"\n    }}\n    /* …repeat for each feature… */\n  ],\n  \"siteUXArchitecture\": {{\n    \"businessContext\": \"What is the business offering? Value proposition? KPIs or goals?\",\n    \"targetAudience\": \"Key user groups, their goals, digital habits, pain points.\",\n    \"userGoals\": \"What are users trying to accomplish on this site?\",\n    \"navigationStructure\": \"Describe menu structure, page hierarchy, user flow.\",\n    \"responsiveness\": \"How well is the UX adapted across screen sizes?\",\n    \"accessibilityObservations\": \"Contrast, ARIA, keyboard support, alt text, etc.\"\n  }},\n  \"brandIdentity\": {{\n    \"logoUrl\": \"URL of the company logo (if visible or discoverable)\",\n    \"dominantColorPalette\": [\"#HEX\", \"#HEX\", \"...\"],\n    \"typographyStyles\": \"Fonts, weights, spacing, heading logic\",\n    \"designTone\": \"Describe tone: minimalist, playful, luxurious, corporate, etc.\"\n  }},\n  \"companyOverview\": {{\n    \"companyName\": \"If identified\",\n    \"employeeCount\": \"Rough estimate from LinkedIn/Crunchbase if accessible\",\n    \"industry\": \"Tech, fashion, SaaS, etc.\",\n    \"headquartersLocation\": \"City/country if available\",\n    \"foundedYear\": \"—\",\n    \"externalLinks\": {{\n      \"LinkedIn\": \"—\",\n      \"Crunchbase\": \"—\"\n    }}\n  }}\n]\n```\n\nQUALITY CHECK:\nBefore finalizing, verify:\n- Have I identified ALL major website sections?\n- Are my descriptions detailed enough to recreate the feature?\n- Did I avoid listing individual components as separate features?\n- Is my JSON properly formatted?\n- Are there all the css properties and values related to the UI section and UI elements and components within the identified UI section?\n- Is the html structure fully copied?\n- Is businessContext clearly articulated?\n- Are targetAudience and userGoals realistic and specific?\n- Does navigationStructure reflect actual menus & flows?\n- Are responsiveness and accessibility notes concrete (e.g., breakpoints, contrast ratios)?\n- Are logo URL, color palette, typography, and design tone captured accurately?\n- Are company name, industry, and employee count present or marked \"—\" if truly undiscoverable?\n- Are external links provided when available?\n- Is the JSON valid, properly formatted, and matches the schema above?\n\nEXAMPLE OUTPUT:\njson {{\n  \"websiteFeatures\": [{{\n    \"featureName\": \"Hero Section\",\n    \"detailedDescription\": \"Large full-width banner at the top with a dark blue gradient background (#1a237e to #3949ab). Features a centered white headline in bold sans-serif font (approximately 48px), followed by a smaller gray subtitle (16px). Contains a prominent orange call-to-action button (#ff9800) with rounded corners and subtle drop shadow. Background includes a subtle geometric pattern overlay. Section height spans approximately 80vh with content vertically centered.\",\n    \"htmlStructure\": \"<section class=\\\"hero-section\\\">\\n  <div class=\\\"content-wrapper\\\">\\n    <h2 class=\\\"hero-title\\\">iPhone 15 Pro</h2>\\n    <p class=\\\"hero-subtitle\\\">Titanium. So strong. So light. So Pro.</p>\\n    <div class=\\\"cta-buttons\\\">\\n      <a href=\\\"/iphone-15-pro/\\\" class=\\\"cta-link\\\">Learn more</a>\\n      <a href=\\\"/shop/buy-iphone/iphone-15-pro\\\" class=\\\"cta-link\\\">Buy</a>\\n    </div>\\n  </div>\\n  <div class=\\\"hero-image-wrapper\\\">\\n    <img src=\\\"/v/iphone-15-pro/a/images/overview/hero/hero_static__e6khcva4hkeq_large.jpg\\\" alt=\\\"iPhone 15 Pro\\\" />\\n  </div>\\n</section>\",\n    \"cssProperties\": \"/* Hero container */\\n.hero-section {{\\n  display: flex;\\n  flex-direction: column;\\n  align-items: center;\\n  justify-content: center;\\n  height: 100vh;\\n  padding: 60px 20px;\\n  background-color: #ffffff; /* or #000000 depending on theme */\\n  color: #000000; /* or #ffffff depending on theme */\\n  text-align: center;\\n}}\\n\\n/* Typography */\\n.hero-title {{\\n  font-family: -apple-system, BlinkMacSystemFont, 'San Francisco', sans-serif;\\n  font-size: 3.5rem;\\n  font-weight: 600;\\n  margin: 0;\\n}}\\n.hero-subtitle {{\\n  font-size: 1.25rem;\\n  font-weight: 400;\\n  margin-top: 10px;\\n}}\\n\\n/* CTA buttons */\\n.cta-buttons {{\\n  display: flex;\\n  gap: 20px;\\n  margin-top: 25px;\\n}}\\n.cta-link {{\\n  font-size: 1rem;\\n  color: #0071e3;\\n  text-decoration: none;\\n  border-bottom: 1px solid transparent;\\n  transition: border 0.3s ease;\\n}}\\n.cta-link:hover {{\\n  border-bottom: 1px solid #0071e3;\\n}}\\n.cta-link:focus {{\\n  outline: 2px solid #0071e3;\\n  outline-offset: 2px;\\n}}\\n\\n/* Hero image */\\n.hero-image-wrapper img {{\\n  max-width: 100%;\\n  height: auto;\\n  margin-top: 30px;\\n}}\\n\\n/* Responsive behavior */\\n@media (max-width: 768px) {{\\n  .hero-title {{\\n    font-size: 2.25rem;\\n  }}\\n  .hero-subtitle {{\\n    font-size: 1rem;\\n  }}\\n  .cta-buttons {{\\n    flex-direction: column;\\n    gap: 10px;\\n  }}\\n}}\"\n  }}]\n}}\n\nAnalyze the website thoroughly and provide the most detailed feature extraction possible."
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
    print(f"[DEBUG] Headers prepared: {list(headers.keys())}")
    
    if stream:
        print("[DEBUG] Stream mode enabled - using streaming response")
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
        print("[DEBUG] Non-stream mode - making direct API call")
        try:
            print("[DEBUG] About to send POST request to OpenRouter...")
            print(f"[DEBUG] URL: {url}")
            print(f"[DEBUG] Payload size: {len(json.dumps(openrouter_payload))} characters")
            
            resp = requests.post(url, json=openrouter_payload, headers=headers)
            print(f"[DEBUG] OpenRouter response status: {resp.status_code}")
            print(f"[DEBUG] OpenRouter response headers: {dict(resp.headers)}")
            print(f"[DEBUG] OpenRouter response text length: {len(resp.text)}")
            print(f"[DEBUG] OpenRouter response text (first 500 chars): {resp.text[:500]}")
            
            if resp.status_code != 200:
                print(f"[DEBUG] OpenRouter error response: {resp.text}")
                raise HTTPException(status_code=resp.status_code, detail=resp.text)
            
            if not resp.text:
                print("[DEBUG] Empty response from OpenRouter!")
                raise HTTPException(status_code=500, detail="Empty response from upstream service")
            
            try:
                print("[DEBUG] About to parse JSON response...")
                data = resp.json()
                print(f"[DEBUG] JSON parsed successfully. Keys: {list(data.keys()) if isinstance(data, dict) else 'Not a dict'}")
            except Exception as e:
                print(f"[DEBUG] Failed to parse JSON from OpenRouter: {e}")
                print(f"[DEBUG] Raw response text: {resp.text}")
                raise HTTPException(status_code=500, detail="Invalid JSON from upstream service")
            
            print("[DEBUG] About to extract content from response...")
            content_str = data["choices"][0]["message"]["content"]
            print(f"[DEBUG] Content string length: {len(content_str)}")
            print(f"[DEBUG] Content string (first 500 chars): {content_str[:500]}")
            
            try:
                print("[DEBUG] About to extract JSON from markdown response...")
                # OpenRouter returns markdown with JSON in code blocks, so we need to extract the JSON
                import re
                
                # Try to find JSON code blocks in the response
                json_pattern = r'```(?:json)?\s*(\{[\s\S]*?\})\s*```'
                json_match = re.search(json_pattern, content_str)
                
                if json_match:
                    print("[DEBUG] Found JSON code block in markdown response")
                    json_content = json_match.group(1)
                    print(f"[DEBUG] Extracted JSON content (first 500 chars): {json_content[:500]}")
                    content_json = json.loads(json_content)
                else:
                    print("[DEBUG] No JSON code block found, trying to parse entire content as JSON")
                    # Fallback: try to parse the entire content as JSON
                    content_json = json.loads(content_str)
                
                print(f"[DEBUG] Content JSON parsed successfully. Type: {type(content_json)}")
                if isinstance(content_json, dict):
                    print(f"[DEBUG] Content JSON keys: {list(content_json.keys())}")
                elif isinstance(content_json, list):
                    print(f"[DEBUG] Content JSON is a list with {len(content_json)} items")
            except Exception as e:
                print(f"[DEBUG] Failed to parse content as JSON: {e}")
                print(f"[DEBUG] Content string that failed to parse: {content_str}")
                raise HTTPException(status_code=500, detail=f"Failed to parse content as JSON: {e}")
            
            print("[DEBUG] ===== build_openrouter_payload completed successfully =====")
            return content_json
        except Exception as e:
            print(f"[DEBUG] ===== ERROR in build_openrouter_payload =====")
            print(f"[DEBUG] Exception type: {type(e)}")
            print(f"[DEBUG] Exception message: {str(e)}")
            import traceback
            print(f"[DEBUG] Full traceback:")
            traceback.print_exc()
            print("[DEBUG] ===== END ERROR =====")
            raise 