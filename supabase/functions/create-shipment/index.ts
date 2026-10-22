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
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const { courier_slug, order_id } = await req.json();
    if (!courier_slug || !order_id) {
      return new Response(JSON.stringify({ error: "courier_slug and order_id are required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const { data: cfgData, error: cfgErr } = await supabase
      .from("courier_configs")
      .select("*")
      .eq("courier_slug", courier_slug)
      .eq("is_enabled", true)
      .maybeSingle();
    if (cfgErr || !cfgData) {
      return new Response(JSON.stringify({ error: "Courier not configured or disabled" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const { data: order, error: orderErr } = await supabase
      .from("orders")
      .select("*, customer")
      .eq("id", order_id)
      .maybeSingle();
    if (orderErr || !order) {
      return new Response(JSON.stringify({ error: "Order not found" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const awb = generateMockAwb(courier_slug);
    const trackingUrl = trackingUrlForCourier(courier_slug, awb);

    await supabase
      .from("orders")
      .update({
        courier_name: courier_slug,
        awb_number: awb,
        tracking_url: trackingUrl,
        status: "shipped",
      })
      .eq("id", order_id);

    return new Response(JSON.stringify({ success: true, courier_name: courier_slug, awb_number: awb, tracking_url: trackingUrl }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});

function generateMockAwb(slug: string): string {
  const prefix = slug.substring(0, 3).toUpperCase();
  const num = Math.floor(100000000 + Math.random() * 900000000);
  return `${prefix}${num}`;
}

function trackingUrlForCourier(slug: string, awb: string): string {
  switch (slug) {
    case "delhivery":
      return `https://www.delhivery.com/track/package/${awb}`;
    case "shiprocket":
      return `https://www.shiprocket.in/tracking/${awb}`;
    case "steadfast":
      return `https://steadfast.com.bd/track/${awb}`;
    case "dtdc":
      return `https://www.dtdc.in/tracking/tracking-results.asp?strConsignmentNo=${awb}`;
    case "bluedart":
      return `https://www.bluedart.com/tracking?tracknum=${awb}`;
    default:
      return "";
  }
}