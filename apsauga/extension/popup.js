(async function () {
  'use strict';
  const I = ApsaugaI18n;
  const D = ScamDetector;
  const lang = I.pickLang();
  const T = I.strings[lang];
  const $ = (id) => document.getElementById(id);
  document.documentElement.lang = lang;

  $('siteLbl').textContent = T.extPopupSite;
  $('lblEnabled').textContent = T.extPopupProtection;
  $('lblStrict').textContent = T.extPopupStrict;
  $('lblFeed').textContent = T.extPopupFeed;
  $('lblRdap').textContent = T.extPopupRdap;
  $('feedUpdate').textContent = T.extPopupUpdate;
  $('lblCheck').textContent = T.extPopupCheck;
  $('lblTrusted').textContent = T.extPopupTrusted;
  $('lblBlocked').textContent = T.extPopupBlocked;

  const defaults = { enabled: true, strict: true, feed: true, rdap: true };
  let st = await chrome.storage.local.get(['settings', 'trusted', 'blocked', 'feedCount', 'feedUpdated']);
  let settings = Object.assign({}, defaults, st.settings || {});
  let trusted = st.trusted || [];
  let blocked = st.blocked || [];

  for (const k of ['enabled', 'strict', 'feed', 'rdap']) {
    $(k).checked = !!settings[k];
    $(k).addEventListener('change', async () => {
      settings[k] = $(k).checked;
      await chrome.storage.local.set({ settings });
      if (k === 'feed' && settings.feed && !st.feedUpdated) updateFeed();
    });
  }

  function feedInfo() {
    $('feedInfo').textContent = st.feedUpdated
      ? I.fmt(T.extPopupFeedInfo, { n: (st.feedCount || 0).toLocaleString(lang), date: new Date(st.feedUpdated).toLocaleDateString(lang) })
      : T.extPopupFeedNever;
  }
  async function updateFeed() {
    $('feedUpdate').disabled = true;
    $('feedInfo').textContent = '…';
    const r = await chrome.runtime.sendMessage({ type: 'updateFeed' });
    st = Object.assign(st, await chrome.storage.local.get(['feedCount', 'feedUpdated']));
    feedInfo();
    if (r && !r.ok) $('feedInfo').textContent += ' (' + r.error + ')';
    $('feedUpdate').disabled = false;
  }
  $('feedUpdate').addEventListener('click', updateFeed);
  feedInfo();

  /* Dabartinė svetainė */
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  let host = '';
  try {
    const u = new URL(tab.url);
    if (/^https?:$/.test(u.protocol)) host = u.hostname.toLowerCase();
  } catch (e) { /* - */ }

  function renderSite() {
    const box = $('site');
    box.className = 'site';
    $('siteReasons').textContent = '';
    if (!host) { $('siteHost').textContent = '—'; $('siteVerdict').textContent = ''; $('blockBtn').hidden = true; return; }
    $('siteHost').textContent = host;
    const official = D.officialBrand(host);
    const isTrusted = D.inList(host, trusted);
    const isBlocked = D.inList(host, blocked);
    let level, verdict;
    if (isBlocked) { level = 'danger'; verdict = T.extBlockedTitle; }
    else if (official) { level = 'ok'; verdict = I.fmt(T.extPopupOfficial, { brand: official }); }
    else if (isTrusted) { level = 'ok'; verdict = T.extPopupTrustedSite; }
    else {
      const r = D.analyzeUrl(tab.url);
      level = r.level;
      verdict = T.verdict[r.level];
      for (const s of r.signals.filter((x) => x.w > 0).slice(0, 3)) {
        const li = document.createElement('li');
        li.textContent = I.signalText(lang, s);
        $('siteReasons').append(li);
      }
    }
    box.classList.add(level);
    $('siteVerdict').textContent = verdict;
    $('blockBtn').hidden = !!official;
    $('blockBtn').textContent = isBlocked ? T.extPopupUnblockSite : T.extPopupBlockSite;
  }
  $('blockBtn').addEventListener('click', async () => {
    const reg = D.registrable(host);
    if (D.inList(host, blocked)) blocked = blocked.filter((h) => !(host === h || host.endsWith('.' + h)));
    else { blocked.push(reg); trusted = trusted.filter((h) => h !== host && h !== reg); }
    await chrome.storage.local.set({ blocked, trusted });
    renderSite(); renderLists();
    if (D.inList(host, blocked)) chrome.tabs.reload(tab.id);
  });

  function renderList(id, items, onRemove) {
    const ul = $(id);
    ul.textContent = '';
    if (!items.length) { const li = document.createElement('li'); li.className = 'muted'; li.textContent = T.extPopupNone; ul.append(li); return; }
    for (const h of items) {
      const li = document.createElement('li');
      const s = document.createElement('span');
      s.textContent = h;
      const b = document.createElement('button');
      b.className = 'btn ghost small';
      b.textContent = T.extPopupRemove;
      b.addEventListener('click', () => onRemove(h));
      li.append(s, b);
      ul.append(li);
    }
  }
  function renderLists() {
    renderList('trusted', trusted, async (h) => { trusted = trusted.filter((x) => x !== h); await chrome.storage.local.set({ trusted }); renderLists(); renderSite(); });
    renderList('blocked', blocked, async (h) => { blocked = blocked.filter((x) => x !== h); await chrome.storage.local.set({ blocked }); renderLists(); renderSite(); });
  }

  /* Greitas žinutės tikrinimas */
  $('text').addEventListener('input', () => {
    const r = D.analyzeText($('text').value);
    const box = $('textRes');
    box.textContent = '';
    if (r.level === 'none') return;
    const div = document.createElement('div');
    div.className = 'site ' + r.level;
    div.style.marginTop = '8px';
    const v = document.createElement('div');
    v.className = 'v';
    v.textContent = T.verdict[r.level];
    const ul = document.createElement('ul');
    for (const s of r.signals.filter((x) => x.w > 0).slice(0, 4)) {
      const li = document.createElement('li');
      li.textContent = I.signalText(lang, s);
      ul.append(li);
    }
    div.append(v, ul);
    box.append(div);
  });

  renderSite();
  renderLists();
})();
