import axios from 'axios';

const BACKEND_API_URL = import.meta.env.VITE_BACKEND_API_URL || 'http://localhost:8000';

interface RecommendationToLLMRequest {
  featureName: string;
  currentDesign: string;
  recommendationTitle: string;
  recommendationDescription: string;
}

interface RecommendationToLLMResponse {
  prompt: string;
  react: string;
  vue: string;
  angular: string;
}

export class MistralService {
  async recommendationToLLM(request: RecommendationToLLMRequest): Promise<RecommendationToLLMResponse> {
    try {
      const response = await axios.post(
        `${BACKEND_API_URL}/recommendation-to-llm`,
        request,
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error getting recommendation prompt and code from backend:', error);
      throw error;
    }
  }
}

export const mistralService = new MistralService(); 