# DEMO 專案導引與開發規範 (Ku Visual Hub)

本檔案為 AI 助手（Gemini / Antigravity）在 `D:\ku_tools\DEMO` 專案的核心導引與維護規範。

---

## 🎯 核心使命與定位

**`DEMO` 是工作區全域所有「視覺化呈現（Data Visualization / Interactive Prototypes）」的專屬展示中心。**

> **🚨 核心規則**：  
> 當使用者在任何對話中提出：
> - 「把這個資料 / 策略 / 成果視覺化呈現給我看」
> - 「做一個互動圖表 / 報表展示給我」
> - 「建立一個視覺化 Demo」  
> **一律在 `DEMO` 專案中實作並整合至本專案的 PWA 展示目錄中！**

---

## 🌐 部署與存取網址

- **GitHub Repository**：`https://github.com/starrain3/DEMO`（維持 Public 公開儲存庫）
- **GitHub Pages 線上站點**：`https://starrain3.github.io/DEMO/`
- **架構類型**：PWA (Progressive Web App) + 客戶端 AES-256 全站加密保護。

---

## 🔐 全站高強度加密機制 (Security & Zero-Knowledge Architecture)

為了讓 GitHub Repository 維持 **Public**，但**所有程式碼邏輯、資料數據與子頁面僅限本人檢視**，專案採用雙軌目錄與客戶端解密機制：

```
DEMO/
├── .gitignore                 # 嚴格排除 src_demos/、src_data/ 與 .env
├── src_demos/                 # 💻 本地未加密原始頁面 (本機開發專用，不上傳 GitHub)
│   ├── bridge-architecture-vis.html
│   └── sample-stock-vis.html
├── src_data/                  # 💻 本地未加密清單原始檔 (本機專用，不上傳 GitHub)
│   └── demos.json
│
├── scripts/                   # 🛠️ 自動化加密工具
│   ├── build-encrypted.js     # AES-256-GCM + PBKDF2 打包腳本
│   └── verify-integrity.js    # 解密還原度驗證腳本
│
├── data/
│   └── demos.json             # 🔒 加密後密文 (推送至 GitHub)
├── demos/                     # 🔒 包含獨立解密外殼的加密子頁面 (推送至 GitHub)
│   ├── bridge-architecture-vis.html
│   └── sample-stock-vis.html
├── icons/                     # PWA 圖示資源
├── index.html                 # 🔐 具備安全解密門禁之 Hub 首頁
├── manifest.json              # PWA Web App Manifest
├── sw.js                      # Service Worker 離線快取控制
└── package.json               # 打包指令設定
```

---

## 🛠️ 新增視覺化展示標準流程 (How to Add a Visualization)

當收到視覺化需求時，遵循以下 4 步驟發布：

### 步驟 1：在 `src_demos/` 建立原始視覺化子頁面
在 `src_demos/` 目錄建立獨立的 HTML 檔案（例如 `src_demos/my-strategy-vis.html`）：
- 可運用 CDN 套件（如 Apache ECharts、Chart.js、Plotly、Tailwind CSS、Lucide Icons 等）。
- 頂部保留「返回首頁 (`../index.html`)」按鈕與資訊摘要。
- 確保版面具備響應式設計（支援桌面與行動裝置）。

### 步驟 2：登錄至 `src_data/demos.json`
在 `src_data/demos.json` 陣列中新增物件項目：
```json
{
  "id": "my-strategy-vis",
  "title": "策略名稱或視覺化標題",
  "category": "財務與籌碼" | "策略回測" | "技術原型" | "自訂分類",
  "description": "簡要說明本視覺化呈現的重點內容與指標。",
  "tags": ["標籤1", "標籤2"],
  "url": "demos/my-strategy-vis.html",
  "date": "YYYY-MM-DD",
  "badge": "最新上架"
}
```

### 步驟 3：執行一鍵加密打包
在終端機執行：
```powershell
npm run encrypt -- --password="您的主密碼"
# 或由腳本提示輸入密碼：
# npm run encrypt
```
腳本將自動：
1. 將 `src_data/demos.json` 加密成 `data/demos.json`
2. 將所有 `src_demos/*.html` 加密為帶有解鎖外殼的 `demos/*.html`
3. 自動更新 `sw.js` 快取版本識別碼以觸發 PWA 背景更新

### 步驟 4：執行驗證與推送
```powershell
node scripts/verify-integrity.js ; git status
```
確認無誤後，遵循全域規則主動詢問使用者是否推送到 GitHub。

---

## ⚙️ 技術規範
1. **零外部依賴加密**：解密過程完全使用瀏覽器原生 `window.crypto.subtle` (Web Crypto API)，無需載入龐大第三方加密庫，硬體加速毫秒級解密。
2. **全站單點解鎖 (SSO UX)**：首頁解鎖後，金鑰暫存於同源 `sessionStorage`，點選「預覽 Modal」或「另開分頁」自動解密呈現，不需重複輸入密碼。
3. **完成後置處理**：修改完成後，遵循全域規則主動詢問使用者是否推送到 GitHub。
