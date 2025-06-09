
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Upload, Camera, MessageSquare, CheckCircle, AlertTriangle, XCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

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
}

const FeatureReview = () => {
  const { toast } = useToast();
  const [features, setFeatures] = useState<Feature[]>([
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
  ]);

  const [selectedFeature, setSelectedFeature] = useState<Feature | null>(null);
  const [userNotes, setUserNotes] = useState('');

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

  const filteredFeatures = (status?: Feature['status']) => {
    return status ? features.filter(f => f.status === status) : features;
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Feature Review</h1>
          <p className="text-muted-foreground">
            Review AI-detected UI features and provide feedback
          </p>
        </div>

        <Tabs defaultValue="all" className="space-y-6">
          <TabsList>
            <TabsTrigger value="all">All Features ({features.length})</TabsTrigger>
            <TabsTrigger value="pending">
              Pending ({filteredFeatures('pending').length})
            </TabsTrigger>
            <TabsTrigger value="reviewed">
              Reviewed ({filteredFeatures('reviewed').length})
            </TabsTrigger>
            <TabsTrigger value="approved">
              Approved ({filteredFeatures('approved').length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-4">
              {features.map((feature) => (
                <Card 
                  key={feature.id} 
                  className={`cursor-pointer transition-all hover:shadow-md ${
                    selectedFeature?.id === feature.id ? 'ring-2 ring-orange-500' : ''
                  }`}
                  onClick={() => setSelectedFeature(feature)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-lg">{feature.title}</CardTitle>
                      {getStatusIcon(feature.status)}
                    </div>
                    <div className="flex gap-2">
                      <Badge variant="outline" className={getSeverityColor(feature.severity)}>
                        {feature.severity}
                      </Badge>
                      <Badge variant="outline">
                        {Math.round(feature.aiConfidence * 100)}% confidence
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">{feature.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            {selectedFeature && (
              <Card className="sticky top-6">
                <CardHeader>
                  <CardTitle>Review Feature</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h3 className="font-semibold mb-2">{selectedFeature.title}</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      {selectedFeature.description}
                    </p>
                  </div>

                  <div className="space-y-3">
                    <label className="text-sm font-medium">Add Notes</label>
                    <Textarea
                      placeholder="Add your review notes..."
                      value={userNotes}
                      onChange={(e) => setUserNotes(e.target.value)}
                      className="min-h-[100px]"
                    />
                  </div>

                  <div className="space-y-3">
                    <label className="text-sm font-medium">Attach Screenshot</label>
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleScreenshotUpload(selectedFeature.id)}
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        Upload
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleScreenshotUpload(selectedFeature.id)}
                      >
                        <Camera className="h-4 w-4 mr-2" />
                        Capture
                      </Button>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-4">
                    <Button 
                      onClick={() => updateFeatureStatus(selectedFeature.id, 'approved', userNotes)}
                      className="flex-1"
                    >
                      Approve
                    </Button>
                    <Button 
                      variant="outline"
                      onClick={() => updateFeatureStatus(selectedFeature.id, 'reviewed', userNotes)}
                      className="flex-1"
                    >
                      Mark Reviewed
                    </Button>
                    <Button 
                      variant="destructive"
                      onClick={() => updateFeatureStatus(selectedFeature.id, 'rejected', userNotes)}
                      className="flex-1"
                    >
                      Reject
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
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
                  <CardContent>
                    <p className="text-sm text-muted-foreground">{feature.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default FeatureReview;
