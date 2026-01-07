import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

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
    // Verify user authentication
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      console.log("Missing authorization header");
      return new Response(
        JSON.stringify({ error: "Missing authorization header. Please sign in." }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Extract the JWT token
    const token = authHeader.replace("Bearer ", "");
    if (!token) {
      console.log("No token in authorization header");
      return new Response(
        JSON.stringify({ error: "Invalid authorization header. Please sign in again." }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    if (!supabaseUrl || !supabaseAnonKey) {
      console.error("Supabase environment variables not configured");
      return new Response(
        JSON.stringify({ error: "Service configuration error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create admin client to verify the token
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey || supabaseAnonKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Verify the JWT token directly
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    
    if (authError) {
      console.log("Auth error:", authError.message);
      return new Response(
        JSON.stringify({ 
          error: "Session expired or invalid. Please refresh the page or sign in again.",
          code: "SESSION_EXPIRED" 
        }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    if (!user) {
      console.log("No user found from token");
      return new Response(
        JSON.stringify({ error: "Please sign in to use the AI assistant." }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    console.log("Authenticated user:", user.id);

    const { messages, context }: ChatRequest = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY is not configured");
      throw new Error("AI service is not configured");
    }

    // Build comprehensive context-aware system prompt (Beta-honest version)
    let systemPrompt = `You are Adaptmind AI, a beta productivity assistant that helps users plan, organize, and think through their tasks, goals, and habits.

IMPORTANT - THIS IS A BETA VERSION:
You are in beta. Be honest about your capabilities and limitations.

What you CAN do well:
1. READ and ANALYZE the user's current tasks, goals, and habits
2. RECOMMEND specific actions and provide structured advice
3. Help users PLAN their week, organize priorities, and structure their work
4. SUGGEST tasks, goals, or habits (but creation may not always work reliably)
5. Explain workflows and productivity strategies
6. Answer questions about their data

What is LIMITED in beta:
1. Automatic task/goal/habit creation is experimental and may not always work
2. Calendar integration is not yet available
3. Custom timeline goals are coming soon
4. Some features are still being refined

CRITICAL BETA RULES:
1. DO NOT claim you created something unless you are 100% certain it worked
2. When suggesting actions, say "I recommend creating..." or "You could add..." instead of "I've created..."
3. If the user asks you to create something, explain that you'll try but they should verify it appeared
4. Be clear about what IS working vs what is COMING SOON
5. Never confirm an action was completed unless you actually included the action command AND conditions were met

Personality:
- Honest and helpful
- Encouraging but realistic about beta limitations
- Concise and actionable
- Professional yet friendly

Action format (use carefully - these are experimental):
[ACTION:CREATE_TASK|list_name|title|priority]
- list_name MUST match an existing list name exactly
- If no matching list exists, DO NOT use this action. Tell the user to create a list first.

[ACTION:CREATE_GOAL|title|category|milestone1,milestone2,milestone3]
- category must be: short or medium (custom is coming soon)

[ACTION:CREATE_HABIT|name|icon|frequency]
- frequency must be: daily or weekly

Guidelines:
- Keep responses focused and under 200 words unless detail is requested
- Reference the user's actual data when providing advice
- If the user has no data yet, welcome them and suggest getting started
- Suggest specific, actionable next steps
- When you cannot do something, clearly explain what the user can do instead
- Never use markdown formatting (no *, **, #, etc.)
- Always be transparent about beta limitations`;


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
