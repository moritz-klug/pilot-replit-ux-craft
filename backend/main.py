import os
import asyncio
import requests
import json
from fastapi import FastAPI, HTTPException, UploadFile, Request, BackgroundTasks, Body
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
from fastapi.responses import StreamingResponse, FileResponse
import aiofiles
import base64
import uuid
from fastapi.staticfiles import StaticFiles
import glob
from typing import List, Optional, Dict, Any
import openai
import re

# Correct import for the official client
from futurehouse_client import FutureHouseClient, JobNames
from feature_extraction import extract_features_logic, extract_bounding_boxes_only

# Load environment variables from .env file
load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), ".env"))

print("DEBUG: FUTURE_HOUSE_API_KEY =", os.getenv("FUTURE_HOUSE_API_KEY"))

FUTURE_HOUSE_API_KEY = os.getenv("FUTURE_HOUSE_API_KEY", "")
FIRECRAWL_API_KEY = os.getenv("FIRECRAWL_API_KEY", "")

app = FastAPI()

# Allow CORS for local frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)



async def wait_for_screenshot(screenshot_id: str, timeout_seconds: int = 30) -> str:
    """
    Helper function to wait for screenshot to be ready with consistent logic.
    Returns the full path to the screenshot file when ready.
    """
    screenshots_dir = os.path.join(os.path.dirname(__file__), 'screenshots')
    pattern = f'_{screenshot_id}.png'
    
    print(f'[DEBUG] Waiting for screenshot with pattern: {pattern}')
    
    for i in range(timeout_seconds):
        try:
            if not os.path.exists(screenshots_dir):
                print(f'[DEBUG] Screenshots directory does not exist: {screenshots_dir}')
                await asyncio.sleep(1)
                continue
                
            files_in_dir = os.listdir(screenshots_dir)
            matching_files = [f for f in files_in_dir if f.endswith(pattern)]
            
            if matching_files:
                screenshot_path = os.path.abspath(os.path.normpath(os.path.join(screenshots_dir, matching_files[0])))
                
                # Check if file exists and has content
                if os.path.exists(screenshot_path) and os.path.getsize(screenshot_path) > 0:
                    print(f'[DEBUG] Screenshot ready after {i+1} seconds: {screenshot_path}')
                    # Small delay to ensure file is fully written to disk
                    await asyncio.sleep(0.5)
                    return screenshot_path
                    
        except Exception as e:
            print(f'[DEBUG] Error checking for screenshot (attempt {i+1}): {e}')
        
        await asyncio.sleep(1)
    
    raise HTTPException(status_code=408, detail=f"Screenshot not ready after {timeout_seconds} seconds timeout")

def check_existing_screenshot(screenshot_id: str) -> Optional[str]:
    """
    Check if a screenshot with the given ID already exists and is valid.
    Returns the screenshot path if found and valid, None otherwise.
    """
    if not screenshot_id:
        return None
        
    screenshots_dir = os.path.join(os.path.dirname(__file__), 'screenshots')
    pattern = f'_{screenshot_id}.png'
    
    try:
        if not os.path.exists(screenshots_dir):
            return None
            
        files_in_dir = os.listdir(screenshots_dir)
        matching_files = [f for f in files_in_dir if f.endswith(pattern)]
        
        if matching_files:
            screenshot_path = os.path.join(screenshots_dir, matching_files[0])
            if os.path.exists(screenshot_path) and os.path.getsize(screenshot_path) > 0:
                print(f'[DEBUG] Found existing valid screenshot: {screenshot_path}')
                return screenshot_path
                
    except Exception as e:
        print(f'[DEBUG] Error checking existing screenshot: {e}')
    
    return None

async def request_screenshot_and_wait(url: str, timeout_seconds: int = 30) -> tuple[str, str]:
    """
    Helper function to request a screenshot and wait for it to be ready.
    Returns (screenshot_id, screenshot_path) when ready.
    """
    print(f'[DEBUG] Requesting screenshot for URL: {url}')
    screenshot_payload = {"url": url, "full_page": True, "hide_popups": True}
    
    try:
        response = requests.post("http://localhost:8001/screenshot", json=screenshot_payload, timeout=30)
        response.raise_for_status()
        screenshot_id = response.json().get("screenshot_id")
        
        if not screenshot_id:
            raise HTTPException(status_code=500, detail="No screenshot ID returned from screenshot service")
        
        print(f'[DEBUG] Screenshot requested, ID: {screenshot_id}')
        
        # Wait for screenshot to be ready
        screenshot_path = await wait_for_screenshot(screenshot_id, timeout_seconds)
        
        return screenshot_id, screenshot_path
        
    except requests.exceptions.RequestException as e:
        raise HTTPException(status_code=503, detail=f"Failed to connect to screenshot server: {e}")

class AnalyzeRequest(BaseModel):
    url: str

class BoundingBoxRequest(BaseModel):
    url: str
    sections: list
    screenshot_url: str

async def analysis_and_screenshot_stream(url: str):
    """
    Orchestrator that takes a screenshot and runs analysis,
    streaming progress and results back to the client.
    """
    screenshot_id = None
    try:
        # Step 1: Trigger screenshot server
        yield "event: progress\ndata: {\"message\": \"📸 Requesting screenshot...\"}\n\n"
        screenshot_payload = {"url": url, "full_page": True, "hide_popups": True}
        response = requests.post("http://localhost:8001/screenshot", json=screenshot_payload, timeout=10)
        response.raise_for_status()
        screenshot_id = response.json().get("screenshot_id")
        yield f'event: screenshot_id\ndata: {{"screenshot_id": "{screenshot_id}"}}\n\n'
        yield 'event: progress\ndata: {"message": "✅ Screenshot requested. Analyzing URL..."}\n\n'

    except requests.exceptions.RequestException as e:
        error_message = f"Failed to connect to screenshot server: {e}"
        yield f'event: error\ndata: {{"error": "{error_message}"}}\n\n'
        # Continue without screenshot

    # Step 2: Simulate LLM analysis stream (replace with actual logic later)
    # This is where the future logic for analyzing the page content AND the screenshot
    # to identify and describe UI sections will go.
    analysis_steps = [
        "Analyzing page layout and structure...",
        "Identifying key UI components like headers, buttons, and forms...",
        "Evaluating color contrast and accessibility...",
        "Analyzing navigation flow and user journey...",
        "Compiling final report and recommendations...",
    ]
    for step in analysis_steps:
        await asyncio.sleep(1)  # Simulate work
        yield f'event: progress\ndata: {{"message": "{step}"}}\n\n'

    # Step 3: Yield final analysis result
    final_analysis_data = {
        "report": {
            "title": "Simulated UI/UX Analysis",
            "summary": "This is a simulated analysis. The full implementation will provide a detailed breakdown of UI components identified from the screenshot.",
            "components": [
                {
                    "name": "Header",
                    "description": "Contains navigation and logo. Good contrast.",
                    "style_info": "position: sticky",
                },
                {
                    "name": "Hero Section",
                    "description": "Main call-to-action is clear.",
                    "style_info": "background: #f0f0f0",
                },
                {
                    "name": "Footer",
                    "description": "Includes contact information and social links.",
                    "style_info": "padding: 2rem",
                },
            ],
        }
    }
    yield f"event: analysis_complete\ndata: {json.dumps(final_analysis_data)}\n\n"


@app.post("/analyze-with-screenshot")
async def analyze_url_with_screenshot(request: AnalyzeRequest):
    print("[DEBUG] /analyze-with-screenshot endpoint called")
    """
    Takes a URL, triggers a screenshot, and streams back analysis progress.
    """
    return StreamingResponse(
        analysis_and_screenshot_stream(request.url), media_type="text/event-stream"
    )


class RecommendationRequest(BaseModel):
    feature: str
    currentDesign: str
    context: str = ""


class Paper(BaseModel):
    title: str
    authors: list[str]
    year: int
    url: str
    relevance: str


class RecommendationResponse(BaseModel):
    recommendations: list[str]
    papers: list[Paper]

class RelevantHeuristicsRequest(BaseModel):
    feature: str
    currentDesign: str

class RelevantHeuristicsResponse(BaseModel):
    relevant: List[int]

class EnrichRecommendationRequest(BaseModel):
    recommendation: str
    feature: str
    currentDesign: str

class EnrichedRecommendation(BaseModel):
    title: str
    description: str
    principle: str
    research: str
    impact: str = ''
    category: str = ''

def call_mistral_via_openrouter(prompt: str) -> str:
    if not OPENROUTER_API_KEY:
        raise HTTPException(status_code=500, detail="OpenRouter API key not set. Please add OPENROUTER_API_KEY to your .env file.")
    print("[Mistral] Connecting to OpenRouter with prompt:")
    print(prompt)
    print("[Mistral] Waiting for response...")
    client = openai.OpenAI(api_key=OPENROUTER_API_KEY, base_url="https://openrouter.ai/api/v1")
    response = client.chat.completions.create(
        model="mistralai/mistral-7b-instruct",
        messages=[{"role": "user", "content": prompt}]
    )
    content = response.choices[0].message.content
    print("[Mistral] Got response:")
    print(content)
    return content if content is not None else ""

