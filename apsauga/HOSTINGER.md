# „Apsaugos“ paskelbimas Hostinger

Rezultatas: įrankis veikia jūsų domene (pvz. `https://patikrink.lt`), o kiekvienas patobulinimas
GitHub'e po kelių minučių automatiškai atsiranda svetainėje.

```
Pakeitimas GitHub (main) → automatiniai testai → šaka „svetaine“ → Hostinger paskelbia pats
```
Jei testai nepavyksta, svetainė lieka sena – sugadinta versija į internetą nepateks.

---

## 1. Domenas

Hostinger metiniai Premium / Business planai dažnai turi **nemokamą domeną pirmiems metams**.
hPanel'yje ieškokite pasiūlymo „Claim domain“ / „Gauti nemokamą domeną“, arba **Domains → Get a new domain**.
Ar nemokamas pasiūlymas taikomas `.lt`, priklauso nuo plano – tai matysite paieškoje.

Pasiūlymai (užimtumo patikrinti nepavyko – patikrinkite Hostinger paieškoje):

| Lietuvai | Tarptautiniai |
|---|---|
| `patikrink.lt` | `apsauga.app` |
| `ar-sukciai.lt` | `scamcheck.lt` |
| `sukciu-stop.lt` | `checkscam.eu` |
| `apsauga-nuo-sukciu.lt` | `isitscam.eu` |
| `saugus-sms.lt` | |

Patarimai: trumpas, lengvai padiktuojamas telefonu, be skaičių. `.lt` kelia pasitikėjimą Lietuvoje,
`.eu` tinka visai Europai. Venkite žodžių „bank“, „swedbank“ ir pan. domene – tai atrodytų kaip apgaulė.

## 2. Svetainė hPanel'yje

1. **Websites → Add website** → pasirinkite tuščią / savo kodo svetainę (*Custom / Empty website*, be WordPress).
2. Pasirinkite domeną iš 1 žingsnio.
3. **Files → File Manager → `public_html`** – ištrinkite ten esančius pavyzdinius failus
   (pvz. `default.php`). Git paskelbimui katalogas turi būti tuščias.

## 3A. Automatinis paskelbimas per Git (rekomenduojama)

**Vieną kartą GitHub'e:**
1. Sujunkite šaką `claude/fraud-detection-tool-jw1na1` į `main` (Pull Request → Merge).
2. **Actions** skirtuke palaukite, kol „Apsauga – svetainė Hostinger“ taps žalias ✓.
   Atsiras nauja šaka **`svetaine`** – joje tik svetainės failai.

**Vieną kartą Hostinger:**
1. **Websites → Manage → Advanced → Git**.
2. Prijunkite GitHub paskyrą (Hostinger GitHub programėlė) ir pasirinkite saugyklą `auris46/telsiusirdis`.
3. **Branch:** `svetaine`. **Directory:** palikite tuščią (tai `public_html`).
4. Įsitikinkite, kad **Auto-deployment** įjungtas → **Deploy**.

Nuo šiol kiekvienas pakeitimas `main` šakoje svetainėje atsiras per kelias minutes.

> Jei jūsų plane nėra Git funkcijos – naudokite 3B.

## 3B. Rankinis įkėlimas (be Git)

1. Gaukite archyvą `apsauga-svetaine.zip`:
   GitHub → šaka `svetaine` → **Code → Download ZIP**, arba kompiuteryje
   `sh apsauga/tools/build-site.sh` ir supakuokite `apsauga/dist/site` turinį.
2. **File Manager → `public_html` → Upload** → įkelkite ZIP → dešiniu pelės klavišu **Extract**.
3. Failai (`index.html`, `app.js` …) turi būti **tiesiai** `public_html`, ne poaplankyje.
4. Jei matote `.htaccess` – palikite (jis įjungia https ir saugumo nustatymus).

Atnaujinant – tas pats, perrašant failus.

## 4. HTTPS (saugus ryšys)

**Security → SSL** – įdiekite nemokamą SSL sertifikatą (dažnai jau įdiegtas automatiškai).
Tai būtina: be https neveiks programėlės įdiegimas į telefoną ir darbas be interneto.

## 5. Patikrinimas

- Atsidarykite `https://jūsų-domenas` → spauskite pavyzdį „Bauda SMS“ → turi būti raudona „PAVOJINGA“.
- `https://jūsų-domenas/privatumas.html` – privatumo politika.
- `https://jūsų-domenas/apsauga-extension.zip` – atsisiunčia plėtinį.
- Telefone (Chrome) → meniu → **Įdiegti programą**.

Jei matote seną versiją: **Advanced → Cache Manager → Purge all** ir perkraukite puslapį.

## 6. Kaip tobulinti

| Ką keisti | Kur |
|---|---|
| Atsiliepimų forma | `apsauga/config.js` → `feedbackUrl` |
| Tekstai, nauja kalba | `apsauga/extension/shared/i18n.js` |
| Naujos sukčių schemos, bankai, domenai | `apsauga/extension/shared/detector.js` (+ testas `apsauga/tests/detector.test.js`) |
| Išvaizda | `apsauga/index.html` (`<style>` dalis) |

Keisti galima tiesiog GitHub svetainėje (pieštuko ženklas prie failo → *Commit changes*) arba paprašius Claude.
Pakeitus `main` šakoje, svetainė atsinaujina pati. Naudotojų telefonuose įdiegta programėlė
atsinaujina kitą kartą atidarius.

## 7. Po paskelbimo

- `apsauga/STORE.md` – privatumo politikos nuorodą pakeiskite į `https://jūsų-domenas/privatumas.html`.
- Laiške Tesonet ir pilotui naudokite naują adresą.
- Užsiregistruokite **Google Search Console** – kad įrankį rastų paieškoje.

## Dažnos problemos

| Problema | Sprendimas |
|---|---|
| Rodo „Index of /“ arba Hostinger pavyzdinį puslapį | Failai ne `public_html` šaknyje arba liko `default.php` |
| Git Deploy klaida „directory not empty“ | Ištrinkite viską iš `public_html` ir spauskite Deploy |
| Nėra šakos `svetaine` | Kodas dar nesujungtas į `main` arba Actions nepavyko (žr. Actions skirtuką) |
| 500 klaida | Laikinai pervadinkite `.htaccess` į `htaccess.txt` ir parašykite Claude, kas matosi |
| Nesiūlo įdiegti į telefoną | Neįjungtas SSL (https) |
