
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
  const [codeCopied, setCodeCopied] = useState(false);
  const [promptCopied, setPromptCopied] = useState(false);
  const { toast } = useToast();

  const radioGroupCode = `"use client";

import * as RadioGroupPrimitive from "@radix-ui/react-radio-group";
import * as React from "react";

import { cn } from "@/lib/utils";

const RadioGroup = React.forwardRef<
  React.ElementRef<typeof RadioGroupPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Root>
>(({ className, ...props }, ref) => {
  return <RadioGroupPrimitive.Root className={cn("grid gap-3", className)} {...props} ref={ref} />;
});
RadioGroup.displayName = RadioGroupPrimitive.Root.displayName;

const RadioGroupItem = React.forwardRef<
  React.ElementRef<typeof RadioGroupPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Item>
>(({ className, ...props }, ref) => {
  return (
    <RadioGroupPrimitive.Item
      ref={ref}
      className={cn(
        "aspect-square size-4 rounded-full border border-input shadow-sm shadow-black/5 outline-offset-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring/70 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:border-primary data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground",
        className,
      )}
      {...props}
    >
      <RadioGroupPrimitive.Indicator className="flex items-center justify-center text-current">
        <svg
          width="6"
          height="6"
          viewBox="0 0 6 6"
          fill="currentcolor"
          xmlns="http://www.w3.org/2000/svg"
        >
          <circle cx="3" cy="3" r="3" />
        </svg>
      </RadioGroupPrimitive.Indicator>
    </RadioGroupPrimitive.Item>
  );
});
RadioGroupItem.displayName = RadioGroupPrimitive.Item.displayName;

export { RadioGroup, RadioGroupItem };`;

  const demoCode = `"use client";

import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useId, useState } from "react";

function Component() {
  const id = useId();
  const [selectedValue, setSelectedValue] = useState("on");

  return (
    <div className="inline-flex h-9 rounded-lg bg-input/50 p-0.5 max-w-[400px]">
      <RadioGroup
        value={selectedValue}
        onValueChange={setSelectedValue}
        className="group relative inline-grid grid-cols-[1fr_1fr] items-center gap-0 text-sm font-medium after:absolute after:inset-y-0 after:w-1/2 after:rounded-md after:bg-background after:shadow-sm after:shadow-black/5 after:outline-offset-2 after:transition-transform after:duration-300 after:[transition-timing-function:cubic-bezier(0.16,1,0.3,1)] has-[:focus-visible]:after:outline has-[:focus-visible]:after:outline-2 has-[:focus-visible]:after:outline-ring/70 data-[state=off]:after:translate-x-0 data-[state=on]:after:translate-x-full"
        data-state={selectedValue}
      >
        <label className="relative z-10 inline-flex h-full min-w-8 cursor-pointer select-none items-center justify-center whitespace-nowrap px-4 transition-colors group-data-[state=on]:text-muted-foreground/70">
          Bill Monthly
          <RadioGroupItem id={\`\${id}-1\`} value="off" className="sr-only" />
        </label>
        <label className="relative z-10 inline-flex h-full min-w-8 cursor-pointer select-none items-center justify-center whitespace-nowrap px-4 transition-colors group-data-[state=off]:text-muted-foreground/70">
          <span>
            Bill Yearly{" "}
            <span className="transition-colors group-data-[state=off]:text-muted-foreground/70 group-data-[state=on]:text-emerald-500">
              -20%
            </span>
          </span>
          <RadioGroupItem id={\`\${id}-2\`} value="on" className="sr-only" />
        </label>
      </RadioGroup>
    </div>
  );
}

export { Component };`;

  const installText = `Install NPM dependencies:
\`\`\`bash
@radix-ui/react-radio-group
\`\`\``;

  const handleCopyRadioGroup = async () => {
    try {
      await navigator.clipboard.writeText(radioGroupCode);
      setCodeCopied(true);
      toast({
        title: "Code copied!",
        description: "The radio-group component has been copied to your clipboard.",
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

  const handleCopyDemo = async () => {
    try {
      await navigator.clipboard.writeText(demoCode);
      setPromptCopied(true);
      toast({
        title: "Demo copied!",
        description: "The demo component has been copied to your clipboard.",
      });
      setTimeout(() => setPromptCopied(false), 2000);
    } catch (err) {
      toast({
        title: "Failed to copy",
        description: "Please try copying the demo manually.",
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
              <TabsTrigger value="code">radio-group.tsx</TabsTrigger>
              <TabsTrigger value="prompt">demo.tsx</TabsTrigger>
            </TabsList>
            
            <TabsContent value="code" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    Copy-paste this component to /components/ui folder:
                    <Button onClick={handleCopyRadioGroup} variant="outline" size="sm">
                      {codeCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                      {codeCopied ? 'Copied!' : 'Copy Code'}
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <CodeBlock>
                    <CodeBlockGroup className="border-border border-b py-2 pr-2 pl-4">
                      <div className="flex items-center gap-2">
                        <div className="bg-primary/10 text-primary rounded px-2 py-1 text-xs font-medium">
                          TypeScript
                        </div>
                        <span className="text-muted-foreground text-sm">radio-group.tsx</span>
                      </div>
                    </CodeBlockGroup>
                    <CodeBlockCode 
                      code={radioGroupCode} 
                      language="tsx"
                      theme="github-light"
                    />
                  </CodeBlock>
                  
                  <div className="mt-6 p-4 bg-blue-50 rounded-md">
                    <h3 className="font-semibold mb-2">{installText}</h3>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="prompt" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    Demo Component
                    <Button onClick={handleCopyDemo} variant="outline" size="sm">
                      {promptCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                      {promptCopied ? 'Copied!' : 'Copy Demo'}
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <CodeBlock>
                    <CodeBlockGroup className="border-border border-b py-2 pr-2 pl-4">
                      <div className="flex items-center gap-2">
                        <div className="bg-primary/10 text-primary rounded px-2 py-1 text-xs font-medium">
                          TypeScript
                        </div>
                        <span className="text-muted-foreground text-sm">demo.tsx</span>
                      </div>
                    </CodeBlockGroup>
                    <CodeBlockCode 
                      code={demoCode} 
                      language="tsx"
                      theme="github-light"
                    />
                  </CodeBlock>
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
