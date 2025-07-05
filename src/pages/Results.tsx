
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Copy, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { CodeBlock, CodeBlockCode, CodeBlockGroup } from '@/components/ui/code-block';

const Results = () => {
  const [selectedFramework, setSelectedFramework] = useState('react');
  const [selectedPlatform, setSelectedPlatform] = useState('lovable');
  const [codeCopied, setCodeCopied] = useState(false);
  const [promptCopied, setPromptCopied] = useState(false);
  const { toast } = useToast();

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-center mb-8">UX Improvement Results</h1>
          
          <Tabs defaultValue="code" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
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
                  <CardTitle className="flex items-center justify-between">
                    AI Development Prompt
                    <Button onClick={handleCopyPrompt} variant="outline" size="sm">
                      {promptCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                      {promptCopied ? 'Copied!' : 'Copy Prompt'}
                    </Button>
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
      </div>
    </div>
  );
};

export default Results;
