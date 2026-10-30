# Reklaminis video

| Failas | Paskirtis |
|---|---|
| `out/apsauga-reklama-9x16.mp4` | 30 s, 1080×1920, su muzika – Facebook / Instagram Reels, TikTok, YouTube Shorts, Stories |
| `out/apsauga-reklama-9x16-be-garso.mp4` | Tas pats be garso – jei norite pridėti muziką iš platformos bibliotekos |
| `out/virselis.jpg` | Viršelio kadras (rezultatas „PAVOJINGA“) |

Muzika ir garso efektai sugeneruoti programiškai (`music.py`) – jokių autorinių teisių apribojimų.
Svarbus tekstas laikomas tarp 250 ir 1600 px nuo viršaus, kad neuždengtų socialinių tinklų mygtukai.

## Įrašo tekstas

**LT:**
> Gavote SMS apie nesumokėtą baudą, siuntą ar „užblokuotą sąskaitą“? 🛑 Nespauskite nuorodos.
> Padarykite ekrano nuotrauką ir įkelkite į „Apsaugą“ – per 2 sekundes sužinosite, ar tai sukčiai.
> ✅ Nemokama ✅ Lietuviškai ✅ Žinutės tikrinamos jūsų telefone – niekur nesiunčiamos
> Pasidalinkite su tėvais ir seneliais – sukčiai dažniausiai taikosi į juos.
> 👉 [jūsų svetainės adresas]
>
> #sukčiai #saugumas #apsauga #sukčiavimas #Lietuva #senjorai #kibernetinissaugumas

**EN:**
> Got a text about an unpaid fine, a parcel or a “blocked account”? 🛑 Don’t tap the link.
> Take a screenshot and upload it to Apsauga – in 2 seconds you’ll know if it’s a scam.
> ✅ Free ✅ Private – checked on your phone ✅ No sign-up
> Share it with your parents and grandparents.
> 👉 [your website]
>
> #scam #fraud #cybersecurity #onlinesafety #smishing

## Patarimai skelbiant
- Pirmos 2 sekundės lemia, ar žiūrės toliau – video prasideda klausimu „Gavote tokią žinutę?“.
- Facebook reklamai rinkitės tikslinę auditoriją **35–65 m.** (vaikai, kurie saugo tėvus) ir **65+**.
- Įrašą prisekite (pin) savo puslapyje ir paprašykite pasidalinti bendruomenių grupėse.

## Kaip pakeisti ir sugeneruoti iš naujo
Tekstai ir scenos – `promo.html` (funkcija `render(t)`), muzika – `music.py`.
```sh
node apsauga/promo/render.js /tmp/kadrai 30
python3 apsauga/promo/music.py /tmp/muzika.wav
ffmpeg -framerate 30 -i /tmp/kadrai/%04d.jpg -i /tmp/muzika.wav -c:v libx264 -crf 20 -pix_fmt yuv420p \
  -c:a aac -b:a 160k -shortest -movflags +faststart apsauga/promo/out/apsauga-reklama-9x16.mp4
```
