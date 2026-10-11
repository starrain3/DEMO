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

### 步驟 3：檢查並更新版號 (Version Bumping)
**在執行加密打包前，必須依變更幅度遞增 `package.json` 中的 `"version"`**：
- 新增展示子頁面、新增分類或新功能 ➔ 升級次版號 (MINOR，例如 `1.1.0` ➔ `1.2.0`)。
- 介面樣式微調、Bug 修復、文字調整 ➔ 升級修訂號 (PATCH，例如 `1.2.0` ➔ `1.2.1`)。

### 步驟 4：執行一鍵加密打包
在終端機執行：
```powershell
npm run encrypt -- --password="您的主密碼"
# 若有設定 .env 則可直接執行：
# npm run encrypt
```
腳本將自動：
1. 自動讀取 `package.json` 中的版號寫入 `data/demos.json` 密文詮釋資料中。
2. 將 `src_data/demos.json` 加密成 `data/demos.json`。
3. 將所有 `src_demos/*.html` 加密為帶有解鎖外殼的 `demos/*.html`。
4. 自動更新 `sw.js` 快取版本識別碼（`ku-visual-hub-v{version}-{timestamp}`）以觸發 PWA 背景更新。

### 步驟 5：執行還原度驗證與推送
```powershell
node scripts/verify-integrity.js ; git status
```
確認無誤後，遵循全域規則主動詢問使用者是否推送到 GitHub。

---

## 📌 核心規範：版號更新機制 (Version Bumping)

本專案具備 PWA 離線快取與 Service Worker 背景檢查機制，**版號（`version`）是瀏覽器與使用者判斷內容是否有更新的核心依據**。

### 1. 觸發條件
每當完成任何展示頁面新增、功能調整、快取機制修復或 Bug 修正，**在執行 Git Commit 前，必須檢查並更新 `package.json` 的版號**。

### 2. 語意化版本原則 (Semantic Versioning)
- **修訂號 (PATCH) — `x.y.Z` (例如：1.2.0 ➔ 1.2.1)**：
  - CSS 樣式微調、文字錯字修正、小圖示更新。
  - 防呆提示優化、微調現有展示頁面佈局。
- **次版號 (MINOR) — `x.Y.0` (例如：1.1.0 ➔ 1.2.0)**：
  - 新增展示頁面模組（如新增牛排館評鑑、新增回測儀表板等）。
  - 新增分類標籤、更新導覽列功能。
  - 架構功能改進（如加入 Cache-Busting 防快取機制、全域 Skip-Waiting 等）。
- **主版號 (MAJOR) — `X.0.0` (例如：1.2.0 ➔ 2.0.0)**：
  - 全站核心架構大幅重構。
  - 加密演算法或金鑰派生參數調整（如變更 PBKDF2 迭代次數或密文外殼規格）。

---

## 📋 AI 完成任務前的自我檢查清單 (Pre-Task Checklist)

每次在向使用者回報任務完成或詢問推送前，請嚴格在內心逐項核對：

- [ ] **是否已更新 `package.json` 的版號？**（依變更幅度遞增 Patch 或 Minor）
- [ ] **展示子頁面是否在 `src_demos/` 開發？**（嚴禁未加密原始碼外洩至 `demos/` 以外目錄）
- [ ] **展示清單是否已在 `src_data/demos.json` 登錄？**
- [ ] **是否已執行 `npm run encrypt` 打包？**（產出 `demos/*.html` 與 `data/demos.json`）
- [ ] **是否已執行 `node scripts/verify-integrity.js` 驗證還原度 100% PASS？**
- [ ] **敏感資訊保護**：確認 `.env` 與 `src_*` 目錄受 `.gitignore` 排除，未被 Git 追蹤。
- [ ] **Git Commit Message**：在 Commit Message 的 Subject 或 Body 內明確標示新版號。

---

## 📜 歷史版本變更紀錄 (Changelog)

### v1.4.1 (2026-10-11)
- **Bug 修復**：修復 `index.html` 內嵌 JavaScript 字串中包含未跳脫的 `</script>`，導致瀏覽器 HTML 解析器提前截斷關閉腳本標籤產生 SyntaxError，進而導致首頁一直停留在「載入中」骨架屏的嚴重問題。

### v1.4.0 (2026-10-11)
- **新展示項目**：新增「Walt Can't Find: 零知識加密金絲雀攻防挑戰」(`demos/walt-cant-find.html`)。
  - 內嵌專屬 Canary Flag（`FLAG{WALT_CANNOT_CRACK_AES256_GCM_VAULT_2026_X9Q}`）與密碼學完整性校驗。
  - 整合本機 PBKDF2 10萬次疊代算力基準測試（Benchmark）工具，評估離線字典暴力破解防禦耗時。
