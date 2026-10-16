/*
 * Apsauga – iškarpinės apsauga nuo „ClickFix“ (netikra CAPTCHA, „pataisykite klaidą“).
 * Veikia puslapio aplinkoje (MAIN world): jei svetainė bando įdėti į iškarpinę komandą,
 * kuri paleista Windows „Vykdyti“ lange ar terminale įdiegtų virusą, komanda pakeičiama
 * nekenksmingu įspėjimu, o apsaugos skriptui pranešama, kad parodytų perspėjimą.
 */
(function () {
  'use strict';
  if (window.__apsaugaClip) return;
  window.__apsaugaClip = true;

  const BAD = [
    /powershell|pwsh(\.exe)?\b/i,
    /\bmshta(\.exe)?\b/i,
    /\bcmd(\.exe)?\s*\/[ck]\b/i,
    /\b(iex|invoke-expression|invoke-webrequest|iwr|irm|invoke-restmethod|start-bitstransfer|downloadstring|frombase64string)\b/i,
    /\b(rundll32|regsvr32|certutil|bitsadmin|wscript|cscript|msiexec|conhost)(\.exe)?\b/i,
    /\b(curl|wget)\b[^\n|]*\|\s*(sudo\s+)?(ba|z|da)?sh\b/i,
    /\bosascript\b|\bbase64\s+(-d|--decode)\b.*\|\s*(ba|z)?sh/i,
    /-e(nc|ncodedcommand)?\s+[A-Za-z0-9+/=]{40,}/i,
    /https?:\/\/[^\s"']+\.(ps1|hta|vbs|bat|cmd|msi|exe)\b/i
  ];
  const WARNING = 'APSAUGA: pavojinga komanda sustabdyta. Nieko neįklijuokite. / Dangerous command blocked. Do not paste anything.';

  // Programuotojų svetainės, kuriose komandų kopijavimas yra įprastas
  const SAFE = /(^|\.)(github\.com|gitlab\.com|bitbucket\.org|stackoverflow\.com|stackexchange\.com|microsoft\.com|apple\.com|python\.org|npmjs\.com|brew\.sh|rust-lang\.org|docker\.com|kubernetes\.io|ubuntu\.com|debian\.org|archlinux\.org|mozilla\.org|google\.com|nodejs\.org)$/i;
  if (SAFE.test(location.hostname)) return;

  function isBad(text) {
    if (!text || typeof text !== 'string') return false;
    const t = text.slice(0, 20000);
    return BAD.some((re) => re.test(t));
  }
  // Apsaugos skriptas parodo perspėjimą (arba grąžina tekstą, jei svetainė pažymėta kaip patikima)
  function alarm(text) {
    try { document.dispatchEvent(new CustomEvent('apsauga:clickfix', { detail: String(text || '').slice(0, 20000) })); } catch (e) { /* - */ }
  }

  const clip = navigator.clipboard;
  if (clip && clip.writeText) {
    const orig = clip.writeText.bind(clip);
    clip.writeText = function (text) {
      if (isBad(text)) { alarm(text); return orig(WARNING); }
      return orig(text);
    };
  }
  if (clip && clip.write && window.ClipboardItem) {
    const origWrite = clip.write.bind(clip);
    clip.write = async function (items) {
      try {
        for (const item of items || []) {
          if (item.types && item.types.includes('text/plain')) {
            const blob = await item.getType('text/plain');
            const t = await blob.text();
            if (isBad(t)) {
              alarm(t);
              return origWrite([new ClipboardItem({ 'text/plain': new Blob([WARNING], { type: 'text/plain' }) })]);
            }
          }
        }
      } catch (e) { /* - */ }
      return origWrite(items);
    };
  }

  // document.execCommand('copy') ir įprastas kopijavimas: tikriname, kas dedama į iškarpinę
  window.addEventListener('copy', (e) => {
    let text = '';
    try { text = e.clipboardData && e.clipboardData.getData('text/plain'); } catch (err) { /* - */ }
    if (!text) {
      const a = document.activeElement;
      if (a && (a.tagName === 'TEXTAREA' || a.tagName === 'INPUT') && typeof a.value === 'string') {
        text = a.value.slice(a.selectionStart || 0, a.selectionEnd || a.value.length);
      } else {
        text = String(window.getSelection ? window.getSelection() : '');
      }
    }
    if (isBad(text)) {
      try { e.clipboardData.setData('text/plain', WARNING); } catch (err) { /* - */ }
      e.preventDefault();
      alarm(text);
    }
  }, false);
})();
