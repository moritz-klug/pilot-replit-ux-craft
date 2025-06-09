
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

  return (
    <section className="min-h-screen flex items-center justify-center bg-background relative overflow-hidden px-4">
      <div className="max-w-4xl mx-auto text-center">
        <h1 className="text-5xl md:text-6xl font-bold mb-8 leading-tight">
          Paste a link, get instant UX science.
        </h1>
        
        <div className="max-w-2xl mx-auto mb-16">
          <div className="bg-card rounded-lg border border-border p-4">
            <Input
              placeholder="Enter a public URL to analyze"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="border-0 bg-transparent text-base h-12 focus-visible:ring-0 mb-4 placeholder:text-muted-foreground/60"
            />
            
            <div className="flex flex-wrap gap-2 mb-4">
              <span className="inline-flex items-center px-2 py-1 rounded text-xs bg-red-500/20 text-red-300">
                🛍️ Online shop
              </span>
              <span className="inline-flex items-center px-2 py-1 rounded text-xs bg-yellow-500/20 text-yellow-300">
                📝 Personal blog
              </span>
              <span className="inline-flex items-center px-2 py-1 rounded text-xs bg-purple-500/20 text-purple-300">
                🏃 Waitlist site
              </span>
              <span className="inline-flex items-center px-2 py-1 rounded text-xs bg-yellow-500/20 text-yellow-300">
                💼 Workout tracker
              </span>
              <span className="inline-flex items-center px-2 py-1 rounded text-xs bg-blue-500/20 text-blue-300">
                🤖 AI debate app
              </span>
            </div>
            
            <div className="flex justify-between items-center">
              <Button variant="ghost" size="sm" className="text-muted-foreground text-sm">
                <Paperclip className="h-4 w-4 mr-2" />
                Attach
              </Button>
              <Button 
                onClick={handleAnalysis}
                className="bg-orange-600 hover:bg-orange-700 text-white px-6 py-2"
              >
                Analyze now
              </Button>
            </div>
          </div>
          
          <p className="text-muted-foreground mt-4 text-sm">
            We only support public pages for now.
          </p>
          
          <Button variant="link" className="text-primary hover:text-primary/80 mt-2">
            View sample report
          </Button>
        </div>
        
        <p className="text-xs text-muted-foreground">
          Built with accessibility in mind and strict respect for your data privacy.
        </p>
      </div>
    </section>
  );
};

export default Hero;
