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

- **GitHub Repository**：`https://github.com/starrain3/DEMO`
- **GitHub Pages 線上站點**：`https://starrain3.github.io/DEMO/`
- **架構類型**：PWA (Progressive Web App) + 靜態 GitHub Pages，支援手機與桌面離線安裝。

---

## 📁 目錄結構

```
DEMO/
├── .github/
│   └── workflows/
│       └── deploy.yml          # GitHub Pages 自動部署工作流程
├── data/
│   └── demos.json             # 展示項目註冊目錄（主頁讀取來源）
├── demos/                     # 各項視覺化子頁面存放目錄
│   └── sample-stock-vis.html  # 範例：籌碼動能與大戶持股視覺化
├── icons/                     # PWA 圖示資源 (icon.svg, icon-192.png, icon-512.png)
├── index.html                 # 主控台 Hub 入口（PWA 儀表板、分類篩選、內嵌預覽）
├── manifest.json              # PWA Web App Manifest
├── sw.js                      # Service Worker 離線快取控制
├── README.md                  # 專案說明文件
└── GEMINI.md                  # 本導引檔案
```

---

## 🛠️ 新增視覺化展示標準流程 (How to Add a Visualization)

當收到視覺化需求時，遵循以下 3 步驟快速發布：

### 步驟 1：建立視覺化子頁面
在 `demos/` 目錄建立獨立的 HTML 檔案（例如 `demos/my-strategy-vis.html`）：
- 可運用 CDN 套件（如 Apache ECharts、Chart.js、Plotly、Tailwind CSS、Lucide Icons 等）。
- 頂部保留「返回首頁 (`../index.html`)」按鈕與資訊摘要。
- 確保版面具備響應式設計（支援桌面與行動裝置）。

### 步驟 2：登錄至 `data/demos.json`
在 `data/demos.json` 陣列中新增物件項目：
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

### 步驟 3：更新快取版本（選填）
若有新增重大共用資源，可在 `sw.js` 遞增快取名稱（例如 `v1.0.1`）以強制瀏覽器更新。

---

## ⚙️ 技術規範
1. **免 Build、零相依**：全站維持純靜態現代 Web 標準，推送至 GitHub 即自動完成 Pages 發布。
2. **PWA 相容**：路徑一律使用相對路徑（如 `./` 或 `demos/...`），確保在 GitHub Pages 的二級路徑（`/DEMO/`）下正常載入。
3. **完成後置處理**：修改完成後，遵循全域規則主動詢問使用者是否推送到 GitHub。

