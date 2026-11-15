// © 2026 Sapphire Technology Ltd. All rights reserved. Unauthorised copying is prohibited.
import {normRecoveryId, deviceSecret, recoveryReply, password, bitlockerKey, selfTest} from './sums.js';

const $ = (s) => document.querySelector(s);
const err = (t) => { $('#err').textContent = t || ''; $('#err').hidden = !t; };
const num = (s) => String(s || '').replace(/\D/g, '');

// The master key and anything worked out from it go after 5 minutes without use
let timer = null;
function clearSoon() {
  clearTimeout(timer);
  timer = setTimeout(() => { $('#mk').value = ''; ['#o1', '#o2'].forEach((x) => { $(x).hidden = true; }); ['#r1', '#p1', '#p2', '#p3'].forEach((x) => { $(x).textContent = ''; }); }, 5 * 60_000);
}
document.addEventListener('input', clearSoon);
document.addEventListener('visibilitychange', () => { if (document.hidden) clearSoon(); });

async function secret() {
  const mk = $('#mk').value.trim(), rid = normRecoveryId($('#rid').value);
  if (mk.length < 16) throw new Error('Paste the master key from 1Password.');
  if (!rid) throw new Error('Type the recovery ID from the lock screen.');
  return deviceSecret(mk, rid);
}

$('#mkshow').onclick = () => { const t = $('#mk').type === 'password'; $('#mk').type = t ? 'text' : 'password'; $('#mkshow').textContent = t ? 'Hide' : 'Show'; };
document.querySelectorAll('[data-tab]').forEach((b) => b.onclick = () => {
  document.querySelectorAll('[data-tab]').forEach((x) => x.setAttribute('aria-selected', String(x === b)));
  $('#t-reply').hidden = b.dataset.tab !== 'reply'; $('#t-pw').hidden = b.dataset.tab !== 'pw'; err();
});
$('#go1').onclick = async () => {
  err(); $('#o1').hidden = true;
  try {
    const ch = num($('#ch').value);
    if (ch.length !== 6) throw new Error('Type the 6-digit number from the lock screen.');
    const r = await recoveryReply(await secret(), ch);
    $('#r1').textContent = r.slice(0, 4) + ' ' + r.slice(4); $('#o1').hidden = false; clearSoon();
  } catch (e) { err(e.message); }
};
$('#go2').onclick = async () => {
  err(); $('#o2').hidden = true;
  try {
    const s = await secret(), n = (x) => Number(num($(x).value) || 0);
    $('#p1').textContent = await password(s, 'admin', n('#an'));
    $('#p2').textContent = await password(s, 'user', n('#un'));
    $('#p3').textContent = await bitlockerKey(s, n('#bn'));
    $('#o2').hidden = false; clearSoon();
  } catch (e) { err(e.message); }
};
document.querySelectorAll('[data-cp]').forEach((b) => b.onclick = () => {
  navigator.clipboard?.writeText($('#' + b.dataset.cp).textContent).then(() => { b.textContent = 'Copied'; setTimeout(() => { b.textContent = 'Copy'; }, 1500); }, () => {});
});
document.addEventListener('keydown', (e) => { if (e.key === 'Enter' && e.target.tagName === 'INPUT') ($('#t-reply').hidden ? $('#go2') : $('#go1')).click(); });

selfTest().then((ok) => { if (!ok) { $('#bad').hidden = false; $('#go1').disabled = $('#go2').disabled = true; } }, () => { $('#bad').hidden = false; });
if ('serviceWorker' in navigator && location.protocol === 'https:') navigator.serviceWorker.register('sw.js').catch(() => {});
