import os
import asyncio
from openai.types.batch import Errors
import requests
import json
from fastapi import FastAPI, HTTPException, UploadFile, Request, Body
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
from fastapi.responses import StreamingResponse
import aiofiles
import base64
import uuid
from fastapi.staticfiles import StaticFiles
import glob
from typing import List, Dict, Any
import openai
import re

# Correct import for the official client
from futurehouse_client import FutureHouseClient, JobNames
from feature_extraction import extract_features_logic

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
        yield 'event: progress\ndata: {"message": "📸 Requesting screenshot..."}\n\n'
        screenshot_payload = {"url": url, "full_page": True}
        response = requests.post(
            "http://localhost:8001/screenshot", json=screenshot_payload, timeout=10
        )
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
OPENROUTER_MODEL = 'mistralai/mistral-small-3.1-24b-instruct:free'  # Can be changed
CROPS_DIR = os.path.join(os.path.dirname(__file__), 'section_crops')
os.makedirs(CROPS_DIR, exist_ok=True)

ANALYSIS_PROMPT = """You are an advanced UI/UX analyst, visual design expert, and business intelligence extractor. Given website URL and screenshot, perform the following complete analysis pipeline:
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
"""


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
            print("[DEBUG] Requesting screenshot for URL:", url)
            yield sse_event("progress", '{"message": "📸 Requesting screenshot..."}')
            screenshot_payload = {"url": url, "full_page": True}
            screenshot_response = requests.post(
                "http://localhost:8001/screenshot", json=screenshot_payload, timeout=30
            )
            screenshot_response.raise_for_status()
            screenshot_id = screenshot_response.json().get("screenshot_id")
            screenshots_dir = os.path.join(os.path.dirname(__file__), "screenshots")
            print("[DEBUG] Absolute screenshots_dir:", os.path.abspath(screenshots_dir))
            pattern = f"_{screenshot_id}.png"
            print("[DEBUG] Manual search for files ending with:", pattern)
            screenshot_path = None
            for i in range(30):
                files_in_dir = os.listdir(screenshots_dir)
                matching_files = [f for f in files_in_dir if f.endswith(pattern)]
                print(f"[DEBUG] Attempt {i+1}: Files in screenshots_dir:", files_in_dir)
                if matching_files:
                    screenshot_path = os.path.abspath(
                        os.path.normpath(
                            os.path.join(screenshots_dir, matching_files[0])
                        )
                    )
                    print("[DEBUG] Found screenshot file:", screenshot_path)
                    break
                await asyncio.sleep(1)
            if not screenshot_path:
                print("[ERROR] Screenshot not ready after timeout (manual search)")
                yield sse_event(
                    "error", '{"error": "Screenshot not ready after timeout."}'
                )
                return
            print("[DEBUG] Screenshot requested, id:", screenshot_id)
            print("[DEBUG] Checking for screenshot at:", screenshot_path)

            # 2. Wait for screenshot to be ready
            yield sse_event(
                "progress", '{"message": "⏳ Waiting for screenshot to be ready..."}'
            )
            for i in range(30):
                if os.path.exists(screenshot_path):
                    print(
                        f"[DEBUG] Screenshot file found after {i+1} seconds:",
                        screenshot_path,
                    )
                    break
                await asyncio.sleep(1)
            else:
                print("[ERROR] Screenshot not ready after timeout")
                yield sse_event(
                    "error", '{"error": "Screenshot not ready after timeout."}'
                )
                return
            yield sse_event(
                "progress", '{"message": "✅ Screenshot ready. Sending to LLM..."}'
            )

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
        response_text = result["choices"][0]["message"]["content"]

        return ChatResponse(response=response_text)

    except Exception as e:
        print("[ERROR] Exception during chat:", e)
        raise HTTPException(status_code=500, detail=f"Chat error: {str(e)}")

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
    currentDesign: str
    latestRecommendation: str

class RecommendationPromptCodeResponse(BaseModel):
    lovable_prompt: str
    cursor_prompt: str
    bolt_prompt: str
    vercel_prompt: str
    replit_prompt: str
    magic_prompt: str
    sitebrew_prompt: str
    react_code: str  
    vue_code: str    
    angular_code: str 

def encode_code_block(code: str) -> str:
    if not code:
        return ""
    return base64.b64encode(code.encode('utf-8')).decode('utf-8')

import time

def retry_get_prompt_code(requests_llm, retry_error, max_retries=3, delay=1.0):
    for i in range(max_retries):
        result = requests_llm()
        if not retry_error(result):
            return result
        time.sleep(delay * ( i ** 2))
    return result

