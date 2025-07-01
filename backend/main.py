import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
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