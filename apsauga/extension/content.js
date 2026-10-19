/* Apsauga – PIN ir kortelės duomenų apsauga puslapyje */
(function () {
  'use strict';
  if (window.__apsaugaGuard) return;
  window.__apsaugaGuard = true;

  const D = globalThis.ScamDetector;
  const I = globalThis.ApsaugaI18n;
  if (!D || !I || !/^https?:$/.test(location.protocol)) return;

  const lang = I.pickLang();
  const T = I.strings[lang];
  const isTop = window === window.top;
  const ownHost = location.hostname.toLowerCase();

  // Svetainė, kurioje vartotojas yra (iframe atveju – viršutinis puslapis)
  function topHost() {
    if (isTop) return ownHost;
    try {
      const ao = location.ancestorOrigins;
      if (ao && ao.length) return new URL(ao[ao.length - 1]).hostname.toLowerCase();
    } catch (e) { /* - */ }
    try { if (document.referrer) return new URL(document.referrer).hostname.toLowerCase(); } catch (e) { /* - */ }
    return ownHost;
  }
  const siteHost = topHost();

  let settings = { enabled: true, strict: true, rdap: true };
  let trusted = [];
  let unlocked = false;
  let overlayOpen = false;
  let youngDomain = false; // svetainė užregistruota prieš ≤30 d. (RDAP)
  let ageAsked = false;

  const urlRisk = [D.analyzeUrl(location.href), siteHost !== ownHost ? D.analyzeUrl('https://' + siteHost) : null]
    .filter(Boolean)
    .reduce((a, b) => (b.score > a.score ? b : a));

  chrome.storage.local.get(['settings', 'trusted']).then((r) => {
    settings = Object.assign(settings, r.settings || {});
    trusted = r.trusted || [];
  });
  chrome.storage.onChanged.addListener((ch, area) => {
    if (area !== 'local') return;
    if (ch.settings) settings = Object.assign(settings, ch.settings.newValue || {});
    if (ch.trusted) trusted = ch.trusted.newValue || [];
  });

  // Puslapis apsimeta prekės ženklu (pvz. pavadinime „Swedbank“), bet adresas ne jo
  function contentRisk() {
    const meta = document.querySelector('meta[property="og:site_name"]');
    const text = [document.title, meta && meta.content].filter(Boolean).join(' ');
    if (!text) return false;
    const r = D.analyzeText(text);
    return r.brand && !D.officialBrand(ownHost) && !D.officialBrand(siteHost);
  }

  function isTrusted() {
    return !!D.officialBrand(ownHost) || !!D.officialBrand(siteHost) || D.inList(siteHost, trusted) || D.inList(ownHost, trusted);
  }

  function shouldBlock(kind) {
    if (!settings.enabled || unlocked || isTrusted()) return false;
    const risky = urlRisk.level !== 'ok' || contentRisk() || youngDomain;
    if (kind === 'pin') return true; // kortelės PIN niekada neįvedamas svetainėje
    if (kind === 'password') return risky;
    return risky || settings.strict; // kortelė, CVV, vienkartinis kodas
  }

  // Jei puslapyje yra slaptų duomenų laukelių – iš anksto sužinome domeno amžių
  function askAge() {
    if (ageAsked || !settings.rdap || isTrusted() || !/[a-z]/i.test(siteHost)) return;
    ageAsked = true;
    chrome.runtime.sendMessage({ type: 'domainAge', reg: D.registrable(siteHost) })
      .then((r) => { if (r && typeof r.days === 'number' && r.days <= 30) youngDomain = true; })
      .catch(() => {});
  }
  function scanFields() {
    for (const el of document.querySelectorAll('input')) {
      if (D.classifyField(el)) { askAge(); return; }
    }
  }

  function guard(e) {
    const t = e.composedPath ? e.composedPath()[0] : e.target;
    const kind = D.classifyField(t);
    if (kind) askAge();
    if (!kind || !shouldBlock(kind)) return;
    e.preventDefault();
    e.stopImmediatePropagation();
    try { t.blur(); } catch (err) { /* - */ }
    if (e.type === 'input' && 'value' in t) t.value = '';
    if (isTop) showOverlay(kind);
    else chrome.runtime.sendMessage({ type: 'showGuard', kind, host: siteHost }).catch(() => {});
  }

  for (const type of ['focusin', 'keydown', 'beforeinput', 'paste', 'input']) {
    document.addEventListener(type, guard, true);
  }

  chrome.runtime.onMessage.addListener((msg) => {
    if ((msg.type === 'showGuard' || msg.type === 'clickfix') && isTop) showOverlay(msg.kind);
  });

  /* ---------- ClickFix: netikra CAPTCHA liepia įklijuoti komandą ---------- */
  document.addEventListener('apsauga:clickfix', (e) => {
    if (!settings.enabled || isTrusted()) {
      // Patikima svetainė – grąžiname tikrąjį tekstą
      if (typeof e.detail === 'string' && e.detail) navigator.clipboard.writeText(e.detail).catch(() => {});
      return;
    }
    if (isTop) showOverlay('clickfix');
    else chrome.runtime.sendMessage({ type: 'clickfix', kind: 'clickfix' }).catch(() => {});
  });

  const WIN_R = /(win(dows)?\s*(key|klavi\S*)?|⊞|logo\S*)\s*\+\s*["„“']?r\b/i;
  const PASTE = /(ctrl|control|⌘|cmd|vald\S*)\s*\+\s*["„“']?v\b|\b(paste|įklijuokite|iklijuokite|вставьте|wklej)\b/i;
  let pageWarned = false;
  function scanClickfix() {
    if (pageWarned || !isTop || !settings.enabled || isTrusted() || !document.body) return;
    const text = (document.body.innerText || '').slice(0, 30000);
    if (WIN_R.test(text) && PASTE.test(text)) { pageWarned = true; showOverlay('clickfixPage'); }
  }

  function onReady() {
    scanFields();
    scanClickfix();
    // Netikros CAPTCHA instrukcijos dažnai atsiranda tik paspaudus „Aš ne robotas“
    let n = 0;
    const mo = new MutationObserver(() => {
      if (++n > 200) { mo.disconnect(); return; }
      clearTimeout(mo.t);
      mo.t = setTimeout(() => { scanFields(); scanClickfix(); }, 400);
    });
    mo.observe(document.documentElement, { childList: true, subtree: true });
    setTimeout(() => mo.disconnect(), 60000);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', onReady, { once: true });
  else onReady();

  /* ---------- Perspėjimo langas ---------- */
  function showOverlay(kind) {
    if (overlayOpen) return;
    overlayOpen = true;
    const host = document.createElement('apsauga-guard');
    host.style.cssText = 'all:initial;position:fixed;inset:0;z-index:2147483647';
    const root = host.attachShadow({ mode: 'closed' });
    root.innerHTML = `
<style>
:host{all:initial}
.bg{position:fixed;inset:0;background:rgba(10,15,20,.82);display:grid;place-items:center;padding:16px;font-family:system-ui,-apple-system,"Segoe UI",Roboto,Arial,sans-serif}
.box{background:#fff;color:#16202B;max-width:520px;width:100%;border-radius:20px;padding:26px 22px;border:4px solid #B3202B;box-shadow:0 20px 60px rgba(0,0,0,.4)}
h1{margin:0 0 10px;font-size:26px;line-height:1.2;color:#B3202B;display:flex;gap:12px;align-items:center}
h1 svg{width:40px;height:40px;flex:none}
p{font-size:18px;line-height:1.5;margin:0 0 12px}
.host{font-family:ui-monospace,Menlo,Consolas,monospace;background:#F7DDDF;padding:2px 6px;border-radius:6px;word-break:break-all}
button{font:inherit;font-size:18px;font-weight:700;border-radius:14px;padding:14px 18px;min-height:54px;width:100%;margin-top:10px;cursor:pointer}
.leave{background:#1F4E6B;color:#fff;border:2px solid #1F4E6B}
.trust{background:transparent;color:#4A5866;border:2px solid #C6D2DA;font-weight:600;font-size:16px}
@media (prefers-color-scheme:dark){.box{background:#16232F;color:#E7EDF2}.host{background:#3B1D22}.trust{color:#A5B4C0;border-color:#2B3B49}}
</style>
<div class="bg" role="alertdialog" aria-modal="true" aria-labelledby="t" aria-describedby="d">
  <div class="box">
    <h1 id="t"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M8 2h8l6 6v8l-6 6H8l-6-6V8z"/><path d="M12 7v6M12 16.5v.5"/></svg><span></span></h1>
    <p id="d"></p>
    <p class="hostline"></p>
    <button class="leave"></button>
    <button class="trust"></button>
  </div>
</div>`;
    const isClip = kind === 'clickfix' || kind === 'clickfixPage';
    root.querySelector('h1 span').textContent = kind === 'clickfix' ? T.extClipTitle : kind === 'clickfixPage' ? T.verdict.danger : T.extPinTitle;
    root.querySelector('#d').textContent = kind === 'clickfix' ? T.extClipBody : kind === 'clickfixPage' ? T.extClickfixPage : (T.extPinBody[kind] || T.extPinBody.pin);
    const hl = root.querySelector('.hostline');
    const parts = T.extPinUnknown.split('{host}');
    hl.append(document.createTextNode(parts[0]));
    const hs = document.createElement('span');
    hs.className = 'host';
    hs.textContent = siteHost;
    hl.append(hs, document.createTextNode(parts[1] || ''));
    if (isClip) hl.hidden = true;
    const leave = root.querySelector('.leave');
    const trust = root.querySelector('.trust');
    leave.textContent = T.extPinLeave;
    trust.textContent = T.extPinTrust;

    const close = () => { host.remove(); overlayOpen = false; document.removeEventListener('keydown', onKey, true); };
    const onKey = (e) => { if (e.key === 'Escape') { e.preventDefault(); close(); } };
    document.addEventListener('keydown', onKey, true);
    leave.addEventListener('click', () => {
      close();
      if (history.length > 1) history.back();
      else location.href = 'about:blank';
    });
    trust.addEventListener('click', async () => {
      if (!window.confirm(I.fmt(T.extPinTrustConfirm, { host: siteHost }))) return;
      const r = await chrome.storage.local.get('trusted');
      const list = r.trusted || [];
      if (!list.includes(siteHost)) list.push(siteHost);
      await chrome.storage.local.set({ trusted: list });
      unlocked = true;
      close();
    });
    (document.body || document.documentElement).appendChild(host);
    leave.focus();
  }
})();
