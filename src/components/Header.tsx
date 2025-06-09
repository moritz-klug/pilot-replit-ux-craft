
import { Button } from "@/components/ui/button";

const Header = () => {
  return (
    <header className="border-b border-border bg-background/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-orange-600 rounded flex items-center justify-center">
              <span className="text-white font-bold text-sm">UX</span>
            </div>
            <span className="text-xl font-semibold">UX Pilot Pro</span>
          </div>
          
          <nav className="hidden md:flex items-center space-x-8">
            <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">Features</a>
            <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">Teams</a>
            <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">Pricing</a>
            <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">Guides</a>
            <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">Blog</a>
            <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">Careers</a>
          </nav>
          
          <div className="flex items-center space-x-4">
            <Button variant="ghost" className="hidden md:inline-flex">
              Contact sales
            </Button>
            <Button variant="ghost" className="hidden md:inline-flex">
              Log in
            </Button>
            <Button className="bg-orange-600 hover:bg-orange-700 text-white">
              Start analyzing
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
