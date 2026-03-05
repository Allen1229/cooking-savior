export async function onRequestPost(context) {
    const { request, env } = context;

    // 允許跨域要求的標頭 (CORS)
    const corsHeaders = {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
    };

    // 處理 OPTIONS 預檢要求
    if (request.method === "OPTIONS") {
        return new Response(null, { headers: corsHeaders });
    }

    // 從 Cloudflare 環境變數取得受保護的 API Key
    const API_KEY = env.GEMINI_API_KEY;

    if (!API_KEY) {
        return new Response(JSON.stringify({ error: "伺服器未設定 GEMINI_API_KEY 環境變數" }), {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }

    try {
        // 讀取從前端傳來的 JSON payload
        const bodyText = await request.text();

        // 轉發請求至 Google Gemini API
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${API_KEY}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: bodyText,
        });

        const data = await response.json();

        // 回傳 Google 的回應給前端
        return new Response(JSON.stringify(data), {
            status: response.status,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    } catch (err) {
        return new Response(JSON.stringify({ error: "中介伺服器處理失敗：" + err.message }), {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }
}

export async function onRequestOptions() {
    return new Response(null, {
        headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type",
        },
    });
}
