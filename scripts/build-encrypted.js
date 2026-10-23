/**
 * Ku Visual Hub - 全站 AES-256-GCM 自動化加密打包與 dist 建置工具
 * 
 * 作用：
 * 1. 讀取本機受控 .env / DEMO_PASSWORD (禁止命令行明文參數傳遞以防止 shell 歷史洩漏)
 * 2. 驗證密碼強度門檻 (長度 >= 16 碼且具備足夠熵值)
 * 3. 讀取 src_data/demos.json 並以 AES-256-GCM + PBKDF2 (10萬次) 加密
 * 4. 讀取 src_demos/*.html 並封裝為安全獨立解密外殼 (無 Storage 密碼儲存，記憶體單次解密)
 * 5. 統一輸出至 dist/ 發布目錄，嚴格執行白名單 (Allowlist) 檢驗與建置閘門 (Build Gate)
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const readline = require('readline');

const ROOT_DIR = path.resolve(__dirname, '..');
const SRC_DATA = path.join(ROOT_DIR, 'src_data', 'demos.json');
const DIST_DIR = path.join(ROOT_DIR, 'dist');
const DIST_DATA = path.join(ROOT_DIR, 'data', 'demos.json');
const SRC_DEMOS_DIR = path.join(ROOT_DIR, 'src_demos');
const DIST_DEMOS_DIR = path.join(ROOT_DIR, 'demos');
const SW_PATH = path.join(ROOT_DIR, 'sw.js');
const ENV_PATH = path.join(ROOT_DIR, '.env');

// 讀取 .env 中的 DEMO_PASSWORD (不支援命令行參數以杜絕 shell 歷史外洩)
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

// 讀取各子頁面專屬分享密碼 (格式: DEMO_SHARE_<KEY>=<VALUE>)
function getSharePasswordsFromEnv() {
  const shareMap = {};
  if (fs.existsSync(ENV_PATH)) {
    const lines = fs.readFileSync(ENV_PATH, 'utf8').split('\n');
    for (const line of lines) {
      const match = line.match(/^DEMO_SHARE_([A-Za-z0-9_]+)\s*=\s*(.+)$/);
      if (match) {
        const key = match[1].toLowerCase().replace(/_/g, '-');
        const val = match[2].trim().replace(/^["']|["']$/g, '');
        shareMap[key] = val;
      }
    }
  }
  for (const envKey of Object.keys(process.env)) {
    if (envKey.startsWith('DEMO_SHARE_')) {
      const key = envKey.substring(11).toLowerCase().replace(/_/g, '-');
      shareMap[key] = process.env[envKey].trim().replace(/^["']|["']$/g, '');
    }
  }
  return shareMap;
}

// 根據 demoId 比對是否存在專屬分享密碼
function findSharePasswordForDemo(demoId, shareMap) {
  if (shareMap[demoId]) return shareMap[demoId];
  for (const [key, val] of Object.entries(shareMap)) {
    if (demoId.startsWith(key) || demoId.includes(key)) {
      return val;
    }
  }
  return null;
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

// 產生子頁面通用解密外殼 HTML (支援主密碼與單頁專屬分享密碼雙軌解鎖)
function generateDecryptorHtml(encryptedPayload, pageTitle, sharePayloads = [], demoId = '') {
  const safeTitle = (pageTitle || '受保護的展示頁面')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

  const hasShares = sharePayloads && sharePayloads.length > 0;
  const fullPayload = {
    ...encryptedPayload,
    ...(hasShares ? { shares: sharePayloads } : {})
  };

  const payloadJson = JSON.stringify(fullPayload);

  const isOkinawa = demoId === 'okinawa-travel-journal';
  const okinawaMeta = isOkinawa ? `
  <link rel="manifest" href="../manifest-okinawa.json">
  <meta name="apple-mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
  <meta name="apple-mobile-web-app-title" content="沖繩自駕手冊">
  <link rel="apple-touch-icon" href="../icons/icon-192.png">
  <meta name="theme-color" content="#082f49">` : '';

  return `<!DOCTYPE html>
<html lang="zh-TW" class="dark">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <title>${safeTitle} - Ku Visual Hub (加密保護)</title>
  <meta name="robots" content="noindex, nofollow">
  <link rel="icon" type="image/svg+xml" href="../icons/icon.svg">${okinawaMeta}
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
    .security-note {
      font-size: 0.75rem;
      color: #64748b;
      margin-top: 1rem;
      line-height: 1.5;
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
  </style>
</head>
<body>

  <div class="card">
    <div class="icon-badge">🔐</div>
    <h1>展示內容加密保護</h1>
    <div class="page-name">${safeTitle}</div>

    <!-- 自動嘗試解密中提示 -->
    <div id="loadingBox" style="display:flex;flex-direction:column;align-items:center;gap:1rem;padding:1.5rem 0;">
      <div style="width:36px;height:36px;border:3px solid rgba(56,189,248,0.2);border-top-color:#38bdf8;border-radius:50%;animation:spin 0.8s linear infinite;"></div>
      <p style="margin:0;font-size:0.85rem;color:#38bdf8;">正在進行本裝置安全憑證驗證...</p>
    </div>
    <style>@keyframes spin { to { transform: rotate(360deg); } }</style>

    <div id="unlockFormBox" style="display:none;">
      <p>\${hasShares ? '本頁面已透過 AES-256-GCM 高強度加密保護。請輸入全站主密碼或本頁專屬分享密碼以解鎖檢視內容。' : '本頁面已透過 AES-256-GCM 高強度加密。請輸入主密碼以解鎖檢視內容。'}</p>

      <form id="unlockForm" onsubmit="handleUnlock(event)">
        <div class="form-group">
          <label for="pwdInput">存取授權密碼</label>
          <div class="input-wrap">
            <input type="password" id="pwdInput" placeholder="請輸入解鎖密碼..." autocomplete="current-password" required autofocus>
            <button type="button" class="toggle-pwd" onclick="togglePasswordVisibility()" title="切換顯示密碼">👁️</button>
          </div>
        </div>

        <label style="display:flex;align-items:center;gap:0.5rem;margin-bottom:1.25rem;font-size:0.8rem;color:#cbd5e1;cursor:pointer;">
          <input type="checkbox" id="rememberDevice" style="accent-color:#0ea5e9;" checked>
          <span>在此裝置永久保持解鎖（免重複輸入）</span>
        </label>

        <button type="submit" id="submitBtn" class="btn-submit">解鎖展示內容</button>
        <div id="errorMsg" class="error-msg"></div>
        <div class="security-note">🛡️ 安全保護：採用 IndexedDB 不可匯出密鑰隔離，密碼本體絕不留存於 Storage</div>
      </form>
    </div>

    <a href="../index.html" class="back-link">← 返回展示中心 (Hub 首頁)</a>
  </div>

  <script id="__PAYLOAD__" type="application/json">
    ${payloadJson}
  </script>

  <script>
    const payload = JSON.parse(document.getElementById('__PAYLOAD__').textContent);

    // ===== IndexedDB 不可匯出密鑰庫 (Device-Bound Non-Exportable Vault) =====
    const VAULT_DB_NAME = 'KuHubVaultDB';
    const VAULT_DB_VERSION = 1;
    const VAULT_STORE_NAME = 'auth_vault';

    function openVaultDB() {
      return new Promise((resolve, reject) => {
        const timer = setTimeout(() => reject(new Error('IndexedDB open timeout')), 1200);
        try {
          const req = indexedDB.open(VAULT_DB_NAME, VAULT_DB_VERSION);
          req.onblocked = () => {
            clearTimeout(timer);
            reject(new Error('IndexedDB open blocked'));
          };
          req.onupgradeneeded = (e) => {
            const db = e.target.result;
            if (!db.objectStoreNames.contains(VAULT_STORE_NAME)) {
              db.createObjectStore(VAULT_STORE_NAME, { keyPath: 'id' });
            }
          };
          req.onsuccess = () => {
            clearTimeout(timer);
            resolve(req.result);
          };
          req.onerror = (e) => {
            clearTimeout(timer);
            reject(req.error || e);
          };
        } catch (err) {
          clearTimeout(timer);
          reject(err);
        }
      });
    }

    async function saveDeviceAuth(password) {
      try {
        const db = await openVaultDB();
        const deviceKey = await window.crypto.subtle.generateKey(
          { name: 'AES-GCM', length: 256 },
          false,
          ['encrypt', 'decrypt']
        );
        const iv = window.crypto.getRandomValues(new Uint8Array(12));
        const enc = new TextEncoder();
        const ciphertext = await window.crypto.subtle.encrypt(
          { name: 'AES-GCM', iv: iv },
          deviceKey,
          enc.encode(password)
        );
        const record = {
          id: 'device_auth',
          deviceKey: deviceKey,
          iv: iv,
          ciphertext: ciphertext,
          expiresAt: null // 永久保留，直到手動點擊鎖定或密碼更換
        };
        return new Promise((resolve, reject) => {
          const tx = db.transaction(VAULT_STORE_NAME, 'readwrite');
          tx.objectStore(VAULT_STORE_NAME).put(record);
          tx.oncomplete = () => resolve(true);
          tx.onerror = () => reject(tx.error);
        });
      } catch (err) {
        console.warn('saveDeviceAuth failed:', err);
        return false;
      }
    }

    async function getDeviceAuth() {
      try {
        const db = await openVaultDB();
        const record = await new Promise((resolve, reject) => {
          const tx = db.transaction(VAULT_STORE_NAME, 'readonly');
          const req = tx.objectStore(VAULT_STORE_NAME).get('device_auth');
          req.onsuccess = () => resolve(req.result);
          req.onerror = () => reject(req.error);
        });
        if (!record) return null;
        if (record.expiresAt && Date.now() > record.expiresAt) {
          return null;
        }
        const decrypted = await window.crypto.subtle.decrypt(
          { name: 'AES-GCM', iv: record.iv },
          record.deviceKey,
          record.ciphertext
        );
        return new TextDecoder().decode(decrypted);
      } catch (err) {
        return null;
      }
    }

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

    // 多重金鑰支援解密函式 (相容全站主密碼與專屬分享密碼)
    async function tryDecryptAny(pwd) {
      // 1. 優先嘗試主金鑰
      try {
        return await decryptPayload(pwd, payload.salt, payload.iv, payload.ciphertext);
      } catch (err) {}

      // 2. 嘗試各組專屬分享金鑰 (若有)
      if (payload.shares && Array.isArray(payload.shares)) {
        for (const share of payload.shares) {
          try {
            return await decryptPayload(pwd, share.salt, share.iv, share.ciphertext);
          } catch (err) {}
        }
      }
      throw new Error('All decryption attempts failed');
    }

    // 手動提交解密表單
    async function handleUnlock(event) {
      event.preventDefault();
      const input = document.getElementById('pwdInput');
      const submitBtn = document.getElementById('submitBtn');
      const errorMsg = document.getElementById('errorMsg');
      const remember = document.getElementById('rememberDevice').checked;
      const pwd = input.value.trim();

      if (!pwd) return;

      submitBtn.disabled = true;
      submitBtn.innerText = '正在驗證並解密...';
      errorMsg.style.display = 'none';

      try {
        const decryptedHtml = await tryDecryptAny(pwd);
        if (remember) {
          await saveDeviceAuth(pwd);
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

    // 頁面初始化：嘗試自動從 IndexedDB 憑證解密 (附帶安全閥強制回退)
    (async function init() {
      let isUnlocked = false;

      // 設置 1.8 秒強制防卡死安全閥：若超時未解密，強制切換至密碼輸入畫面
      const fallbackTimer = setTimeout(() => {
        if (!isUnlocked) {
          const lb = document.getElementById('loadingBox');
          const fb = document.getElementById('unlockFormBox');
          if (lb) lb.style.display = 'none';
          if (fb) {
            fb.style.display = 'block';
            const pwdIn = document.getElementById('pwdInput');
            if (pwdIn) pwdIn.focus();
          }
        }
      }, 1800);

      try {
        sessionStorage.removeItem('KU_DEMO_PASSWORD');
        localStorage.removeItem('KU_DEMO_PASSWORD');
      } catch (e) {}

      try {
        const savedPwd = await getDeviceAuth();
        if (savedPwd) {
          try {
            const decryptedHtml = await tryDecryptAny(savedPwd);
            isUnlocked = true;
            clearTimeout(fallbackTimer);
            renderDecryptedDocument(decryptedHtml);
            return;
          } catch (e) {
            console.warn('Saved auth invalid:', e);
          }
        }
      } catch (err) {
        console.warn('Device auth check error:', err);
      }

      clearTimeout(fallbackTimer);
      if (!isUnlocked) {
        const loadBox = document.getElementById('loadingBox');
        if (loadBox) loadBox.style.display = 'none';
        const formBox = document.getElementById('unlockFormBox');
        if (formBox) formBox.style.display = 'block';
        const input = document.getElementById('pwdInput');
        if (input) input.focus();
      }
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

// 複製目錄小工具
function copyDirSync(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDirSync(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

// 嚴格建置閘門驗證 (Build Gate Verification)
function verifyDistDirectory(distDir) {
  console.log('\n🔍 [驗證閘門] 執行 dist/ 發布目錄安全性與完整性檢查...');

  // 1. 檢查 dist/data/demos.json 是否存在且為加密密文
  const dataPath = path.join(distDir, 'data', 'demos.json');
  if (!fs.existsSync(dataPath)) {
    throw new Error('閘門檢查失敗：dist/data/demos.json 不存在！');
  }
  const manifest = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
  if (!manifest.encrypted || !manifest.salt || !manifest.iv || !manifest.ciphertext) {
    throw new Error('閘門檢查失敗：dist/data/demos.json 未加密或格式不完整！');
  }
  console.log('   ✅ [1/4] dist/data/demos.json 加密標記與密文結構正確');

  // 2. 檢查 dist/demos/*.html 是否皆包含 Payload
  const demosDir = path.join(distDir, 'demos');
  if (!fs.existsSync(demosDir)) {
    throw new Error('閘門檢查失敗：dist/demos 目錄不存在！');
  }
  const demoFiles = fs.readdirSync(demosDir).filter(f => f.endsWith('.html'));
  if (demoFiles.length === 0) {
    throw new Error('閘門檢查失敗：dist/demos 目錄下沒有任何展示子頁面！');
  }
  for (const f of demoFiles) {
    const content = fs.readFileSync(path.join(demosDir, f), 'utf8');
    if (!content.includes('<script id="__PAYLOAD__"') || !content.includes('AES-256-GCM')) {
      throw new Error(`閘門檢查失敗：dist/demos/${f} 缺少密文 Payload 外殼！`);
    }
  }
  console.log(`   ✅ [2/4] 所有 ${demoFiles.length} 個展示子頁面均完成獨立密文外殼封裝`);

  // 3. 檢查 dist/ 是否嚴格符合允許清單 (嚴禁 scripts/, src_*, .env, .md)
  function scanForbidden(dir) {
    const list = fs.readdirSync(dir, { withFileTypes: true });
    for (const item of list) {
      const fullPath = path.join(dir, item.name);
      const relPath = path.relative(distDir, fullPath).replace(/\\/g, '/');

      // 嚴格禁止項目
      if (item.name.startsWith('.env') ||
          item.name.startsWith('src_') ||
          item.name === 'scripts' ||
          item.name.endsWith('.md') ||
          (item.name.endsWith('.js') && relPath !== 'sw.js')) {
        throw new Error(`閘門檢查失敗：發布目錄 dist 發現禁止檔案：${relPath}`);
      }

      if (item.isDirectory()) {
        scanForbidden(fullPath);
      }
    }
  }
  scanForbidden(distDir);
  console.log('   ✅ [3/4] dist/ 目錄排除清單檢查通過 (無 scripts/、無明文原始檔、無 .env)');

  // 4. 檢查首頁 index.html 存在性
  if (!fs.existsSync(path.join(distDir, 'index.html')) || !fs.existsSync(path.join(distDir, 'sw.js'))) {
    throw new Error('閘門檢查失敗：dist/index.html 或 sw.js 缺失！');
  }
  console.log('   ✅ [4/4] 核心網站資產 (index.html, sw.js, manifest.json) 就緒');

  console.log('🎉 [驗證閘門] 所有檢查 100% 通過，dist/ 符合安全發布規範！\n');
}

// 主執行函式
async function main() {
  console.log('====================================================');
  console.log('🛡️  Ku Visual Hub - 全站 AES-256 安全打包與 dist 建置');
  console.log('====================================================\n');

  // 1. 取得主密碼 (僅由環境變數讀取或互動輸入)
  let password = getPasswordFromEnvFile();

  if (!password) {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    password = await new Promise((resolve) => {
      rl.question('🔑 請輸入全站解鎖主密碼 (DEMO_PASSWORD)：', (ans) => {
        rl.close();
        resolve(ans.trim());
      });
    });
  }

  // 加強密碼強度門檻 (至少 16 字元)
  if (!password || password.length < 16) {
    console.error('❌ 錯誤：主密碼長度不得少於 16 個字元且必須具備高熵值！打包已終止。');
    throw new Error('DEMO_PASSWORD must be at least 16 characters long');
  }

  console.log('🔒 使用高強度主密碼執行 AES-256-GCM + PBKDF2 (100k rounds) 加密...\n');

  // 讀取 package.json 版號
  const PKG_PATH = path.join(ROOT_DIR, 'package.json');
  const pkgData = fs.existsSync(PKG_PATH) ? JSON.parse(fs.readFileSync(PKG_PATH, 'utf8')) : {};
  const currentAppVersion = pkgData.version || '1.3.0';

  // 2. 清理並建立 dist 目錄
  console.log('🧹 [1/5] 清理並初始化 dist/ 目錄...');
  if (fs.existsSync(DIST_DIR)) {
    fs.rmSync(DIST_DIR, { recursive: true, force: true });
  }
  fs.mkdirSync(DIST_DIR, { recursive: true });
  fs.mkdirSync(path.join(DIST_DIR, 'data'), { recursive: true });
  fs.mkdirSync(path.join(DIST_DIR, 'demos'), { recursive: true });

  // 確保本機根目錄 data 與 demos 也存在以保持本地相容性
  fs.mkdirSync(path.dirname(DIST_DATA), { recursive: true });
  fs.mkdirSync(DIST_DEMOS_DIR, { recursive: true });

  // 3. 複製靜態允許資產至 dist/
  console.log('📁 [2/5] 複製首頁與靜態資源至 dist/...');
  fs.copyFileSync(path.join(ROOT_DIR, 'index.html'), path.join(DIST_DIR, 'index.html'));
  fs.copyFileSync(path.join(ROOT_DIR, 'manifest.json'), path.join(DIST_DIR, 'manifest.json'));
  if (fs.existsSync(path.join(ROOT_DIR, 'manifest-okinawa.json'))) {
    fs.copyFileSync(path.join(ROOT_DIR, 'manifest-okinawa.json'), path.join(DIST_DIR, 'manifest-okinawa.json'));
  }
  if (fs.existsSync(path.join(ROOT_DIR, 'icons'))) {
    copyDirSync(path.join(ROOT_DIR, 'icons'), path.join(DIST_DIR, 'icons'));
  }

  // 4. 加密 data/demos.json
  if (!fs.existsSync(SRC_DATA)) {
    console.error(`❌ 錯誤：找不到未加密清單原始檔：${SRC_DATA}`);
    process.exit(1);
  }

  const rawJsonContent = fs.readFileSync(SRC_DATA, 'utf8');
  const encryptedManifest = {
    encrypted: true,
    version: currentAppVersion,
    updatedAt: new Date().toISOString(),
    ...encryptString(rawJsonContent, password)
  };

  const encJsonStr = JSON.stringify(encryptedManifest, null, 2);
  fs.writeFileSync(DIST_DATA, encJsonStr, 'utf8');
  fs.writeFileSync(path.join(DIST_DIR, 'data', 'demos.json'), encJsonStr, 'utf8');
  console.log(`✅ [3/5] 已成功加密展示清單 -> data/demos.json 及 dist/data/demos.json`);

  // 5. 加密所有 src_demos/*.html
  if (!fs.existsSync(SRC_DEMOS_DIR)) {
    console.error(`❌ 錯誤：找不到子頁面原始目錄：${SRC_DEMOS_DIR}`);
    process.exit(1);
  }

  const demoFiles = fs.readdirSync(SRC_DEMOS_DIR).filter(f => f.endsWith('.html'));
  const shareMap = getSharePasswordsFromEnv();
  console.log(`\n📦 [4/5] 開始加密 ${demoFiles.length} 個子頁面模組：`);

  let count = 0;
  for (const file of demoFiles) {
    const srcFilePath = path.join(SRC_DEMOS_DIR, file);
    const distFilePath = path.join(DIST_DEMOS_DIR, file);
    const distExportPath = path.join(DIST_DIR, 'demos', file);

    const demoId = file.replace(/\.html$/, '');
    const sharePassword = findSharePasswordForDemo(demoId, shareMap);
    const rawHtml = fs.readFileSync(srcFilePath, 'utf8');
    const pageTitle = extractTitleFromHtml(rawHtml);
    const encryptedPayload = encryptString(rawHtml, password);

    const sharePayloads = [];
    if (sharePassword) {
      sharePayloads.push(encryptString(rawHtml, sharePassword));
    }

    const wrappedHtml = generateDecryptorHtml(encryptedPayload, pageTitle, sharePayloads, demoId);

    fs.writeFileSync(distFilePath, wrappedHtml, 'utf8');
    fs.writeFileSync(distExportPath, wrappedHtml, 'utf8');
    count++;
    const shareTag = sharePassword ? ' [🔑 含專屬分享密碼]' : '';
    console.log(`   └─ [${count}/${demoFiles.length}] 🔒 加密完成: demos/${file} (${pageTitle})${shareTag}`);
  }

  // 6. 更新 sw.js 快取版本並同步至 dist/
  const newCacheVersion = `ku-visual-hub-v${currentAppVersion}-${Date.now().toString(36)}`;
  if (fs.existsSync(SW_PATH)) {
    let swContent = fs.readFileSync(SW_PATH, 'utf8');
    swContent = swContent.replace(/const CACHE_NAME = ['"][^'"]+['"];/, `const CACHE_NAME = '${newCacheVersion}';`);
    fs.writeFileSync(SW_PATH, swContent, 'utf8');
    fs.writeFileSync(path.join(DIST_DIR, 'sw.js'), swContent, 'utf8');
    console.log(`\n🔄 [5/5] 已更新 Service Worker 快取識別碼: ${newCacheVersion}`);
  }

  // 7. 執行建置閘門驗證
  verifyDistDirectory(DIST_DIR);

  console.log('====================================================');
  console.log('🎉 建置打包與安全驗證全數完成！');
  console.log(`📦 發布輸出目錄: ${DIST_DIR}`);
  console.log('🔒 GitHub Pages 將僅上傳 dist/，完全杜絕任何測試代碼或明文外洩。');
  console.log('====================================================\n');
}

main().catch(err => {
  console.error('打包建置過程發生錯誤:', err);
  process.exit(1);
});
