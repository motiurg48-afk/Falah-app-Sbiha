import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const MODELS = ["gemini-2.5-flash", "gemini-flash-latest"];
const RETRYABLE = new Set([404, 429, 500, 503]);
const LANG_NAMES: Record<string, string> = { bn: "Bengali", en: "English", hi: "Hindi", ur: "Urdu" };
const MAX_TEXTS = 10;
const MAX_CHARS = 5000;

type Db = ReturnType<typeof createClient>;

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function sha256(text: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function getApiKey(db: Db): Promise<string | null> {
  const fromEnv = Deno.env.get("GEMINI_API_KEY");
  if (fromEnv) return fromEnv;
  const { data } = await db.from("app_secrets").select("value").eq("name", "GEMINI_API_KEY").maybeSingle();
  return (data as { value?: string } | null)?.value ?? null;
}

async function translateBatch(apiKey: string, texts: string[], lang: string): Promise<string[] | null> {
  const prompt =
    `Translate each string in the JSON array below into ${LANG_NAMES[lang]}. ` +
    `If a string is already in ${LANG_NAMES[lang]}, return it unchanged. Preserve line breaks, numbers, sizes, ` +
    `prices and brand names (e.g. FALAH). This is e-commerce text for an Islamic clothing store. ` +
    `Return ONLY a JSON array of strings with the same length and order.\n\n${JSON.stringify(texts)}`;
  const body = JSON.stringify({
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    generationConfig: { temperature: 0.2, responseMimeType: "application/json" },
  });
  for (const model of MODELS) {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
      body,
    });
    if (!res.ok) {
      console.error("Gemini error", model, res.status, (await res.text()).slice(0, 200));
      if (!RETRYABLE.has(res.status)) return null;
      continue;
    }
    const data = await res.json();
    const raw: string = data?.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p.text ?? "").join("") ?? "";
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length === texts.length && parsed.every((s) => typeof s === "string")) {
        return parsed;
      }
    } catch {
      console.error("Unparseable translation output");
    }
    return null;
  }
  return null;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 200, headers: corsHeaders });

  try {
    const { texts, lang } = await req.json();
    if (!LANG_NAMES[lang] || !Array.isArray(texts) || texts.length === 0 || texts.length > MAX_TEXTS) {
      return json({ error: "invalid_request" }, 400);
    }
    if (!texts.every((s) => typeof s === "string" && s.length > 0 && s.length <= MAX_CHARS)) {
      return json({ error: "invalid_text" }, 400);
    }

    const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = Deno.env.toObject();
    const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const hashes = await Promise.all(texts.map((s: string) => sha256(s)));
    const { data: cached } = await db
      .from("text_translations")
      .select("source_hash, translated")
      .eq("lang", lang)
      .in("source_hash", hashes);
    const found = new Map<string, string>(
      ((cached ?? []) as { source_hash: string; translated: string }[]).map((r) => [r.source_hash, r.translated]),
    );

    const missingIdx = hashes.map((h, i) => (found.has(h) ? -1 : i)).filter((i) => i >= 0);
    if (missingIdx.length > 0) {
      const apiKey = await getApiKey(db);
      if (!apiKey) return json({ error: "not_configured" }, 503);
      const out = await translateBatch(apiKey, missingIdx.map((i) => texts[i]), lang);
      if (!out) return json({ error: "translation_failed" }, 502);
      const rows = missingIdx.map((i, k) => ({ source_hash: hashes[i], lang, translated: out[k] }));
      rows.forEach((r) => found.set(r.source_hash, r.translated));
      const { error } = await db.from("text_translations").upsert(rows);
      if (error) console.error("cache write failed", error.message);
    }

    return json({ translations: hashes.map((h) => found.get(h) ?? "") });
  } catch (err) {
    console.error(err);
    return json({ error: "server_error" }, 500);
  }
});
