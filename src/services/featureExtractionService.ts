import axios from 'axios';

const BACKEND_API_URL = import.meta.env.VITE_BACKEND_API_URL || 'http://localhost:8000';

export async function analyzeWithScreenshot(options: any) {
  console.log('analyzeWithScreenshot CALLED', options, new Error().stack);
  // options should include url, screenshot, and any other fields needed for the backend
  const response = await axios.post(`${BACKEND_API_URL}/extract-features`, options, {
    headers: {
      'Content-Type': 'application/json',
    },
  });
  return response.data;
} 