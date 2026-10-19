# Apsauga – sukčių atpažinimo ir blokavimo įrankis

> **Paskelbimas Hostinger:** [HOSTINGER.md](HOSTINGER.md).
> **MVP:** paleidimo planas, pilotas ir sėkmės rodikliai – [MVP.md](MVP.md). Plėtinio paskelbimas parduotuvėse – [STORE.md](STORE.md). Privatumo politika – [privatumas.html](privatumas.html).

Nemokamas, paprastas įrankis, padedantis per kelias sekundes atpažinti sukčius:
netikras SMS apie baudas ir siuntas, netikras svetaines, apsimetėlių paskyras,
įtartinas banko sąskaitas. Veikia lietuvių ir anglų kalbomis (lengva pridėti kitas).

**Privatumas:** viskas tikrinama tik jūsų įrenginyje – jokie duomenys niekur nesiunčiami.

## Dvi dalys

### 1. Tinklapis / programėlė telefonui (`index.html`)

| Skiltis | Ką daro |
|---|---|
| **Žinutė / SMS** | Įklijuojate žinutę → gaunate žalią / geltoną / raudoną įvertinimą ir paaiškinimą *kodėl*. Atpažįsta baudų, siuntų, „užblokuotos sąskaitos“, „mama, čia mano naujas numeris“, investicijų, laimėjimų, PIN / Smart-ID kodų prašymus ir kt. (LT, EN, RU, PL, DE šablonai). |
| **Nuoroda** | Parodo tikrąjį svetainės savininką, atpažįsta apsimetėlių domenus (`swedbank.lt.login.top`, `paypa1.com`, `rnicrosoft.com`), trumpintas nuorodas, IP adresus ir **netikras kitos abėcėlės raides** (`pаypal.com` su kirilicos „а“ – Unicode TR39 principu). **QR kodo skenavimas** (apsauga nuo „quishing“ lipdukų) ir pasirinktinai **domeno amžius** per RDAP (naujos svetainės – stipriausias sukčių požymis). |
| **Banko sąskaita** | Patikrina IBAN (kontroliniai skaitmenys, ilgis, šalis, Lietuvos bankas) ir įvertina situaciją: „bankas prašo pervesti į saugią sąskaitą“ = sukčiai. |
| **Paskyra** | Paprastas klausimynas apie Facebook / Instagram / Vinted / pažinčių paskyrą + vardo analizė (`Swedbank_Pagalba_LT`). |
| **Apsauga** | Kaip įjungti jau turimas apsaugas (Chrome „Patobulinta apsauga“, Google Messages sukčiavimo aptikimas, iPhone nežinomų siuntėjų filtras, prisijungimo raktai / passkeys, banko limitai), šeimos slaptažodis prieš DI balso klastotes, netikra CAPTCHA (ClickFix), QR kodai, Quad9 DNS, auksinės taisyklės. |
| **Jau paspaudžiau** | Ką daryti nedelsiant, jei jau įvedėte duomenis ar sumokėjote. |

Įdiegus kaip programėlę (Android: „Įdiegti programą“), SMS galima **„Bendrinti“ → „Apsauga“** –
žinutė patikrinama automatiškai. Veikia ir be interneto.

Paleisti: įkelkite aplanką `apsauga/` į bet kokį statinį serverį (pvz. GitHub Pages).
Vietoje: `cd apsauga && python3 -m http.server` ir atidarykite http://localhost:8000.

### 2. Naršyklės plėtinys (`extension/`) – Chrome, Edge, Firefox

