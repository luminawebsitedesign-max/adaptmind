/**
 * Bundled sample weekly plan used when DEMO_MODE is on.
 * No network request of any kind is made to produce this.
 */

const dateIn = (days: number) => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
};

export function getDemoWeeklyPlan(): string {
  return `Here's a balanced plan for your week — sample output generated locally, no AI call was made.

Focus list: Weekly Focus

Tasks
• Plan the week and pick 3 priorities (Mon)
• Deep-work block on your main project (Tue)
• Clear inbox and follow-ups (Wed)
• Draft the update you have been putting off (Thu)
• Review progress and reset for next week (Fri)

Goal: Finish the week with 3 priorities done — with milestones for planning, drafting, reviewing and shipping.

Habit: A 20-minute daily focus block.

Everything above is a sample. Confirm below and I'll add it to your demo data (stored in your browser only).

[ACTION:CREATE_LIST|Weekly Focus|🎯]
[ACTION:CREATE_TASK|Weekly Focus|Plan the week and pick 3 priorities|high|${dateIn(1)}]
[ACTION:CREATE_TASK|Weekly Focus|Deep-work block on your main project|high|${dateIn(2)}]
[ACTION:CREATE_TASK|Weekly Focus|Clear inbox and follow-ups|medium|${dateIn(3)}]
[ACTION:CREATE_TASK|Weekly Focus|Draft the update you have been putting off|medium|${dateIn(4)}]
[ACTION:CREATE_TASK|Weekly Focus|Review progress and reset for next week|low|${dateIn(5)}]
[ACTION:CREATE_GOAL|Finish the week with 3 priorities done|short|Plan the week,Draft the update,Review progress,Ship the priority|${dateIn(5)}]
[ACTION:CREATE_HABIT|20-minute focus block|⏳|daily]`;
}
