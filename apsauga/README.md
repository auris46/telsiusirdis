# Apsauga – sukčių atpažinimo ir blokavimo įrankis

Nemokamas, paprastas įrankis, padedantis per kelias sekundes atpažinti sukčius:
netikras SMS apie baudas ir siuntas, netikras svetaines, apsimetėlių paskyras,
įtartinas banko sąskaitas. Veikia lietuvių ir anglų kalbomis (lengva pridėti kitas).

**Privatumas:** viskas tikrinama tik jūsų įrenginyje – jokie duomenys niekur nesiunčiami.

## Dvi dalys

### 1. Tinklapis / programėlė telefonui (`index.html`)

| Skiltis | Ką daro |
|---|---|
| **Žinutė / SMS** | Įklijuojate žinutę → gaunate žalią / geltoną / raudoną įvertinimą ir paaiškinimą *kodėl*. Atpažįsta baudų, siuntų, „užblokuotos sąskaitos“, „mama, čia mano naujas numeris“, investicijų, laimėjimų, PIN / Smart-ID kodų prašymus ir kt. (LT, EN, RU, PL, DE šablonai). |
| **Nuoroda** | Parodo tikrąjį svetainės savininką, atpažįsta apsimetėlių domenus (`swedbank.lt.login.top`, `paypa1.com`, `rnicrosoft.com`), trumpintas nuorodas, IP adresus, netikras raides (punycode). |
| **Banko sąskaita** | Patikrina IBAN (kontroliniai skaitmenys, ilgis, šalis, Lietuvos bankas) ir įvertina situaciją: „bankas prašo pervesti į saugią sąskaitą“ = sukčiai. |
| **Paskyra** | Paprastas klausimynas apie Facebook / Instagram / Vinted / pažinčių paskyrą + vardo analizė (`Swedbank_Pagalba_LT`). |
| **Apsauga** | 1 minutės instrukcija, kaip telefone įjungti sukčių svetainių blokavimą (Quad9 privatus DNS), plėtinio diegimas, 5 auksinės taisyklės. |
| **Jau paspaudžiau** | Ką daryti nedelsiant, jei jau įvedėte duomenis ar sumokėjote. |

Įdiegus kaip programėlę (Android: „Įdiegti programą“), SMS galima **„Bendrinti“ → „Apsauga“** –
žinutė patikrinama automatiškai. Veikia ir be interneto.

Paleisti: įkelkite aplanką `apsauga/` į bet kokį statinį serverį (pvz. GitHub Pages).
Vietoje: `cd apsauga && python3 -m http.server` ir atidarykite http://localhost:8000.

### 2. Naršyklės plėtinys (`extension/`) – Chrome, Edge, Firefox

- **Blokuoja kenkėjiškas svetaines**, kol jos dar neatsidarė: apsimetėlių domenus, jūsų
  pačių užblokuotas ir ~390 000 žinomų sukčių svetainių iš viešo
  [Phishing.Database](https://github.com/mitchellkrogza/Phishing.Database) sąrašo (atnaujinama kasdien).
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
    content.js                PIN / kortelės laukelių apsauga
    blocked.*, popup.*        blokavimo puslapis ir meniu
  tests/detector.test.js      testai
```

Testai: `node --test apsauga/tests/detector.test.js`

**Nauja kalba:** `extension/shared/i18n.js` nukopijuokite `en` bloką, išverskite ir įtraukite į `strings`.
**Naujas bankas / įmonė:** įrašykite oficialius domenus į `BRANDS` sąrašą `detector.js`.

## Svarbu

Įrankis – patarimas, o ne garantija. Sukčiai nuolat keičia metodus, todėl visada galioja
pagrindinė taisyklė: **bankas, policija ar valstybė niekada neprašo PIN, slaptažodžių ar
Smart-ID kodų ir niekada neprašo pervesti pinigų į „saugią sąskaitą“.**