@app.post("/recommendations", response_model=RecommendationResponse)
def get_recommendations(request: RecommendationRequest):
    if not FUTURE_HOUSE_API_KEY:
        raise HTTPException(status_code=500, detail="Future House API key not set.")

    # Compose the query for the scientific recommendation
    query = f"Based on scientific research papers, provide recommendations for improving the following UI feature:\n\nFeature: {request.feature}\nCurrent Design: {request.currentDesign}\n{f'Additional Context: {request.context}' if request.context else ''}\n\nPlease provide recommendations that are:\n1. Backed by scientific research\n2. Specific to the current design\n3. Actionable and implementable\n4. Focused on improving user experience and usability"

    # Use the Crow job for fast search (or Falcon for deep search)
    client = FutureHouseClient(api_key=FUTURE_HOUSE_API_KEY)
    task_data = {
        "name": JobNames.CROW,
        "query": query,
    }
    try:
        task_response = client.run_tasks_until_done(task_data)
        # The response may contain answer, formatted_answer, and references
        answer = getattr(task_response, "answer", "")
        formatted_answer = getattr(task_response, "formatted_answer", "")
        # Extract references/papers if available
        papers = []
        # Fix: handle if task_response is a list
        if isinstance(task_response, list):
            response_obj = task_response[0] if task_response else None
        else:
            response_obj = task_response
        # Use getattr to safely access "references" and avoid linter errors
        references = getattr(response_obj, 'references', None)
        if references:
            for ref in references:
                papers.append(
                    Paper(
                        title=ref.get("title", ""),
                        authors=ref.get("authors", []),
                        year=ref.get("year", 0),
                        url=ref.get("url", ""),
                        relevance=ref.get("snippet", ""),
                    )
                )
        # Recommendations: split answer or formatted_answer into actionable items
        recommendations = [rec.strip() for rec in answer.split("\n") if rec.strip()]
        return RecommendationResponse(recommendations=recommendations, papers=papers)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"FutureHouse API error: {str(e)}")

OPENROUTER_API_KEY = os.getenv('OPENROUTER_API_KEY', 'sk-...')  # Replace with your key or .env
OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions'
OPENROUTER_MODEL = 'mistralai/mistral-small-3.1-24b-instruct'  # Can be changed
CROPS_DIR = os.path.join(os.path.dirname(__file__), 'section_crops')
os.makedirs(CROPS_DIR, exist_ok=True)

ANALYSIS_PROMPT = '''You are an advanced UI/UX analyst, visual design expert, and business intelligence extractor. Given website URL and screenshot, perform the following complete analysis pipeline:
1. Visual Analysis & Cropping
Identify and crop UI sections into separate labeled images
2. Per-Section Structured Breakdown
For each UI section, return a breakdown like:
[Section Name]

Elements: Describe visible UI elements (images, headings, icons, text, buttons).
Purpose: What is this section trying to achieve from a UX or marketing perspective?
Style Details:
  - Fonts (family, size, weight)
  - Colors (text, backgrounds, CTAs, hover)
  - Layouts (columns, grids, containers)
  - Interactions (hover, scroll animations, sticky behavior)
Mobile Behavior: How is the section responsive or adaptive?
Bounding_box Coordinates of Feature(x, y, width, height as percentages)
3. Global Design System Summary
Return the overall style architecture used across the website:
Typography: Fonts used, heading/body hierarchy, font sizes
Color Palette: Primary, accent, background, hover, and text colors (with hex codes)
Button Styles: Shape, color, hover animation, font
Spacing & Layout: Padding, margins, column layouts, responsive breakpoints
Iconography: Style (line, solid), use of illustrations or imagery

4. UX Architecture & Interaction Patterns
Explain how the site is structured and what journey it guides the user through:
Page Flow: (e.g. Introduction → Services → Proof → CTA → Contact)
Emotional Strategy: Authenticity, authority, minimalism, playfulness, etc.
Conversion Points: CTAs, forms, demos, lead magnets
Design Trends: Glassmorphism, flat design, brutalism, etc.

5. Business and Audience Analysis
From content and meta-data, determine:
What is this website about? (1-paragraph summary)
Business Type: e.g. SaaS, Portfolio, Marketing Agency, eCommerce, Blog, Nonprofit
Target Audience: Personas or demographic/industry focus
Keywords & Topics: Extract product- or service-related keywords for SEO, based on:
Navigation/menu
Hero tagline
Service/feature blocks
Blog topics or product categories
 Return ~10–20 keywords.

Provide realistic bounding box coordinates based on the visual layout.
Show sections with all the details etc. 
'''

class AnalyzeUIRequest(BaseModel):
    url: str


class ChatRequest(BaseModel):
    feature_name: str
    context: str = ""
    message: str
    model: str = "openrouter/auto"
    history: list[dict] = []  # previous chat messages


class ChatResponse(BaseModel):
    response: str


import time


def sse_event(event: str, data: str) -> str:
    return f"event: {event}\ndata: {data}\n\n"


@app.get("/analyze-ui")
async def analyze_ui(request: Request):
    print("[DEBUG] /analyze-ui endpoint called")
    url = request.query_params.get('url')
    if not url:

        async def event_stream():
            print("[DEBUG] Missing url parameter")
            yield sse_event("error", '{"error": "Missing url parameter."}')
            return

        return StreamingResponse(event_stream(), media_type="text/event-stream")

    async def event_stream():
        try:
            yield sse_event('progress', '{"message": "📸 Requesting screenshot..."}')
            
            # Use the new helper function for consistent screenshot handling
            screenshot_id, screenshot_path = await request_screenshot_and_wait(url, timeout_seconds=30)
            
            yield sse_event('progress', '{"message": "✅ Screenshot ready. Sending to LLM..."}')

            # 3. Send screenshot + URL to OpenRouter LLM
            try:
                print("[DEBUG] Encoding screenshot as base64")
                with open(screenshot_path, "rb") as img_file:
                    img_b64 = base64.b64encode(img_file.read()).decode("utf-8")
                # Prepare vision API format for OpenRouter
                image_data_url = f"data:image/png;base64,{img_b64}"
                data = {
                    "model": OPENROUTER_MODEL,
                    "messages": [
                        {
                            "role": "user",
                            "content": [
                                {
                                    "type": "text",
                                    "text": f"Website URL: {url}. {ANALYSIS_PROMPT}",
                                },
                                {
                                    "type": "image_url",
                                    "image_url": {"url": image_data_url},
                                },
                            ],
                        }
                    ],
                }
                headers = {
                    "Authorization": f"Bearer {OPENROUTER_API_KEY}",
                    "Content-Type": "application/json",
                }
                print("[DEBUG] Sending request to OpenRouter LLM")
                # Save request to file for debugging
                import datetime

                debug_filename = f'openrouter_request_{datetime.datetime.now().strftime("%Y%m%d_%H%M%S_%f")}.txt'
                debug_path = os.path.join(os.path.dirname(__file__), debug_filename)
                with open(debug_path, "w", encoding="utf-8") as f:
                    f.write("MODEL: " + str(OPENROUTER_MODEL) + "\n")
                    f.write("HEADERS: " + str(headers) + "\n")
                    import json as _json

                    f.write("DATA: " + _json.dumps(data, indent=2))
                yield sse_event(
                    "progress", '{"message": "🤖 Waiting for LLM analysis..."}'
                )
                resp = requests.post(OPENROUTER_API_URL, json=data, headers=headers)
                print("[DEBUG] LLM response status:", resp.status_code)
                print("[DEBUG] LLM response text (first 500 chars):", resp.text[:500])
                if resp.status_code != 200:
                    print("[ERROR] OpenRouter error:", resp.text)
                    yield sse_event(
                        "error", f'{{"error": "OpenRouter error: {resp.text}"}}'
                    )
                    return
                llm_result = resp.json()
            except Exception as e:
                print("[ERROR] Exception during LLM call:", e)
                yield sse_event("error", f'{{"error": "Failed to call LLM: {str(e)}"}}')
                return

            # 4. Parse LLM response
            try:
                print("[DEBUG] Parsing LLM response")
                
                # Check if the response has the expected structure
                if "choices" not in llm_result:
                    raise Exception(f"Unexpected OpenRouter response format: {llm_result}")
                
                if not llm_result["choices"] or len(llm_result["choices"]) == 0:
                    raise Exception("No choices in OpenRouter response")
                
                if "message" not in llm_result["choices"][0]:
                    raise Exception(f"Unexpected choice format: {llm_result['choices'][0]}")
                
                if "content" not in llm_result["choices"][0]["message"]:
                    raise Exception(f"Unexpected message format: {llm_result['choices'][0]['message']}")
                
                analysis = json.loads(llm_result["choices"][0]["message"]["content"])
                print("[DEBUG] Parsed analysis:", str(analysis)[:500])
            except Exception as e:
                print("[ERROR] Failed to parse LLM response:", e)
                yield sse_event(
                    "error", f'{{"error": "Failed to parse LLM response: {e}"}}'
                )
                return

            # 5. Save cropped images to disk and replace base64 with URLs
            for section in analysis.get("sections", []):
                if "cropped_image_base64" in section:
                    img_bytes = base64.b64decode(section["cropped_image_base64"])
                    crop_id = str(uuid.uuid4())
                    crop_path = os.path.join(CROPS_DIR, f"section_{crop_id}.png")
                    print("[DEBUG] Saving cropped image:", crop_path)
                    async with aiofiles.open(crop_path, "wb") as f:
                        await f.write(img_bytes)
                    section["cropped_image_url"] = (
                        f"/section-crops/section_{crop_id}.png"
                    )
                    del section["cropped_image_base64"]

            analysis["screenshot_id"] = screenshot_id
            print("[DEBUG] Yielding analysis result")
            yield sse_event("progress", '{"message": "🎉 Analysis complete."}')
            yield sse_event("result", json.dumps(analysis))
        except Exception as e:
            print("[ERROR] Exception in event_stream:", e)
            yield sse_event("error", f'{{"error": "Internal server error: {e}"}}')
            return

    return StreamingResponse(event_stream(), media_type="text/event-stream")


