# Plėtinio paskelbimas parduotuvėse

Archyvas: `sh apsauga/tools/package-extension.sh` → `apsauga/dist/apsauga-extension.zip`
(paskelbus per GitHub Pages, jis taip pat pasiekiamas adresu `.../apsauga/apsauga-extension.zip`).

## Chrome Web Store (ir Microsoft Edge Add-ons)

1. Užsiregistruokite <https://chrome.google.com/webstore/devconsole> (vienkartinis 5 USD mokestis).
2. „New item“ → įkelkite `apsauga-extension.zip`.
3. Užpildykite laukus tekstais žemiau, įkelkite ekrano nuotraukas (1280×800).
4. Privatumo politikos nuoroda: `https://<vartotojas>.github.io/<saugykla>/apsauga/privatumas.html`.
5. Pateikite peržiūrai. Plėtiniai su „visų svetainių“ leidimu tikrinami ilgiau (dažniausiai kelias dienas).

Edge: <https://partner.microsoft.com/dashboard/microsoftedge> – tas pats ZIP, nemokamai.
Firefox: <https://addons.mozilla.org/developers/> – tas pats ZIP, nemokamai.

### Pavadinimas
Apsauga – sukčių blokavimas

### Trumpas aprašymas (iki 132 simbolių)
- LT: Blokuoja sukčių svetaines, neleidžia įvesti PIN kodo ir sustabdo netikrą CAPTCHA. Nemokama, privatu, be sekimo.
- EN: Blocks scam sites, stops you typing your PIN and catches fake CAPTCHA tricks. Free, private, no tracking.

### Išsamus aprašymas (LT)
Apsauga saugo jus ir jūsų artimuosius nuo internetinių sukčių.

• Užblokuoja sukčių ir apsimetėlių svetaines dar prieš joms atsidarant – pvz. „swedbank.lt.login-secure.top“ ar adresus su netikromis raidėmis.
• Naudoja viešus, kasdien atnaujinamus sukčių svetainių sąrašus (~390 000 adresų).
• Neleidžia įvesti kortelės PIN kodo jokioje svetainėje – PIN įvedamas tik bankomate.
• Įtartinose ir naujai sukurtose svetainėse užrakina kortelės, CVV, SMS kodų ir slaptažodžių laukelius.
• Sustabdo „ClickFix“ – netikrą „Aš ne robotas“ patikrą, kuri liepia paspausti Windows + R ir įklijuoti virusą.
• Meniu galima patikrinti įtartiną žinutę.

Privatumas: viskas tikrinama jūsų kompiuteryje. Jokių slapukų, reklamos ar sekimo. Atviras kodas.

### Full description (EN)
Apsauga protects you and your family from online scams.

• Blocks scam and impersonation websites before they open – e.g. “paypal.com.login-secure.top” or addresses using look-alike letters.
• Uses public scam-site lists updated daily (~390,000 addresses).
• Never lets you type your card PIN on a website – a PIN belongs only at an ATM.
• Locks card, CVV, SMS-code and password fields on suspicious and newly created websites.
• Stops “ClickFix” – fake “I am not a robot” checks that tell you to press Windows + R and paste malware.
• Check a suspicious message right from the menu.

Privacy: everything is analysed on your computer. No cookies, ads or tracking. Open source.

### Kategorija
Privacy & Security / Saugumas

### Leidimų pagrindimas (Chrome reikalauja kiekvienam)
| Leidimas | Kam reikalingas |
|---|---|
| Host permission `<all_urls>` | Patikrinti kiekvieną atidaromą svetainę ir bet kuriame puslapyje užrakinti PIN / kortelės laukelius bei sustabdyti kenkėjiškas iškarpinės komandas. Taip pat atsisiųsti viešus sukčių sąrašus ir domeno registracijos datą (rdap.org). |
| `webNavigation` | Patikrinti adresą prieš puslapiui atsidarant ir po peradresavimų, kad sukčių svetainė būtų užblokuota laiku. |
| `tabs` | Nukreipti skirtuką į blokavimo puslapį ir meniu parodyti dabartinės svetainės įvertinimą. |
| `storage`, `unlimitedStorage` | Laikyti nustatymus, patikimų / užblokuotų svetainių sąrašus ir ~10 MB sukčių svetainių sąrašą įrenginyje. |
| `alarms` | Kartą per parą atnaujinti sukčių svetainių sąrašą. |
| Nuotolinis kodas | Nenaudojamas. Visas kodas yra pakete. |

### Duomenų naudojimo deklaracija
- Renkami duomenys: **jokie** (pažymėkite, kad nerenkate jokių naudotojo duomenų kategorijų).
- Patvirtinkite: duomenys neparduodami, nenaudojami su pagrindine funkcija nesusijusiais tikslais, nenaudojami kreditingumui vertinti.
