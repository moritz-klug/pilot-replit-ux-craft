import axios from 'axios';
import { analyzeWithScreenshot as analyzeWithScreenshotReal } from './featureExtractionService';

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

// Example mock data
const mockAnalysis = {
  screenshot_id: 'mock123',
  sections: [
    {
      id: 'sec1',
      name: 'Header',
      cropped_image_url: 'https://via.placeholder.com/80x80?text=Header',
      elements: 'Logo, navigation menu, search icon',
      purpose: 'Provide branding and site-wide navigation.',
      style: {
        fonts: 'SF Pro Display, 18px, Bold',
        colors: 'White background, black text, blue accent',
        layouts: 'Horizontal flex, spaced between',
        interactions: 'Sticky on scroll, hover underline on nav links',
      },
      mobile: 'Collapses to hamburger menu, logo shrinks',
      status: 'pending',
    },
    {
      id: 'sec2',
      name: 'Hero',
      cropped_image_url: 'https://via.placeholder.com/80x80?text=Hero',
      elements: 'Main heading, subheading, call-to-action button, hero image',
      purpose: 'Introduce the product and drive conversions.',
      style: {
        fonts: 'SF Pro Display, 32px, Bold',
        colors: 'Gradient background, white text, orange CTA',
        layouts: 'Two-column grid, image right',
        interactions: 'Button hover animation, scroll-down arrow',
      },
      mobile: 'Stacks vertically, image below text',
      status: 'pending',
    },
    {
      id: 'sec3',
      name: 'Footer',
      cropped_image_url: 'https://via.placeholder.com/80x80?text=Footer',
      elements: 'Links, copyright, social icons',
      purpose: 'Provide secondary navigation and legal info.',
      style: {
        fonts: 'SF Pro Text, 14px',
        colors: 'Dark background, light text',
        layouts: 'Single row, centered',
        interactions: 'Social icon hover color',
      },
      mobile: 'Stacked links, smaller icons',
      status: 'pending',
    },
  ],
  global: {
    typography: 'SF Pro Display for headings, SF Pro Text for body. Hierarchy: H1 32px, H2 24px, Body 16px',
    color_palette: 'Primary: #0071e3, Accent: #ff9500, Background: #fff, Text: #111, CTA: #ff9500',
    button_styles: 'Rounded corners, solid fill, bold text, hover shadow',
    spacing_layout: '24px section padding, 16px grid gap, responsive breakpoints at 768px/1024px',
    iconography: 'Line icons, minimal illustrations',
  },
  ux: {
    page_flow: 'Header → Hero → Features → Testimonials → CTA → Footer',
    emotional_strategy: 'Trust, innovation, simplicity',
    conversion_points: 'Hero CTA, newsletter signup, demo request',
    design_trends: 'Flat design, glassmorphism on cards, subtle animations',
  },
  business: {
    summary: 'This is a SaaS website offering productivity tools for remote teams.',
    business_type: 'SaaS',
    target_audience: 'Remote teams, tech startups, SMBs',
    keywords: [
      'productivity', 'remote work', 'collaboration', 'SaaS', 'team management',
      'workflow', 'cloud', 'startup', 'business', 'tools', 'automation', 'integration',
    ],
  },
};

// Removed analyzeWithScreenshot to prevent incorrect usage. Use analyzeWithScreenshot from featureExtractionService.ts directly.

export async function approveComponent(sectionId: string, uiTest: boolean) {
  if (uiTest) {
    await new Promise((r) => setTimeout(r, 400));
    return { success: true };
  }
  // Only call the real backend if UI Test Mode is OFF
  // ...existing real backend call...
}

export async function getRecommendations(confirmedSections: string[], uiTest: boolean) {
  if (uiTest) {
    await new Promise((r) => setTimeout(r, 800));
    // Return a mock recommendation for each confirmed section
    return confirmedSections.map(sectionName => ({
      section: sectionName,
      text: `Mock recommendation for ${sectionName}.`
    }));
  }
  // Only call the real backend if UI Test Mode is OFF
  // ...existing real backend call...
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
}

export const futureHouseService = new FutureHouseService(); 