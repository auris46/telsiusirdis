// Paleisti: node --test apsauga/tests/
const test = require('node:test');
const assert = require('node:assert');
const D = require('../extension/shared/detector.js');
const I18N = require('../extension/shared/i18n.js');

const level = (r) => r.level;

test('tipinės sukčių SMS žinutės – pavojingos', () => {
  const scams = [
    'Regitra: Jūsų transporto priemonei skirta nesumokėta bauda 12,50 EUR. Sumokėkite per 24 val.: https://regitra-baudos.top/lt',
    'DPD: Jūsų siunta sulaikyta sandėlyje, adresas neišsamus. Patikslinkite adresą: dpd-lt.delivery-help.online',
    'Swedbank: jūsų sąskaita bus užblokuota. Patvirtinkite tapatybę: http://swedbank-lt.secure-login.xyz',
    'Labas mama, čia mano naujas numeris, telefonas sudužo. Gal gali skubiai pervesti 450 eur? Parašyk WhatsApp',
    'Your package is held at our depot due to an incomplete address. Pay a small fee of £1.45: https://royalmail-redelivery.com',
    'Sveiki, skambinu iš banko saugumo tarnybos. Įtartina operacija – perveskite pinigus į saugią sąskaitą.',
    'Pasakykite Smart-ID kodą, kurį matote ekrane, kad atšauktume operaciją.',
    'Įdiekite AnyDesk, padėsime grąžinti pinigus.',
    'USPS: Your parcel could not be delivered. Update your details: http://usps.com.tracking-update.icu',
    'VMI: jums priklauso mokesčių permoka 187,20 EUR. Gaukite grąžinimą: bit.ly/3vmi',
    'Paypal: unusual sign-in. Verify your account now: https://paypa1-secure.com/login',
    'Investuok 250 eur ir gauk garantuotą pelną kasdien! Rašyk Telegram'
  ];
  for (const s of scams) {
    const r = D.analyzeText(s);
    assert.strictEqual(level(r), 'danger', s + '\n→ ' + JSON.stringify(r.signals.map(x => x.id)));
  }
});

test('įprastos žinutės – nepavojingos', () => {
  const ok = [
    'Labas, ar susitinkam rytoj 18 val. prie Telšių katedros?',
    'Jūsų Bolt kelionė baigta. Ačiū!',
    'Swedbank: Niekam nesakykite savo PIN ir Smart-ID kodų. Banko darbuotojai jų niekada neprašo.',
    'Primename: rytoj 9:00 vizitas pas gydytoją. Informacija www.esveikata.lt',
    'Your Google verification is complete. See https://myaccount.google.com'
  ];
  for (const s of ok) {
    const r = D.analyzeText(s);
    assert.notStrictEqual(level(r), 'danger', s + '\n→ ' + JSON.stringify(r.signals.map(x => x.id)));
  }
});

test('nuorodos', () => {
  assert.strictEqual(D.analyzeUrl('https://www.swedbank.lt/private').level, 'ok');
  assert.strictEqual(D.analyzeUrl('https://ib.seb.lt').level, 'ok');
  assert.strictEqual(D.analyzeUrl('https://www.wikipedia.org').level, 'ok');
  assert.strictEqual(D.analyzeUrl('swedbank.lt.login-secure.top').level, 'danger');
  assert.strictEqual(D.analyzeUrl('http://192.168.12.4/bank').level, 'danger');
  assert.strictEqual(D.analyzeUrl('https://xn--pypal-4ve.com').level, 'danger');
  assert.strictEqual(D.analyzeUrl('https://www.paypal.com@evil.example.com').level, 'danger');
  assert.strictEqual(D.analyzeUrl('https://rnicrosoft-support.com').level, 'danger');
  assert.strictEqual(D.analyzeUrl('https://luminorr.com').level, 'danger');
  assert.strictEqual(D.analyzeUrl('https://seb.lt.secure.example').level, 'danger');
  assert.strictEqual(D.analyzeUrl('https://evil.example', { blocklist: new Set(['evil.example']) }).level, 'danger');
});

test('nuorodų ištraukimas', () => {
  const u = D.extractUrls('Spauskite dpd-lt.top/x arba https://a.b.com/y. Rašykite info@seb.lt. Kaina 5.00 val.Jūsų');
  assert.deepStrictEqual(u, ['dpd-lt.top/x', 'https://a.b.com/y']);
});

test('IBAN', () => {
  const ok = D.analyzeIban('LT12 1000 0111 0100 1000');
  assert.strictEqual(ok.info.valid, true);
  const sw = D.analyzeIban('LT60 7300 0101 2345 6789');
  assert.strictEqual(sw.info.bank, 'Swedbank');
  assert.strictEqual(D.analyzeIban('LT12 1000 0111 0100 1001').info.valid, false);
  assert.strictEqual(D.analyzeIban('DE89370400440532013000').info.valid, true);
  assert.strictEqual(D.analyzeIban('LT121000011101001000', { who: 'bank' }).level, 'danger');
  assert.strictEqual(D.analyzeIban('DE89370400440532013000', { who: 'gov', homeCountry: 'LT' }).level, 'danger');
});

