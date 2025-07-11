from fastapi import FastAPI, HTTPException, Request, Body
import os
import requests
from dotenv import load_dotenv
import json
from fastapi.middleware.cors import CORSMiddleware
import time
from fastapi.responses import StreamingResponse

app = FastAPI()

# Enable CORS for all origins (development only)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"message": "Hello, world!"}

@app.get("/test-openrouter")
def test_openrouter():
    load_dotenv()
    api_key = os.getenv("OPENROUTER_API_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="OPENROUTER_API_KEY not set in .env")
    url = "https://openrouter.ai/api/v1/chat/completions"
    payload = {
        "model": "deepseek/deepseek-r1",
        "messages": [
            {"role": "user", "content": "What is the meaning of life?"}
        ]
    }
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }
    try:
        resp = requests.post(url, json=payload, headers=headers)
        return {
            "status_code": resp.status_code,
            "response": resp.text
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/extract-features")
async def extract_features(request: Request):
    print("[BACKEND] Received POST /extract-features request")
    load_dotenv()
    api_key = os.getenv("OPENROUTER_API_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="OPENROUTER_API_KEY not set in .env")
    url = "https://openrouter.ai/api/v1/chat/completions"
    body = await request.json()
    website_url = body.get("url")
    use_screenshot = body.get("screenshot", False)
    stream = request.query_params.get("stream") == "true" or body.get("stream") is True
    if not website_url:
        raise HTTPException(status_code=400, detail="Missing 'url' in request body")
    # Ensure website_url is a full URL
    if not (website_url.startswith("http://") or website_url.startswith("https://")):
        website_url = "https://" + website_url
        body["url"] = website_url

    screenshot_image_url = None
    if use_screenshot:
        # Trigger screenshot server
        screenshot_payload = {"url": website_url, "full_page": True}
        try:
            resp = requests.post("http://localhost:8001/screenshot", json=screenshot_payload, timeout=30)
            resp.raise_for_status()
            screenshot_id = resp.json().get("screenshot_id")
            # Wait for screenshot file to be ready (poll for up to 30 seconds)
            screenshots_dir = os.path.join(os.path.dirname(__file__), 'screenshots')
            pattern = f"_{screenshot_id}.png"
            screenshot_path = None
            for _ in range(30):
                files_in_dir = os.listdir(screenshots_dir)
                matching_files = [f for f in files_in_dir if f.endswith(pattern)]
                if matching_files:
                    screenshot_path = os.path.abspath(os.path.join(screenshots_dir, matching_files[0]))
                    break
                time.sleep(1)
            if not screenshot_path:
                raise HTTPException(status_code=500, detail="Screenshot not ready after timeout.")
            # Serve screenshot via backend (assuming /screenshot/{screenshot_id} is available)
            screenshot_image_url = f"http://localhost:8001/screenshot/{screenshot_id}"
        except Exception as e:
            print("EXCEPTION in screenshot generation:", e)
            screenshot_image_url = None  # Continue without screenshot

    # Integrate screenshot into the existing request body, do not discard other fields
    openrouter_payload = body.copy()
    # Add screenshot image to the first message if available
    if screenshot_image_url and openrouter_payload.get("messages"):
        if isinstance(openrouter_payload["messages"], list) and len(openrouter_payload["messages"]) > 0:
            content = openrouter_payload["messages"][0].get("content", [])
            if isinstance(content, list):
                content.append({"type": "image_url", "image_url": {"url": screenshot_image_url}})
                openrouter_payload["messages"][0]["content"] = content
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }
    print("[BACKEND] Built OpenRouter payload:", openrouter_payload)
    if stream:
        def event_stream():
            with requests.post(url, json=openrouter_payload, headers=headers, stream=True) as r:
                for line in r.iter_lines():
                    if line:
                        decoded = line.decode()
                        if decoded.startswith("data: "):
                            data = decoded[6:]
                            if data == "[DONE]":
                                yield "event: done\ndata: [DONE]\n\n"
                                break
                            yield f"event: result\ndata: {data}\n\n"
                        elif decoded.startswith(":"):
                            # Comment/keepalive, treat as progress
                            yield f"event: progress\ndata: {json.dumps({'message': decoded})}\n\n"
        return StreamingResponse(event_stream(), media_type='text/event-stream')
    else:
        try:
            print("[BACKEND] Sending to OpenRouter:", json.dumps(openrouter_payload, indent=2))
            resp = requests.post(url, json=openrouter_payload, headers=headers)
            print("[BACKEND] OpenRouter response text:", resp.text)
            if resp.status_code != 200:
                raise HTTPException(status_code=resp.status_code, detail=resp.text)
            if not resp.text:
                raise HTTPException(status_code=500, detail="Empty response from upstream service")
            try:
                data = resp.json()
            except Exception as e:
                print("Failed to parse JSON from upstream service:", resp.text)
                raise HTTPException(status_code=500, detail="Invalid JSON from upstream service")
            # Extract the JSON string from the content field
            content_str = data["choices"][0]["message"]["content"]
            # Parse the JSON string to a Python dict
            try:
                content_json = json.loads(content_str)
            except Exception as e:
                raise HTTPException(status_code=500, detail=f"Failed to parse content as JSON: {e}")
            print("[BACKEND] Returning parsed content_json to frontend")
            return content_json
        except Exception as e:
            import traceback
            print("[BACKEND] EXCEPTION in /extract-features:", e)
            traceback.print_exc()
            raise HTTPException(status_code=500, detail=str(e))

@app.get("/extract-features")
async def extract_features_stream(url: str, stream: bool = True):
    print(f"[BACKEND] Received GET /extract-features request for url={url} stream={stream}")
    import os, requests, json
    from dotenv import load_dotenv
    load_dotenv()
    api_key = os.getenv("OPENROUTER_API_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="OPENROUTER_API_KEY not set in .env")
    openrouter_url = "https://openrouter.ai/api/v1/chat/completions"
    # Use the same full schema and prompt as the POST endpoint
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
        f"Given the screenshot and/or webpage - {url}, analyze the entire website UI using this flow:\n\n"
        "1. Visual Analysis & Cropping\nDetect distinct UI sections and label them clearly.\nReturn image_crop_url per section (use the provided image as source).\n\n"
        "2. Detailed Per-Section Structured Breakdown\nFor each section:\n- name\n- elements\n- purpose\n- Under style, return actual CSS property-value mappings (e.g., font-size: 36px, background-color: #ffffff, padding: 2rem). Use a css_properties object where keys are CSS property names and values are the actual values as seen in the design.\n- mobile_behavior\n- image_crop_url\n\n"
        "3. Detailed Global Design System Summary\nInclude css styles, return actual CSS property-value mappings (e.g., font-size: 36px, background-color: #ffffff, padding: 2rem). Use a css_properties object where keys are CSS property names and values are the actual values as seen in the design.\n\n"
        "4. Detailed UX Architecture & Interaction Patterns\nExplain the site journey, emotional strategy, conversion points, and design trends.\n\n"
        "5. Detailed Business & Audience Analysis\nWhat is the site about? Business type? Target audience? Extract 10–20 keywords from hero, menu, services, etc.\n\n"
        "Only return response in json_schema given in the response format."
    )
    openrouter_payload = {
        "model": "mistralai/mistral-small-3.2-24b-instruct",
        "stream": True,
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
        "url": url
    }
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }
    print("[BACKEND] Built OpenRouter payload:", openrouter_payload)
    def event_stream():
        print("[BACKEND] Starting stream to frontend...")
        buffer = ""
        with requests.post(openrouter_url, json=openrouter_payload, headers=headers, stream=True) as r:
            for line in r.iter_lines():
                print("[BACKEND] Streaming chunk:", line)
                if line:
                    decoded = line.decode()
                    if decoded.startswith("data: "):
                        data = decoded[6:]
                        if data == "[DONE]":
                            print("[BACKEND] Final buffer before JSON parse:", buffer)
                            try:
                                content_json = json.loads(buffer)
                                yield f"event: result\ndata: {json.dumps(content_json)}\n\n"
                            except Exception as e:
                                yield f"event: error\ndata: {json.dumps({'error': str(e)})}\n\n"
                            break
                        try:
                            data_obj = json.loads(data)
                            delta = data_obj["choices"][0]["delta"].get("content")
                            if delta:
                                buffer += delta
                        except Exception as e:
                            yield f"event: error\ndata: {json.dumps({'error': str(e)})}\n\n"
                    elif decoded.startswith(":"):
                        yield f"event: progress\ndata: {json.dumps({'message': decoded})}\n\n"
    return StreamingResponse(event_stream(), media_type='text/event-stream') 