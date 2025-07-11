import React, { useEffect, useState, useRef, useContext } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Loader2, Sparkles, LayoutDashboard, Camera, Target, ArrowUp } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { analyzeWithScreenshot } from '../services/featureExtractionService';
import { getRecommendations } from '../services/futureHouseService';
import { UITestModeContext } from '../App';
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
import { SectionList } from '../components/SectionList';
import { GlobalDesignSummary } from '../components/GlobalDesignSummary';
import { UxArchitecture } from '../components/UxArchitecture';
import { BusinessAnalysis } from '../components/BusinessAnalysis';

const DEMO_MODE = false;
const SCREENSHOT_API_BASE = 'http://localhost:8001';
const MAIN_API_BASE = 'http://localhost:8000';

const STATUS_OPTIONS = ['rejected', 'improved'] as const;
type Status = typeof STATUS_OPTIONS[number];

const SUBTABS = ['all', 'rejected', 'improved'] as const;
type SubTab = typeof SUBTABS[number];

const CHATBOT_TABS = ['mockups', 'code', 'sources'] as const;
type ChatbotTab = typeof CHATBOT_TABS[number];

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
  const [chatbotTab, setChatbotTab] = useState<ChatbotTab>('mockups');
  
  // Results page functionality
  const [selectedFramework, setSelectedFramework] = useState('react');
  const [selectedPlatform, setSelectedPlatform] = useState('lovable');
  const [codeCopied, setCodeCopied] = useState(false);
  const [promptCopied, setPromptCopied] = useState(false);
  const { toast } = useToast();

  // Code snippets from Results page
  const codeSnippets = {
    react: `import React from 'react';

const ImprovedComponent = () => {
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">
        Improved UX Component
      </h1>
      <p className="text-gray-600">
        This component implements science-based UX improvements
        for better user experience and accessibility.
      </p>
    </div>
  );
};

export default ImprovedComponent;`,
    vue: `<template>
  <div class="container mx-auto p-6">
    <h1 class="text-2xl font-bold mb-4">
      Improved UX Component
    </h1>
    <p class="text-gray-600">
      This component implements science-based UX improvements
      for better user experience and accessibility.
    </p>
  </div>
</template>

<script>
export default {
  name: 'ImprovedComponent'
}
</script>`,
    angular: `import { Component } from '@angular/core';

@Component({
  selector: 'app-improved-component',
  template: \`
    <div class="container mx-auto p-6">
      <h1 class="text-2xl font-bold mb-4">
        Improved UX Component
      </h1>
      <p class="text-gray-600">
        This component implements science-based UX improvements
        for better user experience and accessibility.
      </p>
    </div>
  \`
})
export class ImprovedComponent { }`
  };

  const platformPrompts = {
    lovable: `Please implement the following science-based UX improvements for my application:

1. **Visual Hierarchy**: Improve the visual hierarchy by adjusting font sizes, spacing, and color contrast to guide user attention effectively.

2. **Accessibility Enhancements**: Ensure all interactive elements are keyboard accessible and have proper ARIA labels for screen readers.

3. **Loading States**: Add skeleton loaders and progress indicators to provide feedback during data loading.

4. **Error Handling**: Implement user-friendly error messages with clear action steps for recovery.

5. **Responsive Design**: Optimize the layout for mobile devices with appropriate touch targets and spacing.

6. **Micro-interactions**: Add subtle animations and hover effects to provide visual feedback for user actions.

Please apply these improvements while maintaining the existing functionality and ensuring the code follows best practices for React and TypeScript.`,
    cursor: `// UX Improvement Instructions for Cursor AI IDE

Implement the following science-based UX improvements:

1. **Visual Hierarchy Enhancement**
   - Adjust font sizes, spacing, and color contrast
   - Guide user attention effectively through the interface
   - Use consistent typography scales

2. **Accessibility Standards**
   - Ensure keyboard navigation for all interactive elements
   - Add proper ARIA labels for screen readers
   - Maintain WCAG 2.1 AA compliance

3. **Loading States & Feedback**
   - Implement skeleton loaders for content loading
   - Add progress indicators for long-running operations
   - Provide immediate feedback for user actions

4. **Error Handling & Recovery**
   - Create user-friendly error messages
   - Provide clear action steps for error recovery
   - Implement graceful error boundaries

5. **Responsive Design Optimization**
   - Optimize layouts for mobile devices
   - Ensure appropriate touch targets (minimum 44px)
   - Test across different screen sizes

6. **Micro-interactions**
   - Add subtle animations for state changes
   - Implement hover effects for interactive elements
   - Use CSS transitions for smooth interactions

Focus on maintainable code with proper TypeScript types and component composition.`,
    bolt: `## UX Enhancement Request for Bolt.new

Create an improved version of the current component with these evidence-based UX enhancements:

### 🎯 **Visual Hierarchy**
- Implement consistent typography scale (h1-h6, body text)
- Improve spacing using 8px grid system
- Enhance color contrast for better readability
- Use visual weight to guide user attention

### ♿ **Accessibility Improvements**
- Add semantic HTML structure
- Implement keyboard navigation support
- Include ARIA labels and descriptions
- Ensure color contrast meets WCAG guidelines

### ⏳ **Loading & Feedback States**
- Add skeleton loading components
- Implement progress indicators
- Show immediate feedback for user actions
- Handle empty and error states gracefully

### 🔧 **Error Handling**
- Create informative error messages
- Provide recovery action suggestions
- Implement error boundaries
- Add form validation feedback

### 📱 **Mobile Responsiveness**
- Optimize touch targets (min 44px)
- Implement mobile-first responsive design
- Test across device breakpoints
- Ensure gesture support where appropriate

### ✨ **Micro-interactions**
- Add smooth transitions and animations
- Implement hover and focus states
- Use CSS transforms for performance
- Create delightful interaction feedback

Please maintain existing functionality while applying these improvements using modern React patterns and TypeScript.`,
    vercel: `# UX Improvement Specification for v0

Transform the current interface with science-backed UX enhancements:

## Visual Design System
- **Typography**: Implement consistent type scale with proper hierarchy
- **Spacing**: Use systematic spacing (4px, 8px, 16px, 24px, 32px)
- **Color**: Ensure AAA contrast ratios for text
- **Layout**: Apply consistent grid system

## Accessibility Foundation
- **Semantic HTML**: Use proper heading structure and landmarks
- **Keyboard Navigation**: Support tab order and focus management  
- **Screen Readers**: Add descriptive ARIA labels and live regions
- **Color Independence**: Don't rely solely on color for meaning

## Performance & Feedback
- **Loading States**: Implement skeleton screens and spinners
- **Progress Indicators**: Show completion status for multi-step processes
- **Immediate Feedback**: Acknowledge user actions instantly
- **Error Recovery**: Provide clear paths to resolve issues

## Mobile Experience
- **Touch Targets**: Minimum 44px tap areas
- **Responsive Layout**: Mobile-first responsive design
- **Gesture Support**: Swipe, pinch, and scroll interactions
- **Safe Areas**: Respect device-specific UI boundaries

## Interactive Polish
- **Transitions**: Smooth 200-300ms animations
- **Hover States**: Clear interactive element feedback
- **Focus Indicators**: Visible focus rings for accessibility
- **State Changes**: Animated transitions between states

Generate clean, performant React components with TypeScript support and modern CSS practices.`,
    replit: `"""
UX Enhancement Script for Replit

Improve the current component with research-backed UX principles
"""

# UX IMPROVEMENT CHECKLIST

## 1. VISUAL HIERARCHY
- [ ] Implement consistent typography scale
- [ ] Apply proper spacing system (8px baseline)
- [ ] Enhance color contrast ratios
- [ ] Create clear information architecture

## 2. ACCESSIBILITY COMPLIANCE
- [ ] Add semantic HTML structure
- [ ] Implement keyboard navigation
- [ ] Include ARIA attributes
- [ ] Test with screen reader compatibility

## 3. USER FEEDBACK SYSTEMS
- [ ] Add loading states for async operations
- [ ] Implement progress indicators
- [ ] Create informative error messages
- [ ] Show success confirmations

## 4. RESPONSIVE BEHAVIOR
- [ ] Mobile-first responsive design
- [ ] Touch-friendly interface elements
- [ ] Appropriate breakpoint handling
- [ ] Cross-device testing

## 5. INTERACTION DESIGN
- [ ] Smooth animations and transitions
- [ ] Clear hover and focus states
- [ ] Intuitive micro-interactions
- [ ] Consistent interaction patterns

## IMPLEMENTATION NOTES:
- Use React functional components with hooks
- Apply TypeScript for type safety
- Follow modern CSS practices
- Maintain existing functionality
- Test across different screen sizes
- Ensure backward compatibility

Execute these improvements while preserving all current features and maintaining code quality standards.`,
    magic: `{
  "ux_improvement_request": {
    "target": "Enhanced User Experience Implementation",
    "frameworks": ["React", "TypeScript", "Tailwind CSS"],
    "improvements": {
      "visual_hierarchy": {
        "typography": "Implement consistent type scale with proper heading structure",
        "spacing": "Apply systematic spacing using 8px grid system",
        "contrast": "Ensure WCAG AA color contrast ratios",
        "focal_points": "Use visual weight to guide user attention"
      },
      "accessibility": {
        "semantic_html": "Use proper HTML5 semantic elements",
        "keyboard_nav": "Ensure full keyboard accessibility",
        "aria_labels": "Add comprehensive ARIA attributes",
        "screen_reader": "Optimize for assistive technologies"
      },
      "loading_states": {
        "skeleton_screens": "Implement content placeholders",
        "progress_bars": "Show operation progress",
        "spinner_components": "Add loading indicators",
        "feedback_loops": "Provide immediate user feedback"
      },
      "error_handling": {
        "user_friendly_messages": "Clear, actionable error text",
        "recovery_paths": "Provide solutions for error states",
        "validation_feedback": "Real-time form validation",
        "fallback_ui": "Graceful degradation patterns"
      },
      "responsive_design": {
        "mobile_first": "Start with mobile layout design",
        "touch_targets": "Minimum 44px interactive elements",
        "breakpoint_testing": "Test across device sizes",
        "content_priority": "Progressive disclosure on small screens"
      },
      "micro_interactions": {
        "animations": "Subtle 200-300ms transitions",
        "hover_effects": "Clear interactive feedback",
        "state_changes": "Smooth component state transitions",
        "loading_animations": "Engaging wait states"
      }
    },
    "output_requirements": {
      "maintain_functionality": true,
      "typescript_support": true,
      "component_composition": true,
      "performance_optimized": true,
      "cross_browser_compatible": true
    }
  }
}`,
    sitebrew: `<!-- UX Enhancement Brief for sitebrew.ai -->

<ux-improvement-specification>
  <project-context>
    Enhance existing React component with evidence-based UX improvements
  </project-context>

  <enhancement-goals>
    <visual-hierarchy>
      - Establish clear typographic hierarchy (H1-H6, body, captions)
      - Implement consistent spacing system (4px, 8px, 16px, 24px, 32px)
      - Optimize color contrast for accessibility (WCAG AA/AAA)
      - Create visual flow that guides user attention
    </visual-hierarchy>

    <accessibility-standards>
      - Semantic HTML structure with proper landmarks
      - Complete keyboard navigation support
      - Comprehensive ARIA labeling
      - Screen reader optimization
      - Focus management and visible focus indicators
    </accessibility-standards>

    <user-feedback-systems>
      - Skeleton loading states for content
      - Progress indicators for multi-step processes  
      - Immediate feedback for user actions
      - Clear error messages with recovery suggestions
      - Success confirmations and status updates
    </user-feedback-systems>

    <responsive-experience>
      - Mobile-first responsive design approach
      - Touch-optimized interface (44px minimum targets)
      - Fluid layouts across breakpoints
      - Content prioritization for small screens
    </responsive-experience>

    <interaction-polish>
      - Smooth transitions (200-300ms duration)
      - Hover and focus state styling
      - Micro-animations for state changes
      - Consistent interaction patterns
    </interaction-polish>
  </enhancement-goals>

  <technical-requirements>
    - Maintain all existing functionality
    - Use React functional components with hooks
    - TypeScript for type safety
    - Modern CSS practices (Flexbox/Grid)
    - Performance-optimized implementation
  </technical-requirements>

  <deliverables>
    Enhanced component with improved usability, accessibility, and visual polish while preserving current features and maintaining code quality.
  </deliverables>
</ux-improvement-specification>`
  };

  const promptText = platformPrompts[selectedPlatform as keyof typeof platformPrompts];

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(codeSnippets[selectedFramework as keyof typeof codeSnippets]);
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
      await navigator.clipboard.writeText(promptText);
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

  useEffect(() => {
    setLoading(true);
    setError(null);
    setProgressLog([]);
    setAnalysis(null);

    // Set up streaming analysis via EventSource
    const urlParam = url.startsWith('http') ? url : `https://${url}`;
    const es = new EventSource(`${MAIN_API_BASE}/extract-features?url=${encodeURIComponent(urlParam)}&stream=true`, {
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
      let errorMsg = 'Connection lost or server error.';
      if (event.data) {
        try {
          const data = JSON.parse(event.data);
          if (data.error) errorMsg = data.error;
        } catch {}
      }
      setError(errorMsg);
      setLoading(false);
      es.close();
    });
    es.addEventListener('result', (event: MessageEvent) => {
      const data = JSON.parse(event.data);
      let parsed = data;
      // If this is a full OpenRouter response, parse the content string
      if (data.choices && data.choices[0]?.message?.content) {
        try {
          parsed = JSON.parse(data.choices[0].message.content);
        } catch (e) {
          setError('Failed to parse analysis content as JSON.');
          setLoading(false);
          es.close();
          return;
        }
      }
      setAnalysis(parsed);
      setLoading(false);
      if (parsed.screenshot_id) {
        setScreenshotUrl(`${SCREENSHOT_API_BASE}/screenshot/${parsed.screenshot_id}`);
      } else if (parsed.screenshot_url) {
        setScreenshotUrl(parsed.screenshot_url);
      } else {
        setScreenshotUrl(null);
      }
      // Initialize statuses
      if (parsed.sections) {
        const initialStatuses: Record<string, Status> = {};
        parsed.sections.forEach((section: any, idx: number) => {
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

  if (loading || !analysis) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="w-full max-w-xl bg-muted/40 rounded-lg p-4 animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/2 mb-4" />
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-2" />
          <div className="h-6 bg-gray-200 rounded w-2/3 mb-2" />
          <div className="h-6 bg-gray-200 rounded w-1/4 mb-2" />
          <div className="h-32 bg-gray-100 rounded w-full mb-4" />
        </div>
        <p className="text-lg text-muted-foreground mt-4">Loading analysis...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <p className="text-lg text-red-500">{error}</p>
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
            <div className="max-w-2xl mx-auto pt-8">
              <Accordion type="multiple" className="mb-8">
              <AccordionItem value="global-design" className="border-b">
                <AccordionTrigger className="flex flex-1 items-center justify-between py-4 font-medium transition-all hover:underline">Global Design System</AccordionTrigger>
                <AccordionContent className="overflow-hidden text-sm transition-all data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down"><div className="pb-4 pt-0"><GlobalDesignSummary summary={analysis.global_design_summary} /></div></AccordionContent>
              </AccordionItem>
              <AccordionItem value="ux-architecture">
                <AccordionTrigger>UX Architecture</AccordionTrigger>
                <AccordionContent>
                  <UxArchitecture architecture={analysis.ux_architecture} />
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="business-analysis">
                <AccordionTrigger>Business & Audience</AccordionTrigger>
                <AccordionContent>
                  <BusinessAnalysis analysis={analysis.business_analysis} />
                </AccordionContent>
              </AccordionItem>
            </Accordion>

            {/* UI Section Cards in Tabs */}
            <Tabs value={uiSubTab} onValueChange={v => setUiSubTab(v as SubTab)} className="mb-8">
              <TabsList className="inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground">
                <TabsTrigger value="all" className="inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm">All</TabsTrigger>
                <TabsTrigger value="rejected" className="inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm">Rejected</TabsTrigger>
                <TabsTrigger value="improved" className="inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm">Improved</TabsTrigger>
              </TabsList>
              <TabsContent value="all">
                <SectionList
                  analysis={analysis}
                  handleStatusChange={handleStatusChange}
                  componentStatuses={componentStatuses}
                  filterStatus={null}
                />
              </TabsContent>
              <TabsContent value="rejected">
                <SectionList
                  analysis={analysis}
                  handleStatusChange={handleStatusChange}
                  componentStatuses={componentStatuses}
                  filterStatus="rejected"
                />
              </TabsContent>
              <TabsContent value="improved">
                <SectionList
                  analysis={analysis}
                  handleStatusChange={handleStatusChange}
                  componentStatuses={componentStatuses}
                  filterStatus="improved"
                />
              </TabsContent>
            </Tabs>
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