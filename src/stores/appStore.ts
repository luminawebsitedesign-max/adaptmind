import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { TodoList, TodoItem, Goal, Habit, ChatMessage, ViewType, Portfolio, Transaction, FinanceGoal } from '@/types';

interface AppState {
  currentView: ViewType;
  setCurrentView: (view: ViewType) => void;
  
  // Todo Lists
  todoLists: TodoList[];
  addTodoList: (list: Omit<TodoList, 'id' | 'items'>) => void;
  deleteTodoList: (id: string) => void;
  addTodoItem: (listId: string, item: Omit<TodoItem, 'id' | 'order'>) => void;
  updateTodoItem: (listId: string, itemId: string, updates: Partial<TodoItem>) => void;
  deleteTodoItem: (listId: string, itemId: string) => void;
  reorderTodoItems: (listId: string, items: TodoItem[]) => void;
  moveTodoItem: (itemId: string, fromListId: string, toListId: string) => void;
  
  // Goals
  goals: Goal[];
  addGoal: (goal: Omit<Goal, 'id' | 'createdAt'>) => void;
  updateGoal: (id: string, updates: Partial<Goal>) => void;
  deleteGoal: (id: string) => void;
  toggleMilestone: (goalId: string, milestoneId: string) => void;
  
  // Habits
  habits: Habit[];
  addHabit: (habit: Omit<Habit, 'id' | 'streak' | 'bestStreak' | 'completedDates' | 'createdAt'>) => void;
  updateHabit: (id: string, updates: Partial<Habit>) => void;
  deleteHabit: (id: string) => void;
  toggleHabitCompletion: (id: string, date: string) => void;
  
  // Chat
  chatMessages: ChatMessage[];
  addChatMessage: (message: Omit<ChatMessage, 'id' | 'timestamp'>) => void;
  clearChat: () => void;
  
  // Sidebar
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;

  // Finance
  portfolios: Portfolio[];
  transactions: Transaction[];
  financeGoals: FinanceGoal[];
  addPortfolio: (portfolio: Omit<Portfolio, 'id' | 'createdAt'>) => void;
  updatePortfolio: (id: string, updates: Partial<Portfolio>) => void;
  deletePortfolio: (id: string) => void;
  addTransaction: (transaction: Omit<Transaction, 'id' | 'createdAt'>) => void;
  deleteTransaction: (id: string) => void;
  addFinanceGoal: (goal: Omit<FinanceGoal, 'id' | 'createdAt'>) => void;
  updateFinanceGoal: (id: string, updates: Partial<FinanceGoal>) => void;
  deleteFinanceGoal: (id: string) => void;
}

