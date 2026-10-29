/* Apsauga – nuorodos ar pažymėto teksto patikra iš dešiniojo pelės klavišo meniu. Nuoroda neatidaroma. */
(async function () {
  'use strict';
  const I = ApsaugaI18n;
  const D = ScamDetector;
  const lang = I.pickLang();
  const T = I.strings[lang];
  const $ = (id) => document.getElementById(id);
  document.documentElement.lang = lang;

  // Naujausios sukčių schemų taisyklės (įdiegtos + atsisiųstos)
  await (async () => {
    try {
      const b = await (await fetch(chrome.runtime.getURL('shared/rules.json'))).json();
      D.addRules(b); I.addRuleTexts(b);
      const r = await chrome.storage.local.get('rulesJson');
      if (r.rulesJson) { D.addRules(r.rulesJson); I.addRuleTexts(r.rulesJson); }
    } catch (e) { /* - */ }
  })();
  const q = new URLSearchParams(location.search);
  const url = q.get('u');
  const text = q.get('t');
  let res;
  if (url) {
    let feed = null;
    try {
      const r = await chrome.storage.local.get(['feedText', 'settings']);
      if (!r.settings || r.settings.feed !== false) feed = D.buildFeed((r.feedText || '').split('\n'));
    } catch (e) { /* - */ }
    res = D.analyzeUrl(url, { feed });
    if (res.valid) {
      const addr = $('addr');
      const reg = res.registrable;
      addr.hidden = false;
      addr.append(document.createTextNode(T.linkWhere + ' ' + res.host.slice(0, res.host.length - reg.length)));
      const b = document.createElement('b');
      b.textContent = reg;
      addr.append(b);
    }
  } else {
    res = D.analyzeText(text || '');
  }
  const level = res.level === 'none' ? 'ok' : res.level;
  $('verdictBox').classList.add(level);
  $('verdict').textContent = T.verdict[level];
  $('sub').textContent = T.verdictSub[level];
  $('lblReasons').textContent = T.reasons;
  for (const s of res.signals.filter((x) => x.w !== 0).slice(0, 6)) {
    const li = document.createElement('li');
    li.textContent = I.signalText(lang, s);
    $('reasons').append(li);
  }
  if (!$('reasons').children.length) $('lblReasons').hidden = true;
  $('safe').textContent = T.safeNote;
  $('close').textContent = T.extCheckClose;
  $('close').addEventListener('click', () => window.close());
  $('close').focus();
})();
