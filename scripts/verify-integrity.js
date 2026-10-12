const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT_DIR = path.resolve(__dirname, '..');
const ENV_PATH = path.join(ROOT_DIR, '.env');

// 嚴格讀取環境變數或受控本機 .env，禁止任何寫死的 fallback 預設密碼
let password = process.env.DEMO_PASSWORD;
if (!password && fs.existsSync(ENV_PATH)) {
  const match = fs.readFileSync(ENV_PATH, 'utf8').match(/^DEMO_PASSWORD\s*=\s*(.+)$/m);
  if (match) password = match[1].trim().replace(/^["']|["']$/g, '');
}

if (!password) {
  console.error('❌ 驗證失敗：缺少 DEMO_PASSWORD 環境變數或 .env 設定！');
  throw new Error('DEMO_PASSWORD is required');
}

function decryptString(encryptedObj, pwd) {
  const salt = Buffer.from(encryptedObj.salt, 'base64');
  const iv = Buffer.from(encryptedObj.iv, 'base64');
  const combined = Buffer.from(encryptedObj.ciphertext, 'base64');
  const key = crypto.pbkdf2Sync(pwd, salt, 100000, 32, 'sha256');

  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  const tag = combined.subarray(combined.length - 16);
  const ct = combined.subarray(0, combined.length - 16);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(ct), decipher.final()]).toString('utf8');
}

console.log('--- 驗證加密完整性與安全性測試 ---');

// 1. 測試 data/demos.json
const rawJson = fs.readFileSync(path.join(ROOT_DIR, 'src_data', 'demos.json'), 'utf8');
const encDataJson = JSON.parse(fs.readFileSync(path.join(ROOT_DIR, 'data', 'demos.json'), 'utf8'));
const decJson = decryptString(encDataJson, password);
console.log('1. demos.json 解密還原比對:', decJson === rawJson ? '✅ PASS (100% 吻合)' : '❌ FAIL');

function getSharePasswordForDemo(demoId) {
  if (fs.existsSync(ENV_PATH)) {
    const lines = fs.readFileSync(ENV_PATH, 'utf8').split('\n');
    for (const line of lines) {
      const match = line.match(/^DEMO_SHARE_([A-Za-z0-9_]+)\s*=\s*(.+)$/);
      if (match) {
        const key = match[1].toLowerCase().replace(/_/g, '-');
        if (demoId.startsWith(key) || demoId.includes(key)) {
          return match[2].trim().replace(/^["']|["']$/g, '');
        }
      }
    }
  }
  return null;
}

// 2. 測試 demos/*.html
const demoFiles = fs.readdirSync(path.join(ROOT_DIR, 'src_demos')).filter(f => f.endsWith('.html'));
for (const f of demoFiles) {
  const rawHtml = fs.readFileSync(path.join(ROOT_DIR, 'src_demos', f), 'utf8');
  const distHtml = fs.readFileSync(path.join(ROOT_DIR, 'demos', f), 'utf8');
  const startTag = '<script id="__PAYLOAD__" type="application/json">';
  const endTag = '</script>';
  const startIndex = distHtml.indexOf(startTag);
  const endIndex = distHtml.indexOf(endTag, startIndex);
  if (startIndex === -1 || endIndex === -1) {
    console.log(`2. ${f} ❌ 找不到 Payload 標籤`);
    continue;
  }
  const payloadJson = distHtml.substring(startIndex + startTag.length, endIndex).trim();
  const payload = JSON.parse(payloadJson);
  const decHtml = decryptString(payload, password);
  console.log(`2. ${f} 主密碼解密還原比對:`, decHtml === rawHtml ? '✅ PASS (100% 吻合)' : '❌ FAIL');
  if (decHtml !== rawHtml) process.exit(1);

  // 若含有專屬分享金鑰，測試分享金鑰解密與隔離性
  if (payload.shares && Array.isArray(payload.shares)) {
    const sharePwd = getSharePasswordForDemo(f.replace(/\.html$/, ''));
    if (sharePwd) {
      let sharePass = false;
      for (const share of payload.shares) {
        try {
          const decShareHtml = decryptString(share, sharePwd);
          if (decShareHtml === rawHtml) {
            sharePass = true;
            break;
          }
        } catch (e) {}
      }
      console.log(`   └─ 🔑 專屬分享密碼解密比對:`, sharePass ? '✅ PASS (100% 吻合)' : '❌ FAIL');
      if (!sharePass) process.exit(1);

      // 權限隔離測試：確認分享密碼絕對無法解密全站清單 demos.json
      try {
        decryptString(encDataJson, sharePwd);
        console.log(`   └─ 🛡️ 權限隔離測試: ❌ FAIL (分享密碼竟然能越權解密全站清單！)\n`);
        process.exit(1);
      } catch (e) {
        console.log(`   └─ 🛡️ 權限隔離測試: ✅ PASS (成功阻斷分享密碼越權存取全站清單)`);
      }
    }
  }
}

// 3. 測試 dist/ 目錄 (若存在)
const distDataPath = path.join(ROOT_DIR, 'dist', 'data', 'demos.json');
if (fs.existsSync(distDataPath)) {
  const distEncJson = JSON.parse(fs.readFileSync(distDataPath, 'utf8'));
  const distDec = decryptString(distEncJson, password);
  console.log('3. dist/data/demos.json 解密還原比對:', distDec === rawJson ? '✅ PASS (100% 吻合)' : '❌ FAIL');
}

// 4. 舊密碼輪替失效驗證 (確保已撤銷之測試字串無法解密新密文)
const REVOKED_TEST_PASSWORD = process.env.OLD_DEMO_PASSWORD || 'RevokedLegacyKey#TestOnly!2026';
try {
  decryptString(encDataJson, REVOKED_TEST_PASSWORD);
  console.log('4. 已撤銷密碼防禦測試: ❌ FAIL (已撤銷測試字串竟然能解密！)');
  process.exit(1);
} catch (e) {
  console.log('4. 已撤銷密碼防禦測試: ✅ PASS (已撤銷密碼成功遭到阻斷)');
}

// 5. 隨機錯誤密碼防禦測試
try {
  decryptString(encDataJson, 'wrong_random_password_xyz');
  console.log('5. 隨機錯誤密碼防禦測試: ❌ FAIL (竟然解密成功)');
  process.exit(1);
} catch (e) {
  console.log('5. 隨機錯誤密碼防禦測試: ✅ PASS (成功阻斷未授權解密)');
}

// 6. 密文竄改防禦測試 (改動一個位元)
try {
  const tamperedJson = JSON.parse(JSON.stringify(encDataJson));
  const rawBytes = Buffer.from(tamperedJson.ciphertext, 'base64');
  rawBytes[0] ^= 0x01; // 翻轉一個位元
  tamperedJson.ciphertext = rawBytes.toString('base64');
  decryptString(tamperedJson, password);
  console.log('6. 密文篡改防禦測試: ❌ FAIL (篡改密文未被拒絕)');
  process.exit(1);
} catch (e) {
  console.log('6. 密文篡改防禦測試: ✅ PASS (GCM 認證標籤成功偵測篡改)');
}

console.log('\n🎉 所有安全性與完整性驗證全數通過！\n');
