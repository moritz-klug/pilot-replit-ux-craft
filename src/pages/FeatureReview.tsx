import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Upload, Camera, MessageSquare, CheckCircle, AlertTriangle, XCircle, Plus, Globe, X, Lightbulb, Download, Eye, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import StreamingAnalysis from "@/components/StreamingAnalysis";

interface UiComponent {
  name: string;
  description: string;
  style_info: string;
}

const FeatureReview = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Updated data from the new analysis stream
  const analyzedUrl = location.state?.url || '';
  const analysisReport = location.state?.analysis?.report || {};
  const screenshotId = location.state?.screenshotId || null;

  const [features, setFeatures] = useState<UiComponent[]>(analysisReport.components || []);
  const [showPreview, setShowPreview] = useState(true);

  const [isAddFeatureOpen, setIsAddFeatureOpen] = useState(false);
  const [newFeature, setNewFeature] = useState({
    name: '',
    description: '',
    style_info: ''
  });

  const handleAddFeature = () => {
    if (!newFeature.name.trim() || !newFeature.description.trim()) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive"
      });
      return;
    }

    const feature: UiComponent = { ...newFeature };
    setFeatures(prev => [feature, ...prev]);
    setIsAddFeatureOpen(false);
    setNewFeature({ name: '', description: '', style_info: '' });

    toast({
      title: "Feature added",
      description: "Manual feature has been added successfully",
    });
  };

  const downloadScreenshot = () => {
    if (screenshotId) {
      window.open(`http://localhost:8001/screenshot/${screenshotId}`, '_blank');
    } else {
        toast({
            title: "No Screenshot ID",
            description: "A screenshot ID was not found for this analysis.",
            variant: "destructive"
        })
    }
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">Analysis Review</h1>
              <p className="text-muted-foreground">
                Review AI-detected UI components and analysis for: <a href={analyzedUrl} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">{analyzedUrl}</a>
                {!analysisReport.components && (
                  <span className="text-yellow-500 text-sm block mt-1">
                    (Showing demo data - analyze a real URL for actual results)
                  </span>
                )}
              </p>
            </div>
            <Dialog open={isAddFeatureOpen} onOpenChange={setIsAddFeatureOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-orange-600 hover:bg-orange-700">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Component Manually
                  </Button>
                </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Add Component Manually</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Component Name</Label>
                    <Input
                      id="name"
                      placeholder="e.g., Primary Button"
                      value={newFeature.name}
                      onChange={(e) => setNewFeature({ ...newFeature, name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      placeholder="Describe the component and its function..."
                      value={newFeature.description}
                      onChange={(e) => setNewFeature({ ...newFeature, description: e.target.value })}
                    />
                  </div>
                   <div className="space-y-2">
                    <Label htmlFor="style_info">Styling Info</Label>
                    <Input
                      id="style_info"
                      placeholder="e.g., background: #007bff"
                      value={newFeature.style_info}
                      onChange={(e) => setNewFeature({ ...newFeature, style_info: e.target.value })}
                    />
                  </div>
                </div>
                <div className="flex justify-end pt-4">
                    <Button onClick={handleAddFeature}>Add Component</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
        
        <Tabs defaultValue="features" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="features">
              <Sparkles className="h-4 w-4 mr-2" /> UI Components
            </TabsTrigger>
            <TabsTrigger value="analysis">
                <Sparkles className="h-4 w-4 mr-2" /> AI Analysis
            </TabsTrigger>
            <TabsTrigger value="screenshot">
                <Eye className="h-4 w-4 mr-2" /> Screenshot
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="features">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
              {features.map((feature, index) => (
                <Card key={index}>
                  <CardHeader>
                    <CardTitle>{feature.name}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground mb-4">{feature.description}</p>
                    <Badge variant="outline">{feature.style_info}</Badge>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
          
          <TabsContent value="analysis">
            <Card className="mt-6">
                <CardHeader>
                    <CardTitle>{analysisReport.title || "AI Analysis"}</CardTitle>
                </CardHeader>
                <CardContent>
                    <StreamingAnalysis text={analysisReport.summary || "No summary provided."} />
                </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="screenshot">
            <Card className="mt-6">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Full Page Screenshot</CardTitle>
                <Button variant="outline" size="sm" onClick={downloadScreenshot} disabled={!screenshotId}>
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
              </CardHeader>
              <CardContent>
                {screenshotId ? (
                  <img 
                    src={`http://localhost:8001/screenshot/${screenshotId}`} 
                    alt="Full page screenshot"
                    className="rounded-lg border border-border"
                  />
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <p>No screenshot available for this analysis.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default FeatureReview;