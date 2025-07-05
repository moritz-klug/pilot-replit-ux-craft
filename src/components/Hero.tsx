import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Paperclip, Sparkles, CheckCircle, Camera, Bot, ServerCrash, XCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { motion } from 'framer-motion';
import { analyzeWithScreenshot } from '../services/futureHouseService';
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
      const mockAnalysis = await analyzeWithScreenshot(url, uiTest);
      setFinalAnalysis(mockAnalysis);
      setScreenshotId('mock123');
      setIsLoading(false);
      navigate('/feature-review', { state: { analysis: mockAnalysis, screenshotId: 'mock123', url } });
      return;
    }

    try {
      const response = await fetch('http://localhost:8000/analyze-with-screenshot', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url }),
      });

      if (!response.body) {
        throw new Error('Response body is null');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      const processStream = async () => {
        while (true) {
          const { done, value } = await reader.read();
          if (done) {
            setIsLoading(false);
            break;
          }

          const chunk = decoder.decode(value);
          const lines = chunk.split('\n\n');

          lines.forEach(line => {
            if (line.startsWith('event: progress')) {
              const data = JSON.parse(line.substring(line.indexOf('{'), line.lastIndexOf('}') + 1));
              setAnalysisLog(prev => [...prev, data.message]);
            } else if (line.startsWith('event: screenshot_id')) {
              const data = JSON.parse(line.substring(line.indexOf('{'), line.lastIndexOf('}') + 1));
              setScreenshotId(data.screenshot_id);
            } else if (line.startsWith('event: analysis_complete')) {
              const data = JSON.parse(line.substring(line.indexOf('{'), line.lastIndexOf('}') + 1));
              setFinalAnalysis(data);
              setAnalysisLog(prev => [...prev, '✨ Analysis complete!']);
            } else if (line.startsWith('event: error')) {
                const data = JSON.parse(line.substring(line.indexOf('{'), line.lastIndexOf('}') + 1));
                setError(data.error);
                setAnalysisLog(prev => [...prev, `❌ Error: ${data.error}`]);
            }
          });
        }
      };

      await processStream();

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
            <div className="relative flex items-center justify-center">
              <div id="poda" className="relative flex items-center justify-center group">
                <div className="absolute z-[-1] overflow-hidden h-full w-full max-h-[70px] max-w-[640px] rounded-xl blur-[3px] 
                                before:absolute before:content-[''] before:z-[-2] before:w-[999px] before:h-[999px] before:bg-no-repeat before:top-1/2 before:left-1/2 before:-translate-x-1/2 before:-translate-y-1/2 before:rotate-60
                                before:bg-[conic-gradient(#000,#402fb5_5%,#000_38%,#000_50%,#cf30aa_60%,#000_87%)] before:transition-all before:duration-2000
                                group-hover:before:rotate-[-120deg] group-focus-within:before:rotate-[420deg] group-focus-within:before:duration-[4000ms]">
                </div>
                <div className="absolute z-[-1] overflow-hidden h-full w-full max-h-[65px] max-w-[635px] rounded-xl blur-[3px] 
                                before:absolute before:content-[''] before:z-[-2] before:w-[600px] before:h-[600px] before:bg-no-repeat before:top-1/2 before:left-1/2 before:-translate-x-1/2 before:-translate-y-1/2 before:rotate-[82deg]
                                before:bg-[conic-gradient(rgba(0,0,0,0),#18116a,rgba(0,0,0,0)_10%,rgba(0,0,0,0)_50%,#6e1b60,rgba(0,0,0,0)_60%)] before:transition-all before:duration-2000
                                group-hover:before:rotate-[-98deg] group-focus-within:before:rotate-[442deg] group-focus-within:before:duration-[4000ms]">
                </div>
                <div className="absolute z-[-1] overflow-hidden h-full w-full max-h-[63px] max-w-[630px] rounded-lg blur-[2px] 
                                before:absolute before:content-[''] before:z-[-2] before:w-[600px] before:h-[600px] before:bg-no-repeat before:top-1/2 before:left-1/2 before:-translate-x-1/2 before:-translate-y-1/2 before:rotate-[83deg]
                                before:bg-[conic-gradient(rgba(0,0,0,0)_0%,#a099d8,rgba(0,0,0,0)_8%,rgba(0,0,0,0)_50%,#dfa2da,rgba(0,0,0,0)_58%)] before:brightness-140
                                before:transition-all before:duration-2000 group-hover:before:rotate-[-97deg] group-focus-within:before:rotate-[443deg] group-focus-within:before:duration-[4000ms]">
                </div>
                <div className="absolute z-[-1] overflow-hidden h-full w-full max-h-[59px] max-w-[625px] rounded-xl blur-[0.5px] 
                                before:absolute before:content-[''] before:z-[-2] before:w-[600px] before:h-[600px] before:bg-no-repeat before:top-1/2 before:left-1/2 before:-translate-x-1/2 before:-translate-y-1/2 before:rotate-70
                                before:bg-[conic-gradient(#1c191c,#402fb5_5%,#1c191c_14%,#1c191c_50%,#cf30aa_60%,#1c191c_64%)] before:brightness-130
                                before:transition-all before:duration-2000 group-hover:before:rotate-[-110deg] group-focus-within:before:rotate-[430deg] group-focus-within:before:duration-[4000ms]">
                </div>
                <AiInput
                  value={url}
                  onChange={setUrl}
                  onSubmit={handleAnalyze}
                  disabled={isLoading}
                />
              </div>
            </div>
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
      </div>
    </section>
  );
};

export default Hero;
