/* Apsauga – tinklapio logika */
(function () {
  'use strict';
  const D = window.ScamDetector;
  const I = window.ApsaugaI18n;
  const $ = (s) => document.querySelector(s);

  const store = {
    get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* privatus režimas */ } }
  };

  let lang = I.pickLang(store.get('apsauga.lang'));
  let T = I.strings[lang];
  const lastResults = {}; // perpiešti pakeitus kalbą
  const CFG = window.APSAUGA_CONFIG || {};
  let lastChecked = { text: '' }; // paskutinis tikrintas tekstas – atsiliepimui, jei žmogus leidžia

  // Atsiliepimų forma (Google Forms ar kt.) – žr. config.js
  function openFeedback(params) {
    if (!CFG.feedbackUrl) return false;
    const vals = Object.assign({ type: 'feedback', correct: '', verdict: '', reasons: '', text: '', lang, version: CFG.version || '' }, params);
    const url = CFG.feedbackUrl.replace(/\{(\w+)\}/g, (_, k) => encodeURIComponent(String(vals[k] == null ? '' : vals[k]).slice(0, 1500)));
    const a = document.createElement('a');
    a.href = url;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    document.body.append(a);
    a.click();
    a.remove();
    return true;
  }

  /* ---------- Šalys ---------- */
  const CALLING = {
    LT: '370', LV: '371', EE: '372', PL: '48', DE: '49', GB: '44', IE: '353', FR: '33', ES: '34', IT: '39', NL: '31',
    BE: '32', SE: '46', NO: '47', FI: '358', DK: '45', UA: '380', AT: '43', CH: '41', CZ: '420', SK: '421', HU: '36',
    RO: '40', BG: '359', GR: '30', PT: '351', HR: '385', SI: '386', LU: '352', MT: '356', CY: '357', IS: '354',
    BY: '375', MD: '373', GE: '995', TR: '90', IL: '972', AE: '971', SA: '966', BR: '55', KZ: '7'
  };
  function guessHome() {
    const saved = store.get('apsauga.home');
    if (saved) return saved;
    for (const l of navigator.languages || [navigator.language]) {
      const m = /-([A-Z]{2})$/i.exec(l || '');
      if (m && D.ibanCountries.includes(m[1].toUpperCase())) return m[1].toUpperCase();
    }
    return lang === 'lt' ? 'LT' : '';
  }

  /* ---------- Vertimai ---------- */
  function get(path) {
    return path.split('.').reduce((o, k) => (o ? o[k] : undefined), T);
  }
  function applyI18n() {
    document.documentElement.lang = lang;
    document.querySelectorAll('[data-i18n]').forEach((el) => {
      const v = get(el.dataset.i18n);
      if (typeof v === 'string') el.textContent = v;
    });
    document.querySelectorAll('[data-i18n-ph]').forEach((el) => {
      el.placeholder = get(el.dataset.i18nPh) || '';
    });
    list('#extSteps', T.protExtSteps);
    list('#golden', T.protRules);
    list('#builtin', T.protBuiltin);
    titledList('#helpSteps', T.helpSteps);
    titledList('#howSteps', T.howSteps);
    $('#fontBtn').title = T.fontBigger;
    renderFlags();
    renderCountries();
    renderExamples();
    renderLangButtons();
    for (const k of Object.keys(lastResults)) lastResults[k]();
  }
  function titledList(sel, items) {
    const box = $(sel);
    box.textContent = '';
    for (const [title, body] of items) {
      const li = document.createElement('li');
      const div = document.createElement('div');
      const b = document.createElement('b');
      b.textContent = title;
      div.append(b, document.createTextNode(body));
      li.append(div);
      box.append(li);
    }
  }
  function list(sel, items) {
    const el = $(sel);
    el.textContent = '';
    for (const t of items) {
      const li = document.createElement('li');
      li.textContent = t;
      el.append(li);
    }
  }
  function renderLangButtons() {
    const box = $('#lang');
    box.textContent = '';
    for (const code of Object.keys(I.strings)) {
      const b = document.createElement('button');
      b.textContent = code.toUpperCase();
      b.title = I.strings[code].langName;
      b.setAttribute('aria-pressed', String(code === lang));
      b.addEventListener('click', () => { lang = code; T = I.strings[code]; store.set('apsauga.lang', code); applyI18n(); });
      box.append(b);
    }
  }
  function chips(sel, items, onPick) {
    const box = $(sel);
    box.textContent = '';
    items.forEach((it) => {
      const b = el('button', 'chip', it.label);
      b.type = 'button';
      b.addEventListener('click', () => onPick(it));
      box.append(b);
    });
  }
  function renderExamples() {
    chips('#msgExamples', T.examples, (ex) => { $('#msg').value = ex.text; $('#sender').value = ex.sender || ''; checkMsg(); });
    chips('#linkExamples', T.exampleLinks.map((u) => ({ label: u.replace(/^https:\/\//, ''), u })), (ex) => { $('#link').value = ex.u; linkAge = null; checkLink(); });
    chips('#ibanExamples', [{ label: T.exampleIban }], () => { $('#iban').value = T.exampleIban; $('#who').value = 'bank'; checkIban(); });
  }

  function renderFlags() {
    const box = $('#profFlags');
    const checked = new Set(Array.from(box.querySelectorAll('input:checked')).map((i) => i.value));
    box.textContent = '';
    for (const [id, text] of Object.entries(T.flags)) {
      const label = document.createElement('label');
      const cb = document.createElement('input');
      cb.type = 'checkbox';
      cb.value = id;
      cb.checked = checked.has(id);
      const span = document.createElement('span');
      span.textContent = text;
      label.append(cb, span);
      box.append(label);
    }
  }
  function renderCountries() {
    const sel = $('#home');
    const cur = sel.value || guessHome();
    let names = null;
    try { names = new Intl.DisplayNames([lang], { type: 'region' }); } catch (e) { /* senos naršyklės */ }
    const items = D.ibanCountries.map((c) => [c, names ? names.of(c) : c]).sort((a, b) => a[1].localeCompare(b[1], lang));
    sel.textContent = '';
    const blank = document.createElement('option');
    blank.value = '';
    blank.textContent = '—';
    sel.append(blank);
    for (const [c, n] of items) {
      const o = document.createElement('option');
      o.value = c;
      o.textContent = n;
      sel.append(o);
    }
    sel.value = cur;
  }

  /* ---------- Skirtukai ---------- */
  const TAB_HASH = { msg: 'zinute', link: 'nuoroda', iban: 'saskaita', prof: 'paskyra', prot: 'apsauga', help: 'pagalba' };
  function showTab(id, focus) {
    document.querySelectorAll('.tab').forEach((t) => t.setAttribute('aria-selected', String(t.dataset.tab === id)));
    document.querySelectorAll('[role=tabpanel]').forEach((p) => { p.hidden = p.id !== 'p-' + id; });
    if (location.hash.slice(1) !== TAB_HASH[id]) history.replaceState(null, '', '#' + TAB_HASH[id]);
    if (focus) {
      const panel = $('#p-' + id);
      const field = panel.querySelector('textarea,input');
      panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
      if (field && window.matchMedia('(pointer:fine)').matches) field.focus({ preventScroll: true });
    }
  }
  document.querySelectorAll('.tab').forEach((t) => t.addEventListener('click', () => showTab(t.dataset.tab, true)));

  /* ---------- Rezultato atvaizdavimas ---------- */
  const ICONS = {
    ok: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="m7.5 12.5 3 3 6-6.5"/></svg>',
    warn: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3 2 20h20z"/><path d="M12 10v4M12 17v.5"/></svg>',
    danger: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M8 2h8l6 6v8l-6 6H8l-6-6V8z"/><path d="M12 7v6M12 16.5v.5"/></svg>'
  };
  const LEVEL_COLOR = { ok: 'var(--moss)', warn: 'var(--amber)', danger: 'var(--pulse)' };

  function el(tag, cls, text) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  }

  function render(target, res, extra) {
    const box = $(target);
    box.textContent = '';
    if (!res || res.level === 'none') return;
    const v = el('div', 'verdict ' + res.level);
    v.innerHTML = ICONS[res.level];
    const txt = el('div');
    txt.append(el('h3', null, T.verdict[res.level]), el('p', null, T.verdictSub[res.level]));
    v.append(txt);
    box.append(v);

    const meter = el('div', 'meter');
    meter.setAttribute('role', 'img');
    meter.setAttribute('aria-label', res.score + ' / 100');
    const bar = el('i');
    bar.style.width = Math.max(4, res.score) + '%';
    bar.style.background = LEVEL_COLOR[res.level];
    meter.append(bar);
    box.append(meter);

    if (extra) box.append(extra);

    const sigs = res.signals.filter((s) => s.id !== 'iban_valid' || res.level === 'ok');
    if (sigs.length) {
      box.append(el('p', 'sub', T.reasons));
      const ul = el('ul', 'reasons');
      for (const s of sigs) {
        const cls = s.w < 0 ? 'good' : s.critical || s.w >= 40 ? 'hi' : s.w >= 15 ? 'mid' : '';
        ul.append(el('li', cls, I.signalText(lang, s)));
      }
      box.append(ul);
    }

    box.append(el('p', 'sub', T.doNow));
    const ol = el('ol', 'steps');
    for (const a of T.advice[res.level]) ol.append(el('li', null, a));
    box.append(ol);

    const row = el('div', 'row');
    if ('speechSynthesis' in window) {
      const speak = el('button', 'btn ghost', T.readAloud);
      speak.addEventListener('click', () => readAloud(res, speak));
      row.append(speak);
    }
    const share = el('button', 'btn ghost', T.share);
    share.addEventListener('click', () => shareResult(res));
    row.append(share);
    if (res.level !== 'ok') {
      const help = el('button', 'btn ghost', T.tabHelp);
      help.addEventListener('click', () => showTab('help', true));
      row.append(help);
    }
    box.append(row);

    if (CFG.feedbackUrl) {
      const fb = el('div', 'fb');
      fb.append(el('span', 'q', T.fbAsk));
      const yes = el('button', 'btn ghost', T.fbYes);
      const no = el('button', 'btn ghost', T.fbNo);
      const lab = el('label');
      const cb = document.createElement('input');
      cb.type = 'checkbox';
      lab.append(cb, document.createTextNode(T.fbIncludeText));
      const send = (correct) => {
        openFeedback({
          correct, verdict: res.level,
          reasons: res.signals.map((x) => x.id).join(','),
          text: cb.checked ? lastChecked.text : ''
        });
        toast(T.fbThanks);
      };
      yes.addEventListener('click', () => send('yes'));
      no.addEventListener('click', () => send('no'));
      fb.append(yes, no, lab);
      box.append(fb);
    }
    if (res.level === 'danger' && navigator.vibrate && navigator.userActivation && navigator.userActivation.hasBeenActive) navigator.vibrate([80, 60, 80]);
  }

  // Rezultato perskaitymas balsu – patogu prastai matantiems
  function readAloud(res, btn) {
    const synth = window.speechSynthesis;
    if (synth.speaking) { synth.cancel(); btn.textContent = T.readAloud; return; }
    const parts = [T.verdict[res.level], T.verdictSub[res.level]]
      .concat(res.signals.filter((s) => s.w > 0).slice(0, 3).map((s) => I.signalText(lang, s)))
      .concat(T.advice[res.level].slice(0, 2));
    const u = new SpeechSynthesisUtterance(parts.join('. ').replace(/[„“”"]/g, ''));
    u.lang = lang === 'lt' ? 'lt-LT' : 'en-GB';
    const v = synth.getVoices().find((x) => x.lang && x.lang.toLowerCase().startsWith(lang));
    if (v) u.voice = v;
    u.rate = 0.92;
    u.onend = u.onerror = () => { btn.textContent = T.readAloud; };
    btn.textContent = T.stopReading;
    synth.speak(u);
  }

  async function shareResult(res) {
    const lines = [I.fmt(T.shareText, { verdict: T.verdict[res.level] })]
      .concat(res.signals.filter((s) => s.w > 0).slice(0, 4).map((s) => '• ' + I.signalText(lang, s)));
    const text = lines.join('\n');
    try {
      if (navigator.share) { await navigator.share({ text, url: location.href.split('#')[0] }); return; }
    } catch (e) { if (e && e.name === 'AbortError') return; }
    try { await navigator.clipboard.writeText(text); toast(T.copied); } catch (e) { /* nepavyko */ }
  }

  function toast(msg) {
    const t = el('div', 'toast', msg);
    t.setAttribute('role', 'status');
    document.body.append(t);
    setTimeout(() => t.remove(), 2200);
  }

  async function pasteInto(field, allowImage) {
    try {
      const txt = await navigator.clipboard.readText();
      if (txt) { field.value = txt; return true; }
    } catch (e) { /* neleidžiama */ }
    // Iškarpinėje gali būti ekrano nuotrauka
    if (allowImage && navigator.clipboard && navigator.clipboard.read) {
      try {
        for (const item of await navigator.clipboard.read()) {
          const type = item.types.find((t) => t.startsWith('image/'));
          if (type) { handleImage(await item.getType(type)); return false; }
        }
      } catch (e) { /* neleidžiama */ }
    }
    toast(T.pasteDenied);
    field.focus();
    return false;
  }

  /* ---------- Žinutė ---------- */
  function checkMsg() {
    const home = $('#home').value || guessHome();
    const opts = { sender: $('#sender').value, homeCountryCode: CALLING[home] };
    const text = $('#msg').value;
    const res = D.analyzeText(text, opts);
    lastChecked = { text };
    // Banko sąskaita žinutėje (pvz. „pervesk į LT12 …“)
    const ibans = (text.toUpperCase().match(/\b[A-Z]{2}\d{2}(?:[ -]?[A-Z0-9]{4}){2,7}(?:[ -]?[A-Z0-9]{1,4})?\b/g) || [])
      .map((x) => D.analyzeIban(x)).filter((r) => r.info.country && D.ibanCountries.includes(r.info.country));
    const run = () => {
      const wrap = el('div');
      const links = linkList(res.urls);
      if (links) wrap.append(links);
      for (const r of ibans) {
        const box = el('div', 'iban-found');
        box.append(el('b', null, T.ibanFound + ' '), document.createTextNode(r.info.formatted + ' – ' +
          (r.info.bank ? r.info.bank + ', ' : '') + r.info.country + ', ' + (r.info.valid ? T.ibanOk : T.ibanBad)));
        wrap.append(box);
      }
      render('#msgRes', res, wrap.childNodes.length ? wrap : null);
    };
    lastResults.msg = run;
    run();
  }
  function linkList(urls) {
    if (!urls || !urls.length) return null;
    const wrap = el('div');
    for (const u of urls) wrap.append(urlBox(u));
    wrap.append(safeNote());
    return wrap;
  }
  function safeNote() {
    const p = el('p', 'safe');
    p.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" aria-hidden="true"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>';
    p.append(document.createTextNode(T.safeNote));
    return p;
  }
  function urlBox(u) {
    const box = el('div', 'urlbox');
    box.append(document.createTextNode(T.linkWhere + ' '));
    if (u.registrable) {
      const host = u.host;
      const reg = u.registrable;
      const pre = host.slice(0, host.length - reg.length);
      box.append(document.createTextNode(pre));
      const b = el('b', null, reg);
      if (u.level === 'ok') b.style.color = 'var(--moss)';
      box.append(b);
    } else {
      box.append(document.createTextNode(u.input));
    }
    return box;
  }
  $('#msgCheck').addEventListener('click', checkMsg);
  $('#msgPaste').addEventListener('click', async () => { if (await pasteInto($('#msg'), true)) { checkMsg(); showResult('#msgRes'); } });
  // Parodome rezultatą iškart – nereikia slinkti žemyn
  function showResult(sel) {
    const r = $(sel);
    if (!r.firstChild) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    r.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
  }

  /* ---------- Ekrano nuotrauka: QR kodas arba teksto skaitymas (OCR) ---------- */
  let ocrBusy = false;
  function ocrStatus(text, pct) {
    const box = $('#ocrStatus');
    box.hidden = !text;
    $('#ocrText').textContent = text || '';
    $('#ocrBar').style.width = (pct == null ? 4 : Math.max(4, pct)) + '%';
  }
  async function handleImage(file) {
    if (!file || ocrBusy) return;
    ocrBusy = true;
    showTab('msg');
    $('#msgRes').textContent = '';
    try {
      // 1) QR kodas nuotraukoje
      let qr = null;
      try { qr = await decodeQr(file); } catch (e) { qr = null; }
      if (qr) { toast(T.qrFound); routeQr(qr); showResult('#linkRes'); return; }
      // 2) Teksto skaitymas
      ocrStatus(T.ocrLoading, 4);
      const text = await window.ApsaugaOCR.read(file, (m) => {
        if (m.status === 'recognizing text') {
          const p = Math.round((m.progress || 0) * 100);
          ocrStatus(I.fmt(T.ocrReading, { p }), p);
        }
      }, D.tlds);
      if (!text) { ocrStatus(''); toast(T.ocrNone); return; }
      $('#msg').value = text;
      // Siuntėjo numeris ekrano viršuje (jei laukelis tuščias)
      const num = /^[^\n]{0,20}?(\+?\d[\d ]{7,16}\d)/m.exec(text.split('\n').slice(0, 2).join('\n'));
      if (num && !$('#sender').value) $('#sender').value = num[1].replace(/\s+/g, ' ');
      checkMsg();
      ocrStatus(T.ocrDone, 100);
      showResult('#msgRes');
    } catch (e) {
      ocrStatus('');
      toast(T.ocrFail);
    } finally {
      ocrBusy = false;
    }
  }
  $('#shotFile').addEventListener('change', (e) => {
    const f = e.target.files && e.target.files[0];
    e.target.value = '';
    if (f) handleImage(f);
  });
  // Ctrl+V su nuotrauka bet kurioje vietoje
  document.addEventListener('paste', (e) => {
    const files = Array.from((e.clipboardData && e.clipboardData.files) || []);
    const img = files.find((f) => f.type.startsWith('image/'));
    if (img) { e.preventDefault(); handleImage(img); }
  });
  // Nutempimas
  const drop = $('#drop');
  const panel = $('#p-msg');
  panel.addEventListener('dragover', (e) => { e.preventDefault(); drop.classList.add('over'); });
  panel.addEventListener('dragleave', (e) => { if (!panel.contains(e.relatedTarget)) drop.classList.remove('over'); });
  panel.addEventListener('drop', (e) => {
    e.preventDefault();
    drop.classList.remove('over');
    const dt = e.dataTransfer;
    const img = Array.from(dt.files || []).find((f) => f.type.startsWith('image/'));
    if (img) { handleImage(img); return; }
    const txt = dt.getData('text/plain');
    if (txt) { $('#msg').value = txt; checkMsg(); }
  });
  // Pirmas paspaudimas ant mygtuko – iš anksto paruošiame skaitymą
  $('#drop').addEventListener('pointerenter', () => window.ApsaugaOCR && window.ApsaugaOCR.warmUp(), { once: true });
  $('#msgClear').addEventListener('click', () => { $('#msg').value = ''; $('#sender').value = ''; $('#msgRes').textContent = ''; ocrStatus(''); delete lastResults.msg; $('#msg').focus(); });
  $('#msg').addEventListener('paste', () => setTimeout(checkMsg, 0));

  /* ---------- Nuoroda ---------- */
  let linkAge = null; // { reg, days, date } – gauta iš viešo registro tik vartotojui paprašius
  function checkLink() {
    const val = $('#link').value.trim();
    if (!val) return;
    let res = D.analyzeUrl(val);
    lastChecked = { text: val };
    if (linkAge && res.registrable !== linkAge.reg) linkAge = null;
    if (linkAge && linkAge.days != null) res = D.analyzeUrl(val, { domainAgeDays: linkAge.days });
    const run = () => {
      let extra = null;
      if (res.valid) { extra = el('div'); extra.append(urlBox(res), safeNote()); }
      render('#linkRes', res, extra);
      const canAge = res.valid && !res.official && /[a-z]/i.test(res.registrable || '') && !/^\d+(\.\d+){3}$/.test(res.host);
      $('#ageBox').hidden = !canAge;
      $('#ageRes').textContent = !linkAge ? '' : linkAge.days == null ? T.ageUnknown
        : I.fmt(T.ageResult, { date: linkAge.date.toLocaleDateString(lang), days: linkAge.days });
    };
    lastResults.link = run;
    run();
  }

  // Domeno amžius per RDAP (oficialus WHOIS įpėdinis). Siunčiamas tik domeno pavadinimas.
  async function checkAge() {
    const res = D.analyzeUrl($('#link').value.trim());
    if (!res.valid) return;
    $('#ageBtn').disabled = true;
    $('#ageRes').textContent = '…';
    let age = { reg: res.registrable, days: null, date: null };
    try {
      const r = await fetch('https://rdap.org/domain/' + encodeURIComponent(res.registrable), { referrerPolicy: 'no-referrer', credentials: 'omit' });
      if (r.ok) {
        const j = await r.json();
        const ev = (j.events || []).find((e) => e.eventAction === 'registration');
        if (ev && ev.eventDate) {
          const d = new Date(ev.eventDate);
          if (!isNaN(d)) age = { reg: res.registrable, date: d, days: Math.max(0, Math.floor((Date.now() - d) / 864e5)) };
        }
      }
    } catch (e) { /* registras nepasiekiamas */ }
    linkAge = age;
    $('#ageBtn').disabled = false;
    checkLink();
  }
  $('#ageBtn').addEventListener('click', checkAge);

  /* ---------- QR kodas (nuotrauka) ---------- */
  function loadJsQR() {
    if (window.jsQR) return Promise.resolve(window.jsQR);
    return new Promise((ok, fail) => {
      const sc = document.createElement('script');
      sc.src = 'vendor/jsQR.js';
      sc.onload = () => ok(window.jsQR);
      sc.onerror = fail;
      document.head.append(sc);
    });
  }
  async function decodeQr(file) {
    const bmp = await createImageBitmap(file);
    if ('BarcodeDetector' in window) {
      try {
        const det = new window.BarcodeDetector({ formats: ['qr_code'] });
        const codes = await det.detect(bmp);
        if (codes.length) return codes[0].rawValue;
      } catch (e) { /* naudosime jsQR */ }
    }
    const jsQR = await loadJsQR();
    const scale = Math.min(1, 1280 / Math.max(bmp.width, bmp.height));
    const c = document.createElement('canvas');
    c.width = Math.round(bmp.width * scale);
    c.height = Math.round(bmp.height * scale);
    const ctx = c.getContext('2d', { willReadFrequently: true });
    ctx.drawImage(bmp, 0, 0, c.width, c.height);
    const img = ctx.getImageData(0, 0, c.width, c.height);
    const code = jsQR(img.data, img.width, img.height, { inversionAttempts: 'attemptBoth' });
    return code ? code.data : null;
  }
  $('#qrFile').addEventListener('change', async (e) => {
    const file = e.target.files && e.target.files[0];
    e.target.value = '';
    if (!file) return;
    let data = null;
    try { data = await decodeQr(file); } catch (err) { data = null; }
    if (!data) { toast(T.qrNone); return; }
    routeQr(data);
  });
  function routeQr(data) {
    if (/^(https?:\/\/|www\.)/i.test(data.trim()) || /^[a-z0-9.-]+\.[a-z]{2,}(\/|$)/i.test(data.trim())) {
      $('#link').value = data.trim();
      linkAge = null;
      showTab('link');
      checkLink();
    } else {
      // Ne nuoroda (pvz. SMS, tekstas, mokėjimo duomenys) – tikriname kaip žinutę
      $('#msg').value = T.qrText + '\n' + data;
      showTab('msg', true);
      checkMsg();
    }
  }
  $('#linkCheck').addEventListener('click', checkLink);
  $('#link').addEventListener('keydown', (e) => { if (e.key === 'Enter') checkLink(); });
  $('#link').addEventListener('input', () => { linkAge = null; });
  $('#link').addEventListener('paste', () => setTimeout(checkLink, 0));
  $('#linkPaste').addEventListener('click', async () => { if (await pasteInto($('#link'))) checkLink(); });

  /* ---------- IBAN ---------- */
  function checkIban() {
    if (!$('#iban').value.trim()) return;
    const home = $('#home').value;
    if (home) store.set('apsauga.home', home);
    const res = D.analyzeIban($('#iban').value, { who: $('#who').value, homeCountry: home });
    const run = () => {
      const dl = el('dl', 'kv');
      let names = null;
      try { names = new Intl.DisplayNames([lang], { type: 'region' }); } catch (e) { /* - */ }
      const rows = [[T.ibanFormatted, res.info.formatted]];
      if (res.info.country) rows.push([T.ibanCountry, (names ? names.of(res.info.country) : res.info.country) + ' (' + res.info.country + ')']);
      if (res.info.country) rows.push([T.ibanBank, res.info.bank || T.ibanBankUnknown]);
      for (const [k, v] of rows) dl.append(el('dt', null, k), el('dd', null, v));
      const wrap = el('div');
      wrap.append(dl, el('p', 'note', T.ibanNote));
      render('#ibanRes', res, wrap);
    };
    lastResults.iban = run;
    run();
  }
  $('#ibanCheck').addEventListener('click', checkIban);
  $('#iban').addEventListener('keydown', (e) => { if (e.key === 'Enter') checkIban(); });

  /* ---------- Profilis ---------- */
  function checkProfile() {
    const flags = Array.from(document.querySelectorAll('#profFlags input:checked')).map((i) => i.value);
    const name = $('#profName').value;
    const text = $('#profText').value;
    if (!flags.length && !name.trim() && !text.trim()) return;
    const res = D.analyzeProfile({ flags, name, text });
    const run = () => render('#profRes', res, linkList(res.urls));
    lastResults.prof = run;
    run();
  }
  $('#profCheck').addEventListener('click', checkProfile);

  /* ---------- Apsauga ---------- */
  $('#dnsHost').addEventListener('click', async () => {
    try { await navigator.clipboard.writeText('dns.quad9.net'); toast(T.copied); } catch (e) { /* - */ }
  });
  let deferredPrompt = null;
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    $('#installCard').hidden = false;
  });
  $('#installBtn').addEventListener('click', async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    deferredPrompt = null;
    $('#installCard').hidden = true;
  });

  // Plėtinio archyvas yra tik viešoje (GitHub Pages) versijoje – kitur mygtuką slepiame
  fetch('apsauga-extension.zip', { method: 'HEAD' })
    .then((r) => { if (!r.ok) $('#extZip').hidden = true; })
    .catch(() => { $('#extZip').hidden = true; });

  /* ---------- Pranešimas apie sukčius ---------- */
  $('#reportCard').hidden = !CFG.feedbackUrl;
  $('#reportBtn').addEventListener('click', () => {
    openFeedback({ type: 'report', text: lastChecked.text || $('#msg').value });
    toast(T.fbThanks);
  });

  /* ---------- Didesnis šriftas ---------- */
  function setBig(on) {
    if (on) document.documentElement.setAttribute('data-size', 'big');
    else document.documentElement.removeAttribute('data-size');
    $('#fontBtn').setAttribute('aria-pressed', String(on));
    store.set('apsauga.big', on ? '1' : '');
  }
  $('#fontBtn').addEventListener('click', () => setBig(!document.documentElement.hasAttribute('data-size')));
  setBig(store.get('apsauga.big') === '1');

  /* ---------- Paleidimas ---------- */
  applyI18n();
  const params = new URLSearchParams(location.search);
  // „Bendrinti“ iš kitos programėlės (Android) arba nuoroda ?text=…
  const shared = [params.get('title'), params.get('text'), params.get('url')].filter(Boolean).join('\n');
  const fromHash = Object.keys(TAB_HASH).find((k) => TAB_HASH[k] === location.hash.slice(1));
  if (params.get('image') && 'caches' in window) {
    // Android: ekrano nuotrauka pasidalinta su „Apsauga“ (ją išsaugojo sw.js)
    showTab('msg');
    history.replaceState(null, '', location.pathname + '#zinute');
    caches.open('apsauga-share').then(async (c) => {
      const r = await c.match('shared-image');
      await c.delete('shared-image');
      if (r) handleImage(await r.blob());
    }).catch(() => {});
  } else if (shared) {
    $('#msg').value = shared;
    showTab('msg');
    checkMsg();
    history.replaceState(null, '', location.pathname + '#zinute');
  } else {
    showTab(fromHash || 'msg');
    // Peržiūros versijoje iškart parodome pavyzdinį rezultatą
    if (window.APSAUGA_DEMO && !fromHash) { $('#msg').value = T.examples[0].text; $('#sender').value = T.examples[0].sender; checkMsg(); }
  }
  window.addEventListener('hashchange', () => {
    const t = Object.keys(TAB_HASH).find((k) => TAB_HASH[k] === location.hash.slice(1));
    if (t) showTab(t);
  });

  if ('serviceWorker' in navigator && location.protocol === 'https:') {
    navigator.serviceWorker.register('sw.js').catch(() => { /* veiks ir be jo */ });
  }
})();