const generateId = () => Math.random().toString(36).substring(2, 15);

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      currentView: 'dashboard',
      setCurrentView: (view) => set({ currentView: view }),
      
      // Todo Lists
      todoLists: [
        {
          id: '1',
          name: 'Work',
          icon: '💼',
          color: 'cyan',
          items: [
            { id: '1', title: 'Complete project proposal', description: 'Finish the Q1 project proposal', deadline: new Date(Date.now() + 86400000 * 2), priority: 'high', completed: false, progress: 60, listId: '1', order: 0, createdAt: new Date() },
            { id: '2', title: 'Review team updates', priority: 'medium', completed: true, progress: 100, listId: '1', order: 1, createdAt: new Date(), completedAt: new Date() },
          ]
        },
        {
          id: '2',
          name: 'Personal',
          icon: '🏠',
          color: 'magenta',
          items: [
            { id: '3', title: 'Morning meditation', priority: 'low', completed: false, progress: 0, listId: '2', order: 0, createdAt: new Date() },
          ]
        },
        {
          id: '3',
          name: 'Fitness',
          icon: '💪',
          color: 'purple',
          items: []
        }
      ],
      
      addTodoList: (list) => set((state) => ({
        todoLists: [...state.todoLists, { ...list, id: generateId(), items: [] }]
      })),
      
      deleteTodoList: (id) => set((state) => ({
        todoLists: state.todoLists.filter(l => l.id !== id)
      })),
      
      addTodoItem: (listId, item) => set((state) => ({
        todoLists: state.todoLists.map(list => 
          list.id === listId 
            ? { ...list, items: [...list.items, { ...item, id: generateId(), order: list.items.length, createdAt: new Date() }] }
            : list
        )
      })),
      
      updateTodoItem: (listId, itemId, updates) => set((state) => ({
        todoLists: state.todoLists.map(list =>
          list.id === listId
            ? { 
                ...list, 
                items: list.items.map(item => {
                  if (item.id !== itemId) return item;
                  const newItem = { ...item, ...updates };
                  // Track completion time
                  if (updates.completed && !item.completed) {
                    newItem.completedAt = new Date();
                  } else if (updates.completed === false) {
                    newItem.completedAt = undefined;
                  }
                  return newItem;
                })
              }
            : list
        )
      })),
      
      deleteTodoItem: (listId, itemId) => set((state) => ({
        todoLists: state.todoLists.map(list =>
          list.id === listId
            ? { ...list, items: list.items.filter(item => item.id !== itemId) }
            : list
        )
      })),
      
      reorderTodoItems: (listId, items) => set((state) => ({
        todoLists: state.todoLists.map(list =>
          list.id === listId ? { ...list, items } : list
        )
      })),

      moveTodoItem: (itemId, fromListId, toListId) => set((state) => {
        const fromList = state.todoLists.find(l => l.id === fromListId);
        const item = fromList?.items.find(i => i.id === itemId);
        if (!item) return state;
        
        return {
          todoLists: state.todoLists.map(list => {
            if (list.id === fromListId) {
              return { ...list, items: list.items.filter(i => i.id !== itemId) };
            }
            if (list.id === toListId) {
              return { ...list, items: [...list.items, { ...item, listId: toListId }] };
            }
            return list;
          })
        };
      }),
      
      // Goals
      goals: [
        {
          id: '1',
          title: 'Complete Design System',
          description: 'Finish all UI components for the new product',
          category: 'short',
          progress: 75,
          milestones: [
            { id: '1', title: 'Define color palette', completed: true, completedAt: new Date() },
            { id: '2', title: 'Create component library', completed: true, completedAt: new Date() },
            { id: '3', title: 'Write documentation', completed: false },
          ],
          createdAt: new Date()
        },
        {
          id: '2',
          title: 'Learn TypeScript Advanced',
          category: 'medium',
          progress: 40,
          milestones: [
            { id: '1', title: 'Generics', completed: true, completedAt: new Date() },
            { id: '2', title: 'Utility types', completed: false },
            { id: '3', title: 'Decorators', completed: false },
          ],
          createdAt: new Date()
        }
      ],
      
      addGoal: (goal) => set((state) => ({
        goals: [...state.goals, { ...goal, id: generateId(), createdAt: new Date() }]
      })),
      
      updateGoal: (id, updates) => set((state) => ({
        goals: state.goals.map(g => g.id === id ? { ...g, ...updates } : g)
      })),
      
      deleteGoal: (id) => set((state) => ({
        goals: state.goals.filter(g => g.id !== id)
      })),
      
      toggleMilestone: (goalId, milestoneId) => set((state) => ({
        goals: state.goals.map(goal => {
          if (goal.id !== goalId) return goal;
          const milestones = goal.milestones.map(m => {
            if (m.id !== milestoneId) return m;
            return { 
              ...m, 
              completed: !m.completed,
              completedAt: !m.completed ? new Date() : undefined
            };
          });
          const progress = Math.round((milestones.filter(m => m.completed).length / milestones.length) * 100);
          const completedAt = progress === 100 ? new Date() : undefined;
          return { ...goal, milestones, progress, completedAt };
        })
      })),
      
      // Habits
      habits: [
        {
          id: '1',
          name: 'Morning Workout',
          icon: '🏃',
          frequency: 'daily',
          streak: 5,
          bestStreak: 12,
          completedDates: ['2024-01-15', '2024-01-16', '2024-01-17', '2024-01-18', '2024-01-19'],
          createdAt: new Date()
        },
        {
          id: '2',
          name: 'Read 30 mins',
          icon: '📚',
          frequency: 'daily',
          streak: 3,
          bestStreak: 8,
          completedDates: ['2024-01-17', '2024-01-18', '2024-01-19'],
          createdAt: new Date()
        },
        {
          id: '3',
          name: 'Meditate',
          icon: '🧘',
          frequency: 'daily',
          streak: 7,
          bestStreak: 7,
          completedDates: ['2024-01-13', '2024-01-14', '2024-01-15', '2024-01-16', '2024-01-17', '2024-01-18', '2024-01-19'],
          createdAt: new Date()
        }
      ],
      
      addHabit: (habit) => set((state) => ({
        habits: [...state.habits, { ...habit, id: generateId(), streak: 0, bestStreak: 0, completedDates: [], createdAt: new Date() }]
      })),

      updateHabit: (id, updates) => set((state) => ({
        habits: state.habits.map(h => h.id === id ? { ...h, ...updates } : h)
      })),
      
      deleteHabit: (id) => set((state) => ({
        habits: state.habits.filter(h => h.id !== id)
      })),
      
      toggleHabitCompletion: (id, date) => set((state) => ({
        habits: state.habits.map(habit => {
          if (habit.id !== id) return habit;
          const isCompleted = habit.completedDates.includes(date);
          const completedDates = isCompleted
            ? habit.completedDates.filter(d => d !== date)
            : [...habit.completedDates, date].sort();
          
          // Calculate streak
          let streak = 0;
          const today = new Date().toISOString().split('T')[0];
          let checkDate = new Date(today);
          while (completedDates.includes(checkDate.toISOString().split('T')[0])) {
            streak++;
            checkDate.setDate(checkDate.getDate() - 1);
          }
          
          return {
            ...habit,
            completedDates,
            streak,
            bestStreak: Math.max(habit.bestStreak, streak)
          };
        })
      })),
      
      // Chat
      chatMessages: [
        { id: '1', role: 'assistant', content: "Hello! I'm your Adaptmind AI assistant. I can help you plan your day, optimize your tasks, and track your progress. What would you like to accomplish today?", timestamp: new Date() }
      ],
      
      addChatMessage: (message) => set((state) => ({
        chatMessages: [...state.chatMessages, { ...message, id: generateId(), timestamp: new Date() }]
      })),
      
      clearChat: () => set({ chatMessages: [] }),
      
      // Sidebar
      sidebarCollapsed: false,
      toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),

      // Finance
      portfolios: [],
      transactions: [],
      financeGoals: [],

      addPortfolio: (portfolio) => set((state) => {
        const newPortfolio = { ...portfolio, id: generateId(), createdAt: new Date() };
        return { portfolios: [...state.portfolios, newPortfolio] };
      }),

      updatePortfolio: (id, updates) => set((state) => ({
        portfolios: state.portfolios.map(p => p.id === id ? { ...p, ...updates } : p)
      })),

      deletePortfolio: (id) => set((state) => ({
        portfolios: state.portfolios.filter(p => p.id !== id),
        transactions: state.transactions.filter(t => t.portfolioId !== id),
        financeGoals: state.financeGoals.filter(g => g.portfolioId !== id),
      })),

      addTransaction: (transaction) => set((state) => {
        const newTransaction = { ...transaction, id: generateId(), createdAt: new Date() };
        // Update portfolio balance
        const portfolios = state.portfolios.map(p => {
          if (p.id !== transaction.portfolioId) return p;
          let newBalance = p.balance;
          if (transaction.type === 'income') newBalance += transaction.amount;
          else if (transaction.type === 'expense') newBalance -= transaction.amount;
          return { ...p, balance: newBalance };
        });
        return { 
          transactions: [...state.transactions, newTransaction],
          portfolios
        };
      }),

      deleteTransaction: (id) => set((state) => {
        const tx = state.transactions.find(t => t.id === id);
        if (!tx) return state;
        // Reverse the transaction on portfolio balance
        const portfolios = state.portfolios.map(p => {
          if (p.id !== tx.portfolioId) return p;
          let newBalance = p.balance;
          if (tx.type === 'income') newBalance -= tx.amount;
          else if (tx.type === 'expense') newBalance += tx.amount;
          return { ...p, balance: newBalance };
        });
        return {
          transactions: state.transactions.filter(t => t.id !== id),
          portfolios
        };
      }),

      addFinanceGoal: (goal) => set((state) => ({
        financeGoals: [...state.financeGoals, { ...goal, id: generateId(), createdAt: new Date() }]
      })),

      updateFinanceGoal: (id, updates) => set((state) => ({
        financeGoals: state.financeGoals.map(g => g.id === id ? { ...g, ...updates } : g)
      })),

      deleteFinanceGoal: (id) => set((state) => ({
        financeGoals: state.financeGoals.filter(g => g.id !== id)
      })),
    }),
    {
      name: 'adaptmind-storage',
    }
  )
);
