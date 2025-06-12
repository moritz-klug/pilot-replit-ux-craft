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

// Extract UI elements from a URL
export const extractUIElements = async (url: string): Promise<Feature[]> => {
  try {
    // Ensure URL has protocol
    const fullUrl = url.startsWith('http') ? url : `https://${url}`;
    
    
    // Create Zod schema with descriptions
    const zodSchema = z.object({
      ui_elements: z.array(z.object({
        section_title: z.string().describe("Title of the UI section"),
        section_description: z.string().describe("Description of what this section contains"),
        elements: z.array(z.object({
          element_title: z.string().describe("Title of the UI element"),
          element_description: z.string().describe("Description of the UI element"),
          confidence_score: z.number().describe("Confidence score 0-100"),
          priority: z.string().describe("Priority level: low, medium, or high")
        })).describe("List of UI elements in this section")
      })).describe("All UI sections found on the website")
    });
    
    // Convert to JSON Schema with additionalProperties: false
    const jsonSchema = zodToJsonSchema(zodSchema);
    
    // Ensure additionalProperties is false at all levels
    const fixedSchema = {
      ...jsonSchema,
      additionalProperties: false,
      properties: {
        ui_elements: {
          ...jsonSchema.properties.ui_elements,
          items: {
            ...jsonSchema.properties.ui_elements.items,
            additionalProperties: false,
            properties: {
              ...jsonSchema.properties.ui_elements.items.properties,
              elements: {
                ...jsonSchema.properties.ui_elements.items.properties.elements,
                items: {
                  ...jsonSchema.properties.ui_elements.items.properties.elements.items,
                  additionalProperties: false
                }
              }
            }
          }
        }
      }
    };
    
    
    const extractResult = await app.extract(
      [`${fullUrl}`], // Try without wildcard based on troubleshooting guide
      {
        prompt: "Extract all UI elements in sections from the website. Provide a title and description for each UI section and element. Include a confidence score in percentage (0-100) for how accurately each section and element is parsed. Assign a priority level (low, medium, high) for each feature on the website based on UX importance.",
        schema: fixedSchema,
        agent: {
          model: 'FIRE-1'
        }
      }
    );

    // Log the raw extract result
    console.log('Raw Firecrawl extract result:', extractResult);

    // Check for the correct response structure
    if (!extractResult) {
      throw new Error('Extract failed - no result');
    }
    
    // Try different response structures
    let uiElements;
    if (extractResult.data && extractResult.data.ui_elements) {
      uiElements = extractResult.data.ui_elements;
      console.log('UI Elements from data.ui_elements:', uiElements);
    } else if (extractResult.ui_elements) {
      uiElements = extractResult.ui_elements;
      console.log('UI Elements from ui_elements:', uiElements);
    } else {
      console.error('Extract result structure:', extractResult);
      throw new Error('No UI elements found in response');
    }

    // Convert extracted data to Features
    const features: Feature[] = [];
    let featureId = 1;

    
    uiElements.forEach((section) => {
      section.elements.forEach((element) => {
        features.push({
          id: featureId.toString(),
          title: `${section.section_title} - ${element.element_title}`,
          description: element.element_description,
          category: categorizeElement(element.element_title, element.element_description),
          severity: mapPriorityToSeverity(element.priority),
          status: 'pending',
          aiConfidence: element.confidence_score / 100, // Convert percentage to decimal
          isManual: false,
          elementId: `feature-${featureId}` // Add element ID for highlighting
        });
        featureId++;
      });
    });

    
    return features;
  } catch (error: any) {
    console.error('Error extracting UI elements:', error.message);
    throw error;
  }
}; 