import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { DEMO_MODE } from '@/lib/demo';

// ---- Demo mode: localStorage-backed chat history (no backend calls) ----
const DEMO_CONVS_KEY = 'adaptmind-demo-conversations';
const DEMO_MSGS_KEY = 'adaptmind-demo-chat-messages';

function readLocal<T>(key: string): T[] {
  try {
    return JSON.parse(localStorage.getItem(key) || '[]') as T[];
  } catch {
    return [];
  }
}
function writeLocal<T>(key: string, value: T[]) {
  localStorage.setItem(key, JSON.stringify(value));
}
const localId = () => Math.random().toString(36).slice(2, 12);

export interface ChatConversation {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

export interface ChatMessage {
  id: string;
  conversation_id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}

// Generate a short, readable title from user message (4-6 words max)
function generateShortTitle(content: string): string {
  // Remove special characters, extra whitespace
  const cleaned = content
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  
  // Split into words
  const words = cleaned.split(' ').filter(w => w.length > 0);
  
  // Take first 4-5 meaningful words
  const titleWords = words.slice(0, 5);
  
  // Join and capitalize first letter
  let title = titleWords.join(' ');
  
  // Ensure title is reasonable length (max 30 chars)
  if (title.length > 30) {
    title = title.slice(0, 27) + '...';
  }
  
  // Capitalize first letter
  return title.charAt(0).toUpperCase() + title.slice(1);
}

export function useChatHistory() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [currentConversation, setCurrentConversation] = useState<ChatConversation | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch all conversations for the user
  const fetchConversations = useCallback(async () => {
    if (DEMO_MODE) {
      const convs = readLocal<ChatConversation>(DEMO_CONVS_KEY);
      setConversations(convs.sort((a, b) => b.updated_at.localeCompare(a.updated_at)));
      return;
    }
    if (!user) return;
    
    const { data, error } = await supabase
      .from('chat_conversations')
      .select('*')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching conversations:', error);
      return;
    }
    
    setConversations(data as ChatConversation[]);
  }, [user]);

  // Fetch messages for a conversation
  const fetchMessages = useCallback(async (conversationId: string) => {
    if (DEMO_MODE) {
      const all = readLocal<ChatMessage>(DEMO_MSGS_KEY);
      setMessages(all.filter((m) => m.conversation_id === conversationId));
      return;
    }
    if (!user) return;
    
    setIsLoading(true);
    const { data, error } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });
    
    setIsLoading(false);
    
    if (error) {
      console.error('Error fetching messages:', error);
      return;
    }
    
    setMessages(data as ChatMessage[]);
  }, [user]);

  // Create a new conversation
  const createConversation = useCallback(async (title?: string): Promise<string | null> => {
    if (DEMO_MODE) {
      const now = new Date().toISOString();
      const conv: ChatConversation = { id: localId(), title: title || 'New Chat', created_at: now, updated_at: now };
      writeLocal(DEMO_CONVS_KEY, [conv, ...readLocal<ChatConversation>(DEMO_CONVS_KEY)]);
      setConversations((prev) => [conv, ...prev]);
      setCurrentConversation(conv);
      setMessages([]);
      return conv.id;
    }
    if (!user) return null;
    
    const { data, error } = await supabase
      .from('chat_conversations')
      .insert({
        user_id: user.id,
        title: title || 'New Chat',
      })
      .select()
      .single();
    
    if (error) {
      console.error('Error creating conversation:', error);
      return null;
    }
    
    const newConv = data as ChatConversation;
    setConversations(prev => [newConv, ...prev]);
    setCurrentConversation(newConv);
    setMessages([]);
    
    return newConv.id;
  }, [user]);

  // Add a message to a conversation
  const addMessage = useCallback(async (
    conversationId: string,
    role: 'user' | 'assistant',
    content: string
  ): Promise<string | null> => {
    if (DEMO_MODE) {
      const msg: ChatMessage = {
        id: localId(),
        conversation_id: conversationId,
        role,
        content,
        created_at: new Date().toISOString(),
      };
      writeLocal(DEMO_MSGS_KEY, [...readLocal<ChatMessage>(DEMO_MSGS_KEY), msg]);
      setMessages((prev) => [...prev, msg]);

      const convs = readLocal<ChatConversation>(DEMO_CONVS_KEY).map((c) => {
        if (c.id !== conversationId) return c;
        const title = role === 'user' && c.title === 'New Chat' ? generateShortTitle(content) : c.title;
        return { ...c, title, updated_at: new Date().toISOString() };
      });
      writeLocal(DEMO_CONVS_KEY, convs);
      setConversations(convs.sort((a, b) => b.updated_at.localeCompare(a.updated_at)));
      setCurrentConversation((prev) => (prev ? convs.find((c) => c.id === prev.id) || prev : prev));
      return msg.id;
    }
    if (!user) return null;
    
    const { data, error } = await supabase
      .from('chat_messages')
      .insert({
        conversation_id: conversationId,
        user_id: user.id,
        role,
        content,
      })
      .select()
      .single();
    
    if (error) {
      console.error('Error adding message:', error);
      return null;
    }
    
    const newMsg = data as ChatMessage;
    setMessages(prev => [...prev, newMsg]);
    
    // Update conversation title from first user message
    if (role === 'user') {
      const shouldUpdateTitle = await supabase
        .from('chat_conversations')
        .select('title')
        .eq('id', conversationId)
        .single();
      
      if (shouldUpdateTitle.data?.title === 'New Chat') {
        // Generate a short, readable title (4-6 words max)
        const shortTitle = generateShortTitle(content);
        await supabase
          .from('chat_conversations')
          .update({ title: shortTitle, updated_at: new Date().toISOString() })
          .eq('id', conversationId);
        
        // Update local state
        setConversations(prev => 
          prev.map(c => c.id === conversationId ? { ...c, title: shortTitle } : c)
        );
        if (currentConversation?.id === conversationId) {
          setCurrentConversation(prev => prev ? { ...prev, title: shortTitle } : null);
        }
      } else {
        // Just update the timestamp
        await supabase
          .from('chat_conversations')
          .update({ updated_at: new Date().toISOString() })
          .eq('id', conversationId);
      }
    }
    
    return newMsg.id;
  }, [user, currentConversation]);

  // Select a conversation
  const selectConversation = useCallback(async (conversation: ChatConversation) => {
    setCurrentConversation(conversation);
    await fetchMessages(conversation.id);
  }, [fetchMessages]);

  // Delete a conversation
  const deleteConversation = useCallback(async (conversationId: string) => {
    if (DEMO_MODE) {
      writeLocal(DEMO_CONVS_KEY, readLocal<ChatConversation>(DEMO_CONVS_KEY).filter((c) => c.id !== conversationId));
      writeLocal(DEMO_MSGS_KEY, readLocal<ChatMessage>(DEMO_MSGS_KEY).filter((m) => m.conversation_id !== conversationId));
      setConversations((prev) => prev.filter((c) => c.id !== conversationId));
      setCurrentConversation((prev) => (prev?.id === conversationId ? null : prev));
      return;
    }
    if (!user) return;
    
    const { error } = await supabase
      .from('chat_conversations')
      .delete()
      .eq('id', conversationId);
    
    if (error) {
      console.error('Error deleting conversation:', error);
      return;
    }
    
    setConversations(prev => prev.filter(c => c.id !== conversationId));
    
    if (currentConversation?.id === conversationId) {
      setCurrentConversation(null);
      setMessages([]);
    }
  }, [user, currentConversation]);

  // Clear current conversation (start fresh)
  const clearCurrentConversation = useCallback(() => {
    setCurrentConversation(null);
    setMessages([]);
  }, []);

  // Load conversations on mount
  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  return {
    conversations,
    currentConversation,
    messages,
    isLoading,
    fetchConversations,
    createConversation,
    addMessage,
    selectConversation,
    deleteConversation,
    clearCurrentConversation,
  };
}
