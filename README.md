# Ku Visual Hub (DEMO)

Ku 工作區專屬互動視覺化展示中心與 PWA GitHub Pages。

## 🌟 特色
- **PWA (Progressive Web App)**：支援桌面與行動裝置離線安裝（Web App Manifest + Service Worker 快取）。
- **GitHub Pages 託管**：靜態純前端架構，免 Build 零相依，推送至 `main` 分支即自動觸發部署。
- **模組化展示架構**：提供集中式主控台（Dashboard Hub），可快速檢視、搜尋、分類與內嵌預覽各項視覺化頁面。
- **豐富圖表支援**：整合 Apache ECharts、Chart.js 等強大互動圖表庫。

## 🌐 線上展示網址
- **GitHub Pages**: [https://starrain3.github.io/DEMO/](https://starrain3.github.io/DEMO/)

## 📁 目錄結構
- `index.html`: PWA 主控台與展示導覽頁面。
- `manifest.json`: Web App Manifest 設定。
- `sw.js`: Service Worker 快取設定。
- `data/demos.json`: 展示項目登錄檔案。
- `demos/`: 各項獨立視覺化模組（如 `demos/sample-stock-vis.html`）。
- `icons/`: PWA 應用程式圖示。
- `.github/workflows/deploy.yml`: GitHub Actions 自動部署腳本。
- `GEMINI.md`: AI 開發導引與規則指引。

## 🚀 如何新增展示項目
1. 在 `demos/` 新增獨立 HTML 檔案（如 `demos/my-vis.html`）。
2. 在 `data/demos.json` 新增登錄項目。
3. 推送至 GitHub，即可自動更新線上站點。