import axios from 'axios';

const BACKEND_API_URL =
  import.meta.env.VITE_BACKEND_API_URL || 'http://localhost:8000';

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

// Example mock data using the new response format
const mockAnalysis = {
  choices: [{
    message: {
      content: JSON.stringify({
        websiteFeatures: [
          {
            featureName: "Hero Section",
            detailedDescription: "Located at the top of the page spanning the full width. Features a bold headline 'MARKETING AUS EINER HAND' in dark blue (#1F2659) on the left side with a 48px sans-serif font (Roboto). Below is a subtitle 'Für lokale Unternehmen' in a smaller 24px font. The right side contains an illustration of a person working at a desk with digital marketing elements. The background is white with subtle light blue accents. A prominent call-to-action button 'Kostenlose Erstberatung' appears below the text in orange (#FF5722) with rounded corners (8px) and slight box-shadow. The section has approximately 90px padding on top and bottom, responsive layout that adjusts for mobile viewing.",
            htmlStructure: "<section class=\"hero-section\">\n  <div class=\"container\">\n    <div class=\"row\">\n      <div class=\"col-md-6 hero-content\">\n        <h1>MARKETING AUS EINER HAND</h1>\n        <h2>Für lokale Unternehmen</h2>\n        <p>Wir unterstützen lokale Unternehmen dabei, online mehr Kunden zu gewinnen - mit maßgeschneiderten Marketing-Strategien.</p>\n        <a href=\"#contact\" class=\"cta-button\">Kostenlose Erstberatung</a>\n      </div>\n      <div class=\"col-md-6 hero-image\">\n        <img src=\"/images/hero-illustration.svg\" alt=\"Digitales Marketing für lokale Unternehmen\" />\n      </div>\n    </div>\n  </div>\n</section>",
            cssProperties: ".hero-section {\n  padding: 90px 0;\n  background-color: #ffffff;\n  position: relative;\n  overflow: hidden;\n}\n\n.hero-section h1 {\n  font-family: 'Roboto', sans-serif;\n  font-weight: 700;\n  font-size: 48px;\n  line-height: 1.2;\n  color: #1F2659;\n  margin-bottom: 15px;\n}\n\n.cta-button {\n  display: inline-block;\n  background-color: #FF5722;\n  color: white;\n  font-weight: 600;\n  font-size: 16px;\n  padding: 14px 30px;\n  border-radius: 8px;\n  text-decoration: none;\n  transition: all 0.3s ease;\n  box-shadow: 0 4px 8px rgba(255, 87, 34, 0.2);\n}"
          },
          {
            featureName: "Navigation Bar",
            detailedDescription: "Fixed-position navigation bar at the top of the page with a white background (#FFFFFF) and subtle box-shadow (0 2px 10px rgba(0,0,0,0.1)). Contains the company logo on the left (30px height) and main menu links on the right. Menu items include 'Leistungen', 'Über uns', 'Referenzen', 'Blog', and 'Kontakt' in 16px Roboto font with #333333 color that changes to #FF5722 on hover. The rightmost element is a prominent orange button 'Jetzt anfragen' with white text. On mobile, the menu collapses into a hamburger icon that expands a dropdown menu when clicked. The navbar has 15px vertical padding and remains sticky during scroll.",
            htmlStructure: "<header class=\"main-header\">\n  <div class=\"container\">\n    <nav class=\"navbar\">\n      <div class=\"logo\">\n        <a href=\"/\">\n          <img src=\"/images/logo.svg\" alt=\"Marketing Lokalhelden Logo\" />\n        </a>\n      </div>\n      <ul class=\"nav-menu\">\n        <li><a href=\"/leistungen\">Leistungen</a></li>\n        <li><a href=\"/ueber-uns\">Über uns</a></li>\n        <li><a href=\"/referenzen\">Referenzen</a></li>\n        <li><a href=\"/blog\">Blog</a></li>\n        <li><a href=\"/kontakt\">Kontakt</a></li>\n        <li><a href=\"/anfrage\" class=\"nav-cta\">Jetzt anfragen</a></li>\n      </ul>\n    </nav>\n  </div>\n</header>",
            cssProperties: ".main-header {\n  position: fixed;\n  top: 0;\n  left: 0;\n  width: 100%;\n  background-color: #FFFFFF;\n  box-shadow: 0 2px 10px rgba(0,0,0,0.1);\n  z-index: 1000;\n}\n\n.navbar {\n  display: flex;\n  justify-content: space-between;\n  align-items: center;\n  padding: 15px 0;\n}\n\n.nav-menu a {\n  font-family: 'Roboto', sans-serif;\n  font-size: 16px;\n  color: #333333;\n  text-decoration: none;\n  font-weight: 500;\n  transition: color 0.3s ease;\n}\n\n.nav-menu a:hover {\n  color: #FF5722;\n}"
          },
          {
            featureName: "Services Section",
            detailedDescription: "Grid-based services showcase with 3 columns on desktop and stacked layout on mobile. Each service is presented in a white card with subtle shadow effect (0 5px 15px rgba(0,0,0,0.08)) and border-radius of 10px. Cards contain an icon at the top (60px height with brand colors), followed by a service title in 22px bold font (#1F2659), and a brief description in 16px light gray text (#666). Each card has a 'Mehr erfahren' text link at the bottom in orange (#FF5722). The section has a light gray background (#F8F9FA) with 80px padding top and bottom, 40px spacing between cards. Section begins with a centered heading 'Unsere Leistungen' in 36px font and short introduction paragraph below it.",
            htmlStructure: "<section class=\"services-section\">\n  <div class=\"container\">\n    <div class=\"section-header\">\n      <h2>Unsere Leistungen</h2>\n      <p>Maßgeschneiderte Marketing-Lösungen für lokale Unternehmen</p>\n    </div>\n    <div class=\"row\">\n      <div class=\"col-md-4\">\n        <div class=\"service-card\">\n          <div class=\"service-icon\">\n            <img src=\"/images/icons/seo-icon.svg\" alt=\"SEO Icon\" />\n          </div>\n          <h3>Lokale SEO</h3>\n          <p>Verbessern Sie Ihre Sichtbarkeit in lokalen Suchergebnissen und werden Sie von Kunden in Ihrer Nähe gefunden.</p>\n          <a href=\"/leistungen/lokale-seo\" class=\"learn-more\">Mehr erfahren</a>\n        </div>\n      </div>\n    </div>\n  </div>\n</section>",
            cssProperties: ".services-section {\n  padding: 80px 0;\n  background-color: #F8F9FA;\n}\n\n.service-card {\n  background-color: white;\n  border-radius: 10px;\n  padding: 30px;\n  height: 100%;\n  display: flex;\n  flex-direction: column;\n  box-shadow: 0 5px 15px rgba(0,0,0,0.08);\n  transition: transform 0.3s ease, box-shadow 0.3s ease;\n  margin-bottom: 30px;\n}\n\n.service-card:hover {\n  transform: translateY(-5px);\n  box-shadow: 0 8px 25px rgba(0,0,0,0.15);\n}"
          }
        ],
        siteUXArchitecture: {
          businessContext: "Marketing Lokalhelden provides digital marketing services specifically tailored for local businesses in Germany. Their value proposition centers on helping small and medium local businesses increase their online visibility and acquire more customers. Key offerings include local SEO, social media marketing, Google Ads, web design, and content marketing. Their KPIs likely include lead generation, conversion rate of consultations to clients, and client retention/satisfaction.",
          targetAudience: "The primary audience is local business owners and managers in Germany, particularly those with physical locations serving local communities. These users likely have limited digital marketing expertise, are time-constrained, and need expert help to navigate online marketing. Key user goals include finding affordable marketing solutions, understanding what services will work for their specific business, and seeing evidence of success through case studies.",
          userGoals: "Users visiting this site are looking to: 1) Learn about digital marketing solutions specific to local businesses, 2) Understand the agency's expertise and approach, 3) Determine if the agency is trustworthy through testimonials and case studies, 4) Find pricing information or get a custom quote, and 5) Schedule a free initial consultation to discuss their specific needs.",
          navigationStructure: "The site follows a standard agency structure with a fixed top navigation containing: Leistungen (Services), Über uns (About Us), Referenzen (References), Blog, and Kontakt (Contact) with a prominent call-to-action button 'Jetzt anfragen' (Request now). The site appears to use a linear flow that guides users from understanding services to seeing proof points (testimonials) to contacting the agency. The footer provides a comprehensive site map with additional links organized by category.",
          responsiveness: "The site employs a responsive design with thoughtful mobile adaptations. On smaller screens, the navigation collapses into a hamburger menu, multi-column layouts stack vertically, font sizes decrease appropriately, and padding is reduced to maintain proper spacing. The testimonials carousel adjusts to show one item at a time on mobile. Form elements expand to full width, and touch targets like buttons and links maintain appropriate sizing for mobile interaction.",
          accessibilityObservations: "The site demonstrates several accessibility best practices: proper semantic HTML structure, sufficient color contrast between text and backgrounds (especially the dark blue #1F2659 against white), ARIA labels for interactive elements like social media icons, visible focus states for interactive elements, and form labels that are properly associated with their inputs. Images include alt text. The site could improve by ensuring all interactive elements are keyboard navigable and by adding ARIA landmarks for major page sections."
        },
        brandIdentity: {
          logoUrl: "https://www.marketing-lokalhelden.de/images/logo.svg",
          dominantColorPalette: ["#1F2659", "#FF5722", "#FFFFFF", "#F0F5FF", "#F8F9FA"],
          typographyStyles: "The site primarily uses the Roboto font family in various weights. Headings use Roboto Bold (700) in dark blue (#1F2659), with sizes ranging from 36px for main section headings to 22px for card titles. Body text uses Roboto Regular (400) at 16px in dark gray (#555). The typography hierarchy is consistent throughout the site with clear visual distinction between headings, subheadings, and body text. Line heights are generally 1.6 for good readability.",
          designTone: "The design is professional yet approachable, balancing corporate trustworthiness with friendly accessibility. The use of clean layouts, ample white space, and soft shadows creates a modern, airy feel. The color scheme combines professional dark blue with energetic orange accents to convey reliability while still feeling dynamic. The rounded corners, subtle animations, and conversational copy help soften the corporate nature, making the brand feel accessible to small business owners. Overall, the design tone communicates expertise without being intimidating."
        },
        companyOverview: {
          companyName: "Marketing Lokalhelden",
          employeeCount: "10-20 (estimated based on team references)",
          industry: "Digital Marketing Agency",
          headquartersLocation: "Berlin, Germany",
          foundedYear: "2018",
          externalLinks: {
            LinkedIn: "https://linkedin.com/company/marketinglokalhelden",
            Facebook: "https://facebook.com/marketinglokalhelden",
            Instagram: "https://instagram.com/marketinglokalhelden"
          }
        }
      })
    }
  }]
};

export async function analyzeWithScreenshot(url: string, uiTest: boolean) {
  if (uiTest) {
    await new Promise((r) => setTimeout(r, 1200));
    return mockAnalysis;
  }
  // Only call the real backend if UI Test Mode is OFF
  // ...existing real backend call...
}

export async function approveComponent(sectionId: string, uiTest: boolean) {
  if (uiTest) {
    await new Promise((r) => setTimeout(r, 400));
    return { success: true };
  }
  // Only call the real backend if UI Test Mode is OFF
  // ...existing real backend call...
}

export async function getRecommendations(
  confirmedSections: string[],
  uiTest: boolean
) {
  if (uiTest) {
    await new Promise((r) => setTimeout(r, 800));
    // Return a mock recommendation for each confirmed section
    return confirmedSections.map((sectionName) => ({
      section: sectionName,
      text: `Mock recommendation for ${sectionName}.`,
    }));
  }
  // Only call the real backend if UI Test Mode is OFF
  // ...existing real backend call...
}

export class FutureHouseService {
  async getRecommendations(
    request: RecommendationRequest
  ): Promise<RecommendationResponse> {
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

  async getRelevantHeuristics(
    feature: string,
    currentDesign: string
  ): Promise<number[]> {
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
