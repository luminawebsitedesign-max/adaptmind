import { useState, useRef, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/stores/appStore";
import { useAIChat } from "@/hooks/useAIChat";
import { useVoiceRecording } from "@/hooks/useVoiceRecording";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Send, Bot, User, Sparkles, RefreshCw, Trash2, Mic, MicOff, Zap, ListPlus, Target, Repeat } from "lucide-react";
import { toast } from "sonner";

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export function AssistantView() {
  const { 
    chatMessages, 
    addChatMessage, 
    clearChat, 
    addTodoItem, 
    addGoal, 
    addHabit,
    todoLists 
  } = useAppStore();
  const { streamChat, isLoading, error, clearError } = useAIChat();
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [clearConfirm, setClearConfirm] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const handleVoiceTranscript = useCallback((text: string) => {
    setInput(prev => prev + (prev ? ' ' : '') + text);
    toast.success("Voice captured!");
  }, []);

  const { isRecording, toggleRecording } = useVoiceRecording({
    onTranscript: handleVoiceTranscript,
    onError: (err) => toast.error(err),
  });

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

  const handleAIActions = useCallback((actions: { type: string; params: string[] }[]) => {
    actions.forEach(action => {
      switch (action.type) {
        case 'CREATE_TASK': {
          const [listName, title, priority = 'medium'] = action.params;
          const targetList = todoLists.find(l => 
            l.name.toLowerCase() === listName.toLowerCase()
          );
          if (targetList) {
            addTodoItem(targetList.id, {
              title,
              priority: priority as 'low' | 'medium' | 'high',
              completed: false,
              progress: 0,
              listId: targetList.id,
            });
            toast.success(`Created task: ${title}`);
          }
          break;
        }
        case 'CREATE_GOAL': {
          const [title, category, milestonesStr] = action.params;
          const milestones = milestonesStr?.split(',').map((m, i) => ({
            id: String(i + 1),
            title: m.trim(),
            completed: false,
          })) || [];
          addGoal({
            title,
            category: category as 'short' | 'medium' | 'custom',
            progress: 0,
            milestones,
          });
          toast.success(`Created goal: ${title}`);
          break;
        }
        case 'CREATE_HABIT': {
          const [name, icon = '✨', frequency = 'daily'] = action.params;
          addHabit({
            name,
            icon,
            frequency: frequency as 'daily' | 'weekly' | 'custom',
          });
          toast.success(`Created habit: ${name}`);
          break;
        }
      }
    });
  }, [todoLists, addTodoItem, addGoal, addHabit]);

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
      assistantContent += chunk;
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

    await streamChat(
      messageHistory, 
      (delta) => upsertAssistant(delta), 
      () => {
        if (assistantContent) {
          addChatMessage({ role: 'assistant', content: assistantContent });
        }
      },
      handleAIActions
    );
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
      content: "Hello! I'm your Adaptmind AI assistant. I can help you manage your tasks, goals, and habits. Try asking me to organize your tasks or create a weekly plan!",
      timestamp: new Date(),
    }]);
    setClearConfirm(false);
    toast.success("Chat cleared");
  };

  const quickPrompts = [
    { text: "Plan my week", icon: <Zap className="w-3 h-3" /> },
    { text: "Organize my tasks", icon: <ListPlus className="w-3 h-3" /> },
    { text: "Create goals for me", icon: <Target className="w-3 h-3" /> },
    { text: "Suggest habits", icon: <Repeat className="w-3 h-3" /> },
  ];

  useEffect(() => {
    if (messages.length === 0) {
      setMessages([{
        id: '1',
        role: 'assistant',
        content: "Hello! I'm your Adaptmind AI assistant. I can help you manage your tasks, goals, and habits. Try asking me to organize your tasks or create a weekly plan!",
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
            <p className="text-sm text-muted-foreground">Your intelligent productivity copilot</p>
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
                <div className={cn(
                  "w-8 h-8 rounded-lg flex items-center justify-center shrink-0", 
                  message.role === "user" ? "bg-secondary/20" : "bg-gradient-to-br from-primary to-accent"
                )}>
                  {message.role === "user" ? (
                    <User className="w-4 h-4 text-secondary" />
                  ) : (
                    <Sparkles className="w-4 h-4 text-primary-foreground" />
                  )}
                </div>
                <div className={cn(
                  "max-w-[80%] rounded-2xl px-4 py-3", 
                  message.role === "user" ? "bg-secondary/20" : "bg-muted/20"
                )}>
                  <p className="whitespace-pre-wrap text-sm leading-relaxed">{message.content}</p>
                  <p className="text-xs text-muted-foreground mt-2">
                    {message.timestamp.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
                  </p>
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

        {/* Quick Prompts */}
        <div className="px-4 py-3 border-t border-border/30">
          <p className="text-xs text-muted-foreground mb-2">Quick actions:</p>
          <div className="flex gap-2 flex-wrap">
            {quickPrompts.map((prompt) => (
              <button 
                key={prompt.text} 
                onClick={() => handleQuickPrompt(prompt.text)} 
                disabled={isLoading} 
                className="px-4 py-2 text-sm rounded-lg bg-muted/20 hover:bg-primary/20 hover:text-primary transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 font-medium"
              >
                {isLoading ? (
                  <span className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                ) : (
                  prompt.icon
                )}
                {prompt.text}
              </button>
            ))}
          </div>
        </div>

        {/* Input Area */}
        <div className="p-4 border-t border-border/30">
          <div className="flex gap-2 items-end">
            <Button
              variant={isRecording ? "destructive" : "outline"}
              size="icon"
              onClick={toggleRecording}
              className={cn(
                "shrink-0 transition-all h-11 w-11",
                isRecording && "animate-pulse"
              )}
              aria-label={isRecording ? "Stop recording" : "Start voice input"}
            >
              {isRecording ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </Button>
            <textarea 
              value={input} 
              onChange={(e) => setInput(e.target.value)} 
              placeholder={isRecording ? "Listening..." : "Ask me to organize tasks, create goals, or plan your week..."} 
              className={cn(
                "flex-1 bg-muted/10 rounded-lg border border-border px-4 py-3 text-sm resize-none min-h-[44px] max-h-32 focus:outline-none focus:ring-2 focus:ring-primary/50",
                isRecording && "border-destructive"
              )}
              rows={1}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              onInput={(e) => {
                const target = e.target as HTMLTextAreaElement;
                target.style.height = 'auto';
                target.style.height = Math.min(target.scrollHeight, 128) + 'px';
              }}
              disabled={isLoading} 
            />
            <Button 
              onClick={handleSend} 
              disabled={!input.trim() || isLoading} 
              className={cn(
                "glow-cyan h-11 w-11 shrink-0",
                !input.trim() && "opacity-50"
              )}
              aria-label="Send message"
            >
              {isLoading ? (
                <span className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </Button>
          </div>
        </div>
      </div>

      <ConfirmDialog 
        open={clearConfirm} 
        onOpenChange={setClearConfirm} 
        title="Clear Chat History?" 
        description="Are you sure you want to clear all chat messages? This action cannot be undone." 
        confirmLabel="Clear Chat" 
        onConfirm={handleClearChat} 
      />
    </div>
  );
}