- **Blokuoja kenkėjiškas svetaines**, kol jos dar neatsidarė: apsimetėlių domenus, jūsų
  pačių užblokuotas ir ~390 000 žinomų sukčių svetainių iš viešų
  [Phishing.Database](https://github.com/mitchellkrogza/Phishing.Database) ir
  [OpenPhish Community](https://github.com/openphish/public_feed) sąrašų (atnaujinama kasdien).
  Tikrinamas ir galutinis adresas po peradresavimų (trumpintos nuorodos).
- **Stabdo „ClickFix“** – 2025–2026 m. vieną dažniausių virusų platinimo būdų: netikra
  „Aš ne robotas“ patikra įdeda į iškarpinę PowerShell komandą ir liepia paspausti
  Windows + R ir Ctrl + V. Plėtinys komandą pakeičia nekenksmingu tekstu ir parodo perspėjimą.
- **Naujai sukurtos svetainės** (≤30 d., per RDAP) su slaptažodžio ar kortelės laukeliais
  laikomos rizikingomis. Siunčiamas tik domeno pavadinimas; galima išjungti.
- **Neleidžia įvesti PIN kodo** jokioje svetainėje (kortelės PIN įvedamas tik bankomate),
  o įtartinose svetainėse – ir kortelės numerio, CVV, SMS kodų bei slaptažodžių.
  Vietoj to rodomas didelis aiškus perspėjimas.
- Oficialių bankų, valstybės ir didžiųjų įmonių svetainės netrukdomos; savo patikimą
  svetainę galima pažymėti vienu mygtuku.
- Meniu: dabartinės svetainės įvertinimas, „Blokuoti šią svetainę“, greitas žinutės tikrinimas,
  griežtas režimas (rekomenduojama vyresniems).

Diegimas:
1. Chrome / Edge: `chrome://extensions` → įjunkite „Kūrėjo režimas“ → „Įkelti neišpakuotą“ → pasirinkite `apsauga/extension`.
2. Firefox: `about:debugging` → „Šis Firefox“ → „Įkelti laikiną priedą“ → `apsauga/extension/manifest.json`.

Norint platinti visiems, plėtinį galima paskelbti Chrome Web Store ir Firefox Add-ons.

## Struktūra

```
apsauga/
  index.html, app.js          tinklapis
  manifest.webmanifest, sw.js programėlė telefonui (PWA), veikimas be interneto
  extension/
    shared/detector.js        atpažinimo variklis (bendras tinklapiui ir plėtiniui)
    shared/i18n.js            tekstai LT / EN
    background.js             svetainių blokavimas, sąrašo atnaujinimas
    content.js                PIN / kortelės laukelių apsauga, ClickFix perspėjimai
    clipguard.js              iškarpinės apsauga (veikia puslapio aplinkoje)
    blocked.*, popup.*        blokavimo puslapis ir meniu
  vendor/jsQR.js              QR kodų skaitymas (Apache-2.0), kai naršyklė neturi BarcodeDetector
  tests/detector.test.js      testai
```

Testai: `node --test apsauga/tests/detector.test.js`

**Nauja kalba:** `extension/shared/i18n.js` nukopijuokite `en` bloką, išverskite ir įtraukite į `strings`.
**Naujas bankas / įmonė:** įrašykite oficialius domenus į `BRANDS` sąrašą `detector.js`.

## Kuo remiamasi

- Dažniausios 2025–2026 m. schemos: netikros baudų / kelių mokesčių / siuntų SMS, „taškai baigia galioti“,
  ClickFix, QR lipdukai, DI balso klastotės („susitarkite šeimos slaptažodį“ – rekomenduoja ir Lietuvos policija),
  „Google asistentas: prijungtas naujas įrenginys“, investicijos su žinomų žmonių klastotėmis, eSIM perėmimas.
- Naršyklių praktika: Chrome IDN politika (sumaišytos abėcėlės), Unicode TR39 „confusables“,
  RDAP domeno amžius, vieši phishing sąrašai, apsauga tik įrenginyje (privatumas pagal nutylėjimą).

## Svarbu

Įrankis – patarimas, o ne garantija. Sukčiai nuolat keičia metodus, todėl visada galioja
pagrindinė taisyklė: **bankas, policija ar valstybė niekada neprašo PIN, slaptažodžių ar
Smart-ID kodų ir niekada neprašo pervesti pinigų į „saugią sąskaitą“.**
