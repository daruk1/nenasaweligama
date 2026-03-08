import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, grade, subject } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemPrompt = `You are "Nenasa AI Tutor", a friendly and encouraging study assistant for Sri Lankan students in Grade ${grade || "6-13"}.
${subject ? `The student is currently studying: ${subject}.` : ""}

Your role:
- Help students understand homework problems step-by-step. Don't just give answers — guide them to understand.
- Explain concepts clearly using simple language appropriate for their grade level.
- Give exam tips and study strategies when asked.
- Be encouraging and supportive. Use emojis occasionally to keep things friendly 😊
- If the student asks something outside academics, gently redirect them to study topics.
- Keep responses concise but thorough. Use bullet points and numbered steps when helpful.
- You can respond in English or Sinhala based on what the student uses.
- When a student shares an image (photo of homework, textbook page, diagram, etc.), analyze it carefully and help them understand or solve what's shown.
- When asked for guided learning on a topic, structure your response as a mini-lesson with:
  1. 📝 Brief introduction / key concept
  2. 📖 Detailed explanation with examples  
  3. ✏️ Practice questions (2-3)
  4. 💡 Tips to remember`;

    // Build OpenAI-compatible messages
    const apiMessages = [
      { role: "system", content: systemPrompt },
      ...messages.map((msg: { role: string; content: unknown }) => {
        if (typeof msg.content === "string") {
          return { role: msg.role, content: msg.content };
        }
        if (Array.isArray(msg.content)) {
          return {
            role: msg.role,
            content: msg.content.map((part: { type: string; text?: string; image_url?: { url: string } }) => {
              if (part.type === "text") return { type: "text", text: part.text || "" };
              if (part.type === "image_url" && part.image_url?.url) {
                return { type: "image_url", image_url: { url: part.image_url.url } };
              }
              return { type: "text", text: "" };
            }),
          };
        }
        return { role: msg.role, content: String(msg.content || "") };
      }),
    ];

    console.log("Sending to Lovable AI (gemini-2.5-flash-lite), messages count:", apiMessages.length - 1);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-lite",
        messages: apiMessages,
        stream: true,
        temperature: 0.7,
        max_tokens: 2048,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Too many requests. Please wait a moment and try again." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const t = await response.text();
      console.error("AI Gateway error:", response.status, t);
      return new Response(
        JSON.stringify({ error: "AI service is currently unavailable." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Stream is already in OpenAI SSE format — pass through
    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("student-chat error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