@app.post("/chat", response_model=ChatResponse)
async def chat_with_feature(request: ChatRequest):
    """
    Chat endpoint that uses OpenRouter to provide feature-specific advice
    """
    if not OPENROUTER_API_KEY or OPENROUTER_API_KEY.startswith("sk-..."):
        raise HTTPException(status_code=500, detail="OpenRouter API key not configured")

    # Create a specialized prompt for UI/UX assistance
    system_prompt = f"""You are an expert UI/UX consultant specializing in the {request.feature_name} component. 
    
    Your role is to provide specific, actionable advice for improving this UI component based on:
    - Modern design principles and best practices
    - Accessibility guidelines (WCAG)
    - User experience research
    - Current design trends
    - Performance considerations
    
    Context about this component: {request.context}
    
    Always provide:
    1. Specific recommendations with reasoning
    2. Code examples when applicable  
    3. References to design principles
    4. Accessibility considerations
    5. Mobile responsiveness tips
    
    Keep responses practical and implementable."""

    try:
        data = {
            "model": OPENROUTER_MODEL,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": request.message},
            ],
            "temperature": 0.7,
            "max_tokens": 1000,
        }

        headers = {
            "Authorization": f"Bearer {OPENROUTER_API_KEY}",
            "Content-Type": "application/json",
        }

        print(f"[DEBUG] Sending chat request for {request.feature_name}")
        resp = requests.post(OPENROUTER_API_URL, json=data, headers=headers)

        if resp.status_code != 200:
            print("[ERROR] OpenRouter chat error:", resp.text)
            raise HTTPException(
                status_code=500, detail=f"OpenRouter error: {resp.text}"
            )

        result = resp.json()
        
        # Check if the response has the expected structure
        if "choices" not in result:
            raise HTTPException(status_code=500, detail=f"Unexpected OpenRouter response format: {result}")
        
        if not result["choices"] or len(result["choices"]) == 0:
            raise HTTPException(status_code=500, detail="No choices in OpenRouter response")
        
        if "message" not in result["choices"][0]:
            raise HTTPException(status_code=500, detail=f"Unexpected choice format: {result['choices'][0]}")
        
        if "content" not in result["choices"][0]["message"]:
            raise HTTPException(status_code=500, detail=f"Unexpected message format: {result['choices'][0]['message']}")
        
        response_text = result["choices"][0]["message"]["content"]

        return ChatResponse(response=response_text)

    except Exception as e:
        print("[ERROR] Exception during chat:", e)
        raise HTTPException(status_code=500, detail=f"Chat error: {str(e)}")

class FirecrawlAnalyzeRequest(BaseModel):
    url: str

@app.post('/firecrawl-analyze')
async def firecrawl_analyze(request: FirecrawlAnalyzeRequest):
    """
    Takes a URL, calls Firecrawl API, and returns the structured UI analysis.
    """
    if not FIRECRAWL_API_KEY:
        raise HTTPException(status_code=500, detail="Firecrawl API key not set.")
    firecrawl_url = 'https://api.firecrawl.dev/extract'
    schema = {
        "type": "object",
        "properties": {
            "ui_components": {
                "type": "array",
                "items": {
                    "type": "object",
                    "properties": {
                        "section_name": {"type": "string"},
                        "html_content": {"type": "string"},
                        "css_styles_description": {"type": "string"},
                        "css_styles_code": {"type": "string"},
                        "js_code": {"type": "string"},
                        "js_links": {"type": "array", "items": {"type": "string"}},
                        "interactions": {"type": "string"},
                        "full_description": {"type": "string"}
                    },
                    "required": [
                        "section_name",
                        "html_content",
                        "css_styles_description",
                        "css_styles_code",
                        "js_code",
                        "js_links",
                        "interactions",
                        "full_description"
                    ]
                }
            },
            "global_styles": {"type": "string"}
        },
        "required": ["ui_components", "global_styles"]
    }
    payload = {
        "url": request.url,
        "schema": schema,
        "agent": {"model": "FIRE-1"}
    }
    headers = {
        "Authorization": f"Bearer {FIRECRAWL_API_KEY}",
        "Content-Type": "application/json"
    }
    try:
        resp = requests.post(firecrawl_url, json=payload, headers=headers, timeout=60)
        resp.raise_for_status()
        return resp.json()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Firecrawl API error: {str(e)}")

@app.post("/extract-features")
async def extract_features(request: Request):
    """
    Enhanced 2-phase analysis: Text-only first, then targeted bounding box detection.
    Much more cost-effective than full visual analysis.
    Includes improved screenshot timing coordination.
    """
    print("[DEBUG] /extract-features endpoint called with 2-phase analysis")
    
    try:
        # Parse the request to get the URL
        body = await request.json()
        url = body.get('url')
        
        if not url:
            raise HTTPException(status_code=400, detail="URL is required")
        
        print(f"[DEBUG] Ensuring screenshot is ready for URL: {url}")
        
                 # First, ensure we have a screenshot ready with proper timing
        # This prevents the race condition where feature extraction runs before screenshot is ready
        try:
            print(f"[DEBUG] Starting screenshot coordination for feature extraction...")
            screenshot_id, screenshot_path = await request_screenshot_and_wait(url, timeout_seconds=45)
            print(f"[DEBUG] ✅ Screenshot confirmed ready for feature extraction: {screenshot_id}")
            print(f"[DEBUG] Screenshot path: {screenshot_path}")
            
            # Add screenshot info to the request body for the extraction logic
            body['screenshot_id'] = screenshot_id
            body['screenshot_path'] = screenshot_path
            body['screenshot_url'] = f"http://localhost:8001/screenshot/{screenshot_id}"
            body['screenshot_coordination_success'] = True
            
            # Create a new request object with the enhanced body
            class EnhancedRequest:
                def __init__(self, enhanced_body):
                    self._body = enhanced_body
                
                async def json(self):
                    return self._body
            
            enhanced_request = EnhancedRequest(body)
            print(f"[DEBUG] Proceeding with feature extraction with guaranteed screenshot availability")
            
        except HTTPException as e:
            print(f"[WARNING] Screenshot coordination failed: {e.detail}")
            print(f"[WARNING] Falling back to original extraction logic - may fail if screenshot not ready")
            # Continue with original request if screenshot fails - extraction logic might handle it
            enhanced_request = request
        
        # Now call the extraction logic with confirmed screenshot availability
        return await extract_features_logic(enhanced_request)
        
    except Exception as e:
        print(f"[ERROR] Error in extract_features coordination: {e}")
        # Fallback to original logic if coordination fails
        return await extract_features_logic(request)

@app.post("/extract-bounding-boxes") 
async def extract_bounding_boxes(request: BoundingBoxRequest):
    """
    Targeted bounding box detection for known features.
    Used as second phase after text-only analysis.
    """
    print("[DEBUG] /extract-bounding-boxes endpoint called")
    try:
        coordinates = await extract_bounding_boxes_only(
            request.screenshot_url, 
            request.sections, 
            request.url
        )
        return {"bounding_boxes": coordinates}
    except Exception as e:
        print(f"[ERROR] Bounding box extraction failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/test-bounding-boxes")
async def test_bounding_boxes():
    """
    Test endpoint to verify the 2-phase analysis is working.
    """
    print("[DEBUG] /test-bounding-boxes endpoint called")
    
    test_url = "https://www.marketing-lokalhelden.de/"
    test_request_body = {"url": test_url}
    
    # Create a mock request
    class MockRequest:
        async def json(self):
            return test_request_body
    
    try:
        result = await extract_features_logic(MockRequest())
        sections_with_bbox = [s for s in result.get('sections', []) if s.get('bounding_box')]
        
        return {
            "status": "success",
            "url": test_url,
            "total_sections": len(result.get('sections', [])),
            "sections_with_bounding_boxes": len(sections_with_bbox),
            "sections": result.get('sections', [])[:3],  # Return first 3 for debugging
            "message": f"Analysis complete. {len(sections_with_bbox)} out of {len(result.get('sections', []))} sections have bounding boxes."
        }
    except Exception as e:
        return {
            "status": "error",
            "error": str(e),
            "message": "Failed to analyze website"
        }

