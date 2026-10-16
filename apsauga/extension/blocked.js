(function () {
  'use strict';
  const I = ApsaugaI18n;
  const D = ScamDetector;
  const lang = I.pickLang();
  const T = I.strings[lang];
  document.documentElement.lang = lang;

  const params = new URLSearchParams(location.search);
  const url = params.get('u') || '';
  const reason = params.get('r');
  let host = '';
  try { host = new URL(url).hostname; } catch (e) { /* - */ }

  document.getElementById('title').textContent = T.extBlockedTitle;
  document.getElementById('body').textContent = T.extBlockedBody;
  const addr = document.getElementById('addr');
  const reg = D.registrable(host);
  addr.append(document.createTextNode(host.slice(0, host.length - reg.length)));
  const b = document.createElement('b');
  b.textContent = reg;
  addr.append(b);

  const res = D.analyzeUrl(url);
  const sigs = res.signals.filter((s) => s.w > 0);
  if (reason === 'feed') sigs.unshift({ id: 'url_blocklisted', p: { host } });
  const ul = document.getElementById('reasons');
  for (const s of sigs.slice(0, 5)) {
    const li = document.createElement('li');
    li.textContent = I.signalText(lang, s);
    ul.append(li);
  }

  const back = document.getElementById('back');
  const cont = document.getElementById('cont');
  back.textContent = T.extBack;
  cont.textContent = T.extContinue;
  back.focus();
  back.addEventListener('click', () => chrome.runtime.sendMessage({ type: 'goSafe' }));
  cont.addEventListener('click', () => {
    if (!host || !confirm(T.extContinueConfirm)) return;
    chrome.runtime.sendMessage({ type: 'bypass', host, url });
  });
})();
