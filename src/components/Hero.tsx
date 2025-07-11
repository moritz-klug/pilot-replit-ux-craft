import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Paperclip, Sparkles, CheckCircle, Camera, Bot, ServerCrash, XCircle, ChevronDown } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { motion } from 'framer-motion';
import { analyzeWithScreenshot } from '../services/featureExtractionService';
import { useContext } from 'react';
import { UITestModeContext } from '../App';
import { AiInput } from "@/components/ui/ai-input";
import { Particles } from "@/components/ui/particles";
import { ShiningText } from "@/components/ui/shining-text";
import { Loader } from "@/components/ui/loader";

interface AnalysisStep {
  message: string;
  timestamp: number;
}

export const Hero = () => {
  const [url, setUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [analysisLog, setAnalysisLog] = useState<string[]>([]);
  const [finalAnalysis, setFinalAnalysis] = useState<any>(null);
  const [screenshotId, setScreenshotId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();
  const uiTest = useContext(UITestModeContext).uiTest;

  const handleAnalyze = async () => {
    if (!url) {
      toast({
        title: 'URL is required',
        description: 'Please enter a website URL to analyze.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    setAnalysisLog([]);
    setFinalAnalysis(null);
    setScreenshotId(null);
    setError(null);

    if (uiTest) {
      // Simulate progress log in UI Test Mode
      const steps = [
        '📸 Requesting screenshot...',
        '⏳ Waiting for screenshot to be ready...',
        '✅ Screenshot ready. Sending to LLM...',
        '🤖 Waiting for LLM analysis...',
        '✨ Analysis complete!'
      ];
      for (let i = 0; i < steps.length; i++) {
        setAnalysisLog(prev => [...prev, steps[i]]);
        // eslint-disable-next-line no-await-in-loop
        await new Promise(r => setTimeout(r, 500));
      }
      const mockAnalysis = await analyzeWithScreenshot({ url: url });
      setFinalAnalysis(mockAnalysis);
      setScreenshotId('mock123');
      setIsLoading(false);
      navigate('/feature-review', { state: { analysis: mockAnalysis, screenshotId: 'mock123', url } });
      return;
    }

    try {
      // Build the full request body for analysis
      const requestBody = {
        model: "mistralai/mistral-small-3.2-24b-instruct",
        stream: false,
        structured_outputs: true,
        require_parameters: true,
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "ui_ux_site_analysis",
            strict: true,
            schema: {
              type: "object",
              properties: {
                url: {
                  type: "string",
                  description: "The full URL of the website analyzed"
                },
                visual_analysis: {
                  type: "object",
                  properties: {
                    ui_sections: {
                      type: "array",
                      items: { type: "string" },
                      description: "List of UI section names in order of appearance"
                    }
                  },
                  required: ["ui_sections"],
                  additionalProperties: false
                },
                sections: {
                  type: "array",
                  description: "List of cropped UI sections with detailed analysis",
                  items: {
                    type: "object",
                    properties: {
                      name: { type: "string", description: "Section name" },
                      elements: { type: "array", items: { type: "string" } },
                      purpose: { type: "string" },
                      style: {
                        type: "object",
                        properties: {
                          fonts: { type: "string" },
                          colors: { type: "string" },
                          layout: { type: "string" },
                          interactions: { type: "string" },
                          css_properties: {
                            type: "object",
                            description: "Raw CSS properties used in this section",
                            additionalProperties: false
                          }
                        },
                        required: ["fonts", "colors", "layout", "interactions", "css_properties"],
                        additionalProperties: false
                      },
                      mobile_behavior: { type: "string" },
                      image_crop_url: { type: "string", description: "Image URL of the cropped UI section" }
                    },
                    required: ["name", "elements", "purpose", "style", "mobile_behavior", "image_crop_url"],
                    additionalProperties: false
                  }
                },
                global_design_summary: {
                  type: "object",
                  properties: {
                    typography: { type: "string" },
                    colors: { type: "string" },
                    buttons: { type: "string" },
                    layout: { type: "string" },
                    icons: { type: "string" },
                    css_properties: {
                      type: "object",
                      description: "CSS properties applied globally (e.g., body, :root, html)",
                      additionalProperties: false
                    }
                  },
                  required: ["typography", "colors", "buttons", "layout", "icons", "css_properties"],
                  additionalProperties: false
                },
                ux_architecture: {
                  type: "object",
                  properties: {
                    page_flow: { type: "string" },
                    emotional_strategy: { type: "string" },
                    conversion_points: { type: "string" },
                    design_trends: { type: "string" }
                  },
                  required: ["page_flow", "emotional_strategy", "conversion_points", "design_trends"],
                  additionalProperties: false
                },
                business_analysis: {
                  type: "object",
                  properties: {
                    summary: { type: "string" },
                    business_type: { type: "string" },
                    target_audience: { type: "string" },
                    keywords: { type: "array", items: { type: "string" } }
                  },
                  required: ["summary", "business_type", "target_audience", "keywords"],
                  additionalProperties: false
                }
              },
              required: [
                "url",
                "visual_analysis",
                "sections",
                "global_design_summary",
                "ux_architecture",
                "business_analysis"
              ],
              additionalProperties: false
            }
          }
        },
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `You are an advanced UI/UX analyst, visual design expert, and business intelligence extractor. Given the screenshot and/or webpage - ${url}, analyze the entire website UI using this flow:\n\n1. Visual Analysis & Cropping\nDetect distinct UI sections and label them clearly.\nReturn image_crop_url per section (use the provided image as source).\n\n2. Detailed Per-Section Structured Breakdown\nFor each section:\n- name\n- elements\n- purpose\n- Under style, return actual CSS property-value mappings (e.g., font-size: 36px, background-color: #ffffff, padding: 2rem). Use a css_properties object where keys are CSS property names and values are the actual values as seen in the design.\n- mobile_behavior\n- image_crop_url\n\n3. Detailed Global Design System Summary\nInclude css styles, return actual CSS property-value mappings (e.g., font-size: 36px, background-color: #ffffff, padding: 2rem). Use a css_properties object where keys are CSS property names and values are the actual values as seen in the design.\n\n4. Detailed UX Architecture & Interaction Patterns\nExplain the site journey, emotional strategy, conversion points, and design trends.\n\n5. Detailed Business & Audience Analysis\nWhat is the site about? Business type? Target audience? Extract 10–20 keywords from hero, menu, services, etc.\n\nOnly return response in json_schema given in the response format.`
              }
            ]
          }
        ],
        url: url,
        screenshot: false
      };
      const analysis = await analyzeWithScreenshot(requestBody);
      setFinalAnalysis(analysis);
      setIsLoading(false);
      navigate('/feature-review', { state: { analysis, url } });
    } catch (e) {
      console.error('Failed to fetch analysis:', e);
      setError('Failed to connect to the server. Is it running?');
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    if (finalAnalysis && screenshotId) {
      navigate('/feature-review', { state: { analysis: finalAnalysis, screenshotId: screenshotId, url: url } });
    }
  }, [finalAnalysis, screenshotId, navigate, url]);

  return (
    <section className="relative w-full h-[80vh] flex flex-col items-center justify-center text-center px-4">
      {/* Particle Background */}
      <div className="absolute inset-0 z-0">
        <Particles quantity={200} className="h-full w-full" color="#000000" />
      </div>
      
      <div className="max-w-4xl mx-auto text-center relative z-10">
        <h1 className="text-4xl md:text-5xl font-bold mb-6 leading-tight max-w-3xl mx-auto">
          Paste a link, get instant UX science.
        </h1>
        
        <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
          Get evidence-backed recommendations to improve your website's user experience. 
          Our analysis is based on proven UX principles and research.
        </p>
        
        <div className="max-w-4xl mx-auto mb-12">
          {!isLoading ? (
            <AiInput
              value={url}
              onChange={setUrl}
              onSubmit={handleAnalyze}
              disabled={isLoading}
            />
          ) : (
            <Card className="w-full max-w-2xl text-left">
              <CardContent className="p-6">
                <div className="flex items-center mb-4">
                  <Sparkles className="w-5 h-5 mr-3 text-primary" />
                  <ShiningText text="Live Analysis Log" />
                </div>
                <p className="font-mono text-sm text-left">
                  {analysisLog.map((log, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.1 }}
                      className="flex items-center gap-2"
                    >
                        {log.startsWith('✅') || log.startsWith('✨') ? <CheckCircle className="h-4 w-4 text-green-500" /> : 
                         log.startsWith('❌') ? <XCircle className="h-4 w-4 text-red-500" /> :
                         <Loader size="sm" className="text-primary" />
                        }
                      <span>{log}</span>
                    </motion.div>
                  ))}
                </p>
                {error && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex items-center gap-2 mt-2 text-red-500"
                    >
                        <ServerCrash className="h-4 w-4" />
                        <span className="font-mono text-sm text-left">{error}</span>
                    </motion.div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
        
        <p className="text-xs text-muted-foreground">
          Built with accessibility in mind and strict respect for your data privacy.
        </p>
        
        {/* Bouncing scroll indicator */}
        <motion.div
          animate={{ y: [0, 6, 0] }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="mt-8 opacity-40"
        >
          <ChevronDown className="w-10 h-10 mx-auto text-muted-foreground" />
        </motion.div>
      </div>
    </section>
  );
};

export default Hero;
