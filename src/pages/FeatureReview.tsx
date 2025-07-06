import React, { useEffect, useState, useRef, useContext } from 'react';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Loader2, Sparkles, LayoutDashboard, Camera, Target, ArrowUp } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { analyzeWithScreenshot, getRecommendations } from '../services/futureHouseService';
import { UITestModeContext } from '../App';
import { motion } from 'framer-motion';
import { Dialog, DialogContent } from '../components/ui/dialog';
import { SidebarProvider, SidebarInset, SidebarTrigger } from '../components/ui/sidebar';
import { AppSidebar } from '../components/AppSidebar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@radix-ui/react-tabs';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../components/ui/accordion';
import { SocialCard } from '../components/ui/social-card';
import { cn } from '../lib/utils';
import AnimatedLoadingSkeleton from '../components/ui/animated-loading-skeleton';
import { PromptSuggestion } from '../components/ui/prompt-suggestion';
import { PromptInput, PromptInputTextarea, PromptInputActions } from '../components/ui/prompt-input';

const DEMO_MODE = false;
const SCREENSHOT_API_BASE = 'http://localhost:8001';
const MAIN_API_BASE = 'http://localhost:8000';

const STATUS_OPTIONS = ['rejected', 'improved'] as const;
type Status = typeof STATUS_OPTIONS[number];

const SUBTABS = ['all', 'rejected', 'improved'] as const;
type SubTab = typeof SUBTABS[number];