test('profilis', () => {
  assert.strictEqual(D.analyzeProfile({ name: 'Swedbank_Support_LT' }).level, 'danger');
  assert.strictEqual(D.analyzeProfile({ flags: ['other_payment_link'] }).level, 'danger');
  assert.strictEqual(D.analyzeProfile({ name: 'Jonas Jonaitis' }).level, 'ok');
});

test('kiekvienas požymis turi vertimą LT ir EN', () => {
  const src = require('fs').readFileSync(require.resolve('../extension/shared/detector.js'), 'utf8');
  const ids = new Set();
  for (const m of src.matchAll(/add\('([a-z_]+)'/g)) ids.add(m[1]);
  for (const m of src.matchAll(/\bid: '(?!t_|p_)([a-z_]+)', w: \d+, (critical|negatable|re)/g)) ids.add('t_' + m[1]);
  ids.add('url_invalid');
  for (const m of src.matchAll(/\bid: '(t_[a-z][a-z_]*[a-z])'/g)) ids.add(m[1]);
  for (const m of src.matchAll(/signals\.push\(\{ id: '([a-z][a-z_]*[a-z])'/g)) ids.add(m[1]);
  const flags = /const PROFILE_FLAGS = \{([^}]+)\}/.exec(src)[1];
  for (const m of flags.matchAll(/([a-z_]+):/g)) ids.add('p_' + m[1]);
  assert.ok(ids.size > 60, 'rasta per mažai požymių: ' + ids.size);
  for (const lang of ['lt', 'en']) {
    for (const id of ids) assert.ok(I18N.strings[lang].sig[id], lang + ' trūksta ' + id);
    for (const f of Object.keys(I18N.strings.lt.flags)) assert.ok(I18N.strings[lang].flags[f], lang + ' trūksta flags.' + f);
  }
  for (const key of Object.keys(I18N.strings.lt)) {
    assert.ok(I18N.strings.en[key] != null, 'en trūksta ' + key);
  }
});

test('2025–2026 m. schemos', () => {
  const scams = [
    'Norėdami patvirtinti, kad nesate robotas: paspauskite Windows + R, tada CTRL+V ir Enter',
    'Press Win+R, paste the verification code and press Enter',
    'Telia: jūsų 2450 taškų baigia galioti šiandien! Iškeiskite: telia-taskai.top',
    'Patvirtinkite eSIM aktyvavimą, atsiųskite kodą',
    'Nausėda investuoja į naują platformą – pelnas 3000 € per savaitę',
    'E-ZPass: You have an unpaid toll balance of $4.15. Pay within 24 hours to avoid a fine: https://ezpass-toll.icu/pay'
  ];
  for (const s of scams) {
    const r = D.analyzeText(s);
    assert.strictEqual(r.level, 'danger', s + '\n→ ' + JSON.stringify(r.signals.map(x => x.id)));
  }
  assert.strictEqual(D.analyzeText('Atsiprašau, turbūt suklydau numeriu. Ar čia Jonas?').level, 'warn');
});

test('netikros raidės (IDN) ir naujas domenas', () => {
  assert.strictEqual(D.analyzeUrl('https://аpple.com').level, 'danger'); // kirilicos „а“
  assert.ok(D.analyzeUrl('https://аpple.com').signals.some(s => s.id === 'url_idn_brand'));
  assert.strictEqual(D.analyzeUrl('https://www.šaltinis.lt').level, 'ok'); // tikros lietuviškos raidės
  assert.strictEqual(D.decodeHost('xn--pypal-4ve.com'), 'pаypal.com');
  assert.strictEqual(D.analyzeUrl('https://naujaparduotuve.example', { domainAgeDays: 3 }).level, 'warn');
  assert.strictEqual(D.analyzeUrl('https://swedbank.lt', { domainAgeDays: 3 }).level, 'ok');
});

test('sukčių sąrašai (hosts, URL, bendrinami serveriai)', () => {
  const f = D.buildFeed(['https://sites.google.com/view/orange-secu/accueil?x=1', 'http://evil.top/a', '0.0.0.0 bad.example', '# komentaras', 'https://www.paypal.com/x']);
  assert.ok(D.matchFeed('https://sites.google.com/view/orange-secu/accueil/', f));
  assert.ok(!D.matchFeed('https://sites.google.com/view/kita', f));
  assert.ok(D.matchFeed('https://login.evil.top/', f));
  assert.ok(D.matchFeed('http://bad.example', f));
  assert.ok(!D.matchFeed('https://www.paypal.com/x', f), 'oficialūs domenai neblokuojami');
  assert.strictEqual(D.analyzeUrl('https://login.evil.top', { feed: f }).level, 'danger');
});
