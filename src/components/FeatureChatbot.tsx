import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { X, ArrowUp } from 'lucide-react';
import { PromptSuggestion } from '@/components/ui/prompt-suggestion';
import { PromptInput, PromptInputTextarea, PromptInputActions } from '@/components/ui/prompt-input';
import { useAnimatedText } from '@/components/ui/animated-text';

interface FeatureChatbotProps {
  isOpen: boolean;
  onClose: () => void;
  featureName: string;
}

const FeatureChatbot: React.FC<FeatureChatbotProps> = ({ isOpen, onClose, featureName }) => {
  console.log('=== FeatureChatbot Component ===');
  console.log('isOpen:', isOpen);
  console.log('featureName:', featureName);
  
  const [inputValue, setInputValue] = useState("");
  const [messages, setMessages] = useState<Array<{ text: string; isUser: boolean }>>([]);
  const [isTyping, setIsTyping] = useState(false);

  const suggestions = [
    `How can I improve the ${featureName}?`,
    `What are best practices for ${featureName} design?`,
    `Show me examples of great ${featureName} components`,
    `What accessibility features should I add?`
  ];

  const botResponse = useAnimatedText(
    isTyping ? "I'm analyzing your feature and generating recommendations based on modern UI/UX principles..." : "",
    " "
  );

  const handleSend = () => {
    if (inputValue.trim()) {
      setMessages(prev => [...prev, { text: inputValue, isUser: true }]);
      setInputValue("");
      setIsTyping(true);
      
      // Simulate bot response
      setTimeout(() => {
        setMessages(prev => [...prev, { text: `Here are some recommendations for your ${featureName}: Consider improving the visual hierarchy, enhancing accessibility features, and optimizing for mobile responsiveness.`, isUser: false }]);
        setIsTyping(false);
      }, 3000);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setInputValue(suggestion);
    handleSend();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader className="flex flex-row items-center justify-between">
          <DialogTitle>{featureName} Assistant</DialogTitle>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </DialogHeader>
        
        <div className="flex-1 flex flex-col space-y-4 overflow-hidden">
          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto space-y-4 p-4 bg-muted/20 rounded-lg">
            {messages.length === 0 && (
              <div className="text-center text-muted-foreground py-8">
                <h3 className="font-medium mb-2">Hi! I'm your {featureName} assistant</h3>
                <p className="text-sm">Ask me anything about improving this component or click a suggestion below.</p>
              </div>
            )}
            
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-lg px-4 py-2 ${
                    message.isUser
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-background border'
                  }`}
                >
                  {message.text}
                </div>
              </div>
            ))}
            
            {isTyping && (
              <div className="flex justify-start">
                <div className="max-w-[80%] rounded-lg px-4 py-2 bg-background border">
                  {botResponse}
                  <span className="animate-pulse">|</span>
                </div>
              </div>
            )}
          </div>

          {/* Suggestions */}
          {messages.length === 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium">Quick suggestions:</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {suggestions.map((suggestion, index) => (
                  <PromptSuggestion
                    key={index}
                    size="sm"
                    className="text-left justify-start h-auto py-2 px-3"
                    onClick={() => handleSuggestionClick(suggestion)}
                  >
                    {suggestion}
                  </PromptSuggestion>
                ))}
              </div>
            </div>
          )}

          {/* Input */}
          <PromptInput
            className="border-input bg-background border shadow-xs"
            value={inputValue}
            onValueChange={setInputValue}
            onSubmit={handleSend}
          >
            <PromptInputTextarea placeholder={`Ask about ${featureName} improvements...`} />
            <PromptInputActions className="justify-end">
              <Button
                size="sm"
                className="size-9 cursor-pointer rounded-full"
                onClick={handleSend}
                disabled={!inputValue.trim()}
                aria-label="Send"
              >
                <ArrowUp className="h-4 w-4" />
              </Button>
            </PromptInputActions>
          </PromptInput>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default FeatureChatbot;