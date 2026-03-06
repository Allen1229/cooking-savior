# 料理救星 (Cooking Savior) - AI 主廚為您拯救晚餐

這是一個基於 Gemini AI 的智慧食譜生成器。只要拍下食材或手動輸入，AI 就會為您規劃出三種難度（簡單、普通、難度）的精密食譜。

## 🚀 部署指南 (Cloudflare Pages)

本專案已針對 **Cloudflare Pages** 進行優化，具備後端 API 代理功能，可確保您的 API Key 安全不外洩。

### 1. 上傳至 GitHub
將此資料夾內的所有檔案上傳到您的 GitHub 儲存庫。

### 2. 部署到 Cloudflare Pages
1. 登入 [Cloudflare Dash](https://dash.cloudflare.com/)。
2. 進入 **Workers & Pages** -> **Create Application** -> **Pages** -> **Connect to Git**。
3. 選擇您的儲存庫。
4. **環境變數設定 (重要)**：
   在部署設定的 **Environment variables** 區塊中，新增一個變數：
   - Key: `GEMINI_API_KEY`
   - Value: (貼上您的 Google Gemini API Key)
5. 點擊 **Save and Deploy**。

## 🛠️ 技術棧
- **Frontend**: React (CDN), Tailwind CSS, Vanilla JS
- **Backend**: Cloudflare Pages Functions (Serverless)
- **AI**: Google Gemini Pro (via API)

## 🔒 安全性說明
本程式透過 `functions/api/gemini.js` 進行中轉，API Key 僅存在於 Cloudflare 的伺服器端，網頁端不會接觸到金鑰，可防止盜用。。

