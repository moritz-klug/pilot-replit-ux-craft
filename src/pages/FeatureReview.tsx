import React, { useEffect, useState, useRef, useContext } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Copy, Check } from 'lucide-react';
import { useToast } from '../hooks/use-toast';
import { CodeBlock, CodeBlockCode, CodeBlockGroup } from '../components/ui/code-block';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../components/ui/accordion';
import { SocialCard } from '../components/ui/social-card';
import { cn } from '../lib/utils';
import AnimatedLoadingSkeleton from '../components/ui/animated-loading-skeleton';
import FeatureChatbot from '../components/FeatureChatbot';

const DEMO_MODE = false;
const SCREENSHOT_API_BASE = 'http://localhost:8001';
const MAIN_API_BASE = 'http://localhost:8000';

const STATUS_OPTIONS = ['rejected', 'improved'] as const;
type Status = typeof STATUS_OPTIONS[number];

const SUBTABS = ['all', 'rejected', 'improved'] as const;
type SubTab = typeof SUBTABS[number];

const CHATBOT_TABS = ['mockups', 'improvements', 'sources'] as const;
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
  const [currentFeatureDescription, setCurrentFeatureDescription] = useState<string | null>(null);
  const [chatbotTab, setChatbotTab] = useState<ChatbotTab>('mockups');
  const [chatHistory, setChatHistory] = useState([]);
  
  // Results page functionality
  const [selectedFramework, setSelectedFramework] = useState('react');
  const [selectedPlatform, setSelectedPlatform] = useState('lovable');
  const [codeCopied, setCodeCopied] = useState(false);
  const [promptCopied, setPromptCopied] = useState(false);
  const { toast } = useToast();

  const [reactCode, setReactCode] = useState('');
  const [vueCode, setVueCode] = useState('');
  const [angularCode, setAngularCode] = useState('');
  const [lovablePrompt, setLovablePrompt] = useState('');
  const [cursorPrompt, setCursorPrompt] = useState('');
  const [boltPrompt, setBoltPrompt] = useState('');
  const [vercelPrompt, setVercelPrompt] = useState('');
  const [replitPrompt, setReplitPrompt] = useState('');
  const [magicPrompt, setMagicPrompt] = useState('');
  const [sitebrewPrompt, setSitebrewPrompt] = useState('');

  // Code snippets from Results page
  const codeSnippets = {
    react: reactCode ||`import React from 'react';

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
    vue: vueCode || `<template>
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
    angular: angularCode || `import { Component } from '@angular/core';

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
    lovable: lovablePrompt || `Please implement the following science-based UX improvements for my application:

1. **Visual Hierarchy**: Improve the visual hierarchy by adjusting font sizes, spacing, and color contrast to guide user attention effectively.

2. **Accessibility Enhancements**: Ensure all interactive elements are keyboard accessible and have proper ARIA labels for screen readers.

3. **Loading States**: Add skeleton loaders and progress indicators to provide feedback during data loading.

4. **Error Handling**: Implement user-friendly error messages with clear action steps for recovery.

5. **Responsive Design**: Optimize the layout for mobile devices with appropriate touch targets and spacing.

6. **Micro-interactions**: Add subtle animations and hover effects to provide visual feedback for user actions.

Please apply these improvements while maintaining the existing functionality and ensuring the code follows best practices for React and TypeScript.`,
    cursor: cursorPrompt || `// UX Improvement Instructions for Cursor AI IDE

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
    bolt: boltPrompt || `## UX Enhancement Request for Bolt.new

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
    vercel: vercelPrompt || `# UX Improvement Specification for v0

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
    replit: replitPrompt || `"""
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
    magic: magicPrompt || `{
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
    sitebrew: sitebrewPrompt || `<!-- UX Enhancement Brief for sitebrew.ai -->

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
        setCurrentFeatureDescription(section.description || section.purpose || 'No design description available');
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

  const handleChatUpdate = (newChatHistory: Array<{ text: string; isUser: boolean; id: string }>) => {
    setChatHistory(newChatHistory);
  };

  const [lastChatLength, setLastChatLength] = useState(0);
  const [isTyping, setIsTyping] = useState(false);
  const [isFetching, setIsFetching] = useState(false);

  // Effect to fetch code/prompt when needed
  React.useEffect(() => {
    if (chatbotTab === 'improvements' && chatHistory.length > 0 && currentChatFeature && currentFeatureDescription && !isFetching) {
      const hasUserMessages = chatHistory.some(msg => msg.isUser);
      const hasNewChat = chatHistory.length > lastChatLength;
      if (hasUserMessages && hasNewChat && !isTyping) {
        fetchCodeAndPrompt(chatHistory);
      }
    }
  }, [chatbotTab, chatHistory, lastChatLength, isTyping, isFetching, currentChatFeature, currentFeatureDescription]);

  const fetchCodeAndPrompt = async (chatHistory: Array<{ text: string; isUser: boolean; id: string }>) => {
    if (isFetching) return;
    setIsFetching(true);

    try {
      const latestRecommendation = chatHistory
        .filter(msg => !msg.isUser)
        .pop()?.text || "No LLM response available";
      
      const requestBody = {
        featureName: currentChatFeature,
        currentDesign: currentFeatureDescription,
        latestRecommendation: latestRecommendation
      };
      
      const response = await fetch(`${MAIN_API_BASE}/recommendation-prompt-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch code and prompt');
      }

      const data = await response.json();

      const decodeBase64 = (encoded: string): string => {
        try {
          return atob(encoded);
        } catch (e) {
          console.warn('Failed to decode base64, using as-is:', e);
          return encoded;
        }
      };
      

      setReactCode(decodeBase64(data.react_code) || '');
      setVueCode(decodeBase64(data.vue_code) || '');
      setAngularCode(decodeBase64(data.angular_code) || '');
      setLovablePrompt(data.lovable_prompt || '');
      setCursorPrompt(data.cursor_prompt || '');
      setBoltPrompt(data.bolt_prompt || '');
      setVercelPrompt(data.vercel_prompt || '');
      setReplitPrompt(data.replit_prompt || '');
      setMagicPrompt(data.magic_prompt || '');
      setSitebrewPrompt(data.sitebrew_prompt || '');
      
      setLastChatLength(chatHistory.length);
      
    } catch (error) {
      console.error('Error fetching code and prompt:', error);
    } finally {
      setIsFetching(false);
      setLastChatLength(chatHistory.length);
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
            {tab === 'chatbot' ? (
              // Full width layout for chatbot
              <div className="h-[calc(100vh-8rem)]">
                {/* Chatbot Content */}
                <div className="flex gap-4 h-full">
                  <div className="w-1/2 h-full">
                    <FeatureChatbot 
                    featureName={currentChatFeature}
                    onChatUpdate={handleChatUpdate}
                    onTypingChange={setIsTyping}
                    />
                  </div>
                  <div className="w-1/2 bg-gray-100 rounded-lg h-full p-4">
                    {/* Chatbot Tab Design */}
                    <div className="flex justify-center mb-6">
                      <div className="flex items-center gap-3 bg-background/5 backdrop-blur-lg py-1 px-1 rounded-full shadow-lg">
                        {CHATBOT_TABS.map((chatTab) => {
                          const isActive = chatbotTab === chatTab;
                          return (
                            <button
                              key={chatTab}
                              onClick={() => setChatbotTab(chatTab as ChatbotTab)}
                              className={cn(
                                "relative cursor-pointer text-sm font-semibold px-6 py-2 rounded-full transition-colors",
                                "text-foreground/80 hover:text-primary",
                                isActive && "bg-muted text-primary",
                              )}
                            >
                              {chatTab.charAt(0).toUpperCase() + chatTab.slice(1)}
                              {isActive && (
                                <motion.div
                                  layoutId="chatbot-lamp"
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
                    
                    {/* Tab Content */}
                    <div className="h-[calc(100%-5rem)]">
                      {chatbotTab === 'mockups' && <div className="h-full p-4 bg-white/50 rounded-lg">Mockups content coming soon...</div>}
                      {chatbotTab === 'improvements' && (
                        <div className="h-full overflow-y-auto">
                          <h3 className="text-xl font-bold mb-4 text-center">UX Improvement Results</h3>
                          
                          <Tabs defaultValue="code" className="w-full">
                            <TabsList className="grid w-full grid-cols-2 mb-4">
                              <TabsTrigger value="code">Code</TabsTrigger>
                              <TabsTrigger value="prompt">Prompt</TabsTrigger>
                            </TabsList>
                            
                            <TabsContent value="code" className="space-y-4">
                              <Card>
                                <CardHeader>
                                  <CardTitle>Implementation Code</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                  <div className="flex items-center gap-4">
                                    <Select value={selectedFramework} onValueChange={setSelectedFramework}>
                                      <SelectTrigger className="w-48">
                                        <SelectValue placeholder="Select framework" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="react">React</SelectItem>
                                        <SelectItem value="vue">Vue</SelectItem>
                                        <SelectItem value="angular">Angular</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>
                                  <CodeBlock>
                                    <CodeBlockGroup className="border-border border-b py-2 pr-2 pl-4">
                                      <div className="flex items-center gap-2">
                                        <div className="bg-primary/10 text-primary rounded px-2 py-1 text-xs font-medium">
                                          {selectedFramework.charAt(0).toUpperCase() + selectedFramework.slice(1)}
                                        </div>
                                        <span className="text-muted-foreground text-sm">component.{selectedFramework === 'react' ? 'tsx' : selectedFramework === 'vue' ? 'vue' : 'ts'}</span>
                                      </div>
                                      <Button onClick={handleCopyCode} variant="ghost" size="icon" className="h-8 w-8">
                                        {codeCopied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                                      </Button>
                                    </CodeBlockGroup>
                                    <CodeBlockCode 
                                      code={codeSnippets[selectedFramework as keyof typeof codeSnippets]} 
                                      language={selectedFramework === 'angular' ? 'typescript' : selectedFramework === 'react' ? 'tsx' : selectedFramework}
                                      theme="github-light"
                                    />
                                  </CodeBlock>
                                  
                                  <div className="mt-6 p-4 bg-blue-50 rounded-md">
                                    <h3 className="font-semibold mb-2">Integration Instructions:</h3>
                                    <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
                                      <li>Copy the code snippet above and integrate it into your project</li>
                                      <li>Ensure you have the necessary dependencies installed (Tailwind CSS for styling)</li>
                                      <li>Customize the component according to your specific requirements</li>
                                      <li>Test the implementation across different devices and screen sizes</li>
                                    </ul>
                                  </div>
                                </CardContent>
                              </Card>
                            </TabsContent>
                            
                            <TabsContent value="prompt" className="space-y-4">
                              <Card>
                                <CardHeader>
                                   <CardTitle>
                                     AI Development Prompt
                                   </CardTitle>
                                </CardHeader>
                                <CardContent>
                                  <div className="flex items-center gap-4 mb-4">
                                    <Select value={selectedPlatform} onValueChange={setSelectedPlatform}>
                                      <SelectTrigger className="w-48">
                                        <SelectValue placeholder="Select platform" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="lovable">Lovable</SelectItem>
                                        <SelectItem value="cursor">Cursor (or any AI IDE)</SelectItem>
                                        <SelectItem value="bolt">Bolt.new (Partnership)</SelectItem>
                                        <SelectItem value="vercel">v0 by Vercel</SelectItem>
                                        <SelectItem value="replit">Replit</SelectItem>
                                        <SelectItem value="magic">Magic Patterns</SelectItem>
                                        <SelectItem value="sitebrew">sitebrew.ai</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>
                                  <CodeBlock>
                                    <CodeBlockGroup className="border-border border-b py-2 pr-2 pl-4">
                                      <div className="flex items-center gap-2">
                                        <div className="bg-primary/10 text-primary rounded px-2 py-1 text-xs font-medium">
                                          {selectedPlatform.charAt(0).toUpperCase() + selectedPlatform.slice(1)}
                                        </div>
                                        <span className="text-muted-foreground text-sm">prompt.txt</span>
                                      </div>
                                      <Button onClick={handleCopyPrompt} variant="ghost" size="icon" className="h-8 w-8">
                                        {promptCopied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                                      </Button>
                                    </CodeBlockGroup>
                                    <CodeBlockCode 
                                      code={promptText} 
                                      language="text"
                                      theme="github-light"
                                    />
                                  </CodeBlock>
                                  
                                  <div className="space-y-4">
                                    <div className="p-4 bg-green-50 rounded-md">
                                      <h3 className="font-semibold mb-2">How to use this prompt:</h3>
                                      <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
                                        {selectedPlatform === 'lovable' && <li><strong>Lovable:</strong> Paste this prompt in the chat to get AI-powered UX improvements</li>}
                                        {selectedPlatform === 'cursor' && <li><strong>Cursor:</strong> Use this as a comprehensive instruction for code enhancement in your AI IDE</li>}
                                        {selectedPlatform === 'bolt' && <li><strong>Bolt.new:</strong> Copy this prompt to generate improved components with UX enhancements</li>}
                                        {selectedPlatform === 'vercel' && <li><strong>v0 by Vercel:</strong> Use this specification to generate accessible and polished React components</li>}
                                        {selectedPlatform === 'replit' && <li><strong>Replit:</strong> Apply this checklist-style prompt for systematic UX improvements</li>}
                                        {selectedPlatform === 'magic' && <li><strong>Magic Patterns:</strong> Use this JSON specification to generate enhanced UI patterns</li>}
                                        {selectedPlatform === 'sitebrew' && <li><strong>sitebrew.ai:</strong> Apply this XML-formatted brief for comprehensive UX enhancements</li>}
                                      </ul>
                                    </div>
                                    
                                    <div className="p-4 bg-yellow-50 rounded-md">
                                      <h3 className="font-semibold mb-2">Expected Results:</h3>
                                      <p className="text-sm text-gray-700">
                                        This prompt will help AI tools understand the specific UX improvements needed 
                                        and generate code that follows evidence-based design principles, improving 
                                        user experience, accessibility, and overall usability of your application.
                                      </p>
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            </TabsContent>
                          </Tabs>
                        </div>
                      )}
{chatbotTab === 'sources' && (
                        <div className="h-full overflow-y-auto bg-background rounded-lg">
                          <div className="p-6">
                            <h3 className="text-lg font-semibold mb-6 text-foreground">References</h3>
                            <div className="space-y-4">
                              {/* Reference 1 */}
                              <div className="border-l-4 border-primary pl-4 py-3 bg-muted/30 rounded-r-lg">
                                <div className="flex items-start gap-3">
                                  <span className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm font-medium mt-1 shrink-0">1</span>
                                  <div className="flex-1 min-w-0">
                                    <h4 className="font-medium text-foreground hover:text-primary cursor-pointer transition-colors">
                                      The role of artificial intelligence algorithms in information systems research: a conceptual overview and avenues for research
                                      <span className="ml-2 text-primary text-sm">↗</span>
                                    </h4>
                                    <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground flex-wrap">
                                      <span>📄 David Bendig, Antonio Bränunche</span>
                                      <span>•</span>
                                      <span>📊 Management Review Quarterly, June 2024</span>
                                      <span className="bg-green-100 text-green-800 px-2 py-0.5 rounded text-xs">PEER REVIEWED</span>
                                      <span>•</span>
                                      <span>📈 citations 5</span>
                                    </div>
                                    <div className="mt-2 text-sm">
                                      <span className="text-muted-foreground">Contexts: Used </span>
                                      <span className="text-blue-600 underline cursor-pointer hover:text-blue-800">1.1</span>
                                      <span className="text-blue-600 underline cursor-pointer hover:text-blue-800 ml-1">1.2</span>
                                      <span className="text-blue-600 underline cursor-pointer hover:text-blue-800 ml-1">1.3</span>
                                      <span className="text-blue-600 underline cursor-pointer hover:text-blue-800 ml-1">1.4</span>
                                      <span className="text-blue-600 underline cursor-pointer hover:text-blue-800 ml-1">1.5</span>
                                      <span className="text-blue-600 underline cursor-pointer hover:text-blue-800 ml-1">1.6</span>
                                      <span className="text-blue-600 underline cursor-pointer hover:text-blue-800 ml-1">1.7</span>
                                      <span className="text-muted-foreground ml-1">Unused </span>
                                      <span className="text-gray-500 underline cursor-pointer hover:text-gray-700">1.8</span>
                                      <span className="text-gray-500 underline cursor-pointer hover:text-gray-700 ml-1">1.9</span>
                                    </div>
                                  </div>
                                </div>
                              </div>

                              {/* Reference 2 */}
                              <div className="border-l-4 border-primary pl-4 py-3 bg-muted/30 rounded-r-lg">
                                <div className="flex items-start gap-3">
                                  <span className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm font-medium mt-1 shrink-0">2</span>
                                  <div className="flex-1 min-w-0">
                                    <h4 className="font-medium text-foreground hover:text-primary cursor-pointer transition-colors">
                                      Selected Essays on the Role of Emotions in Information Systems Research and Use
                                      <span className="ml-2 text-primary text-sm">↗</span>
                                    </h4>
                                    <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground flex-wrap">
                                      <span>📄 O Hornung</span>
                                      <span>•</span>
                                      <span>📅 2024</span>
                                    </div>
                                    <div className="mt-2 text-sm">
                                      <span className="text-muted-foreground">Contexts: Used </span>
                                      <span className="text-blue-600 underline cursor-pointer hover:text-blue-800">2.1</span>
                                    </div>
                                  </div>
                                </div>
                              </div>

                              {/* Reference 3 */}
                              <div className="border-l-4 border-primary pl-4 py-3 bg-muted/30 rounded-r-lg">
                                <div className="flex items-start gap-3">
                                  <span className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm font-medium mt-1 shrink-0">3</span>
                                  <div className="flex-1 min-w-0">
                                    <h4 className="font-medium text-foreground hover:text-primary cursor-pointer transition-colors">
                                      Selected Essays on the Role of Emotions in Information Systems Research and Use
                                      <span className="ml-2 text-primary text-sm">↗</span>
                                    </h4>
                                    <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground flex-wrap">
                                      <span>📄 O Hornung</span>
                                      <span>•</span>
                                      <span>📅 2024</span>
                                    </div>
                                    <div className="mt-2 text-sm">
                                      <span className="text-muted-foreground">Contexts: Used </span>
                                      <span className="text-blue-600 underline cursor-pointer hover:text-blue-800">3.1</span>
                                    </div>
                                  </div>
                                </div>
                              </div>

                              {/* Reference 4 */}
                              <div className="border-l-4 border-primary pl-4 py-3 bg-muted/30 rounded-r-lg">
                                <div className="flex items-start gap-3">
                                  <span className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm font-medium mt-1 shrink-0">4</span>
                                  <div className="flex-1 min-w-0">
                                    <h4 className="font-medium text-foreground hover:text-primary cursor-pointer transition-colors">
                                      UNDERSTANDING CUSTOMER JOURNEYS: A SYSTEMATIC LITERATURE REVIEW OF AI-POWERED MARKETING PERSONALIZATION
                                      <span className="ml-2 text-primary text-sm">↗</span>
                                    </h4>
                                    <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground flex-wrap">
                                      <span>📄 H Mulyono</span>
                                      <span>•</span>
                                      <span>📅 2024</span>
                                    </div>
                                    <div className="mt-2 text-sm">
                                      <span className="text-muted-foreground">Contexts: Used </span>
                                      <span className="text-blue-600 underline cursor-pointer hover:text-blue-800">4.1</span>
                                      <span className="text-muted-foreground ml-1">Unused </span>
                                      <span className="text-gray-500 underline cursor-pointer hover:text-gray-700">4.2</span>
                                    </div>
                                  </div>
                                </div>
                              </div>

                              {/* Reference 5 */}
                              <div className="border-l-4 border-primary pl-4 py-3 bg-muted/30 rounded-r-lg">
                                <div className="flex items-start gap-3">
                                  <span className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm font-medium mt-1 shrink-0">5</span>
                                  <div className="flex-1 min-w-0">
                                    <h4 className="font-medium text-foreground hover:text-primary cursor-pointer transition-colors">
                                      UNDERSTANDING CUSTOMER JOURNEYS: A SYSTEMATIC LITERATURE REVIEW OF AI-POWERED MARKETING PERSONALIZATION
                                      <span className="ml-2 text-primary text-sm">↗</span>
                                    </h4>
                                    <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground flex-wrap">
                                      <span>📄 H Mulyono</span>
                                      <span>•</span>
                                      <span>📅 2024</span>
                                    </div>
                                    <div className="mt-2 text-sm">
                                      <span className="text-muted-foreground">Contexts: Used </span>
                                      <span className="text-blue-600 underline cursor-pointer hover:text-blue-800">5.1</span>
                                      <span className="text-muted-foreground ml-1">Unused </span>
                                      <span className="text-gray-500 underline cursor-pointer hover:text-gray-700">5.2</span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              // Constrained width layout for other tabs
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
            )}
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