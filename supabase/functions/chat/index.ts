import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ChatRequest {
  messages: { role: string; content: string }[];
  context?: {
    tasks: { pending: number; completed: number; total: number };
    goals: { count: number; avgProgress: number };
    habits: { total: number; completedToday: number; topStreak: number };
  };
}

serve(async (req) => {
  // Handle CORS preflight requests
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

    // Build context-aware system prompt
    let systemPrompt = `You are Adaptmind AI, an intelligent productivity assistant. You help users plan their days, manage tasks, achieve goals, and build better habits.

Your personality:
- Encouraging but not overly cheerful
- Concise and actionable
- Smart and adaptive
- Professional yet friendly

Guidelines:
- Keep responses focused and under 200 words unless detail is requested
- Use bullet points and formatting for clarity
- Reference the user's actual data when providing advice
- Suggest specific, actionable next steps
- Be motivating without being pushy`;

    if (context) {
      systemPrompt += `

User's current productivity data:
- Tasks: ${context.tasks.pending} pending out of ${context.tasks.total} total (${context.tasks.completed} completed)
- Goals: ${context.goals.count} active goals with ${context.goals.avgProgress}% average progress
- Habits: ${context.habits.completedToday}/${context.habits.total} completed today, best streak is ${context.habits.topStreak} days

Use this data to provide personalized, relevant advice. Reference specific numbers when giving feedback.`;
    }

    console.log("Sending request to Lovable AI Gateway");

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
          {
            status: 429,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
      
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add credits in settings." }),
          {
            status: 402,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
      
      return new Response(
        JSON.stringify({ error: "AI service temporarily unavailable" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
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
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