const FeatureReview: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const url = location.state?.url || 'https://www.apple.com';

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
  const [uiSubTab, setUiSubTab] = useState<SubTab>('all');
  const [recProgressLog, setRecProgressLog] = useState<string[]>([]);
  const [showRecLog, setShowRecLog] = useState(false);
  const [showLoadingScreen, setShowLoadingScreen] = useState(false);
  const [activeChatbots, setActiveChatbots] = useState<Record<string, boolean>>({});
  const [currentChatFeature, setCurrentChatFeature] = useState<string | null>(null);

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

    if (uiTest) {
      // In UI Test Mode, only mimic analysis, do not call backend
      analyzeWithScreenshot(url, uiTest).then((mockAnalysis) => {
        setAnalysis(mockAnalysis);
        setLoading(false);
        setScreenshotUrl(null); // Optionally set a mock screenshot URL if desired
        if (mockAnalysis.sections) {
          const initialStatuses: Record<string, Status> = {};
          mockAnalysis.sections.forEach((section: any, idx: number) => {
            initialStatuses[section.name || idx] = 'rejected';
          });
          setComponentStatuses(initialStatuses);
        }
      });
      return;
    }

    const es = new EventSource(`${MAIN_API_BASE}/analyze-ui?url=${encodeURIComponent(url)}`, {
      withCredentials: false
    });
    eventSourceRef.current = es;

    es.onopen = () => {
      setProgressLog([]);
    };
    es.addEventListener('progress', (event: MessageEvent) => {
      const data = JSON.parse(event.data);
      setProgressLog(prev => [...prev, data.message]);
    });
    es.addEventListener('error', (event: MessageEvent) => {
      const data = event.data ? JSON.parse(event.data) : { error: 'Unknown error' };
      setError(data.error);
      setProgressLog(prev => [...prev, `❌ Error: ${data.error}`]);
      setLoading(false);
      es.close();
    });
    es.addEventListener('result', (event: MessageEvent) => {
      const data = JSON.parse(event.data);
      setAnalysis(data);
      setLoading(false);
      if (data.screenshot_id) {
        setScreenshotUrl(`${SCREENSHOT_API_BASE}/screenshot/${data.screenshot_id}`);
      } else if (data.screenshot_url) {
        setScreenshotUrl(data.screenshot_url);
      } else {
        setScreenshotUrl(null);
      }
      // Initialize statuses
      if (data.sections) {
        const initialStatuses: Record<string, Status> = {};
        data.sections.forEach((section: any, idx: number) => {
          initialStatuses[section.name || idx] = 'rejected';
        });
        setComponentStatuses(initialStatuses);
      }
      es.close();
    });
    es.onerror = () => {
      setError('Connection lost or server error.');
      setLoading(false);
      es.close();
    };
    return () => {
      es.close();
    };
    // eslint-disable-next-line
  }, [url]);

  const handleStatusChange = (section: any, status: Status) => {
    if (status === 'improved') {
      setShowLoadingScreen(true);
      // Simulate loading time then update status and show chatbot
      setTimeout(() => {
        setComponentStatuses(prev => ({ ...prev, [section.name || section.id]: status }));
        setShowLoadingScreen(false);
        // Directly set the tab to show the chatbot interface
        setTab('chatbot');
        const featureName = section.name || `Feature ${section.id || 'Unknown'}`;
        setCurrentChatFeature(featureName);
        setActiveChatbots(prev => ({ ...prev, [featureName]: true }));
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

  if (loading) {
  return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="h-10 w-10 animate-spin mb-4 text-primary" />
        <p className="text-lg mb-4">Analyzing UI and UX...</p>
        <div className="w-full max-w-xl bg-muted/40 rounded-lg p-4">
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
                    </div>
    );
  }

  if (!analysis) {
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
                              <div><b>Typography:</b> {analysis.global?.typography}</div>
                              <div><b>Color Palette:</b> {analysis.global?.color_palette}</div>
                              <div><b>Button Styles:</b> {analysis.global?.button_styles}</div>
                              <div><b>Spacing & Layout:</b> {analysis.global?.spacing_layout}</div>
                              <div><b>Iconography:</b> {analysis.global?.iconography}</div>
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                        <AccordionItem value="ux-architecture">
                          <AccordionTrigger className="text-xl font-semibold">
                            UX Architecture
                          </AccordionTrigger>
                          <AccordionContent>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div><b>Page Flow:</b> {analysis.ux?.page_flow}</div>
                              <div><b>Emotional Strategy:</b> {analysis.ux?.emotional_strategy}</div>
                              <div><b>Conversion Points:</b> {analysis.ux?.conversion_points}</div>
                              <div><b>Design Trends:</b> {analysis.ux?.design_trends}</div>
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                        <AccordionItem value="business-audience">
                          <AccordionTrigger className="text-xl font-semibold">
                            Business & Audience
                          </AccordionTrigger>
                          <AccordionContent>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div><b>Summary:</b> {analysis.business?.summary}</div>
                              <div><b>Business Type:</b> {analysis.business?.business_type}</div>
                              <div><b>Target Audience:</b> {analysis.business?.target_audience}</div>
                              <div><b>Keywords:</b> {Array.isArray(analysis.business?.keywords) ? analysis.business.keywords.join(', ') : analysis.business?.keywords}</div>
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
                        {analysis.sections?.filter((section: any, idx: number) => {
                          const status = componentStatuses[section.name || idx] || 'rejected';
                          if (uiSubTab === 'all') return true;
                          return status === uiSubTab;
                        }).map((section: any, idx: number) => (
                          <SocialCard
                            key={section.name || idx}
                            author={{
                              name: section.name,
                              username: "", 
                              avatar: section.cropped_image_url || "https://via.placeholder.com/40",
                              timeAgo: ""
                            }}
                            content={{
                              text: `${section.purpose || 'UI Component'}`,
                              link: {
                                title: `${section.elements || 'Component Elements'}`,
                                description: `Fonts: ${section.style?.fonts || 'N/A'} • Colors: ${section.style?.colors || 'N/A'}`,
                                icon: <LayoutDashboard className="w-5 h-5 text-blue-500" />
                              }
                            }}
                            statusOptions={[...STATUS_OPTIONS]}
                            currentStatus={componentStatuses[section.name || idx] || 'rejected'}
                            onStatusChange={(status) => handleStatusChange(section, status as Status)}
                            engagement={{
                              likes: 0,
                              comments: 0,
                              shares: 0,
                              isLiked: false,
                              isBookmarked: false
                            }}
                            className="mb-4"
                          >
                            <div className="text-sm text-muted-foreground space-y-1">
                              <div><b>Layouts:</b> {section.style?.layouts}</div>
                              <div><b>Interactions:</b> {section.style?.interactions}</div>
                              <div><b>Mobile:</b> {section.mobile}</div>
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
                    {analysis.sections?.filter((section: any, idx: number) => componentStatuses[section.name || idx] === 'improved').length === 0 && (
                      <div className="text-muted-foreground">No improved components. Improve a component in the UI Components tab.</div>
                    )}
                    {analysis.sections?.filter((section: any, idx: number) => componentStatuses[section.name || idx] === 'improved').map((section: any, idx: number) => (
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
                            <div><b>Layouts:</b> {section.style?.layouts}</div>
                            <div><b>Interactions:</b> {section.style?.interactions}</div>
                            <div><b>Mobile:</b> {section.mobile}</div>
                          </div>
                        </div>
                      </SocialCard>
                    ))}
                   </div>
                 )}
                </div>

                {/* Chatbot Tab Content */}
                {tab === 'chatbot' && currentChatFeature && (
                  <div className="bg-white rounded-lg shadow-sm p-6 h-[600px]">
                    <div className="h-full flex flex-col">
                      <div className="flex items-center justify-between mb-4">
                        <h2 className="text-2xl font-semibold">{currentChatFeature} Assistant</h2>
                        <Button variant="outline" onClick={() => setTab('ui')}>
                          Back to Components
                        </Button>
                      </div>
                      
                      <div className="flex-1 flex flex-col space-y-4 overflow-hidden">
                        {/* Messages Area */}
                        <div className="flex-1 overflow-y-auto space-y-4 p-4 bg-muted/20 rounded-lg">
                          <div className="text-center text-muted-foreground py-8">
                            <h3 className="font-medium mb-2">Hi! I'm your {currentChatFeature} assistant</h3>
                            <p className="text-sm">Ask me anything about improving this component or click a suggestion below.</p>
                          </div>
                        </div>

                        {/* Functional Chat Interface */}
                        <div className="flex-1 flex flex-col space-y-4 overflow-hidden">
                          {/* Messages Area */}
                          <div className="flex-1 overflow-y-auto space-y-4 p-4 bg-muted/20 rounded-lg">
                            <div className="text-center text-muted-foreground py-8">
                              <h3 className="font-medium mb-2">Hi! I'm your {currentChatFeature} assistant</h3>
                              <p className="text-sm">Ask me anything about improving this component or click a suggestion below.</p>
                            </div>
                          </div>

                          {/* Quick Suggestions */}
                          <div className="space-y-2">
                            <p className="text-sm font-medium">Quick suggestions:</p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                              <PromptSuggestion size="sm" className="text-left justify-start h-auto py-2 px-3">
                                How can I improve the {currentChatFeature}?
                              </PromptSuggestion>
                              <PromptSuggestion size="sm" className="text-left justify-start h-auto py-2 px-3">
                                What are best practices for {currentChatFeature} design?
                              </PromptSuggestion>
                              <PromptSuggestion size="sm" className="text-left justify-start h-auto py-2 px-3">
                                Show me examples of great {currentChatFeature} components
                              </PromptSuggestion>
                              <PromptSuggestion size="sm" className="text-left justify-start h-auto py-2 px-3">
                                What accessibility features should I add?
                              </PromptSuggestion>
                            </div>
                          </div>

                          {/* Input Area */}
                          <PromptInput className="border-input bg-background border shadow-xs">
                            <PromptInputTextarea placeholder={`Ask about ${currentChatFeature} improvements...`} />
                            <PromptInputActions className="justify-end">
                              <Button size="sm" className="size-9 cursor-pointer rounded-full" aria-label="Send">
                                <ArrowUp className="h-4 w-4" />
                              </Button>
                            </PromptInputActions>
                          </PromptInput>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

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
          </div>
        </SidebarInset>
      </div>
      
      {/* Loading Screen Overlay */}
      {showLoadingScreen && (
        <AnimatedLoadingSkeleton onClose={handleCloseLoadingScreen} />
      )}
    </SidebarProvider>
  )
}

export default FeatureReview;