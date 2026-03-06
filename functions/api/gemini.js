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

    // 處理 GET：回傳次數與 Key 的提示 (Hint)
    if (request.method === "GET") {
        try {
            const keyHint = API_KEY ? `${API_KEY.slice(0, 4)}...${API_KEY.slice(-4)}` : "未設定";
            if (!KV) {
                return new Response(JSON.stringify({ count: 0, status: "KV_MISSING", keyHint }), {
                    headers: { ...corsHeaders, "Content-Type": "application/json" }
                });
            }
            let count = await KV.get(USAGE_KEY) || "0";
            return new Response(JSON.stringify({ count: parseInt(count), status: "OK", keyHint }), {
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
            // 使用 v1beta + gemini-2.5-flash
            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${API_KEY}`, {
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
