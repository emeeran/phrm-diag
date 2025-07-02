"use client";
import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { MessageSquare, Send, User, Bot, AlertTriangle } from "lucide-react";
import { ErrorDisplay, handleApiError } from "@/components/ui/error-boundary";
import { LoadingSpinner } from "@/components/ui/loading";

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'error';
  content: string;
  timestamp: Date;
  model?: string;
  cost?: number;
  tokens?: {
    total: number;
    prompt?: number;
    completion?: number;
  };
  complexity?: number;
}

interface AIChatProps {
  user: { email: string; name?: string };
}

export default function AIChat({ user }: AIChatProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'Hello! I\'m your AI health assistant. I can help you understand your health records, answer questions about symptoms, medications, and provide general health information.\n\n⚠️ **Important**: I provide general information only and am not a substitute for professional medical advice. Always consult healthcare professionals for medical decisions.\n\nHow can I assist you today?',
      timestamp: new Date(),
    }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: input.trim() }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw { status: response.status, message: errorData.error || 'Failed to get AI response' };
      }

      const data = await response.json();
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.response,
        timestamp: new Date(),
        model: data.model,
        cost: data.cost,
        tokens: data.tokens,
        complexity: data.complexity,
      };
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error: any) {
      console.error('AI Chat error:', error);
      const errorMsg = handleApiError(error);
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'error',
        content: `Sorry, I encountered an error: ${errorMsg}\n\nPlease try again or rephrase your question.`,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  }

  const handleRetry = () => {
    setError(null);
    // Retry last user message
    const lastUserMessage = messages.filter(m => m.role === 'user').pop();
    if (lastUserMessage) {
      setInput(lastUserMessage.content);
    }
  };

  const clearChat = () => {
    setMessages([{
      id: '1',
      role: 'assistant',
      content: 'Hello! I\'m your AI health assistant. I can help you understand your health records, answer questions about symptoms, medications, and provide general health information.\n\n⚠️ **Important**: I provide general information only and am not a substitute for professional medical advice. Always consult healthcare professionals for medical decisions.\n\nHow can I assist you today?',
      timestamp: new Date(),
    }]);
    setError(null);
  };

  return (
    <div className="bg-white rounded-lg shadow-lg h-[600px] flex flex-col">
      {/* Header */}
      <div className="p-4 border-b bg-blue-50 rounded-t-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <MessageSquare className="h-5 w-5 text-blue-600" />
            <h2 className="font-semibold text-gray-900">AI Health Assistant</h2>
          </div>
          <Button 
            onClick={clearChat} 
            variant="outline" 
            size="sm"
            disabled={loading}
          >
            Clear Chat
          </Button>
        </div>
        <p className="text-sm text-gray-600 mt-1">
          Ask questions about your health, symptoms, or medical records
        </p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`max-w-[85%] ${message.role === 'user' ? 'order-2' : 'order-1'}`}>
              <div className="flex items-start space-x-2">
                {(message.role === 'assistant' || message.role === 'error') && (
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    message.role === 'error' ? 'bg-red-100' : 'bg-blue-100'
                  }`}>
                    {message.role === 'error' ? (
                      <AlertTriangle className="h-4 w-4 text-red-600" />
                    ) : (
                      <Bot className="h-4 w-4 text-blue-600" />
                    )}
                  </div>
                )}
                <div
                  className={`px-4 py-3 rounded-lg ${
                    message.role === 'user'
                      ? 'bg-blue-600 text-white'
                      : message.role === 'error'
                      ? 'bg-red-50 text-red-900 border border-red-200'
                      : 'bg-gray-100 text-gray-900'
                  }`}
                >
                  <p className="whitespace-pre-wrap text-sm leading-relaxed">{message.content}</p>
                  <div className={`flex justify-between text-xs mt-2 ${
                    message.role === 'user' 
                      ? 'text-blue-100' 
                      : message.role === 'error'
                      ? 'text-red-600'
                      : 'text-gray-500'
                  }`}>
                    <span>{message.timestamp.toLocaleTimeString()}</span>
                    {message.role === 'assistant' && message.model && (
                      <span className="ml-2">
                        {message.model} 
                        {message.cost !== undefined && (
                          <span className="ml-1 text-gray-400">${message.cost.toFixed(5)}</span>
                        )}
                        {message.complexity && (
                          <span className="ml-1 text-gray-400">Complexity: {message.complexity}/10</span>
                        )}
                      </span>
                    )}
                  </div>
                </div>
                {message.role === 'user' && (
                  <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                    <User className="h-4 w-4 text-gray-600" />
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
        
        {loading && (
          <div className="flex justify-start">
            <div className="flex items-start space-x-2">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <LoadingSpinner size="sm" />
              </div>
              <div className="bg-gray-100 px-4 py-3 rounded-lg">
                <p className="text-sm text-gray-600">AI is thinking...</p>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Error Display */}
      {error && (
        <div className="px-4 pb-2">
          <ErrorDisplay error={error} onRetry={handleRetry} className="text-sm" />
        </div>
      )}

      {/* Input */}
      <form onSubmit={handleSubmit} className="p-4 border-t bg-gray-50">
        <div className="flex space-x-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask me about your health..."
            className="flex-1 border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={loading}
            maxLength={500}
          />
          <Button type="submit" disabled={loading || !input.trim()}>
            {loading ? <LoadingSpinner size="sm" /> : <Send className="h-4 w-4" />}
          </Button>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          ⚠️ This AI provides general information only. Always consult healthcare professionals for medical advice.
        </p>
      </form>
    </div>
  );
}
