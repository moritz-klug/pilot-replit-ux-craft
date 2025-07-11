
import FireCrawlApp from '@mendable/firecrawl-js';
import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';

// Schema for Firecrawl extraction
export const uiElementsSchema = z.object({
  ui_elements: z.array(z.object({
    section_title: z.string(),
    section_description: z.string(),
    elements: z.array(z.object({
      element_title: z.string(),
      element_description: z.string(),
      confidence_score: z.number(),
      priority: z.string()
    }))
  }))
});

export type UIElementsResponse = z.infer<typeof uiElementsSchema>;

// Initialize Firecrawl app
const app = new FireCrawlApp({
  apiKey: import.meta.env.VITE_FIRECRAWL_API_KEY || ''
});

// Convert Firecrawl response to our Feature interface
export interface Feature {
  id: string;
  title: string;
  description: string;
  category: 'navigation' | 'forms' | 'content' | 'interactive' | 'visual';
  severity: 'low' | 'medium' | 'high';
  status: 'pending' | 'reviewed' | 'approved' | 'rejected';
  aiConfidence: number;
  userNotes?: string;
  screenshot?: string;
  isManual?: boolean;
  elementId?: string;
}

// Map priority to severity
const mapPriorityToSeverity = (priority: string): Feature['severity'] => {
  switch (priority.toLowerCase()) {
    case 'high':
      return 'high';
    case 'medium':
      return 'medium';
    case 'low':
    default:
      return 'low';
  }
};

// Categorize elements based on keywords
const categorizeElement = (title: string, description: string): Feature['category'] => {
  const text = `${title} ${description}`.toLowerCase();
  
  if (text.includes('button') || text.includes('click') || text.includes('action') || text.includes('cta')) {
    return 'interactive';
  }
  if (text.includes('form') || text.includes('input') || text.includes('field') || text.includes('submit')) {
    return 'forms';
  }
  if (text.includes('nav') || text.includes('menu') || text.includes('link')) {
    return 'navigation';
  }
  if (text.includes('text') || text.includes('content') || text.includes('paragraph') || text.includes('heading')) {
    return 'content';
  }
  return 'visual';
};

// Replace extractUIElements to call backend
export const extractUIElements = async (url: string): Promise<any> => {
  try {
    const response = await fetch('http://localhost:8000/firecrawl-analyze', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ url }),
    });
    if (!response.ok) {
      throw new Error('Failed to fetch Firecrawl analysis');
    }
    const data = await response.json();
    return data;
  } catch (error: any) {
    console.error('Error extracting UI elements:', error.message);
    throw error;
  }
}; 
