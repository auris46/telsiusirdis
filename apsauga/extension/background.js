/* Apsauga – fono procesas: blokuoja pavojingas svetaines ir atnaujina sukčių sąrašus */
if (typeof importScripts === 'function' && typeof ScamDetector === 'undefined') {
  importScripts('shared/i18n.js', 'shared/detector.js');
}

// Vieši, nemokami sukčių svetainių sąrašai (atnaujinami kasdien / kas 12 val.)
const FEEDS = [
  'https://raw.githubusercontent.com/mitchellkrogza/Phishing.Database/master/phishing-domains-ACTIVE.txt',
  'https://raw.githubusercontent.com/openphish/public_feed/refs/heads/main/feed.txt'
];
const DEFAULT_SETTINGS = { enabled: true, strict: true, feed: true, rdap: true };
const BLOCK_MIN_SCORE = 60; // naršant blokuojame tik tikrai pavojingas (≥60) – kad netrukdytume be reikalo
const AGE_TTL = 7 * 864e5;

let feed = null;
let feedLoading = null;

function loadFeed() {
  if (feed) return Promise.resolve(feed);
  if (!feedLoading) {
    feedLoading = chrome.storage.local.get('feedText').then((r) => {
      feed = ScamDetector.buildFeed((r.feedText || '').split('\n'));
      return feed;
    });
  }
  return feedLoading;
}

async function updateFeed() {
  const lines = [];
  let ok = 0;
  for (const url of FEEDS) {
    try {
      const res = await fetch(url, { cache: 'no-store' });
      if (!res.ok) continue;
      const text = await res.text();
      for (const l of text.split('\n')) if (l.trim()) lines.push(l.trim());
      ok++;
    } catch (e) { /* vienas šaltinis nepasiekiamas – naudojame kitus */ }
  }
  if (!ok) throw new Error('feeds unavailable');
  feed = ScamDetector.buildFeed(lines);
  // Saugome jau išvalytą sąrašą: domenai + konkrečios nuorodos bendrinamuose serveriuose
  const stored = Array.from(feed.hosts).concat(Array.from(feed.urls).map((u) => 'https://' + u));
  const count = feed.hosts.size + feed.urls.size;
  await chrome.storage.local.set({ feedText: stored.join('\n'), feedCount: count, feedUpdated: Date.now() });
  return count;
}

// Domeno registracijos data per RDAP (WHOIS įpėdinis). Siunčiamas tik domeno pavadinimas.
async function domainAge(reg) {
  const r = await chrome.storage.local.get('ageCache');
  const cache = r.ageCache || {};
  const hit = cache[reg];
  if (hit && Date.now() - hit.ts < AGE_TTL) return hit.days;
  let days = null;
  try {
    const res = await fetch('https://rdap.org/domain/' + encodeURIComponent(reg), { credentials: 'omit' });
    if (res.ok) {
      const j = await res.json();
      const ev = (j.events || []).find((e) => e.eventAction === 'registration');
      const d = ev && new Date(ev.eventDate);
      if (d && !isNaN(d)) days = Math.max(0, Math.floor((Date.now() - d) / 864e5));
    }
  } catch (e) { /* registras nepasiekiamas */ }
  cache[reg] = { days, ts: Date.now() };
  const keys = Object.keys(cache);
  if (keys.length > 2000) for (const k of keys.slice(0, keys.length - 2000)) delete cache[k];
  await chrome.storage.local.set({ ageCache: cache });
  return days;
}

async function getState() {
  const r = await chrome.storage.local.get(['settings', 'trusted', 'blocked']);
  const s = await (chrome.storage.session ? chrome.storage.session.get('bypass') : Promise.resolve({}));
  return {
    settings: Object.assign({}, DEFAULT_SETTINGS, r.settings || {}),
    trusted: r.trusted || [],
    blocked: r.blocked || [],
    bypass: s.bypass || []
  };
}

