import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const Header = () => {
  return (
    <header className="border-b border-border bg-background/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Link to="/">
              <img 
                src="/lovable-uploads/de1b37d7-39b9-4668-81d7-1b1d316fd42d.png" 
                alt="Auto UI" 
                className="w-8 h-8"
              />
            </Link>
            <Link to="/" className="text-xl font-semibold hover:text-orange-600 transition-colors">
              Auto UI
            </Link>
          </div>
          
          <nav className="hidden md:flex items-center space-x-8">
            <Link to="/feature-review" className="text-muted-foreground hover:text-foreground transition-colors">
              Feature Review
            </Link>
            <Link to="/recommendations" className="text-muted-foreground hover:text-foreground transition-colors">
              Recommendations
            </Link>
            <Link to="/screenshot-tool" className="text-muted-foreground hover:text-foreground transition-colors">
              Screenshot Tool
            </Link>
          </nav>
          
          <div className="flex items-center space-x-4">
            <Button variant="ghost" className="hidden md:inline-flex">
              Contact sales
            </Button>
            <Button variant="ghost" className="hidden md:inline-flex">
              Log in
            </Button>
            <Link to="/feature-review">
              <Button className="bg-orange-600 hover:bg-orange-700 text-white">
                Start analyzing
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
