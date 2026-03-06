export async function onRequest(context) {
    const { request, env } = context;
    const KV = env.CS_USAGE_KV;
    const USAGE_KEY = "global_usage_count";
    const API_KEY = env.GEMINI_API_KEY;

    const corsHeaders = {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
    };

    if (request.method === "OPTIONS") {
        return new Response(null, { headers: corsHeaders });
    }

    // 處理 GET：回傳次數
    if (request.method === "GET") {
        try {
            if (!KV) {
                return new Response(JSON.stringify({ count: 0, status: "KV_MISSING" }), {
                    headers: { ...corsHeaders, "Content-Type": "application/json" }
                });
            }
            let count = await KV.get(USAGE_KEY) || "0";
            return new Response(JSON.stringify({ count: parseInt(count), status: "OK" }), {
                headers: { ...corsHeaders, "Content-Type": "application/json" }
            });
        } catch (e) {
            return new Response(JSON.stringify({ count: 0, status: "ERROR", msg: e.message }), {
                status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" }
            });
        }
    }

    // 處理 POST：生成食譜
    if (request.method === "POST") {
        if (!API_KEY) {
            return new Response(JSON.stringify({ error: { message: "API_KEY_MISSING" } }), {
                status: 500, headers: corsHeaders
            });
        }

        try {
            const bodyText = await request.text();
            // 使用 v1beta + gemini-2.0-flash（支援 responseMimeType）
            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${API_KEY}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: bodyText,
            });

            const data = await response.json();

            // 成功後更新 KV
            if (response.ok && data.candidates?.[0] && KV) {
                try {
                    let current = await KV.get(USAGE_KEY) || "0";
                    await KV.put(USAGE_KEY, (parseInt(current) + 1).toString());
                } catch (kvErr) {
                    console.error("KV Update Error:", kvErr);
                }
            }

            return new Response(JSON.stringify(data), {
                status: response.status,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
        } catch (err) {
            return new Response(JSON.stringify({ error: { message: "PROXY_ERROR: " + err.message } }), {
                status: 500, headers: corsHeaders
            });
        }
    }

    return new Response("Method Not Allowed", { status: 405 });
}