def has_error(result):
    errors = {"Could not generate prompt", "Could not generate code"}
    return any(value in errors for value in result.values())

def get_prompt_code(request):
    prompt = (
        f"Feature: {request.featureName}\n"
        f"Latest recommendation:\n{request.latestRecommendation}\n\n"
        f"Generate platform-specific prompts and code:\n\n"
        f"1. React component (TypeScript + styles)\n"
        f"2. Vue 3 component (Composition API + styles)\n"
        f"3. Angular component (TypeScript + styles)\n"
        f"4. Lovable prompt: Optimized for Lovable AI with UX focus\n"
        f"5. Cursor prompt: For Cursor IDE with technical details\n"
        f"6. Bolt prompt: For Bolt.new with design trends\n"
        f"7. Vercel prompt: For v0 with production focus\n"
        f"8. Replit prompt: For Replit with documentation\n"
        f"9. Magic prompt: For Magic Patterns with advanced UI\n"
        f"10. Sitebrew prompt: For sitebrew.ai with enterprise focus\n\n"
        f"Return ONLY code without markdown or file names.\n\n"
        f"Format:\n"
        f"---REACT---\n"
        f"[React code]\n"
        f"---VUE---\n"
        f"[Vue code]\n"
        f"---ANGULAR---\n"
        f"[Angular code]\n"
        f"---LOVABLE---\n"
        f"[Lovable prompt]\n"
        f"---CURSOR---\n"
        f"[Cursor prompt]\n"
        f"---BOLT---\n"
        f"[Bolt prompt]\n"
        f"---VERCEL---\n"
        f"[Vercel prompt]\n"
        f"---REPLIT---\n"
        f"[Replit prompt]\n"
        f"---MAGIC---\n"
        f"[Magic prompt]\n"
        f"---SITEBREW---\n"
        f"[Sitebrew prompt]\n"
        f"---END---\n"
    )
    
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

@app.post("/extract-features")
async def extract_features(request: Request):
    print("[DEBUG] /extract-features endpoint called")
    return await extract_features_logic(request)

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
    currentDesign: str
    latestRecommendation: str

class RecommendationPromptCodeResponse(BaseModel):
    lovable_prompt: str
    cursor_prompt: str
    bolt_prompt: str
    vercel_prompt: str
    replit_prompt: str
    magic_prompt: str
    sitebrew_prompt: str
    react_code: str  
    vue_code: str    
    angular_code: str 

def encode_code_block(code: str) -> str:
    if not code:
        return ""
    return base64.b64encode(code.encode('utf-8')).decode('utf-8')

import time

def retry_get_prompt_code(requests_llm, retry_error, max_retries=3, delay=1.0):
    for i in range(max_retries):
        result = requests_llm()
        if not retry_error(result):
            return result
        time.sleep(delay * ( i ** 2))
    return result

def has_error(result):
    errors = {"Could not generate prompt", "Could not generate code"}
    return any(value in errors for value in result.values())

