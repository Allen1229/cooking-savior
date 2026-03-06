// 處理 GET 請求：獲取全網計數
export async function onRequestGet(context) {
    const { env } = context;
    const KV = env.CS_USAGE_KV;
    const USAGE_KEY = "global_usage_count";

    const corsHeaders = {
        "Access-Control-Allow-Origin": "*",
        "Content-Type": "application/json",
    };

    try {
        if (!KV) {
            return new Response(JSON.stringify({ count: 0, warning: "KV 未綁定" }), { headers: corsHeaders });
        }
        let count = await KV.get(USAGE_KEY) || "0";
        return new Response(JSON.stringify({ count: parseInt(count) }), { headers: corsHeaders });
    } catch (e) {
        return new Response(JSON.stringify({ count: 0, error: e.message }), { headers: corsHeaders });
    }
}

// 處理 POST 請求：發送到 Gemini API
export async function onRequestPost(context) {
    const { request, env } = context;
    const KV = env.CS_USAGE_KV;
    const USAGE_KEY = "global_usage_count";
    const API_KEY = env.GEMINI_API_KEY;

    const corsHeaders = {
        "Access-Control-Allow-Origin": "*",
        "Content-Type": "application/json",
    };

    if (!API_KEY) {
        return new Response(JSON.stringify({ error: "伺服器未設定 GEMINI_API_KEY" }), { status: 500, headers: corsHeaders });
    }

    try {
        const bodyText = await request.text();
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: bodyText,
        });

        const data = await response.json();

        // 成功生成後，異步更新 KV 次數
        if (response.ok && data.candidates?.[0] && KV) {
            let current = await KV.get(USAGE_KEY) || "0";
            await KV.put(USAGE_KEY, (parseInt(current) + 1).toString());
        }

        return new Response(JSON.stringify(data), { status: response.status, headers: corsHeaders });
    } catch (err) {
        return new Response(JSON.stringify({ error: "中介伺服器失敗：" + err.message }), { status: 500, headers: corsHeaders });
    }
}

// 處理跨域預檢
export async function onRequestOptions() {
    return new Response(null, {
        headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type",
        },
    });
}
