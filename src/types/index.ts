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
  createdAt?: Date;
  completedAt?: Date;
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
  completedAt?: Date;
}

export interface Milestone {
  id: string;
  title: string;
  completed: boolean;
  completedAt?: Date;
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

// Finance / Portfolio Types
export interface Portfolio {
  id: string;
  name: string;
  icon: string;
  type: 'personal' | 'investment' | 'savings' | 'custom';
  balance: number;
  currency: string;
  createdAt: Date;
}

export interface Transaction {
  id: string;
  portfolioId: string;
  type: 'income' | 'expense' | 'transfer';
  amount: number;
  description: string;
  category: string;
  date: Date;
  createdAt: Date;
}

export interface FinanceGoal {
  id: string;
  portfolioId: string;
  title: string;
  targetAmount: number;
  currentAmount: number;
  deadline?: Date;
  createdAt: Date;
}

export type ViewType = 'dashboard' | 'todos' | 'goals' | 'habits' | 'assistant' | 'calendar' | 'profile' | 'settings' | 'finance';
