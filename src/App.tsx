import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import FeatureReview from "./pages/FeatureReview";
import Recommendations from "./pages/Recommendations";
import ScreenshotTool from "./components/ScreenshotTool";
import NotFound from "./pages/NotFound";
import { createContext, useContext, useState } from 'react';

const queryClient = new QueryClient();

// UI Test Mode Context
export const UITestModeContext = createContext({ uiTest: false, setUITest: (v: boolean) => {} });

const App = () => {
  const [uiTest, setUITest] = useState(false);
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <UITestModeContext.Provider value={{ uiTest, setUITest }}>
          <div className="app-header">
            <button
              style={{ marginLeft: 16, background: uiTest ? '#ffb347' : '#eee', color: uiTest ? '#222' : '#888', borderRadius: 4, padding: '4px 12px', border: 'none', fontWeight: 'bold' }}
              onClick={() => setUITest((m) => !m)}
            >
              UI Test Mode: {uiTest ? 'ON' : 'OFF'}
            </button>
            {uiTest && <span style={{ color: '#ff9800', marginLeft: 8, fontWeight: 'bold' }}>[UI Test Mode Active]</span>}
          </div>
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/feature-review" element={<FeatureReview />} />
              <Route path="/recommendations" element={<Recommendations />} />
              <Route path="/screenshot-tool" element={<ScreenshotTool />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </UITestModeContext.Provider>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
