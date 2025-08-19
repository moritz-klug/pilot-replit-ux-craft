import React, { useState, useImperativeHandle, forwardRef } from 'react';
import { ArrowUp } from 'lucide-react';
import { PromptSuggestion } from '@/components/ui/prompt-suggestion';
import { PromptInput, PromptInputTextarea, PromptInputActions } from '@/components/ui/prompt-input';
import { useAnimatedText } from '@/components/ui/animated-text';
import { Button } from '@/components/ui/button';

interface FeatureChatbotProps {
  featureName: string;
  onChatUpdate?: (messages: Array<{ text: string; isUser: boolean; id: string }>) => void;
  onTypingChange?: (isTyping: boolean) => void;
  disabled?: boolean; // Add disabled prop
}

const FeatureChatbot = forwardRef(({ featureName, onChatUpdate, onTypingChange, disabled = false }: FeatureChatbotProps, ref) => {
  const [inputValue, setInputValue] = useState("");
  const [messages, setMessages] = useState<Array<{ text: string; isUser: boolean; id: string; loading?: boolean }>>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [currentBotResponse, setCurrentBotResponse] = useState("");

  const suggestions = [
    `How can I improve the ${featureName}?`,
    `What are best practices for ${featureName} design?`,
    `Show me examples of great ${featureName} components`,
    `What accessibility features should I add?`
  ];

  const animatedBotResponse = useAnimatedText(currentBotResponse, " ");

  React.useEffect(() => {
    if (onChatUpdate) {
      onChatUpdate(messages);
    }
  }, [messages]);

  React.useEffect(() => {
    if (onTypingChange) {
      onTypingChange(isTyping);
    }
  }, [isTyping, onTypingChange]);
  
  const handleSend = async () => {
    if (inputValue.trim() && !disabled) { // Check if disabled
      const userMessage = inputValue;
      const messageId = Date.now().toString();
      setMessages(prev => [...prev, { text: userMessage, isUser: true, id: messageId }]);
      setInputValue("");
      setIsTyping(true);
      setCurrentBotResponse("");
      
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
        const botMessageId = (Date.now() + 1).toString();
        
        // Add the bot message to messages list
        setMessages(prev => [...prev, { text: data.response, isUser: false, id: botMessageId }]);
        
        // Start animating the response
        setCurrentBotResponse(data.response);
        setIsTyping(false);
        
      } catch (error) {
        // Provide helpful fallback response
        const fallbackResponse = `I understand you're asking about improving the ${featureName} component. Here are some general best practices:

• **Accessibility**: Ensure proper ARIA labels, keyboard navigation, and color contrast
• **Responsive Design**: Make sure it works well on mobile and desktop devices  
• **Performance**: Optimize loading times and avoid unnecessary re-renders
• **User Experience**: Keep interactions intuitive and provide clear feedback
• **Modern Standards**: Use semantic HTML and follow current design patterns

For specific technical recommendations, please ensure the backend server is running at localhost:8000.`;
        
        const errorMessageId = (Date.now() + 1).toString();
        setMessages(prev => [...prev, { text: fallbackResponse, isUser: false, id: errorMessageId }]);
        setCurrentBotResponse(fallbackResponse);
        setIsTyping(false);
      }
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    if (disabled) return; // Don't allow suggestions when disabled
    setInputValue(suggestion);
    setTimeout(() => handleSend(), 100); // Small delay to ensure state is updated
  };

  useImperativeHandle(ref, () => ({
    addBotMessage: (text) => {
      setMessages(prev => [...prev, { text, isUser: false, id: Date.now().toString() }]);
    },
    addLoadingMessage: (text) => {
      setMessages(prev => [...prev, { text, isUser: false, id: Date.now().toString(), loading: true }]);
    },
    updateLastBotMessage: (text) => {
      setMessages(prev => {
        const lastIdx = prev.length - 1;
        if (lastIdx >= 0 && !prev[lastIdx].isUser) {
          const updated = [...prev];
          updated[lastIdx] = { ...updated[lastIdx], text, loading: false };
          return updated;
        }
        return prev;
      });
    }
  }));

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
            key={message.id || index}
            className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}
          >
            <div className="flex flex-col items-start max-w-[80%]">
              <div
                className={`rounded-lg px-4 py-2 break-words whitespace-pre-wrap ${
                  message.isUser
                    ? 'bg-blue-500 text-white self-end'
                    : 'bg-gray-100 text-gray-900 border border-gray-200 self-start'
                }`}
              >
                {message.isUser ? (
                  message.text
                ) : (
                  // Animate bot responses only for the most recent message
                  index === messages.length - 1 && !message.isUser ? 
                    animatedBotResponse : 
                    message.text
                )}
              </div>
            </div>
          </div>
        ))}
        
        {isTyping && (
          <div className="flex justify-start">
            <div className="max-w-[80%] rounded-lg px-4 py-2 bg-background border">
              <div className="flex items-center space-x-2">
                <div className="animate-pulse">Thinking...</div>
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Suggestions */}
      {messages.length === 0 && !disabled && (
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
        <PromptInputTextarea 
          placeholder={disabled ? "Waiting for analysis..." : `Ask about ${featureName} improvements...`}
          disabled={disabled}
        />
        <PromptInputActions className="justify-end">
          <Button
            size="sm"
            className="size-9 cursor-pointer rounded-full"
            onClick={handleSend}
            disabled={!inputValue.trim() || disabled}
            aria-label="Send"
          >
            <ArrowUp className="h-4 w-4" />
          </Button>
        </PromptInputActions>
      </PromptInput>
    </div>
  );
});

export default FeatureChatbot;