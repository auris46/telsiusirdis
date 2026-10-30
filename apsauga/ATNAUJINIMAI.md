# Kaip „Apsauga“ nuolat atnaujinama

Sukčiai keičia schemas kas kelias savaites, todėl „Apsauga“ atnaujinama trimis lygiais.

| Kas | Kaip dažnai | Kas tai daro | Ar reikia jūsų |
|---|---|---|---|
| Sukčių svetainių bazė (~390 000 adresų) | Kas naktį | GitHub Actions automatiškai | Ne |
| Naujos sukčių schemos (`rules.json`) | Kai atsiranda nauja schema | Jūs arba Claude, ~10 min. | Taip, peržiūrėti |
| Programos funkcijos | Pagal poreikį | Kūrėjas | Taip |

## 1. Kasnaktinis duomenų bazės atnaujinimas (automatinis)

Kiekvieną naktį 03:23 UTC darbas „Apsauga – svetainė Hostinger“:
1. paleidžia visus testus;
2. atsisiunčia naujausius viešus sukčių svetainių sąrašus (Phishing.Database, OpenPhish);
3. sukuria privačią paieškos bazę (`db/`) ir paskelbia svetainę šakoje `svetaine`;
4. Hostinger ją paskelbia pats.

Jei sąrašai nepasiekiami ar testai nepavyksta – svetainė neatnaujinama, lieka vakarykštė.
Plėtinys savo sąrašą ir taisykles atnaujina pats kartą per parą.

## 2. Naujos sukčių schemos – `extension/shared/rules.json`

Taisyklės yra **duomenys, ne kodas**: jas galima pridėti be programos atnaujinimo. Tinklapis jas
pasiima kitą kartą atidarius, plėtinys – per parą. Naudotojai pamato kortelę „Apsauga atnaujinta – nauja: …“.

### Iš kur sužinoti apie naujas schemas
- Naudotojų pranešimai („Pranešti apie naują sukčių žinutę“ → jūsų Google lentelė).
- Atsakymai „Ne“ į „Ar įvertinimas teisingas?“ – ten, kur įrankis suklydo.
- Policijos (policija.lt), NKSC (nksc.lt), RRT, bankų įspėjimai, LRT / Delfi naujienos.

### Kaip pridėti taisyklę (pavyzdys)
```json
{
  "id": "parcel_locker_code",
  "w": 35,
  "re": [
    "paštomat\\S*\\s.{0,40}(kod|sumokėk|patvirtink)",
    "parcel locker\\s.{0,40}(code|pay|confirm)"
  ],
  "text": {
    "lt": "Rašoma apie paštomato kodą ar mokestį („{quote}“) – dažnas siuntų masalas.",
    "en": "Mentions a parcel-locker code or fee (“{quote}”) – common parcel bait."
  },
  "examples": [
    "Jūsų siunta paštomate. Norėdami gauti kodą, sumokėkite 0,99 EUR.",
    "Your parcel locker code expires today, pay the fee to confirm."
  ]
}
```
- `w` – svoris 0–70 (≥ 50 arba `"critical": true` – iškart „Pavojinga“).
- `re` – paieškos šablonai (nedidžiųjų raidžių jautrumas įjungtas automatiškai).
- `examples` – **privalomi**: testai patikrina, kad taisyklė juos atpažįsta, ir kad įprastos žinutės nepažymimos pavojingomis.
- Taip pat galima pridėti `brands` (oficialūs prekės ženklų domenai) ir `blockHosts` (konkretūs sukčių adresai).
- Pakeiskite `version` (šiandienos data) ir įrašykite, kas nauja, į `changes.lt` / `changes.en`.

Paprasčiausia: parašykite Claude „Pridėk taisyklę šiai sukčių žinutei: …“ – jis pridės taisyklę su pavyzdžiais ir paleis testus.

Patikrinti vietoje: `node --test apsauga/tests/*.test.js`

## 3. Programos atnaujinimai

Pakeitimai daromi atskiroje šakoje → Pull Request → testai → sujungimas į `main` → automatinis paskelbimas.
Naudotojų telefonuose įdiegta programėlė atsinaujina kitą kartą atidarius.

## Rekomenduojamas ritmas

- **Kas savaitę (15 min.):** peržiūrėkite pranešimus ir „Ne“ atsakymus, pridėkite 1–2 taisykles.
- **Kas mėnesį:** peržiūrėkite Plius statistiką (`/api/admin.php`) ir DI išlaidas Anthropic konsolėje.
- **Kas ketvirtį:** atnaujinkite PHP bibliotekas (`composer update` aplanke `apsauga/api`) ir patikrinkite, ar Hostinger PHP versija ≥ 8.1.
