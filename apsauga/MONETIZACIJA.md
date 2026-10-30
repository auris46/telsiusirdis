# „Apsaugos“ išlaikymas ir pajamos

Principas: **pagrindinė apsauga visada nemokama**. Žmonės, kuriems apsauga labiausiai reikalinga
(senjorai), dažniausiai nemokės – todėl pajamos turi ateiti iš kitur, o mokama dalis turi turėti aiškią
papildomą vertę ir realią savikainą.

## 1. Parama (jau įdiegta)

Skiltis „Apsauga nemokama visiems“ puslapio apačioje. Nustatoma `apsauga/config.js` → `donate`:

```js
donate: {
  links: [
    { label: 'Paremti per PayPal', url: 'https://www.paypal.com/donate/?hosted_button_id=...' },
    { label: 'Buy Me a Coffee', url: 'https://buymeacoffee.com/jusu-vardas' }
  ],
  bank: { name: 'Gavėjo vardas', iban: 'LT00 0000 0000 0000 0000', purpose: 'Parama Apsaugai' }
}
```
- Naudokite tik žinomas platformas (PayPal, Stripe, Buy Me a Coffee, Revolut, Paysera). Įrankis pats
  moko nepasitikėti nežinomomis mokėjimo nuorodomis – parama turi atrodyti patikimai.
- **1,2 % GPM parama:** gyventojai gali skirti dalį pajamų mokesčio, bet tik **paramos gavėjui**
  (VšĮ, asociacijai ar labdaros fondui su paramos gavėjo statusu). Įsteigus VšĮ „Apsauga“, tai gali tapti
  stabiliu pajamų šaltiniu. Pasitarkite su buhalteriu.
- Įmonėms parama (iki tam tikrų ribų) mažina pelno mokestį – taip pat tik paramos gavėjui.

## 2. Apsauga Plius – DI eksperto patikra (jau įdiegta)

**Kodėl būtent tai mokama:** kiekviena DI analizė kainuoja (Anthropic API), o įprasta patikra – ne.
Žmogus moka už tai, kas iš tiesų turi savikainą.

| | Nemokamai | Plius |
|---|---|---|
| Žinučių, nuorodų, QR, IBAN, paskyrų patikra | ✔ neribotai | ✔ |
| Sukčių svetainių bazė, plėtinys, PIN apsauga | ✔ | ✔ |
| DI eksperto patikra neaiškiems atvejams | 3 per mėnesį | pagal paketą |

**Siūlomos kainos** (keičiamos `apsauga-private/config.php`):
- 30 DI patikrų – 2,99 €
- 100 DI patikrų – 7,99 €
- „Šeimos“ paketas 300 patikrų – 19,99 € (vienas kodas visai šeimai, keliuose telefonuose)

**Savikaina:** viena patikra su Claude Opus 5.5 kainuoja apytiksliai 1–3 euro centus (priklauso nuo
žinutės ilgio). Stripe mokestis ES kortelėms – apie 1,5 % + 0,25 €. Taigi 2,99 € paketas
(≈0,30 € mokesčio + ≈0,60 € DI) palieka ~2 € tolesniam kūrimui. Nemokamas 3 patikras per mėnesį
riboja `free_daily_cap` (išlaidų saugiklis).

**Kaip veikia apmokėjimas:** Stripe Payment Link → po apmokėjimo grįžtama į svetainę → serveris
patikrina apmokėjimą Stripe ir iškart parodo kodą `APS-XXXX-XXXX-XXXX`. Sumokėjusiems pavedimu
kodą sukuriate `/api/admin.php`.

## 3. Organizacijoms (didžiausias potencialas)

Daugiausia sukčiavimo žalos patiria bankų, telekomunikacijų bendrovių ir savivaldybių gyventojai –
jiems apsauga verta daugiau nei pavieniam žmogui.

- **Bibliotekos, seniūnijos, senjorų centrai:** mokymai „Kaip atpažinti sukčius“ su „Apsauga“
  (pvz. 100–300 € už užsiėmimą), Plius kodai dalyviams.
- **Bankai, kredito unijos, ryšio operatoriai:** įrankis su jų logotipu ir oficialiais domenais,
  prioritetinis naujų schemų įtraukimas, metinė licencija.
- **Įmonės:** darbuotojų mokymai ir „Apsauga“ plėtinys visiems kompiuteriams.
- **Projektinis finansavimas:** ES skaitmeninio raštingumo programos, savivaldybių socialiniai projektai,
  bankų ir fondų socialinės atsakomybės programos (žr. laišką Tesonet).

## 4. Ko NEDARYTI

- Nedėti reklamų – jos gali vesti į sukčių svetaines ir griauna pasitikėjimą.
- Neparduoti ir nerinkti naudotojų duomenų.
- Nedaryti pagrindinės apsaugos mokamos – tai prieštarauja įrankio tikslui.
