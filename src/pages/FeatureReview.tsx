import React, { useEffect, useState, useRef, useContext } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Loader2, Sparkles, LayoutDashboard, Camera, Target, ArrowUp } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { analyzeWithScreenshot, getRecommendations } from '../services/futureHouseService';
import { UITestModeContext, ModelSelectionContext } from '../App';
import { motion } from 'framer-motion';
import { Dialog, DialogContent } from '../components/ui/dialog';
import { SidebarProvider, SidebarInset, SidebarTrigger } from '../components/ui/sidebar';
import { AppSidebar } from '../components/AppSidebar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@radix-ui/react-tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Copy, Check } from 'lucide-react';
import { useToast } from '../hooks/use-toast';
import { CodeBlock, CodeBlockCode, CodeBlockGroup } from '../components/ui/code-block';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../components/ui/accordion';
import { SocialCard } from '../components/ui/social-card';
import { cn } from '../lib/utils';
import AnimatedLoadingSkeleton from '../components/ui/animated-loading-skeleton';
import FeatureChatbot from '../components/FeatureChatbot';
import SourcesDisplay from '../components/SourcesDisplay';

import { ToggleGroup, ToggleGroupItem } from '../components/ui/toggle-group';
import { Checkbox } from '../components/ui/checkbox';

const DEMO_MODE = false;
const SCREENSHOT_API_BASE = 'http://localhost:8001';
const MAIN_API_BASE = 'http://localhost:8000';

const STATUS_OPTIONS = ['rejected', 'improved'] as const;
type Status = typeof STATUS_OPTIONS[number];

const SUBTABS = ['all', 'rejected', 'improved'] as const;
type SubTab = typeof SUBTABS[number];

const CHATBOT_TABS = ['mockups', 'improvements', 'sources'] as const;
type ChatbotTab = typeof CHATBOT_TABS[number];

// Helper skeletons for each section
const SectionSkeleton = ({ title }: { title: string }) => (
  <div className="bg-white rounded-lg shadow-sm p-6 mb-8 animate-pulse">
    <div className="h-6 w-1/3 bg-gray-200 rounded mb-4" />
    <div className="h-4 w-2/3 bg-gray-100 rounded mb-2" />
    <div className="h-4 w-1/2 bg-gray-100 rounded mb-2" />
    <div className="h-4 w-1/4 bg-gray-100 rounded" />
  </div>
);
const UICardSkeleton = () => (
  <div className="bg-white rounded-lg shadow-sm p-6 animate-pulse mb-4">
    <div className="h-5 w-1/4 bg-gray-200 rounded mb-2" />
    <div className="h-4 w-2/3 bg-gray-100 rounded mb-2" />
    <div className="h-4 w-1/2 bg-gray-100 rounded mb-2" />
    <div className="h-4 w-1/3 bg-gray-100 rounded" />
  </div>
);

