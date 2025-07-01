import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { ArrowLeft, CheckCircle, Eye, MoreHorizontal, Lightbulb, FileText, Palette, ChevronLeft, ChevronRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { futureHouseService } from "@/services/futureHouseService";
import { RecommendationsDisplay } from "@/components/RecommendationsDisplay";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { mockFutureHouseResponse, mockFeature } from "@/mock/futureHouseMock";
import { parseRecommendationString, ParsedRecommendation } from "@/utils/parseRecommendation";

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

// Keep the original allRecommendations array
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

// Add type for enriched recommendation
interface EnrichedRecommendation {
  id?: string;
  title: string;
  description: string;
  principle: string;
  research: string;
  impact: string;
  category: string;
}

const Recommendations = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const feature = location.state?.feature;
  const [recommendations, setRecommendations] = useState<string[]>([]);
  const [papers, setPapers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [mockupStates, setMockupStates] = useState<{ [key: string]: 'before' | 'after' }>({});
  const [tab, setTab] = useState<'scientific' | 'heuristics'>('scientific');
  const [heuristicSuggestions, setHeuristicSuggestions] = useState<{ [key: number]: string }>({});
  const [heuristicLoading, setHeuristicLoading] = useState<{ [key: number]: boolean }>({});
  const [relevantHeuristics, setRelevantHeuristics] = useState<number[]>([]);
  const [heuristicsLoading, setHeuristicsLoading] = useState(false);
  // Default to mock data (true)
  const [useMockupCards, setUseMockupCards] = useState(true);
  const [enrichedCards, setEnrichedCards] = useState<EnrichedRecommendation[]>([]);
  const [enrichLoading, setEnrichLoading] = useState(false);

  // Only call the real API if useMockupCards is false
  useEffect(() => {
    if (!feature) {
      navigate('/feature-review');
      return;
    }
    if (useMockupCards) {
      // Only use mock data, do NOT call any API
      setRecommendations([]);
      setPapers([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const context = `What are the best UI and UX experiences, patterns, and scientific recommendations for a ${feature.title}?`;
    futureHouseService.getRecommendations({
      feature: feature.title,
      currentDesign: feature.description,
      context,
    })
      .then((res) => {
        setRecommendations(res.recommendations);
        setPapers(res.papers);
      })
      .catch((err) => {
        toast({
          title: "Error",
          description: "Failed to get recommendations.",
          variant: "destructive"
        });
      })
      .finally(() => setLoading(false));
  }, [feature, navigate, toast, useMockupCards]);

  useEffect(() => {
    if (tab === 'heuristics' && feature) {
      setHeuristicsLoading(true);
      futureHouseService.getRelevantHeuristics(feature.title, feature.description)
        .then(indices => setRelevantHeuristics(indices))
        .catch(() => setRelevantHeuristics([]))
        .finally(() => setHeuristicsLoading(false));
    }
  }, [tab, feature]);

  // Enrich recommendations with LLM when toggled to API recommendations
  useEffect(() => {
    if (!useMockupCards) {
      setEnrichLoading(true);
      Promise.all(
        mockFutureHouseResponse.recommendations.map((rec) =>
          fetch("http://localhost:8000/enrich-recommendation", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              recommendation: rec,
              feature: mockFeature.title,
              currentDesign: mockFeature.description,
            }),
          })
            .then((res) => res.json())
            .catch(() => null)
        )
      )
        .then((results) => {
          // Add an id for React key
          setEnrichedCards(
            results
              .filter(Boolean)
              .map((card, idx) => ({ ...card, id: (idx + 1).toString() }))
          );
        })
        .finally(() => setEnrichLoading(false));
    }
  }, [useMockupCards]);

  if (!feature) return null;

  // Remove the hardcoded allRecommendations and use parsed mock data instead
  const parsedRecommendations: ParsedRecommendation[] = mockFutureHouseResponse.recommendations.map((rec, idx) =>
    parseRecommendationString(rec, idx + 1)
  );

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

  const handleHeuristicSuggestion = async (index: number, heuristic: { title: string, explanation: string }) => {
    setHeuristicLoading(prev => ({ ...prev, [index]: true }));
    try {
      // Use your existing LLM service, e.g. futureHouseService.getRecommendations or a new endpoint
      const context = `Using the usability heuristic: ${heuristic.title} - ${heuristic.explanation}, how can we improve the following feature?\nTitle: ${feature.title}\nDescription: ${feature.description}`;
      const res = await futureHouseService.getRecommendations({
        feature: feature.title,
        currentDesign: feature.description,
        context,
      });
      setHeuristicSuggestions(prev => ({ ...prev, [index]: res.recommendations?.[0] || 'No suggestion returned.' }));
    } catch (err) {
      setHeuristicSuggestions(prev => ({ ...prev, [index]: 'Failed to get suggestion.' }));
    } finally {
      setHeuristicLoading(prev => ({ ...prev, [index]: false }));
    }
  };

  const usabilityHeuristics = [
    {
      title: "Visibility of system status",
      explanation: "The system should always keep users informed about what is going on, through appropriate feedback within reasonable time."
    },
    {
      title: "Match between system and the real world",
      explanation: "The system should speak the users' language, with words, phrases and concepts familiar to the user, rather than system-oriented terms."
    },
    {
      title: "User control and freedom",
      explanation: "Users often choose system functions by mistake and will need a clearly marked 'emergency exit' to leave the unwanted state."
    },
    {
      title: "Consistency and standards",
      explanation: "Users should not have to wonder whether different words, situations, or actions mean the same thing. Follow platform conventions."
    },
    {
      title: "Error prevention",
      explanation: "Even better than good error messages is a careful design which prevents a problem from occurring in the first place."
    },
    {
      title: "Recognition rather than recall",
      explanation: "Minimize the user's memory load by making objects, actions, and options visible."
    },
    {
      title: "Flexibility and efficiency of use",
      explanation: "Accelerators—unseen by the novice user—may often speed up the interaction for the expert user such that the system can cater to both inexperienced and experienced users."
    },
    {
      title: "Aesthetic and minimalist design",
      explanation: "Dialogues should not contain information which is irrelevant or rarely needed. Every extra unit of information competes with the relevant units of information and diminishes their relative visibility."
    },
    {
      title: "Help users recognize, diagnose, and recover from errors",
      explanation: "Error messages should be expressed in plain language (no codes), precisely indicate the problem, and constructively suggest a solution."
    },
    {
      title: "Help and documentation",
      explanation: "Even though it is better if the system can be used without documentation, it may be necessary to provide help and documentation."
    }
  ];

  const recommendationsToShow = useMockupCards ? allRecommendations : enrichedCards;

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

        {/* Tab Switcher */}
        <div className="mb-8 flex gap-4">
          <Button variant={tab === 'scientific' ? 'default' : 'outline'} onClick={() => setTab('scientific')}>Scientific Recommendations</Button>
          <Button variant={tab === 'heuristics' ? 'default' : 'outline'} onClick={() => setTab('heuristics')}>Usability Heuristics</Button>
        </div>

        {tab === 'scientific' ? (
          <>
            {/* Toggle Button for Data Source */}
            <div className="mb-4">
              <Button variant="secondary" onClick={() => setUseMockupCards((v) => !v)}>
                {useMockupCards ? "Show API Recommendations" : "Show Mockup Cards"}
              </Button>
            </div>
            {/* Horizontal Scrollable Recommendations */}
            <div className="mb-8">
              <h2 className="text-2xl font-bold mb-6">Design Recommendations</h2>
              {enrichLoading && !useMockupCards ? (
                <div className="p-8 text-center text-muted-foreground">Enriching recommendations with AI...</div>
              ) : (
                <ScrollArea className="w-full whitespace-nowrap rounded-md">
                  <div className="flex w-max space-x-6 p-4">
                    {recommendationsToShow.map((recommendation, index) => (
                      <Card key={recommendation.id || index} className="w-[450px] flex-none overflow-hidden">
                        <CardHeader className="pb-4">
                          <div className="flex items-start justify-between">
                            <div className="flex items-start gap-3 min-w-0 flex-1">
                              <div className="bg-orange-500/20 p-2 rounded-lg flex-shrink-0">
                                {/* Show icon or index */}
                                {useMockupCards && getCategoryIcon((recommendation as Recommendation).category as Recommendation['category'])}
                                {!useMockupCards && <span className="h-4 w-4">{index + 1}</span>}
                              </div>
                              <div className="min-w-0 flex-1">
                                <CardTitle className="text-lg mb-2 break-words whitespace-normal hyphens-auto">
                                  {index + 1}. {recommendation.title}
                                </CardTitle>
                                <div className="flex gap-2 flex-wrap">
                                  <Badge variant="outline" className={`${useMockupCards ? getImpactColor((recommendation as Recommendation).impact as Recommendation['impact']) : ''} whitespace-nowrap`}>
                                    {recommendation.impact} impact
                                  </Badge>
                                  <Badge variant="outline" className="capitalize whitespace-nowrap">
                                    {recommendation.category}
                                  </Badge>
                                </div>
                              </div>
                            </div>
                            <Button
                              onClick={useMockupCards ? () => handleChooseRecommendation(recommendation as Recommendation) : undefined}
                              className="bg-orange-600 hover:bg-orange-700 flex-shrink-0 ml-2"
                              size="sm"
                              disabled={!useMockupCards}
                            >
                              Choose This
                            </Button>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-4 overflow-hidden">
                          <div>
                            <p className="text-sm text-muted-foreground break-words whitespace-normal hyphens-auto overflow-wrap-anywhere">{recommendation.description}</p>
                          </div>
                          {/* Vertical Layout: Principle, Research, then Visual Mockup */}
                          <div className="space-y-4">
                            {/* UI/UX Principle */}
                            <div className="overflow-hidden">
                              <h4 className="font-semibold mb-2 flex items-center gap-2 text-sm">
                                <FileText className="h-4 w-4 flex-shrink-0" />
                                <span className="break-words">UI/UX Principle</span>
                              </h4>
                              <p className="text-xs text-muted-foreground leading-relaxed break-words whitespace-normal hyphens-auto overflow-wrap-anywhere">{recommendation.principle}</p>
                            </div>
                            {/* Research Citation */}
                            <div className="overflow-hidden">
                              <h4 className="font-semibold mb-2 text-sm break-words">Research Citation</h4>
                              <p className="text-xs text-muted-foreground italic leading-relaxed break-words whitespace-normal hyphens-auto overflow-wrap-anywhere">{recommendation.research}</p>
                            </div>
                            {/* Visual Mockup */}
                            <div className="overflow-hidden">
                              <h4 className="font-semibold mb-2 text-sm">Visual Mockup</h4>
                              <div className="bg-muted rounded-lg p-3 relative overflow-hidden">
                                <div className="relative">
                                  {useMockupCards && (recommendation as Recommendation).beforeMockupUrl ? (
                                    <img
                                      src={(recommendation as Recommendation).beforeMockupUrl}
                                      alt={`Before mockup for ${recommendation.title}`}
                                      className="w-full h-32 object-cover rounded-lg transition-all duration-300"
                                    />
                                  ) : (
                                    <div className="w-full h-32 flex items-center justify-center bg-gray-100 rounded-lg text-gray-400">No mockup</div>
                                  )}
                                </div>
                                {/* Before/After Label */}
                                <div className="flex justify-between items-center mt-2">
                                  <p className="text-xs text-muted-foreground break-words">
                                    Before
                                  </p>
                                  <div className="flex gap-1 flex-shrink-0">
                                    <div className={`w-2 h-2 rounded-full bg-orange-500`} />
                                    <div className={`w-2 h-2 rounded-full bg-muted-foreground/30`} />
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
              )}
            </div>
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
            {loading ? (
              <p>Loading...</p>
            ) : (
              useMockupCards ? (
                <RecommendationsDisplay recommendations={recommendations} papers={papers} />
              ) : (
                <RecommendationsDisplay recommendations={mockFutureHouseResponse.recommendations} papers={mockFutureHouseResponse.papers} />
              )
            )}
          </>
        ) : (
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-6">10 Usability Heuristics</h2>
            <p className="mb-6 text-muted-foreground max-w-2xl">
              These are Jakob Nielsen's 10 Usability Heuristics—timeless principles that form the foundation of great user interfaces. They are widely recognized as the main pillars of UI/UX design. Applying these heuristics helps ensure your product is intuitive, efficient, and delightful for users. Every major tech company and design team references these principles when evaluating and improving digital experiences.
            </p>
            {heuristicsLoading ? (
              <p>Loading relevant heuristics...</p>
            ) : (
              <ScrollArea className="w-full whitespace-nowrap rounded-md">
                <div className="flex w-max space-x-6 p-4">
                  {[
                    ...usabilityHeuristics.map((h, i) => ({ ...h, index: i, relevant: relevantHeuristics.includes(i + 1) })),
                  ]
                    .sort((a, b) => (b.relevant ? 1 : 0) - (a.relevant ? 1 : 0)) // relevant first
                    .map((heuristic, idx) => {
                      const isRelevant = heuristic.relevant;
                      return (
                        <Card
                          key={heuristic.index}
                          className={`w-[450px] flex-none overflow-hidden ${!isRelevant ? 'opacity-50 pointer-events-none' : ''}`}
                        >
                          <CardHeader className="pb-4">
                            <div className="flex items-start gap-3 min-w-0 flex-1">
                              <div className="bg-muted p-2 rounded-lg flex-shrink-0 h-10 w-10 flex items-center justify-center font-bold text-lg text-muted-foreground">
                                {heuristic.index + 1}
                              </div>
                              <div className="min-w-0 flex-1">
                                <CardTitle className="text-lg mb-2 break-words whitespace-normal hyphens-auto font-bold">
                                  {heuristic.title}
                                </CardTitle>
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent>
                            <div className="overflow-hidden mb-4">
                              <h4 className="font-semibold mb-2 text-sm text-muted-foreground">
                                UI/UX Principle
                              </h4>
                              <p className="text-xs text-muted-foreground leading-relaxed break-words whitespace-normal hyphens-auto overflow-wrap-anywhere">
                                {heuristic.explanation}
                              </p>
                            </div>
                            <Separator className="my-4" />
                            <div>
                              <Button
                                onClick={() => handleHeuristicSuggestion(heuristic.index, heuristic)}
                                disabled={!isRelevant || heuristicLoading[heuristic.index]}
                                className="mb-2"
                              >
                                {heuristicLoading[heuristic.index] ? 'Loading...' : 'Get Improvement Suggestion'}
                              </Button>
                              {heuristicSuggestions[heuristic.index] && (
                                <div className="mt-2 p-3 bg-muted rounded">
                                  <strong>Suggestion:</strong> {heuristicSuggestions[heuristic.index]}
                                </div>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                </div>
                <ScrollBar orientation="horizontal" />
              </ScrollArea>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Recommendations;
