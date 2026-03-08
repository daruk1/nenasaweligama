import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const TEACHER_EMAIL = "darukanethmallife@gmail.com";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { name, email, phone, subjects } = await req.json();

    if (!name || !email || !phone || !subjects || subjects.length === 0) {
      return new Response(
        JSON.stringify({ error: "All fields are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Store registration in database
    const { data: regData, error: dbError } = await supabase
      .from("registrations")
      .insert({ name, email, phone, subjects })
      .select("id")
      .single();

    if (dbError) {
      console.error("DB error:", dbError);
      throw new Error("Failed to save registration");
    }

    // Send email via Resend
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (!RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY not configured");
    }

    const emailRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "Nenasa Education <onboarding@resend.dev>",
        to: [TEACHER_EMAIL],
        subject: `New Registration: ${name} - ${subjects.join(", ")}`,
        html: `
          <h2>New Student Registration - Nenasa Education</h2>
          <table style="border-collapse:collapse;width:100%;max-width:500px;">
            <tr><td style="padding:8px;font-weight:bold;">Name</td><td style="padding:8px;">${name}</td></tr>
            <tr><td style="padding:8px;font-weight:bold;">Email</td><td style="padding:8px;">${email}</td></tr>
            <tr><td style="padding:8px;font-weight:bold;">Phone</td><td style="padding:8px;">${phone}</td></tr>
            <tr><td style="padding:8px;font-weight:bold;">Subjects</td><td style="padding:8px;">${subjects.join(", ")}</td></tr>
            <tr><td style="padding:8px;font-weight:bold;">Registered</td><td style="padding:8px;">${new Date().toISOString()}</td></tr>
          </table>
          <p style="margin-top:16px;">Please respond to the student within 24 hours.</p>
        `,
      }),
    });

    const emailData = await emailRes.json();
    console.log("Resend response:", emailData);

    if (!emailRes.ok) {
      console.error("Resend error:", emailData);
      // Don't throw - registration is saved, email is secondary
    }

    return new Response(
      JSON.stringify({ success: true, message: "Registration submitted successfully", registrationId: regData.id }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to process registration" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