@app.get("/test-openrouter")
def test_openrouter():
    if not OPENROUTER_API_KEY:
        raise HTTPException(status_code=500, detail="OpenRouter API key not set.")
    url = "https://openrouter.ai/api/v1/chat/completions"
    headers = {
        "Authorization": f"Bearer {OPENROUTER_API_KEY}",
        "Content-Type": "application/json"
    }
    data = {
        "model": "openai/gpt-3.5-turbo",
        "messages": [
            {"role": "system", "content": "You are a helpful assistant."},
            {"role": "user", "content": "Test connection"}
        ]
    }
    try:
        resp = requests.post(url, headers=headers, json=data, timeout=30)
        resp.raise_for_status()
        return resp.json()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"OpenRouter API error: {str(e)}")

# Serve cropped images statically
app.mount("/section-crops", StaticFiles(directory=CROPS_DIR), name="section-crops")


@app.post("/relevant-heuristics", response_model=RelevantHeuristicsResponse)
def get_relevant_heuristics(request: RelevantHeuristicsRequest):
    if not OPENROUTER_API_KEY:
        raise HTTPException(status_code=500, detail="OpenRouter API key not set. Please add OPENROUTER_API_KEY to your .env file.")

    heuristics_list = [
        "1. Visibility of system status",
        "2. Match between system and the real world",
        "3. User control and freedom",
        "4. Consistency and standards",
        "5. Error prevention",
        "6. Recognition rather than recall",
        "7. Flexibility and efficiency of use",
        "8. Aesthetic and minimalist design",
        "9. Help users recognize, diagnose, and recover from errors",
        "10. Help and documentation"
    ]
    heuristics_str = '\n'.join(heuristics_list)
    prompt = (
        f"Given the following UI feature and its current design, select which of Nielsen's 10 Usability Heuristics are most relevant for improving this feature. "
        f"Return only a comma-separated list of the numbers of the relevant heuristics (e.g., 1,3,5).\n\n"
        f"Feature: {request.feature}\nCurrent Design: {request.currentDesign}\n\nHeuristics:\n{heuristics_str}"
    )
    try:
        answer = call_mistral_via_openrouter(prompt)
        numbers = re.findall(r'\b\d+\b', answer)
        relevant = [int(n) for n in numbers if 1 <= int(n) <= 10]
        return RelevantHeuristicsResponse(relevant=relevant)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"OpenRouter API error: {str(e)}")

