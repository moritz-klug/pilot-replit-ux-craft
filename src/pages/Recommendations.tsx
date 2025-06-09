import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { ArrowLeft, CheckCircle, Eye, MoreHorizontal, Lightbulb, FileText, Palette, ChevronLeft, ChevronRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Recommendation {
  id: string;
  title: string;
  description: string;
  principle: string;
  research: string;
  beforeMockupUrl: string;
  afterMockupUrl: string;
  impact: 'high' | 'medium' | 'low';
  category: 'accessibility' | 'usability' | 'visual' | 'interaction';
}

const Recommendations = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const feature = location.state?.feature;
  const [showAllRecommendations, setShowAllRecommendations] = useState(false);
  const [mockupStates, setMockupStates] = useState<{[key: string]: 'before' | 'after'}>({});

  if (!feature) {
    navigate('/feature-review');
    return null;
  }

  // Mock recommendations data - in real app, this would come from API
  const allRecommendations: Recommendation[] = [
    {
      id: '1',
      title: 'Improve Color Contrast',
      description: 'Increase the contrast ratio between the button text and background to meet WCAG AA standards (4.5:1 minimum).',
      principle: 'The principle of accessibility requires sufficient color contrast for users with visual impairments. Poor contrast can make content illegible for users with color vision deficiencies or low vision.',
      research: 'According to Web Content Accessibility Guidelines (WCAG) 2.1 and research by Reinecke et al. (2013) on "Predicting users\' first impressions of website aesthetics", proper contrast significantly improves both accessibility and perceived trustworthiness.',
      beforeMockupUrl: 'https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?w=400&h=300&fit=crop',
      afterMockupUrl: 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=400&h=300&fit=crop',
      impact: 'high',
      category: 'accessibility'
    },
    {
      id: '2',
      title: 'Add Hover State Animation',
      description: 'Implement a subtle scale and shadow transition on hover to provide clear visual feedback and improve perceived interactivity.',
      principle: 'Affordance theory by James J. Gibson suggests that users need clear visual cues about interactive elements. Hover states communicate that an element is clickable and responsive.',
      research: 'Studies by Hornbæk & Hertzum (2007) in "Aesthetics and usability" show that micro-interactions like hover effects improve user confidence and task completion rates by up to 23%.',
      beforeMockupUrl: 'https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?w=400&h=300&fit=crop',
      afterMockupUrl: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=400&h=300&fit=crop',
      impact: 'medium',
      category: 'interaction'
    },
    {
      id: '3',
      title: 'Optimize Button Size',
      description: 'Increase button height to 44px minimum to meet touch target accessibility guidelines and improve mobile usability.',
      principle: 'Fitts\' Law states that the time to acquire a target is a function of the distance to and size of the target. Larger targets are easier and faster to click.',
      research: 'Apple\'s Human Interface Guidelines and research by Parhi et al. (2006) "Target size study for one-handed thumb use on small touchscreen devices" recommend minimum 44px touch targets.',
      beforeMockupUrl: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=400&h=300&fit=crop',
      afterMockupUrl: 'https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?w=400&h=300&fit=crop',
      impact: 'high',
      category: 'usability'
    },
    {
      id: '4',
      title: 'Add Loading State',
      description: 'Implement a loading spinner and disabled state when the button is clicked to prevent double submissions and provide user feedback.',
      principle: 'The principle of feedback ensures users understand system status. Loading states reduce uncertainty and prevent user frustration during processing.',
      research: 'Nielsen\'s usability heuristics emphasize "visibility of system status." Research by Miller (1968) shows users expect feedback within 0.1 seconds for immediate actions.',
      beforeMockupUrl: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=400&h=300&fit=crop',
      afterMockupUrl: 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=400&h=300&fit=crop',
      impact: 'medium',
      category: 'interaction'
    },
    {
      id: '5',
      title: 'Implement Focus Indicators',
      description: 'Add clear keyboard focus indicators with a distinct outline for better keyboard navigation accessibility.',
      principle: 'Keyboard accessibility is essential for users who cannot use a mouse. Focus indicators show which element currently has keyboard focus.',
      research: 'WCAG 2.1 Success Criterion 2.4.7 and studies by WebAIM (2021) show that 98.1% of home pages have accessibility failures, with missing focus indicators being a common issue.',
      beforeMockupUrl: 'https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?w=400&h=300&fit=crop',
      afterMockupUrl: 'https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?w=400&h=300&fit=crop',
      impact: 'high',
      category: 'accessibility'
    }
  ];

  const displayedRecommendations = showAllRecommendations ? allRecommendations : allRecommendations.slice(0, 3);

  const getImpactColor = (impact: Recommendation['impact']) => {
    switch (impact) {
      case 'high': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'medium': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'low': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
    }
  };

  const getCategoryIcon = (category: Recommendation['category']) => {
    switch (category) {
      case 'accessibility': return <Eye className="h-4 w-4" />;
      case 'usability': return <CheckCircle className="h-4 w-4" />;
      case 'visual': return <Palette className="h-4 w-4" />;
      case 'interaction': return <MoreHorizontal className="h-4 w-4" />;
    }
  };

  const handleChooseRecommendation = (recommendation: Recommendation) => {
    toast({
      title: "Recommendation Selected",
      description: `"${recommendation.title}" has been added to your implementation queue.`,
    });
  };

  const toggleMockupView = (recommendationId: string) => {
    setMockupStates(prev => ({
      ...prev,
      [recommendationId]: prev[recommendationId] === 'after' ? 'before' : 'after'
    }));
  };

  const getMockupUrl = (recommendation: Recommendation) => {
    const state = mockupStates[recommendation.id] || 'before';
    return state === 'before' ? recommendation.beforeMockupUrl : recommendation.afterMockupUrl;
  };

  const getMockupLabel = (recommendationId: string) => {
    const state = mockupStates[recommendationId] || 'before';
    return state === 'before' ? 'Before' : 'After';
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/feature-review')}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Features
            </Button>
          </div>
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">Design Recommendations</h1>
              <p className="text-muted-foreground mb-4">
                Personalized UI/UX improvements for "{feature.title}"
              </p>
              <div className="flex gap-2">
                <Badge variant="outline" className="capitalize">
                  {feature.category}
                </Badge>
                <Badge variant="outline" className={`capitalize ${feature.severity === 'high' ? 'bg-red-500/20 text-red-400' : feature.severity === 'medium' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-green-500/20 text-green-400'}`}>
                  {feature.severity} Priority
                </Badge>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">AI Confidence</p>
              <p className="text-2xl font-bold text-orange-500">{Math.round(feature.aiConfidence * 100)}%</p>
            </div>
          </div>
        </div>

        {/* Feature Context */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-orange-500" />
              Current Feature Analysis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">{feature.description}</p>
          </CardContent>
        </Card>

        {/* Horizontal Scrollable Recommendations */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-6">Recommendations</h2>
          <ScrollArea className="w-full whitespace-nowrap rounded-md">
            <div className="flex w-max space-x-6 p-4">
              {displayedRecommendations.map((recommendation, index) => (
                <Card key={recommendation.id} className="w-[800px] flex-none">
                  <CardHeader className="pb-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <div className="bg-orange-500/20 p-2 rounded-lg">
                          {getCategoryIcon(recommendation.category)}
                        </div>
                        <div>
                          <CardTitle className="text-xl mb-2">
                            {index + 1}. {recommendation.title}
                          </CardTitle>
                          <div className="flex gap-2">
                            <Badge variant="outline" className={getImpactColor(recommendation.impact)}>
                              {recommendation.impact} impact
                            </Badge>
                            <Badge variant="outline" className="capitalize">
                              {recommendation.category}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <Button
                        onClick={() => handleChooseRecommendation(recommendation)}
                        className="bg-orange-600 hover:bg-orange-700"
                        size="sm"
                      >
                        Choose This Recommendation
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <p className="text-sm text-muted-foreground">{recommendation.description}</p>
                    </div>

                    {/* Compact Layout: Left side - Principle & Research, Right side - Visual Mockup */}
                    <div className="grid lg:grid-cols-2 gap-6">
                      {/* Left Side - Principle and Research */}
                      <div className="space-y-4">
                        <div>
                          <h4 className="font-semibold mb-2 flex items-center gap-2 text-sm">
                            <FileText className="h-3 w-3" />
                            UI/UX Principle
                          </h4>
                          <p className="text-xs text-muted-foreground">{recommendation.principle}</p>
                        </div>
                        
                        <div>
                          <h4 className="font-semibold mb-2 text-sm">Research Citation</h4>
                          <p className="text-xs text-muted-foreground italic">{recommendation.research}</p>
                        </div>
                      </div>

                      {/* Right Side - Swipeable Visual Mockup */}
                      <div>
                        <h4 className="font-semibold mb-3 text-sm">Visual Mockup</h4>
                        <div className="bg-muted rounded-lg p-3 relative">
                          <div className="relative">
                            <img 
                              src={getMockupUrl(recommendation)} 
                              alt={`${getMockupLabel(recommendation.id)} mockup for ${recommendation.title}`}
                              className="w-full h-32 object-cover rounded-lg transition-all duration-300"
                            />
                            
                            {/* Swipe Controls */}
                            <div className="absolute inset-0 flex items-center justify-between p-2">
                              <Button
                                variant="secondary"
                                size="icon"
                                className="h-6 w-6 rounded-full bg-black/50 hover:bg-black/70 text-white border-0"
                                onClick={() => toggleMockupView(recommendation.id)}
                              >
                                <ChevronLeft className="h-3 w-3" />
                              </Button>
                              <Button
                                variant="secondary"
                                size="icon"
                                className="h-6 w-6 rounded-full bg-black/50 hover:bg-black/70 text-white border-0"
                                onClick={() => toggleMockupView(recommendation.id)}
                              >
                                <ChevronRight className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                          
                          {/* Before/After Label */}
                          <div className="flex justify-between items-center mt-2">
                            <p className="text-xs text-muted-foreground">
                              {getMockupLabel(recommendation.id)} - {recommendation.title}
                            </p>
                            <div className="flex gap-1">
                              <div className={`w-1.5 h-1.5 rounded-full ${mockupStates[recommendation.id] !== 'after' ? 'bg-orange-500' : 'bg-muted-foreground/30'}`} />
                              <div className={`w-1.5 h-1.5 rounded-full ${mockupStates[recommendation.id] === 'after' ? 'bg-orange-500' : 'bg-muted-foreground/30'}`} />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </div>

        {/* More Options Button */}
        {!showAllRecommendations && allRecommendations.length > 3 && (
          <div className="text-center mt-8">
            <Button
              variant="outline"
              onClick={() => setShowAllRecommendations(true)}
              className="bg-background hover:bg-muted"
            >
              <MoreHorizontal className="h-4 w-4 mr-2" />
              More Design Options ({allRecommendations.length - 3} more)
            </Button>
          </div>
        )}

        {/* Summary */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Implementation Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              These recommendations are based on current UI/UX best practices and research. 
              Choose the recommendations that best align with your design goals and user needs. 
              You can implement multiple recommendations or start with the highest impact ones.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Recommendations;
