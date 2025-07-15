
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import About from "./pages/About";
import Features from "./pages/Features";
import Pricing from "./pages/Pricing";
import Contact from "./pages/Contact";
import FeatureReview from "./pages/FeatureReview";
import Recommendations from "./pages/Recommendations";
import Results from "./pages/Results";
import ScreenshotTool from "./components/ScreenshotTool";
import NotFound from "./pages/NotFound";
import { createContext, useContext, useState } from 'react';

const queryClient = new QueryClient();

// UI Test Mode Context
export const UITestModeContext = createContext({ uiTest: false, setUITest: (v: boolean) => {} });

// Model Selection Context
export const ModelSelectionContext = createContext({ selectedModel: 'Standard (1-2min)', setSelectedModel: (v: string) => {} });

const App = () => {
  const [uiTest, setUITest] = useState(false);
  const [selectedModel, setSelectedModel] = useState('Standard (1-2min)');
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <UITestModeContext.Provider value={{ uiTest, setUITest }}>
          <ModelSelectionContext.Provider value={{ selectedModel, setSelectedModel }}>
            <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/about" element={<About />} />
              <Route path="/features" element={<Features />} />
              <Route path="/pricing" element={<Pricing />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/feature-review" element={<FeatureReview />} />
              <Route path="/recommendations" element={<Recommendations />} />
              <Route path="/results" element={<Results />} />
              <Route path="/screenshot-tool" element={<ScreenshotTool />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
          </ModelSelectionContext.Provider>
        </UITestModeContext.Provider>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
