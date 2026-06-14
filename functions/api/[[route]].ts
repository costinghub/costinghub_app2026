import { createClient } from "@supabase/supabase-js";

interface WebhookPayload {
  user_email: string;
  plan: "Free" | "Standard" | "Pro" | "Team";
  expiry_date: string;
  payment_id: string;
}

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
  Standard: {
    calculation_limit: 50,
    features: { 
      can_export_pdf: true, 
      can_export_excel: false, 
      can_use_cnc_costing: true, 
      can_use_should_costing: true, 
      can_manage_team: true, 
      max_team_members: 5 
    },
  },
  Pro: {
    calculation_limit: 500,
    features: { 
      can_export_pdf: true, 
      can_export_excel: true, 
      can_use_cnc_costing: true, 
      can_use_should_costing: true, 
      can_manage_team: true, 
      max_team_members: 10 
    },
  },
  Team: {
    calculation_limit: 9999,
    features: { 
      can_export_pdf: true, 
      can_export_excel: true, 
      can_use_cnc_costing: true, 
      can_use_should_costing: true, 
      can_manage_team: true, 
      max_team_members: 50 
    },
  },
};

export const onRequest: PagesFunction = async (context) => {
  const { request, env } = context;

  // Enable CORS
  if (request.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
    });
  }

  const supabase = createClient(
    env.SUPABASE_URL || "",
    env.SUPABASE_ANON_KEY || ""
  );

  const url = new URL(request.url);

  try {
    if (url.pathname === "/api/provision-subscription" && request.method === "POST") {
      const payload: WebhookPayload = await request.json();
      
      const { plan, expiry_date, payment_id } = payload;
      const user_email = payload.user_email.toLowerCase();

      if (!PLAN_SPECS[plan]) {
        return new Response(
          JSON.stringify({ error: "Invalid plan" }),
          { status: 400, headers: { "Content-Type": "application/json" } }
        );
      }

      const planSpec = PLAN_SPECS[plan];

      const { data: existingUser, error: findError } = await supabase
        .from("profiles")
        .select("*")
        .eq("email", user_email)
        .single();

      if (findError && findError.code !== "PGRST116") {
        throw findError;
      }

      if (existingUser) {
        await supabase
          .from("profiles")
          .update({
            plan_name: plan,
            subscription_status: "active",
            plan_expiry: expiry_date,
            payment_id: payment_id,
            ...planSpec.features,
            calculation_limit: planSpec.calculation_limit,
          })
          .eq("id", existingUser.id);
      } else {
        await supabase.from("profiles").insert({
          email: user_email,
          plan_name: plan,
          subscription_status: "active",
          plan_expiry: expiry_date,
          payment_id: payment_id,
          ...planSpec.features,
          calculation_limit: planSpec.calculation_limit,
        });
      }

      return new Response(
        JSON.stringify({ success: true, message: "Subscription provisioned" }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: "Not found" }),
      { status: 404, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Internal error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
