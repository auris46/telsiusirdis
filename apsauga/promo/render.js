// Sukuria vaizdo kadrus iš promo.html. Naudojimas: node render.js <kadrų_aplankas> [fps] [laikai...]
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
(async () => {
  const out = process.argv[2];
  const fps = Number(process.argv[3] || 30);
  const only = process.argv.slice(4).map(Number);
  fs.mkdirSync(out, { recursive: true });
  const exe = fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined;
  const b = await chromium.launch({ executablePath: exe });
  const p = await b.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1 });
  await p.goto('file://' + path.join(__dirname, 'promo.html'));
  await p.evaluate(() => document.fonts.ready);
  await p.waitForTimeout(300);
  const dur = await p.evaluate(() => window.DURATION);
  const times = only.length ? only : Array.from({ length: Math.round(dur * fps) }, (_, i) => i / fps);
  let i = 0;
  for (const t of times) {
    await p.evaluate((x) => window.render(x), t);
    const name = only.length ? `t${String(t).replace('.', '_')}.png` : String(i).padStart(4, '0') + '.jpg';
    await p.screenshot({ path: path.join(out, name), type: only.length ? 'png' : 'jpeg', quality: only.length ? undefined : 92 });
    i++;
  }
  console.log('Kadrų:', times.length, '| šriftas:', await p.evaluate(() => document.fonts.check('800 40px "Atkinson Hyperlegible Next"')));
  await b.close();
})();
