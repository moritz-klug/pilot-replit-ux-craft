import { Navbar1 } from "@/components/ui/navbar-1";
import { Card, CardContent } from "@/components/ui/card";

const About = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar1 />
      
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h1 className="text-4xl font-bold text-foreground mb-6">
              About Auto UI
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              We're revolutionizing web development with AI-powered UX analysis and component generation.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 mb-16">
            <Card>
              <CardContent className="p-8">
                <h2 className="text-2xl font-bold mb-4">Our Mission</h2>
                <p className="text-muted-foreground">
                  To make exceptional user experience accessible to every developer and team through 
                  intelligent automation and evidence-based design principles.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-8">
                <h2 className="text-2xl font-bold mb-4">Our Vision</h2>
                <p className="text-muted-foreground">
                  A world where beautiful, accessible, and performant user interfaces are the 
                  standard, not the exception, powered by AI assistance.
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="text-center">
            <h2 className="text-3xl font-bold mb-8">What We Do</h2>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="p-6">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">🔍</span>
                </div>
                <h3 className="font-semibold mb-2">UX Analysis</h3>
                <p className="text-sm text-muted-foreground">
                  Deep analysis of your interfaces to identify improvement opportunities
                </p>
              </div>
              
              <div className="p-6">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">🚀</span>
                </div>
                <h3 className="font-semibold mb-2">AI Generation</h3>
                <p className="text-sm text-muted-foreground">
                  Generate optimized components and prompts for multiple platforms
                </p>
              </div>
              
              <div className="p-6">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">✨</span>
                </div>
                <h3 className="font-semibold mb-2">Best Practices</h3>
                <p className="text-sm text-muted-foreground">
                  Apply evidence-based design principles and accessibility standards
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default About;