import { useState, useRef, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/stores/appStore";
import { useAIChat } from "@/hooks/useAIChat";
import { useVoiceRecording } from "@/hooks/useVoiceRecording";
import { useChatHistory } from "@/hooks/useChatHistory";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { ChatHistorySidebar } from "@/components/assistant/ChatHistorySidebar";
import { AIConfirmation, PendingAction } from "@/components/assistant/AIConfirmation";
import { Send, User, Sparkles, RefreshCw, Trash2, Mic, MicOff, Zap, ListPlus, Target, Repeat, PanelLeftClose, PanelLeft } from "lucide-react";
import { toast } from "sonner";
import adaptmindIconLight from "@/assets/adaptmind-icon-light.png";

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export function AssistantView() {
  const { 
    addTodoItem, 
    addTodoList,
    addGoal, 
    addHabit,
    addPortfolio,
    todoLists 
  } = useAppStore();
  const { streamChat, isLoading, error, clearError } = useAIChat();
  const {
    conversations,
    currentConversation,
    messages: dbMessages,
    createConversation,
    addMessage: addDbMessage,
    selectConversation,
    deleteConversation,
    clearCurrentConversation,
  } = useChatHistory();
  
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [clearConfirm, setClearConfirm] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [pendingActions, setPendingActions] = useState<PendingAction[]>([]);
  const [pendingActionsRaw, setPendingActionsRaw] = useState<{ type: string; params: string[] }[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const currentConversationIdRef = useRef<string | null>(null);

  const handleVoiceTranscript = useCallback((text: string) => {
    setInput(prev => prev + (prev ? ' ' : '') + text);
    toast.success("Voice captured!");
  }, []);

  const { isRecording, toggleRecording } = useVoiceRecording({
    onTranscript: handleVoiceTranscript,
    onError: (err) => toast.error(err),
  });

  // Sync messages from DB when conversation changes
  useEffect(() => {
    if (dbMessages.length > 0) {
      setMessages(dbMessages.map(m => ({
        id: m.id,
        role: m.role,
        content: m.content,
        timestamp: new Date(m.created_at),
      })));
    } else if (!currentConversation) {
      // Reset to welcome message when no conversation
      setMessages([{
        id: '1',
        role: 'assistant',
        content: "Hello! I'm your AdaptMind AI assistant.\n\nI can help you:\n• Plan and organize your week\n• Create tasks, goals, and habits\n• Answer questions about productivity\n\nBefore I make any changes, I'll always ask for your confirmation first. Try asking me to help organize your day!",
        timestamp: new Date(),
      }]);
    }
  }, [dbMessages, currentConversation]);

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

  // Execute confirmed actions
  const executeActions = useCallback((actions: { type: string; params: string[] }[]) => {
    let successCount = 0;
    let failCount = 0;
    const results: string[] = [];

    // Helper: find or create a list by name
    const getOrCreateList = (listName: string): string | null => {
      const name = listName?.trim() || 'General';
      const existing = useAppStore.getState().todoLists.find(l => 
        l.name.toLowerCase() === name.toLowerCase()
      );
      if (existing) return existing.id;
      // Auto-create the list
      addTodoList({ name, icon: '📋', color: '#3B82F6' });
      const created = useAppStore.getState().todoLists.find(l => 
        l.name.toLowerCase() === name.toLowerCase()
      );
      return created?.id || null;
    };

    actions.forEach(action => {
      try {
        switch (action.type) {
          case 'CREATE_LIST': {
            const [name, icon = '📋', color = '#3B82F6'] = action.params;
            if (!name) { failCount++; break; }
            const exists = useAppStore.getState().todoLists.find(l => 
              l.name.toLowerCase() === name.toLowerCase()
            );
            if (!exists) {
              addTodoList({ name, icon, color });
              successCount++;
              results.push(`List "${name}"`);
            } else {
              // Already exists, not a failure
              results.push(`List "${name}" (exists)`);
            }
            break;
          }
          case 'CREATE_TASK': {
            const [listName, title, priority = 'medium', deadline] = action.params;
            if (!title) { failCount++; break; }
            const listId = getOrCreateList(listName);
            if (!listId) { failCount++; break; }
            addTodoItem(listId, {
              title,
              priority: (priority as 'low' | 'medium' | 'high') || 'medium',
              completed: false,
              progress: 0,
              listId,
              deadline: deadline ? new Date(deadline + 'T00:00:00') : undefined,
            });
            successCount++;
            results.push(`Task "${title}"`);
            break;
          }
          case 'CREATE_GOAL': {
            const [title, category, milestonesStr, deadline] = action.params;
            if (!title) { failCount++; break; }
            const milestones = milestonesStr?.split(',').map((m, i) => ({
              id: String(i + 1),
              title: m.trim(),
              completed: false,
            })) || [];
            addGoal({
              title,
              category: (category as 'short' | 'medium' | 'custom') || 'short',
              progress: 0,
              milestones,
              startDate: new Date(),
              deadline: deadline ? new Date(deadline + 'T00:00:00') : undefined,
            });
            successCount++;
            results.push(`Goal "${title}" (${milestones.length} milestones)`);
            break;
          }
          case 'CREATE_HABIT': {
            const [name, icon = '✨', frequency = 'daily'] = action.params;
            if (!name) { failCount++; break; }
            addHabit({
              name,
              icon,
              frequency: (frequency as 'daily' | 'weekly' | 'custom') || 'daily',
            });
            successCount++;
            results.push(`Habit "${name}"`);
            break;
          }
          case 'CREATE_PORTFOLIO': {
            const [name, type = 'personal', icon = '💰', balanceStr = '0'] = action.params;
            if (!name) { failCount++; break; }
            addPortfolio({
              name,
              type: (type as 'personal' | 'investment' | 'savings' | 'custom') || 'personal',
              icon,
              balance: parseFloat(balanceStr) || 0,
              currency: 'USD',
            });
            successCount++;
            results.push(`Portfolio "${name}"`);
            break;
          }
          default:
            break;
        }
      } catch (e) {
        console.error('Action execution failed:', action.type, e);
        failCount++;
      }
    });

    if (successCount > 0 && failCount === 0) {
      toast.success(`Created: ${results.join(', ')}`);
    } else if (successCount > 0 && failCount > 0) {
      toast.warning(`Created ${successCount}, failed ${failCount}: ${results.join(', ')}`);
    } else if (failCount > 0) {
      toast.error(`Failed to create ${failCount} item(s). Please try again.`);
    }
  }, [todoLists, addTodoItem, addTodoList, addGoal, addHabit, addPortfolio]);

  // Handle AI actions - show confirmation first
  const handleAIActions = useCallback((actions: { type: string; params: string[] }[]) => {
    if (actions.length === 0) return;

    const pending: PendingAction[] = actions.map(a => {
      let description = '';
      switch (a.type) {
        case 'CREATE_LIST':
          description = `${a.params[1] || '📋'} "${a.params[0]}"`;
          break;
        case 'CREATE_TASK':
          description = `"${a.params[1]}" in ${a.params[0] || 'General'} (${a.params[2] || 'medium'})${a.params[3] ? ` due ${a.params[3]}` : ''}`;
          break;
        case 'CREATE_GOAL':
          description = `"${a.params[0]}" (${a.params[1] || 'short'} term)${a.params[3] ? ` due ${a.params[3]}` : ''}`;
          break;
        case 'CREATE_HABIT':
          description = `"${a.params[0]}" ${a.params[1] || '✨'} (${a.params[2] || 'daily'})`;
          break;
        case 'CREATE_PORTFOLIO':
          description = `"${a.params[0]}" (${a.params[1] || 'personal'}) ${a.params[3] ? `$${a.params[3]}` : ''}`;
          break;
        default:
          description = a.params.join(' | ');
      }
      return {
        type: a.type as PendingAction['type'],
        description,
        params: a.params,
      };
    });

    setPendingActions(pending);
    setPendingActionsRaw(actions);
  }, []);

  const handleConfirmActions = useCallback(() => {
    executeActions(pendingActionsRaw);

    // Add a verification message to the chat showing what was actually created
    const counts: Record<string, number> = {};
    pendingActionsRaw.forEach(a => {
      const label = a.type.replace('CREATE_', '').toLowerCase();
      counts[label] = (counts[label] || 0) + 1;
    });
    const summary = Object.entries(counts).map(([k, v]) => `${v} ${k}${v > 1 ? 's' : ''}`).join(', ');
    
    setMessages(prev => [...prev, {
      id: Math.random().toString(36).substring(2, 15),
      role: 'assistant',
      content: `Done! Created: ${summary}. Check your tabs to see everything.`,
      timestamp: new Date(),
    }]);

    setPendingActions([]);
    setPendingActionsRaw([]);
  }, [executeActions, pendingActionsRaw]);

  const handleCancelActions = useCallback(() => {
    setPendingActions([]);
    setPendingActionsRaw([]);
    toast.info("Actions cancelled");
  }, []);

  const sendMessage = async (messageText: string) => {
    if (!messageText.trim() || isLoading) return;

    // Ensure we have a conversation
    let convId = currentConversationIdRef.current || currentConversation?.id;
    if (!convId) {
      convId = await createConversation();
      if (!convId) {
        toast.error("Failed to create conversation");
        return;
      }
    }
    currentConversationIdRef.current = convId;

    const userMessage: Message = {
      id: Math.random().toString(36).substring(2, 15),
      role: 'user',
      content: messageText,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    
    // Save user message to DB
    await addDbMessage(convId, 'user', messageText);

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
      async () => {
        if (assistantContent && convId) {
          // Save assistant message to DB
          await addDbMessage(convId, 'assistant', assistantContent);
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

  const handleNewConversation = async () => {
    clearCurrentConversation();
    currentConversationIdRef.current = null;
    setMessages([{
      id: '1',
      role: 'assistant',
      content: "Hello! I'm your AdaptMind AI assistant.\n\nI can help you:\n• Plan and organize your week\n• Create tasks, goals, and habits\n• Answer questions about productivity\n\nBefore I make any changes, I'll always ask for your confirmation first. Try asking me to help organize your day!",
      timestamp: new Date(),
    }]);
  };

  const handleSelectConversation = async (conv: typeof conversations[0]) => {
    currentConversationIdRef.current = conv.id;
    await selectConversation(conv);
  };

  const handleClearChat = () => {
    if (currentConversation) {
      deleteConversation(currentConversation.id);
    }
    handleNewConversation();
    setClearConfirm(false);
    toast.success("Chat cleared");
  };

  const quickPrompts = [
    { text: "Plan my week", icon: <Zap className="w-3 h-3" /> },
    { text: "Organize my tasks", icon: <ListPlus className="w-3 h-3" /> },
    { text: "Create goals for me", icon: <Target className="w-3 h-3" /> },
    { text: "Suggest habits", icon: <Repeat className="w-3 h-3" /> },
  ];

  return (
    <div className="h-[calc(100vh-5rem)] flex animate-fade-in">
      {/* Chat History Sidebar */}
      <ChatHistorySidebar
        conversations={conversations}
        currentConversation={currentConversation}
        onSelectConversation={handleSelectConversation}
        onNewConversation={handleNewConversation}
        onDeleteConversation={deleteConversation}
        isCollapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
      />

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <div className="flex items-center justify-between mb-4 px-4 pt-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-card border border-primary/30 flex items-center justify-center">
              <img src={adaptmindIconLight} alt="AdaptMind AI" className="w-8 h-8 object-contain" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-display font-bold text-gradient-brand">AI Assistant</h1>
                <span className="px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider rounded-full bg-secondary/20 text-secondary border border-secondary/30">
                  Beta
                </span>
              </div>
              <p className="text-sm text-muted-foreground">Asks before making changes — always in control</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={() => setClearConfirm(true)} className="text-muted-foreground hover:text-foreground">
            <Trash2 className="w-4 h-4 mr-2" />
            Clear Chat
          </Button>
        </div>

        <div className="flex-1 glass rounded-2xl flex flex-col overflow-hidden mx-4 mb-4 min-h-0">
          <ScrollArea className="flex-1 p-4 min-h-0" ref={scrollRef}>
            <div className="space-y-4 pb-4">
              {messages.map((message) => (
                <div key={message.id} className={cn("flex gap-3", message.role === "user" ? "flex-row-reverse" : "")}>
                  <div className={cn(
                    "w-8 h-8 rounded-lg flex items-center justify-center shrink-0", 
                    message.role === "user" ? "bg-primary/20" : "bg-accent/20"
                  )}>
                    {message.role === "user" ? (
                      <User className="w-4 h-4 text-primary" />
                    ) : (
                      <Sparkles className="w-4 h-4 text-accent" />
                    )}
                  </div>
                  <div className={cn(
                    "max-w-[80%] rounded-2xl px-4 py-3 min-w-0", 
                    message.role === "user" ? "bg-primary/10 border border-primary/20" : "bg-card border border-border"
                  )}>
                    <p className="whitespace-pre-wrap text-sm leading-relaxed break-words">{message.content}</p>
                    <p className="text-xs text-muted-foreground mt-2">
                      {message.timestamp.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                </div>
              ))}

              {/* Pending Actions Confirmation */}
              {pendingActions.length > 0 && (
                <AIConfirmation
                  actions={pendingActions}
                  onConfirm={handleConfirmActions}
                  onCancel={handleCancelActions}
                />
              )}

              {isLoading && messages[messages.length - 1]?.role === 'user' && (
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-lg bg-accent/20 flex items-center justify-center">
                    <RefreshCw className="w-4 h-4 text-accent animate-spin" />
                  </div>
                  <div className="bg-card border border-border rounded-2xl px-4 py-3">
                    <div className="flex gap-1">
                      <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                      <span className="w-2 h-2 bg-secondary rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                      <span className="w-2 h-2 bg-accent rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
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
          <div className="p-4 border-t border-border/30 bg-card/50">
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
                  "flex-1 bg-background rounded-lg border border-border px-4 py-3 text-sm resize-none min-h-[44px] max-h-32 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary overflow-wrap-anywhere break-words",
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
                size="icon"
                className={cn(
                  "h-11 w-11 shrink-0 transition-all",
                  input.trim() ? "glow-primary bg-primary hover:bg-primary/90" : "bg-muted text-muted-foreground"
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
            {input.trim() && (
              <p className="text-xs text-muted-foreground mt-2">Press Enter to send, Shift+Enter for new line</p>
            )}
          </div>
        </div>
      </div>

      <ConfirmDialog 
        open={clearConfirm} 
        onOpenChange={setClearConfirm} 
        title="Clear Chat History?" 
        description="Are you sure you want to clear this conversation? This action cannot be undone." 
        confirmLabel="Clear Chat" 
        onConfirm={handleClearChat} 
      />
    </div>
  );
}
