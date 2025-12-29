import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ChatRequest {
  messages: { role: string; content: string }[];
  context?: {
    tasks: { 
      pending: number; 
      completed: number; 
      total: number;
      lists: { id: string; name: string; icon: string; taskCount: number }[];
      allTasks: { id: string; title: string; listId: string; listName: string; priority: string; completed: boolean; deadline?: string }[];
    };
    goals: { 
      count: number; 
      avgProgress: number;
      all: { id: string; title: string; progress: number; category: string; milestones: { title: string; completed: boolean }[] }[];
    };
    habits: { 
      total: number; 
      completedToday: number; 
      topStreak: number;
      all: { id: string; name: string; icon: string; frequency: string; streak: number; completedToday: boolean }[];
    };
    userPreferences?: string;
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, context }: ChatRequest = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY is not configured");
      throw new Error("AI service is not configured");
    }

    // Build comprehensive context-aware system prompt
    let systemPrompt = `You are Adaptmind AI, an intelligent productivity assistant that can directly manage the user's tasks, goals, and habits.

Your capabilities:
1. READ and ANALYZE the user's current tasks, goals, and habits
2. RECOMMEND specific actions based on their data
3. CREATE new tasks, goals, or habits by responding with structured commands
4. REORGANIZE existing tasks by suggesting moves between lists
5. PROVIDE personalized productivity advice

Personality:
- Encouraging but not overly cheerful
- Concise and actionable
- Smart and adaptive
- Professional yet friendly

CRITICAL RULES FOR ACTIONS:
1. ONLY use action commands when you are certain they will succeed
2. For CREATE_TASK: You MUST specify an existing list name. Check the user's current lists before suggesting task creation.
3. If the user has no lists, tell them to create a list first before creating tasks
4. If an action cannot be completed, explain WHY clearly instead of pretending it worked
5. Never confirm an action was completed unless you included the action command

Action format (use ONLY when conditions are met):
[ACTION:CREATE_TASK|list_name|title|priority]
- list_name MUST match an existing list name exactly (case-insensitive)
- priority must be: low, medium, or high

[ACTION:CREATE_GOAL|title|category|milestone1,milestone2,milestone3]
- category must be: short, medium, or custom

[ACTION:CREATE_HABIT|name|icon|frequency]
- frequency must be: daily, weekly, or custom

[ACTION:MOVE_TASK|task_id|from_list|to_list]
[ACTION:SUGGEST_PLAN|day1_tasks|day2_tasks|day3_tasks]

Guidelines:
- Keep responses focused and under 200 words unless detail is requested
- Reference the user's actual data when providing advice
- If the user has no data yet, welcome them and suggest getting started
- Suggest specific, actionable next steps
- When organizing tasks, explain your reasoning
- Be motivating without being pushy
- Never use markdown formatting (no *, **, #, etc.)
- If you cannot perform a requested action, clearly explain why`;


    if (context?.userPreferences) {
      systemPrompt += `

USER PREFERENCES (adjust your tone and advice accordingly):
${context.userPreferences}`;
    }

    if (context) {
      systemPrompt += `

CURRENT USER DATA:

TASK LISTS:
${context.tasks.lists.map(l => `- ${l.icon} ${l.name}: ${l.taskCount} tasks`).join('\n')}

ALL TASKS:
${context.tasks.allTasks.slice(0, 20).map(t => 
  `- [${t.completed ? 'x' : ' '}] "${t.title}" in ${t.listName} (${t.priority} priority)${t.deadline ? ` due ${t.deadline}` : ''}`
).join('\n')}
${context.tasks.allTasks.length > 20 ? `\n... and ${context.tasks.allTasks.length - 20} more tasks` : ''}

Task Summary: ${context.tasks.pending} pending, ${context.tasks.completed} completed out of ${context.tasks.total} total

GOALS:
${context.goals.all.map(g => 
  `- "${g.title}" (${g.category} term): ${g.progress}% complete
   Milestones: ${g.milestones.map(m => `[${m.completed ? 'x' : ' '}] ${m.title}`).join(', ')}`
).join('\n')}

Goal Summary: ${context.goals.count} active goals, ${context.goals.avgProgress}% average progress

HABITS:
${context.habits.all.map(h => 
  `- ${h.icon} "${h.name}" (${h.frequency}): ${h.streak} day streak, ${h.completedToday ? 'completed today' : 'not done today'}`
).join('\n')}

Habit Summary: ${context.habits.completedToday}/${context.habits.total} completed today, best streak is ${context.habits.topStreak} days

Use this data to provide personalized, relevant advice. Reference specific tasks, goals, and habits by name when giving feedback.`;
    }

    console.log("Sending request to Lovable AI Gateway with full context");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add credits in settings." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      return new Response(
        JSON.stringify({ error: "AI service temporarily unavailable" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Successfully received response from AI Gateway, streaming...");

    return new Response(response.body, {
      headers: { 
        ...corsHeaders, 
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
      },
    });
  } catch (error) {
    console.error("Chat function error:", error);
    return new Response(
      JSON.stringify({ error: "An unexpected error occurred. Please try again." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
