/*
 * Apsauga – teksto skaitymas iš ekrano nuotraukos (OCR).
 * Veikia tik įrenginyje: Tesseract (Apache-2.0) ir lietuvių / anglų kalbų modeliai
 * įkeliami iš šios svetainės, nuotrauka niekur nesiunčiama. Kraunama tik prireikus.
 */
(function () {
  'use strict';
  const BASE = new URL('vendor/tesseract/', document.baseURI).href;
  let workerPromise = null;
  let progressCb = null;

  function loadScript(src) {
    return new Promise((ok, fail) => {
      if (window.Tesseract) return ok();
      const s = document.createElement('script');
      s.src = src;
      s.onload = ok;
      s.onerror = () => fail(new Error('load'));
      document.head.append(s);
    });
  }

  function getWorker() {
    if (!workerPromise) {
      workerPromise = loadScript(BASE + 'tesseract.min.js').then(() =>
        window.Tesseract.createWorker(['lit', 'eng'], 1, {
          workerPath: BASE + 'worker.min.js',
          corePath: BASE + 'core/',
          langPath: BASE + 'lang',
          gzip: true,
          workerBlobURL: false,
          logger: (m) => { if (progressCb) progressCb(m); }
        })
      ).catch((e) => { workerPromise = null; throw e; });
    }
    return workerPromise;
  }

  // Paruošia nuotrauką: padidina mažas, tamsų foną (naktinis režimas) paverčia šviesiu
  async function prepare(file) {
    const bmp = await createImageBitmap(file);
    const scale = Math.max(1, Math.min(2.5, 1400 / bmp.width));
    const w = Math.round(bmp.width * scale);
    const h = Math.round(bmp.height * scale);
    const c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    const ctx = c.getContext('2d', { willReadFrequently: true });
    ctx.drawImage(bmp, 0, 0, w, h);
    const img = ctx.getImageData(0, 0, w, h);
    const d = img.data;
    let sum = 0;
    for (let i = 0; i < d.length; i += 4) {
      const g = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
      d[i] = d[i + 1] = d[i + 2] = g;
      sum += g;
    }
    if (sum / (d.length / 4) < 110) {
      for (let i = 0; i < d.length; i += 4) d[i] = d[i + 1] = d[i + 2] = 255 - d[i];
    }
    ctx.putImageData(img, 0, 0);
    return c;
  }

  // Dažnos OCR klaidos nuorodose: „https: //“, „bauda. top“, „dpd -lt.com“
  function cleanup(text, tlds) {
    let t = String(text || '').replace(/\r/g, '');
    t = t.replace(/\b(https?)\s*:\s*\/\s*\/\s*/gi, '$1://');
    t = t.replace(/\bwww\s*\.\s*/gi, 'www.');
    if (tlds && tlds.length) {
      const re = new RegExp('([a-z0-9-])\\s*\\.\\s+(' + tlds.join('|') + ')\\b', 'gi');
      t = t.replace(re, '$1.$2');
    }
    t = t.replace(/([a-z0-9])\s+-\s*([a-z0-9]+\.[a-z]{2,})/gi, '$1-$2');
    // Nuoroda perkelta į kitą eilutę: „dpd-⏎lt.delivery…“, „https://site.⏎top/x“
    t = t.replace(/([a-z0-9]-)[ \t]*\n[ \t]*(?=[a-z0-9]+[.-])/gi, '$1');
    t = t.replace(/((?:https?:\/\/|www\.)\S*[./])[ \t]*\n[ \t]*(?=[a-z0-9])/gi, '$1');
    // Adresuose OCR dažnai painioja „I“ ir „l“ (dpd-It.com → dpd-lt.com)
    t = t.replace(/\b(?:https?:\/\/)?[a-z0-9I-]+(?:\.[a-z0-9I-]+)+\b/g, (m) => (/[A-HJ-Z]/.test(m) ? m : m.replace(/I/g, 'l')));
    t = t.replace(/[ \t]+\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim();
    return t;
  }

  async function read(file, onProgress, tlds) {
    progressCb = onProgress || null;
    const [worker, canvas] = await Promise.all([getWorker(), prepare(file)]);
    const { data } = await worker.recognize(canvas);
    progressCb = null;
    return cleanup(data && data.text, tlds);
  }

  window.ApsaugaOCR = { read, cleanup, warmUp: () => getWorker().catch(() => {}) };
})();
