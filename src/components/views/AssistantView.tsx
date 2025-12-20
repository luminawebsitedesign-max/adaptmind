import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/stores/appStore";
import { useAIChat } from "@/hooks/useAIChat";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Send, Bot, User, Sparkles, RefreshCw, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export function AssistantView() {
  const { chatMessages, addChatMessage, clearChat } = useAppStore();
  const { streamChat, isLoading, error, clearError } = useAIChat();
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [clearConfirm, setClearConfirm] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMessages(chatMessages.map(m => ({
      id: m.id,
      role: m.role,
      content: m.content,
      timestamp: new Date(m.timestamp),
    })));
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    if (error) {
      toast.error(error);
      clearError();
    }
  }, [error, clearError]);

  const sendMessage = async (messageText: string) => {
    if (!messageText.trim() || isLoading) return;

    const userMessage: Message = {
      id: Math.random().toString(36).substring(2, 15),
      role: 'user',
      content: messageText,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    addChatMessage({ role: 'user', content: messageText });

    let assistantContent = "";
    
    const upsertAssistant = (chunk: string) => {
      // Strip markdown formatting for cleaner responses
      const cleanChunk = chunk
        .replace(/\*\*/g, '')
        .replace(/\*/g, '')
        .replace(/^#+\s/gm, '')
        .replace(/`/g, '');
      assistantContent += cleanChunk;
      setMessages(prev => {
        const last = prev[prev.length - 1];
        if (last?.role === 'assistant' && !last.content.includes('...thinking')) {
          return prev.map((m, i) => 
            i === prev.length - 1 ? { ...m, content: assistantContent } : m
          );
        }
        return [...prev, {
          id: Math.random().toString(36).substring(2, 15),
          role: 'assistant' as const,
          content: assistantContent,
          timestamp: new Date(),
        }];
      });
    };

    const messageHistory = messages.slice(-10).map(m => ({ role: m.role, content: m.content }));
    messageHistory.push({ role: 'user', content: messageText });

    await streamChat(messageHistory, (delta) => upsertAssistant(delta), () => {
      if (assistantContent) {
        addChatMessage({ role: 'assistant', content: assistantContent });
      }
    });
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    const messageText = input;
    setInput("");
    await sendMessage(messageText);
  };

  const handleQuickPrompt = async (prompt: string) => {
    if (isLoading) return;
    await sendMessage(prompt);
  };

  const handleClearChat = () => {
    clearChat();
    setMessages([{
      id: '1',
      role: 'assistant',
      content: "Hello! I'm your Adaptmind AI assistant. How can I help you today?",
      timestamp: new Date(),
    }]);
    setClearConfirm(false);
    toast.success("Chat cleared");
  };

  const quickPrompts = ["Plan my week", "How am I doing?", "Help me stay motivated", "Review my goals"];

  useEffect(() => {
    if (messages.length === 0) {
      setMessages([{
        id: '1',
        role: 'assistant',
        content: "Hello! I'm your Adaptmind AI assistant. How can I help you today?",
        timestamp: new Date(),
      }]);
    }
  }, []);

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col animate-fade-in">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center glow-cyan animate-pulse-slow">
            <Bot className="w-6 h-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-2xl font-display font-bold text-gradient-cyan">AI Assistant</h1>
            <p className="text-sm text-muted-foreground">Powered by intelligent AI</p>
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={() => setClearConfirm(true)} className="text-muted-foreground hover:text-foreground">
          <Trash2 className="w-4 h-4 mr-2" />
          Clear Chat
        </Button>
      </div>

      <div className="flex-1 glass rounded-2xl flex flex-col overflow-hidden">
        <ScrollArea className="flex-1 p-4" ref={scrollRef}>
          <div className="space-y-4">
            {messages.map((message) => (
              <div key={message.id} className={cn("flex gap-3", message.role === "user" ? "flex-row-reverse" : "")}>
                <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center shrink-0", message.role === "user" ? "bg-secondary/20" : "bg-gradient-to-br from-primary to-accent")}>
                  {message.role === "user" ? <User className="w-4 h-4 text-secondary" /> : <Sparkles className="w-4 h-4 text-primary-foreground" />}
                </div>
                <div className={cn("max-w-[80%] rounded-2xl px-4 py-3", message.role === "user" ? "bg-secondary/20" : "bg-muted/20")}>
                  <p className="whitespace-pre-wrap text-sm leading-relaxed">{message.content}</p>
                  <p className="text-xs text-muted-foreground mt-2">{message.timestamp.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}</p>
                </div>
              </div>
            ))}
            {isLoading && messages[messages.length - 1]?.role === 'user' && (
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                  <RefreshCw className="w-4 h-4 text-primary-foreground animate-spin" />
                </div>
                <div className="bg-muted/20 rounded-2xl px-4 py-3">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        <div className="px-4 py-2 border-t border-border/30">
          <div className="flex gap-2 flex-wrap">
            {quickPrompts.map((prompt) => (
              <button 
                key={prompt} 
                onClick={() => handleQuickPrompt(prompt)} 
                disabled={isLoading} 
                className="px-3 py-1.5 text-xs rounded-full bg-muted/20 hover:bg-muted/40 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
              >
                {isLoading && <span className="w-3 h-3 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />}
                {prompt}
              </button>
            ))}
          </div>
        </div>

        <div className="p-4 border-t border-border/30">
          <div className="flex gap-2">
            <Input 
              value={input} 
              onChange={(e) => setInput(e.target.value)} 
              placeholder="Ask me anything..." 
              className="flex-1 bg-muted/10" 
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()} 
              disabled={isLoading} 
            />
            <Button onClick={handleSend} disabled={!input.trim() || isLoading} className="glow-cyan">
              {isLoading ? (
                <span className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>
      </div>

      <ConfirmDialog open={clearConfirm} onOpenChange={setClearConfirm} title="Clear Chat History?" description="Are you sure you want to clear all chat messages? This action cannot be undone." confirmLabel="Clear Chat" onConfirm={handleClearChat} />
    </div>
  );
}
