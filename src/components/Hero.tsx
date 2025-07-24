import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Paperclip,
  Sparkles,
  CheckCircle,
  Camera,
  Bot,
  ServerCrash,
  XCircle,
  ChevronDown,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { motion } from 'framer-motion';
import { analyzeWithScreenshot } from '../services/futureHouseService';
import { useContext } from 'react';
import { UITestModeContext, ModelSelectionContext } from '../App';
import { AnimatedAiInput } from '@/components/ui/animated-ai-input';
import { Particles } from '@/components/ui/particles';
import { ShiningText } from '@/components/ui/shining-text';
import { Loader } from '@/components/ui/loader';

interface AnalysisStep {
  message: string;
  timestamp: number;
}

export const Hero = () => {
  const [url, setUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [analysisLog, setAnalysisLog] = useState<string[]>([]);
  const [finalAnalysis, setFinalAnalysis] = useState<any>(null);
  const [screenshotId, setScreenshotId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();
  const uiTest = useContext(UITestModeContext).uiTest;
  const { selectedModel } = useContext(ModelSelectionContext);

  const handleAnalyze = async () => {
    if (!url) {
      toast({
        title: 'URL is required',
        description: 'Please enter a website URL to analyze.',
        variant: 'destructive',
      });
      return;
    }

    if (uiTest) {
      // Simulate progress log in UI Test Mode
      const steps = [
        '📸 Requesting screenshot...',
        '⏳ Waiting for screenshot to be ready...',
        '✅ Screenshot ready. Sending to LLM...',
        '🤖 Waiting for LLM analysis...',
        '✨ Analysis complete!',
      ];
      for (let i = 0; i < steps.length; i++) {
        setAnalysisLog((prev) => [...prev, steps[i]]);
        // eslint-disable-next-line no-await-in-loop
        await new Promise((r) => setTimeout(r, 500));
      }
      const mockAnalysis = await analyzeWithScreenshot(url, uiTest);
      setFinalAnalysis(mockAnalysis);
      setScreenshotId('mock123');
      setIsLoading(false);
      navigate('/feature-review', {
        state: { analysis: mockAnalysis, screenshotId: 'mock123', url },
      });
      return;
    }

    // Check if Reasoning-Pro is selected
    if (selectedModel === 'Reasoning-Pro (wait times 8-15min)') {
      // For Reasoning-Pro, show loading and wait for webhook - DON'T navigate yet
      setIsLoading(true);
      setAnalysisLog([
        '🧠 Reasoning-Pro activated - processing your request...',
      ]);
      // Store the URL globally for the webhook navigation
      (window as any).currentAnalysisUrl = url;
      // The webhook will be triggered from AnimatedAiInput, and when it gets a response,
      // it will navigate to feature-review automatically
      return;
    }

    // For standard mode, navigate immediately
    navigate('/feature-review', { state: { url } });
  };

  useEffect(() => {
    if (finalAnalysis && screenshotId) {
      navigate('/feature-review', {
        state: { analysis: finalAnalysis, screenshotId: screenshotId, url },
      });
    }
  }, [finalAnalysis, screenshotId, navigate, url]);

  return (
    <section className='relative w-full h-[80vh] flex flex-col items-center justify-center text-center px-4'>
      {/* Particle Background */}
      <div className='absolute inset-0 z-0'>
        <Particles quantity={200} className='h-full w-full' color='#000000' />
      </div>

      <div className='max-w-4xl mx-auto text-center relative z-10'>
        <h1 className='text-4xl md:text-5xl font-bold mb-6 leading-tight max-w-3xl mx-auto'>
          Paste a link, get instant UX science.
        </h1>

        <p className='text-lg text-muted-foreground mb-8 max-w-2xl mx-auto'>
          Get evidence-backed recommendations to improve your website's user
          experience. Our analysis is based on proven UX principles and
          research.
        </p>

        <div className='max-w-4xl mx-auto mb-12'>
          {isLoading &&
          selectedModel === 'Reasoning-Pro (wait times 8-15min)' ? (
            <div className='text-center py-8'>
              <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4'></div>
              <p className='text-lg font-medium mb-2'>
                Reasoning-Pro Processing...
              </p>
              <p className='text-sm text-muted-foreground'>
                Advanced AI analysis in progress
              </p>
            </div>
          ) : (
            <AnimatedAiInput
              value={url}
              onChange={setUrl}
              onSubmit={handleAnalyze}
              disabled={isLoading}
            />
          )}
        </div>

        <p className='text-xs text-muted-foreground'>
          Built with accessibility in mind and strict respect for your data
          privacy.
        </p>

        {/* Bouncing scroll indicator */}
        <motion.div
          animate={{ y: [0, 6, 0] }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className='mt-8 opacity-40'
        >
          <ChevronDown className='w-10 h-10 mx-auto text-muted-foreground' />
        </motion.div>
      </div>
    </section>
  );
};

export default Hero;