def get_prompt_code(request):
    prompt = (
        f"Feature: {request.featureName}\n"
        f"Latest recommendation:\n{request.latestRecommendation}\n\n"
        f"Generate platform-specific prompts and code:\n\n"
        f"1. React component (TypeScript + styles)\n"
        f"2. Vue 3 component (Composition API + styles)\n"
        f"3. Angular component (TypeScript + styles)\n"
        f"4. Lovable prompt: Optimized for Lovable AI with UX focus\n"
        f"5. Cursor prompt: For Cursor IDE with technical details\n"
        f"6. Bolt prompt: For Bolt.new with design trends\n"
        f"7. Vercel prompt: For v0 with production focus\n"
        f"8. Replit prompt: For Replit with documentation\n"
        f"9. Magic prompt: For Magic Patterns with advanced UI\n"
        f"10. Sitebrew prompt: For sitebrew.ai with enterprise focus\n\n"
        f"Return ONLY code without markdown or file names.\n\n"
        f"Format:\n"
        f"---REACT---\n"
        f"[React code]\n"
        f"---VUE---\n"
        f"[Vue code]\n"
        f"---ANGULAR---\n"
        f"[Angular code]\n"
        f"---LOVABLE---\n"
        f"[Lovable prompt]\n"
        f"---CURSOR---\n"
        f"[Cursor prompt]\n"
        f"---BOLT---\n"
        f"[Bolt prompt]\n"
        f"---VERCEL---\n"
        f"[Vercel prompt]\n"
        f"---REPLIT---\n"
        f"[Replit prompt]\n"
        f"---MAGIC---\n"
        f"[Magic prompt]\n"
        f"---SITEBREW---\n"
        f"[Sitebrew prompt]\n"
        f"---END---\n"
    )
    
    try:
        data = {
            'model': OPENROUTER_MODEL,
            'messages': [
                {
                    "role": "user",
                    "content": prompt
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
        response_text = results['choices'][0]['message']['content']
        
        try:
            sections = ['LOVABLE', 'CURSOR', 'BOLT', 'VERCEL', 'REPLIT', 'MAGIC', 'SITEBREW', 'REACT', 'VUE', 'ANGULAR']
            result = {}
            
            for i, section in enumerate(sections):
                pattern = rf'---{section}---\n(.*?)\n---(?!{section})'
                match = re.search(pattern, response_text, re.DOTALL)
                content = match.group(1).strip() if match else ("Could not generate prompt" if i < 7 else "Could not generate code")
                result[section.lower() + ('_prompt' if i < 7 else '_code')] = content
            
            def clean_code(code: str) -> str:
                code = re.sub(r'```[a-zA-Z]*\s*\n?|```[a-zA-Z]*$|```', '', code)
                code = re.sub(r'^(Angular|React|Vue)\s+(with\s+TypeScript|component):\s*$', '', code, flags=re.MULTILINE | re.IGNORECASE)
                code = re.sub(r'^[A-Za-z0-9_-]+\.(vue|tsx|ts|jsx|js|css|html)\s*$', '', code, flags=re.MULTILINE)
                code = re.sub(r'^(vue|tsx|ts|jsx|js|css|html)\s*$', '', code, flags=re.MULTILINE)
                return '\n'.join(line for line in code.split('\n') if line.strip()).strip()
            
            for framework_code in ['react_code', 'vue_code', 'angular_code']:
                result[framework_code] = encode_code_block(clean_code(result[framework_code]))
            
            # Just to check if a code or prompt could not be extracted
            has_error = any(
                value in ['Could not generate prompt', 'Could not generate code']
                for value in result.values()
            )
            if has_error:
                print('[DEBUG] LLM response received with errors' )

            return result
                
        except Exception as e:
            print(f"[ERROR] Failed to parse response sections: {e}")
            print(f"[ERROR] Response text: {results}")
            error_result = {}
            for platform in ['lovable', 'cursor', 'bolt', 'vercel', 'replit', 'magic', 'sitebrew']:
                error_result[f"{platform}_prompt"] = "Could not generate prompt"
            for framework in ['react', 'vue', 'angular']:
                error_result[f"{framework}_code"] = encode_code_block("Could not generate code")
            return error_result
    
    except Exception as e:
        print(f"[ERROR] Exception during recommendation generation: {str(e)}")
        raise HTTPException(status_code=500, detail=f"OpenRouter API error: {str(e)}")





@app.post("/recommendation-prompt-code", response_model=RecommendationPromptCodeResponse)
def recommendation_prompt_code(request: RecommendationPromptCodeRequest):
    if not OPENROUTER_API_KEY:
        raise HTTPException(status_code=500, detail="OpenRouter API key not set")
    
    def request_llm():
        return get_prompt_code(request)
    
    result = retry_get_prompt_code(request_llm, has_error, max_retries=3, delay=1.0)

    if has_error(result):
        print(f"[ERROR] Failed to generate prompt and code: {result}")

    return RecommendationPromptCodeResponse(**result)


class OpenRouterPromptRequest(BaseModel):
    feature_name: str
    screenshot_url: str
    feature_extraction_result: dict

@app.post("/openrouter-generate-research-prompt")
async def openrouter_generate_research_prompt(request: OpenRouterPromptRequest):
    """
    Sends a detailed prompt and screenshot to OpenRouter and returns the research prompt output.
    """
    if not OPENROUTER_API_KEY or OPENROUTER_API_KEY.startswith("sk-..."):
        raise HTTPException(status_code=500, detail="OpenRouter API key not configured")

    # Build the OpenRouter prompt
    openrouter_prompt = f"""Identify the {request.feature_name} section and provide text details of the section from the screenshot.
Combine the result of the text details and feature extraction result to fill the necessary placeholder for prompt.
Feature Extraction Result:
{json.dumps(request.feature_extraction_result, indent=2)}

Prompt:
Given a website section's information and global design context:
1. Section-specific details:

   - Name: {{featureName}}

   - Detailed Description: {{detailedDescription}}

2. Global website context:

   - Analysis Summary: {{analysisSummary}}

   - Branding Overview: {{brandingOverview}}
Generate a research request prompt for FutureHouse API using this format and only output the research request:
Research request: Provide a comprehensive analysis of {{featureName}} design in {{business_type}} websites with supporting research studies and data.
Key areas to address:
1. User Experience Research
   - User behavior patterns specific to this section type
   - Interaction design effectiveness studies
   - Section-specific conversion metrics
   - Accessibility considerations
2. Design Implementation
   - Layout optimization techniques
   - Visual hierarchy best practices
   - Component interaction patterns
   - Responsive design approaches
3. Performance Impact
   - Loading and rendering metrics
   - Mobile-first considerations
   - Technical implementation guidelines
   - Optimization strategies
4. Content Strategy
   - Content hierarchy research
   - Element placement studies
   - Information architecture findings
   - User engagement patterns
5. Business Impact
   - Conversion rate influences
   - User journey effectiveness
   - Brand alignment metrics
   - ROI measurements
Format requirements:
- Include quantitative data where available
- Cite specific research studies
- Provide actionable guidelines
- Include success metrics
- Address cross-device considerations
Target audience context:
{{business_type}} / {{target_audience}}
Keep the structure consistent but modify the specific research points based on the section's unique purpose and elements.
"""

    openrouter_data = {
        'model': 'anthropic/claude-3.5-sonnet', # mistralai/mistral-small-3.2-24b-instruct:free
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
        'max_tokens': 3000
    }
    headers = {
        'Authorization': f'Bearer {OPENROUTER_API_KEY}',
        'Content-Type': 'application/json',
    }
    resp = requests.post(OPENROUTER_API_URL, json=openrouter_data, headers=headers)
    if resp.status_code != 200:
        raise HTTPException(status_code=500, detail=f"OpenRouter error: {resp.text}")
    result = resp.json()
    openrouter_prompt = result['choices'][0]['message']['content'].strip()
    print(f"DEBUG: openrouter_prompt: {openrouter_prompt}")
    

    # Assume research_prompt is the string you got from OpenRouter
    keyword = "Research request:"
    if keyword in openrouter_prompt:
        prompt_to_FH = openrouter_prompt.split(keyword, 1)[1].strip()
        if prompt_to_FH.startswith(keyword):
            prompt_to_FH = prompt_to_FH[len(keyword):].lstrip()
    else:
        prompt_to_FH = openrouter_prompt.strip()
    print(f"DEBUG: prompt_to_FH: {prompt_to_FH}")

    return {
        "feature_name": request.feature_name,
        "prompt_to_FH": openrouter_prompt,
        # "screenshot_url": request.screenshot_url,
        # "raw_openrouter_response": result
    }

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
    recommendations: List[str] = []    # or str if you want to accept a single string
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
    if not OPENROUTER_API_KEY:
        raise HTTPException(status_code=500, detail="OpenRouter API key not set.")

    references_str = format_references_for_prompt(request.references)
    print(f"[DEBUG]: references_str: {references_str}")

    # Compose the prompt for OpenRouter
    prompt = (
        f"Summarize this research result from FutureHouse API but keep the reference when display UI/UX improvement user can take actions on considering the context. "
        f"Context: {json.dumps(request.context) if request.context else ''}\n\n"
        f"Recommendations:\n"
        f"{request.recommendations}"
        f"References:\n"
        f"{request.references}"
    )

    print(f"[DEBUG]: prompt: {prompt}")

    data = {
        "model": "anthropic/claude-3.5-sonnet",  # or your preferred model
        "messages": [
            {"role": "user", "content": prompt}
        ],
        "temperature": 0.3,
        "max_tokens": 1000,
    }
    headers = {
        "Authorization": f"Bearer {OPENROUTER_API_KEY}",
        "Content-Type": "application/json",
    }
    resp = requests.post(OPENROUTER_API_URL, json=data, headers=headers)
    if resp.status_code != 200:
        raise HTTPException(status_code=500, detail=f"OpenRouter error: {resp.text}")
    result = resp.json()
    summary_text = result["choices"][0]["message"]["content"].strip()
    print(f"[DEBUG]: summary_text: {summary_text}")

    # Optionally, split into a list if you want structured output
    # improvements = [line.lstrip("-•* ").strip() for line in summary_text.split("\n") if line.strip()]
    # print(f"[DEBUG]: improvements: {improvements}")

    return SummarizeRecommendationsResponse(
        summary_text=summary_text,
        raw_openrouter_response=result
    )


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

if __name__ == "__main__":
    import uvicorn

    print("Starting Main API Server...")
    print("Server will be available at: http://localhost:8000")
    print("API Documentation: http://localhost:8000/docs")
    uvicorn.run(app, host="0.0.0.0", port=8000) 
