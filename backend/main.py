import os
import asyncio
import requests
import json
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
from fastapi.responses import StreamingResponse

# Correct import for the official client
from futurehouse_client import FutureHouseClient, JobNames

# Load environment variables from .env file
load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), '.env'))

print("DEBUG: FUTURE_HOUSE_API_KEY =", os.getenv('FUTURE_HOUSE_API_KEY'))

FUTURE_HOUSE_API_KEY = os.getenv('FUTURE_HOUSE_API_KEY', '')

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

if __name__ == "__main__":
    import uvicorn
    print("Starting Main API Server...")
    print("Server will be available at: http://localhost:8000")
    print("API Documentation: http://localhost:8000/docs")
    uvicorn.run(app, host="0.0.0.0", port=8000) 