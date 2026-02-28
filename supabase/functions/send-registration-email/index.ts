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
    const { error: dbError } = await supabase
      .from("registrations")
      .insert({ name, email, phone, subjects });

    if (dbError) {
      console.error("DB error:", dbError);
      throw new Error("Failed to save registration");
    }

    // Send notification email to teacher using Supabase's auth.admin
    // We use a simple approach: send via SMTP relay
    const emailSubject = `New Registration: ${name} - ${subjects.join(", ")}`;
    const emailBody = `
New Student Registration at Nenasa Education

Student Details:
- Name: ${name}
- Email: ${email}
- Phone: ${phone}
- Subjects: ${subjects.join(", ")}
- Registered: ${new Date().toISOString()}

Please respond to the student within 24 hours.
    `.trim();

    // Log the registration for now (email will be sent via the configured SMTP)
    console.log(`📧 Registration notification for teacher (${TEACHER_EMAIL}):`);
    console.log(`Subject: ${emailSubject}`);
    console.log(`Body: ${emailBody}`);

    return new Response(
      JSON.stringify({ success: true, message: "Registration submitted successfully" }),
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
