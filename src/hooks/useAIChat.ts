import { useState, useCallback } from 'react';
import { useAppStore } from '@/stores/appStore';
import { supabase } from '@/integrations/supabase/client';
import { DEMO_MODE } from '@/lib/demo';
import { getDemoWeeklyPlan } from '@/data/demoWeeklyPlan';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`;

export function useAIChat() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { todoLists, goals, habits } = useAppStore();

  const getContext = useCallback(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    
    // Get all tasks with their list information
    const allTasks = todoLists.flatMap(list => 
      list.items.map(item => ({
        id: item.id,
        title: item.title,
        listId: list.id,
        listName: list.name,
        priority: item.priority,
        completed: item.completed,
        deadline: item.deadline ? new Date(item.deadline).toLocaleDateString() : undefined,
      }))
    );
    
    const totalTasks = allTasks.length;
    const completedTasks = allTasks.filter(t => t.completed).length;
    
    const avgGoalProgress = goals.length > 0
      ? Math.round(goals.reduce((acc, g) => acc + g.progress, 0) / goals.length)
      : 0;
    
    const habitsCompletedToday = habits.filter((h) =>
      h.completedDates.includes(todayStr)
    ).length;
    
    const topStreak = habits.reduce((max, h) => Math.max(max, h.bestStreak), 0);

    // Get user preferences from localStorage
    const userPreferences = localStorage.getItem('adaptmind-ai-personality') || undefined;

    return {
      tasks: {
        pending: totalTasks - completedTasks,
        completed: completedTasks,
        total: totalTasks,
        lists: todoLists.map(l => ({
          id: l.id,
          name: l.name,
          icon: l.icon,
          taskCount: l.items.length,
        })),
        allTasks,
      },
      goals: {
        count: goals.length,
        avgProgress: avgGoalProgress,
        all: goals.map(g => ({
          id: g.id,
          title: g.title,
          progress: g.progress,
          category: g.category,
          milestones: g.milestones.map(m => ({
            title: m.title,
            completed: m.completed,
          })),
        })),
      },
      habits: {
        total: habits.length,
        completedToday: habitsCompletedToday,
        topStreak,
        all: habits.map(h => ({
          id: h.id,
          name: h.name,
          icon: h.icon,
          frequency: h.frequency,
          streak: h.streak,
          completedToday: h.completedDates.includes(todayStr),
        })),
      },
      userPreferences,
    };
  }, [todoLists, goals, habits]);

  const parseAIActions = useCallback((content: string) => {
    const actions: { type: string; params: string[] }[] = [];
    const actionRegex = /\[ACTION:([A-Z_]+)\|([^\]]+)\]/g;
    let match;
    
    while ((match = actionRegex.exec(content)) !== null) {
      actions.push({
        type: match[1],
        params: match[2].split('|'),
      });
    }
    
    // Remove action blocks from visible content
    const cleanContent = content.replace(actionRegex, '').trim();
    
    return { cleanContent, actions };
  }, []);

  const streamChat = useCallback(async (
    messages: Message[],
    onDelta: (delta: string) => void,
    onDone: () => void,
    onActions?: (actions: { type: string; params: string[] }[]) => void
  ) => {
    setIsLoading(true);
    setError(null);

    // Demo mode: no edge function, no AI API. Bundled sample plan, streamed locally.
    if (DEMO_MODE) {
      const full = getDemoWeeklyPlan();
      const visible = full.replace(/\[ACTION:[^\]]+\]/g, '').trim();
      const words = visible.split(' ');
      for (let i = 0; i < words.length; i += 4) {
        onDelta(words.slice(i, i + 4).join(' ') + ' ');
        await new Promise((r) => setTimeout(r, 25));
      }
      const { actions } = parseAIActions(full);
      if (actions.length > 0 && onActions) onActions(actions);
      setIsLoading(false);
      onDone();
      return;
    }

    try {
      // Force refresh the session to ensure we have a valid token
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error('Session error:', sessionError);
        // Try to refresh the session
        const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
        if (refreshError || !refreshData.session?.access_token) {
          setError('Session expired. Please sign in again.');
          setIsLoading(false);
          onDone();
          return;
        }
      }
      
      // Get the freshest session after potential refresh
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      
      if (!currentSession?.access_token) {
        setError('Please sign in to use the AI assistant.');
        setIsLoading(false);
        onDone();
        return;
      }

      const accessToken = currentSession.access_token;

      const response = await fetch(CHAT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          messages,
          context: getContext(),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error || 'Failed to get AI response';
        
        if (response.status === 429) {
          setError('Too many requests. Please wait a moment and try again.');
        } else if (response.status === 402) {
          setError('AI credits exhausted. Please add credits to continue.');
        } else {
          setError(errorMessage);
        }
        
        setIsLoading(false);
        onDone();
        return;
      }

      if (!response.body) {
        throw new Error('No response body');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = '';
      let fullContent = '';
      let streamDone = false;

      while (!streamDone) {
        const { done, value } = await reader.read();
        if (done) break;
        
        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf('\n')) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);

          if (line.endsWith('\r')) line = line.slice(0, -1);
          if (line.startsWith(':') || line.trim() === '') continue;
          if (!line.startsWith('data: ')) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === '[DONE]') {
            streamDone = true;
            break;
          }

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) {
              // Strip markdown and action blocks from display
              const cleanChunk = content
                .replace(/\*\*/g, '')
                .replace(/\*/g, '')
                .replace(/^#+\s/gm, '')
                .replace(/`/g, '')
                .replace(/\[ACTION:[^\]]+\]/g, '');
              
              fullContent += content;
              if (cleanChunk) onDelta(cleanChunk);
            }
          } catch {
            textBuffer = line + '\n' + textBuffer;
            break;
          }
        }
      }

      // Final flush
      if (textBuffer.trim()) {
        for (let raw of textBuffer.split('\n')) {
          if (!raw) continue;
          if (raw.endsWith('\r')) raw = raw.slice(0, -1);
          if (raw.startsWith(':') || raw.trim() === '') continue;
          if (!raw.startsWith('data: ')) continue;
          const jsonStr = raw.slice(6).trim();
          if (jsonStr === '[DONE]') continue;
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) {
              fullContent += content;
              const cleanChunk = content.replace(/\[ACTION:[^\]]+\]/g, '');
              if (cleanChunk) onDelta(cleanChunk);
            }
          } catch { /* ignore partial leftovers */ }
        }
      }

      // Parse and execute any AI actions
      const { actions } = parseAIActions(fullContent);
      if (actions.length > 0 && onActions) {
        onActions(actions);
      }

      setIsLoading(false);
      onDone();
    } catch (err) {
      console.error('AI chat error:', err);
      setError(err instanceof Error ? err.message : 'Failed to connect to AI');
      setIsLoading(false);
      onDone();
    }
  }, [getContext, parseAIActions]);

  return {
    streamChat,
    isLoading,
    error,
    clearError: () => setError(null),
  };
}
