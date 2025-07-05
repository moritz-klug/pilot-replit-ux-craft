import { Navbar1 } from "@/components/ui/navbar-1";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";

const Features = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar1 />
      
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h1 className="text-4xl font-bold text-foreground mb-6">
              Powerful Features for Better UX
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Discover all the tools and capabilities that make Auto UI the perfect companion for creating exceptional user experiences.
            </p>
          </div>

          {/* Main Features Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
            <Card className="p-6">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <span className="text-2xl">🔍</span>
              </div>
              <h3 className="text-xl font-bold mb-2">UX Analysis</h3>
              <p className="text-muted-foreground mb-4">
                Get detailed insights into your interface's usability, accessibility, and performance with our AI-powered analysis engine.
              </p>
              <Badge variant="secondary">Core Feature</Badge>
            </Card>

            <Card className="p-6">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                <span className="text-2xl">📸</span>
              </div>
              <h3 className="text-xl font-bold mb-2">Screenshot Analysis</h3>
              <p className="text-muted-foreground mb-4">
                Upload screenshots of your interfaces and get instant feedback on design patterns, layout, and user flow improvements.
              </p>
              <Badge variant="secondary">Popular</Badge>
            </Card>

            <Card className="p-6">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                <span className="text-2xl">🚀</span>
              </div>
              <h3 className="text-xl font-bold mb-2">Code Generation</h3>
              <p className="text-muted-foreground mb-4">
                Generate optimized React, Vue, and Angular components based on UX best practices and accessibility standards.
              </p>
              <Badge variant="secondary">New</Badge>
            </Card>

            <Card className="p-6">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4">
                <span className="text-2xl">🎯</span>
              </div>
              <h3 className="text-xl font-bold mb-2">Smart Recommendations</h3>
              <p className="text-muted-foreground mb-4">
                Receive actionable recommendations based on evidence-based design principles and current UX research.
              </p>
              <Badge variant="secondary">AI-Powered</Badge>
            </Card>

            <Card className="p-6">
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mb-4">
                <span className="text-2xl">♿</span>
              </div>
              <h3 className="text-xl font-bold mb-2">Accessibility Audit</h3>
              <p className="text-muted-foreground mb-4">
                Comprehensive accessibility testing to ensure your interfaces meet WCAG guidelines and work for everyone.
              </p>
              <Badge variant="secondary">Essential</Badge>
            </Card>

            <Card className="p-6">
              <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mb-4">
                <span className="text-2xl">🔧</span>
              </div>
              <h3 className="text-xl font-bold mb-2">Multi-Platform Prompts</h3>
              <p className="text-muted-foreground mb-4">
                Generate tailored prompts for Lovable, Cursor, v0, and other AI development platforms.
              </p>
              <Badge variant="secondary">Unique</Badge>
            </Card>
          </div>

          {/* Feature Comparison */}
          <div className="bg-muted/30 rounded-lg p-8 mb-16">
            <h2 className="text-2xl font-bold text-center mb-8">How It Works</h2>
            <div className="grid md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-primary">1</span>
                </div>
                <h3 className="font-semibold mb-2">Upload or Analyze</h3>
                <p className="text-sm text-muted-foreground">
                  Upload screenshots or provide URLs of your interfaces
                </p>
              </div>
              
              <div className="text-center">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-primary">2</span>
                </div>
                <h3 className="font-semibold mb-2">AI Analysis</h3>
                <p className="text-sm text-muted-foreground">
                  Our AI examines your interface for UX and accessibility issues
                </p>
              </div>
              
              <div className="text-center">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-primary">3</span>
                </div>
                <h3 className="font-semibold mb-2">Get Recommendations</h3>
                <p className="text-sm text-muted-foreground">
                  Receive detailed recommendations and improvement suggestions
                </p>
              </div>
              
              <div className="text-center">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-primary">4</span>
                </div>
                <h3 className="font-semibold mb-2">Implement Changes</h3>
                <p className="text-sm text-muted-foreground">
                  Use generated code and prompts to improve your interfaces
                </p>
              </div>
            </div>
          </div>

          {/* CTA Section */}
          <div className="text-center">
            <h2 className="text-3xl font-bold mb-4">Ready to Improve Your UX?</h2>
            <p className="text-xl text-muted-foreground mb-8">
              Start analyzing your interfaces today and see the difference AI-powered UX insights can make.
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Link to="/feature-review">
                <Button size="lg">Start Free Analysis</Button>
              </Link>
              <Link to="/pricing">
                <Button variant="outline" size="lg">View Pricing</Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Features;