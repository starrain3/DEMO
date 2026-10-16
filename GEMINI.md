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
│   ├── mortons-taipei-guide.html
│   ├── sample-stock-vis.html
│   ├── trending-repos-papers-vis.html
│   └── walt-cant-find.html
├── src_data/                  # 💻 本地未加密清單原始檔 (本機專用，不上傳 GitHub)
│   └── demos.json
│
├── scripts/                   # 🛠️ 自動化加密與驗證工具 (不上傳至 GitHub Pages)
│   ├── build-encrypted.js     # AES-256-GCM + PBKDF2 打包與建置閘門工具
│   └── verify-integrity.js    # 解密還原度與防篡改安全性測試腳本
│
├── dist/                      # 🚀 經安全審查之 GitHub Pages 唯一部署目錄 (包含密文與白名單前端)
│   ├── index.html             # 🔐 具備安全門禁與不可匯出密鑰庫之 Hub 首頁
│   ├── manifest.json          # PWA Web App Manifest
│   ├── sw.js                  # Service Worker 快取控制
│   ├── icons/                 # PWA 圖示資源
│   ├── data/demos.json        # 🔒 加密密文
│   └── demos/*.html           # 🔒 包含獨立解密外殼的加密子頁面
│
├── data/                      # 🔒 本地相容密文
├── demos/                     # 🔒 本地相容加密子頁面
├── index.html                 # 本地開發入口
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
  "category": "財務與籌碼" | "策略回測" | "技術原型" | "美食與生活風格" | "自訂分類",
  "description": "簡要說明本視覺化呈現的重點內容與指標。",
  "tags": ["標籤1", "標籤2"],
  "url": "demos/my-strategy-vis.html",
  "date": "YYYY-MM-DD",
  "badge": "最新上架"
}
```

### 步驟 3：檢查並更新版號 (Version Bumping)
**在執行加密打包前，必須依變更幅度遞增 `package.json` 中的 `"version"`**：
- 新增展示子頁面、新增分類或新功能 ➔ 升級次版號 (MINOR，例如 `1.3.0` ➔ `1.4.0`)。
- 介面樣式微調、Bug 修復、文字調整 ➔ 升級修訂號 (PATCH，例如 `1.4.0` ➔ `1.4.1`)。

### 步驟 4：執行一鍵安全打包與建置
在終端機執行：
```powershell
npm run build
```
*(💡 密碼僅由本機受控 `.env` 讀取或互動輸入，嚴禁使用命令列參數傳遞以杜絕 shell 歷史外洩)*

腳本將自動：
1. 自動讀取 `package.json` 中的版號寫入密文詮釋資料中。
2. 將 `src_data/demos.json` 加密成 `data/demos.json` 及 `dist/data/demos.json`。
3. 將所有 `src_demos/*.html` 加密為帶有獨立解鎖外殼的 `demos/*.html` 及 `dist/demos/*.html`。
4. 自動更新 `sw.js` 快取版本識別碼（`ku-visual-hub-v{version}-{timestamp}`）。
5. 執行發布目錄 `dist/` 嚴格建置閘門檢驗（掃描排除 scripts、原始碼與 .env）。

### 步驟 5：執行還原度驗證與測試
```powershell
npm run verify
```
確認還原度、防篡改與舊密碼失效測試全數 100% PASS 後，遵循全域規則主動詢問使用者是否推送到 GitHub。

---

## 🛡️ 核心資安原則與黃金守則 (Security Architecture & Golden Rules)

本專案採端對端零知識（Zero-Knowledge）防護，嚴格遵循以下六大黃金守則：

### 1. 零寫死金鑰原則 (Zero Hardcoded Secrets)
- 任何本機測試、自動化工具或輔助腳本中，**絕對嚴禁寫死任何 fallback 預設密碼**。
- 缺少環境變數 `DEMO_PASSWORD` 時一律拋出 `throw new Error()` 即刻中斷。
- 嚴禁透過命令列參數（如 `--password`）傳遞密碼，杜絕在系統行程表或 Shell 歷史紀錄中留下明文。

### 2. 最小發布面與建置閘門原則 (Least Exposure & Build Gate)
- GitHub Pages 發布源**嚴格限制為 `dist/` 目錄**，嚴禁以 `path: '.'` 發布全專案根目錄。
- 內部工具（`scripts/`）、原始明文（`src_*`）、`.env*`、測試程式與非必要說明文件**絕對不進入 `dist/`**。
- 打包工具內建「建置閘門（Build Gate）」，打包後自動驗證密文標記 `encrypted: true`，任一檢查不符即刻中止發布。

### 3. 不可匯出密鑰庫原則 (Non-Exportable Key Vault)
- 本地裝置長效授權一律透過原生 Web Crypto API 生成 `extractable: false` 之 AES 裝置金鑰，並封存於瀏覽器 `IndexedDB (KuHubVaultDB)`。
- 密碼本體由該裝置金鑰加密後儲存，**絕不以純文字寫入 `localStorage` 或 `sessionStorage`**。
- 任何外部或惡意腳本試圖執行 `exportKey()` 導出金鑰本體時，瀏覽器核心將強制拋錯阻斷。手動點擊「鎖定」時即刻抹除。

### 4. 預覽沙箱安全隔離 (In-Memory Sandboxed Preview)
- 預覽展示視窗採用 `iframe sandbox="allow-scripts allow-forms allow-downloads allow-modals"`，**刻意不給 `allow-same-origin`**。
- 由已授權的主頁於記憶體安全解密後，透過 `srcdoc` 注入沙箱呈現，**嚴禁將主密碼傳遞給展示子頁面**。

### 5. 行內腳本字串安全拼接 (Safe Script Tag Escaping)
- 在 HTML 行內 JavaScript 程式碼中比對標籤字串時，**絕對不要出現未跳脫的 `</script>` 字串**（例如 `const endTag = '</script>';` 會導致 HTML 解析器提前結束腳本並產生語法錯誤）。
- 一律採用字串拼接方式：`const endTag = '<' + '/script>';`。

### 6. 抗已知明文攻擊 (KPA-Proof) 與高熵密鑰
- AES-256-GCM 具備嚴格抗已知明文攻擊（KPA）保證，比對明文無法在數學上推算對稱金鑰。
- 每次打包強制使用隨機 Salt（16 位元組）與隨機 IV（12 位元組）搭配 100,000 次 PBKDF2 疊代。
- 主密碼必須維持 16 位元以上高熵值隨機字串（>120 bits 熵），徹底瓦解離線字典暴力破解。

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

### v1.16.0 (2026-10-17)
- **新展示項目**：新增「緯穎 (6669.TW) 布林通道破底翻策略 · 4大變體回測勝率與 10/15 實戰買點全對照」(`demos/wiwynn-bollinger-strategy-vis.html`)。
  - 完整對比四大布林破底爆量策略變體（雙日環比 > 2x、10日均量 > 2.5x 零敗績 100% 勝率版、舊版單日環比 > 2x、New 版放寬下軌 +3.1%）之歷史勝率、獲利因子（Profit Factor）與累積淨損益。
  - 內建 ECharts 雙波段互動 K 線與布林通道檢視器：支援一鍵切換「2026/09–10 本週四 1,905 元實戰買點」與「2026/03–04 週四破底買進 ➔ 週五續洗 ➔ 站回 20MA 大賺 +10.33% 歷史重演對照」。
  - 整合互動式「量能濾網實驗室」，動態模擬不同量能比較基準與倍數門檻下過去兩年所有破底事件的觸發判定。

### v1.15.0 (2026-10-16)
- **新展示項目**：新增「OIP 土木工程內務處理系統 · 全端技術架構與零洩漏資安防護全景圖」(`demos/oip-architecture-vis.html`)。
  - 全方位視覺化展示 OIP 商業 SaaS 系統之現代化全端架構（React 19 + Fastify + SQLite WAL 多租戶引擎）與雙重資安防禦成果。
  - 內建互動式「未登入 vs 已通過 30 天密碼驗證」原始碼防洩漏攔截模擬器，清楚呈現 Vite `oipSourceGuardPlugin` 與 Fastify `onRequest` 守門員對 14 大工程模組與核心 `runtime.js` 的保護機制。
  - 整合 Mermaid 全端拓撲圖、30 天免重複登入載入時序圖、14 大工程畫面分層過濾矩陣及 ECharts 架構升級前後五維度雷達對比圖。

### v1.14.1 (2026-10-14)
- **內容增強（官方網站與即時訂房直達按鈕全面導入）**：為「宜蘭 6 房包棟民宿推薦與預算指南」(`demos/yilan-villa-6rooms-guide.html`) 中所有 5 間民宿卡片全面導入官方直達連結。
  - 沐丘 Villa：整合官方網站與 OwlNest 區塊鏈線上訂房系統、官方 LINE 及電話直撥。
  - 六六白宮渡假莊園：整合官方網站、OwlNest 線上查房系統、官方 LINE 及客服電話。
  - 礁溪好好沐/汶水景觀溫泉會館：整合 ezHotel 官方線上訂房系統、AsiaYo 訂房頁面及 Traiwan 會館介紹。
  - 蒔月/想睡覺民宿：整合台灣宿配網蒔月與想睡覺即時訂房頁面、官方 LINE 及預約電話。
  - 灣客棧壯圍館 (WeInnOne)：整合灣客棧官方網站、官方 LINE 諮詢及專屬訂房電話。
  - 全數外部連結依資安規範導入 `target="_blank" rel="noopener noreferrer"`，防範沙箱 iframe 異常導航。

### v1.14.0 (2026-10-14)
- **新展示項目**：新增「宜蘭 6 房包棟民宿推薦與預算指南 (11大2小・1/9–1/11 週末・預算7萬內)」(`demos/yilan-villa-6rooms-guide.html`)。
  - 專為 11 位大人 ＋ 2 位小朋友（共 13 人）策劃，嚴選完整 6 間獨立客房之高品質包棟名單。
  - 鎖定 1/9(五) 旺日 ＋ 1/10(六) 假日共 2 晚，總預算嚴格控制在 NT$ 70,000 元以內。
  - 收錄沐丘 Villa（200坪草皮+正版KTV+遮棚烤肉）、六六白宮渡假莊園（一泊二食點心吧+透明溜滑梯球池）、礁溪好好沐/汶水景觀溫泉會館（碳酸氫鈉美人溫泉原湯）、蒔月/想睡覺民宿（五結超高CP值省下2.5萬）與壯圍蔚恩休閒會館（1F全平路無階梯孝親套房+超大停車場）。
  - 整合 11大2小 專屬費用均攤與預算即時試算器、6 房完美分房動線指南、多風格過濾標籤與宜蘭包棟行前注意事項。

### v1.13.3 (2026-10-12)
- **資料更新（7人夥伴行前準備預設就緒狀態）**：為沖繩自駕手冊（`okinawa-travel-journal.html`）更新行前準備追蹤室預設狀態與駕駛組配置。
  - **全員護照打勾**：全員 7 位夥伴（Ku、敏、宋宏毅、曾宣淮、林傑陞、林淑華、James 傑）之中華民國護照效期預設標註為已備齊（✅）。
  - **駕駛組與譯本打勾**：將「曾宣淮」加入駕駛人行列（🚗），並將其駕照日文譯本項目預設標註為已備齊（✅）。
  - **VJW 入境申報打勾**：將「Ku」與「宋宏毅」之 Visit Japan Web (VJW) 入境申報項目預設標註為已備齊（✅）。
  - **快取金鑰更新**：升級 LocalStorage 儲存鍵值為 `okinawa_team_tracker_v3`，確保瀏覽器載入即顯示最新進度。

### v1.13.2 (2026-10-12)
- **內容精緻化（官方牌價與平假日試算表完整標記）**：為「宜蘭包棟民宿 12/5–12/7 精選推薦與預算指南」(`demos/yilan-villa-guide.html`) 中所有 7 間民宿卡片全面導入詳細牌價對照表。
  - 明確標記「平日（週一~四）包棟價」、「週日旺日/平日價」與「週六最貴假日價」。
  - 精算 12/5(六) + 12/6(日) 跨平假日的 2 晚整棟預估總額，以及均攤後每人每晚之精準費用區間（如木可木可每人每晚僅約 $1,140、斑馬閑閑約 $1,850、金湯8號約 $2,425 等）。

### v1.13.1 (2026-10-12)
- **安全配置（專屬單頁分享密碼）**：為「宜蘭包棟民宿 12/5–12/7 精選推薦與預算指南」(`demos/yilan-villa-guide.html`) 配置專屬單頁分享密碼（`villa2026`）。
  - 支援多密鑰信封機制：朋友可憑此專屬密碼獨立解鎖該頁，同時具備完整權限隔離，無法越權存取主站清單與其他機密頁面。

### v1.13.0 (2026-10-12)
- **新展示項目**：新增「宜蘭包棟民宿 12/5–12/7 精選推薦與預算指南」(`demos/yilan-villa-guide.html`)。
  - 專為 12/5–12/7 週末聚會策劃，鎖定人均每晚 NT$ 2,000 上下之高 CP 值與奢華質感名單。
  - 整合動態人數與預算雙滑動條試算機，即時計算整棟每晚及 2 晚總預算池與適配規格。
  - 收錄金湯8號（碳酸氫鈉美人湯）、木可木可（河畔Switch/PS4/KTV）、悠然民宿（高CP大客廳中島）、斑馬閑閑 Villa（法式微藝廊戲水池寵物友善）、紗幔雅・雲灣（14米長泳池雲朵餐桌）、米蘭穀堡（歐風城堡電梯24H飲料吧）及乘風民宿（少人彈性包棟過山車麻將）。
  - 全卡片整合官方網站、AsiaYo 與奧丁丁即時訂房/空房查詢外部安全直達連結，並彙整採買動線、噪音管制與防詐安全須知。

### v1.12.0 (2026-10-12)
- **UI/UX 精緻化（日程切換 Tab 規格化重構）**：為沖繩自駕手冊（`okinawa-travel-journal.html`）頂部日程與主題導覽列進行規格化美化。
  - **固定統一規格尺寸**：所有 7 個 Tab 按鈕（全覽總覽、Day 1～4、Threads 避雷、疲勞健檢）統一固定為標準高度（`h-[54px]`）與最小寬度（`min-w-[104px] sm:min-w-[114px]`）。
  - **雙層資訊結構統一**：上層一律為「3.5x3.5 圖示 ＋ 精簡主標」，下層一律為「一致字數副標」，徹底解決舊版長短高低錯落、視覺凌亂問題。
  - **優化 Active 高亮視覺**：切換時平滑過渡選取效果，副標顏色自適應點亮，並同步整合右側控制開關（雨天備案、AI 攻略、玉泉洞方案）高度對齊與圓角統一。

### v1.11.0 (2026-10-12)
- **新功能（7人夥伴行前準備進度追蹤室・方案 C 雙模式）**：為沖繩自駕手冊底部工具箱實作專屬 7 位夥伴（Ku、敏、宋宏毅、曾宣淮、林傑陞、林淑華、James 傑）行前準備追蹤室。
  - **雙模式自由切換**：
    - **個人卡片視角**：可切換選取 7 位夥伴個別卡片，逐項勾選 6 大行前檢核項目（護照效期、駕照譯本、VJW 截圖、上網卡、旅遊不便險、日幣換匯/海外信用卡），支援即時切換駕駛人/乘客身分（駕駛人必須具備台灣駕照正本與日文譯本，非駕駛人自動標註「乘客免檢」）。
    - **全員矩陣總覽視角**：響應式 7 人 x 6 項全景 Matrix 矩陣大表格，支援即時多方勾選、狀態即時雙向連動、一覽無遺全體準備盲點。
  - **全體總體進度儀表板**：動態計算全體總完成率進度條、駕駛人日文譯本備齊狀態指示燈、全通關人數統計。
  - **LINE 催促報表一鍵複製**：一鍵產生排版精美的群組進度彙整文字，自動點名各夥伴目前完成率與待辦清單，附帶出發前駕駛正本譯本攜帶與 VJW 申報安全叮嚀。
  - **瀏覽器資料持久化**：使用 `localStorage` 自動保存全體勾選狀態與身分設定，並提供安全重置清空防呆機制。

### v1.10.0 (2026-10-12)
- **新功能（行程節奏＆疲勞健檢 Tab）**：為沖繩自駕手冊新增獨立展示 Tab「行程節奏＆疲勞健檢」。
  - 深度健檢自駕行程鬆緊度（綜合評分 92 分），剖析三大核心優勢（連住拉古納免搬行李、順向順時針環島、熱門美食錯開尖峰）。
  - 提供逐日疲勞指數星級評估（Day 1 ⭐⭐⭐⭐、Day 2 ⭐⭐⭐、Day 3 ⭐、Day 4 ⭐⭐半）。
  - 詳解每日核心疲勞痛點、排隊延誤變數與 AI 減壓建議處方（幸福鬆餅決策樹、許田休息站中繼回血、PARCO CITY 替代國際通逛街防鐵腿）。
  - 彙整自駕三大黃金心法 Cheat Sheet（Day 1 戒貪多、Day 2 善用中繼站、住宿連住 3 晚大勝利）。

### v1.9.0 (2026-10-12)
- **新功能（Threads 社群推薦與避雷寶典 Tab）**：為沖繩自駕手冊新增獨立展示 Tab「Threads 社群私房推薦＆避雷寶典」。
  - 整合上萬名旅客大數據實測，收錄行程外神級私房美食與景點：泊港魚市場厚切生魚片與海膽龍蝦、岸本食堂百年木灰沖繩麵、港川外人住宅街黑糖可麗露、敘敘苑 PARCO CITY 絕景海景燒肉、首里純白紅瓦麥當勞等。
  - 整理千萬別踩的「八大雷區與陷阱」：國際駕照在日本無效之致命陷阱、連鎖牛排排隊迷思、還車滿油發票保存、唐吉訶德深夜退稅地獄、心形岩停車收費坑、潮汐退潮海況幻滅、伴手禮賞味期限陷阱、ETC 誤闖等。
  - 精選 Threads 評選零負評伴手禮神級排行榜（福木屋現烤年輪蛋糕、邊銀食堂石垣島辣油、南風堂辣蝦餅、鹽屋雪鹽甜點、Orion 75 Beer 等）。

### v1.8.0 (2026-10-12)
- **新功能（雨天備案系統）**：為「沖繩自駕 4 天 3 夜質感遊記與智慧手冊」導入完整雨天備案系統與 UX 互動增強。
  - 頂部導覽列新增「☔ 雨天備案模式 (一鍵切換)」狀態控制按鈕。
  - 受天氣影響景點（Day 1 瀨長島、Day 2 古宇利島、Day 3 萬座毛、Day 3 日落步道、Day 4 波之上海灘）全面新增「🤖 AI 規劃雨天備案（由 AI 助手 Antigravity 規劃新增）」獨立切換手風琴卡片。
  - 嚴選室內優質替代路線：DMM Kariyushi 水族館、iiAS 豐崎商場、名護鳳梨園、Orion 啤酒觀光工廠、琉球村、AEON 來客夢 100 噸室內水族箱旗艦商城、PARCO CITY 臨海落地窗海景美食商城、平和通全天候遮雨拱廊等。
  - 自駕導航電話速查簿同步整合雨天替代景點 MapCode、電話一鍵複製與 Google Maps 外部安全導航地標。

### v1.7.1 (2026-10-12)
- **內容深度擴充**：為沖繩遊記所有 14 個景點站點全面導入「🤖 AI 額外延伸私房攻略（怎麼買、怎麼逛、怎麼玩、避坑秘訣）」。
  - 整合許田休息站水族館現金優惠票、幸福鬆餅 14 天前搶位與早鳥候位小本本、波上宮跨海大橋人行步道絕景拍攝機位、第一牧志市場 FastPick 線上預約與生鮮三吃代客料理、古宇利大橋南端展望所 Tiffany 藍海大景、唐吉訶德滿額電子優惠券等獨家秘笈。
  - 新增頂部「🤖 AI 延伸攻略 (已開啟/已折疊)」一鍵動態切換開關與浮動提示。


### v1.7.0 (2026-10-12)
- **多密鑰信封與單頁專屬分享密碼架構升級 (Multi-Key Envelope & Per-Page Share Passwords)**：
  - 重構 `scripts/build-encrypted.js`：支援讀取本機受控 `.env` 中 `DEMO_SHARE_<ID>` 變數，建構多金鑰信封 payload。
  - 子頁面解密外殼全面升級 `tryDecryptAny`：相容全站主密碼自動解鎖，同時支援單頁專屬分享密碼獨立解鎖。
  - 嚴格落實權限隔離保證：專屬分享密碼僅能單獨解密特定指定頁面，絕對無法解密 `demos.json` 清單或其他私密頁面。
  - 升級 `scripts/verify-integrity.js`：加入專屬分享密碼還原度比對與防越權隔離自動化測試。


### v1.6.0 (2026-10-12)
- **新展示項目**：新增「沖繩自駕 4 天 3 夜質感遊記與智慧行程手冊」(`demos/okinawa-travel-journal.html`)。
  - 完整整合那霸機場租車、第一牧志公設市場豬肉蛋飯糰、玉泉洞天然鐘乳石洞、瀨長島幸福鬆餅、美之海水族館雙秀（海豚秀/鯨鯊餵食）、古宇利跨海跳島與粉綠餐車蝦蝦飯、美國村夕照與頂級琉球之牛燒肉、波上宮斷崖神社與國際通採購。
  - 提供即時門票開銷試算器（含玉泉洞彈性增刪聯動）、車機電話速查一鍵複製、行前必備勾選備忘錄與 ECharts 行程維度雷達分析圖。

- **快取隔離修復**：修正 `sw.js` 在 `activate` 生命週期時清除舊快取的行為，嚴格限定僅刪除 `ku-visual-hub-` 前綴之舊版快取，徹底杜絕在 GitHub Pages 同源環境下誤刪其他子專案（如 reader、Money）離線快取的問題。

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

### v1.7.6 (2026-10-12)
- **Bug 修復 (避免跳出崩潰)**：移除外部連結事件處理器中潛在的 `window.top.location.href` 或 `window.location.href` 導航行為，確保外部地標連結皆以安全原生 `window.open(..., '_blank')` 彈出，徹底杜絕返回時展示中心或 iframe 崩潰（Crash / 灰屏）問題。

### v1.7.5 (2026-10-12)
- **外部導航跳轉修復**：修復首頁預覽沙箱 iframe 缺少 `allow-popups` 與 `allow-popups-to-escape-sandbox` 權限導致 Google Maps 等外部地標點擊遭瀏覽器攔截無法開啟的問題；同時在沖繩遊記中補強全域外部連結開啟與降級相容機制。

### v1.7.4 (2026-10-12)
- **功能增強**：全面為 `okinawa-travel-journal.html` 沖繩遊記行程手冊中 15+ 處景點、美食餐廳、住宿飯店、休息站及機場周邊加油站標記 Google Maps 導航地標連結，並在自駕導航速查簿中整合一鍵地圖開啟功能。

### v1.7.3 (2026-10-12)
- **Bug 修復**：修復 `okinawa-travel-journal.html` 中 Visual Analytics 圖表容器未設內聯最小高度導致 iframe 沙箱或異步載入時 ECharts 渲染塌陷的問題，加入 ResizeObserver 與多階段自適應重繪機制。

### v1.7.2 (2026-10-12)
- **Bug 修復**：修復 `okinawa-travel-journal.html` 中 `filterDay(day)` 函式結尾遺漏閉合大括號 `}` 造成的語法錯誤（SyntaxError），確保 Day 1～Day 4 篩選按鈕與 AI 延伸私房攻略折疊切換正常運作。

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

