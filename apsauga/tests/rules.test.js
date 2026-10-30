// rules.json – atnaujinamų taisyklių patikra. Paleidžiama prieš kiekvieną paskelbimą:
// sugadinta ar per plati taisyklė į svetainę nepateks.
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { execFileSync } = require('child_process');

const RULES_PATH = path.join(__dirname, '..', 'extension', 'shared', 'rules.json');
const rules = JSON.parse(fs.readFileSync(RULES_PATH, 'utf8'));
const freshDetector = () => {
  delete require.cache[require.resolve('../extension/shared/detector.js')];
  return require('../extension/shared/detector.js');
};

test('rules.json struktūra', () => {
  assert.match(rules.version, /^\d{4}-\d{2}-\d{2}/, 'versija – data (YYYY-MM-DD)');
  for (const lang of ['lt', 'en']) assert.ok(Array.isArray(rules.changes[lang]), 'changes.' + lang);
  const ids = new Set();
  for (const t of rules.textRules) {
    assert.match(t.id, /^[a-z][a-z0-9_]{1,40}$/, 'id ' + t.id);
    assert.ok(!ids.has(t.id), 'pasikartojantis id ' + t.id);
    ids.add(t.id);
    assert.ok(t.text && t.text.lt && t.text.en, t.id + ': trūksta teksto lt/en');
    assert.ok(t.w >= 0 && t.w <= 70, t.id + ': svoris 0–70');
    for (const re of t.re) assert.doesNotThrow(() => new RegExp(re, 'i'), t.id + ': netinkama išraiška ' + re);
    assert.ok(Array.isArray(t.examples) && t.examples.length, t.id + ': būtini pavyzdžiai');
  }
  for (const b of rules.brands) assert.ok(b.name && b.keys.length && b.domains.length, 'prekės ženklas ' + b.name);
});

test('kiekviena taisyklė atpažįsta savo pavyzdžius', () => {
  const D = freshDetector();
  D.addRules(rules);
  for (const t of rules.textRules) {
    for (const ex of t.examples) {
      const r = D.analyzeText(ex);
      assert.ok(r.signals.some((s) => s.id === 't_' + t.id), t.id + ' neatpažino: ' + ex);
    }
  }
});

test('taisyklės nekelia klaidingų pavojų įprastoms žinutėms', () => {
  const D = freshDetector();
  D.addRules(rules);
  const normal = [
    'Labas, ar susitinkam rytoj 18 val. prie Telšių katedros?',
    'Jūsų Booking.com rezervacija patvirtinta. Laukiame jūsų!',
    'Primename: rytoj 9:00 vizitas pas gydytoją.',
    'Telegram grupėje šiandien bus susirinkimas.',
    'Ačiū už pirkinį! Jūsų siuntinys jau pakeliui.'
  ];
  for (const m of normal) assert.notStrictEqual(D.analyzeText(m).level, 'danger', m);
});

test('oficialūs domenai lieka saugūs pridėjus taisykles', () => {
  const D = freshDetector();
  D.addRules(rules);
  for (const u of ['https://www.booking.com/', 'https://www.airbnb.com/', 'https://telegram.org/', 'https://www.swedbank.lt/'])
    assert.strictEqual(D.analyzeUrl(u).level, 'ok', u);
});

test('sukčių svetainių bazė: sukūrimas ir paieška pagal maišos prefiksą', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'apsauga-db-'));
  const list = path.join(dir, 'list.txt');
  const lines = ['evil-bank-login.top', 'https://sites.google.com/view/fake-bank/login'];
  for (let i = 0; i < 1200; i++) lines.push('scam' + i + '.example');
  fs.writeFileSync(list, lines.join('\n'));
  execFileSync(process.execPath, [path.join(__dirname, '..', 'tools', 'build-threat-db.js'), path.join(dir, 'db'), list]);
  const meta = JSON.parse(fs.readFileSync(path.join(dir, 'db', 'meta.json'), 'utf8'));
  assert.ok(meta.count >= 1200);
  const D = freshDetector();
  const crypto = require('crypto');
  const lookup = (url) => D.feedKeys(url).some((k) => {
    const h = crypto.createHash('sha256').update(k).digest('hex').slice(0, meta.hashLength);
    const file = path.join(dir, 'db', h.slice(0, meta.prefix) + '.txt');
    return fs.readFileSync(file, 'utf8').split('\n').includes(h);
  });
  assert.ok(lookup('https://login.evil-bank-login.top/x'), 'subdomenas randamas');
  assert.ok(lookup('https://sites.google.com/view/fake-bank/login'), 'konkretus puslapis randamas');
  assert.ok(!lookup('https://sites.google.com/view/kita'), 'kiti bendrinamo serverio puslapiai neblokuojami');
  assert.ok(!lookup('https://www.swedbank.lt'), 'tikra svetainė nerandama');
  fs.rmSync(dir, { recursive: true, force: true });
});
