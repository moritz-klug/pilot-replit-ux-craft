import React, { useState } from 'react';
import { ArrowUp } from 'lucide-react';
import { PromptSuggestion } from '@/components/ui/prompt-suggestion';
import { PromptInput, PromptInputTextarea, PromptInputActions } from '@/components/ui/prompt-input';
import { useAnimatedText } from '@/components/ui/animated-text';
import { Button } from '@/components/ui/button';

interface FeatureChatbotProps {
  featureName: string;
}

const FeatureChatbot: React.FC<FeatureChatbotProps> = ({ featureName }) => {
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

  const handleSend = async () => {
    if (inputValue.trim()) {
      const userMessage = inputValue;
      setMessages(prev => [...prev, { text: userMessage, isUser: true }]);
      setInputValue("");
      setIsTyping(true);
      
      try {
        const response = await fetch('http://localhost:8000/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message: userMessage,
            feature_name: featureName,
            context: `UI component analysis and improvement suggestions`
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to get response');
        }

        const data = await response.json();
        setMessages(prev => [...prev, { text: data.response, isUser: false }]);
      } catch (error) {
        setMessages(prev => [...prev, { text: "Sorry, I'm having trouble connecting. Please try again later.", isUser: false }]);
      } finally {
        setIsTyping(false);
      }
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setInputValue(suggestion);
    setTimeout(() => handleSend(), 100); // Small delay to ensure state is updated
  };

  return (
    <div className="h-full flex flex-col space-y-4 overflow-hidden">
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto space-y-4 p-4 bg-muted/20 rounded-lg min-h-[300px]">
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
  );
};

export default FeatureChatbot;