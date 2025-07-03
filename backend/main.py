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
from typing import List
import openai
import re
# Correct import for the official client
from futurehouse_client import FutureHouseClient, JobNames

# Load environment variables from .env file
load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), '.env'))

FUTURE_HOUSE_API_KEY = os.getenv('FUTURE_HOUSE_API_KEY', '')
OPENROUTER_API_KEY = os.getenv('OPENROUTER_API_KEY', '')

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

class RecommendationToLLM(BaseModel):
    featureName: str
    currentDesign: str
    recommendationTitle: str
    recommendationDescription: str

class RecommendationToLLMResponse(BaseModel):
    prompt: str
    react: str
    vue: str
    angular: str

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
        answer = getattr(task_response, 'answer', '')
        formatted_answer = getattr(task_response, 'formatted_answer', '')
        papers = []
        # Fix: handle if task_response is a list
        if isinstance(task_response, list):
            response_obj = task_response[0] if task_response else None
        else:
            response_obj = task_response
        # Use getattr to safely access 'references' and avoid linter errors
        references = getattr(response_obj, 'references', None)
        if references:
            for ref in references:
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

# Serve cropped images statically
app.mount('/section-crops', StaticFiles(directory=CROPS_DIR), name='section-crops')


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
        
@app.post("/recommendation-to-llm", response_model=RecommendationToLLMResponse)
def recommendation_to_llm(request: RecommendationToLLM):
    prompt = (
        f"Given the following UI feature and its improvement recommendation:\n\n"
        f"Feature Title: {request.featureName}\n"
        f"Feature Description: {request.currentDesign}\n\n"
        f"Improvement Recommendation: {request.recommendationTitle}\n"
        f"Recommendation Description: {request.recommendationDescription}\n\n"
        f"Please do the following:\n"
        f"1. Rewrite the recommendation as a concise, actionable prompt suitable for Lovable/Cursor that clearly describes the UI improvement needed.\n"
        f"2. Provide the complete code implementation for this recommendation in THREE separate formats:\n\n"
        f"   React: Modern React component with TypeScript, hooks, and proper typing \n"
        f"   Vue: Vue 3 component with Composition API and TypeScript\n"
        f"   Angular: Angular component with TypeScript and proper decorators\n\n"
        f"Requirements for each code format:\n"
        f"- Each code field (react, vue, angular) must be a single JSON string.\n"
        f"- All newlines in code must be represented as \\n.\n"
        f"- All double quotes in code must be escaped as \\\".\n"
        f"- Do NOT use multi-line strings or embedded unescaped double quotes.\n"
        f"- Do NOT use markdown, triple backticks, or comments. \n"
        f"- Do NOT include any explanation or text outside the JSON object.\n"
        f"Respond ONLY with a valid JSON object with the fields 'prompt', 'react', 'vue', and 'angular'.\n"
        f"For example, your response should look like:\n"
        f"{{\n  \"prompt\": \"string\",\n  \"react\": \"import React from \\\"react\\\";\\nexport default function ...\",\n  \"vue\": \"<template>...</template>\",\n  \"angular\": \"import {{ Component }} from '@angular/core';\\n@Component(...)\"\n}}\n"
    )
    try:
        response = call_mistral_via_openrouter(prompt)
        try:
            data = clean_json(response)
        except Exception as e:
            print(f"[Mistral] Post-processing error: {e}")
            raise HTTPException(status_code=500, detail=f"Could not parse JSON from LLM response.")
        return RecommendationToLLMResponse(**data)
    
    except Exception as e:
        print(f"[Mistral] Error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"OpenRouter API error: {str(e)}") 

def clean_json(response: str) -> dict:
    # Extract the first {...} block
    match = re.search(r'\{.*\}', response, re.DOTALL)
    if not match:
        raise ValueError("No JSON object found in LLM response.")
    json_str = match.group(0)

    # Remove triple backticks and language tags
    json_str = re.sub(r'```[a-zA-Z]*', '', json_str)
    json_str = json_str.replace('```', '')

    # Find all code fields and escape their contents
    def escape_code_field(match):
        key = match.group(1)
        value = match.group(2)
        # Escape backslashes, double quotes, and newlines
        value = value.replace('\\', '\\\\').replace('"', '\\"').replace('\n', '\\n').replace('\r', '').replace('\t', '\\t')
        value = value.replace('\u201c', '\\"').replace('\u201d', '\\"')  # handle curly quotes
        value = value.replace('\u2018', "'").replace('\u2019', "'")      # handle curly single quotes
        value = value.replace('\n', '\\n')  # ensure all newlines are escaped
        return f'"{key}": "{value}"'

    # This regex matches "key": "value" where value can be multi-line
    json_str = re.sub(r'"(react|vue|angular)":\s*"((?:[^"\\]|\\.)*)"', escape_code_field, json_str, flags=re.DOTALL)

    # Remove trailing commas
    json_str = re.sub(r',([\s\n]*[}\]])', r'\1', json_str)

    # Try to parse as JSON
    try:
        data = json.loads(json_str)
    except Exception as e:
        raise ValueError(f"Failed to parse cleaned JSON: {e}\nCleaned string:\n{json_str}")

    return data

if __name__ == "__main__":
    import uvicorn
    print("Starting Main API Server...")
    print("Server will be available at: http://localhost:8000")
    print("API Documentation: http://localhost:8000/docs")
    uvicorn.run(app, host="0.0.0.0", port=8000) 
