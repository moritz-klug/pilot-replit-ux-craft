
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Zap, Target, BarChart3, Users, Globe, Shield } from "lucide-react";

const Features = () => {
  const features = [
    {
      icon: Zap,
      title: "Lightning Fast Analysis",
      description: "Get comprehensive UX insights in under 60 seconds",
      badge: "Fast"
    },
    {
      icon: Target,
      title: "Actionable Insights",
      description: "Evidence-backed recommendations you can implement immediately",
      badge: "Practical"
    },
    {
      icon: BarChart3,
      title: "Performance Metrics",
      description: "Detailed metrics on load times, accessibility, and user flow",
      badge: "Data-driven"
    },
    {
      icon: Users,
      title: "User Experience Focus",
      description: "Analyze from your users' perspective with behavioral insights",
      badge: "User-centric"
    },
    {
      icon: Globe,
      title: "Global Standards",
      description: "Compliance with WCAG, GDPR, and international UX standards",
      badge: "Compliant"
    },
    {
      icon: Shield,
      title: "Privacy First",
      description: "We don't store your data or track your users",
      badge: "Secure"
    }
  ];

  return (
    <section className="py-24 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Everything you need to optimize UX
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Our AI-powered analysis covers every aspect of user experience, 
            from technical performance to psychological usability factors.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <Card key={index} className="bg-card border-border hover:border-primary/50 transition-all duration-300 group">
              <CardHeader>
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
                    <feature.icon className="h-6 w-6 text-primary" />
                  </div>
                  <Badge variant="secondary" className="bg-primary/10 text-primary">
                    {feature.badge}
                  </Badge>
                </div>
                <CardTitle className="text-xl">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-muted-foreground leading-relaxed">
                  {feature.description}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
