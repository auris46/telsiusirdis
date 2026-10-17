# Apsauga – MVP (minimalus veikiantis produktas)

## Problema
Žmonės, ypač vyresni, gauna vis daugiau netikrų SMS apie baudas, siuntas, „užblokuotas sąskaitas“
ir skambučių iš „banko saugumo tarnybos“. Jie nežino, kaip greitai patikrinti, ar tai sukčiai, o po
paspaudimo per kelias minutes netenka pinigų.

## Kam skirta
1. **Pagrindinė grupė:** 55+ m. žmonės Lietuvoje, kurie naudojasi telefonu ir internetine bankininkyste.
2. **Pagalbininkai:** jų vaikai ir anūkai, kurie įdiegia apsaugą tėvams ir seneliams.
3. **Tarpininkai:** bibliotekos, seniūnijos, senjorų bendruomenės, kurios moko skaitmeninio raštingumo.

## Ką MVP daro (jau veikia)
| Funkcija | Kur |
|---|---|
| Žinutės / SMS patikra su paaiškinimu „kodėl“ | Tinklapis / programėlė |
| Nuorodos patikra (apsimetėliai, netikros raidės, trumpinimas) | Tinklapis |
| QR kodo patikra iš nuotraukos | Tinklapis |
| Banko sąskaitos (IBAN) patikra pagal situaciją | Tinklapis |
| Paskyros / profilio klausimynas | Tinklapis |
| „Jau paspaudžiau“ – ką daryti iš karto | Tinklapis |
| SMS „Bendrinti → Apsauga“ (Android) | Įdiegta programėlė |
| Sukčių svetainių blokavimas (~390 000 + taisyklės) | Plėtinys |
| PIN / kortelės laukelių užraktas | Plėtinys |
| ClickFix (netikra CAPTCHA) stabdymas | Plėtinys |
| Atsiliepimas „Ar įvertinimas teisingas?“ ir „Pranešti apie sukčius“ | Tinklapis (įjungus formą) |

**Sąmoningai NE MVP:** automatinis SMS ir skambučių filtravimas telefone (reikia vietinės programėlės),
paskyros, serveris, DI modelis, mokėjimai. Pirmiausia patikriname, ar žmonės įrankiu naudojasi.

## Hipotezės, kurias tikriname
1. Žmonės, gavę įtartiną žinutę, **patys** atsidarys įrankį ir ją patikrins.
2. Įvertinimas teisingas daugumai tikrų žinučių (**≥ 90 %** atsakymų „Taip“).
3. Vyresnis žmogus be pagalbos supranta rezultatą ir žino, ką daryti.
4. Artimieji noriai įdiegia plėtinį ar programėlę tėvams.

## Sėkmės rodikliai po 4 savaičių
| Rodiklis | Tikslas | Kaip matuojame |
|---|---|---|
| Bandomųjų naudotojų | 30–50 | Pilotinės grupės sąrašas |
| Bent 2 kartus panaudojo patys | ≥ 40 % | Apklausa po 2 ir 4 sav. |
| „Ar įvertinimas teisingas?“ – Taip | ≥ 90 % | Atsiliepimų forma |
| Rezultatą suprato be pagalbos | ≥ 80 % | 5 min. pokalbis / stebėjimas |
| Nauji sukčių pavyzdžiai | ≥ 20 | „Pranešti apie sukčius“ |
| Rekomenduotų draugui (0–10) | ≥ 8 vidurkis | Apklausa |

Įrankis nerenka jokios analitikos – tai pažadas naudotojams. Rodiklius renkame tik iš atsiliepimų ir apklausų.

## Paleidimas per 1 dieną

### 1. Viešas adresas (GitHub Pages, nemokamai)
1. Sujunkite šaką `claude/fraud-detection-tool-jw1na1` į `main`.
2. GitHub: **Settings → Pages → Build and deployment → Source: „GitHub Actions“**.
3. Po kelių minučių programėlė veiks adresu `https://<vartotojas>.github.io/<saugykla>/apsauga/`.
   Ten pat bus `privatumas.html` ir atsisiunčiamas plėtinys `apsauga-extension.zip`.

### 2. Atsiliepimų forma (Google Forms, 10 min.)
1. Sukurkite formą su klausimais (trumpas atsakymas): *Tipas*, *Ar teisinga*, *Įvertinimas*, *Požymiai*,
   *Tekstas* (pastraipa), *Kalba*, *Versija*.
2. Meniu ⋮ → **„Gauti iš anksto užpildytą nuorodą“**. Į laukelius įrašykite atitinkamai
   `{type}`, `{correct}`, `{verdict}`, `{reasons}`, `{text}`, `{lang}`, `{version}` → „Gauti nuorodą“ → kopijuoti.
3. Įklijuokite nuorodą į `apsauga/config.js` → `feedbackUrl: '...'`. Riestiniai skliaustai nuorodoje gali
   būti užkoduoti kaip `%7B` ir `%7D` – pakeiskite juos atgal į `{` ir `}`.
4. Atsakymai kaupiami Google Sheets lentelėje – tai ir yra MVP rodiklių šaltinis.

### 3. Plėtinys
Rankiniam diegimui pakanka ZIP. Platesniam naudojimui – Chrome Web Store, Edge ir Firefox (žr. `STORE.md`).

## Pilotas (4 savaitės)
| Savaitė | Veiksmai |
|---|---|
| 1 | 10 pažįstamų (5 senjorai + 5 artimieji) – 30 min. susitikimai, stebime, kur strigo. Taisome. |
| 2 | Biblioteka ar seniūnija: 1 valandos užsiėmimas 15–20 žmonių. Įdiegiame programėlę į telefonus. |
| 3 | Socialiniai tinklai / bendruomenių grupės: „Gavote įtartiną SMS? Patikrinkite čia“. |
| 4 | Apklausa, rezultatų analizė, sprendimas: tęsti, keisti ar sustoti. |

## Kas toliau, jei hipotezės pasitvirtina
1. Android programėlė, kuri SMS tikrina automatiškai (kaip Surfshark / Nord, bet nemokama ir lietuviška).
2. Bendradarbiavimas su bankais, policija, RRT, NKSC – oficialūs sukčių numerių ir domenų sąrašai.
3. Daugiau kalbų (rusų, lenkų, ukrainiečių – dideli sukčių taikiniai Lietuvoje).
4. Finansavimas: socialinės atsakomybės partneriai (pvz. Tesonet / Nord Security), ES skaitmeninio
   raštingumo programos, bankų fondai.