@app.post("/enrich-recommendation", response_model=EnrichedRecommendation)
def enrich_recommendation(request: EnrichRecommendationRequest):
    print("[API] /enrich-recommendation called with:")
    print(f"Feature: {request.feature}")
    print(f"Current Design: {request.currentDesign}")
    print(f"Recommendation: {request.recommendation}")
    prompt = (
        f"Given the following UI feature, its current design, and a scientific recommendation, extract the following fields as JSON: "
        f"title, description, principle, research, impact (high/medium/low), and category (accessibility/usability/visual/interaction). "
        f"If a field is not present, return an empty string for it.\n\n"
        f"If the original recommendation is vague, clarify and expand it. Make the description actionable and user-friendly.\n\n"
        f"Feature: {request.feature}\n"
        f"Current Design: {request.currentDesign}\n"
        f"Recommendation: {request.recommendation}\n\n"
        f"Respond ONLY with a valid JSON object."
    )
    try:
        answer = call_mistral_via_openrouter(prompt)
        # Try to extract JSON from the answer
        import json
        try:
            data = json.loads(answer)
        except Exception:
            # Try to extract JSON substring if LLM wraps it in text
            import re
            match = re.search(r'\{.*\}', answer, re.DOTALL)
            if match:
                data = json.loads(match.group(0))
            else:
                raise HTTPException(status_code=500, detail="Could not parse JSON from LLM response.")
        return EnrichedRecommendation(**data)
    except Exception as e:
        print(f"[Mistral] Error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"OpenRouter API error: {str(e)}") 

class RecommendationPromptCodeRequest(BaseModel):
    featureName: str
    featureDescription: str
    htmlStructure: str
    latestRecommendation: str
    outputType: Optional[str] = None
    framework: Optional[str] = None
    language: Optional[str] = None
    platform: Optional[str] = None

class RecommendationPromptCodeResponse(BaseModel):
    prompt: Optional[str] = None
    code: Optional[str] = None
    style: Optional[str] = None

def encode_code_block(code: str) -> str:
    if not code:
        return ""
    return base64.b64encode(code.encode('utf-8')).decode('utf-8')

def decode_code_block(encoded_code: str) -> str:
    if not encoded_code:
        return ""
    return base64.b64decode(encoded_code.encode('utf-8')).decode('utf-8')

import time

def retry_get_prompt_code(requests_llm, retry_error, max_retries=3, delay=1.0):
    for i in range(max_retries):
        result = requests_llm()
        if not retry_error(result):
            return result
        time.sleep(delay * ( i ** 2))
    return result

def has_error(result):
    if not result or not isinstance(result, dict):
        print(f'[DEBUG] has_error: result is not a dict or is None')
        return True
    
    processed_values = {}

    for key in result:
        old_value = result[key]
        new_value = ""
        code_key = {'code', 'style'}
        if key in code_key:
            try:
                new_value = decode_code_block(old_value)
            except Exception as e:
                print(f"[DEBUG] Failed to decode '{key}': {e}")
                new_value = "" 
        else:
            new_value = old_value
        processed_values[key] = new_value

    values = list(processed_values.values())

    # Check for error messages in values
    errors = {"Could not generate prompt", "Could not generate code", "Code generation failed"}
    has_error_messages = any(error in str(v) for v in values for error in errors)

    # Check if all values are empty
    empty = all(not v or v == '' for v in processed_values)
    
    return has_error_messages or empty

def get_prompt_code(request):

    if not (request.outputType and ((request.outputType == 'code' and request.framework) or (request.outputType == 'prompt' and request.platform))):
        return {
            'prompt': '',
            'code': '',
            'style': '',
        }

    output_prompt= ''

    if request.outputType == 'code':
        if request.framework == 'Vue':
            output_prompt = (
                f"Please provide improved frontend code according to the recommendation using Vue in {request.language}.\n"
                f"The code should reflect modern, accessible, and visually appealing design best practices.\n"
                f"Return a single .vue file with the component code and a <style> block for CSS inside the file.\n"
                f"ONLY return the .vue file. No markdown. No file names. No explanations."
            )
        elif request.framework == 'Angular':
            output_prompt = (
                f"Please provide improved frontend code according to the recommendation using Angular.\n"
                f"The code should reflect modern, accessible, and visually appealing design best practices.\n"
                f"Return a single .ts file with the component code, including an inline template and a <style> block or inline styles inside the file.\n"
                f"ONLY return the .ts file. No markdown. No file names. No explanations."
            )
        else:
            output_prompt = (
                f"Please provide improved frontend code according to the recommendation using {request.framework} in {request.language}.\n "
                f"The code should reflect modern, accessible, and visually appealing design best practices."
                f"The output should include:\n"
                f"1. The component/page code in {request.framework} using {request.language}\n"
                f"2. A separate CSS stylesheet or styling block.\n\n"
                f"---FORMAT---\n"
                f"---CODE---\n"
                f"[component code here]\n"
                f"---STYLE---\n"
                f"[CSS code here]\n"
                f"ONLY return the code. No markdown. No file names. No explanations."
            )
    elif request.outputType == 'prompt':
        output_prompt = (
            f"Write a detailed and effective prompt tailored for {request.platform} that can generate a UI design matching the recommendation.\n"
            f"The design should be clean, user-friendly, and visually appealing, reflecting the core purpose of the original feature\n\n"
            f"Return ONLY the prompt. No markdown. No file names. No extra text\n\n"
    )

    prompt = (
        f"You're a senior product designer and frontend engineer. Your task is to improve a UI feature based on a provided expert recommendation.\n"
        f"Given the following UI feature and its improvement recommendation:\n\n"
        f"Feature: {request.featureName}\n"
        f"Feature description:\n{request.featureDescription}\n"
        f"HTML structure:\n{request.htmlStructure}\n\n"
        f"Recommendation:\n{request.latestRecommendation}\n\n"
    )
    
    try:
        data = {
            'model': 'anthropic/claude-3.7-sonnet:thinking',
            'messages': [
                {
                    "role": "user",
                    "content": prompt + output_prompt
                },
            ],
            'temperature': 0.7,
            'max_tokens': 8000
        }
        
        headers = {
            'Authorization': f'Bearer {OPENROUTER_API_KEY}',
            'Content-Type': 'application/json',
        }
        
        print(f'[DEBUG] Requesting code and prompt for {request.featureName}')
        resp = requests.post(OPENROUTER_API_URL, json=data, headers=headers)
        
        if resp.status_code != 200:
            print('[ERROR] OpenRouter error:', resp.text)
            raise HTTPException(status_code=500, detail=f"OpenRouter error: {resp.text}")
            
        results = resp.json()
        
        # Check if the response has the expected structure
        if "choices" not in results:
            raise HTTPException(status_code=500, detail=f"Unexpected OpenRouter response format: {results}")
        
        if not results["choices"] or len(results["choices"]) == 0:
            raise HTTPException(status_code=500, detail="No choices in OpenRouter response")
        
        if "message" not in results["choices"][0]:
            raise HTTPException(status_code=500, detail=f"Unexpected choice format: {results['choices'][0]}")
        
        if "content" not in results["choices"][0]["message"]:
            raise HTTPException(status_code=500, detail=f"Unexpected message format: {results['choices'][0]['message']}")
        
        response_text = results['choices'][0]['message']['content']
        
        try:
            sections = ['CODE', 'STYLE']
            result = {}
            
            def clean_code(code: str) -> str:
                code = re.sub(r'```[a-zA-Z]*\s*\n?|```[a-zA-Z]*$|```', '', code)
                code = re.sub(r'^(Angular|React|Vue)\s+(with\s+TypeScript|component):\s*$', '', code, flags=re.MULTILINE | re.IGNORECASE)
                code = re.sub(r'^[A-Za-z0-9_-]+\.(vue|tsx|ts|jsx|js|css|html)\s*$', '', code, flags=re.MULTILINE)
                code = re.sub(r'^(vue|tsx|ts|jsx|js|css|html)\s*$', '', code, flags=re.MULTILINE)
                return '\n'.join(line for line in code.split('\n') if line.strip()).strip()
            

            if request.outputType == 'code':
                if request.framework != 'React':
                    result['code'] = encode_code_block(clean_code(response_text))
                    result['style'] = "" 
                else:
                    for section in sections:
                        pattern = rf'---{section}---\n(.*?)(?=\n---|$)'
                        match = re.search(pattern, response_text, re.DOTALL)
                        if match:
                            content = match.group(1).strip()
                        else:
                            content = "Code generation failed"
                        result[section.lower()] = encode_code_block(clean_code(content))
                    
                    # Fallback: if we didn't find the expected format, try to extract code blocks
                    if result['code'] == encode_code_block(clean_code("Code generation failed")):
                        print('[DEBUG] Fallback parsing for code blocks')
                        code_blocks = re.findall(r'```(?:javascript|vue|typescript|styles|jsx|tsx|ts|js|html|css)\n(.*?)```', response_text, re.DOTALL)
                        if code_blocks:
                            result['code'] = encode_code_block(clean_code(code_blocks[0]))
                            if len(code_blocks) > 1:
                                result['style'] = encode_code_block(clean_code(code_blocks[1]))
                            print(f'[DEBUG] Parsing found {len(code_blocks)} code blocks')
                    
            elif request.outputType == 'prompt':
                result['prompt'] = response_text.strip()

            return result
                
        except Exception as e:
            print(f"[ERROR] Failed to parse response sections: {e}")
            print(f"[ERROR] Response text: {results}")
            error_result = {
                'prompt': '',
                'code': '',
                'style': ''
            }
            return error_result
    
    except Exception as e:
        print(f"[ERROR] Exception during recommendation generation: {str(e)}")
        raise HTTPException(status_code=500, detail=f"OpenRouter API error: {str(e)}")


# @app.post("/extract-features")
# async def extract_features(request: Request):
#     print("[DEBUG] ===== /extract-features endpoint called =====")
#     print(f"[DEBUG] Request method: {request.method}")
#     print(f"[DEBUG] Request URL: {request.url}")
#     print(f"[DEBUG] Request headers: {dict(request.headers)}")
#     
#     try:
#         print("[DEBUG] About to call extract_features_logic...")
#         result = await extract_features_logic(request)
#         print(f"[DEBUG] extract_features_logic returned: {type(result)}")
#         print(f"[DEBUG] Result content (first 500 chars): {str(result)[:500]}")
#         print("[DEBUG] ===== /extract-features endpoint completed successfully =====")
#         return result
#     except Exception as e:
#         print(f"[DEBUG] ===== ERROR in /extract-features endpoint =====")
#         print(f"[DEBUG] Exception type: {type(e)}")
#         print(f"[DEBUG] Exception message: {str(e)}")
#         import traceback
#         print(f"[DEBUG] Full traceback:")
#         traceback.print_exc()
#         print("[DEBUG] ===== END ERROR =====")
#         raise


# FutureHouse API

@app.post("/recommendation-prompt-code", response_model=RecommendationPromptCodeResponse)
def recommendation_prompt_code(request: RecommendationPromptCodeRequest):
    if not OPENROUTER_API_KEY:
        raise HTTPException(status_code=500, detail="OpenRouter API key not set")
    
    def request_llm():
        return get_prompt_code(request)
    
    result = retry_get_prompt_code(request_llm, has_error, max_retries=3, delay=1.0)

    # Ensure result is a proper dictionary with string keys
    if isinstance(result, dict):
        return RecommendationPromptCodeResponse(**result)
    else:
        # Fallback if result is not a dict
        return RecommendationPromptCodeResponse(prompt="", code="", style="")

class CropFeatureRequest(BaseModel):
    screenshot_url: str
    bounding_box: dict
    feature_name: str

@app.post("/crop-feature")
async def crop_feature(request: CropFeatureRequest):
    """
    Crop a feature from a screenshot using bounding box coordinates.
    Returns a URL to the cropped image.
    """
    try:
        from PIL import Image
        import io
        
        # Parse screenshot URL to get the file path
        screenshot_id = request.screenshot_url.replace("http://localhost:8001/screenshot/", "")
        screenshots_dir = os.path.join(os.path.dirname(__file__), 'screenshots')
        
        # Find the actual screenshot file
        screenshot_path = None
        for file in os.listdir(screenshots_dir):
            if screenshot_id in file:
                screenshot_path = os.path.join(screenshots_dir, file)
                break
        
        if not screenshot_path or not os.path.exists(screenshot_path):
            raise HTTPException(status_code=404, detail="Screenshot not found")
        
        # Extract bounding box coordinates (percentages)
        bbox = request.bounding_box
        x_percent = bbox.get('x', 0)
        y_percent = bbox.get('y', 0)
        width_percent = bbox.get('width', 100)
        height_percent = bbox.get('height', 100)
        
        # Open the image and calculate pixel coordinates
        with Image.open(screenshot_path) as img:
            img_width, img_height = img.size
            
            # Convert percentages to pixels
            x = int((x_percent / 100) * img_width)
            y = int((y_percent / 100) * img_height)
            width = int((width_percent / 100) * img_width)
            height = int((height_percent / 100) * img_height)
            
            # Ensure coordinates are within image bounds
            x = max(0, min(x, img_width))
            y = max(0, min(y, img_height))
            width = max(1, min(width, img_width - x))
            height = max(1, min(height, img_height - y))
            
            # Crop the image
            cropped_img = img.crop((x, y, x + width, y + height))
            
            # Save the cropped image
            crop_id = str(uuid.uuid4())
            safe_feature_name = re.sub(r'[^a-zA-Z0-9_-]', '_', request.feature_name.lower())
            crop_filename = f'feature_{safe_feature_name}_{crop_id}.png'
            crop_path = os.path.join(CROPS_DIR, crop_filename)
            
            cropped_img.save(crop_path, 'PNG')
            
            # Return URL to the cropped image
            crop_url = f'/section-crops/{crop_filename}'
            print(f"[Backend] Feature '{request.feature_name}' cropped and saved to: {crop_url}")
            
            return {
                "success": True,
                "crop_url": crop_url,
                "message": f"Feature '{request.feature_name}' cropped successfully"
            }
            
    except ImportError:
        raise HTTPException(status_code=500, detail="PIL (Pillow) not available for image processing")
    except Exception as e:
        print(f"[Backend] Error cropping feature: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to crop feature: {str(e)}")

@app.post("/retry-bounding-boxes")
async def retry_bounding_boxes(request: Request):
    """
    Retry bounding box detection for sections that don't have them yet.
    This is useful when the initial analysis couldn't get the screenshot in time.
    """
    try:
        body = await request.json()
        sections = body.get("sections", [])
        website_url = body.get("url", "")
        screenshot_id = body.get("screenshot_id", "")
        
        if not sections:
            raise HTTPException(status_code=400, detail="No sections provided")
        
        print(f"[Backend] Retrying bounding boxes for {len(sections)} sections")
        print(f"[Backend] Website URL: {website_url}")
        print(f"[Backend] Screenshot ID: {screenshot_id}")
        
        # Try to find the screenshot using the screenshot_id
        screenshot_url = None
        screenshot_path = None
        
        if screenshot_id:
            screenshot_path = check_existing_screenshot(screenshot_id)
            if screenshot_path:
                screenshot_url = f"http://localhost:8001/screenshot/{screenshot_id}"
                print(f"[Backend] Found existing screenshot: {screenshot_url}")
        
        # If no existing screenshot found, try to take a new one
        if not screenshot_url:
            print("[Backend] No existing screenshot found, requesting new one...")
            try:
                new_screenshot_id, screenshot_path = await request_screenshot_and_wait(website_url, timeout_seconds=30)
                screenshot_url = f"http://localhost:8001/screenshot/{new_screenshot_id}"
                print(f"[Backend] New screenshot ready: {screenshot_url}")
            except Exception as e:
                print(f"[Backend] Failed to request new screenshot: {e}")
        
        if not screenshot_url:
            raise HTTPException(status_code=404, detail="No screenshot available for bounding box detection")
        
        # Extract bounding boxes
        from feature_extraction import extract_bounding_boxes_only
        bounding_boxes = await extract_bounding_boxes_only(screenshot_url, sections, website_url)
        
        if not bounding_boxes:
            return {"success": False, "message": "No bounding boxes detected", "sections": sections}
        
        # Merge bounding boxes with sections (same logic as in extract_features_logic)
        sections_with_boxes = []
        sections_matched = 0
        
        for section in sections:
            section_name = section.get('name', '')
            
            # Find matching bounding box with fuzzy matching
            matching_box = None
            best_match_score = 0
            
            for bbox in bounding_boxes:
                bbox_name = bbox.get('name', '').lower().strip()
                section_name_clean = section_name.lower().strip()
                
                match_score = 0
                if bbox_name == section_name_clean:
                    match_score = 100
                elif bbox_name in section_name_clean or section_name_clean in bbox_name:
                    match_score = 80
                elif any(word in bbox_name for word in section_name_clean.split() if len(word) > 2):
                    match_score = 60
                elif any(word in section_name_clean for word in bbox_name.split() if len(word) > 2):
                    match_score = 60
                
                if match_score > best_match_score:
                    best_match_score = match_score
                    matching_box = bbox
            
            if matching_box and best_match_score >= 60:
                section['bounding_box'] = {
                    'x': matching_box['x'],
                    'y': matching_box['y'], 
                    'width': matching_box['width'],
                    'height': matching_box['height']
                }
                sections_matched += 1
                print(f"[Backend] ✅ Added bounding box to '{section_name}' (score: {best_match_score})")
            
            sections_with_boxes.append(section)
        
        # Apply validation
        from feature_extraction import validate_and_fix_bounding_boxes
        sections_with_boxes = validate_and_fix_bounding_boxes(sections_with_boxes)
        
        return {
            "success": True,
            "message": f"Successfully added bounding boxes to {sections_matched}/{len(sections)} sections",
            "sections": sections_with_boxes,
            "screenshot_url": screenshot_url
        }
        
    except Exception as e:
        print(f"[Backend] Error in retry_bounding_boxes: {e}")
        raise HTTPException(status_code=500, detail=str(e))

mock_extraction_result = {
    "websiteFeatures": [
        {
            "featureName": "Hero Section",
            "detailedDescription": "Located at the top of the page spanning the full width. Features a bold headline 'MARKETING AUS EINER HAND' in dark blue (#1F2659) on the left side with a 48px sans-serif font (Roboto). Below is a subtitle 'Für lokale Unternehmen' in a smaller 24px font. The right side contains an illustration of a person working at a desk with digital marketing elements. The background is white with subtle light blue accents. A prominent call-to-action button 'Kostenlose Erstberatung' appears below the text in orange (#FF5722) with rounded corners (8px) and slight box-shadow. The section has approximately 90px padding on top and bottom, responsive layout that adjusts for mobile viewing.",
            "htmlStructure": "<section class=\"hero-section\">...</section>",
            "cssProperties": ".hero-section { ... }"
        },
        {
            "featureName": "Navigation Bar",
            "detailedDescription": "Fixed-position navigation bar at the top of the page with a white background (#FFFFFF) and subtle box-shadow (0 2px 10px rgba(0,0,0,0.1)). Contains the company logo on the left (30px height) and main menu links on the right. ...",
            "htmlStructure": "<header class=\"main-header\">...</header>",
            "cssProperties": ".main-header { ... }"
        },
        # ... (other sections as needed)
    ],
    "siteUXArchitecture": {
        "businessContext": "Marketing Lokalhelden provides digital marketing services specifically tailored for local businesses in Germany. ...",
        "targetAudience": "The primary audience is local business owners and managers in Germany, ...",
        "userGoals": "Users visiting this site are looking to: 1) Learn about digital marketing solutions ...",
        "navigationStructure": "The site follows a standard agency structure with a fixed top navigation ...",
        "responsiveness": "The site employs a responsive design with thoughtful mobile adaptations. ...",
        "accessibilityObservations": "The site demonstrates several accessibility best practices: proper semantic HTML structure, ..."
    },
    "brandIdentity": {
        "logoUrl": "https://www.marketing-lokalhelden.de/images/logo.svg",
        "dominantColorPalette": ["#1F2659", "#FF5722", "#FFFFFF", "#F0F5FF", "#F8F9FA"],
        "typographyStyles": "The site primarily uses the Roboto font family in various weights. ...",
        "designTone": "The design is professional yet approachable, balancing corporate trustworthiness with friendly accessibility. ..."
    },
    "companyOverview": {
        "companyName": "Marketing Lokalhelden",
        "employeeCount": "10-20 (estimated based on team references)",
        "industry": "Digital Marketing Agency",
        "headquartersLocation": "Berlin, Germany",
        "foundedYear": "2018",
        "externalLinks": {
            "LinkedIn": "https://linkedin.com/company/marketinglokalhelden",
            "Facebook": "https://facebook.com/marketinglokalhelden",
            "Instagram": "https://instagram.com/marketinglokalhelden"
        }
    }
}

class OpenRouterPromptRequest(BaseModel):
    feature_name: str
    screenshot_url: str = None
    feature_extraction_result: dict = None

@app.post("/openrouter-generate-research-prompt")
async def openrouter_generate_research_prompt(request: OpenRouterPromptRequest):
    """
    Sends a detailed prompt and screenshot to OpenRouter and returns the research prompt output.
    """
    if not OPENROUTER_API_KEY or OPENROUTER_API_KEY.startswith("sk-..."):
        raise HTTPException(status_code=500, detail="OpenRouter API key not configured")

    # Debug: Log what we received
    print(f"[DEBUG] Received feature_name: {request.feature_name}")
    print(f"[DEBUG] Received feature_extraction_result: {request.feature_extraction_result}")
    
    # Use the real data when provided, fallback to mock for testing
    extraction_result = request.feature_extraction_result if request.feature_extraction_result else mock_extraction_result
    
    # Debug: Check if the feature exists in the extraction result
    if extraction_result and "websiteFeatures" in extraction_result:
        matching_feature = next((f for f in extraction_result["websiteFeatures"] if f["featureName"] == request.feature_name), None)
        print(f"[DEBUG] Matching feature in extraction_result: {matching_feature}")
    else:
        print(f"[DEBUG] No websiteFeatures found in extraction_result")

    openrouter_prompt = build_openrouter_prompt(extraction_result, request.feature_name)

    openrouter_data = {
        'model': 'mistralai/mistral-small-3.2-24b-instruct:free', # anthropic/claude-3.5-sonnet
        'messages': [
            {
                "role": "user",
                "content": [
                    {"type": "text", "text": openrouter_prompt},
                    # {"type": "image_url", "image_url": {"url": request.screenshot_url}}
                ]
            }
        ],
        'temperature': 0.3,
        'max_tokens': 8000
    }
    headers = {
        'Authorization': f'Bearer {OPENROUTER_API_KEY}',
        'Content-Type': 'application/json',
    }
    resp = requests.post(OPENROUTER_API_URL, json=openrouter_data, headers=headers)
    if resp.status_code != 200:
        raise HTTPException(status_code=500, detail=f"OpenRouter error: {resp.text}")
    result = resp.json()
    
    # Check if the response has the expected structure
    if "choices" not in result:
        raise HTTPException(status_code=500, detail=f"Unexpected OpenRouter response format: {result}")
    
    if not result["choices"] or len(result["choices"]) == 0:
        raise HTTPException(status_code=500, detail="No choices in OpenRouter response")
    
    if "message" not in result["choices"][0]:
        raise HTTPException(status_code=500, detail=f"Unexpected choice format: {result['choices'][0]}")
    
    if "content" not in result["choices"][0]["message"]:
        raise HTTPException(status_code=500, detail=f"Unexpected message format: {result['choices'][0]['message']}")
    
    openrouter_prompt = result['choices'][0]['message']['content'].strip()
    print(f"DEBUG: openrouter_prompt: {openrouter_prompt}")
    
    # Find the first occurrence of "provide" (case-insensitive) and extract everything after it
    match = re.search(r"Research request:\s*(Provide.*)", openrouter_prompt, re.IGNORECASE | re.DOTALL)
    if match:
        prompt_to_FH = match.group(1).strip()
    else:
        prompt_to_FH = openrouter_prompt.strip()

    print(f"DEBUG: prompt_to_FH: {prompt_to_FH}")

    return {
        "feature_name": request.feature_name,
        "prompt_to_FH": openrouter_prompt,
        # "screenshot_url": request.screenshot_url,
        # "raw_openrouter_response": result
    }


def build_openrouter_prompt(extraction_result, feature_name):
    # Find the feature section
    feature = next((f for f in extraction_result["websiteFeatures"] if f["featureName"] == feature_name), None)
    if not feature:
        raise ValueError(f"Feature '{feature_name}' not found in extraction result.")

    # Gather global context
    ux = extraction_result.get("siteUXArchitecture", {})
    brand = extraction_result.get("brandIdentity", {})
    company = extraction_result.get("companyOverview", {})

    # Compose the prompt
    prompt = f"""
    Given the following website section and global context, generate a research request prompt for FutureHouse API using this format and only output the research request.
    Section:
    - Name: {feature['featureName']}
    - Description: {feature['detailedDescription']}
    - HTML Structure: {feature.get('htmlStructure', '')}
    - CSS Properties: {feature.get('cssProperties', '')}
    Global Context:
    - Business Context: {ux.get('businessContext', '')}
    - Target Audience: {ux.get('targetAudience', '')}
    - User Goals: {ux.get('userGoals', '')}
    - Navigation Structure: {ux.get('navigationStructure', '')}
    - Responsiveness: {ux.get('responsiveness', '')}
    - Accessibility: {ux.get('accessibilityObservations', '')}
    - Brand Colors: {brand.get('dominantColorPalette', '')}
    - Typography: {brand.get('typographyStyles', '')}
    - Design Tone: {brand.get('designTone', '')}
    - Company: {company.get('companyName', '')}, {company.get('industry', '')}, {company.get('headquartersLocation', '')}

    Required Output Format:
    Output only the research request below, no additional text.
    Provide a comprehensive analysis of {feature['featureName']} design in {company.get('industry', '')} websites with supporting research studies and data, specifically for {company.get('companyName', '')} based in {company.get('headquartersLocation', '')}.
    Key areas to address:
    1. User Experience Research
        - Behavioral patterns for {ux.get('targetAudience', '')}
        - Interaction analysis aligned with {ux.get('userGoals', '')}
        - Navigation effectiveness within {ux.get('navigationStructure', '')}
        - Accessibility implementation for {ux.get('accessibilityObservations', '')}
    2. Design Implementation
        - Layout optimization for {ux.get('responsiveness', '')}
        - Integration with {brand.get('designTone', '')} design principles
        - Color scheme implementation using {brand.get('dominantColorPalette', '')}
        - Typography integration of {brand.get('typographyStyles', '')}
        - Technical Architecture
    3. HTML Structure Optimization
        - HTML structure optimization: {feature.get('htmlStructure', '')}
        - CSS property implementation: {feature.get('cssProperties', '')}
        - Responsive framework considerations
        - Cross-browser compatibility solutions
    4. Business Alignment
        - Alignment with {ux.get('businessContext', '')}
        - Feature integration within {feature['detailedDescription']}
        - Performance metrics tracking
        - ROI measurement framework
    5. Implementation Guidelines
        - Development Standards
        - Quality assurance protocols
        - Performance benchmarks
        - Maintenance requirements
    Format requirements:
        - Include quantitative data and analytics
        - Reference industry-specific case studies
        - Provide technical specifications
        - Document accessibility compliance
        - Detail responsive design guidelines

    Target audience context: Industry: {company.get('industry', '')} Target Users: {ux.get('targetAudience', '')} Business Goals: {ux.get('businessContext', '')}
    Please maintain consistent analysis depth across all sections while emphasizing {company.get('companyName', '')}'s specific needs and market position.
    """
    return prompt


@app.post("/futurehouse-research-prompt-direct")
def futurehouse_research_prompt_direct(data: dict = Body(...)):
    """
    Accepts a raw prompt and sends it directly to FutureHouse API.
    Expects data = { 'prompt': str }
    """
    prompt = data.get("prompt", "")
    # Call FutureHouse API with the generated prompt
    if not prompt:
        raise HTTPException(status_code=400, detail="Missing prompt in request body.")
    FUTURE_HOUSE_API_KEY = os.getenv("FUTURE_HOUSE_API_KEY", "")
    if not FUTURE_HOUSE_API_KEY:
        raise HTTPException(status_code=500, detail="Future House API key not set.")
    client = FutureHouseClient(api_key=FUTURE_HOUSE_API_KEY)
    task_data = {
        "name": JobNames.CROW,
        "query": prompt.strip(),
    }
    try:
        task_response = client.run_tasks_until_done(task_data)
        print("[DEBUG]: Raw FutureHouse API response:", task_response)

        # Safely extract answer and formatted_answer from task_response
        if (
            not task_response
            or not isinstance(task_response, list)
            or len(task_response) == 0
        ):
            raise ValueError("Invalid or empty response from FutureHouse API")

        # Get the first response object
        response_obj = task_response[0]

        # Safely extract answer and formatted_answer with error handling
        if isinstance(response_obj, dict):
            answer = response_obj.get("answer", "")
            formatted_answer = response_obj.get("formatted_answer", "")
        else:
            answer = getattr(response_obj, "answer", "")
            formatted_answer = getattr(response_obj, "formatted_answer", "")

        # Extract references from formatted_answer
        references = []
        if formatted_answer and isinstance(formatted_answer, str):
            references = extract_papers_from_formatted_answer(formatted_answer)

        # Split answer into recommendations if answer exists and is a string
        recommendations = []
        if answer and isinstance(answer, str):
            recommendations = [rec.strip() for rec in answer.split("\n") if rec.strip()]
        
        print(f"[DEBUG]: recommendations: {recommendations}")
        print(f"[DEBUG]: references: {references}")

        return {
            "prompt": prompt.strip(),
            "task_response": {"answer": answer, "formatted_answer": formatted_answer},
            "recommendations": recommendations,
            "papers": references,
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"FutureHouse API error: {str(e)}")


def extract_papers_from_formatted_answer(formatted_answer):
    papers = []
    # Find the References section
    refs_match = re.search(r"References\s*\n(.+)", formatted_answer, re.DOTALL)
    if not refs_match:
        return papers  # No references found

    refs_text = refs_match.group(1)

    # Split into individual references (numbered)
    ref_entries = re.findall(r"\n?\s*(\d+)\.\s*\(([^)]+)\):\s*([^\n]+)", refs_text)
    # Each entry: (number, citation_key, title)
    for num, citation_key, title in ref_entries:
        # Optionally, parse citation_key for more info (e.g., authors, pages)
        # Example: "unknownauthors2017digitalmarketingin pages 14-18"
        # You can split by ' pages ' if you want
        if ' pages ' in citation_key:
            authors_part, pages_part = citation_key.split(' pages ', 1)
        else:
            authors_part, pages_part = citation_key, ''
        papers.append({
            "number": int(num),
            "citation_key": citation_key,
            "title": title.strip(),
            "authors": authors_part.strip(),
            "pages": pages_part.strip(),
        })
    return papers


class SummarizeRecommendationsRequest(BaseModel):
    answer: str = ""    # The answer from task_response
    references: List[Dict[str, Any]] = []
    context: dict = None          # optional, e.g., feature name, section, etc.

class SummarizeRecommendationsResponse(BaseModel):
    summary_text: str = ""     # or str, or dict, depending on your needs
    raw_openrouter_response: dict


@app.post("/openrouter-summarize-recommendations", response_model=SummarizeRecommendationsResponse)
def openrouter_summarize_recommendations(request: SummarizeRecommendationsRequest):
    """
    Accepts recommendations from FutureHouse, sends them to OpenRouter to summarize and turn into actionable improvements.
    """
    if not OPENROUTER_API_KEY or OPENROUTER_API_KEY == 'sk-...':
        raise HTTPException(status_code=500, detail="OpenRouter API key not set. Please add OPENROUTER_API_KEY to your .env file.")

    references_str = format_references_for_prompt(request.references)
    print(f"[DEBUG]: references_str: {references_str}")

    # Compose the prompt for OpenRouter
    prompt = (
        f"Using the FutureHouse research findings below, analyze the following website section and generate a comprehensive UI/UX improvement strategy:\n\n"
    
        f"[FutureHouse Research Analysis]\n"
        f"{request.answer}\n\n"
        
        f"[Website Section Analysis]\n"
        f"Context: {json.dumps(request.context) if request.context else ''}\n\n"

        f"[Reference Database]\n"
        f"{references_str}\n\n"

        f"REFERENCE MATCHING INSTRUCTIONS:\n"
        f"1. Extract all citations mentioned in the research analysis\n"
        f"2. Match each citation against the provided reference database\n"
        f"3. Use format: [Author, Year] for in-text citations\n"
        f"4. Flag any citations that cannot be matched\n"
        f"5. Ensure every claim is properly attributed\n"
        f"6. Create a validation report showing match success rate\n\n"
        f"REFERENCE PROCESSING RULES:\n"
        f"- Only use information that can be properly cited\n"
        f"- If a citation cannot be matched, note it as [UNVERIFIED]\n"
        f"- Prioritize information with strong reference backing\n"
        f"- Include page numbers or section references where available\n"
        f"- Maintain citation consistency throughout the document\n\n"

        
        f"Required Output Format:\n"
        f"Title: \"Strategic UI/UX Improvements for [Website/Company Name]'s [Section Name]\"\n\n"
        
        # KEEPING YOUR ORIGINAL SECTIONS
        f"1. Research Summary (Single Paragraph):\n"
        f"Extract and synthesize from FutureHouse research:\n"
        f"- Primary research scope\n"
        f"- Key quantitative findings\n"
        f"- Critical design principles\n"
        f"- Performance impact statistics\n"
        f"- User behavior patterns\n"
        f"- Technical optimization results\n\n"
        
        f"2. Key Improvement Categories:\n"
        f"[Extract categories directly from FutureHouse research findings]\n"
        f"For each identified category from the research, provide:\n"
        f"A. Problem Definition\n"
        f"- Research-backed issue identification\n"
        f"- Quantified impact metrics\n"
        f"- Current performance gaps\n"
        f"- User behavior data\n"
        f"B. Strategic Solution\n"
        f"- Evidence-based recommendations\n"
        f"- Design specifications aligned with research\n"
        f"- Implementation considerations:\n"
        f"   * Desktop optimization\n"
        f"   * Mobile adaptation\n"
        f"   * Accessibility requirements\n"
        f"- Expected outcomes based on research metrics\n\n"
        
        # IMPROVED IMPLEMENTATION ROADMAP
        f"3. Executable Implementation Specifications:\n"
        f"Prioritized UI/UX improvements with complete implementation details:\n\n"
        f"CRITICAL PRIORITY (Implement First):\n"
        f"For each critical component, provide:\n"
        f"- Component Name: [Descriptive name]\n"
        f"- Visual Description: [Detailed appearance, layout, colors, typography, spacing]\n"
        f"- Functional Behavior: [User interactions, state changes, animations, transitions]\n"
        f"- Content Structure: [Data fields, text content, media elements, hierarchy]\n"
        f"- Responsive Behavior: [How it adapts across screen sizes, breakpoints]\n"
        f"- Accessibility Features: [ARIA labels, keyboard navigation, screen reader support]\n"
        f"- Performance Requirements: [Load time targets, animation frame rates, optimization needs]\n"
        f"- Integration Points: [APIs, data sources, existing system connections]\n"
        f"- Success Criteria: [Measurable outcomes, testing requirements]\n"
        f"- Implementation Context: [Where it fits in the page/app, surrounding elements]\n\n"
        f"HIGH PRIORITY (Implement Second):\n"
        f"[Same detailed format as Critical Priority]\n\n"
        f"MEDIUM PRIORITY (Implement Third):\n"
        f"[Same detailed format as Critical Priority]\n\n"
        
        f"CODE GENERATION READY:\n"
        f"These descriptions contain sufficient detail for direct code generation without additional clarification.\n\n"
    )

    print(f"[DEBUG]: prompt: {prompt}")

    data = {
        "model": "anthropic/claude-3.5-sonnet",  # Using Claude for better summarization
        "messages": [
            {"role": "user", "content": prompt}
        ],
        "temperature": 0.3,
        "max_tokens": 8000,
    }
    headers = {
        "Authorization": f"Bearer {OPENROUTER_API_KEY}",
        "Content-Type": "application/json",
    }
    resp = requests.post(OPENROUTER_API_URL, json=data, headers=headers)
    if resp.status_code != 200:
        raise HTTPException(status_code=500, detail=f"OpenRouter error: {resp.text}")
    
    result = resp.json()
    print(f"[DEBUG] OpenRouter response structure: {list(result.keys())}")
    print(f"[DEBUG] Full response: {result}")
    
    # Check if the response has the expected structure
    if "choices" not in result:
        raise HTTPException(status_code=500, detail=f"Unexpected OpenRouter response format: {result}")
    
    if not result["choices"] or len(result["choices"]) == 0:
        raise HTTPException(status_code=500, detail="No choices in OpenRouter response")
    
    if "message" not in result["choices"][0]:
        raise HTTPException(status_code=500, detail=f"Unexpected choice format: {result['choices'][0]}")
    
    if "content" not in result["choices"][0]["message"]:
        raise HTTPException(status_code=500, detail=f"Unexpected message format: {result['choices'][0]['message']}")
    
    summary_text = result["choices"][0]["message"]["content"].strip()
    print(f"[DEBUG]: summary_text: {summary_text}")

    # Optionally, split into a list if you want structured output
    # improvements = [line.lstrip("-•* ").strip() for line in summary_text.split("\n") if line.strip()]
    # print(f"[DEBUG]: improvements: {improvements}")

    return SummarizeRecommendationsResponse(
        summary_text=summary_text,
        raw_openrouter_response=result
    )


def build_context(extraction_result, feature_name):
    feature = next((f for f in extraction_result["websiteFeatures"] if f["featureName"] == feature_name), None)
    return {
        "feature": {
            "featureName": feature.get("featureName"),
            "detailedDescription": feature.get("detailedDescription"),
            "htmlStructure": feature.get("htmlStructure"),
            "cssProperties": feature.get("cssProperties"),
        },
        "siteUXArchitecture": extraction_result.get("siteUXArchitecture"),
        "brandIdentity": extraction_result.get("brandIdentity"),
        "companyOverview": extraction_result.get("companyOverview"),
    }


# a helper function to turn your references list into a readable string for the LLM
def format_references_for_prompt(references):
    if not references:
        return ""
    lines = []
    for ref in references:
        # Example: 1. Online Lead Generation in B2B Marketing... (2020) by unknownauthors2020onlineleadgeneration, pages 101-104
        line = f"{ref.get('number', '')}. {ref.get('title', '')} ({ref.get('authors', '')}, pages {ref.get('pages', '')})"
        lines.append(line)
    return "\n".join(lines)


@app.post("/resolve-authors")
def resolve_authors(data: dict = Body(...)):
    """
    Resolve real author names for academic papers with 'unknownauthors' citations.
    Uses OpenRouter with o4-mini to identify real authors from paper titles.
    """
    if not OPENROUTER_API_KEY:
        raise HTTPException(status_code=500, detail="OpenRouter API key not set.")
    
    titles = data.get("titles", [])
    if not titles:
        return {"authorsMap": {}}
    
    prompt = f"""Given these academic paper titles, provide the real author names. These are known papers from Finnish university repositories:

{chr(10).join(f'{i + 1}. "{title}"' for i, title in enumerate(titles))}

Please respond with a JSON object mapping each title to its author(s) in this exact format:
{{
  "title1": "Author Name",
  "title2": "Author Name", 
  "title3": "Author Name"
}}

Use the exact titles as keys. For multiple authors, use format: "First Author, Second Author"

Known information:
- "Online Lead Generation in B2B Marketing: The Role of Conversion Design on the Corporate Website" by Mathias Lehtinen
- "How user experience design can improve marketing performance of a website" by Timur Arifulin  
- "Conversion rate optimization in online stores for high involvement products with the use of conjoint analysis" by Pauline Sell"""

    try:
        response = requests.post(
            OPENROUTER_API_URL,
            headers={
                "Authorization": f"Bearer {OPENROUTER_API_KEY}",
                "Content-Type": "application/json",
            },
            json={
                "model": "openai/gpt-4o-mini",
                "messages": [{"role": "user", "content": prompt}],
                "temperature": 0.1,
            }
        )
        
        if response.status_code != 200:
            raise HTTPException(status_code=500, detail=f"OpenRouter error: {response.text}")
        
        result = response.json()
        
        # Check if the response has the expected structure
        if "choices" not in result:
            raise HTTPException(status_code=500, detail=f"Unexpected OpenRouter response format: {result}")
        
        if not result["choices"] or len(result["choices"]) == 0:
            raise HTTPException(status_code=500, detail="No choices in OpenRouter response")
        
        if "message" not in result["choices"][0]:
            raise HTTPException(status_code=500, detail=f"Unexpected choice format: {result['choices'][0]}")
        
        if "content" not in result["choices"][0]["message"]:
            raise HTTPException(status_code=500, detail=f"Unexpected message format: {result['choices'][0]['message']}")
        
        content = result["choices"][0]["message"]["content"].strip()
        
        # Try to extract JSON from the response
        import json
        try:
            # Try direct JSON parsing first
            authorsMap = json.loads(content)
        except json.JSONDecodeError:
            # Try to extract JSON substring if LLM wraps it
            import re
            json_match = re.search(r'\{[\s\S]*\}', content)
            if json_match:
                authorsMap = json.loads(json_match.group(0))
            else:
                print(f"Could not parse JSON from OpenRouter response: {content}")
                authorsMap = {}
        
        print(f"[DEBUG] Resolved authors: {authorsMap}")
        return {"authorsMap": authorsMap}
        
    except Exception as e:
        print(f"Error resolving authors: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Author resolution error: {str(e)}")


if __name__ == "__main__":
    import uvicorn

    print("Starting Main API Server...")
    print("Server will be available at: http://localhost:8000")
    print("API Documentation: http://localhost:8000/docs")
    uvicorn.run(app, host="0.0.0.0", port=8000) 
