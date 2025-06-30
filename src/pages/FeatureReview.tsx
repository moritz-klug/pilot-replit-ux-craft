import React, { useEffect, useState, useRef } from 'react';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Loader2, Sparkles } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui/tabs';

const DEMO_MODE = false;
const SCREENSHOT_API_BASE = 'http://localhost:8001';
const MAIN_API_BASE = 'http://localhost:8000';

const STATUS_OPTIONS = ['pending', 'confirmed', 'rejected'] as const;
type Status = typeof STATUS_OPTIONS[number];

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
    try {
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
    <div className="max-w-5xl mx-auto py-10 px-4">
      <h1 className="text-3xl font-bold mb-6">UI/UX Analysis Results</h1>
      <Tabs value={tab} onValueChange={setTab} className="mb-8">
        <TabsList>
          <TabsTrigger value="ui">UI Components</TabsTrigger>
          <TabsTrigger value="ai">AI Analysis</TabsTrigger>
          <TabsTrigger value="screenshot">Screenshot</TabsTrigger>
        </TabsList>
        <TabsContent value="ui">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {analysis.sections?.map((section: any, idx: number) => (
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
        <TabsContent value="ai">
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
        </TabsContent>
        <TabsContent value="screenshot">
          {screenshotUrl && (
            <div className="mb-8 text-center">
              <div className="mb-2 text-sm text-muted-foreground">Live Screenshot Taken</div>
              <img src={screenshotUrl} alt="Website Screenshot" className="mx-auto rounded shadow max-w-full max-h-[400px] border" />
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default FeatureReview;