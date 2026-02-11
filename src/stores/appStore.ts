import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { TodoList, TodoItem, Goal, Habit, ChatMessage, ViewType, Portfolio, Transaction, FinanceGoal } from '@/types';

interface AppState {
  currentView: ViewType;
  setCurrentView: (view: ViewType) => void;
  
  // Todo Lists
  todoLists: TodoList[];
  addTodoList: (list: Omit<TodoList, 'id' | 'items'>) => void;
  updateTodoList: (id: string, updates: Partial<Omit<TodoList, 'id' | 'items'>>) => void;
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
  
  // Manual Tutorial
  showManualTutorial: boolean;
  setShowManualTutorial: (show: boolean) => void;

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

  // Reset all user data (used on sign-out)
  resetUserData: () => void;
}

const generateId = () => Math.random().toString(36).substring(2, 15);

// Storage key prefix – will be combined with userId to namespace data per user
const STORAGE_KEY_PREFIX = 'adaptmind-storage';

/** Build the per-user localStorage key. Falls back to a shared key when no userId is known. */
export function getStorageKey(userId?: string | null): string {
  return userId ? `${STORAGE_KEY_PREFIX}-${userId}` : STORAGE_KEY_PREFIX;
}

const emptyUserData = {
  todoLists: [] as TodoList[],
  goals: [] as Goal[],
  habits: [] as Habit[],
  chatMessages: [] as ChatMessage[],
  portfolios: [] as Portfolio[],
  transactions: [] as Transaction[],
  financeGoals: [] as FinanceGoal[],
};

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      currentView: 'dashboard',
      setCurrentView: (view) => set({ currentView: view }),
      
      // Todo Lists
      ...emptyUserData,
      
      addTodoList: (list) => set((state) => ({
        todoLists: [...state.todoLists, { ...list, id: generateId(), items: [] }]
      })),

      updateTodoList: (id, updates) => set((state) => ({
        todoLists: state.todoLists.map(list => 
          list.id === id ? { ...list, ...updates } : list
        )
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
      addChatMessage: (message) => set((state) => ({
        chatMessages: [...state.chatMessages, { ...message, id: generateId(), timestamp: new Date() }]
      })),
      
      clearChat: () => set({ chatMessages: [] }),
      
      // Sidebar
      sidebarCollapsed: false,
      toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
      
      // Manual Tutorial
      showManualTutorial: false,
      setShowManualTutorial: (show) => set({ showManualTutorial: show }),

      // Finance
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

      // Reset all user data on sign-out
      resetUserData: () => set({
        ...emptyUserData,
        currentView: 'dashboard',
      }),
    }),
    {
      name: STORAGE_KEY_PREFIX,
    }
  )
);

/**
 * Switch the Zustand persist storage key to match the signed-in user.
 * Call this on sign-in (with userId) and sign-out (without userId).
 * On sign-out it also wipes in-memory state so the next user starts clean.
 */
export function switchStorageToUser(userId?: string | null) {
  const store = useAppStore;
  const newKey = getStorageKey(userId);

  // Update the persist API to use the new key
  store.persist.setOptions({ name: newKey });

  if (!userId) {
    // Sign-out: clear in-memory state
    store.getState().resetUserData();
    return;
  }

  // Sign-in: rehydrate from the user-specific key (if any data exists)
  store.persist.rehydrate();
}
