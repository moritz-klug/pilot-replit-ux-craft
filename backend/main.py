import os
import asyncio
import requests
import json
from fastapi import FastAPI, HTTPException, UploadFile, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
from fastapi.responses import StreamingResponse
import aiofiles
import base64
import uuid
from fastapi.staticfiles import StaticFiles
import glob

# Correct import for the official client
from futurehouse_client import FutureHouseClient, JobNames

# Load environment variables from .env file
load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), '.env'))

print("DEBUG: FUTURE_HOUSE_API_KEY =", os.getenv('FUTURE_HOUSE_API_KEY'))

FUTURE_HOUSE_API_KEY = os.getenv('FUTURE_HOUSE_API_KEY', '')
FIRECRAWL_API_KEY = os.getenv('FIRECRAWL_API_KEY', '')

app = FastAPI()

# Allow CORS for local frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class AnalyzeRequest(BaseModel):
    url: str

async def analysis_and_screenshot_stream(url: str):
    """
    Orchestrator that takes a screenshot and runs analysis,
    streaming progress and results back to the client.
    """
    screenshot_id = None
    try:
        # Step 1: Trigger screenshot server
        yield "event: progress\ndata: {\"message\": \"📸 Requesting screenshot...\"}\n\n"
        screenshot_payload = {"url": url, "full_page": True}
        response = requests.post("http://localhost:8001/screenshot", json=screenshot_payload, timeout=10)
        response.raise_for_status()
        screenshot_id = response.json().get("screenshot_id")
        yield f"event: screenshot_id\ndata: {{\"screenshot_id\": \"{screenshot_id}\"}}\n\n"
        yield "event: progress\ndata: {\"message\": \"✅ Screenshot requested. Analyzing URL...\"}\n\n"

    except requests.exceptions.RequestException as e:
        error_message = f"Failed to connect to screenshot server: {e}"
        yield f"event: error\ndata: {{\"error\": \"{error_message}\"}}\n\n"
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
        await asyncio.sleep(1) # Simulate work
        yield f"event: progress\ndata: {{\"message\": \"{step}\"}}\n\n"

    # Step 3: Yield final analysis result
    final_analysis_data = {
        "report": {
            "title": "Simulated UI/UX Analysis",
            "summary": "This is a simulated analysis. The full implementation will provide a detailed breakdown of UI components identified from the screenshot.",
            "components": [
                {"name": "Header", "description": "Contains navigation and logo. Good contrast.", "style_info": "position: sticky"},
                {"name": "Hero Section", "description": "Main call-to-action is clear.", "style_info": "background: #f0f0f0"},
                {"name": "Footer", "description": "Includes contact information and social links.", "style_info": "padding: 2rem"}
            ]
        }
    }
    yield f"event: analysis_complete\ndata: {json.dumps(final_analysis_data)}\n\n"


@app.post("/analyze-with-screenshot")
async def analyze_url_with_screenshot(request: AnalyzeRequest):
    """
    Takes a URL, triggers a screenshot, and streams back analysis progress.
    """
    return StreamingResponse(
        analysis_and_screenshot_stream(request.url),
        media_type="text/event-stream"
    )

class RecommendationRequest(BaseModel):
    feature: str
    currentDesign: str
    context: str = ''

class Paper(BaseModel):
    title: str
    authors: list[str]
    year: int
    url: str
    relevance: str

class RecommendationResponse(BaseModel):
    recommendations: list[str]
    papers: list[Paper]

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
        answer = getattr(task_response, 'answer', '')
        formatted_answer = getattr(task_response, 'formatted_answer', '')
        # Extract references/papers if available
        papers = []
        if hasattr(task_response, 'references') and task_response.references:
            for ref in task_response.references:
                papers.append(Paper(
                    title=ref.get('title', ''),
                    authors=ref.get('authors', []),
                    year=ref.get('year', 0),
                    url=ref.get('url', ''),
                    relevance=ref.get('snippet', '')
                ))
        # Recommendations: split answer or formatted_answer into actionable items
        recommendations = [rec.strip() for rec in answer.split('\n') if rec.strip()]
        return RecommendationResponse(recommendations=recommendations, papers=papers)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"FutureHouse API error: {str(e)}")

