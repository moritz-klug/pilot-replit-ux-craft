import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv

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