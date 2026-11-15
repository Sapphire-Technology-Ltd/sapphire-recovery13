// © 2026 Sapphire Technology Ltd. All rights reserved. Unauthorised copying is prohibited.
// The same sums as agent/lockcodes.go and server/lockcodes.js, with the browser's own cryptography.
const SALT = 'sapphire-pulse/device/v1/';
const CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
const enc = new TextEncoder();

async function mac(key, msg) {
  const k = await crypto.subtle.importKey('raw', key, {name: 'HMAC', hash: 'SHA-256'}, false, ['sign']);
  return new Uint8Array(await crypto.subtle.sign('HMAC', k, enc.encode(msg)));
}
export const normRecoveryId = (s) => { const r = String(s || '').replace(/\s+/g, '').toUpperCase(); return /^[A-Z0-9-]{3,40}$/.test(r) ? r : ''; };
export const deviceSecret = (master, rid) => mac(enc.encode(master.trim()), SALT + rid);
function digits(h, n) {
  const o = h[h.length - 1] & 0x0f, v = ((h[o] << 24) | (h[o + 1] << 16) | (h[o + 2] << 8) | h[o + 3]) & 0x7fffffff;
  return String(v % 10 ** n).padStart(n, '0');
}
export const unlockCode = async (secret, n) => digits(await mac(secret, 'unlock/' + n), 6);
export const recoveryReply = async (secret, challenge) => digits(await mac(secret, 'recover/' + challenge), 8);
export async function password(secret, kind, n) {
  const h = await mac(secret, kind + '/' + n); let s = '';
  for (let i = 0; i < 20; i++) {
    if (i && i % 5 === 0) s += '-';
    s += i === 0 ? CHARS[h[i] % 24] : i === 5 ? CHARS[24 + h[i] % 24] : i === 10 ? CHARS[48 + h[i] % 8] : CHARS[h[i] % CHARS.length];
  }
  return s;
}
export async function bitlockerKey(secret, n) {
  const h = await mac(secret, 'bitlocker/' + n);
  return Array.from({length: 8}, (_, i) => String(((h[2 * i] << 8) | h[2 * i + 1]) * 11).padStart(6, '0')).join('-');
}
const hex = (b) => Array.from(b, (x) => x.toString(16).padStart(2, '0')).join('');
/** Checks the sums against the shared test values before anything is shown */
export async function selfTest() {
  const s = await deviceSecret('test-master-key', 'ST-13-0014');
  return hex(s) === '552e64c3e9e630a7c4af1d5a36da6afd9e472f755f259cea721dfde7dcbc2999' && await unlockCode(s, 7) === '649729'
    && await recoveryReply(s, '482913') === '12787522' && await password(s, 'admin', 0) === 'SzheF-jEyv3-8dMT5-wGh3J'
    && await password(s, 'user', 1) === 'Le2Hj-um99C-3xQYL-evUHb' && await bitlockerKey(s, 0) === '132143-548911-720665-123904-010967-454762-135982-484770';
}
