
import Hero from "@/components/Hero";
import Header from "@/components/Header";
import { Footerdemo } from "@/components/ui/footer-section";

const Index = () => {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <Hero />
      <Footerdemo />
    </div>
  );
};

export default Index;
