import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.58.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  try {
    const { token, order_id, action, payload } = await req.json();
    if (!token || !order_id || !action) {
      return new Response(JSON.stringify({ error: "token, order_id, and action are required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const now = new Date().toISOString();

    const { data: sessions, error: sessionErr } = await supabase
      .from("customer_sessions")
      .select("phone")
      .eq("token", token)
      .gte("expires_at", now)
      .limit(1);

    if (sessionErr || !sessions || sessions.length === 0) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const phone = sessions[0].phone;

    const { data: order, error: orderErr } = await supabase
      .from("orders")
      .select("id, status, customer")
      .eq("id", order_id)
      .maybeSingle();

    if (orderErr || !order) {
      return new Response(JSON.stringify({ error: "Order not found" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const customerPhone = String((order.customer as any)?.phone ?? "").replace(/[^0-9]/g, "");
    if (customerPhone !== phone) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (order.status !== "pending" && order.status !== "confirmed") {
      return new Response(JSON.stringify({ error: "Order can no longer be modified" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (action === "cancel") {
      await supabase.from("orders").update({ status: "cancelled" }).eq("id", order_id);
      return new Response(JSON.stringify({ success: true, message: "Order cancelled" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "edit") {
      const updates: Record<string, unknown> = {};
      if (payload?.customer_name) {
        const cur = order.customer as Record<string, unknown> || {};
        updates.customer = { ...cur, name: payload.customer_name };
      }
      if (payload?.customer_address) {
        const cur = (updates.customer as Record<string, unknown>) || (order.customer as Record<string, unknown>);
        updates.customer = { ...(order.customer as Record<string, unknown>), ...(cur as Record<string, unknown>), address: payload.customer_address };
      }
      if (payload?.size_chosen) {
        updates.size_chosen = payload.size_chosen;
      }
      if (Object.keys(updates).length === 0) {
        return new Response(JSON.stringify({ error: "Nothing to update" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      await supabase.from("orders").update(updates).eq("id", order_id);
      return new Response(JSON.stringify({ success: true, message: "Order updated" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Invalid action" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});