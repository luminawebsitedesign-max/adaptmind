import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/stores/appStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Bot, User, Sparkles, RefreshCw, Trash2 } from "lucide-react";

export function AssistantView() {
  const { chatMessages, addChatMessage, clearChat, todoLists, goals, habits } =
    useAppStore();
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [chatMessages]);

  const generateAIResponse = (userMessage: string): string => {
    const lowerMessage = userMessage.toLowerCase();
    
    const totalTasks = todoLists.reduce((acc, list) => acc + list.items.length, 0);
    const completedTasks = todoLists.reduce(
      (acc, list) => acc + list.items.filter((i) => i.completed).length,
      0
    );
    const pendingTasks = totalTasks - completedTasks;
    
    const avgGoalProgress =
      goals.length > 0
        ? Math.round(goals.reduce((acc, g) => acc + g.progress, 0) / goals.length)
        : 0;
    
    const todayStr = new Date().toISOString().split("T")[0];
    const habitsCompletedToday = habits.filter((h) =>
      h.completedDates.includes(todayStr)
    ).length;

    if (lowerMessage.includes("plan") || lowerMessage.includes("week") || lowerMessage.includes("schedule")) {
      return `Based on your current progress, here's my suggested plan:\n\n📋 **Tasks Overview**: You have ${pendingTasks} pending tasks across ${todoLists.length} lists.\n\n🎯 **Goals**: Your goals are at ${avgGoalProgress}% average completion. Focus on completing milestones to maintain momentum.\n\n💪 **Habits**: You've completed ${habitsCompletedToday}/${habits.length} habits today. Keep your streaks alive!\n\n**My Recommendation**: Start each morning with your highest priority tasks, then dedicate afternoon blocks to goal-related work. End the day by completing your habits to build consistency.`;
    }

    if (lowerMessage.includes("progress") || lowerMessage.includes("status") || lowerMessage.includes("how am i")) {
      return `Here's your current progress summary:\n\n📊 **Tasks**: ${completedTasks}/${totalTasks} completed (${totalTasks > 0 ? Math.round((completedTasks/totalTasks)*100) : 0}%)\n\n🎯 **Goals**: ${avgGoalProgress}% average progress across ${goals.length} goals\n\n✨ **Habits**: ${habitsCompletedToday}/${habits.length} completed today\n\n${avgGoalProgress > 50 ? "Great momentum! Keep pushing forward." : "There's room for improvement. Let's focus on making progress today!"}`;
    }

    if (lowerMessage.includes("habit") || lowerMessage.includes("routine") || lowerMessage.includes("streak")) {
      const topHabit = habits.reduce((a, b) => (a.streak > b.streak ? a : b), habits[0]);
      return `Let's talk about your habits!\n\n🔥 **Top Streak**: ${topHabit?.name || "None"} with ${topHabit?.streak || 0} days\n\n📈 **Today's Progress**: ${habitsCompletedToday}/${habits.length} habits completed\n\n**Tip**: Try "habit stacking" - link new habits to existing ones. For example, "After I [existing habit], I will [new habit]."`;
    }

    if (lowerMessage.includes("motivat") || lowerMessage.includes("help") || lowerMessage.includes("stuck")) {
      return `I understand! Here are some strategies to regain momentum:\n\n1️⃣ **Start Small**: Pick one tiny task and complete it now. Progress begets progress.\n\n2️⃣ **Review Your Why**: Reconnect with the goals that matter most to you.\n\n3️⃣ **Break It Down**: Large tasks feel overwhelming. Divide them into smaller milestones.\n\n4️⃣ **Celebrate Wins**: You've already achieved a lot. Take a moment to appreciate your progress!\n\nRemember: Consistency beats perfection. What's one small step you can take right now?`;
    }

    if (lowerMessage.includes("goal")) {
      const activeGoals = goals.filter((g) => g.progress < 100);
      return `Let's review your goals!\n\n🎯 **Active Goals**: ${activeGoals.length}\n📊 **Average Progress**: ${avgGoalProgress}%\n\n${activeGoals.length > 0 
        ? `**Focus Suggestion**: "${activeGoals[0].title}" is at ${activeGoals[0].progress}%. Consider what milestone you can complete next.` 
        : "All goals completed! Time to set new ones?"}\n\n**Tip**: Break each goal into 3-5 clear milestones for better tracking.`;
    }

    return `I'm here to help you stay productive! Here's a quick overview:\n\n• **${pendingTasks}** tasks pending\n• **${avgGoalProgress}%** average goal progress\n• **${habitsCompletedToday}/${habits.length}** habits done today\n\nTry asking me about:\n- "Plan my week"\n- "How am I doing?"\n- "Help me with habits"\n- "Review my goals"\n\nWhat would you like to focus on?`;
  };

  const handleSend = () => {
    if (!input.trim()) return;

    addChatMessage({ role: "user", content: input });
    setInput("");
    setIsTyping(true);

    // Simulate AI thinking
    setTimeout(() => {
      const response = generateAIResponse(input);
      addChatMessage({ role: "assistant", content: response });
      setIsTyping(false);
    }, 1000 + Math.random() * 1000);
  };

  const quickPrompts = [
    "Plan my week",
    "How am I doing?",
    "Help me stay motivated",
    "Review my goals",
  ];

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center glow-cyan animate-pulse-slow">
            <Bot className="w-6 h-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-2xl font-display font-bold text-gradient-cyan">
              AI Assistant
            </h1>
            <p className="text-sm text-muted-foreground">
              Your intelligent productivity companion
            </p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={clearChat}
          className="text-muted-foreground hover:text-foreground"
        >
          <Trash2 className="w-4 h-4 mr-2" />
          Clear Chat
        </Button>
      </div>

      {/* Chat Area */}
      <div className="flex-1 glass rounded-2xl flex flex-col overflow-hidden">
        <ScrollArea className="flex-1 p-4" ref={scrollRef}>
          <div className="space-y-4">
            {chatMessages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  "flex gap-3",
                  message.role === "user" ? "flex-row-reverse" : ""
                )}
              >
                <div
                  className={cn(
                    "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                    message.role === "user"
                      ? "bg-secondary/20"
                      : "bg-gradient-to-br from-primary to-accent"
                  )}
                >
                  {message.role === "user" ? (
                    <User className="w-4 h-4 text-secondary" />
                  ) : (
                    <Sparkles className="w-4 h-4 text-primary-foreground" />
                  )}
                </div>
                <div
                  className={cn(
                    "max-w-[80%] rounded-2xl px-4 py-3",
                    message.role === "user"
                      ? "bg-secondary/20 text-foreground"
                      : "bg-muted/20 text-foreground"
                  )}
                >
                  <p className="whitespace-pre-wrap text-sm leading-relaxed">
                    {message.content}
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
                    {new Date(message.timestamp).toLocaleTimeString("en-US", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>
            ))}

            {isTyping && (
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
        <div className="px-4 py-2 border-t border-border/30">
          <div className="flex gap-2 flex-wrap">
            {quickPrompts.map((prompt) => (
              <button
                key={prompt}
                onClick={() => setInput(prompt)}
                className="px-3 py-1.5 text-xs rounded-full bg-muted/20 hover:bg-muted/40 transition-colors"
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>

        {/* Input */}
        <div className="p-4 border-t border-border/30">
          <div className="flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask me anything about your productivity..."
              className="flex-1 bg-muted/10"
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
            />
            <Button
              onClick={handleSend}
              disabled={!input.trim() || isTyping}
              className="glow-cyan"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
