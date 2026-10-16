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
  const ids = new Set();
  const collect = (r) => r.signals.forEach(s => ids.add(s.id));
  collect(D.analyzeText('PIN anydesk saugią sąskaitą gift card bauda siunta užblokuota sąskaita skubiai laimėjote investuok garantuotą pelną mama naujas numeris parašyk WhatsApp banko saugumo tarnyba pervesk 1,50 € darbas iš namų mano brangioji https://swedbank.lt.x.top', { sender: '+37060000000', homeCountryCode: '44' }));
  for (const lang of ['lt', 'en']) {
    for (const key of Object.keys(I18N.strings.lt.sig)) {
      assert.ok(I18N.strings[lang].sig[key], lang + ' trūksta ' + key);
    }
    for (const id of ids) assert.ok(I18N.strings[lang].sig[id], lang + ' trūksta ' + id);
  }
  for (const key of Object.keys(I18N.strings.lt)) {
    if (key === 'sig') continue;
    assert.ok(I18N.strings.en[key] != null, 'en trūksta ' + key);
  }
});
