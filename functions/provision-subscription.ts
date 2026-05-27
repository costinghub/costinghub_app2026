
import { createClient } from "@supabase/supabase-js";

interface WebhookPayload {
  user_email: string;
  plan: "Free" | "Standard" | "Pro" | "Team"; // Standard = Pro, Team = Premium
  expiry_date: string;
  payment_id: string;
}

// DEFINITION OF RESTRICTIONS
const PLAN_SPECS = {
  Free: {
    calculation_limit: 5,
    features: { 
      can_export_pdf: false, 
      can_export_excel: false, 
      can_use_cnc_costing: true, 
      can_use_should_costing: false, 
      can_manage_team: false, 
      max_team_members: 0 
    },
  },
  Standard: { // "Pro" in UI
    calculation_limit: 50,
    features: { 
      can_export_pdf: true, 
      can_export_excel: false, 
      can_use_cnc_costing: true, 
      can_use_should_costing: true, 
      can_manage_team: false, 
      max_team_members: 0 
    },
  },
  Pro: { // "Premium" / Unlimited
    calculation_limit: -1, 
    features: { 
      can_export_pdf: true, 
      can_export_excel: true, 
      can_use_cnc_costing: true, 
      can_use_should_costing: true, 
      can_manage_team: false, 
      max_team_members: 0 
    },
  },
  Team: { // "Enterprise"
    calculation_limit: -1, 
    features: { 
      can_export_pdf: true, 
      can_export_excel: true, 
      can_use_cnc_costing: true, 
      can_use_should_costing: true, 
      can_manage_team: true, 
      max_team_members: 5 
    },
  },
};

interface Env {
  SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
  MARKETING_WEBHOOK_SECRET: string;
}

export const onRequestPost = async (context: { request: Request; env: Env }) => {
  const { request, env } = context;

  const authHeader = request.headers.get("Authorization");
  const providedSecret = authHeader?.split("Bearer ")[1];
  
  if (!providedSecret || providedSecret !== env.MARKETING_WEBHOOK_SECRET) {
    return new Response("Unauthorized", { status: 401 });
  }

  let payload: WebhookPayload;
  try {
    payload = await request.json();
  } catch (err) {
    return new Response("Invalid JSON", { status: 400 });
  }

  try {
    const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

    const planSpec = PLAN_SPECS[payload.plan] || PLAN_SPECS['Free'];

    // Get User ID
    const { data: user, error: userError } = await supabase
      .from("profiles")
      .select("id")
      .eq("email", payload.user_email)
      .maybeSingle();

    if (userError || !user) throw new Error("User not found");
    
    // Set reset date to 1 month from now
    const nextResetDate = new Date();
    nextResetDate.setMonth(nextResetDate.getMonth() + 1);

    // Update Profile with Plan Specs
    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        plan_name: payload.plan,
        subscription_status: "active",
        subscription_expires_on: payload.expiry_date,
        calculation_limit: planSpec.calculation_limit,
        features: planSpec.features,
        calculations_used: 0, // Reset usage on new plan
        usage_reset_on: nextResetDate.toISOString(),
      })
      .eq("id", user.id);

    if (updateError) throw updateError;

    return new Response(JSON.stringify({ status: "ok" }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });

  } catch (err: any) {
    return new Response(err.message, { status: 500 });
  }
};
