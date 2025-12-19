import { useState, useCallback } from 'react';
import { useAppStore } from '@/stores/appStore';

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
    const totalTasks = todoLists.reduce((acc, list) => acc + list.items.length, 0);
    const completedTasks = todoLists.reduce(
      (acc, list) => acc + list.items.filter((i) => i.completed).length,
      0
    );
    
    const avgGoalProgress = goals.length > 0
      ? Math.round(goals.reduce((acc, g) => acc + g.progress, 0) / goals.length)
      : 0;
    
    const todayStr = new Date().toISOString().split('T')[0];
    const habitsCompletedToday = habits.filter((h) =>
      h.completedDates.includes(todayStr)
    ).length;
    
    const topStreak = habits.reduce((max, h) => Math.max(max, h.streak), 0);

    return {
      tasks: {
        pending: totalTasks - completedTasks,
        completed: completedTasks,
        total: totalTasks,
      },
      goals: {
        count: goals.length,
        avgProgress: avgGoalProgress,
      },
      habits: {
        total: habits.length,
        completedToday: habitsCompletedToday,
        topStreak,
      },
    };
  }, [todoLists, goals, habits]);

  const streamChat = useCallback(async (
    messages: Message[],
    onDelta: (delta: string) => void,
    onDone: () => void
  ) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(CHAT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
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
            if (content) onDelta(content);
          } catch {
            // Incomplete JSON, put it back and wait for more
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
            if (content) onDelta(content);
          } catch { /* ignore partial leftovers */ }
        }
      }

      setIsLoading(false);
      onDone();
    } catch (err) {
      console.error('AI chat error:', err);
      setError(err instanceof Error ? err.message : 'Failed to connect to AI');
      setIsLoading(false);
      onDone();
    }
  }, [getContext]);

  return {
    streamChat,
    isLoading,
    error,
    clearError: () => setError(null),
  };
}
