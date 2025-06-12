import { useState, useRef, useMemo, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Upload, Camera, MessageSquare, CheckCircle, AlertTriangle, XCircle, Plus, Globe, X, Lightbulb, Monitor, Tablet, Smartphone } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import highlightScript from "@/utils/highlightScript";

interface Feature {
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
}

const FeatureReview = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const analyzedUrl = location.state?.url || '';
  const extractedFeatures = location.state?.features || [];
  const [showPreview, setShowPreview] = useState(true);
  const [selectedSection, setSelectedSection] = useState<string | null>(null);
  const [selectedElement, setSelectedElement] = useState<string | null>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  
  // Group features by section
  const sections = useMemo(() => {
    const sectionMap = new Map<string, Feature[]>();
    extractedFeatures.forEach(feature => {
      const section = feature.title.split(' - ')[0]; // Assuming format: "Section - Element"
      if (!sectionMap.has(section)) {
        sectionMap.set(section, []);
      }
      sectionMap.get(section)?.push(feature);
    });
    return Array.from(sectionMap.entries());
  }, [extractedFeatures]);

  const highlightElement = (elementId: string) => {
    const iframe = iframeRef.current;
    if (!iframe || !iframe.contentWindow) return;

    // Send message to iframe to highlight element
    iframe.contentWindow.postMessage({
      type: 'HIGHLIGHT_ELEMENT',
      elementId
    }, '*');
  };

  const clearHighlight = () => {
    const iframe = iframeRef.current;
    if (!iframe || !iframe.contentWindow) return;

    iframe.contentWindow.postMessage({
      type: 'CLEAR_HIGHLIGHT'
    }, '*');
  };

  // Use extracted features if available, otherwise use default ones
  const initialFeatures = extractedFeatures.length > 0 ? extractedFeatures : [
    {
      id: '1',
      title: 'Hero Section CTA',
      description: 'Main call-to-action button with orange styling. Consider improving contrast for accessibility.',
      category: 'interactive',
      severity: 'medium',
      status: 'pending',
      aiConfidence: 0.89
    },
    {
      id: '2',
      title: 'URL Input Field',
      description: 'Large input field for URL entry. Good placeholder text and styling.',
      category: 'forms',
      severity: 'low',
      status: 'pending',
      aiConfidence: 0.95
    },
    {
      id: '3',
      title: 'Feature Tags',
      description: 'Colorful category tags below input. Good visual hierarchy but could benefit from better spacing.',
      category: 'visual',
      severity: 'low',
      status: 'pending',
      aiConfidence: 0.78
    },
    {
      id: '4',
      title: 'Attach Button',
      description: 'Secondary action button with paperclip icon. Functionality unclear to users.',
      category: 'interactive',
      severity: 'high',
      status: 'pending',
      aiConfidence: 0.82
    }
  ];
  
  const [features, setFeatures] = useState<Feature[]>(initialFeatures);

  const [selectedFeature, setSelectedFeature] = useState<Feature | null>(null);
  const [userNotes, setUserNotes] = useState('');
  const [isAddFeatureOpen, setIsAddFeatureOpen] = useState(false);
  const [newFeature, setNewFeature] = useState({
    title: '',
    description: '',
    category: 'interactive' as Feature['category'],
    severity: 'medium' as Feature['severity'],
    screenshot: null as File | null
  });

  const getSeverityColor = (severity: Feature['severity']) => {
    switch (severity) {
      case 'high': return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'medium': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'low': return 'bg-green-500/20 text-green-400 border-green-500/30';
    }
  };

  const getStatusIcon = (status: Feature['status']) => {
    switch (status) {
      case 'approved': return <CheckCircle className="h-4 w-4 text-green-400" />;
      case 'rejected': return <XCircle className="h-4 w-4 text-red-400" />;
      case 'reviewed': return <MessageSquare className="h-4 w-4 text-blue-400" />;
      default: return <AlertTriangle className="h-4 w-4 text-yellow-400" />;
    }
  };

  const updateFeatureStatus = (featureId: string, status: Feature['status'], notes?: string) => {
    setFeatures(prev => prev.map(feature => 
      feature.id === featureId 
        ? { ...feature, status, userNotes: notes || feature.userNotes }
        : feature
    ));
    
    toast({
      title: "Feature updated",
      description: `Feature status changed to ${status}`,
    });
  };

  const handleScreenshotUpload = (featureId: string) => {
    // Simulate file upload
    toast({
      title: "Screenshot uploaded",
      description: "Screenshot has been attached to the feature",
    });
  };

  const handleAddFeature = () => {
    if (!newFeature.title.trim() || !newFeature.description.trim()) {
      toast({
        title: "Error",
        description: "Please fill in both title and description",
        variant: "destructive"
      });
      return;
    }

    const feature: Feature = {
      id: Date.now().toString(),
      title: newFeature.title,
      description: newFeature.description,
      category: newFeature.category,
      severity: newFeature.severity,
      status: 'pending',
      aiConfidence: 1.0, // Manual features have 100% confidence
      isManual: true,
      screenshot: newFeature.screenshot ? URL.createObjectURL(newFeature.screenshot) : undefined
    };

    setFeatures(prev => [feature, ...prev]);
    setIsAddFeatureOpen(false);
    setNewFeature({
      title: '',
      description: '',
      category: 'interactive',
      severity: 'medium',
      screenshot: null
    });

    toast({
      title: "Feature added",
      description: "Manual feature has been added successfully",
    });
  };

  const handleGetRecommendations = (feature: Feature) => {
    toast({
      title: "Generating Recommendations",
      description: `Analyzing "${feature.title}" for improvement suggestions...`,
    });
    
    // Navigate to recommendations page with feature data
    navigate('/recommendations', { state: { feature } });
  };

  const filteredFeatures = (status?: Feature['status']) => {
    return status ? features.filter(f => f.status === status) : features;
  };

  const getPreviewWidth = () => {
    switch (previewDevice) {
      case 'desktop':
        return '100%';
      case 'tablet':
        return '768px';
      case 'mobile':
        return '375px';
    }
  };

  // Inject highlight script into iframe
  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    const handleIframeLoad = () => {
      try {
        const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
        if (!iframeDoc) return;

        // Create and inject the script
        const script = iframeDoc.createElement('script');
        script.textContent = highlightScript;
        iframeDoc.head.appendChild(script);
      } catch (error) {
        console.error('Error injecting highlight script:', error);
      }
    };

    iframe.addEventListener('load', handleIframeLoad);
    return () => iframe.removeEventListener('load', handleIframeLoad);
  }, []);

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">Feature Review</h1>
              <p className="text-muted-foreground">
                Review AI-detected UI features and provide feedback
                {extractedFeatures.length === 0 && (
                  <span className="text-yellow-500 text-sm block mt-1">
                    (Using demo data - analyze a real URL for actual results)
                  </span>
                )}
              </p>
            </div>
            <div className="flex gap-2">
              {analyzedUrl && !showPreview && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowPreview(true)}
                >
                  <Globe className="h-4 w-4 mr-2" />
                  Show Preview
                </Button>
              )}
              <Dialog open={isAddFeatureOpen} onOpenChange={setIsAddFeatureOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-orange-600 hover:bg-orange-700">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Feature Manually
                  </Button>
                </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Add Feature Manually</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Feature Title</Label>
                    <Input
                      id="title"
                      placeholder="Enter feature title..."
                      value={newFeature.title}
                      onChange={(e) => setNewFeature(prev => ({ ...prev, title: e.target.value }))}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      placeholder="Describe the feature..."
                      value={newFeature.description}
                      onChange={(e) => setNewFeature(prev => ({ ...prev, description: e.target.value }))}
                      className="min-h-[100px]"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="category">Category</Label>
                      <select
                        id="category"
                        className="w-full px-3 py-2 border rounded-md bg-background"
                        value={newFeature.category}
                        onChange={(e) => setNewFeature(prev => ({ ...prev, category: e.target.value as Feature['category'] }))}
                      >
                        <option value="interactive">Interactive</option>
                        <option value="navigation">Navigation</option>
                        <option value="forms">Forms</option>
                        <option value="content">Content</option>
                        <option value="visual">Visual</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="severity">Severity</Label>
                      <select
                        id="severity"
                        className="w-full px-3 py-2 border rounded-md bg-background"
                        value={newFeature.severity}
                        onChange={(e) => setNewFeature(prev => ({ ...prev, severity: e.target.value as Feature['severity'] }))}
                      >
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="screenshot">Screenshot (Optional)</Label>
                    <Input
                      id="screenshot"
                      type="file"
                      accept="image/*"
                      onChange={(e) => setNewFeature(prev => ({ 
                        ...prev, 
                        screenshot: e.target.files?.[0] || null 
                      }))}
                    />
                  </div>

                  <div className="flex gap-2 pt-4">
                    <Button onClick={handleAddFeature} className="flex-1">
                      Add Feature
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => setIsAddFeatureOpen(false)}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Browser Preview */}
          {analyzedUrl && showPreview && (
            <div className="xl:sticky xl:top-6 h-fit">
              <Card className="overflow-hidden">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Globe className="h-4 w-4 text-muted-foreground" />
                      <CardTitle className="text-sm font-medium">Preview</CardTitle>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
                        <Button
                          variant={previewDevice === 'desktop' ? 'secondary' : 'ghost'}
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => setPreviewDevice('desktop')}
                        >
                          <Monitor className="h-4 w-4" />
                        </Button>
                        <Button
                          variant={previewDevice === 'tablet' ? 'secondary' : 'ghost'}
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => setPreviewDevice('tablet')}
                        >
                          <Tablet className="h-4 w-4" />
                        </Button>
                        <Button
                          variant={previewDevice === 'mobile' ? 'secondary' : 'ghost'}
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => setPreviewDevice('mobile')}
                        >
                          <Smartphone className="h-4 w-4" />
                        </Button>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => setShowPreview(false)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{analyzedUrl}</p>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="relative bg-muted">
                    <div className="flex justify-center">
                      <div 
                        className="transition-all duration-300 ease-in-out"
                        style={{ 
                          width: getPreviewWidth(),
                          maxWidth: '100%'
                        }}
                      >
                        <iframe
                          ref={iframeRef}
                          src={analyzedUrl.startsWith('http') ? analyzedUrl : `https://${analyzedUrl}`}
                          className="w-full h-[600px] border-0"
                          title="Website Preview"
                          sandbox="allow-scripts allow-same-origin"
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* UI Elements Panel */}
          <div className="space-y-6">
            <Tabs defaultValue="all" className="space-y-6">
              <TabsList>
                <TabsTrigger value="all">All Sections</TabsTrigger>
                <TabsTrigger value="pending">Pending</TabsTrigger>
                <TabsTrigger value="reviewed">Reviewed</TabsTrigger>
                <TabsTrigger value="approved">Approved</TabsTrigger>
              </TabsList>

              <TabsContent value="all" className="space-y-6">
                {sections.map(([sectionName, features]) => (
                  <Card 
                    key={sectionName}
                    className={`transition-all ${
                      selectedSection === sectionName ? 'ring-2 ring-orange-500' : ''
                    }`}
                  >
                    <CardHeader>
                      <CardTitle 
                        className="text-lg cursor-pointer"
                        onClick={() => setSelectedSection(sectionName)}
                      >
                        {sectionName}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {features.map((feature) => (
                          <div
                            key={feature.id}
                            className={`p-3 rounded-lg border cursor-pointer transition-all hover:bg-muted ${
                              selectedElement === feature.id ? 'ring-2 ring-orange-500' : ''
                            }`}
                            onMouseEnter={() => {
                              setSelectedElement(feature.id);
                              highlightElement(feature.id);
                            }}
                            onMouseLeave={() => {
                              setSelectedElement(null);
                              clearHighlight();
                            }}
                            onClick={() => setSelectedFeature(feature)}
                          >
                            <div className="flex items-start justify-between">
                              <div>
                                <h4 className="font-medium">{feature.title}</h4>
                                <p className="text-sm text-muted-foreground mt-1">
                                  {feature.description}
                                </p>
                              </div>
                              <Badge variant="outline" className={getSeverityColor(feature.severity)}>
                                {feature.severity}
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </TabsContent>

              <TabsContent value="pending">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredFeatures('pending').map((feature) => (
                    <Card key={feature.id}>
                      <CardHeader>
                        <CardTitle className="text-lg">{feature.title}</CardTitle>
                        <Badge variant="outline" className={getSeverityColor(feature.severity)}>
                          {feature.severity}
                        </Badge>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground">{feature.description}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="reviewed">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredFeatures('reviewed').map((feature) => (
                    <Card key={feature.id}>
                      <CardHeader>
                        <CardTitle className="text-lg">{feature.title}</CardTitle>
                        <Badge variant="outline" className={getSeverityColor(feature.severity)}>
                          {feature.severity}
                        </Badge>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground">{feature.description}</p>
                        {feature.userNotes && (
                          <div className="mt-3 p-2 bg-muted rounded text-sm">
                            <strong>Notes:</strong> {feature.userNotes}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="approved">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredFeatures('approved').map((feature) => (
                    <Card key={feature.id}>
                      <CardHeader>
                        <CardTitle className="text-lg">{feature.title}</CardTitle>
                        <Badge variant="outline" className={getSeverityColor(feature.severity)}>
                          {feature.severity}
                        </Badge>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <p className="text-sm text-muted-foreground">{feature.description}</p>
                        <Button 
                          onClick={() => handleGetRecommendations(feature)}
                          className="w-full bg-orange-600 hover:bg-orange-700"
                          size="sm"
                        >
                          <Lightbulb className="h-4 w-4 mr-2" />
                          Get Recommendations
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FeatureReview;
