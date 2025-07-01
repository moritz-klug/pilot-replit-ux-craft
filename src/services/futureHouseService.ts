import axios from 'axios';

const BACKEND_API_URL = import.meta.env.VITE_BACKEND_API_URL || 'http://localhost:8000';

interface RecommendationRequest {
  feature: string;
  currentDesign: string;
  context?: string;
}

interface RecommendationResponse {
  recommendations: string[];
  papers: Array<{
    title: string;
    authors: string[];
    year: number;
    url: string;
    relevance: string;
  }>;
}

export class FutureHouseService {
  async getRecommendations(request: RecommendationRequest): Promise<RecommendationResponse> {
    try {
      const response = await axios.post(
        `${BACKEND_API_URL}/recommendations`,
        request,
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error getting recommendations from backend:', error);
      throw error;
    }
  }

  async getRelevantHeuristics(feature: string, currentDesign: string): Promise<number[]> {
    try {
      const response = await axios.post(
        `${BACKEND_API_URL}/relevant-heuristics`,
        { feature, currentDesign },
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
      return response.data.relevant;
    } catch (error) {
      console.error('Error getting relevant heuristics from backend:', error);
      throw error;
    }
  }
}

export const futureHouseService = new FutureHouseService(); 