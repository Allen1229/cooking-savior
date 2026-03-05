export default {
    async fetch(request, env) {
        const url = new URL(request.url);

        // 1. 處理 API 代理路徑：/api/gemini
        if (url.pathname === "/api/gemini" || url.pathname === "/api/gemini/") {
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

            if (request.method !== "POST") {
                return new Response("Method Not Allowed", { status: 405 });
            }

            // 從環境變數取得 API Key
            const API_KEY = env.GEMINI_API_KEY;
            if (!API_KEY) {
                return new Response(JSON.stringify({ error: "伺服器未設定 GEMINI_API_KEY 環境變數" }), {
                    status: 500,
                    headers: { ...corsHeaders, "Content-Type": "application/json" },
                });
            }

            try {
                const bodyText = await request.text();
                const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${API_KEY}`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: bodyText,
                });

                const data = await response.json();
                return new Response(JSON.stringify(data), {
                    status: response.status,
                    headers: { ...corsHeaders, "Content-Type": "application/json" },
                });
            } catch (err) {
                return new Response(JSON.stringify({ error: "API 請求發生錯誤：" + err.message }), {
                    status: 500,
                    headers: { ...corsHeaders, "Content-Type": "application/json" },
                });
            }
        }

        // 2. 如果不是 API 路徑，則視為靜態資源請求
        // 在 Cloudflare Pages 中，如果找不到匹配的 Function，預設會回傳靜態資產
        // 但為了確保在 Worker 環境也能運作，我們這裡可以讓它嘗試回傳靜態資源或繼續執行
        return env.ASSETS ? env.ASSETS.fetch(request) : new Response("Not Found", { status: 404 });
    }
};