function isPrivateHost(h) {
  return h === 'localhost' || h.endsWith('.local') || h.endsWith('.localhost') ||
    /^(10|127)\.\d+\.\d+\.\d+$/.test(h) || /^192\.168\.\d+\.\d+$/.test(h) || /^172\.(1[6-9]|2\d|3[01])\.\d+\.\d+$/.test(h) || h === '[::1]';
}

// Grąžina priežastį, jei svetainę reikia blokuoti, kitaip null
async function verdictFor(url) {
  let u;
  try { u = new URL(url); } catch (e) { return null; }
  if (!/^https?:$/.test(u.protocol)) return null;
  const host = u.hostname.toLowerCase();
  if (isPrivateHost(host)) return null;
  const st = await getState();
  if (!st.settings.enabled) return null;
  if (ScamDetector.inList(host, st.trusted) || st.bypass.includes(host)) return null;
  if (ScamDetector.inList(host, st.blocked)) return { reason: 'user', host };
  if (ScamDetector.officialBrand(host)) return null;
  if (st.settings.feed) {
    const f = await loadFeed();
    if (ScamDetector.matchFeed(u, f)) return { reason: 'feed', host };
  }
  const r = ScamDetector.analyzeUrl(url);
  if (r.level === 'danger' && r.score >= BLOCK_MIN_SCORE) return { reason: 'heuristic', host };
  return null;
}

async function onNav(d) {
  if (d.frameId !== 0) return;
  const v = await verdictFor(d.url);
  if (!v) return;
  const page = chrome.runtime.getURL('blocked.html') + '?u=' + encodeURIComponent(d.url) + '&r=' + v.reason;
  try { await chrome.tabs.update(d.tabId, { url: page }); } catch (e) { /* skirtukas uždarytas */ }
}
chrome.webNavigation.onBeforeNavigate.addListener(onNav);
// Galutinis adresas po peradresavimų (trumpintos nuorodos, „tracking“ grandinės)
chrome.webNavigation.onCommitted.addListener(onNav);

chrome.runtime.onInstalled.addListener(async () => {
  const r = await chrome.storage.local.get('settings');
  if (!r.settings) await chrome.storage.local.set({ settings: DEFAULT_SETTINGS, trusted: [], blocked: [] });
  chrome.alarms.create('feed', { periodInMinutes: 24 * 60, delayInMinutes: 1 });
});

chrome.alarms.onAlarm.addListener(async (a) => {
  if (a.name !== 'feed') return;
  const st = await getState();
  if (st.settings.feed) updateFeed().catch(() => { /* bandysime rytoj */ });
});

chrome.runtime.onMessage.addListener((msg, sender, reply) => {
  (async () => {
    if (msg.type === 'bypass') {
      const s = await chrome.storage.session.get('bypass');
      const list = s.bypass || [];
      if (!list.includes(msg.host)) list.push(msg.host);
      await chrome.storage.session.set({ bypass: list });
      await chrome.tabs.update(sender.tab.id, { url: msg.url });
      reply({ ok: true });
    } else if (msg.type === 'goSafe') {
      const isFirefox = typeof browser !== 'undefined' || navigator.userAgent.includes('Firefox');
      try {
        await chrome.tabs.update(sender.tab.id, { url: isFirefox ? 'about:home' : 'chrome://newtab/' });
      } catch (e) {
        await chrome.tabs.remove(sender.tab.id);
      }
      reply({ ok: true });
    } else if (msg.type === 'updateFeed') {
      try { reply({ ok: true, count: await updateFeed() }); } catch (e) { reply({ ok: false, error: String(e) }); }
    } else if (msg.type === 'domainAge') {
      const st = await getState();
      if (!st.settings.rdap || !msg.reg || ScamDetector.officialBrand(msg.reg)) { reply({ days: null }); return; }
      reply({ days: await domainAge(msg.reg) });
    } else if ((msg.type === 'showGuard' || msg.type === 'clickfix') && sender.tab) {
      // Laukelis iframe viduje – rodome perspėjimą viršutiniame puslapyje
      chrome.tabs.sendMessage(sender.tab.id, msg, { frameId: 0 }).catch(() => {});
      reply({ ok: true });
    } else {
      reply({ ok: false });
    }
  })();
  return true;
});