OPENROUTER_API_KEY = os.getenv('OPENROUTER_API_KEY', 'sk-...')  # Replace with your key or .env
OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions'
OPENROUTER_MODEL = 'openrouter/auto'  # Can be changed
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

Then as an outcome user receives the sections with cropped images and all the other details.
Show sections with all the details etc. 
'''

class AnalyzeUIRequest(BaseModel):
    url: str

class ChatRequest(BaseModel):
    message: str
    feature_name: str
    context: str = ""

class ChatResponse(BaseModel):
    response: str

import time

def sse_event(event: str, data: str) -> str:
    return f"event: {event}\ndata: {data}\n\n"

@app.get('/analyze-ui')
async def analyze_ui(request: Request):
    url = request.query_params.get('url')
    if not url:
        async def event_stream():
            print('[DEBUG] Missing url parameter')
            yield sse_event('error', '{"error": "Missing url parameter."}')
            return
        return StreamingResponse(event_stream(), media_type="text/event-stream")
    async def event_stream():
        try:
            print('[DEBUG] Requesting screenshot for URL:', url)
            yield sse_event('progress', '{"message": "📸 Requesting screenshot..."}')
            screenshot_payload = {"url": url, "full_page": True}
            screenshot_response = requests.post("http://localhost:8001/screenshot", json=screenshot_payload, timeout=30)
            screenshot_response.raise_for_status()
            screenshot_id = screenshot_response.json().get("screenshot_id")
            screenshots_dir = os.path.join(os.path.dirname(__file__), 'screenshots')
            print('[DEBUG] Absolute screenshots_dir:', os.path.abspath(screenshots_dir))
            pattern = f'_{screenshot_id}.png'
            print('[DEBUG] Manual search for files ending with:', pattern)
            screenshot_path = None
            for i in range(30):
                files_in_dir = os.listdir(screenshots_dir)
                matching_files = [f for f in files_in_dir if f.endswith(pattern)]
                print(f'[DEBUG] Attempt {i+1}: Files in screenshots_dir:', files_in_dir)
                if matching_files:
                    screenshot_path = os.path.abspath(os.path.normpath(os.path.join(screenshots_dir, matching_files[0])))
                    print('[DEBUG] Found screenshot file:', screenshot_path)
                    break
                await asyncio.sleep(1)
            if not screenshot_path:
                print('[ERROR] Screenshot not ready after timeout (manual search)')
                yield sse_event('error', '{"error": "Screenshot not ready after timeout."}')
                return
            print('[DEBUG] Screenshot requested, id:', screenshot_id)
            print('[DEBUG] Checking for screenshot at:', screenshot_path)

            # 2. Wait for screenshot to be ready
            yield sse_event('progress', '{"message": "⏳ Waiting for screenshot to be ready..."}')
            for i in range(30):
                if os.path.exists(screenshot_path):
                    print(f'[DEBUG] Screenshot file found after {i+1} seconds:', screenshot_path)
                    break
                await asyncio.sleep(1)
            else:
                print('[ERROR] Screenshot not ready after timeout')
                yield sse_event('error', '{"error": "Screenshot not ready after timeout."}')
                return
            yield sse_event('progress', '{"message": "✅ Screenshot ready. Sending to LLM..."}')

            # 3. Send screenshot + URL to OpenRouter LLM
            try:
                print('[DEBUG] Encoding screenshot as base64')
                with open(screenshot_path, 'rb') as img_file:
                    img_b64 = base64.b64encode(img_file.read()).decode('utf-8')
                # Prepare vision API format for OpenRouter
                image_data_url = f"data:image/png;base64,{img_b64}"
                data = {
                    'model': OPENROUTER_MODEL,
                    'messages': [
                        {
                            "role": "user",
                            "content": [
                                {"type": "text", "text": f"Website URL: {url}. {ANALYSIS_PROMPT}"},
                                {"type": "image_url", "image_url": {"url": image_data_url}}
                            ]
                        }
                    ]
                }
                headers = {
                    'Authorization': f'Bearer {OPENROUTER_API_KEY}',
                    'Content-Type': 'application/json',
                }
                print('[DEBUG] Sending request to OpenRouter LLM')
                # Save request to file for debugging
                import datetime
                debug_filename = f'openrouter_request_{datetime.datetime.now().strftime("%Y%m%d_%H%M%S_%f")}.txt'
                debug_path = os.path.join(os.path.dirname(__file__), debug_filename)
                with open(debug_path, 'w', encoding='utf-8') as f:
                    f.write('MODEL: ' + str(OPENROUTER_MODEL) + '\n')
                    f.write('HEADERS: ' + str(headers) + '\n')
                    import json as _json
                    f.write('DATA: ' + _json.dumps(data, indent=2))
                yield sse_event('progress', '{"message": "🤖 Waiting for LLM analysis..."}')
                resp = requests.post(OPENROUTER_API_URL, json=data, headers=headers)
                print('[DEBUG] LLM response status:', resp.status_code)
                print('[DEBUG] LLM response text (first 500 chars):', resp.text[:500])
                if resp.status_code != 200:
                    print('[ERROR] OpenRouter error:', resp.text)
                    yield sse_event('error', f'{{"error": "OpenRouter error: {resp.text}"}}')
                    return
                llm_result = resp.json()
            except Exception as e:
                print('[ERROR] Exception during LLM call:', e)
                yield sse_event('error', f'{{"error": "Failed to call LLM: {str(e)}"}}')
                return

            # 4. Parse LLM response
            try:
                print('[DEBUG] Parsing LLM response')
                analysis = json.loads(llm_result['choices'][0]['message']['content'])
                print('[DEBUG] Parsed analysis:', str(analysis)[:500])
            except Exception as e:
                print('[ERROR] Failed to parse LLM response:', e)
                yield sse_event('error', f'{{"error": "Failed to parse LLM response: {e}"}}')
                return

            # 5. Save cropped images to disk and replace base64 with URLs
            for section in analysis.get('sections', []):
                if 'cropped_image_base64' in section:
                    img_bytes = base64.b64decode(section['cropped_image_base64'])
                    crop_id = str(uuid.uuid4())
                    crop_path = os.path.join(CROPS_DIR, f'section_{crop_id}.png')
                    print('[DEBUG] Saving cropped image:', crop_path)
                    async with aiofiles.open(crop_path, 'wb') as f:
                        await f.write(img_bytes)
                    section['cropped_image_url'] = f'/section-crops/section_{crop_id}.png'
                    del section['cropped_image_base64']

            analysis['screenshot_id'] = screenshot_id
            print('[DEBUG] Yielding analysis result')
            yield sse_event('progress', '{"message": "🎉 Analysis complete."}')
            yield sse_event('result', json.dumps(analysis))
        except Exception as e:
            print('[ERROR] Exception in event_stream:', e)
            yield sse_event('error', f'{{"error": "Internal server error: {e}"}}')
            return

    return StreamingResponse(event_stream(), media_type="text/event-stream")

@app.post("/chat", response_model=ChatResponse)
async def chat_with_feature(request: ChatRequest):
    """
    Chat endpoint that uses OpenRouter to provide feature-specific advice
    """
    if not OPENROUTER_API_KEY or OPENROUTER_API_KEY.startswith('sk-...'):
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
            'model': OPENROUTER_MODEL,
            'messages': [
                {
                    "role": "system",
                    "content": system_prompt
                },
                {
                    "role": "user", 
                    "content": request.message
                }
            ],
            'temperature': 0.7,
            'max_tokens': 1000
        }
        
        headers = {
            'Authorization': f'Bearer {OPENROUTER_API_KEY}',
            'Content-Type': 'application/json',
        }
        
        print(f'[DEBUG] Sending chat request for {request.feature_name}')
        resp = requests.post(OPENROUTER_API_URL, json=data, headers=headers)
        
        if resp.status_code != 200:
            print('[ERROR] OpenRouter chat error:', resp.text)
            raise HTTPException(status_code=500, detail=f"OpenRouter error: {resp.text}")
            
        result = resp.json()
        response_text = result['choices'][0]['message']['content']
        
        return ChatResponse(response=response_text)
        
    except Exception as e:
        print('[ERROR] Exception during chat:', e)
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
app.mount('/section-crops', StaticFiles(directory=CROPS_DIR), name='section-crops')

if __name__ == "__main__":
    import uvicorn
    print("Starting Main API Server...")
    print("Server will be available at: http://localhost:8000")
    print("API Documentation: http://localhost:8000/docs")
    uvicorn.run(app, host="0.0.0.0", port=8000) 