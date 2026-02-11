import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

// CORS headers for cross-origin requests
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Rate limiting configuration - security hardening
// In-memory store (resets on function cold start, but provides basic protection)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute window
const RATE_LIMIT_MAX_REQUESTS = 20; // Max 20 requests per minute per user

/**
 * Check if a request should be rate limited
 * @param identifier - User ID or IP address
 * @returns true if request should be blocked, false otherwise
 */
function isRateLimited(identifier: string): boolean {
  const now = Date.now();
  const entry = rateLimitStore.get(identifier);
  
  // Clean up expired entries periodically
  if (rateLimitStore.size > 1000) {
    for (const [key, value] of rateLimitStore.entries()) {
      if (now > value.resetTime) {
        rateLimitStore.delete(key);
      }
    }
  }
  
  if (!entry || now > entry.resetTime) {
    // New window
    rateLimitStore.set(identifier, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS });
    return false;
  }
  
  if (entry.count >= RATE_LIMIT_MAX_REQUESTS) {
    return true; // Rate limited
  }
  
  // Increment counter
  entry.count++;
  return false;
}

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

/**
 * Validate and sanitize chat messages
 * Prevents excessively long inputs and validates structure
 */
function validateChatRequest(body: unknown): { valid: boolean; data?: ChatRequest; error?: string } {
  if (!body || typeof body !== 'object') {
    return { valid: false, error: 'Invalid request body' };
  }
  
  const request = body as Record<string, unknown>;
  
  // Validate messages array
  if (!Array.isArray(request.messages)) {
    return { valid: false, error: 'Messages must be an array' };
  }
  
  if (request.messages.length === 0) {
    return { valid: false, error: 'At least one message is required' };
  }
  
  if (request.messages.length > 50) {
    return { valid: false, error: 'Too many messages in conversation' };
  }
  
  // Validate each message
  for (const msg of request.messages) {
    if (typeof msg !== 'object' || msg === null) {
      return { valid: false, error: 'Invalid message format' };
    }
    
    const message = msg as Record<string, unknown>;
    
    if (typeof message.role !== 'string' || !['user', 'assistant', 'system'].includes(message.role)) {
      return { valid: false, error: 'Invalid message role' };
    }
    
    if (typeof message.content !== 'string') {
      return { valid: false, error: 'Message content must be a string' };
    }
    
    // Limit message content length (security: prevent excessive input)
    if (message.content.length > 10000) {
      return { valid: false, error: 'Message content too long (max 10000 characters)' };
    }
  }
  
  return { valid: true, data: body as ChatRequest };
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get client IP for rate limiting (fallback for unauthenticated requests)
    const clientIP = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || 
                     req.headers.get("cf-connecting-ip") || 
                     "unknown";

    // Verify user authentication
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      // Rate limit by IP for unauthenticated requests
      if (isRateLimited(`ip:${clientIP}`)) {
        return new Response(
          JSON.stringify({ error: "Too many requests. Please wait a moment before trying again." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      return new Response(
        JSON.stringify({ error: "Missing authorization header. Please sign in." }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Extract the JWT token
    const token = authHeader.replace("Bearer ", "");
    if (!token) {
      return new Response(
        JSON.stringify({ error: "Invalid authorization header. Please sign in again." }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    if (!supabaseUrl || !supabaseAnonKey) {
      // Security: Don't expose detailed config errors
      console.error("Supabase environment variables not configured");
      return new Response(
        JSON.stringify({ error: "Service temporarily unavailable" }),
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
      // Security: Don't log sensitive auth details
      console.log("Auth verification failed");
      return new Response(
        JSON.stringify({ 
          error: "Session expired or invalid. Please refresh the page or sign in again.",
          code: "SESSION_EXPIRED" 
        }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    if (!user) {
      return new Response(
        JSON.stringify({ error: "Please sign in to use the AI assistant." }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // Rate limit by user ID (primary) and IP (secondary)
    const rateLimitKey = `user:${user.id}`;
    if (isRateLimited(rateLimitKey)) {
      console.log("Rate limit exceeded for user");
      return new Response(
        JSON.stringify({ error: "You're sending messages too quickly. Please wait a moment before trying again." }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse and validate request body
    let requestBody: unknown;
    try {
      requestBody = await req.json();
    } catch {
      return new Response(
        JSON.stringify({ error: "Invalid JSON in request body" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    const validation = validateChatRequest(requestBody);
    if (!validation.valid || !validation.data) {
      return new Response(
        JSON.stringify({ error: validation.error || "Invalid request" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    const { messages, context } = validation.data;
    
    // Get API key from environment (security: never expose in client)
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY is not configured");
      return new Response(
        JSON.stringify({ error: "AI service is not configured. Please contact support." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Build comprehensive context-aware system prompt (Action-first Beta version)
    const todayISO = new Date().toISOString().split('T')[0];
    // Pre-compute day-of-week for deadline math
    const dayNames = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
    const todayDOW = dayNames[new Date().getDay()];

    let systemPrompt = `You are Adaptmind AI, a decisive productivity assistant that TAKES ACTION immediately when users request it.

CRITICAL BEHAVIOR - ACTION FIRST:
When users request tasks, goals, habits, lists, or portfolios - CREATE THEM IMMEDIATELY using action commands.
DO NOT ask follow-up questions unless truly ambiguous. Use sensible defaults for anything unspecified.
ALWAYS include ACTION commands when the user asks you to create, plan, organize, or set up anything.

AVAILABLE ACTIONS (embed these in your response text):
1. [ACTION:CREATE_LIST|name|icon|color]
   - Creates a new task list. Icon = emoji, color = hex like #3B82F6
   - ALWAYS create a list before creating tasks if the user requests a project/plan.
   - Name the list after the project (e.g., "Blog Sprint", "Cookie Business"). Fall back to "General" only if truly generic.

2. [ACTION:CREATE_TASK|list_name|title|priority|deadline]
   - Creates a task in the named list. The list will be auto-created if it doesn't exist.
   - Priority: low, medium, high. Deadline: YYYY-MM-DD or leave empty.
   - IMPORTANT: If the user gives a deadline, SPREAD task due dates across the available days.
     Example: 5 tasks due by Friday (3 days away) -> assign tasks to day 1, 1, 2, 2, 3.

3. [ACTION:CREATE_GOAL|title|category|milestone1,milestone2,milestone3|deadline]
   - Category: short (7 days), medium (30 days), custom.
   - Milestones: comma-separated list. ALWAYS include 3-6 meaningful milestones.
   - Deadline: YYYY-MM-DD. Goals with deadlines show on the calendar with a date range.

4. [ACTION:CREATE_HABIT|name|icon|frequency]
   - Frequency: daily, weekly, custom.

5. [ACTION:CREATE_PORTFOLIO|name|type|icon|balance]
   - Type: personal, investment, savings, custom. Balance: number (default 0).
   - For P&L / business finance requests use type "custom".

========== PLANNING DEPTH RULES ==========

When a user asks you to "plan", "help me with", "set up", or "organize" a PROJECT or EFFORT, generate a COMPREHENSIVE plan. Do NOT create only 2-3 tasks. Follow these minimums:

STANDARD PLAN (default for any project/planning request):
- 1 list (named after the project)
- 8-12 tasks grouped into phases (Planning, Execution, Review/Launch)
- 1 goal with 4-6 milestones that track key deliverables
- 1 habit if the project benefits from daily practice
- 1 portfolio if the user mentions business, revenue, expenses, P&L, money, or budget

MINIMAL PLAN (only if user says "quick", "simple", "just a few", or "minimal"):
- 1 list
- 3-5 tasks
- 1 goal with 2-3 milestones

SINGLE ITEM (user says "create a task" or "add a habit" - one specific thing):
- Create exactly what was asked, nothing more.

========== SMART ASSUMPTIONS ==========

DEADLINES:
- If the user provides a deadline: use it. Spread tasks evenly from tomorrow to the deadline.
- If NO deadline is given: assume a 7-day plan starting tomorrow. Mention this: "I've set this as a 7-day plan. Let me know if you need a different timeline."
- "End of week" = coming Sunday. "Next week" = next Monday through Sunday.

LISTS:
- If tasks are requested and no list name is given, name the list after the project/topic.
- Only use "General" if the request is truly generic (e.g., "create a task called buy milk").

FINANCE / PORTFOLIO:
- If the user mentions business, revenue, expenses, P&L, profit, budget, or money management: automatically include a portfolio action named "<Project> P&L" with type "custom".
- Do NOT create a portfolio for non-business requests unless explicitly asked.

HABITS:
- Match the habit to the project. Writing project -> "Write 500 words". Fitness -> "Exercise 30 min". Business -> "Review finances". Generic -> skip habit.
- Default frequency: daily.

========== RESPONSE FORMAT ==========

Structure your response in this order:

1. SUMMARY LINE with exact counts:
   "I'm about to create: 1 list, 10 tasks, 1 goal (5 milestones), 1 habit, 1 portfolio."

2. GROUPED PLAN OVERVIEW (plain text, no markdown):
   
   List: <name>
   
   Planning phase:
   - Task 1 (due DATE)
   - Task 2 (due DATE)
   
   Execution phase:
   - Task 3 (due DATE)
   - Task 4 (due DATE)
   
   Review phase:
   - Task 5 (due DATE)
   
   Goal: <title>
   Milestones: milestone1, milestone2, milestone3
   
   Habit: <name> (frequency)
   
   Portfolio: <name> (if applicable)

3. ALL [ACTION:...] COMMANDS (these are parsed and shown in the confirmation dialog)

4. SHORT CLOSING NOTE: "Confirm above to add everything to your workspace."

FORMATTING RULES:
- Never use markdown (no *, **, #, backticks, etc.)
- Never claim items already exist until after the user confirms
- Always count your actions before responding and state the count

========== TASK PHASE TEMPLATES ==========

Use these phase structures when generating tasks for projects:

BUSINESS/STARTUP:
Planning: Research market, Define target audience, Create business plan, Source suppliers
Execution: Set up operations, Build brand/marketing, Launch product/service, Set up finances
Review: Track initial results, Gather feedback, Optimize processes

CONTENT/WRITING:
Planning: Research topics, Create outline, Gather references
Execution: Write drafts, Edit and revise, Create visuals/media
Review: Final proofread, Publish, Promote

FITNESS/HEALTH:
Planning: Set baseline measurements, Research program, Get equipment
Execution: Follow daily routine, Track progress, Adjust intensity
Review: Weekly check-in, Measure results, Plan next phase

GENERAL PROJECT:
Planning: Define scope, Research requirements, Create timeline
Execution: Complete core tasks (break into specifics), Test/verify
Review: Review results, Document learnings, Plan next steps

========== DATE CALCULATION ==========

Today is: ${todayISO} (${todayDOW})
Calculate EXACT YYYY-MM-DD dates for relative references:
- "next Wednesday" = find the next Wednesday from today
- "end of week" = the coming Sunday
- "by Friday" = this Friday's date
- "in 2 weeks" = today + 14 days
- No deadline mentioned = 7-day plan starting tomorrow

When spreading tasks:
- Start from tomorrow (${todayISO} + 1 day)
- Distribute evenly. If 10 tasks over 7 days: ~1-2 tasks per day
- Higher priority tasks get earlier dates
- Planning phase tasks come first, review/launch tasks near the deadline

========== DEFAULTS ==========
- List name: based on project context, or "General"
- Priority: planning tasks = "medium", core execution = "high", review = "medium"
- Goal category: "short" for <=7 days, "medium" for <=30 days, "custom" otherwise
- Habit frequency: "daily"
- Icons: contextual emoji (📝 writing, 💪 fitness, 🍪 food, 💼 business, 📊 finance, 📋 general, 🎯 goals, 🚀 launch)
- Portfolio type: "personal" unless business/P&L context -> "custom"

========== EXAMPLE ==========

User: "I'm starting a cookie business. Help me succeed."
Response:

I'm about to create: 1 list, 10 tasks, 1 goal (5 milestones), 1 habit, 1 portfolio. Here's your cookie business plan set up as a 7-day sprint:

List: Cookie Business

Planning phase:
- Research local regulations and permits (due ${todayISO})
- Define product line and pricing (due ${todayISO})
- Source ingredients and packaging suppliers (due ${todayISO})

Execution phase:
- Create brand name and logo concept (due ${todayISO})
- Set up social media accounts (due ${todayISO})
- Develop 3 signature recipes (due ${todayISO})
- Test recipes and get feedback (due ${todayISO})
- Set up basic bookkeeping (due ${todayISO})

Launch phase:
- Plan launch promotion (due ${todayISO})
- Take product photos and announce launch (due ${todayISO})

Goal: Launch Cookie Business
Milestones: Finalize recipes, Set up legal and permits, Build brand presence, Complete first batch, Launch sales

Habit: Review business progress (daily)
Portfolio: Cookie Business P&L

[ACTION:CREATE_LIST|Cookie Business|🍪|#F59E0B]
[ACTION:CREATE_TASK|Cookie Business|Research local regulations and permits|high|DATE]
[ACTION:CREATE_TASK|Cookie Business|Define product line and pricing|high|DATE]
[ACTION:CREATE_TASK|Cookie Business|Source ingredients and packaging suppliers|medium|DATE]
[ACTION:CREATE_TASK|Cookie Business|Create brand name and logo concept|medium|DATE]
[ACTION:CREATE_TASK|Cookie Business|Set up social media accounts|medium|DATE]
[ACTION:CREATE_TASK|Cookie Business|Develop 3 signature recipes|high|DATE]
[ACTION:CREATE_TASK|Cookie Business|Test recipes and get feedback|medium|DATE]
[ACTION:CREATE_TASK|Cookie Business|Set up basic bookkeeping|medium|DATE]
[ACTION:CREATE_TASK|Cookie Business|Plan launch promotion|medium|DATE]
[ACTION:CREATE_TASK|Cookie Business|Take product photos and announce launch|high|DATE]
[ACTION:CREATE_GOAL|Launch Cookie Business|short|Finalize recipes,Set up legal and permits,Build brand presence,Complete first batch,Launch sales|DATE]
[ACTION:CREATE_HABIT|Review business progress|💼|daily]
[ACTION:CREATE_PORTFOLIO|Cookie Business P&L|custom|💰|0]

I've set this as a 7-day sprint. Confirm above to add everything to your workspace. Let me know if you need a different timeline!`;

    if (context?.userPreferences) {
      // Sanitize user preferences (limit length)
      const sanitizedPrefs = String(context.userPreferences).slice(0, 2000);
      systemPrompt += `

USER PREFERENCES (adjust your tone and advice accordingly):
${sanitizedPrefs}`;
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

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      // Security: Log minimal info, don't expose to client
      console.error("AI gateway error:", response.status);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "AI service is busy. Please try again in a moment." }),
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
        JSON.stringify({ error: "AI service temporarily unavailable. Please try again later." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(response.body, {
      headers: { 
        ...corsHeaders, 
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
      },
    });
  } catch (error) {
    // Security: Don't expose stack traces or detailed errors
    console.error("Chat function error");
    return new Response(
      JSON.stringify({ error: "An unexpected error occurred. Please try again." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});