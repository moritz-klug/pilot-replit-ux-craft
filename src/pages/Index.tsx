
import Hero from "@/components/Hero";
import Header from "@/components/Header";
import { Footerdemo } from "@/components/ui/footer-section";
import Testimonials from "@/components/ui/testimonials-columns-1";

const Index = () => {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <Hero />
      <Testimonials />
      <Footerdemo />
    </div>
  );
};

export default Index;