- **認證架構升級**：實作 IndexedDB 不可匯出密鑰庫（`extractable: false`）永久記住裝置授權模式，完全兼顧 PWA 原生體驗與零明文安全防禦。

### v1.3.0 (2026-10-11)
- **重大安全架構重構 (P0/P1 全面加固)**：
  - **杜絕程式碼與外洩回退**：徹底移除 `scripts/verify-integrity.js` 寫死密碼，強制要求受控環境變數 `DEMO_PASSWORD`，缺少即刻失敗。
  - **發布目錄隔離 (dist/)**：重構打包工具，輸出專用發布目錄 `dist/`，部署工作改為上傳 `dist/`。嚴格設定允許清單（首頁、必要資產、密文資料、密文頁面、sw.js、manifest.json），徹底阻斷內部腳本、測試工具、原始明文與 `.env` 發布至 GitHub Pages。
  - **建置安全閘門 (Build Gate)**：每次打包前自動清空 `dist/`，打包後嚴格驗證密文標記 `encrypted: true` 與密文 Payload，掃描嚴格排除禁止檔案。
  - **全面更換主密碼**：以 24 位元高熵值隨機密碼重新執行 AES-256-GCM + PBKDF2 (10萬次) 全站重新加密，舊密碼徹底失效無法解密新密文。
  - **移除瀏覽器 Storage 明文留存**：首頁與子頁面移除所有寫入 `localStorage` 與 `sessionStorage` 之行為，取消「記住密碼」，改為僅在記憶體中持有解密憑證。頁面初始化主動清除舊版 Storage 殘留。
  - **預覽沙箱安全隔離**：預覽 iframe 導入 `sandbox="allow-scripts allow-forms allow-downloads allow-modals"`（無 `allow-same-origin`），由主頁於記憶體安全解密並以 `srcdoc` 呈現，禁止將主密碼傳遞給展示頁面。
  - **前端拒絕明文**：移除首頁讀取未加密格式的相容分支，非密文一律拋錯阻斷。

### v1.2.1 (2026-10-11)
- **Bug 修復**：修復展示卡片標題包含英文單引號（如 `Morton's`）導致 HTML `onclick` 字串逃逸產生 `Unexpected identifier 's'` 語法錯誤的嚴重問題。
- **架構重構**：將預覽互動改為以唯一代碼驅動的 `openViewerById(demo.id)`，徹底杜絕任何特殊字元或標點符號跳脫異常。

### v1.2.0 (2026-10-11)
- **新展示項目**：新增「Morton's The Steakhouse 台北店網路口碑全攻略與老饕點餐指南」(`demos/mortons-taipei-guide.html`)。
- **分類擴充**：首頁新增「美食與生活風格」分類過濾標籤。
- **快取架構修復**：
  - 於 `loadDemos()` 加入毫秒時間戳 Cache-Busting 與 `{ cache: 'no-store' }`，徹底杜絕瀏覽器與 CDN 舊快取干擾。
  - `sw.js` 安裝事件加入 `self.skipWaiting()`，新版本自動即刻接管生效。
- **版號自動化連動**：打包腳本自動由 `package.json` 讀取版號，寫入密文詮釋資料與 Service Worker 快取名稱，首頁版本卡片與提示同步連動。

### v1.1.0 (2026-10-11)
- **新展示項目**：新增「2025–2026 前沿 AI 熱門開源專案與突破性論文全景圖」(`demos/trending-repos-papers-vis.html`)。
- **系統增強**：新增 Service Worker 離線快取控制與浮動更新提示 Toast。

### v1.0.0 (2026-10-11)
- **初版發布**：Ku Visual Hub 正式上線。
- **安全架構**：整合原生 Web Crypto API 之 AES-256-GCM + PBKDF2 全站零外部依賴加密機制與單點登入 (SSO) 工作階段保護。

---

## ⚙️ 技術規範
1. **零外部依賴加密**：解密過程完全使用瀏覽器原生 `window.crypto.subtle` (Web Crypto API)，無需載入龐大第三方加密庫，硬體加速毫秒級解密。
2. **記憶體短期解鎖與沙箱隔離 (Memory-Only & Sandboxed Preview UX)**：首頁解鎖後，憑證僅保留於 JavaScript 記憶體變數，嚴禁存入 localStorage 或 sessionStorage；預覽 Modal 由主頁於記憶體解密後透過 srcdoc 載入無 allow-same-origin 沙箱 iframe，關閉分頁或點擊鎖定後記憶體立即抹除。
3. **完成後置處理**：修改完成後，遵循全域規則主動詢問使用者是否推送到 GitHub。