const FeatureReview: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const urlParams = new URLSearchParams(location.search);
  const url = location.state?.url || urlParams.get('url') || sessionStorage.getItem('analysisUrl') || 'https://www.apple.com';
  const webhookDataFromState = location.state?.webhookData;

  const [analysis, setAnalysis] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedSection, setSelectedSection] = useState<any>(null);
  const [recommendation, setRecommendation] = useState<string | null>(null);
  const [recommending, setRecommending] = useState(false);
  const [screenshotUrl, setScreenshotUrl] = useState<string | null>(null);
  const [tab, setTab] = useState('ui');
  const [componentStatuses, setComponentStatuses] = useState<Record<string, Status>>({});
  const [progressLog, setProgressLog] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  const uiTest = useContext(UITestModeContext).uiTest;
  const { selectedModel } = useContext(ModelSelectionContext);
  const [webhookData, setWebhookData] = useState<any>(null);
  const [uiSubTab, setUiSubTab] = useState<SubTab>('all');
  const [recProgressLog, setRecProgressLog] = useState<string[]>([]);
  const [showRecLog, setShowRecLog] = useState(false);
  const [showLoadingScreen, setShowLoadingScreen] = useState(false);
  const [activeChatbots, setActiveChatbots] = useState<Record<string, boolean>>({});
  const [currentChatFeature, setCurrentChatFeature] = useState<string | null>(null);
  const [currentFeatureDescription, setCurrentFeatureDescription] = useState<string | null>(null);
  const [currentFeatureHTMLStructure, setCurrentHTMLStructure] = useState<string>('');
  const [chatbotTab, setChatbotTab] = useState<ChatbotTab>('mockups');
  const [chatHistory, setChatHistory] = useState([]);
  const [loadingText, setLoadingText] = useState('');
  const [waitingForWebhook, setWaitingForWebhook] = useState(false);
  const chatbotRef = useRef<any>(null);

  // FutureHouse API State
  const [futureHouseLoading, setFutureHouseLoading] = useState(false);
  const [futureHouseProgress, setFutureHouseProgress] = useState<string[]>([]);
  const [futureHouseReferences, setFutureHouseReferences] = useState<any[]>([]);
  const [futureHouseError, setFutureHouseError] = useState<string | null>(null);
  const [summarizedRecommendations, setSummarizedRecommendations] = useState<string | null>(null);
  
  // Results page functionality
  const [selectedFramework, setSelectedFramework] = useState('react');
  const [selectedPlatform, setSelectedPlatform] = useState('lovable');
  const [codeCopied, setCodeCopied] = useState(false);
  const [promptCopied, setPromptCopied] = useState(false);
  const { toast } = useToast();
  const [activeCodeTab, setActiveCodeTab] = useState<'code' | 'style'>('code');

  const [resultCode, setResultCode] = useState('');
  const [resultStyle, setResultStyle] = useState('');
  const [resultPrompt, setResultPrompt] = useState('');

  const [outputType, setOutputType] = useState<string | null>(null);
  const [OutputTypeSelected, setOutputTypeSelected] = useState(false);
  const [FrameworkType, setFrameworkType] = useState('');
  const [Language, setLanguage] = useState('');
  const [PlatformType, setPlatformType] = useState('');

  const AVAILABLE_FRAMEWORKS = ['React', 'Vue', 'Angular'];
  const AVAILABLE_LANGUAGES = ['JavaScript', 'TypeScript'];
  const AVAILABLE_PLATFORMS = ['Lovable', 'Cursor', 'Bolt', 'Vercel', 'Replit', 'Magic', 'Sitebrew'];

  
  // Code snippets from Results page
  const codeSnippets = {
    code: resultCode ||`Your code will show here`,
    style: resultStyle || `Your CSS styles will show here`
};

  const platformPrompts = resultPrompt || `Your prompt will show here`;

  //const promptText = platformPrompts[PlatformType as keyof typeof platformPrompts];

  // Loading text animation for Reasoning-Pro
  const loadingTexts = [
    'Analyzing website structure...',
    'Examining user interface elements...',
    'Identifying design patterns...',
    'Evaluating accessibility features...',
    'Checking responsive behavior...',
    'Assessing user experience flow...',
    'Reviewing color schemes and typography...',
    'Analyzing navigation patterns...',
    'Evaluating content hierarchy...',
    'Checking loading states...',
    'Reviewing error handling...',
    'Assessing mobile optimization...',
    'Finalizing comprehensive analysis...'
  ];

  useEffect(() => {
    if (waitingForWebhook) {
      let index = 0;
      const interval = setInterval(() => {
        setLoadingText(loadingTexts[index % loadingTexts.length]);
        index++;
      }, 2000);
      
      return () => clearInterval(interval);
    }
  }, [waitingForWebhook]);

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(codeSnippets[activeCodeTab as keyof typeof codeSnippets]);
      setCodeCopied(true);
      toast({
        title: "Code copied!",
        description: "The code snippet has been copied to your clipboard.",
      });
      setTimeout(() => setCodeCopied(false), 2000);
    } catch (err) {
      toast({
        title: "Failed to copy",
        description: "Please try copying the code manually.",
        variant: "destructive",
      });
    }
  };

  const handleCopyPrompt = async () => {
    try {
      await navigator.clipboard.writeText(platformPrompts);
      setPromptCopied(true);
      toast({
        title: "Prompt copied!",
        description: "The prompt has been copied to your clipboard.",
      });
      setTimeout(() => setPromptCopied(false), 2000);
    } catch (err) {
      toast({
        title: "Failed to copy",
        description: "Please try copying the prompt manually.",
        variant: "destructive",
      });
    }
  };

  // Webhook handler for JSON input functionality (only for Reasoning-Pro)
  const handleWebhookInput = (webhookJsonData: any) => {
    console.log("Received webhook data:", webhookJsonData);
    console.log("Current selected model:", selectedModel);
    
    // Only process webhook data if Reasoning-Pro is selected
    if (selectedModel !== "Reasoning-Pro (wait times 8-15min)") {
      console.log("Webhook functionality is only available for Reasoning-Pro model, current model:", selectedModel);
      return;
    }

    try {
      let sections = [];
      
      console.log("Processing webhook data format...");
      console.log("webhookJsonData structure:", JSON.stringify(webhookJsonData, null, 2));
      
      // Handle different webhook response formats
      if (webhookJsonData.output && webhookJsonData.output.featureName) {
        console.log("Detected single feature response format");
        // Handle single feature response format
        sections = [{
          name: webhookJsonData.output.featureName,
          description: webhookJsonData.output.detailedDescription,
          id: 1,
          purpose: webhookJsonData.output.detailedDescription,
          recommendations: [],
          status: 'rejected'
        }];
      } else if (Array.isArray(webhookJsonData)) {
        console.log("Detected array format");
        // Handle array format
        sections = webhookJsonData.map((item, index) => ({
          name: item.featureName,
          description: item.detailedDescription,
          id: index + 1,
          purpose: item.detailedDescription,
          recommendations: [],
          status: 'rejected'
        }));
      } else if (webhookJsonData.output && Array.isArray(webhookJsonData.output)) {
        console.log("Detected output array format");
        // Handle output array format
        sections = webhookJsonData.output.map((item, index) => ({
          name: item.featureName,
          description: item.detailedDescription,
          id: index + 1,
          purpose: item.detailedDescription,
          recommendations: [],
          status: 'rejected'
        }));
      } else {
        console.error("Unexpected webhook data format:", webhookJsonData);
        throw new Error("Unexpected webhook data format");
      }
      
      console.log("Created sections:", sections);

      // Transform webhook JSON data into analysis structure
      const transformedAnalysis = {
        sections: sections,
        global: {
          title: "Webhook Analysis",
          description: "Analysis from webhook JSON input"
        },
        ux: {
          title: "UX Analysis",
          description: "User experience analysis from webhook data"
        },
        business: {
          title: "Business Analysis", 
          description: "Business impact analysis from webhook data"
        }
      };

      setAnalysis(transformedAnalysis);
      setWebhookData(webhookJsonData);
      setLoading(false);
      setWaitingForWebhook(false);
      
      // Initialize component statuses
      const initialStatuses: Record<string, Status> = {};
      sections.forEach((section) => {
        initialStatuses[section.name] = 'rejected';
      });
      setComponentStatuses(initialStatuses);

      toast({
        title: "Webhook Data Processed",
        description: "Successfully processed webhook JSON data with Reasoning-Pro",
      });
    } catch (error) {
      console.error("Error processing webhook data:", error);
      setWaitingForWebhook(false);
      toast({
        title: "Error",
        description: "Failed to process webhook data",
        variant: "destructive",
      });
    }
  };

  // Expose webhook handler globally for external webhook calls
  useEffect(() => {
    if (selectedModel === "Reasoning-Pro (wait times 8-15min)") {
      (window as any).handleWebhookInput = handleWebhookInput;
      (window as any).processWebhookResponse = handleWebhookInput;
      
      // Also listen for custom webhook events
      const handleCustomWebhook = (event: CustomEvent) => {
        console.log("Received custom webhook event:", event.detail);
        handleWebhookInput(event.detail);
      };
      
      window.addEventListener('webhookResponse', handleCustomWebhook as EventListener);
      
      return () => {
        window.removeEventListener('webhookResponse', handleCustomWebhook as EventListener);
      };
    } else {
      delete (window as any).handleWebhookInput;
      delete (window as any).processWebhookResponse;
    }
    
    return () => {
      delete (window as any).handleWebhookInput;
      delete (window as any).processWebhookResponse;
    };
  }, [selectedModel]);

  // Listen for webhook response messages and polling
  useEffect(() => {
    let pollInterval: NodeJS.Timeout | null = null;
    
    const handleMessage = (event: MessageEvent) => {
      console.log("Received message event:", event);
      if (event.data && event.data.type === 'webhook-response') {
        console.log("Processing webhook response from message event");
        handleWebhookInput(event.data.data);
      }
    };

    const checkForWebhookResponse = () => {
      // Check if there's a webhook response in sessionStorage
      const storedResponse = sessionStorage.getItem('webhookResponse');
      if (storedResponse) {
        try {
          const parsedResponse = JSON.parse(storedResponse);
          console.log("Found stored webhook response:", parsedResponse);
          handleWebhookInput(parsedResponse);
          sessionStorage.removeItem('webhookResponse');
        } catch (error) {
          console.error("Error parsing stored webhook response:", error);
        }
      }
    };

    // Start polling for webhook responses if waiting
    if (waitingForWebhook) {
      console.log("Starting webhook polling...");
      pollInterval = setInterval(checkForWebhookResponse, 1000);
    }

    window.addEventListener('message', handleMessage);
    
    return () => {
      window.removeEventListener('message', handleMessage);
      if (pollInterval) clearInterval(pollInterval);
    };
  }, [waitingForWebhook]);

  // Mock webhook endpoint for testing (only in development)
  useEffect(() => {
    if (selectedModel === "Reasoning-Pro (wait times 8-15min)") {
      const mockWebhookData = [
        {
          "featureName": "Header",
          "detailedDescription": "Logo, navigation menu, search icon. Fonts: SF Pro Display, 18px, Bold • Colors: White background, black text, blue accent. Layouts: Interactions: Sticky on scroll, hover underline on nav links. Mobile: CSS properties: N/A"
        },
        {
          "featureName": "Hero Section", 
          "detailedDescription": "Large full-width banner at the top with dark blue gradient background (#1a237e to #3949ab). Features centered white headline in bold sans-serif font (48px), smaller gray subtitle (16px). Contains prominent orange CTA button (#ff9800) with rounded corners and drop shadow. Background includes subtle geometric pattern overlay. Section height spans 80vh with content vertically centered."
        },
        {
          "featureName": "Navigation Bar",
          "detailedDescription": "Horizontal navigation bar with white background and subtle shadow. Logo positioned left, main navigation links center-aligned using SF Pro Display 16px medium weight. Search icon and user account dropdown on right. Sticky positioning on scroll with smooth transition. Hover effects include blue underline animation. Mobile version collapses to hamburger menu."
        }
      ];
      
      // Auto-process mock data after 5 seconds if no real webhook data received
      const mockTimeout = setTimeout(() => {
        if (!analysis && !webhookData && waitingForWebhook) {
          console.log("Processing mock webhook data for Reasoning-Pro");
          handleWebhookInput(mockWebhookData);
        }
      }, 5000);
      
      return () => clearTimeout(mockTimeout);
    }
  }, [selectedModel, analysis, webhookData, waitingForWebhook]);

  useEffect(() => {
    setLoading(true);
    setProgressLog([]);
    setError(null);
    setAnalysis(null);
    setScreenshotUrl(null);
    setComponentStatuses({});
    setSelectedSection(null);
    setRecommendation(null);
    setRecommending(false);

    // If we have webhook data from navigation state, process it immediately
    if (webhookDataFromState) {
      console.log("Processing webhook data from navigation state");
      handleWebhookInput(webhookDataFromState);
      return;
    }

    // If we're waiting for webhook data, show loading state
    if (location.state?.waitingForWebhook) {
      console.log("Waiting for webhook data...");
      setWaitingForWebhook(true);
      return;
    }

    if (uiTest) {
      // In UI Test Mode, only mimic analysis, do not call backend
      analyzeWithScreenshot(url, uiTest).then((mockAnalysis) => {
        setAnalysis(mockAnalysis);
        setLoading(false);
        setScreenshotUrl(null); // Optionally set a mock screenshot URL if desired
        // The mockAnalysis now uses the new format, so we need to parse it
        if (mockAnalysis.choices && mockAnalysis.choices[0]?.message?.content) {
          try {
            const parsedContent = JSON.parse(mockAnalysis.choices[0].message.content);
            if (parsedContent.websiteFeatures) {
          const initialStatuses: Record<string, Status> = {};
              parsedContent.websiteFeatures.forEach((section: any, idx: number) => {
                initialStatuses[section.featureName || idx] = 'rejected';
          });
          setComponentStatuses(initialStatuses);
            }
          } catch (e) {
            console.error('Failed to parse mock analysis content:', e);
          }
        }
      });
      return;
    }

    // If Reasoning-Pro is selected, wait for webhook data instead of calling backend
    if (selectedModel === "Reasoning-Pro (wait times 8-15min)") {
      setProgressLog(["Waiting for Reasoning-Pro webhook data..."]);
      setWaitingForWebhook(true);
      setLoadingText(loadingTexts[0]);
      // The webhook handler will process the data when received
      // Analysis will be set by handleWebhookInput function
      return;
    }

    // --- New: Call /extract-features (POST) instead of EventSource ---
    async function fetchAnalysis() {
      try {
        console.log("[DEBUG] ===== Frontend: fetchAnalysis started =====");
        console.log("[DEBUG] URL to analyze:", url);
        console.log("[DEBUG] API base URL:", MAIN_API_BASE);
        
        setProgressLog(["Sending request to analysis server..."]);
        
        const requestBody = { url };
        console.log("[DEBUG] Request body:", requestBody);
        console.log("[DEBUG] About to send POST request to:", `${MAIN_API_BASE}/extract-features`);
        
        const response = await fetch(`${MAIN_API_BASE}/extract-features`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody),
        });
        
        console.log("[DEBUG] Response received");
        console.log("[DEBUG] Response status:", response.status);
        console.log("[DEBUG] Response status text:", response.statusText);
        console.log("[DEBUG] Response headers:", Object.fromEntries(response.headers.entries()));
        
        if (!response.ok) {
          console.log("[DEBUG] Response not OK - throwing error");
          const errorText = await response.text();
          console.log("[DEBUG] Error response text:", errorText);
          throw new Error(`Failed to analyze the website. Status: ${response.status}, Text: ${errorText}`);
        }
        
        console.log("[DEBUG] Response is OK - parsing JSON...");
        setProgressLog(["Analysis complete!"]);
        
        const data = await response.json();
        console.log("[DEBUG] JSON parsed successfully");
        console.log("[DEBUG] Data type:", typeof data);
        console.log("[DEBUG] Data keys:", Object.keys(data));
        console.log("[DEBUG] Data content (first 500 chars):", JSON.stringify(data).substring(0, 500));
        
        setAnalysis(data);
        // console.log("[Nichole DEBUG] Analysis:", data);
        setLoading(false);
        
        // Initialize statuses - handle both old and new response formats
        if (data.sections) {
          console.log("[DEBUG] Using old format (data.sections)");
          // Old format
          const initialStatuses: Record<string, Status> = {};
          data.sections.forEach((section: any, idx: number) => {
            initialStatuses[section.name || idx] = 'rejected';
          });
          setComponentStatuses(initialStatuses);
        } else if (data.choices && data.choices[0]?.message?.content) {
          console.log("[DEBUG] Using wrapped new format (data.choices)");
          // Wrapped new format
          try {
            const parsedContent = JSON.parse(data.choices[0].message.content);
            console.log("[DEBUG] Parsed content type:", typeof parsedContent);
            console.log("[DEBUG] Parsed content keys:", Object.keys(parsedContent));
            
            if (parsedContent.websiteFeatures) {
              console.log("[DEBUG] Found websiteFeatures, initializing statuses");
              const initialStatuses: Record<string, Status> = {};
              parsedContent.websiteFeatures.forEach((section: any, idx: number) => {
                initialStatuses[section.featureName || idx] = 'rejected';
              });
              setComponentStatuses(initialStatuses);
            }
          } catch (e) {
            console.error('[DEBUG] Failed to parse backend response content:', e);
          }
        } else if (data.websiteFeatures) {
          console.log("[DEBUG] Using direct new format (data.websiteFeatures)");
          // Direct new format - backend returns the new format directly
          const initialStatuses: Record<string, Status> = {};
          data.websiteFeatures.forEach((section: any, idx: number) => {
            initialStatuses[section.featureName || idx] = 'rejected';
          });
          setComponentStatuses(initialStatuses);
        } else {
          console.log("[DEBUG] Unknown response format");
          console.log("[DEBUG] Data structure:", data);
        }
        
        console.log("[DEBUG] ===== Frontend: fetchAnalysis completed successfully =====");
      } catch (err: any) {
        console.log("[DEBUG] ===== Frontend: fetchAnalysis ERROR =====");
        console.log("[DEBUG] Error type:", typeof err);
        console.log("[DEBUG] Error message:", err.message);
        console.log("[DEBUG] Error stack:", err.stack);
        console.log("[DEBUG] ===== END ERROR =====");
        
        setError(err.message || 'Connection lost or server error.');
        setLoading(false);
      }
    }
    fetchAnalysis();
    // eslint-disable-next-line
  }, [url, uiTest, selectedModel, webhookDataFromState]);

  const handleStatusChange = (section: any, status: Status) => {
    if (status === 'improved') {
      setShowLoadingScreen(true);
      // Simulate loading time then update status and show chatbot
      setTimeout(async () => {
        setComponentStatuses(prev => ({ ...prev, [section.name || section.id]: status }));
        setShowLoadingScreen(false);
        // Directly set the tab to show the chatbot interface
        setTab('chatbot');
        const featureName = section.name || `Feature ${section.id || 'Unknown'}`;
        setCurrentChatFeature(featureName);
        setCurrentFeatureDescription(section.purpose || 'No design description available');
        setCurrentHTMLStructure(section.htmlStructure || '');
        setActiveChatbots(prev => ({ ...prev, [featureName]: true }));

        // Only make API calls if NOT in UI Test Mode
        if (!uiTest) {
          // --- NEW: Trigger OpenRouter API call here ---
          // Debug: Log the mappedAnalysis structure
          console.log('[DEBUG] mappedAnalysis structure:', mappedAnalysis);
          console.log('[DEBUG] Current section:', section);
          console.log('[DEBUG] featureName:', featureName);
          
          // Check if the feature exists in mappedAnalysis
          const matchingFeature = mappedAnalysis.sections.find(s => s.name === featureName);
          console.log('[DEBUG] Matching feature found:', matchingFeature);
          
          // 1. Call OpenRouter to get the prompt
          const openRouterRes = await fetch('http://localhost:8000/openrouter-generate-research-prompt', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              feature_name: featureName,
              screenshot_url: section.cropped_image_url || '',
              feature_extraction_result: {
                websiteFeatures: mappedAnalysis.sections.map(s => ({
                  featureName: s.name,
                  detailedDescription: s.purpose,
                  htmlStructure: s.htmlStructure,
                  cssProperties: s.css_properties
                })),
                siteUXArchitecture: {
                  businessContext: mappedAnalysis.ux_architecture.businessContext,
                  targetAudience: mappedAnalysis.ux_architecture.targetAudience,
                  userGoals: mappedAnalysis.ux_architecture.userGoals,
                  navigationStructure: mappedAnalysis.ux_architecture.page_flow,
                  responsiveness: mappedAnalysis.ux_architecture.responsiveness,
                  accessibilityObservations: mappedAnalysis.ux_architecture.accessibilityObservations
                },
                brandIdentity: {
                  logoUrl: mappedAnalysis.global_design_summary.logoUrl,
                  dominantColorPalette: mappedAnalysis.global_design_summary.color_palette.split(', ').filter(c => c),
                  typographyStyles: mappedAnalysis.global_design_summary.typographyStyles,
                  designTone: mappedAnalysis.global_design_summary.designTone
                },
                companyOverview: {
                  companyName: mappedAnalysis.business_analysis.companyName,
                  employeeCount: mappedAnalysis.business_analysis.employeeCount,
                  industry: mappedAnalysis.business_analysis.industry,
                  headquartersLocation: mappedAnalysis.business_analysis.headquartersLocation,
                  foundedYear: mappedAnalysis.business_analysis.foundedYear,
                  externalLinks: {
                    LinkedIn: mappedAnalysis.business_analysis.externalLinks.linkedIn,
                    Facebook: mappedAnalysis.business_analysis.externalLinks.facebook,
                    Instagram: mappedAnalysis.business_analysis.externalLinks.instagram
                  }
                }
              }
            })
          });
          const response = await openRouterRes.json();
          const prompt_to_FH = response.prompt_to_FH;

          // 2. Show the prompt in the chat
          console.log("[DEBUG]: About to add prompt message to chat");
          if (chatbotRef.current) {
            chatbotRef.current.addBotMessage(`Prompt to FutureHouse: ${prompt_to_FH}`);
            console.log("[DEBUG]: Prompt message added to chat");
            // Small delay to ensure message is processed
            await new Promise(resolve => setTimeout(resolve, 100));
          } else {
            console.error("[DEBUG]: chatbotRef.current is null when trying to add prompt message");
          }

          console.log("[DEBUG]: prompt_to_FH", prompt_to_FH);

          // 3. Add a loading message for FutureHouse immediately
          console.log("[DEBUG]: Adding FutureHouse loading message");
          if (chatbotRef.current) {
            chatbotRef.current.addBotMessage("FutureHouse is analyzing... (this may take a few minutes)");
            console.log("[DEBUG]: FutureHouse loading message added");
            // Small delay to ensure message is processed
            await new Promise(resolve => setTimeout(resolve, 100));
          } else {
            console.error("[DEBUG]: chatbotRef.current is null when trying to add loading message");
          }

          // 4. Call FutureHouse with the prompt
          setFutureHouseLoading(true);
          setFutureHouseError(null); // Clear any previous errors
          setFutureHouseProgress(["FutureHouse analysis started..."]);
          const fhRes = await fetch('http://localhost:8000/futurehouse-research-prompt-direct', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt: prompt_to_FH })
          });

          if (!fhRes.ok) {
            throw new Error(`FutureHouse API error: ${fhRes.status} ${fhRes.statusText}`);
          }

          const { task_response, recommendations, papers } = await fhRes.json();

          // Store references for sources tab
          setFutureHouseReferences(papers || []);

          setFutureHouseLoading(false);
          setFutureHouseProgress([]);

          // 5. Just tell the user FutureHouse is done
          console.log("[DEBUG]: About to add FutureHouse completion message");
          if (chatbotRef.current) {
            chatbotRef.current.addBotMessage("FutureHouse analysis is finished. Summarizing results...");
            console.log("[DEBUG]: FutureHouse completion message added");
            // Small delay to ensure message is processed
            await new Promise(resolve => setTimeout(resolve, 100));
          } else {
            console.error("[DEBUG]: chatbotRef.current is null when trying to add completion message");
          }

          // 6. Call OpenRouter to summarize recommendations
          const summarizeRes = await fetch('http://localhost:8000/openrouter-summarize-recommendations', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              answer: task_response.answer, // should be an array of strings
              context: { featureName, detailedDescription: section.detailedDescription || section.description },
              references: papers // or whatever your references are called
            })
          });
          const summarizeResponse = await summarizeRes.json();
          console.log("[DEBUG]: Full summarizeResponse:", summarizeResponse);
          
          // Check if summary_text exists in the response
          if (!summarizeResponse.summary_text) {
            console.error("[DEBUG]: summary_text not found in response. Available keys:", Object.keys(summarizeResponse));
            throw new Error("summary_text not found in response");
          }
          
          const { summary_text } = summarizeResponse;
          console.log("[DEBUG]: summary_text:", summary_text);

          // Store the summarized recommendations in state
          setSummarizedRecommendations(summary_text);
          console.log("[DEBUG]: Stored summarizedRecommendations in state:", summarizedRecommendations);

          // 7. Show the improvements in the chat
          console.log("[DEBUG]: About to add final summary message");
          console.log("[DEBUG]: chatbotRef.current:", chatbotRef.current);
          if (chatbotRef.current) {
            console.log("[DEBUG]: addBotMessage method exists:", typeof chatbotRef.current.addBotMessage);
            // Small delay before adding final message
            await new Promise(resolve => setTimeout(resolve, 100));
            chatbotRef.current.addBotMessage(summary_text);
            console.log("[DEBUG]: Final summary message added successfully");
          } else {
            console.error("[DEBUG]: chatbotRef.current is null!");
            // Fallback: try to show the message in the console or alert
            console.log("[FALLBACK] Summary text:", summary_text);
            alert(`FutureHouse Analysis Complete:\n\n${summary_text}`);
          }
        } else {
          // In UI Test Mode, just show a mock message
          chatbotRef.current?.addBotMessage("UI Test Mode: Mock analysis complete. This would show real recommendations in production mode.");
        }

      }, 3000);
    } else {
      setComponentStatuses(prev => ({ ...prev, [section.name || section.id]: status }));
    }
  };

  const handleCloseChatbot = (featureName: string) => {
    setActiveChatbots(prev => ({ ...prev, [featureName]: false }));
  };

  const handleCloseLoadingScreen = () => {
    setShowLoadingScreen(false);
  };

  const handleGetRecommendation = async (section: any) => {
    setRecommending(true);
    setRecommendation(null);
    setSelectedSection(section);
    setShowRecLog(true);
    setRecProgressLog(["Preparing recommendation request...", "Sending to Future House...", "Waiting for response..."]);
    try {
      let logStep = 3;
      const addLog = (msg: string) => setRecProgressLog(prev => [...prev, msg]);
      if (uiTest) {
        await new Promise(r => setTimeout(r, 1200));
        addLog("Processing results...");
        await new Promise(r => setTimeout(r, 800));
        addLog("Done!");
        const recs = await getRecommendations([section.name], uiTest);
        setRecommendation(recs.map(r => r.text).join('\n'));
        setShowRecLog(false);
        navigate('/recommendations', { state: { section, context: { section, url }, recommendations: recs.map(r => r.text), papers: [], showRecLog: true } });
        return;
      }
      const context = {
        section,
        url,
        global: analysis?.global,
        ux: analysis?.ux,
        business: analysis?.business,
      };
      const resp = await fetch(`${MAIN_API_BASE}/recommendations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          feature: section.name,
          currentDesign: JSON.stringify(context),
          context: '',
        }),
      });
      if (!resp.ok) throw new Error('Failed to get recommendations');
      const data = await resp.json();
      setRecommendation((data.recommendations || []).join('\n'));
      navigate('/recommendations', { state: { section, context, recommendations: data.recommendations, papers: data.papers } });
    } catch (e) {
      setRecommendation('Failed to get recommendations.');
      setRecProgressLog(prev => [...prev, '❌ Error: Failed to get recommendations.']);
      setShowRecLog(false);
    } finally {
      setRecommending(false);
    }
  };

  const handleChatUpdate = (newChatHistory: Array<{ text: string; isUser: boolean; id: string }>) => {
    const futurehouseLoading = [
        "Prompt to FutureHouse:",
        "FutureHouse is analyzing... (this may take a few minutes)",
        "FutureHouse analysis started...",
        "FutureHouse analysis is finished."
      ];
    
    const filteredChatHistory = newChatHistory.filter(msg => {
      return !futurehouseLoading.some(prefix => msg.text.startsWith(prefix));
    });
     
    setChatHistory(filteredChatHistory);
  };

  const [lastChatLength, setLastChatLength] = useState(0);
  const [isTyping, setIsTyping] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const processedChatRef = useRef<Set<string>>(new Set());
  const lastProcessedChatRef = useRef<string>('');

  useEffect(() => {
    if (outputType === 'code') {
      setPlatformType('');
    }
    if (outputType === 'prompt') {
      setFrameworkType('');
      setLanguage('');
    } 
    if (outputType === null) {
      setFrameworkType('');
      setPlatformType('');
      setOutputTypeSelected(false);
    }
  }, [outputType]);

  const [lastOutputType, setLastOutputType] = useState<string | null>(null);
  const [lastFrameworkType, setLastFrameworkType] = useState('');
  const [lastPlatformType, setLastPlatformType] = useState('');
  const [lastLanguage, setLastLanguage] = useState('');

  const handleResetOutput = () => {
    setOutputTypeSelected(false);
  }
  
  const fetchCodeAndPrompt = React.useCallback(async (chatHistory: Array<{ text: string; isUser: boolean; id: string }>) => {
    if (isFetching) return;
    setIsFetching(true);

    try {
      let latestRecommendation = '';
      if (chatHistory.length === 1){
        latestRecommendation = 'ONLY implement the CRITICAL PRIORITY recommendation or IMPLEMENT FIRST recommendation or HIGH IMPACT recommendation. ' + summarizedRecommendations;
      } else {
        latestRecommendation = chatHistory
        .filter(msg => !msg.isUser)
        .pop()?.text || "No latest recommendation available";
      }
      
      const requestBody = {
        featureName: currentChatFeature,
        featureDescription: currentFeatureDescription,
        htmlStructure: currentFeatureHTMLStructure,
        latestRecommendation: latestRecommendation,
        outputType: outputType,
        framework: FrameworkType,
        language: Language,
        platform: PlatformType,
      };
      
      const response = await fetch(`${MAIN_API_BASE}/recommendation-prompt-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch code and prompt');
      }

      const data = await response.json();

      const decodeBase64 = (encoded: string): string => {
        try {
          return atob(encoded);
        } catch (e) {
          console.warn('Failed to decode base64, using as-is:', e);
          return encoded;
        }
      };

      setResultCode(decodeBase64(data.code) || '');
      setResultStyle(decodeBase64(data.style) || '');
      setResultPrompt(data.prompt || '');
      
    } catch (error) {
      console.error('Error fetching code and prompt:', error);
    } finally {
      setIsFetching(false);
      setLastChatLength(chatHistory.length);
      setLastOutputType(outputType);
      setLastFrameworkType(FrameworkType);
      setLastLanguage(Language);
      setLastPlatformType(PlatformType);
      console.log('lastoutput:', outputType);
      console.log('lastframework:', FrameworkType);
      console.log('lastplatform:', PlatformType);
    }
  }, [
    isFetching,
    currentChatFeature,
    currentFeatureDescription,
    currentFeatureHTMLStructure,
    outputType,
    FrameworkType,
    Language,
    PlatformType,
    summarizedRecommendations
  ]);
  
  // Effect to fetch code/prompt when needed
  React.useEffect(() => {
    if (!OutputTypeSelected || 
        (outputType === 'code' && !FrameworkType) || 
        (outputType === 'prompt' && !PlatformType)) {
      return;
    }
    
    const hasChatResponse = chatHistory.some(msg => !msg.isUser);

    if (chatHistory.length > 0 && currentChatFeature && currentFeatureDescription && !isFetching && hasChatResponse) {
      const latestResponse = chatHistory.filter(msg => !msg.isUser).pop();
      const responseContent = latestResponse.text;

      if (chatHistory.length > lastChatLength) {
        if (latestResponse && !processedChatRef.current.has(latestResponse.id)) {
          if (responseContent !== lastProcessedChatRef.current) {
            console.log('[DEBUG] Processing new chat response:', latestResponse.id);
            processedChatRef.current.add(latestResponse.id);
            lastProcessedChatRef.current = responseContent;
            fetchCodeAndPrompt(chatHistory);
          } else {
            console.log('[DEBUG] Skipping duplicate chat response');
          }
        }
      } else if (lastOutputType !== outputType || lastFrameworkType !== FrameworkType || lastPlatformType !== PlatformType || lastLanguage !== Language) {
        fetchCodeAndPrompt(chatHistory);
      }
    }
  }, [chatHistory, lastChatLength, isTyping, isFetching, currentChatFeature, currentFeatureDescription, OutputTypeSelected, outputType, FrameworkType, PlatformType, lastOutputType, lastFrameworkType, lastPlatformType, lastLanguage, Language, fetchCodeAndPrompt]);

  // Reset processed chat ref when switching features
  React.useEffect(() => {
    processedChatRef.current.clear();
    lastProcessedChatRef.current = '';
  }, [currentChatFeature]);

  const hasCode = Boolean(resultCode)
  const hasStyle = Boolean(resultStyle)

  const showCodeTabs = hasCode && hasStyle;
  const defaultCodeTab = 'code';
  
  React.useEffect(() => {
    if (!showCodeTabs) {
      setActiveCodeTab(defaultCodeTab);
    }
  }, [showCodeTabs, defaultCodeTab]);

  // Add test button for development
  const showTestButton = process.env.NODE_ENV === 'development';

  // Transform backend response to frontend format
  let mappedAnalysis = null;
  if (analysis) {
    try {
      // Handle different response formats
      let parsedContent;
      
      if (analysis.choices && analysis.choices[0]?.message?.content) {
        // Wrapped format (old)
        parsedContent = JSON.parse(analysis.choices[0].message.content);
      } else if (analysis.websiteFeatures) {
        // Direct new format (current)
        parsedContent = analysis;
      } else {
        console.error('Unknown analysis format:', analysis);
        return;
      }
      
      // Transform the new response format to match frontend expectations
      mappedAnalysis = {
        // Transform websiteFeatures to sections
        sections: parsedContent.websiteFeatures?.map((feature: any, index: number) => ({
          name: feature.featureName || `Feature ${index + 1}`,
          purpose: feature.detailedDescription || '',
          htmlStructure: feature.htmlStructure || '',
          css_properties: feature.cssProperties || ''
        })) || [],
        
        // Transform brandIdentity to global_design_summary
        global_design_summary: {
          logoUrl: parsedContent.brandIdentity?.logoUrl || '', // Not directly provided
          color_palette: parsedContent.brandIdentity?.dominantColorPalette?.join(', ') || '',
          typographyStyles: parsedContent.brandIdentity?.typographyStyles || '',
          designTone: parsedContent.brandIdentity?.designTone || ''
        },
        
        // Transform siteUXArchitecture to ux_architecture
        ux_architecture: {
          page_flow: parsedContent.siteUXArchitecture?.navigationStructure || '',
          businessContext: parsedContent.siteUXArchitecture?.businessContext || '', // Not directly provided
          targetAudience: parsedContent.siteUXArchitecture?.targetAudience || '',
          userGoals: parsedContent.siteUXArchitecture?.userGoals || '',
          responsiveness: parsedContent.siteUXArchitecture?.responsiveness || '',
          accessibilityObservations: parsedContent.siteUXArchitecture?.accessibilityObservations || '',
        },
        
        // Transform companyOverview and siteUXArchitecture to business_analysis
        business_analysis: {
          companyName: parsedContent.companyOverview?.companyName || '',
          employeeCount: parsedContent.companyOverview?.employeeCount || '',
          industry: parsedContent.companyOverview?.industry || '',
          headquartersLocation: parsedContent.companyOverview?.headquartersLocation || '',
          foundedYear: parsedContent.companyOverview?.foundedYear || '',
          externalLinks: {
            linkedIn: parsedContent.companyOverview?.externalLinks?.LinkedIn || '',
            facebook: parsedContent.companyOverview?.externalLinks?.Facebook || '',
            instagram: parsedContent.companyOverview?.externalLinks?.Instagram || '',
          },
        }
      };
    } catch (e) {
      console.error('Failed to parse analysis content:', e);
      mappedAnalysis = null;
    }
  }

  // Debug logging for backend response and mappedAnalysis
  React.useEffect(() => {
    if (analysis) {
      console.log('[DEBUG] Raw backend response:', analysis);
      console.log('[DEBUG] Mapped analysis:', mappedAnalysis);
    }
  }, [analysis, mappedAnalysis]);



  if (loading) {
  return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] w-full">
        <Loader2 className="h-10 w-10 animate-spin mb-4 text-primary" />
        <p className="text-lg mb-4">Analyzing UI and UX...</p>
        <div className="w-full max-w-xl bg-muted/40 rounded-lg p-4 mb-8">
          <h2 className="font-semibold mb-2 flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" /> Live Analysis Log
          </h2>
          <div className="font-mono text-sm space-y-1">
            {progressLog.map((msg, i) => (
              <div key={i}>{msg}</div>
            ))}
            {error && <div className="text-red-500">{error}</div>}
          </div>
        </div>
        <div className="max-w-6xl w-full">
          <SectionSkeleton title="Global Design System" />
          <SectionSkeleton title="UX Architecture" />
          <SectionSkeleton title="Business & Audience" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {[...Array(3)].map((_, i) => <UICardSkeleton key={i} />)}
          </div>
        </div>
      </div>
    );
  }

  // Check if mappedAnalysis is valid
  if (!mappedAnalysis) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <p className="text-lg text-red-500">Failed to analyze the website. Please try again.</p>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar 
          activeTab={tab} 
          onTabChange={setTab} 
          activeChatbots={activeChatbots}
          onChatSelect={(featureName) => {
            setCurrentChatFeature(featureName);
            setTab('chatbot');
          }}
        />
        <SidebarInset>
          <header className="flex h-16 shrink-0 items-center gap-2 px-4 border-b">
            <SidebarTrigger className="-ml-1" />
            <div className="flex flex-col">
              <Badge variant="outline" className="w-fit">Auto UI Analysis</Badge>
            </div>
          </header>
          <div className="flex-1 p-6">
            {tab === 'chatbot' ? (
              // Full width layout for chatbot
              <div className="h-[calc(100vh-8rem)]">
                {/* Chatbot Content */}
                <div className="flex gap-4 h-full">
                  <div className="w-1/2 h-full">
                    <FeatureChatbot 
                    ref={chatbotRef}
                    featureName={currentChatFeature}
                    onChatUpdate={handleChatUpdate}
                    onTypingChange={setIsTyping}
                    />
                  </div>
                  <div className="w-1/2 bg-gray-100 rounded-lg h-full p-4">
                    {/* Chatbot Tab Design */}
                    <div className="flex justify-center mb-6">
                      <div className="flex items-center gap-3 bg-background/5 backdrop-blur-lg py-1 px-1 rounded-full shadow-lg">
                        {CHATBOT_TABS.map((chatTab) => {
                          const isActive = chatbotTab === chatTab;
                          return (
                            <button
                              key={chatTab}
                              onClick={() => setChatbotTab(chatTab as ChatbotTab)}
                              className={cn(
                                "relative cursor-pointer text-sm font-semibold px-6 py-2 rounded-full transition-colors",
                                "text-foreground/80 hover:text-primary",
                                isActive && "bg-muted text-primary",
                              )}
                            >
                              {chatTab.charAt(0).toUpperCase() + chatTab.slice(1)}
                              {isActive && (
                                <motion.div
                                  layoutId="chatbot-lamp"
                                  className="absolute inset-0 w-full bg-primary/5 rounded-full -z-10"
                                  initial={false}
                                  transition={{
                                    type: "spring",
                                    stiffness: 300,
                                    damping: 30,
                                  }}
                                >
                                  <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-8 h-1 bg-primary rounded-t-full">
                                    <div className="absolute w-12 h-6 bg-primary/20 rounded-full blur-md -top-2 -left-2" />
                                    <div className="absolute w-8 h-6 bg-primary/20 rounded-full blur-md -top-1" />
                                    <div className="absolute w-4 h-4 bg-primary/20 rounded-full blur-sm top-0 left-2" />
                                  </div>
                                </motion.div>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                    
                    {/* Tab Content */}
                    <div className="h-[calc(100%-5rem)]">
                      {chatbotTab === 'mockups' && <div className="h-full p-6 bg-background rounded-lg overflow-y-auto">Mockups content coming soon...</div>}
                      {chatbotTab === 'improvements' && (
                        <div className="h-full p-6 bg-background rounded-lg overflow-y-auto">
                          <h3 className="text-xl font-bold mb-4 text-center">UX Improvement Results</h3>
                          
                          {!OutputTypeSelected ? (<Card className="mb-6 text-center max-w-md mx-auto">
                            <CardHeader>
                              <CardTitle>Select your output type</CardTitle>
                            </CardHeader>
                            <CardContent>
                              <div className="mb-4">
                                <div className="font-medium mb-2 text-lg">What kind of output do you want?</div>
                                <div className="flex flex-wrap gap-4 mb-4 justify-center">
                                <ToggleGroup type="single" value={outputType} onValueChange={setOutputType} className="gap-2 justify-center flex flex-wrap">
                                  <ToggleGroupItem
                                    value="prompt"
                                    className="px-5 py-2 rounded-md hover:bg-zinc-100 cursor-pointer"
                                    >Prompt</ToggleGroupItem>
                                  <ToggleGroupItem value="code"
                                    className="px-5 py-2 rounded-md hover:bg-zinc-100 cursor-pointer"
                                    >Code</ToggleGroupItem>
                                </ToggleGroup>
                                </div>
                              </div>
                              {outputType === 'prompt' ? (
                                <div className="mb-4">
                                  <div className="font-medium mb-2 text-lg">Select platform:</div>
                                  <div className="flex flex-wrap gap-4 justify-center">
                                    {AVAILABLE_PLATFORMS.map((platform) => (
                                      <label key={platform} className="flex items-center gap-3 cursor-pointer select-none">
                                        <Checkbox
                                          checked={PlatformType === platform}
                                          onCheckedChange={(checked) => {
                                            if (checked === true) {
                                              setPlatformType(platform);
                                            } else {
                                              setPlatformType(null);
                                            }
                                          }}
                                          disabled={outputType === 'code' as string}
                                          />
                                        <span>{platform}</span>
                                      </label>
                                    ))}
                                  </div>
                                  <div className="mt-4 space-y-2">
                                  <Button
                                    size="sm"
                                    variant="default"
                                    className=" shadow-sm px-8"
                                    
                                    onClick={() => setOutputTypeSelected(true)}>OK
                                  </Button>
                                  </div>
                                </div>
                              ) : null}
                              {outputType === 'code' ? (
                                <div className="mb-4">
                                  <div className="font-medium mb-2 text-lg">Select framework:</div>
                                  <div className="flex flex-wrap gap-4 justify-center">
                                    {AVAILABLE_FRAMEWORKS.map((framework) => (
                                      <label key={framework} className="flex items-center gap-3 cursor-pointer select-none">
                                        <Checkbox
                                          checked={FrameworkType === framework}
                                          onCheckedChange={(checked) => {
                                            if (checked === true) {
                                              setFrameworkType(framework);
                                              if (framework == 'Angular') setLanguage('');
                                            } else {
                                              setFrameworkType('');
                                              setLanguage('');
                                            }
                                          }}
                                          disabled={outputType === 'prompt' as string}
                                          />
                                        <span>{framework}</span>
                                      </label>
                                    ))}
                                  </div>
                                  {/* Language selector only for React */}
                                  {(FrameworkType === 'React' || FrameworkType === 'Vue') && (
                                    <div className="mt-4">
                                      <div className="font-medium mb-2 text-lg">Select language:</div>
                                      <div className="flex gap-4 justify-center">
                                        {AVAILABLE_LANGUAGES.map((lang) => (
                                          <label key={lang} className="flex items-center gap-3 cursor-pointer select-none">
                                            <Checkbox
                                              checked={Language === lang}
                                              onCheckedChange={(checked) => {
                                                if (checked === true) setLanguage(lang);
                                                else setLanguage('');
                                              }}
                                            />
                                            <span>{lang}</span>
                                          </label>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                  <div className="mt-4 space-y-2">
                                    <Button
                                      size="sm"
                                      variant="default"
                                      className=" shadow-sm px-8"
                                      onClick={() => setOutputTypeSelected(true)}
                                    >
                                      OK
                                    </Button>
                                  </div>
                                </div>
                              ) : null}
                            </CardContent>
                          </Card>
                          ) : (
                          <div className="flex items-center justify-center mb-6">
                          {outputType === 'code' ? (
                          <div className="h-full p-6 bg-background rounded-lg overflow-y-auto">
                              {isFetching ? (
                                <div className="flex flex-col items-center justify-center min-h-[200px]">
                                  <Loader2 className="h-8 w-8 animate-spin mb-2 text-primary" />
                                  <p className="text-lg">Generating code, please wait...</p>
                                </div>
                              ) : (
                                <Card>
                                  <CardHeader>
                                    <CardTitle>Your {FrameworkType} Code</CardTitle>
                                    <Button 
                                      onClick={handleResetOutput} 
                                      size="lg"
                                      variant="ghost"
                                      className="absolute top-4 right-4 shadow-sm px-2"
                                      > Reset output
                                    </Button>                                 
                                  </CardHeader>
                                  <CardContent className="space-y-4">
                                    <div className="w-full max-w-xl mx-auto">
                                      {showCodeTabs && (
                                        <div className="flex border-b border-border mb-4">
                                          <button
                                              className={`px-4 py-2 font-medium ${activeCodeTab === "code" ? "border-b-2 border-primary text-primary" : "text-muted-foreground"
                                            }`}
                                            onClick={() => setActiveCodeTab("code")}
                                          >
                                            Code
                                          </button>
                                          <button
                                                className={`px-4 py-2 font-medium ${activeCodeTab === "style" ? "border-b-2 border-primary text-primary" : "text-muted-foreground"
                                            }`}
                                            onClick={() => setActiveCodeTab("style")}
                                          >
                                            Style
                                          </button>
                                        </div>
                                      )}
                                    <CodeBlock>
                                      <CodeBlockGroup className="border-border border-b p-4">
                                        <div className="flex items-center gap-2">
                                          <div className="bg-primary/10 text-primary rounded px-2 py-1 text-xs font-medium">
                                            {activeCodeTab === "code" ? (
                                              FrameworkType === "Vue"
                                                ? ".vue"
                                                : FrameworkType === "React"
                                                  ? Language === "JavaScript"
                                                    ? ".js"
                                                    : ".tsx"
                                                  : FrameworkType === "Angular"
                                                    ? ".ts"
                                                    : FrameworkType
                                            ) : FrameworkType === "Vue" ? ".vue" : ".css"}
                                          </div>
                                        </div>
                                        <Button onClick={handleCopyCode} variant="ghost" size="icon" className="h-8 w-8">
                                          {codeCopied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                                        </Button>
                                      </CodeBlockGroup>
                                      <CodeBlockCode 
                                        code={activeCodeTab === "code" ? codeSnippets.code : codeSnippets.style}
                                        language={
                                          activeCodeTab === "code"
                                            ? FrameworkType === "Vue"
                                              ? "vue"
                                              : FrameworkType === "React"
                                                ? Language === "JavaScript"
                                                  ? "js"
                                                  : "tsx"
                                                : FrameworkType === "Angular"
                                                  ? "ts"
                                                  : FrameworkType.toLowerCase()
                                            : "css"
                                        }
                                        theme="github-light"
                                      />
                                    </CodeBlock>
                                  </div>
                                  
                                  <div className="mt-6 p-4 bg-blue-50 rounded-md">
                                    <h3 className="font-semibold mb-2">Integration Instructions:</h3>
                                    <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
                                      <li>Copy the code snippet above and integrate it into your project</li>
                                      <li>Ensure you have the necessary dependencies installed (Tailwind CSS for styling)</li>
                                      <li>Customize the component according to your specific requirements</li>
                                      <li>Test the implementation across different devices and screen sizes</li>
                                    </ul>
                                  </div>
                                </CardContent>
                              </Card>
                            )}
                            </div>
                              ) : (
                            <div className="mt-6" >
                              {isFetching ? (
                                <div className="flex flex-col items-center justify-center min-h-[200px]">
                                  <Loader2 className="h-8 w-8 animate-spin mb-2 text-primary" />
                                  <p className="text-lg">Generating prompt, please wait...</p>
                                </div>
                              ) : (
                                <Card>
                                  <CardHeader>
                                    <CardTitle>
                                      Your {PlatformType} Prompt
                                    </CardTitle>
                                    <Button 
                                      onClick={handleResetOutput} 
                                      size="sm"
                                      variant="ghost"
                                      className="absolute top-4 right-4 shadow-sm px-2"
                                      > Reset output
                                    </Button>
                                  </CardHeader>
                                  <CardContent>
                                    <div className="w-full max-w-xl mx-auto">
                                      <CodeBlock>
                                        <CodeBlockGroup className="border-border border-b py-2 px-2">
                                          <div className="flex items-center gap-2">
                                            <span className="text-muted-foreground text-sm">prompt.txt</span>
                                          </div>
                                          <Button onClick={handleCopyPrompt} variant="ghost" size="icon" className="h-8 w-8">
                                            {promptCopied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                                          </Button>
                                        </CodeBlockGroup>
                                        <CodeBlockCode 
                                          code={platformPrompts} 
                                          language="text"
                                          theme="github-light"
                                        />
                                      </CodeBlock>
                                    </div>
                                    <div className="space-y-4">
                                      <div className="p-4 bg-green-50 rounded-md">
                                        <h3 className="font-semibold mb-2">How to use this prompt:</h3>
                                        <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
                                          {PlatformType === 'Lovable' && <li><strong>Lovable:</strong> Paste this prompt in the chat to get AI-powered UX improvements</li>}
                                          {PlatformType === 'Cursor' && <li><strong>Cursor:</strong> Use this as a comprehensive instruction for code enhancement in your AI IDE</li>}
                                          {PlatformType === 'Bolt' && <li><strong>Bolt.new:</strong> Copy this prompt to generate improved components with UX enhancements</li>}
                                          {PlatformType === 'Vercel' && <li><strong>v0 by Vercel:</strong> Use this specification to generate accessible and polished React components</li>}
                                          {PlatformType === 'Replit' && <li><strong>Replit:</strong> Apply this checklist-style prompt for systematic UX improvements</li>}
                                          {PlatformType === 'Magic' && <li><strong>Magic Patterns:</strong> Use this JSON specification to generate enhanced UI patterns</li>}
                                          {PlatformType === 'Sitebrew' && <li><strong>sitebrew.ai:</strong> Apply this XML-formatted brief for comprehensive UX enhancements</li>}
                                        </ul>
                                      </div>
                                      
                                      <div className="p-4 bg-yellow-50 rounded-md">
                                        <h3 className="font-semibold mb-2">Expected Results:</h3>
                                        <p className="text-sm text-gray-700">
                                          This prompt will help AI tools understand the specific UX improvements needed 
                                          and generate code that follows evidence-based design principles, improving 
                                          user experience, accessibility, and overall usability of your application.
                                        </p>
                                      </div>
                                    </div>
                                  </CardContent>
                                </Card>
                              )}
                            </div>
                            )}
                          </div>
                        )}

                        </div>
                      )}
{chatbotTab === 'sources' && (
                        <SourcesDisplay
                          references={futureHouseReferences}
                          isLoading={futureHouseLoading}
                          error={futureHouseError}
                        />
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              // Constrained width layout for other tabs
              <div className="max-w-6xl mx-auto">
                <div className="flex flex-col items-center gap-4 text-center mb-8">
                  <h1 className="max-w-2xl text-3xl font-semibold md:text-4xl">
                    Advanced UI/UX Analysis Results
                  </h1>
                  <p className="text-muted-foreground">Get actionable insights and recommendations to improve your website's user experience and conversion rates.</p>
                </div>

                <div className="space-y-8">
                  {/* UI Components Section */}
                  <div className="bg-white rounded-lg shadow-sm p-6">
                  {tab === 'ui' && (
                    <div>
                      {/* Analysis Overview Accordion */}
                      <div className="mb-8">
                        <Accordion type="single" collapsible className="w-full">
                          <AccordionItem value="global-design">
                            <AccordionTrigger className="text-xl font-semibold">
                              Global Design System
                            </AccordionTrigger>
                            <AccordionContent>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div><b>Logo URL:</b> {mappedAnalysis.global_design_summary?.logoUrl || 'N/A'}</div>
                                <div><b>Color Palettes:</b> {mappedAnalysis.global_design_summary?.color_palette || 'N/A'}</div>
                                <div><b>Typography Styles:</b> {mappedAnalysis.global_design_summary?.typographyStyles || 'N/A'}</div>
                                <div><b>Design Tone:</b> {mappedAnalysis.global_design_summary?.designTone || 'N/A'}</div>
                              </div>
                            </AccordionContent>
                          </AccordionItem>
                          <AccordionItem value="ux-architecture">
                            <AccordionTrigger className="text-xl font-semibold">
                              UX Architecture
                            </AccordionTrigger>
                            <AccordionContent>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div><b>Page Flow:</b> {mappedAnalysis.ux_architecture?.page_flow || 'N/A'}</div>
                                <div><b>Business Context:</b> {mappedAnalysis.ux_architecture?.businessContext || 'N/A'}</div>
                                <div><b>Target Audience:</b> {mappedAnalysis.ux_architecture?.targetAudience || 'N/A'}</div>
                                <div><b>User Goals:</b> {mappedAnalysis.ux_architecture?.userGoals || 'N/A'}</div>
                                <div><b>Responsiveness:</b> {mappedAnalysis.ux_architecture?.responsiveness || 'N/A'}</div>
                                <div><b>Accessibility Observations:</b> {mappedAnalysis.ux_architecture?.accessibilityObservations || 'N/A'}</div>
                              </div>
                            </AccordionContent>
                          </AccordionItem>
                          <AccordionItem value="business-audience">
                            <AccordionTrigger className="text-xl font-semibold">
                              Business & Audience
                            </AccordionTrigger>
                            <AccordionContent>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div><b>Company Name:</b> {mappedAnalysis.business_analysis?.companyName || 'N/A'}</div>
                                <div><b>Employee Count:</b> {mappedAnalysis.business_analysis?.employeeCount || 'N/A'}</div>
                                <div><b>Industry:</b> {mappedAnalysis.business_analysis?.industry || 'N/A'}</div>
                                <div><b>Headquarters Location:</b> {mappedAnalysis.business_analysis?.headquartersLocation || 'N/A'}</div>
                                <div><b>Founded Year:</b> {mappedAnalysis.business_analysis?.foundedYear || 'N/A'}</div>
                                <div><b>External Links:</b>
                                  <div><b>LinkedIn:</b> {mappedAnalysis.business_analysis?.externalLinks?.linkedIn || 'N/A'}</div>
                                  <div><b>Facebook:</b> {mappedAnalysis.business_analysis?.externalLinks?.facebook || 'N/A'}</div>
                                  <div><b>Instagram:</b> {mappedAnalysis.business_analysis?.externalLinks?.instagram || 'N/A'}</div>
                                </div>
                              </div>
                            </AccordionContent>
                          </AccordionItem>
                        </Accordion>
                      </div>
                        <Tabs value={uiSubTab} onValueChange={(value) => setUiSubTab(value as SubTab)} className="w-full">
                        <div className="flex justify-center mb-6">
                          <div className="flex items-center gap-3 bg-background/5 backdrop-blur-lg py-1 px-1 rounded-full shadow-lg">
                            {SUBTABS.map((sub) => {
                              const isActive = uiSubTab === sub;
                              return (
                                <button
                                  key={sub}
                                  onClick={() => setUiSubTab(sub as SubTab)}
                                  className={cn(
                                    "relative cursor-pointer text-sm font-semibold px-6 py-2 rounded-full transition-colors",
                                    "text-foreground/80 hover:text-primary",
                                    isActive && "bg-muted text-primary",
                                  )}
                                >
                                  {sub.charAt(0).toUpperCase() + sub.slice(1)}
                                  {isActive && (
                                    <motion.div
                                      layoutId="lamp"
                                      className="absolute inset-0 w-full bg-primary/5 rounded-full -z-10"
                                      initial={false}
                                      transition={{
                                        type: "spring",
                                        stiffness: 300,
                                        damping: 30,
                                      }}
                                    >
                                      <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-8 h-1 bg-primary rounded-t-full">
                                        <div className="absolute w-12 h-6 bg-primary/20 rounded-full blur-md -top-2 -left-2" />
                                        <div className="absolute w-8 h-6 bg-primary/20 rounded-full blur-md -top-1" />
                                        <div className="absolute w-4 h-4 bg-primary/20 rounded-full blur-sm top-0 left-2" />
                                      </div>
                                    </motion.div>
                                  )}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                        <TabsContent value={uiSubTab} className="mt-4">
                        <div className="grid grid-cols-1 gap-8">
                          {mappedAnalysis.sections?.filter((section: any, idx: number) => {
                            const status = componentStatuses[section.name || idx] || 'rejected';
                            if (uiSubTab === 'all') return true;
                            return status === uiSubTab;
                          }).map((section: any, idx: number) => (
                            <SocialCard
                              key={section.name || idx}
                              author={{
                                name: section.name,
                              }}
                              content={{
                                text: `${section.purpose || 'UI Component'}`,
                                // link: {
                                //   title: `${section.elements || 'Component Elements'}`,
                                //   // description: `Fonts: ${section.style?.fonts || 'N/A'} • Colors: ${section.style?.colors || 'N/A'}`,
                                //   // icon: <LayoutDashboard className="w-5 h-5 text-blue-500" />
                                // }
                              }}
                              statusOptions={[...STATUS_OPTIONS]}
                              currentStatus={componentStatuses[section.name || idx] || 'rejected'}
                              onStatusChange={(status) => handleStatusChange(section, status as Status)}
                              // engagement={{
                              //   likes: 0,
                              //   comments: 0,
                              //   shares: 0,
                              //   isLiked: false,
                              //   isBookmarked: false
                              // }}
                              className="mb-4"
                            >
                              <div className="text-sm text-muted-foreground space-y-1">
                                {/* <div><b>CSS properties:</b> {section?.css_properties || 'N/A'}</div> */}

                                <div className="flex gap-2 items-center mt-6">
                                  {STATUS_OPTIONS.map((status) => (
                                    <Button 
                                      key={status}
                                      size="sm"
                                      variant={componentStatuses[section.name || idx] === status ? 'default' : 'outline'}
                                      onClick={() => handleStatusChange(section, status)}
                                    >
                                      {status === 'rejected' ? 'Reject' : 'Improve'}
                                    </Button>
                                  ))}
                                </div>
                              </div>
                            </SocialCard>
                          ))}
                          </div>
                          </TabsContent>
                        </Tabs>
                      </div>
                   )}
                  </div>

                  {/* Design Recommendations Section */}
                  {tab === 'recommendations' && (
                    <div className="bg-white rounded-lg shadow-sm p-6">
                      <div className="text-center py-8">
                        <Target className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                        <h3 className="text-lg font-medium mb-2">Design Recommendations</h3>
                        <p className="text-muted-foreground mb-4">Get AI-powered recommendations for confirmed components</p>
                        <p className="text-sm text-muted-foreground">Confirm components in the UI tab and get recommendations in the AI Analysis tab.</p>
                      </div>
                    </div>
                  )}

                  {/* AI Recommendations Section */}
                  <div className="bg-white rounded-lg shadow-sm p-6">
                  {tab === 'ai' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      {mappedAnalysis.sections?.filter((section: any, idx: number) => componentStatuses[section.name || idx] === 'improved').length === 0 && (
                        <div className="text-muted-foreground">No improved components. Improve a component in the UI Components tab.</div>
                      )}
                      {mappedAnalysis.sections?.filter((section: any, idx: number) => componentStatuses[section.name || idx] === 'improved').map((section: any, idx: number) => (
                        <SocialCard
                          key={section.name || idx}
                          author={{
                            name: section.name,
                            username: "confirmed_component", 
                            avatar: section.cropped_image_url || "https://via.placeholder.com/40",
                            timeAgo: "confirmed"
                          }}
                          content={{
                            text: `${section.purpose || 'Confirmed UI Component'}`,
                            link: {
                              title: `${section.elements || 'Component Elements'}`,
                              description: `Fonts: ${section.style?.fonts || 'N/A'} • Colors: ${section.style?.colors || 'N/A'}`,
                              icon: <LayoutDashboard className="w-5 h-5 text-green-500" />
                            }
                          }}
                          engagement={{
                            likes: 0,
                            comments: 0,
                            shares: 0,
                            isLiked: false,
                            isBookmarked: true
                          }}
                          className="mb-4"
                        >
                          <div className="mt-4 space-y-2">
                            <Button 
                              size="sm"
                              className="mb-3"
                              onClick={() => handleGetRecommendation(section)}
                              disabled={recommending}
                            >
                              {recommending && selectedSection?.name === section.name ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Sparkles className="h-4 w-4 mr-2" />}
                              Get Recommendations
                            </Button>
                            <div className="text-sm text-muted-foreground space-y-1">
                                <div><b>Layouts:</b> {section.style?.layout}</div>
                                <div><b>Interactions:</b> {section.style?.interactions}</div>
                                <div><b>Mobile:</b> {section.mobile_behavior}</div>
                                <div><b>CSS properties:</b> {section?.css_properties || 'N/A'}</div>
                            </div>
                          </div>
                        </SocialCard>
                      ))}
                     </div>
                   )}
                  </div>

                  {/* Screenshot Section */}
                  <div className="bg-white rounded-lg shadow-sm p-6">
                  {tab === 'screenshot' && (
                    <div>
                      {screenshotUrl && (
                        <div className="mb-8 text-center">
                          <div className="mb-2 text-sm text-muted-foreground">Live Screenshot Taken</div>
                          <img src={screenshotUrl} alt="Website Screenshot" className="mx-auto rounded shadow max-w-full max-h-[400px]" />
                        </div>
                      )}
                     </div>
                   )}
                  </div>
                </div>

                {showRecLog && (
                  <div className="w-full max-w-xl bg-muted/40 rounded-lg p-4 my-8 mx-auto">
                    <h2 className="font-semibold mb-2 flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-primary" /> Recommendation Progress Log
                    </h2>
                    <div className="font-mono text-sm space-y-1">
                      {recProgressLog.map((msg, i) => (
                        <div key={i}>{msg}</div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </SidebarInset>
      </div>
      
      {/* Loading Screen Overlay */}
      {showLoadingScreen && (
        <AnimatedLoadingSkeleton onClose={handleCloseLoadingScreen} />
      )}
      
      {/* Reasoning-Pro Loading Screen */}
      {waitingForWebhook && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
            <div className="text-center mb-6">
              <h2 className="text-xl font-semibold mb-2">Reasoning-Pro Analysis</h2>
              <p className="text-gray-600 animate-pulse">{loadingText}</p>
            </div>
            <AnimatedLoadingSkeleton />
          </div>
        </div>
      )}
    </SidebarProvider>
  )
}

export default FeatureReview;