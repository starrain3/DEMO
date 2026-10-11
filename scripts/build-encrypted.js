/**
 * Ku Visual Hub - 全站 AES-256-GCM 自動化加密打包工具
 * 
 * 作用：
 * 1. 讀取 src_data/demos.json 並以 AES-256-GCM + PBKDF2 加密為 data/demos.json
 * 2. 遍歷 src_demos/*.html，將原始視覺化頁面加密為包含獨立解密外殼的 demos/*.html
 * 3. 確保推送到 GitHub 的檔案全為高強度密文，只有持有主密碼者可在瀏覽器本地解密瀏覽。
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const readline = require('readline');

const ROOT_DIR = path.resolve(__dirname, '..');
const SRC_DATA = path.join(ROOT_DIR, 'src_data', 'demos.json');
const DIST_DATA = path.join(ROOT_DIR, 'data', 'demos.json');
const SRC_DEMOS_DIR = path.join(ROOT_DIR, 'src_demos');
const DIST_DEMOS_DIR = path.join(ROOT_DIR, 'demos');
const SW_PATH = path.join(ROOT_DIR, 'sw.js');
const ENV_PATH = path.join(ROOT_DIR, '.env');

// 解析命令列參數 --password=xxx 或 -p xxx
function getPasswordFromArgs() {
  const args = process.argv.slice(2);
  for (let i = 0; i < args.length; i++) {
    if (args[i].startsWith('--password=')) {
      return args[i].split('=')[1];
    }
    if ((args[i] === '-p' || args[i] === '--password') && args[i + 1]) {
      return args[i + 1];
    }
  }
  return null;
}

// 讀取 .env 中的 DEMO_PASSWORD
function getPasswordFromEnvFile() {
  if (fs.existsSync(ENV_PATH)) {
    const envContent = fs.readFileSync(ENV_PATH, 'utf8');
    const match = envContent.match(/^DEMO_PASSWORD\s*=\s*(.+)$/m);
    if (match) {
      return match[1].trim().replace(/^["']|["']$/g, '');
    }
  }
  return process.env.DEMO_PASSWORD || null;
}

// 核心加密函式：AES-256-GCM + PBKDF2 (SHA-256, 100,000 iterations)
function encryptString(plaintext, password) {
  const salt = crypto.randomBytes(16);
  const iv = crypto.randomBytes(12);
  const key = crypto.pbkdf2Sync(password, salt, 100000, 32, 'sha256');

  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  const ciphertextWithTag = Buffer.concat([encrypted, tag]);

  return {
    salt: salt.toString('base64'),
    iv: iv.toString('base64'),
    ciphertext: ciphertextWithTag.toString('base64')
  };
}

// 產生子頁面通用解密外殼 HTML
function generateDecryptorHtml(encryptedPayload, pageTitle) {
  const safeTitle = (pageTitle || '受保護的展示頁面')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

  const payloadJson = JSON.stringify(encryptedPayload);

  return `<!DOCTYPE html>
<html lang="zh-TW" class="dark">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <title>${safeTitle} - Ku Visual Hub (加密保護)</title>
  <meta name="robots" content="noindex, nofollow">
  <link rel="icon" type="image/svg+xml" href="../icons/icon.svg">
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background: radial-gradient(circle at 50% 0%, #0f172a 0%, #020617 100%);
      color: #f8fafc;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 1.5rem;
    }
    .card {
      width: 100%;
      max-width: 440px;
      background: rgba(15, 23, 42, 0.85);
      border: 1px solid rgba(56, 189, 248, 0.25);
      border-radius: 1.25rem;
      padding: 2.25rem 2rem;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.6), 0 0 35px rgba(14, 165, 233, 0.12);
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
      text-align: center;
      position: relative;
    }
    .icon-badge {
      width: 60px;
      height: 60px;
      margin: 0 auto 1.25rem;
      border-radius: 1rem;
      background: linear-gradient(135deg, rgba(14, 165, 233, 0.2), rgba(99, 102, 241, 0.25));
      border: 1px solid rgba(56, 189, 248, 0.35);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.75rem;
      box-shadow: 0 8px 20px rgba(14, 165, 233, 0.2);
    }
    h1 {
      font-size: 1.25rem;
      font-weight: 800;
      color: #ffffff;
      margin-bottom: 0.5rem;
      letter-spacing: -0.01em;
    }
    .page-name {
      font-size: 0.85rem;
      color: #38bdf8;
      background: rgba(14, 165, 233, 0.1);
      padding: 0.35rem 0.75rem;
      border-radius: 9999px;
      display: inline-block;
      margin-bottom: 1.25rem;
      border: 1px solid rgba(56, 189, 248, 0.2);
      max-width: 100%;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    p {
      font-size: 0.875rem;
      color: #94a3b8;
      line-height: 1.6;
      margin-bottom: 1.5rem;
    }
    .form-group {
      margin-bottom: 1.25rem;
      text-align: left;
    }
    label {
      display: block;
      font-size: 0.75rem;
      font-weight: 600;
      color: #cbd5e1;
      margin-bottom: 0.5rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .input-wrap {
      position: relative;
      display: flex;
      align-items: center;
    }
    input[type="password"], input[type="text"] {
      width: 100%;
      background: #090d16;
      border: 1px solid #1e293b;
      border-radius: 0.75rem;
      padding: 0.85rem 3rem 0.85rem 1rem;
      color: #ffffff;
      font-size: 0.95rem;
      outline: none;
      transition: all 0.2s;
    }
    input:focus {
      border-color: #38bdf8;
      box-shadow: 0 0 0 3px rgba(56, 189, 248, 0.15);
    }
    .toggle-pwd {
      position: absolute;
      right: 0.85rem;
      background: none;
      border: none;
      color: #64748b;
      cursor: pointer;
      font-size: 1.1rem;
      padding: 0.25rem;
    }
    .toggle-pwd:hover { color: #94a3b8; }
    .remember-wrap {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-bottom: 1.25rem;
      font-size: 0.8rem;
      color: #94a3b8;
      cursor: pointer;
    }
    .remember-wrap input {
      accent-color: #0ea5e9;
      cursor: pointer;
    }
    .btn-submit {
      width: 100%;
      background: linear-gradient(135deg, #0ea5e9 0%, #2563eb 100%);
      color: #ffffff;
      border: none;
      border-radius: 0.75rem;
      padding: 0.85rem;
      font-size: 0.95rem;
      font-weight: 700;
      cursor: pointer;
      transition: all 0.2s;
      box-shadow: 0 4px 14px rgba(14, 165, 233, 0.3);
    }
    .btn-submit:hover:not(:disabled) {
      background: linear-gradient(135deg, #38bdf8 0%, #1d4ed8 100%);
      transform: translateY(-1px);
    }
    .btn-submit:active { transform: translateY(0); }
    .btn-submit:disabled { opacity: 0.6; cursor: not-allowed; }
    .error-msg {
      background: rgba(239, 68, 68, 0.1);
      border: 1px solid rgba(239, 68, 68, 0.25);
      color: #f87171;
      font-size: 0.8rem;
      padding: 0.65rem;
      border-radius: 0.5rem;
      margin-top: 1rem;
      display: none;
    }
    .back-link {
      display: inline-block;
      margin-top: 1.5rem;
      font-size: 0.8rem;
      color: #64748b;
      text-decoration: none;
      transition: color 0.2s;
    }
    .back-link:hover { color: #94a3b8; }
    .hidden { display: none !important; }
    .loading-pulse {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 1rem;
      padding: 1.5rem 0;
    }
    .spinner {
      width: 38px;
      height: 38px;
      border: 3px solid rgba(56, 189, 248, 0.2);
      border-top-color: #38bdf8;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
  </style>
</head>
<body>

  <div class="card">
    <div class="icon-badge">🔐</div>
    <h1>展示內容加密保護</h1>
    <div class="page-name">${safeTitle}</div>

    <!-- 自動嘗試解密中提示 -->
    <div id="loadingBox" class="loading-pulse">
      <div class="spinner"></div>
      <p style="margin: 0; font-size: 0.85rem; color: #38bdf8;">正在進行安全憑證驗證...</p>
    </div>

    <!-- 手動輸入解密表單 -->
    <div id="unlockFormBox" class="hidden">
      <p>本頁面已透過 AES-256-GCM 高強度加密。請輸入主密碼以解鎖檢視內容。</p>

      <form id="unlockForm" onsubmit="handleUnlock(event)">
        <div class="form-group">
          <label for="pwdInput">存取授權密碼</label>
          <div class="input-wrap">
            <input type="password" id="pwdInput" placeholder="請輸入解鎖密碼..." autocomplete="current-password" required autofocus>
            <button type="button" class="toggle-pwd" onclick="togglePasswordVisibility()" title="切換顯示密碼">👁️</button>
          </div>
        </div>

        <label class="remember-wrap">
          <input type="checkbox" id="rememberMe" checked>
          <span>在此瀏覽器保持解鎖狀態</span>
        </label>

        <button type="submit" id="submitBtn" class="btn-submit">解鎖展示內容</button>
        <div id="errorMsg" class="error-msg"></div>
      </form>
    </div>

    <a href="../index.html" class="back-link">← 返回展示中心 (Hub 首頁)</a>
  </div>

  <script id="__PAYLOAD__" type="application/json">
    ${payloadJson}
  </script>

  <script>
    const payload = JSON.parse(document.getElementById('__PAYLOAD__').textContent);

    // 原生 Web Crypto API 解密
    async function decryptPayload(password, saltB64, ivB64, ctB64) {
      const salt = Uint8Array.from(atob(saltB64), c => c.charCodeAt(0));
      const iv = Uint8Array.from(atob(ivB64), c => c.charCodeAt(0));
      const ct = Uint8Array.from(atob(ctB64), c => c.charCodeAt(0));

      const enc = new TextEncoder();
      const keyMaterial = await window.crypto.subtle.importKey(
        'raw',
        enc.encode(password),
        'PBKDF2',
        false,
        ['deriveKey']
      );

      const key = await window.crypto.subtle.deriveKey(
        {
          name: 'PBKDF2',
          salt: salt,
          iterations: 100000,
          hash: 'SHA-256'
        },
        keyMaterial,
        { name: 'AES-GCM', length: 256 },
        false,
        ['decrypt']
      );

      const decrypted = await window.crypto.subtle.decrypt(
        { name: 'AES-GCM', iv: iv },
        key,
        ct
      );

      return new TextDecoder().decode(decrypted);
    }

    // 將解密內容無縫渲染至當前頁面
    function renderDecryptedDocument(html) {
      document.open();
      document.write(html);
      document.close();
    }

    function togglePasswordVisibility() {
      const input = document.getElementById('pwdInput');
      input.type = input.type === 'password' ? 'text' : 'password';
    }

    // 手動提交解密表單
    async function handleUnlock(event) {
      event.preventDefault();
      const input = document.getElementById('pwdInput');
      const submitBtn = document.getElementById('submitBtn');
      const errorMsg = document.getElementById('errorMsg');
      const remember = document.getElementById('rememberMe').checked;
      const pwd = input.value.trim();

      if (!pwd) return;

      submitBtn.disabled = true;
      submitBtn.innerText = '正在驗證並解密...';
      errorMsg.style.display = 'none';

      try {
        const decryptedHtml = await decryptPayload(pwd, payload.salt, payload.iv, payload.ciphertext);

        // 成功！保存至儲存區實現全站暢行
        sessionStorage.setItem('KU_DEMO_PASSWORD', pwd);
        if (remember) {
          localStorage.setItem('KU_DEMO_PASSWORD', pwd);
        } else {
          localStorage.removeItem('KU_DEMO_PASSWORD');
        }

        renderDecryptedDocument(decryptedHtml);
      } catch (err) {
        console.error('Decryption failed:', err);
        errorMsg.innerText = '密碼錯誤或解密失敗，請重新輸入！';
        errorMsg.style.display = 'block';
        submitBtn.disabled = false;
        submitBtn.innerText = '解鎖展示內容';
        input.select();
      }
    }

    // 頁面初始化：自動檢查是否有已儲存的授權憑證
    (async function init() {
      const savedPwd = sessionStorage.getItem('KU_DEMO_PASSWORD') || localStorage.getItem('KU_DEMO_PASSWORD');
      if (savedPwd) {
        try {
          const decryptedHtml = await decryptPayload(savedPwd, payload.salt, payload.iv, payload.ciphertext);
          // 自動延續到 sessionStorage
          sessionStorage.setItem('KU_DEMO_PASSWORD', savedPwd);
          renderDecryptedDocument(decryptedHtml);
          return;
        } catch (e) {
          // 已儲存密碼失效，清除並要求重新輸入
          sessionStorage.removeItem('KU_DEMO_PASSWORD');
          localStorage.removeItem('KU_DEMO_PASSWORD');
        }
      }

      // 無法自動解密，呈現手動輸入框
      document.getElementById('loadingBox').classList.add('hidden');
      document.getElementById('unlockFormBox').classList.remove('hidden');
      document.getElementById('pwdInput').focus();
    })();
  </script>
</body>
</html>`;
}

// 提取 HTML 檔案中的 <title> 標籤
function extractTitleFromHtml(html) {
  const match = html.match(/<title>([^<]*)<\/title>/i);
  if (match && match[1]) {
    return match[1].replace(/ - Ku Visual Hub.*$/, '').trim();
  }
  return '視覺化展示模組';
}

// 主執行函式
async function main() {
  console.log('====================================================');
  console.log('🛡️  Ku Visual Hub - 全站 AES-256 加密打包工具');
  console.log('====================================================\n');

  // 1. 取得主密碼
  let password = getPasswordFromArgs() || getPasswordFromEnvFile();

  if (!password) {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    password = await new Promise((resolve) => {
      rl.question('🔑 請輸入要設定的全站解鎖主密碼 (Master Password)：', (ans) => {
        rl.close();
        resolve(ans.trim());
      });
    });
  }

  if (!password || password.length < 4) {
    console.error('❌ 錯誤：密碼長度不得少於 4 個字元！打包已終止。');
    process.exit(1);
  }

  console.log('🔒 使用主密碼進行高強度 AES-256-GCM + PBKDF2 (100k rounds) 加密...\n');

  // 確保輸出目錄存在
  fs.mkdirSync(path.dirname(DIST_DATA), { recursive: true });
  fs.mkdirSync(DIST_DEMOS_DIR, { recursive: true });

  // 2. 加密 data/demos.json
  if (!fs.existsSync(SRC_DATA)) {
    console.error(`❌ 錯誤：找不到未加密清單原始檔：${SRC_DATA}`);
    process.exit(1);
  }

  const rawJsonContent = fs.readFileSync(SRC_DATA, 'utf8');
  const encryptedManifest = {
    encrypted: true,
    version: '1.1.0',
    updatedAt: new Date().toISOString(),
    ...encryptString(rawJsonContent, password)
  };

  fs.writeFileSync(DIST_DATA, JSON.stringify(encryptedManifest, null, 2), 'utf8');
  console.log(`✅ [1/3] 已成功加密展示清單 -> data/demos.json`);

  // 3. 加密所有 src_demos/*.html
  if (!fs.existsSync(SRC_DEMOS_DIR)) {
    console.error(`❌ 錯誤：找不到子頁面原始目錄：${SRC_DEMOS_DIR}`);
    process.exit(1);
  }

  const demoFiles = fs.readdirSync(SRC_DEMOS_DIR).filter(f => f.endsWith('.html'));
  console.log(`\n📦 [2/3] 開始加密 ${demoFiles.length} 個子頁面模組：`);

  let count = 0;
  for (const file of demoFiles) {
    const srcFilePath = path.join(SRC_DEMOS_DIR, file);
    const distFilePath = path.join(DIST_DEMOS_DIR, file);

    const rawHtml = fs.readFileSync(srcFilePath, 'utf8');
    const pageTitle = extractTitleFromHtml(rawHtml);
    const encryptedPayload = encryptString(rawHtml, password);
    const wrappedHtml = generateDecryptorHtml(encryptedPayload, pageTitle);

    fs.writeFileSync(distFilePath, wrappedHtml, 'utf8');
    count++;
    console.log(`   └─ [${count}/${demoFiles.length}] 🔒 加密完成: demos/${file} (${pageTitle})`);
  }

  // 4. 更新 sw.js 快取版本以保證 PWA 最新狀態
  if (fs.existsSync(SW_PATH)) {
    let swContent = fs.readFileSync(SW_PATH, 'utf8');
    const newVersion = `ku-visual-hub-v1.1.0-${Date.now().toString(36)}`;
    swContent = swContent.replace(/const CACHE_NAME = ['"][^'"]+['"];/, `const CACHE_NAME = '${newVersion}';`);
    fs.writeFileSync(SW_PATH, swContent, 'utf8');
    console.log(`\n🔄 [3/3] 已更新 Service Worker 快取版本識別符: ${newVersion}`);
  }

  console.log('\n====================================================');
  console.log('🎉 全站加密打包完成！');
  console.log('🔒 GitHub 遠端儲存庫將僅包含 AES-256 密文，原始碼受到完全保護。');
  console.log('====================================================\n');
}

main().catch(err => {
  console.error('打包過程發生未預期錯誤:', err);
  process.exit(1);
});

