
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Paperclip } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const Hero = () => {
  const [url, setUrl] = useState("");
  const { toast } = useToast();

  const handleAnalysis = () => {
    if (!url) {
      toast({
        title: "Please enter a URL",
        description: "Enter a website URL to start the analysis",
        variant: "destructive",
      });
      return;
    }
    
    toast({
      title: "Analysis started!",
      description: `Analyzing ${url} for UX improvements...`,
    });
  };

  // Tagline options (max 8 words each):
  // 1. "Uncover insights, instantly."
  // 2. "Analyze websites, effortlessly." 
  // 3. "See the unseen, now."
  
  // Button options (max 3 words each):
  // 1. "Start analysis"
  // 2. "Analyze now"

  return (
    <section className="min-h-screen flex items-center justify-center bg-background relative overflow-hidden px-4">
      <div className="max-w-4xl mx-auto text-center">
        <h1 className="text-6xl md:text-7xl font-bold mb-6 leading-tight">
          Uncover insights, instantly.
        </h1>
        
        <p className="text-xl md:text-2xl text-muted-foreground mb-12 max-w-3xl mx-auto leading-relaxed">
          Transform any website into actionable UX recommendations. Describe 
          what you need and our AI Agent analyzes it for you.
        </p>
        
        <div className="max-w-3xl mx-auto mb-8">
          <div className="bg-card rounded-lg border border-border p-4 mb-6">
            <Input
              placeholder="What website would you like to analyze? Start typing or paste a URL..."
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="border-0 bg-transparent text-lg h-12 focus-visible:ring-0 mb-4"
            />
            
            <div className="flex flex-wrap gap-2 mb-4">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-red-500/10 text-red-400">
                🛍️ E-commerce site
              </span>
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-yellow-500/10 text-yellow-400">
                📝 SaaS landing page
              </span>
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-purple-500/10 text-purple-400">
                📱 Mobile app site
              </span>
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-green-500/10 text-green-400">
                💼 Portfolio site
              </span>
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-500/10 text-blue-400">
                🎯 Marketing page
              </span>
            </div>
            
            <div className="flex justify-between items-center">
              <Button variant="ghost" size="sm" className="text-muted-foreground">
                <Paperclip className="h-4 w-4 mr-2" />
                Attach
              </Button>
              <Button 
                onClick={handleAnalysis}
                className="bg-orange-600 hover:bg-orange-700 text-white px-6"
              >
                Start analysis
              </Button>
            </div>
          </div>
          
          <p className="text-muted-foreground mb-4">
            We only support public pages for now.
          </p>
          
          <Button variant="link" className="text-primary hover:text-primary/80">
            View sample report
          </Button>
        </div>
        
        <p className="text-sm text-muted-foreground">
          We prioritize accessibility and data privacy.
        </p>
      </div>
    </section>
  );
};

export default Hero;
