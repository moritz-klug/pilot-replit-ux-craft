
import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { ScrollArea } from './ui/scroll-area';
import { 
  Bot, 
  Loader2, 
  Sparkles, 
  CheckCircle, 
  AlertTriangle,
  Copy,
  Check,
  Lightbulb,
  MessageSquare
} from 'lucide-react';
import { useToast } from '../hooks/use-toast';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface AnalysisResult {
  id: string;
  type: 'insight' | 'recommendation' | 'code' | 'summary';
  content: string;
  severity?: 'low' | 'medium' | 'high';
  category?: string;
  isComplete: boolean;
  isStreaming: boolean;
}

interface StreamingAnalysisProps {
  url: string;
  features: any[];
  screenshot?: any;
  onAnalysisComplete?: (results: AnalysisResult[]) => void;
  className?: string;
}

const StreamingAnalysis: React.FC<StreamingAnalysisProps> = ({
  url,
  features,
  screenshot,
  onAnalysisComplete,
  className = ""
}) => {
  const [analysisResults, setAnalysisResults] = useState<AnalysisResult[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [currentStreamingId, setCurrentStreamingId] = useState<string | null>(null);
  const [copiedContent, setCopiedContent] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Auto-scroll to bottom when new content arrives
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [analysisResults]);

  // Simulate streaming response
  const streamContent = async (fullContent: string, resultId: string): Promise<void> => {
    setCurrentStreamingId(resultId);
    
    // Stream the content character by character
    for (let i = 0; i < fullContent.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 20 + Math.random() * 15)); // 20-35ms delay
      
      setAnalysisResults(prev => 
        prev.map(result => 
          result.id === resultId 
            ? { ...result, content: fullContent.substring(0, i + 1) }
            : result
        )
      );
    }

    // Mark as complete
    setAnalysisResults(prev => 
      prev.map(result => 
        result.id === resultId 
          ? { ...result, isStreaming: false, isComplete: true }
          : result
      )
    );

    setCurrentStreamingId(null);
  };

  // Generate analysis content
  const generateAnalysisContent = (): AnalysisResult[] => {
    const results: AnalysisResult[] = [];
    
    // Summary
    results.push({
      id: 'summary',
      type: 'summary',
      content: `# Analysis Summary for ${url}

Based on my analysis of your website, I've identified **${features.length} key UI elements** that could benefit from improvements. Here's what I found:

## Key Findings
- **${features.filter(f => f.severity === 'high').length} high-priority issues** that need immediate attention
- **${features.filter(f => f.severity === 'medium').length} medium-priority improvements** for better UX
- **${features.filter(f => f.severity === 'low').length} minor enhancements** for polish

Let me break down the specific recommendations for each area...`,
      isComplete: false,
      isStreaming: true
    });

    // Insights
    results.push({
      id: 'insights',
      type: 'insight',
      content: `## 🔍 Key Insights

### Visual Hierarchy
Your website demonstrates good use of visual hierarchy, but there are opportunities to enhance user engagement through:

1. **Color Psychology**: The current color scheme could be optimized for better conversion rates
2. **Typography**: Consider improving font contrast and spacing for better readability
3. **Whitespace**: Strategic use of whitespace can improve content digestion

### User Experience Patterns
I've identified several UX patterns that could be enhanced:

- **Progressive Disclosure**: Complex information could be better organized
- **Feedback Mechanisms**: Users need clearer feedback for their actions
- **Navigation Flow**: The user journey could be more intuitive

### Accessibility Considerations
- **Color Contrast**: Some text elements may not meet WCAG guidelines
- **Keyboard Navigation**: Ensure all interactive elements are keyboard accessible
- **Screen Reader Support**: Add proper ARIA labels where needed`,
      isComplete: false,
      isStreaming: true
    });

    // Code recommendations
    results.push({
      id: 'code-recommendations',
      type: 'code',
      content: `## 💻 Implementation Recommendations

### CSS Improvements
\`\`\`css
/* Enhanced Button Styles */
.button-primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 8px;
  padding: 12px 24px;
  font-weight: 600;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

.button-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
}

/* Improved Typography */
.text-heading {
  font-size: clamp(1.5rem, 4vw, 2.5rem);
  line-height: 1.2;
  font-weight: 700;
  color: #1f2937;
}

/* Accessibility Focus States */
.focus-visible {
  outline: 2px solid #3b82f6;
  outline-offset: 2px;
  border-radius: 4px;
}
\`\`\`

### JavaScript Enhancements
\`\`\`javascript
// Progressive Loading
const loadContentProgressively = async (elements) => {
  for (const element of elements) {
    await new Promise(resolve => setTimeout(resolve, 100));
    element.style.opacity = '1';
    element.style.transform = 'translateY(0)';
  }
};

// Enhanced Form Validation
const validateForm = (formData) => {
  const errors = [];
  
  if (!formData.email || !isValidEmail(formData.email)) {
    errors.push('Please enter a valid email address');
  }
  
  if (formData.password && formData.password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }
  
  return errors;
};

// Micro-interactions
const addMicroInteractions = () => {
  const buttons = document.querySelectorAll('.interactive-button');
  
  buttons.forEach(button => {
    button.addEventListener('click', (e) => {
      // Create ripple effect
      const ripple = document.createElement('span');
      ripple.classList.add('ripple');
      button.appendChild(ripple);
      
      setTimeout(() => ripple.remove(), 600);
    });
  });
};
\`\`\``,
      isComplete: false,
      isStreaming: true
    });

    // Final recommendations
    results.push({
      id: 'final-recommendations',
      type: 'recommendation',
      content: `## 🎯 Actionable Recommendations

### Immediate Actions (High Priority)
1. **Fix Accessibility Issues**
   - Implement proper ARIA labels
   - Improve color contrast ratios
   - Ensure keyboard navigation works

2. **Optimize Loading Performance**
   - Implement lazy loading for images
   - Minimize bundle size
   - Use CDN for static assets

### Short-term Improvements (Medium Priority)
1. **Enhance User Feedback**
   - Add loading states for all interactions
   - Implement toast notifications
   - Provide clear error messages

2. **Improve Visual Design**
   - Refine color palette for better brand consistency
   - Optimize typography hierarchy
   - Add subtle animations for engagement

### Long-term Enhancements (Low Priority)
1. **Advanced Features**
   - Implement dark mode
   - Add keyboard shortcuts
   - Create advanced filtering options

## 📊 Success Metrics
Track these metrics to measure improvements:
- **Conversion Rate**: Aim for 15-20% improvement
- **Time on Page**: Target 30% increase
- **Bounce Rate**: Reduce by 25%
- **Accessibility Score**: Achieve 95+ on Lighthouse

Would you like me to elaborate on any of these recommendations or provide more specific implementation details?`,
      isComplete: false,
      isStreaming: true
    });

    return results;
  };

  // Start analysis
  const startAnalysis = async () => {
    if (isAnalyzing) return;

    setIsAnalyzing(true);
    setAnalysisResults([]);

    try {
      // Generate analysis content
      const results = generateAnalysisContent();
      setAnalysisResults(results);

      // Stream each result
      for (const result of results) {
        await streamContent(result.content, result.id);
        // Small delay between sections
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      toast({
        title: "Analysis Complete!",
        description: "Your website analysis has been completed successfully.",
      });

      onAnalysisComplete?.(results);

    } catch (error) {
      console.error('Analysis error:', error);
      toast({
        title: "Analysis Failed",
        description: "Failed to complete analysis. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Copy content to clipboard
  const copyContent = async (content: string) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedContent(content);
      toast({
        title: "Copied!",
        description: "Content copied to clipboard",
      });
      setTimeout(() => setCopiedContent(null), 2000);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy content",
        variant: "destructive"
      });
    }
  };

  // Get icon for result type
  const getResultIcon = (type: AnalysisResult['type']) => {
    switch (type) {
      case 'summary': return <MessageSquare className="w-4 h-4" />;
      case 'insight': return <Lightbulb className="w-4 h-4" />;
      case 'code': return <Bot className="w-4 h-4" />;
      case 'recommendation': return <CheckCircle className="w-4 h-4" />;
      default: return <Sparkles className="w-4 h-4" />;
    }
  };

  // Get badge color for severity
  const getSeverityColor = (severity?: string) => {
    switch (severity) {
      case 'high': return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'medium': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'low': return 'bg-green-500/20 text-green-400 border-green-500/30';
      default: return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Analysis Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <div>
                <CardTitle className="text-lg">AI Analysis</CardTitle>
                <p className="text-sm text-muted-foreground">
                  {isAnalyzing ? 'Analyzing your website...' : 'Ready to analyze'}
                </p>
              </div>
            </div>
            
            {!isAnalyzing && analysisResults.length === 0 && (
              <Button 
                onClick={startAnalysis}
                className="bg-orange-600 hover:bg-orange-700"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Start Analysis
              </Button>
            )}
          </div>
        </CardHeader>
      </Card>

      {/* Analysis Results */}
      {analysisResults.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Analysis Results</CardTitle>
              <Badge variant="outline">
                {analysisResults.filter(r => r.isComplete).length}/{analysisResults.length} Complete
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[600px] pr-4" ref={scrollRef}>
              <div className="space-y-6">
                {analysisResults.map((result) => (
                  <div key={result.id} className="space-y-3">
                    {/* Result Header */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                          {getResultIcon(result.type)}
                        </div>
                        <h3 className="font-semibold capitalize">
                          {result.id === 'code-recommendations' ? 'Code Recommendations' : result.type}
                        </h3>
                        {result.severity && (
                          <Badge className={getSeverityColor(result.severity)}>
                            {result.severity}
                          </Badge>
                        )}
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        {result.isComplete && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyContent(result.content)}
                            className="h-6 px-2 text-xs"
                          >
                            {copiedContent === result.content ? (
                              <Check className="w-3 h-3 mr-1" />
                            ) : (
                              <Copy className="w-3 h-3 mr-1" />
                            )}
                            {copiedContent === result.content ? 'Copied!' : 'Copy'}
                          </Button>
                        )}
                        {result.isStreaming && (
                          <div className="flex space-x-1">
                            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                          </div>
                        )}
                        {result.isComplete && (
                          <CheckCircle className="w-4 h-4 text-green-500" />
                        )}
                      </div>
                    </div>

                    {/* Result Content */}
                    <div className="prose prose-sm max-w-none dark:prose-invert">
                      <ReactMarkdown
                        components={{
                          code({ node, className, children, ...props }) {
                            const match = /language-(\w+)/.exec(className || '');
                            const isInline = !match;
                            return !isInline ? (
                              <SyntaxHighlighter
                                style={oneDark as { [key: string]: React.CSSProperties }}
                                language={match[1]}
                                PreTag="div"
                                {...props}
                              >
                                {String(children).replace(/\n$/, '')}
                              </SyntaxHighlighter>
                            ) : (
                              <code className={className} {...props}>
                                {children}
                              </code>
                            );
                          },
                        }}
                      >
                        {result.content}
                      </ReactMarkdown>
                      
                      {/* Streaming cursor */}
                      {result.isStreaming && currentStreamingId === result.id && (
                        <span className="inline-block w-2 h-4 bg-blue-500 ml-1 animate-pulse"></span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {/* Loading State */}
      {isAnalyzing && analysisResults.length === 0 && (
        <Card>
          <CardContent className="p-8">
            <div className="flex items-center justify-center space-x-3">
              <Loader2 className="w-6 h-6 animate-spin text-orange-600" />
              <div>
                <p className="font-medium">Analyzing your website...</p>
                <p className="text-sm text-muted-foreground">
                  Examining UI elements, accessibility, and user experience patterns
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default StreamingAnalysis; 
