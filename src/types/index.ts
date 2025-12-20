export interface TodoItem {
  id: string;
  title: string;
  description?: string;
  deadline?: Date;
  priority: 'low' | 'medium' | 'high';
  completed: boolean;
  progress: number;
  listId: string;
  order: number;
}

export interface TodoList {
  id: string;
  name: string;
  icon: string;
  color: string;
  items: TodoItem[];
}

export interface Goal {
  id: string;
  title: string;
  description?: string;
  category: 'short' | 'medium' | 'custom';
  progress: number;
  milestones: Milestone[];
  deadline?: Date;
  createdAt: Date;
}

export interface Milestone {
  id: string;
  title: string;
  completed: boolean;
}

export interface Habit {
  id: string;
  name: string;
  icon: string;
  frequency: 'daily' | 'weekly' | 'custom';
  customDays?: number[];
  streak: number;
  bestStreak: number;
  completedDates: string[];
  createdAt: Date;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export type ViewType = 'dashboard' | 'todos' | 'goals' | 'habits' | 'assistant' | 'calendar' | 'profile' | 'settings';
