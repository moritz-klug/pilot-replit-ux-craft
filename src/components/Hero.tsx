import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Paperclip, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { extractUIElements } from "@/services/firecrawl";

const Hero = () => {
  const [url, setUrl] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleAnalysis = async () => {
    if (!url) {
      toast({
        title: "Please enter a URL",
        description: "Enter a website URL to start the analysis",
        variant: "destructive",
      });
      return;
    }
    
    setIsAnalyzing(true);
    
    try {
      toast({
        title: "Analysis started!",
        description: `Analyzing ${url} for UX improvements...`,
      });

      // Call Firecrawl API to extract UI elements
      const features = await extractUIElements(url);
      
      // Navigate with both URL and extracted features
      navigate("/feature-review", { 
        state: { 
          url,
          features 
        } 
      });
    } catch (error) {
      console.error('Analysis error:', error);
      toast({
        title: "Analysis failed",
        description: "Failed to analyze the website. Please check the URL and try again.",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <section className="min-h-screen flex items-center justify-center bg-background relative overflow-hidden px-4">
      <div className="max-w-4xl mx-auto text-center">
        <h1 className="text-4xl md:text-5xl font-bold mb-6 leading-tight max-w-3xl mx-auto">
          Paste a link, get instant UX science.
        </h1>
        
        <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
          Create beautiful, modern web applications at the speed of thought. Describe 
          what you need and Replit's AI Agent builds it for you.
        </p>
        
        <div className="max-w-4xl mx-auto mb-12">
          <div className="bg-card/50 backdrop-blur-sm rounded-xl border border-border/50 p-6">
            <Input
              placeholder="Enter a public URL to analyze"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="border-0 bg-transparent text-base h-12 focus-visible:ring-0 mb-4 placeholder:text-muted-foreground/70 text-left"
            />
            
            <div className="flex flex-wrap justify-center gap-2 mb-6">
              <span className="inline-flex items-center px-2 py-1 rounded text-xs bg-red-500/20 text-red-400 border border-red-500/30">
                🛍️ Online shop
              </span>
              <span className="inline-flex items-center px-2 py-1 rounded text-xs bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">
                📝 Personal blog
              </span>
              <span className="inline-flex items-center px-2 py-1 rounded text-xs bg-purple-500/20 text-purple-400 border border-purple-500/30">
                🏃 Waitlist site
              </span>
              <span className="inline-flex items-center px-2 py-1 rounded text-xs bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">
                💼 Workout tracker
              </span>
              <span className="inline-flex items-center px-2 py-1 rounded text-xs bg-blue-500/20 text-blue-400 border border-blue-500/30">
                🤖 AI debate app
              </span>
            </div>
            
            <div className="flex justify-between items-center">
              <Button variant="ghost" size="sm" className="text-muted-foreground text-sm h-10">
                <Paperclip className="h-4 w-4 mr-2" />
                Attach
              </Button>
              <Button 
                onClick={handleAnalysis}
                disabled={isAnalyzing}
                className="bg-orange-600 hover:bg-orange-700 text-white px-8 py-2 h-10 font-medium"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  'Analyze now'
                )}
              </Button>
            </div>
          </div>
        </div>
        
        <p className="text-xs text-muted-foreground">
          Built with accessibility in mind and strict respect for your data privacy.
        </p>
      </div>
    </section>
  );
};

export default Hero;
