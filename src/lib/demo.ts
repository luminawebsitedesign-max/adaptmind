/**
 * Demo mode
 * ---------
 * When VITE_DEMO_MODE is on, the app makes ZERO backend (Supabase) and ZERO AI
 * requests. All data lives in localStorage and the AI assistant returns a
 * bundled sample plan (see src/data/demoWeeklyPlan.ts).
 *
 * Default: ON for production builds (the hosted demo), OFF for local dev.
 * Override explicitly with VITE_DEMO_MODE="true" | "false".
 */
const rawFlag = import.meta.env.VITE_DEMO_MODE as string | undefined;

export const DEMO_MODE =
  rawFlag === undefined || rawFlag === ''
    ? Boolean(import.meta.env.PROD)
    : rawFlag === 'true';

export const DEMO_REPO_URL = 'https://github.com/luminawebsitedesign-max/adaptmind';

export const DEMO_USER_ID = 'demo-user';

export const demoUser = {
  id: DEMO_USER_ID,
  email: 'demo@adaptmind.app',
  app_metadata: {},
  user_metadata: { full_name: 'Demo Visitor' },
  aud: 'demo',
  created_at: new Date().toISOString(),
} as unknown as import('@supabase/supabase-js').User;

export const demoProfile = {
  id: DEMO_USER_ID,
  user_id: DEMO_USER_ID,
  display_name: 'Demo Visitor',
  avatar_url: null,
  onboarding_completed: true,
  welcome_form_completed: true,
  welcome_tutorial_completed: true,
  preferred_language: 'en',
  primary_use: 'Exploring the demo',
  user_notes: null,
  disable_auto_tutorial: true,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

const SEED_FLAG = 'adaptmind-demo-seeded-v1';

const daysFromNow = (n: number) => {
  const d = new Date();
  d.setDate(d.getDate() + n);
  d.setHours(0, 0, 0, 0);
  return d;
};

const isoDaysAgo = (n: number) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().split('T')[0];
};

/** Seed believable sample data once, so the demo never opens empty. */
export function seedDemoData() {
  if (!DEMO_MODE) return;
  if (localStorage.getItem(SEED_FLAG)) return;

  // Imported lazily to avoid a circular import at module load.
  import('@/stores/appStore').then(({ useAppStore }) => {
    const state = useAppStore.getState();
    if (state.todoLists.length || state.goals.length || state.habits.length) {
      localStorage.setItem(SEED_FLAG, '1');
      return;
    }

    state.addTodoList({ name: 'This Week', icon: '🗓️', color: 'primary' } as never);
    state.addTodoList({ name: 'Side Project', icon: '🚀', color: 'accent' } as never);

    const lists = useAppStore.getState().todoLists;
    const week = lists.find((l) => l.name === 'This Week');
    const side = lists.find((l) => l.name === 'Side Project');

    if (week) {
      state.addTodoItem(week.id, {
        title: 'Review Monday priorities',
        priority: 'high', completed: true, progress: 100, listId: week.id,
      } as never);
      state.addTodoItem(week.id, {
        title: 'Draft quarterly update email',
        priority: 'medium', completed: false, progress: 40, listId: week.id,
        deadline: daysFromNow(1),
      } as never);
      state.addTodoItem(week.id, {
        title: 'Book dentist appointment',
        priority: 'low', completed: false, progress: 0, listId: week.id,
        deadline: daysFromNow(4),
      } as never);
    }

    if (side) {
      state.addTodoItem(side.id, {
        title: 'Sketch landing page layout',
        priority: 'high', completed: false, progress: 60, listId: side.id,
        deadline: daysFromNow(2),
      } as never);
      state.addTodoItem(side.id, {
        title: 'Write launch checklist',
        priority: 'medium', completed: false, progress: 0, listId: side.id,
        deadline: daysFromNow(6),
      } as never);
    }

    state.addGoal({
      title: 'Launch personal website',
      category: 'short',
      progress: 50,
      startDate: new Date(),
      deadline: daysFromNow(21),
      milestones: [
        { id: '1', title: 'Pick a domain', completed: true },
        { id: '2', title: 'Design homepage', completed: true },
        { id: '3', title: 'Write about page', completed: false },
        { id: '4', title: 'Publish and share', completed: false },
      ],
    } as never);

    state.addGoal({
      title: 'Read 12 books this year',
      category: 'medium',
      progress: 25,
      startDate: new Date(),
      deadline: daysFromNow(120),
      milestones: [
        { id: '1', title: 'Finish 3 books', completed: true },
        { id: '2', title: 'Finish 6 books', completed: false },
        { id: '3', title: 'Finish 9 books', completed: false },
        { id: '4', title: 'Finish 12 books', completed: false },
      ],
    } as never);

    state.addHabit({ name: 'Morning walk', icon: '🚶', frequency: 'daily' } as never);
    state.addHabit({ name: 'Read 20 pages', icon: '📚', frequency: 'daily' } as never);
    state.addHabit({ name: 'Weekly review', icon: '🧭', frequency: 'weekly' } as never);

    // Give the daily habits a believable streak.
    const habits = useAppStore.getState().habits;
    habits.slice(0, 2).forEach((h) => {
      [0, 1, 2, 3].forEach((n) =>
        useAppStore.getState().toggleHabitCompletion(h.id, isoDaysAgo(n))
      );
    });

    localStorage.setItem(SEED_FLAG, '1');
  });
}
