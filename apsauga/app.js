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
    const hs = $('#helpSteps');
    hs.textContent = '';
    for (const [title, body] of T.helpSteps) {
      const li = document.createElement('li');
      const div = document.createElement('div');
      const b = document.createElement('b');
      b.textContent = title;
      div.append(b, document.createTextNode(body));
      li.append(div);
      hs.append(li);
    }
    renderFlags();
    renderCountries();
    renderLangButtons();
    for (const k of Object.keys(lastResults)) lastResults[k]();
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
    const share = el('button', 'btn ghost', T.share);
    share.addEventListener('click', () => shareResult(res));
    row.append(share);
    if (res.level !== 'ok') {
      const help = el('button', 'btn ghost', T.tabHelp);
      help.addEventListener('click', () => showTab('help', true));
      row.append(help);
    }
    box.append(row);
    if (res.level === 'danger' && navigator.vibrate && navigator.userActivation && navigator.userActivation.hasBeenActive) navigator.vibrate([80, 60, 80]);
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

  async function pasteInto(field) {
    try {
      const txt = await navigator.clipboard.readText();
      if (txt) { field.value = txt; return true; }
    } catch (e) { /* neleidžiama */ }
    toast(T.pasteDenied);
    field.focus();
    return false;
  }

  /* ---------- Žinutė ---------- */
  function checkMsg() {
    const home = $('#home').value || guessHome();
    const opts = { sender: $('#sender').value, homeCountryCode: CALLING[home] };
    const res = D.analyzeText($('#msg').value, opts);
    const run = () => render('#msgRes', res, linkList(res.urls));
    lastResults.msg = run;
    run();
  }
  function linkList(urls) {
    if (!urls || !urls.length) return null;
    const wrap = el('div');
    for (const u of urls) wrap.append(urlBox(u));
    return wrap;
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
  $('#msgPaste').addEventListener('click', async () => { if (await pasteInto($('#msg'))) checkMsg(); });
  $('#msgClear').addEventListener('click', () => { $('#msg').value = ''; $('#sender').value = ''; $('#msgRes').textContent = ''; delete lastResults.msg; $('#msg').focus(); });
  $('#msg').addEventListener('paste', () => setTimeout(checkMsg, 0));

  /* ---------- Nuoroda ---------- */
  function checkLink() {
    const val = $('#link').value.trim();
    if (!val) return;
    const res = D.analyzeUrl(val);
    const run = () => render('#linkRes', res, res.valid ? urlBox(res) : null);
    lastResults.link = run;
    run();
  }
  $('#linkCheck').addEventListener('click', checkLink);
  $('#link').addEventListener('keydown', (e) => { if (e.key === 'Enter') checkLink(); });
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

  /* ---------- Paleidimas ---------- */
  applyI18n();
  const params = new URLSearchParams(location.search);
  // „Bendrinti“ iš kitos programėlės (Android) arba nuoroda ?text=…
  const shared = [params.get('title'), params.get('text'), params.get('url')].filter(Boolean).join('\n');
  const fromHash = Object.keys(TAB_HASH).find((k) => TAB_HASH[k] === location.hash.slice(1));
  if (shared) {
    $('#msg').value = shared;
    showTab('msg');
    checkMsg();
    history.replaceState(null, '', location.pathname + '#zinute');
  } else {
    showTab(fromHash || 'msg');
  }
  window.addEventListener('hashchange', () => {
    const t = Object.keys(TAB_HASH).find((k) => TAB_HASH[k] === location.hash.slice(1));
    if (t) showTab(t);
  });

  if ('serviceWorker' in navigator && location.protocol === 'https:') {
    navigator.serviceWorker.register('sw.js').catch(() => { /* veiks ir be jo */ });
  }
})();
