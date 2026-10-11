const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

let password = process.env.DEMO_PASSWORD;
if (!password && fs.existsSync('.env')) {
  const match = fs.readFileSync('.env', 'utf8').match(/^DEMO_PASSWORD\s*=\s*(.+)$/m);
  if (match) password = match[1].trim().replace(/^["']|["']$/g, '');
}
password = password || 'KuHub#2026!Vault';

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

console.log('--- 驗證加密完整性測試 ---');

// 1. Test data/demos.json
const rawJson = fs.readFileSync('src_data/demos.json', 'utf8');
const encDataJson = JSON.parse(fs.readFileSync('data/demos.json', 'utf8'));
const decJson = decryptString(encDataJson, password);
console.log('1. demos.json 解密還原比對:', decJson === rawJson ? '✅ PASS (100% 吻合)' : '❌ FAIL');

// 2. Test demos/*.html
const demoFiles = fs.readdirSync('src_demos').filter(f => f.endsWith('.html'));
for (const f of demoFiles) {
  const rawHtml = fs.readFileSync(path.join('src_demos', f), 'utf8');
  const distHtml = fs.readFileSync(path.join('demos', f), 'utf8');
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
  console.log(`2. ${f} 解密還原比對:`, decHtml === rawHtml ? '✅ PASS (100% 吻合)' : '❌ FAIL');
}

// 3. Test wrong password
try {
  decryptString(encDataJson, 'wrong_password');
  console.log('3. 錯誤密碼防禦測試: ❌ FAIL (竟然解密成功)');
} catch (e) {
  console.log('3. 錯誤密碼防禦測試: ✅ PASS (成功阻斷未授權解密)');
}

