/*
 * Apsauga – sukčių svetainių duomenų bazės paieška (privati).
 * Adreso SHA-256 „pirštų atspaudas“ apskaičiuojamas įrenginyje; atsisiunčiamas tik vienas iš
 * 4096 failų (pagal pirmus 3 simbolius), o palyginimas vyksta čia pat.
 */
(function () {
  'use strict';
  const BASE = new URL('db/', document.baseURI).href;
  const buckets = new Map();
  let metaPromise = null;

  async function sha(key) {
    const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(key));
    return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, '0')).join('');
  }

  function meta() {
    if (!metaPromise) {
      metaPromise = fetch(BASE + 'meta.json', { cache: 'no-cache' })
        .then((r) => (r.ok ? r.json() : null))
        .catch(() => null);
    }
    return metaPromise;
  }

  function bucket(prefix) {
    if (!buckets.has(prefix)) {
      buckets.set(prefix, fetch(BASE + prefix + '.txt')
        .then((r) => (r.ok ? r.text() : ''))
        .then((t) => new Set(t.split('\n').filter(Boolean)))
        .catch(() => new Set()));
    }
    return buckets.get(prefix);
  }

  // Grąžina true, jei adresas (ar jo pagrindinis domenas) yra sukčių sąraše
  async function check(url, D) {
    if (!window.crypto || !crypto.subtle) return false;
    const m = await meta();
    if (!m) return false;
    for (const key of D.feedKeys(url)) {
      const h = (await sha(key)).slice(0, m.hashLength || 16);
      const set = await bucket(h.slice(0, m.prefix || 3));
      if (set.has(h)) return true;
    }
    return false;
  }

  window.ApsaugaThreatDB = { check, meta };
})();
