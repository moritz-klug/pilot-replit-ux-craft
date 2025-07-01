
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Copy, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const Results = () => {
  const [selectedFramework, setSelectedFramework] = useState('react');
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

  const promptText = `Please implement the following science-based UX improvements for my application:

1. **Visual Hierarchy**: Improve the visual hierarchy by adjusting font sizes, spacing, and color contrast to guide user attention effectively.

2. **Accessibility Enhancements**: Ensure all interactive elements are keyboard accessible and have proper ARIA labels for screen readers.

3. **Loading States**: Add skeleton loaders and progress indicators to provide feedback during data loading.

4. **Error Handling**: Implement user-friendly error messages with clear action steps for recovery.

5. **Responsive Design**: Optimize the layout for mobile devices with appropriate touch targets and spacing.

6. **Micro-interactions**: Add subtle animations and hover effects to provide visual feedback for user actions.

Please apply these improvements while maintaining the existing functionality and ensuring the code follows best practices for the chosen framework.`;

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
              <TabsTrigger value="code">Code Tab</TabsTrigger>
              <TabsTrigger value="prompt">Prompt Tab</TabsTrigger>
            </TabsList>
            
            <TabsContent value="code" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Implementation Code</CardTitle>
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
                    <Button onClick={handleCopyCode} variant="outline" size="sm">
                      {codeCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                      {codeCopied ? 'Copied!' : 'Copy Code'}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <pre className="bg-gray-900 text-gray-100 p-4 rounded-md overflow-x-auto">
                    <code>{codeSnippets[selectedFramework as keyof typeof codeSnippets]}</code>
                  </pre>
                  
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
                  <div className="bg-gray-50 p-4 rounded-md mb-4">
                    <pre className="whitespace-pre-wrap text-sm">{promptText}</pre>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="p-4 bg-green-50 rounded-md">
                      <h3 className="font-semibold mb-2">How to use this prompt:</h3>
                      <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
                        <li><strong>Lovable:</strong> Paste this prompt in the chat to get AI-powered UX improvements</li>
                        <li><strong>Cursor:</strong> Use this as a comprehensive instruction for code enhancement</li>
                        <li><strong>Windsurf:</strong> Apply this prompt to guide your UX optimization workflow</li>
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
