# Ku Visual Hub (DEMO)

Ku 工作區專屬互動視覺化展示中心與 PWA GitHub Pages，整合客戶端高強度加密保護機制。

## 🌟 特色
- **全站 AES-256 加密保護 (Zero-Knowledge Encryption)**：全站程式碼、數據模型與子頁面皆透過 AES-256-GCM + PBKDF2 加密封裝。GitHub Repository 維持 Public，但無授權密鑰完全無法窺探內部邏輯與數據。
- **全站單點解鎖 (Seamless SSO UX)**：首頁解鎖後憑證自動暫存於同源 `sessionStorage`，點選各項展示或另開分頁直接秒級還原呈現，無需重複打密碼。
- **PWA (Progressive Web App)**：支援桌面與行動裝置離線安裝（Web App Manifest + Service Worker 快取）。
- **GitHub Pages 託管**：純靜態現代 Web 架構，推送至 `main` 分支即自動觸發 Pages 部署。
- **模組化展示架構**：提供集中式主控台（Dashboard Hub），可快速檢視、搜尋、分類與內嵌預覽各項視覺化頁面。

## 🌐 線上展示網址
- **GitHub Pages**: [https://starrain3.github.io/DEMO/](https://starrain3.github.io/DEMO/)

## 📁 目錄結構
- `index.html`: 具備安全解鎖門禁之 PWA 主控台頁面。
- `data/demos.json`: 加密後的展示項目登錄檔案。
- `demos/`: 各項獨立加密子頁面（包含自帶解密外殼）。
- `src_demos/`: 本機未加密原始子頁面（受 `.gitignore` 保護，不上傳 GitHub）。
- `src_data/`: 本機未加密原始展示清單（受 `.gitignore` 保護，不上傳 GitHub）。
- `scripts/build-encrypted.js`: 一鍵自動化加密打包腳本。
- `scripts/verify-integrity.js`: 加密還原完整度測試腳本。
- `manifest.json`: Web App Manifest 設定。
- `sw.js`: Service Worker 離線快取控制。
- `package.json`: 打包指令設定。
- `GEMINI.md`: 專案核心規範與開發指引。

## 🚀 如何新增展示項目
1. 在 `src_demos/` 新增獨立 HTML 檔案（如 `src_demos/my-vis.html`）。
2. 在 `src_data/demos.json` 新增登錄項目。
3. 執行打包命令：`npm run encrypt -- --password="您的主密碼"`。
4. 推送至 GitHub，線上站點即自動發布。