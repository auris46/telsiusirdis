/* Apsauga – fono procesas: blokuoja pavojingas svetaines ir atnaujina sukčių sąrašą */
if (typeof importScripts === 'function' && typeof ScamDetector === 'undefined') {
  importScripts('shared/i18n.js', 'shared/detector.js');
}

const FEED_URL = 'https://raw.githubusercontent.com/mitchellkrogza/Phishing.Database/master/phishing-domains-ACTIVE.txt';
const DEFAULT_SETTINGS = { enabled: true, strict: true, feed: true };
const BLOCK_MIN_SCORE = 60; // naršant blokuojame tik tikrai pavojingas (≥60) – kad netrukdytume be reikalo

let feedSet = null;
let feedLoading = null;

function loadFeed() {
  if (feedSet) return Promise.resolve(feedSet);
  if (!feedLoading) {
    feedLoading = chrome.storage.local.get('feedText').then((r) => {
      feedSet = new Set((r.feedText || '').split('\n').filter(Boolean));
      return feedSet;
    });
  }
  return feedLoading;
}

async function updateFeed() {
  const res = await fetch(FEED_URL, { cache: 'no-store' });
  if (!res.ok) throw new Error('HTTP ' + res.status);
  const text = await res.text();
  const hosts = [];
  for (let line of text.split('\n')) {
    line = line.trim().toLowerCase();
    if (!line || line.startsWith('#') || !/^[a-z0-9.-]+\.[a-z0-9-]{2,}$/.test(line)) continue;
    if (ScamDetector.officialBrand(line)) continue; // niekada neblokuoti oficialių domenų
    hosts.push(line);
  }
  feedSet = new Set(hosts);
  await chrome.storage.local.set({ feedText: hosts.join('\n'), feedCount: hosts.length, feedUpdated: Date.now() });
  return hosts.length;
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
    const feed = await loadFeed();
    if (ScamDetector.inList(host, feed)) return { reason: 'feed', host };
  }
  const r = ScamDetector.analyzeUrl(url);
  if (r.level === 'danger' && r.score >= BLOCK_MIN_SCORE) return { reason: 'heuristic', host };
  return null;
}

chrome.webNavigation.onBeforeNavigate.addListener(async (d) => {
  if (d.frameId !== 0) return;
  const v = await verdictFor(d.url);
  if (!v) return;
  const page = chrome.runtime.getURL('blocked.html') + '?u=' + encodeURIComponent(d.url) + '&r=' + v.reason;
  try { await chrome.tabs.update(d.tabId, { url: page }); } catch (e) { /* skirtukas uždarytas */ }
});

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
    } else if (msg.type === 'showGuard' && sender.tab) {
      // Laukelis iframe viduje – rodome perspėjimą viršutiniame puslapyje
      chrome.tabs.sendMessage(sender.tab.id, msg, { frameId: 0 }).catch(() => {});
      reply({ ok: true });
    } else {
      reply({ ok: false });
    }
  })();
  return true;
});
