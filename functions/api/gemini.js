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

    // 1. 處理預檢請求 (CORS)
    if (request.method === "OPTIONS") {
        return new Response(null, { headers: corsHeaders });
    }

    // 2. 處理 GET 請求：讀取數據
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

    // 3. 處理 POST 請求：生成食譜並計數
    if (request.method === "POST") {
        if (!API_KEY) {
            return new Response(JSON.stringify({ error: "API_KEY_MISSING" }), {
                status: 500, headers: corsHeaders
            });
        }

        try {
            const bodyText = await request.text();
            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: bodyText,
            });

            const data = await response.json();

            // 成功後更新 KV (背景執行，不影響回傳速度)
            if (response.ok && data.candidates?.[0] && KV) {
                let current = await KV.get(USAGE_KEY) || "0";
                await KV.put(USAGE_KEY, (parseInt(current) + 1).toString());
            }

            return new Response(JSON.stringify(data), {
                status: response.status,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
        } catch (err) {
            return new Response(JSON.stringify({ error: "PROXY_ERROR", details: err.message }), {
                status: 500, headers: corsHeaders
            });
        }
    }

    return new Response("Method Not Allowed", { status: 405 });
}
