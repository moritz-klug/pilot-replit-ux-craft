import React, { useEffect, useState, useRef, useContext } from 'react';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Loader2, Sparkles, LayoutDashboard, Camera } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { analyzeWithScreenshot, getRecommendations } from '../services/futureHouseService';
import { UITestModeContext } from '../App';
import { motion } from 'framer-motion';
import { Dialog, DialogContent } from '../components/ui/dialog';
import { SidebarProvider, SidebarInset, SidebarTrigger } from '../components/ui/sidebar';
import { AppSidebar } from '../components/AppSidebar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@radix-ui/react-tabs';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../components/ui/accordion';
import { cn } from '../lib/utils';

const DEMO_MODE = false;
const SCREENSHOT_API_BASE = 'http://localhost:8001';
const MAIN_API_BASE = 'http://localhost:8000';

const STATUS_OPTIONS = ['pending', 'confirmed', 'rejected'] as const;
type Status = typeof STATUS_OPTIONS[number];

const SUBTABS = ['all', 'pending', 'confirmed', 'rejected'] as const;
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
            initialStatuses[section.name || idx] = 'pending';
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
          initialStatuses[section.name || idx] = 'pending';
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
    setComponentStatuses(prev => ({ ...prev, [section.name || section.id]: status }));
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
        <AppSidebar activeTab={tab} onTabChange={setTab} />
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
                {/* Analysis Overview Accordion */}
                <div className="bg-white rounded-lg border shadow-sm p-6">
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

                {/* UI Components Section */}
                <div className="bg-white rounded-lg border shadow-sm p-6">
                {tab === 'ui' && (
                  <div>
                    <Tabs value={uiSubTab} onValueChange={(value) => setUiSubTab(value as SubTab)} className="w-full">
                      <div className="flex justify-center mb-6">
                        <div className="flex items-center gap-3 bg-background/5 border border-border backdrop-blur-lg py-1 px-1 rounded-full shadow-lg">
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
                          const status = componentStatuses[section.name || idx] || 'pending';
                          if (uiSubTab === 'all') return true;
                          return status === uiSubTab;
                        }).map((section: any, idx: number) => (
                          <Card key={section.name || idx}>
                            <CardContent className="p-6">
                              <div className="flex items-center mb-2">
                                <img src={section.cropped_image_url} alt={section.name} className="w-20 h-20 object-cover rounded mr-4 border" />
                                <div>
                                  <h3 className="text-lg font-semibold">{section.name}</h3>
                                  <div className="mt-2 flex gap-2 items-center">
                                    {STATUS_OPTIONS.map((status) => (
                                      <Button 
                                        key={status}
                                        size="sm"
                                        variant={componentStatuses[section.name || idx] === status ? 'default' : 'outline'}
                                        onClick={() => handleStatusChange(section, status)}
                                      >
                                        {status.charAt(0).toUpperCase() + status.slice(1)}
                                      </Button>
                                    ))}
                                  </div>
                                </div>
                              </div>
                              <div className="mb-1"><b>Elements:</b> {section.elements}</div>
                              <div className="mb-1"><b>Purpose:</b> {section.purpose}</div>
                              <div className="mb-1"><b>Fonts:</b> {section.style?.fonts}</div>
                              <div className="mb-1"><b>Colors:</b> {section.style?.colors}</div>
                              <div className="mb-1"><b>Layouts:</b> {section.style?.layouts}</div>
                              <div className="mb-1"><b>Interactions:</b> {section.style?.interactions}</div>
                              <div className="mb-1"><b>Mobile:</b> {section.mobile}</div>
                            </CardContent>
                          </Card>
                          ))}
                        </div>
                        </TabsContent>
                      </Tabs>
                    </div>
                 )}
                </div>

                {/* AI Recommendations Section */}
                <div className="bg-white rounded-lg border shadow-sm p-6">
                {tab === 'ai' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {analysis.sections?.filter((section: any, idx: number) => componentStatuses[section.name || idx] === 'confirmed').length === 0 && (
                      <div className="text-muted-foreground">No confirmed components. Confirm a component in the UI Components tab.</div>
                    )}
                    {analysis.sections?.filter((section: any, idx: number) => componentStatuses[section.name || idx] === 'confirmed').map((section: any, idx: number) => (
                      <Card key={section.name || idx}>
                        <CardContent className="p-6">
                          <div className="flex items-center mb-2">
                            <img src={section.cropped_image_url} alt={section.name} className="w-20 h-20 object-cover rounded mr-4 border" />
                            <div>
                              <h3 className="text-lg font-semibold">{section.name}</h3>
                              <Button 
                                size="sm"
                                className="mt-2"
                                onClick={() => handleGetRecommendation(section)}
                                disabled={recommending}
                              >
                                {recommending && selectedSection?.name === section.name ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Sparkles className="h-4 w-4 mr-2" />}
                                Get Recommendations
                              </Button>
                            </div>
                          </div>
                          <div className="mb-1"><b>Elements:</b> {section.elements}</div>
                          <div className="mb-1"><b>Purpose:</b> {section.purpose}</div>
                          <div className="mb-1"><b>Fonts:</b> {section.style?.fonts}</div>
                          <div className="mb-1"><b>Colors:</b> {section.style?.colors}</div>
                          <div className="mb-1"><b>Layouts:</b> {section.style?.layouts}</div>
                          <div className="mb-1"><b>Interactions:</b> {section.style?.interactions}</div>
                          <div className="mb-1"><b>Mobile:</b> {section.mobile}</div>
                        </CardContent>
                      </Card>
                    ))}
                   </div>
                 )}
                </div>

                {/* Screenshot Section */}
                <div className="bg-white rounded-lg border shadow-sm p-6">
                {tab === 'screenshot' && (
                  <div>
                    {screenshotUrl && (
                      <div className="mb-8 text-center">
                        <div className="mb-2 text-sm text-muted-foreground">Live Screenshot Taken</div>
                        <img src={screenshotUrl} alt="Website Screenshot" className="mx-auto rounded shadow max-w-full max-h-[400px] border" />
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
    </SidebarProvider>
  )
}

export default FeatureReview;