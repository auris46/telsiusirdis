#!/usr/bin/env node
/*
 * Sukuria kasdien atnaujinamą sukčių svetainių duomenų bazę telefonams ir tinklapiui.
 * Kiekvienas adresas paverčiamas SHA-256 „pirštų atspaudu“ ir suskirstomas į 4096 mažus failus
 * pagal pirmus 3 simbolius. Naršyklė atsisiunčia tik vieną mažą failą ir palygina pati –
 * serveris niekada nesužino, kokį adresą tikrinote (kaip Google Safe Browsing).
 *
 * Naudojimas: node apsauga/tools/build-threat-db.js <išvesties_aplankas> [vietinis_sąrašas.txt ...]
 */
'use strict';
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const D = require('../extension/shared/detector.js');

const FEEDS = [
  ['Phishing.Database', 'https://raw.githubusercontent.com/mitchellkrogza/Phishing.Database/master/phishing-domains-ACTIVE.txt'],
  ['OpenPhish Community', 'https://raw.githubusercontent.com/openphish/public_feed/refs/heads/main/feed.txt']
];
const PREFIX = 3;
const HASH_LEN = 16;

function hash(key) {
  return crypto.createHash('sha256').update(key).digest('hex').slice(0, HASH_LEN);
}

async function main() {
  const out = process.argv[2];
  if (!out) { console.error('Nurodykite išvesties aplanką'); process.exit(2); }
  const lines = [];
  const sources = [];
  for (const file of process.argv.slice(3)) {
    for (const l of fs.readFileSync(file, 'utf8').split('\n')) lines.push(l);
    sources.push(path.basename(file));
  }
  if (!process.argv.slice(3).length) {
    for (const [name, url] of FEEDS) {
      try {
        const res = await fetch(url);
        if (!res.ok) throw new Error('HTTP ' + res.status);
        const text = await res.text();
        for (const l of text.split('\n')) lines.push(l);
        sources.push(name);
      } catch (e) {
        console.warn('Nepavyko atsisiųsti', name, e.message);
      }
    }
  }
  // Rankiniu būdu pridėti adresai iš rules.json
  const rules = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'extension', 'shared', 'rules.json'), 'utf8'));
  for (const h of rules.blockHosts || []) lines.push(h);
  if (rules.blockHosts && rules.blockHosts.length) sources.push('Apsauga rules.json');

  const feed = D.buildFeed(lines);
  if (feed.hosts.size + feed.urls.size < 1000 && !process.argv.slice(3).length) {
    // Saugiklis: jei šaltiniai neatsakė, geriau palikti senąją bazę, nei paskelbti tuščią
    console.error('Per mažai įrašų (' + (feed.hosts.size + feed.urls.size) + ') – bazė nekuriama');
    process.exit(1);
  }
  const buckets = new Map();
  const put = (key) => {
    const h = hash(key);
    const b = h.slice(0, PREFIX);
    if (!buckets.has(b)) buckets.set(b, new Set());
    buckets.get(b).add(h);
  };
  for (const h of feed.hosts) put(h);
  for (const u of feed.urls) put('u:' + u);

  fs.mkdirSync(out, { recursive: true });
  for (let i = 0; i < 16 ** PREFIX; i++) {
    const b = i.toString(16).padStart(PREFIX, '0');
    const set = buckets.get(b);
    fs.writeFileSync(path.join(out, b + '.txt'), set ? Array.from(set).sort().join('\n') + '\n' : '');
  }
  const meta = {
    updated: new Date().toISOString(),
    count: feed.hosts.size + feed.urls.size,
    sources,
    prefix: PREFIX,
    hashLength: HASH_LEN,
    rules: rules.version
  };
  fs.writeFileSync(path.join(out, 'meta.json'), JSON.stringify(meta, null, 2) + '\n');
  console.log(out + ': ' + meta.count + ' įrašų, ' + buckets.size + ' failų su duomenimis');
}

main().catch((e) => { console.error(e); process.exit(1); });
