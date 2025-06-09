
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Play } from "lucide-react";
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
    <section className="hero-gradient min-h-screen flex items-center relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-20 left-10 w-20 h-20 bg-primary/20 rounded-full blur-xl"></div>
        <div className="absolute top-40 right-20 w-32 h-32 bg-accent/20 rounded-full blur-xl"></div>
        <div className="absolute bottom-20 left-1/4 w-24 h-24 bg-primary/30 rounded-full blur-xl"></div>
      </div>
      
      <div className="container mx-auto px-4 py-20 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
            Analyze any{" "}
            <span className="text-primary">public website</span>
          </h1>
          
          <p className="text-xl md:text-2xl text-muted-foreground mb-12 max-w-3xl mx-auto leading-relaxed">
            Get evidence-backed recommendations to improve your website's user experience.
          </p>
          
          <div className="max-w-2xl mx-auto mb-8">
            <div className="flex flex-col sm:flex-row gap-4 p-2 bg-card rounded-xl border border-border shadow-lg">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5" />
                <Input
                  placeholder="Enter a URL"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="pl-10 border-0 bg-transparent text-lg h-12 focus-visible:ring-0"
                />
              </div>
              <Button 
                onClick={handleAnalysis}
                className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 h-12 text-lg font-medium"
              >
                Start analysis
              </Button>
            </div>
          </div>
          
          <p className="text-muted-foreground mb-6">
            We only support public pages for now.
          </p>
          
          <Button variant="link" className="text-primary hover:text-primary/80">
            See a sample report
          </Button>
        </div>
      </div>
    </section>
  );
};

export default Hero;
