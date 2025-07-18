import os
import time
import json
import requests
from fastapi import HTTPException, Request
from dotenv import load_dotenv
from fastapi.responses import StreamingResponse

def build_openrouter_payload(body, screenshot_image_url=None):
    openrouter_payload = body.copy()
    if screenshot_image_url and openrouter_payload.get("messages"):
        if isinstance(openrouter_payload["messages"], list) and len(openrouter_payload["messages"]) > 0:
            content = openrouter_payload["messages"][0].get("content", [])
            if isinstance(content, list):
                content.append({"type": "image_url", "image_url": {"url": screenshot_image_url}})
                openrouter_payload["messages"][0]["content"] = content
    return openrouter_payload

async def extract_features_logic(request: Request):
    load_dotenv()
    api_key = os.getenv("OPENROUTER_API_KEY")
    if not api_key:
        print("[Backend] No OPENROUTER_API_KEY found!")
        raise HTTPException(status_code=500, detail="OPENROUTER_API_KEY not set in .env")
    url = "https://openrouter.ai/api/v1/chat/completions"
    body = await request.json()
    print("[Backend] Received request body:", body)
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

    # Build the OpenRouter payload as in the working Postman/main-v2.py example
    full_schema = {
        "name": "ui_ux_site_analysis",
        "strict": True,
        "schema": {
            "type": "object",
            "properties": {
                "url": {"type": "string", "description": "The full URL of the website analyzed"},
                "visual_analysis": {
                    "type": "object",
                    "properties": {
                        "ui_sections": {"type": "array", "items": {"type": "string"}, "description": "List of UI section names in order of appearance"}
                    },
                    "required": ["ui_sections"],
                    "additionalProperties": False
                },
                "sections": {
                    "type": "array",
                    "description": "List of cropped UI sections with detailed analysis",
                    "items": {
                        "type": "object",
                        "properties": {
                            "name": {"type": "string", "description": "Section name"},
                            "elements": {"type": "array", "items": {"type": "string"}},
                            "purpose": {"type": "string"},
                            "style": {
                                "type": "object",
                                "properties": {
                                    "fonts": {"type": "string"},
                                    "colors": {"type": "string"},
                                    "layout": {"type": "string"},
                                    "interactions": {"type": "string"},
                                    "css_properties": {"type": "object", "description": "Raw CSS properties used in this section", "additionalProperties": False}
                                },
                                "required": ["fonts", "colors", "layout", "interactions", "css_properties"],
                                "additionalProperties": False
                            },
                            "mobile_behavior": {"type": "string"},
                            "image_crop_url": {"type": "string", "description": "Image URL of the cropped UI section"}
                        },
                        "required": ["name", "elements", "purpose", "style", "mobile_behavior", "image_crop_url"],
                        "additionalProperties": False
                    }
                },
                "global_design_summary": {
                    "type": "object",
                    "properties": {
                        "typography": {"type": "string"},
                        "colors": {"type": "string"},
                        "buttons": {"type": "string"},
                        "layout": {"type": "string"},
                        "icons": {"type": "string"},
                        "css_properties": {"type": "object", "description": "CSS properties applied globally (e.g., body, :root, html)", "additionalProperties": False}
                    },
                    "required": ["typography", "colors", "buttons", "layout", "icons", "css_properties"],
                    "additionalProperties": False
                },
                "ux_architecture": {
                    "type": "object",
                    "properties": {
                        "page_flow": {"type": "string"},
                        "emotional_strategy": {"type": "string"},
                        "conversion_points": {"type": "string"},
                        "design_trends": {"type": "string"}
                    },
                    "required": ["page_flow", "emotional_strategy", "conversion_points", "design_trends"],
                    "additionalProperties": False
                },
                "business_analysis": {
                    "type": "object",
                    "properties": {
                        "summary": {"type": "string"},
                        "business_type": {"type": "string"},
                        "target_audience": {"type": "string"},
                        "keywords": {"type": "array", "items": {"type": "string"}}
                    },
                    "required": ["summary", "business_type", "target_audience", "keywords"],
                    "additionalProperties": False
                }
            },
            "required": ["url", "visual_analysis", "sections", "global_design_summary", "ux_architecture", "business_analysis"],
            "additionalProperties": False
        }
    }
    detailed_prompt = (
        "You are an advanced UI/UX analyst, visual design expert, and business intelligence extractor. "
        f"Given the screenshot and/or webpage - {website_url}, analyze the entire website UI using this flow:\n\n"
        "1. Visual Analysis & Cropping\nDetect distinct UI sections and label them clearly.\nReturn image_crop_url per section (use the provided image as source).\n\n"
        "2. Detailed Per-Section Structured Breakdown\nFor each section:\n- name\n- elements\n- purpose\n- Under style, return actual CSS property-value mappings (e.g., font-size: 36px, background-color: #ffffff, padding: 2rem). Use a css_properties object where keys are CSS property names and values are the actual values as seen in the design.\n- mobile_behavior\n- image_crop_url\n\n"
        "3. Detailed Global Design System Summary\nInclude css styles, return actual CSS property-value mappings (e.g., font-size: 36px, background-color: #ffffff, padding: 2rem). Use a css_properties object where keys are CSS property names and values are the actual values as seen in the design.\n\n"
        "4. Detailed UX Architecture & Interaction Patterns\nExplain the site journey, emotional strategy, conversion points, and design trends.\n\n"
        "5. Detailed Business & Audience Analysis\nWhat is the site about? Business type? Target audience? Extract 10–20 keywords from hero, menu, services, etc.\n\n"
        "Only return response in json_schema given in the response format."
    )
    print("[Backend] Building OpenRouter payload for:", website_url)
    openrouter_payload = {
        "model": "mistralai/mistral-small-3.2-24b-instruct:free",
        "stream": False,
        "structured_outputs": True,
        "require_parameters": True,
        "response_format": {"type": "json_schema", "json_schema": full_schema},
        "messages": [
            {
                "role": "user",
                "content": [
                    {"type": "text", "text": detailed_prompt}
                ]
            }
        ],
        "url": website_url
    }
    print("[Backend] OpenRouter payload:", json.dumps(openrouter_payload, indent=2))
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
            print("[Backend] Sending request to OpenRouter...")
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
            print("[Backend] Returning parsed content_json to frontend")
            return content_json
        except Exception as e:
            import traceback
            print("[Backend] EXCEPTION in extract_features_logic:", e)
            traceback.print_exc()
            raise HTTPException(status_code=500, detail=str(e)) 