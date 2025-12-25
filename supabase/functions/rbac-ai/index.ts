import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const systemPrompt = `You are an AI assistant for an RBAC (Role-Based Access Control) configuration tool.
You can help users manage permissions and roles using natural language commands.

AVAILABLE ACTIONS:
1. create_permission: Create a new permission
2. create_role: Create a new role
3. assign_permission: Assign a permission to a role
4. remove_permission: Remove a permission from a role

When the user gives you a command, analyze it and return a JSON response with the action to take.

RESPONSE FORMAT (always return valid JSON):
{
  "action": "create_permission" | "create_role" | "assign_permission" | "remove_permission" | "info",
  "data": {
    // For create_permission:
    "name": "permission_name",
    "description": "optional description"
    
    // For create_role:
    "name": "Role Name",
    "description": "optional description"
    
    // For assign_permission or remove_permission:
    "role_name": "Content Editor",
    "permission_name": "can_edit_articles"
  },
  "message": "Human-readable confirmation or response"
}

EXAMPLES:
- "Create a permission called can_publish_content" → action: create_permission
- "Create a new role named Marketing Manager" → action: create_role
- "Give the Content Editor role the permission to edit articles" → action: assign_permission
- "Remove delete permission from the Viewer role" → action: remove_permission
- "What permissions does Admin have?" → action: info (query, don't modify)

Be helpful and parse user intent even if they don't use exact terminology.
Always respond with valid JSON that can be parsed.`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    console.log("Processing AI command:", message);

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
          { role: "user", content: message }
        ],
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
          JSON.stringify({ error: "AI credits exhausted. Please add credits to continue." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    console.log("AI response:", content);

    // Try to parse the AI response as JSON
    let parsedResponse;
    try {
      // Extract JSON from the response (sometimes wrapped in markdown)
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsedResponse = JSON.parse(jsonMatch[0]);
      } else {
        parsedResponse = {
          action: "info",
          message: content,
          data: null
        };
      }
    } catch {
      parsedResponse = {
        action: "info",
        message: content,
        data: null
      };
    }

    return new Response(
      JSON.stringify(parsedResponse),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in rbac-ai function:", error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "Unknown error occurred",
        action: "error"
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
