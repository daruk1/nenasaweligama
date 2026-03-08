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

    const GOOGLE_AI_API_KEY = Deno.env.get("GOOGLE_AI_API_KEY");
    if (!GOOGLE_AI_API_KEY) {
      throw new Error("GOOGLE_AI_API_KEY is not configured");
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

    // Convert messages to Google AI format, filtering properly
    const googleMessages: Array<{ role: string; parts: Array<Record<string, unknown>> }> = [];

    for (const msg of messages) {
      const role = msg.role === "assistant" ? "model" : "user";

      let parts: Array<Record<string, unknown>>;
      if (typeof msg.content === "string") {
        parts = [{ text: msg.content }];
      } else if (Array.isArray(msg.content)) {
        parts = msg.content.map((part: { type: string; text?: string; image_url?: { url: string } }) => {
          if (part.type === "text") return { text: part.text || "" };
          if (part.type === "image_url" && part.image_url?.url) {
            const match = part.image_url.url.match(/^data:(.*?);base64,(.*)$/);
            if (match) {
              return { inline_data: { mime_type: match[1], data: match[2] } };
            }
          }
          return { text: "" };
        });
      } else {
        parts = [{ text: String(msg.content || "") }];
      }

      googleMessages.push({ role, parts });
    }

    // Google AI requires first message to be from "user" — skip leading model messages
    const firstUserIdx = googleMessages.findIndex((m) => m.role === "user");
    const filteredMessages = firstUserIdx >= 0 ? googleMessages.slice(firstUserIdx) : googleMessages;

    // Ensure alternating roles (Google AI requirement) — merge consecutive same-role messages
    const mergedMessages: typeof filteredMessages = [];
    for (const msg of filteredMessages) {
      const last = mergedMessages[mergedMessages.length - 1];
      if (last && last.role === msg.role) {
        last.parts.push(...msg.parts);
      } else {
        mergedMessages.push({ ...msg, parts: [...msg.parts] });
      }
    }

    if (mergedMessages.length === 0) {
      return new Response(
        JSON.stringify({ error: "No valid messages provided." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Sending to Gemini 2.0 Flash, messages count:", mergedMessages.length);

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:streamGenerateContent?alt=sse&key=${GOOGLE_AI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: systemPrompt }] },
          contents: mergedMessages,
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 2048,
          },
        }),
      }
    );

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Too many requests. Please wait a moment and try again." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const t = await response.text();
      console.error("Google AI error:", response.status, t);
      return new Response(
        JSON.stringify({ error: "AI service is currently unavailable." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Transform Google SSE stream to OpenAI-compatible SSE format
    const { readable, writable } = new TransformStream();
    const writer = writable.getWriter();
    const encoder = new TextEncoder();

    (async () => {
      try {
        const reader = response.body!.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });

          let newlineIdx: number;
          while ((newlineIdx = buffer.indexOf("\n")) !== -1) {
            const line = buffer.slice(0, newlineIdx).trim();
            buffer = buffer.slice(newlineIdx + 1);

            if (!line.startsWith("data: ")) continue;
            const jsonStr = line.slice(6);
            if (jsonStr === "[DONE]") continue;

            try {
              const parsed = JSON.parse(jsonStr);
              const text = parsed.candidates?.[0]?.content?.parts?.[0]?.text;
              if (text) {
                const chunk = {
                  choices: [{ delta: { content: text } }],
                };
                await writer.write(encoder.encode(`data: ${JSON.stringify(chunk)}\n\n`));
              }
            } catch {
              // skip malformed JSON
            }
          }
        }
        await writer.write(encoder.encode("data: [DONE]\n\n"));
      } catch (e) {
        console.error("Stream error:", e);
      } finally {
        await writer.close();
      }
    })();

    return new Response(readable, {
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
