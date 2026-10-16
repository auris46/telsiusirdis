/*
 * Apsauga – sukčiavimo atpažinimo variklis.
 * Veikia tik įrenginyje: jokie duomenys niekur nesiunčiami.
 * Naudojamas ir tinklapyje, ir naršyklės plėtinyje (globalThis.ScamDetector).
 *
 * Kiekvienas rastas požymis grąžinamas kaip { id, w, p } – id verčiamas į tekstą
 * per i18n.js, w – svoris (0–100), p – parametrai tekstui (pvz. prekės ženklas).
 */
(function (root) {
  'use strict';

  /* ---------- Oficialūs domenai ---------- */
  // keys – žodžiai, kuriais sukčiai dažnai apsimeta (adrese arba tekste)
  const BRANDS = [
    // Bankai ir mokėjimai
    { name: 'Swedbank', keys: ['swedbank'], domains: ['swedbank.lt', 'swedbank.com', 'swedbank.se', 'swedbank.ee', 'swedbank.lv'] },
    { name: 'SEB', keys: ['seb'], domains: ['seb.lt', 'seb.se', 'sebgroup.com', 'seb.ee', 'seb.lv'] },
    { name: 'Luminor', keys: ['luminor'], domains: ['luminor.lt', 'luminor.ee', 'luminor.lv', 'luminor.com'] },
    { name: 'Šiaulių bankas', keys: ['siauliubankas', 'siauliu'], domains: ['sb.lt'] },
    { name: 'Citadele', keys: ['citadele'], domains: ['citadele.lt', 'citadele.lv', 'citadele.ee'] },
    { name: 'Revolut', keys: ['revolut'], domains: ['revolut.com', 'revolut.me'] },
    { name: 'Paysera', keys: ['paysera'], domains: ['paysera.com', 'paysera.lt'] },
    { name: 'PayPal', keys: ['paypal'], domains: ['paypal.com', 'paypal.me'] },
    { name: 'Wise', keys: ['transferwise'], domains: ['wise.com', 'transferwise.com'] },
    { name: 'Smart-ID', keys: ['smartid', 'smart-id'], domains: ['smart-id.com'] },
    { name: 'Binance', keys: ['binance'], domains: ['binance.com'] },
    { name: 'Coinbase', keys: ['coinbase'], domains: ['coinbase.com'] },
    // Siuntos
    { name: 'DPD', keys: ['dpd'], domains: ['dpd.com', 'dpd.lt', 'dpdgroup.com', 'dpd.de', 'dpd.co.uk', 'dpd.pl', 'dpd.lv', 'dpd.ee'] },
    { name: 'Omniva', keys: ['omniva'], domains: ['omniva.lt', 'omniva.ee', 'omniva.lv', 'omniva.eu'] },
    { name: 'LP Express', keys: ['lpexpress'], domains: ['lpexpress.lt'] },
    { name: 'Lietuvos paštas', keys: ['lietuvospastas', 'lpastas'], domains: ['post.lt'] },
    { name: 'Venipak', keys: ['venipak'], domains: ['venipak.lt', 'venipak.com'] },
    { name: 'DHL', keys: ['dhl'], domains: ['dhl.com', 'dhl.lt', 'dhl.de', 'dhl.co.uk', 'dhl.pl'] },
    { name: 'UPS', keys: ['ups'], domains: ['ups.com'] },
    { name: 'FedEx', keys: ['fedex'], domains: ['fedex.com'] },
    { name: 'InPost', keys: ['inpost'], domains: ['inpost.pl', 'inpost.eu', 'inpost.co.uk', 'inpost.lt'] },
    { name: 'USPS', keys: ['usps'], domains: ['usps.com'] },
    { name: 'Royal Mail', keys: ['royalmail'], domains: ['royalmail.com'] },
    { name: 'Evri', keys: ['evri', 'hermes'], domains: ['evri.com'] },
    // Valstybė
    { name: 'Regitra', keys: ['regitra'], domains: ['regitra.lt'] },
    { name: 'VMI', keys: ['vmi'], domains: ['vmi.lt'] },
    { name: 'Sodra', keys: ['sodra'], domains: ['sodra.lt'] },
    { name: 'Policija', keys: ['policija'], domains: ['policija.lt'] },
    { name: 'E. valdžios vartai', keys: ['epaslaugos'], domains: ['epaslaugos.lt', 'lrv.lt'] },
    { name: 'GOV.UK', keys: ['govuk', 'hmrc', 'dvla'], domains: ['gov.uk'] },
    { name: 'IRS', keys: ['irs'], domains: ['irs.gov'] },
    // Ryšys ir komunalinės
    { name: 'Telia', keys: ['telia'], domains: ['telia.lt', 'telia.com', 'telia.se', 'telia.fi', 'telia.ee'] },
    { name: 'Bitė', keys: ['bite'], domains: ['bite.lt'] },
    { name: 'Tele2', keys: ['tele2'], domains: ['tele2.lt', 'tele2.com'] },
    { name: 'Ignitis', keys: ['ignitis'], domains: ['ignitis.lt'] },
    { name: 'ESO', keys: ['eso'], domains: ['eso.lt'] },
    // Technologijos ir parduotuvės
    { name: 'Microsoft', keys: ['microsoft', 'office365', 'outlook'], domains: ['microsoft.com', 'live.com', 'office.com', 'microsoftonline.com', 'outlook.com', 'office365.com', 'bing.com', 'skype.com'] },
    { name: 'Apple', keys: ['apple', 'icloud', 'appleid'], domains: ['apple.com', 'icloud.com'] },
    { name: 'Google', keys: ['google', 'gmail'], domains: ['google.com', 'google.lt', 'google.co.uk', 'google.de', 'google.pl', 'gmail.com', 'youtube.com', 'googleusercontent.com', 'googleapis.com', 'gstatic.com', 'withgoogle.com', 'blog.google', 'goo.gl'] },
    { name: 'Facebook', keys: ['facebook', 'meta'], domains: ['facebook.com', 'fb.com', 'meta.com', 'messenger.com', 'fb.me'] },
    { name: 'Instagram', keys: ['instagram'], domains: ['instagram.com'] },
    { name: 'WhatsApp', keys: ['whatsapp'], domains: ['whatsapp.com', 'whatsapp.net', 'wa.me'] },
    { name: 'Netflix', keys: ['netflix'], domains: ['netflix.com'] },
    { name: 'Amazon', keys: ['amazon'], domains: ['amazon.com', 'amazon.de', 'amazon.co.uk', 'amazon.pl', 'amazon.fr', 'amazon.it', 'amazon.es', 'amazon.se', 'amazon.nl'] },
    { name: 'Vinted', keys: ['vinted'], domains: ['vinted.lt', 'vinted.com', 'vinted.pl', 'vinted.de', 'vinted.fr', 'vinted.co.uk', 'vinted.lv', 'vinted.ee'] },
    { name: 'Skelbiu.lt', keys: ['skelbiu'], domains: ['skelbiu.lt'] },
    { name: 'OLX', keys: ['olx'], domains: ['olx.pl', 'olx.ua', 'olx.ro', 'olx.pt', 'olx.bg', 'olx.kz'] },
    { name: 'Bolt', keys: ['bolt'], domains: ['bolt.eu'] },
    { name: 'Steam', keys: ['steampowered', 'steamcommunity'], domains: ['steampowered.com', 'steamcommunity.com'] }
  ];

  // Antrojo lygio galūnės, kurias reikia laikyti „šalies“ dalimi (supaprastintas sąrašas)
  const MULTI_SUFFIX = new Set([
    'co.uk', 'org.uk', 'gov.uk', 'ac.uk', 'me.uk', 'com.au', 'net.au', 'org.au', 'gov.au', 'co.nz',
    'co.jp', 'com.br', 'com.pl', 'com.tr', 'co.za', 'com.ua', 'com.ru', 'com.mx', 'com.ar', 'co.in',
    'com.cn', 'com.hk', 'com.sg', 'co.kr', 'co.il', 'com.my', 'com.ph', 'com.ng', 'gov.lt'
  ]);

  const SHORTENERS = new Set([
    'bit.ly', 'tinyurl.com', 't.co', 'is.gd', 'cutt.ly', 'rb.gy', 't.ly', 'shorturl.at', 'ow.ly',
    's.id', 'rebrand.ly', 'tiny.cc', 'bit.do', 'v.gd', 'qrco.de', 'shorturl.gg', 'urlz.fr', 'clck.ru',
    'u.to', 'x.gd', 'tinu.be', 'lnk.to', 'surl.li', 'gg.gg', 'short.gy', 'buff.ly', 'tr.ee'
  ]);

  // Domenų galūnės, kurias dažniausiai renkasi sukčiai (pigios, anoniminės)
  const RISKY_TLDS = new Set([
    'top', 'xyz', 'icu', 'cyou', 'click', 'link', 'buzz', 'sbs', 'cfd', 'rest', 'online', 'site',
    'live', 'vip', 'life', 'support', 'help', 'monster', 'quest', 'lol', 'mom', 'bond', 'win',
    'loan', 'work', 'gq', 'ml', 'cf', 'tk', 'ga', 'pw', 'su', 'cam', 'shop', 'store', 'fun',
    'space', 'website', 'host', 'today', 'zip', 'mov', 'cn', 'cc', 'ws', 'one', 'world', 'run',
    'digital', 'services', 'center', 'info', 'biz', 'pro', 'asia', 'ink', 'pics', 'beauty',
    'hair', 'skin', 'makeup', 'boats', 'autos', 'homes', 'motorcycles', 'yachts', 'dad', 'qpon'
  ]);

  // Galūnės, kurios atpažįstamos tekste be „http://“ (kad „val.Jūs“ netaptų nuoroda)
  const TEXT_TLDS = new Set([
    'com', 'net', 'org', 'lt', 'lv', 'ee', 'pl', 'de', 'uk', 'ru', 'ua', 'by', 'eu', 'fr', 'it', 'es',
    'nl', 'be', 'se', 'no', 'fi', 'dk', 'us', 'ca', 'au', 'io', 'me', 'app', 'dev', 'co', 'tv', 'ly',
    'gl', 'gd', 'to', 'id', 'gy', 'li', 'at', 'ch', 'cz', 'sk', 'hu', 'ro', 'bg', 'gr', 'pt', 'ie',
    'tr', 'in', 'br', 'mx', 'jp', 'kr', 'gov', 'edu', 'ai', 'gg', 'la', 'fm', 'am', 'eu', 'is', 'ee'
  ].concat(Array.from(RISKY_TLDS)));

  const SUSPICIOUS_HOST_WORDS = [
    'login', 'log-in', 'signin', 'verify', 'verif', 'secure', 'update', 'account', 'konto', 'auth',
    'unlock', 'confirm', 'billing', 'wallet', 'support', 'refund', 'bauda', 'baudos', 'fine', 'toll',
    'parcel', 'delivery', 'redelivery', 'tracking', 'track', 'customs', 'muitas', 'siunt', 'pristat',
    'paket', 'payment', 'pay-', '-pay', 'mokej', 'grazin', 'kompens', 'bonus', 'prize', 'gift', 'promo',
    'airdrop', 'claim', 'recovery', 'restore', 'banking', 'ebank', 'ibank', 'online-'
  ];

  /* ---------- Tekstinės taisyklės (įvairios kalbos) ---------- */
  // Kiekviena taisyklė: id, svoris, critical (jei true – iškart „pavojinga“), šablonai
  const TEXT_RULES = [
    {
      id: 'asks_secret', w: 60, critical: true, negatable: true, re: [
        /\bpin\s?-?(kod|code|1|2)?\b/i, /slaptažod|slaptazod/i, /kodų kortel|kodu kortel/i,
        /smart-?id\s*(kod|code|pin)/i, /mobil(e|aus)?[- ]?(id|parašo)\s*(kod|pin)/i, /\bcvv\b|\bcvc\b|\bcv2\b/i,
        /kortelės (numer|duomen|galiojim)|korteles (numer|duomen)/i, /prisijungimo duomen/i,
        /\bpassword\b|\bpasscode\b/i, /one[- ]time (pass)?code|verification code|security code|\botp\b/i,
        /card (number|details)|expiry date/i, /(atsiųsk|atsiųskite|pasakyk|pasakykite|parašyk|parašykite|nurodykite|įveskite|iveskite|enter|send|tell|share)\b.{0,40}\b(kod|code|pin)/i,
        /пин[- ]?код|\bкод из смс|пароль|\bcvv/i, /hasł|kod blik|\bblik\b/i, /\bpasswort\b|\bgeheimzahl\b|\btan\b/i,
        /contraseña|clave\b|código de (verificación|seguridad)/i
      ]
    },
    {
      id: 'remote_access', w: 60, critical: true, re: [
        /anydesk|teamviewer|rustdesk|quick ?support|quickassist|supremo|ultraviewer|airdroid|screen ?shar|ekrano bendrin/i
      ]
    },
    {
      id: 'safe_account', w: 60, critical: true, re: [
        /saug(ią|ia|i|ioje) sąskait|saug(ią|ia) saskait|safe account|secure account|bezpieczne konto|безопасный сч[её]т|sicheres konto/i,
        /(pervesk|perveskite|perkelk|perkelkite).{0,40}(saug|kit(ą|a) sąskait)/i
      ]
    },
    {
      id: 'unusual_payment', w: 45, critical: false, re: [
        /dovanų kortel|dovanu kortel|gift ?card|google play kortel|itunes|steam card|paysafe ?card|western union|moneygram/i,
        /kriptovaliut|bitcoin|\bbtc\b|\busdt\b|tether|crypto ?wallet|криптовалют|биткоин/i
      ]
    },
    {
      id: 'fine', w: 30, re: [
        /\bbaud(a|ą|os|ų|ai|ą|oms)\b|nesumokėt|nesumoket|įsiskolinim|isiskolinim|skolą|\bskola\b|antstol|parkavim|greičio viršijim|kelių mokest|kelio mokest|vinjet|e-?vinjet/i,
        /\bfine\b|\bpenalty\b|\bunpaid\b|outstanding (balance|payment|toll)|toll (charge|payment|due)|parking (charge|ticket|fine)|speeding|tax refund|overdue/i,
        /штраф|задолженност|mandat|grzywn|opłat[ay] drogow|strafzettel|bußgeld|bussgeld|\bmulta\b|amende/i
      ]
    },
    {
      id: 'delivery', w: 25, re: [
        /siunt(a|inys|inį|inio|os)|pristatym|kurjer|muit(o|as|ą)|adresas (neišsam|neteising|nepilnas)|patikslinkite adres|sandėl/i,
        /\bparcel\b|\bpackage\b|\bdelivery\b|\bshipment\b|redeliver|customs (fee|charge|duty)|held at (our|the) (depot|warehouse)|incomplete address|tracking number/i,
        /посылк|доставк|przesyłk|paczk|\bpaket\b|zustellung|\bcolis\b|livraison|\bpaquete\b|envío/i
      ]
    },
    {
      id: 'account_threat', w: 30, re: [
        /(sąskait|saskait|kortel|paskyr|prieig)\S*\s.{0,30}(užblokuot|uzblokuot|sustabdyt|apribot|bus (užblokuota|uždaryta|ištrinta))/i,
        /(užblokuot|uzblokuot|sustabdyt|apribot)\S*\s.{0,30}(sąskait|saskait|kortel|paskyr)/i,
        /įtartin(a|i|ų) (veikl|operacij|prisijung)|itartin(a|i) (veikl|operacij)|patvirtinkite (savo )?tapatyb|atnaujinkite (savo )?duomen/i,
        /account (has been |is |was |will be )?(suspended|locked|blocked|limited|disabled|closed|deactivated)|unusual (activity|sign-?in)|suspicious (activity|login|transaction)|verify your (identity|account)|confirm your (identity|details|account)|update your (payment|billing|details)/i,
        /заблокирован|подозрительн(ая|ые) (операц|активн)|konto (zostało )?zablokowane|konto gesperrt/i
      ]
    },
    {
      id: 'urgency', w: 15, re: [
        /skubiai|nedelsiant|nedelsdami|šiandien pat|siandien pat|per (24|48|12|2) ?(val|valandas|h)|paskutin(is|ė|io) (įspėjim|kart|priminim|galimyb)|kitaip (bus|jūsų|jusu)|neatlikus|iki šiandien|liko \d+ (val|min)/i,
        /\burgent\b|immediately|within (24|48|12) ?(hours|hrs|h)\b|final (notice|warning|reminder)|act now|last chance|expires? today|as soon as possible/i,
        /срочно|немедленно|pilne|natychmiast|ostatnie (wezwanie|ostrzeżenie)|sofort|dringend|letzte mahnung|urgente|inmediatamente/i
      ]
    },
    {
      id: 'prize', w: 30, re: [
        /laimėjot|laimejot|laimėjai|laimejai|\bprizas\b|\bprizą\b|išlošėt|išlošei|dovana jums|nemokam(ai|a dovana)|grąžinim|grazinim|kompensacij|permoka|loterij/i,
        /you('ve| have)? won|\bwinner\b|congratulations|\bprize\b|free gift|claim (your|now)|cashback|refund (is )?(due|available|pending)|lottery|you are eligible/i,
        /выигр|приз|поздравляем|wygrał|nagroda|gewonnen|gewinnspiel|has ganado|premio/i
      ]
    },
    {
      id: 'investment', w: 40, re: [
        /investuok|investicij(os|ų) (galimyb|platform|pasiūlym)|garantuot(as|ą|a) (pelnas|pelną|grąža)|pelnas.{0,15}(kasdien|per dien|per savait|per mėn)|uždirbk|uzdirbk|uždirbti nuo namų|pasyvi(ų|as) pajam/i,
        /guaranteed (return|profit|income)|investment opportunity|double your (money|bitcoin|crypto)|trading (platform|signals|bot)|earn \$?\d+.{0,15}(per|a) (day|week)|passive income/i,
        /инвестиц|гарантированн(ый|ая) (доход|прибыль)|zarabiaj|inwestycj|gwarantowany zysk|garantierte rendite/i
      ]
    },
    {
      id: 'family_new_number', w: 45, re: [
        /(labas|sveika|sveikas)?,?\s*(mam(a|yte|ute)|tėti|teti|močiut|mociut)[,!.]?\s.{0,40}(naujas numer|nauj(ą|a) numer|sudužo|suduzo|sugedo|pamečiau|pamesiau|tai aš)/i,
        /(čia|cia|tai) (mano )?nauj(as|asis) numer|mano (senas )?telefonas (sudužo|suduzo|sugedo|pamestas)|įsirašyk(ite)? (šį|si|naują) numer/i,
        /(hi|hey|hello) (mum|mom|dad|mummy)\b|this is my new number|my (old )?phone (broke|is broken|was stolen|fell)|save (this|my new) number/i,
        /мама,? это я|мой новый номер|cześć mamo|to mój nowy numer|hallo mama|meine neue nummer/i
      ]
    },
    {
      id: 'move_chat', w: 20, re: [
        /(parašyk|parasyk|rašyk|susisiek|susisiekite|parašykite)\S*\s.{0,25}(whatsapp|telegram|viber|signal)/i,
        /(write|text|message|contact|add) me (on|via) (whatsapp|telegram|viber|signal)|continue (on|in) (whatsapp|telegram)/i,
        /напишите (мне )?в (whatsapp|telegram|ватсап|телеграм)/i
      ]
    },
    {
      id: 'authority', w: 25, re: [
        /banko (saugumo|apsaugos) (tarnyb|skyri)|policijos (pareigūn|pareigun|tyrėj)|tyrėj(as|a) .{0,20}(policij|fnt)|lietuvos bankas|interpol|europol|fntt/i,
        /(bank'?s? )?(security|fraud) (department|team|officer)|police officer|investigator|interpol|europol/i,
        /служба безопасности банка|сотрудник полиции/i
      ]
    },
    {
      id: 'money_request', w: 20, re: [
        /(pervesk|perveskite|sumokėk|sumokekite|sumokėkite|apmokėkite|apmokekite|paskolink|paskolinti|reikia pinigų|reikia pinigu|skubiai reikia)/i,
        /(send|transfer|wire|lend) (me )?(money|the money|\$|€|£|\d)|pay (now|the fee|a small fee|the outstanding)|i need (money|cash|help with a payment)/i,
        /переведи|переведите|оплатите|przelej|zapłać|überweise|überweisen|bezahlen sie/i
      ]
    },
    {
      id: 'small_amount', w: 10, re: [
        /\b\d{1,2}[.,]\d{2}\s?(€|eur\b|usd\b|\$|£|gbp\b|pln\b|zł|руб)|(€|\$|£)\s?\d{1,2}[.,]\d{2}\b/i
      ]
    },
    {
      id: 'job_offer', w: 25, re: [
        /darbas (iš|is) namų|nuotolinis darbas.{0,30}(\d+ ?€|eur)|uždarbis per dien|reikalingi darbuotojai.{0,40}(telegram|whatsapp)|patiktuk|like.{0,15}(užmokest|apmok)/i,
        /work from home.{0,40}(\$|€|£)\d+|earn.{0,20}(liking|rating) (videos|products|reviews)|part[- ]time job.{0,40}(whatsapp|telegram)|recruiter.{0,40}(whatsapp|telegram)/i
      ]
    },
    {
      id: 'romance', w: 20, re: [
        /mano brangioji|mano meile|mylimoji|nemokamas bilietas.{0,20}(atvykti|lėktuv)|kariuomenėj tarnaujantis|naftos platform/i,
        /my (dear|love|darling)\b.{0,60}(money|ticket|customs|fee|hospital)|stationed (in|abroad)|oil rig|peacekeeping mission/i
      ]
    },
    // „ClickFix“ – netikra CAPTCHA ar „klaidos taisymas“: liepia paspausti Win+R ir įklijuoti komandą.
    // 2025–2026 m. viena dažniausių kenkėjiškų programų platinimo schemų.
    {
      id: 'clickfix', w: 60, critical: true, re: [
        /(win(dows)?|⊞|logotipo klavi\S*)\s*(\+|ir|and|\s)\s*["„“']?r\b/i,
        /powershell|mshta|cmd(\.exe)?\s+\/c|curl\s+[^\s]+\s*\|\s*(ba|z)?sh|iex\s*\(|invoke-(webrequest|expression)/i,
        /(atidarykite|paleiskite|open)\s+(terminal|terminalą|run dialog|„vykdyti“|vykdymo lang)/i,
        /(įklijuokite|iklijuokite|paste)\s.{0,40}(terminal|powershell|run|vykdyti|komand)/i
      ]
    },
    // Skambutis / žinutė apie „naują įrenginį“ ar „įsilaužimą“ – po to liepiama nepasitikėti banku ar policija
    {
      id: 'fake_support', w: 35, re: [
        /(google|apple|microsoft|facebook|meta|bank\S*)\s.{0,30}(asistent|pagalb|palaikym|technin)\S*.{0,60}(nauj\S* įrengin|prijungtas|įsilauž|isilauz)/i,
        /(nauj\S* įrengin|naujas įrenginys).{0,40}(prijungtas|susietas|prisijungė)/i,
        /new device (was |has been )?(linked|added|connected|signed in)|your (apple id|google account|icloud) (is|was|has been) (locked|compromised|used)|tech(nical)? support (team|department)/i,
        /nesakykite (bankui|policijai|artimiesiems)|niekam apie tai nesakykite|don'?t tell (the bank|anyone|your family)/i
      ]
    },
    // Lojalumo taškai, prenumerata, mokestis grąžinamas – 2025–2026 m. masinis SMS masalas
    {
      id: 'points_expiring', w: 30, re: [
        /(taškai|tasku|taškų|bonus\S*|premij\S*)\s.{0,30}(baigia galioti|nustos galioti|pasibaigs|išnyks|bus panaikint)/i,
        /(points|rewards|miles|bonus)\s.{0,20}(expire|expiring|will be lost)|redeem (your|now)/i,
        /(prenumerat|abonement)\S*\s.{0,30}(sustabdyt|nepavyko apmokėti|nepavyko nuskaityti|baigėsi)|subscription (has been )?(suspended|expired|could not be renewed)|payment (failed|declined).{0,30}(update|renew)/i
      ]
    },
    // Pokalbio pradžia „suklydau numeriu“ – „kiaulių skerdimo“ (pig butchering) investicinė apgaulė
    {
      id: 'wrong_number', w: 20, re: [
        /(atsiprašau|atsiprasau|sorry)[,!.]?\s.{0,20}(suklydau numer|ne tas numer|neteisingas numer|wrong number)|is this (still )?\w+'s number\??|ar čia (vis dar )?\w+ numeris/i
      ]
    },
    // SIM / eSIM perėmimas
    {
      id: 'sim_swap', w: 45, critical: true, re: [
        /e-?sim\S*\s.{0,40}(aktyv|perkel|patvirtin|kod)|sim kortel\S*\s.{0,30}(keit|perkel|blokuo)|(activate|transfer|confirm) (your )?e-?sim|sim (swap|replacement|port)/i
      ]
    },
    // „Žinomas žmogus investuoja“ – dirbtinio intelekto (deepfake) reklamos
    {
      id: 'celebrity', w: 30, re: [
        /(elon musk|nausėd|nauseda|šimonyt|simonyt|zelensk|bill gates|lietuvos bank)\S*\s.{0,60}(investuo|investic|platform|pelną|uždirb|kripto|invest|profit|earn)/i,
        /(dirbtinis intelektas|ai|kvantin\S*|quantum)\s.{0,20}(prekybos|trading)\s.{0,10}(robot|bot|platform|sistem)/i
      ]
    },
    // QR kodai ant lipdukų (parkomatai, paspirtukai, krovimo stotelės) – „quishing“
    {
      id: 'qr_pay', w: 20, re: [
        /(nuskenuokite|nuskanuokite|skenuokite|scan)\s.{0,20}(qr|kod)\S*.{0,40}(apmok|sumok|mokėj|pay|bauda|fine|aktyv|parkav|parking)/i
      ]
    }
  ];

  /* ---------- Pagalbinės funkcijos ---------- */
  function stripDiacritics(s) {
    return s.normalize('NFD').replace(/[̀-ͯ]/g, '');
  }

  /* ---------- Tarptautiniai domenai (IDN) ir netikros raidės ---------- */
  // RFC 3492 „punycode“ dekodavimas: xn--pypal-4ve → pаypal (su kirilicos „а“)
  function punyDecode(label) {
    const base = 36, tMin = 1, tMax = 26, skew = 38, damp = 700;
    let n = 128, i = 0, bias = 72;
    const out = [];
    const d = label.lastIndexOf('-');
    for (let j = 0; j < Math.max(0, d); j++) out.push(label.charCodeAt(j));
    const digit = (c) => (c - 48 < 10 ? c - 22 : c - 65 < 26 ? c - 65 : c - 97 < 26 ? c - 97 : base);
    const adapt = (delta, num, first) => {
      let k = 0;
      delta = first ? Math.floor(delta / damp) : delta >> 1;
      delta += Math.floor(delta / num);
      for (; delta > ((base - tMin) * tMax) >> 1; k += base) delta = Math.floor(delta / (base - tMin));
      return Math.floor(k + ((base - tMin + 1) * delta) / (delta + skew));
    };
    for (let idx = d > 0 ? d + 1 : 0; idx < label.length;) {
      const oldi = i;
      for (let w = 1, k = base; ; k += base) {
        if (idx >= label.length) return null;
        const dg = digit(label.charCodeAt(idx++));
        if (dg >= base) return null;
        i += dg * w;
        const t = k <= bias ? tMin : k >= bias + tMax ? tMax : k - bias;
        if (dg < t) break;
        w *= base - t;
      }
      bias = adapt(i - oldi, out.length + 1, oldi === 0);
      n += Math.floor(i / (out.length + 1));
      i %= out.length + 1;
      out.splice(i++, 0, n);
    }
    return String.fromCodePoint.apply(null, out);
  }

  function decodeHost(host) {
    return host.split('.').map((l) => {
      if (!l.startsWith('xn--')) return l;
      const dec = punyDecode(l.slice(4));
      return dec == null ? l : dec;
    }).join('.');
  }

  // Raidės, kurios atrodo kaip lotyniškos (Unicode TR39 „confusables“ pagrindinė dalis)
  const CONFUSABLES = {
    'а': 'a', 'в': 'b', 'е': 'e', 'ё': 'e', 'к': 'k', 'м': 'm', 'н': 'h', 'о': 'o', 'р': 'p', 'с': 'c', 'т': 't',
    'у': 'y', 'х': 'x', 'ѕ': 's', 'і': 'i', 'ї': 'i', 'ј': 'j', 'ԁ': 'd', 'ԛ': 'q', 'ԝ': 'w', 'ӏ': 'l', 'ɡ': 'g',
    'һ': 'h', 'ո': 'n', 'ս': 'u', 'օ': 'o', 'α': 'a', 'β': 'b', 'ε': 'e', 'ι': 'i', 'κ': 'k', 'ν': 'v', 'ο': 'o',
    'ρ': 'p', 'τ': 't', 'υ': 'u', 'χ': 'x', 'ı': 'i', 'ɩ': 'i', 'ł': 'l', 'ƚ': 'l', 'ø': 'o', 'ð': 'd',
    'ɑ': 'a', 'ɒ': 'a', 'ʀ': 'r', 'ʏ': 'y', 'ᴄ': 'c', 'ᴅ': 'd', 'ᴇ': 'e', 'ᴋ': 'k', 'ᴍ': 'm', 'ᴏ': 'o', 'ᴘ': 'p',
    'ᴛ': 't', 'ᴜ': 'u', 'ᴠ': 'v', 'ᴡ': 'w', 'ᴢ': 'z'
  };
  function skeleton(s) {
    let out = '';
    for (const ch of s) out += CONFUSABLES[ch] || ch;
    return stripDiacritics(out).toLowerCase();
  }
  function scriptOf(ch) {
    if (/[a-z]/i.test(ch)) return 'latin';
    if (/[À-ɏḀ-ỿ]/.test(ch)) return 'latin';
    if (/[Ѐ-ӿԀ-ԯ]/.test(ch)) return 'cyrillic';
    if (/[Ͱ-Ͽ]/.test(ch)) return 'greek';
    if (/[԰-֏]/.test(ch)) return 'armenian';
    if (/[0-9-]/.test(ch)) return null;
    return 'other';
  }
  // Vienoje domeno dalyje sumaišytos skirtingos abėcėlės (pvz. lotynų + kirilica) – beveik visada apgaulė
  function mixedScripts(label) {
    const set = new Set();
    for (const ch of label) { const s = scriptOf(ch); if (s) set.add(s); }
    return set.size > 1;
  }

  function lev(a, b) {
    if (a === b) return 0;
    const m = a.length, n = b.length;
    if (Math.abs(m - n) > 2) return 3;
    let prev = new Array(n + 1), cur = new Array(n + 1);
    for (let j = 0; j <= n; j++) prev[j] = j;
    for (let i = 1; i <= m; i++) {
      cur[0] = i;
      for (let j = 1; j <= n; j++) {
        const c = a[i - 1] === b[j - 1] ? 0 : 1;
        cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + c);
        // perstatyti gretimi simboliai (paypla → paypal)
        if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) cur[j] = Math.min(cur[j], prev[j - 1]);
      }
      [prev, cur] = [cur, prev];
    }
    return prev[n];
  }

  // Skaitmenys ir raidžių poros, kurias sukčiai naudoja vietoj raidžių (paypa1, rnicrosoft, g00gle)
  function deHomoglyph(s) {
    return s.replace(/rn/g, 'm').replace(/vv/g, 'w').replace(/0/g, 'o').replace(/1/g, 'l')
      .replace(/3/g, 'e').replace(/4/g, 'a').replace(/5/g, 's').replace(/7/g, 't').replace(/8/g, 'b')
      .replace(/\|/g, 'l');
  }

  function registrable(host) {
    const parts = host.split('.');
    if (parts.length <= 2) return host;
    const last2 = parts.slice(-2).join('.');
    return MULTI_SUFFIX.has(last2) ? parts.slice(-3).join('.') : last2;
  }

  function isIp(host) {
    return /^\d{1,3}(\.\d{1,3}){3}$/.test(host) || host.startsWith('[') || /^0x[0-9a-f]+$/i.test(host) || /^\d{8,10}$/.test(host);
  }

  function officialBrand(host) {
    for (const b of BRANDS) {
      for (const d of b.domains) {
        if (host === d || host.endsWith('.' + d)) return b;
      }
    }
    return null;
  }

  function parseUrl(raw) {
    let s = String(raw || '').trim();
    if (!s) return null;
    if (!/^[a-z][a-z0-9+.-]*:\/\//i.test(s)) s = 'http://' + s;
    try {
      const u = new URL(s);
      if (!u.hostname) return null;
      return u;
    } catch (e) {
      return null;
    }
  }

  /* ---------- Nuorodos analizė ---------- */
  function analyzeUrl(raw, opts) {
    opts = opts || {};
    const u = parseUrl(raw);
    const signals = [];
    if (!u) return { valid: false, input: raw, signals: [{ id: 'url_invalid', w: 0 }], score: 0, level: 'none' };

    const host = u.hostname.toLowerCase().replace(/\.$/, '');
    const reg = registrable(host);
    const tld = host.split('.').pop();
    const official = officialBrand(host);
    const add = (id, w, p, critical) => signals.push({ id, w, p: p || {}, critical: !!critical });

    if (opts.blocklist && inList(host, opts.blocklist)) add('url_blocklisted', 100, { host }, true);

    if (isIp(host)) add('url_ip', 55, { host }, true);
    // Tarptautinis domenas: dekoduojame ir tikriname, ar netikros raidės neslepia prekės ženklo
    const decoded = decodeHost(host);
    if (decoded !== host) {
      const flatSkel = skeleton(decoded).replace(/[.-]/g, '');
      let idnBrand = null;
      for (const b of BRANDS) {
        if (b.keys.some((k) => k.replace(/-/g, '').length >= 4 && flatSkel.includes(k.replace(/-/g, '')))) { idnBrand = b; break; }
      }
      const mixed = decoded.split('.').some(mixedScripts);
      if (idnBrand) add('url_idn_brand', 70, { brand: idnBrand.name, decoded }, true);
      else if (mixed) add('url_idn_mixed', 55, { decoded }, true);
      else add('url_idn', 5, { decoded });
    }
    if (opts.feed && matchFeed(u, opts.feed)) add('url_blocklisted', 100, { host }, true);
    if (typeof opts.domainAgeDays === 'number' && !officialBrand(host)) {
      if (opts.domainAgeDays <= 7) add('url_new_domain', 45, { days: opts.domainAgeDays });
      else if (opts.domainAgeDays <= 30) add('url_new_domain', 30, { days: opts.domainAgeDays });
      else if (opts.domainAgeDays >= 365 * 3) add('url_old_domain', -10, { years: Math.floor(opts.domainAgeDays / 365) });
    }
    // „https://swedbank.lt@blogas.top“ – tikrasis adresas yra po @
    const rawStr = String(raw);
    if (u.username || /^[a-z]+:\/\/[^/]*@/i.test(rawStr)) add('url_at', 55, { host }, true);
    if (SHORTENERS.has(host) || SHORTENERS.has(reg)) add('url_shortener', 25, { host });

    if (official) {
      add('url_official', -40, { brand: official.name, host: reg });
    } else {
      if (RISKY_TLDS.has(tld)) add('url_risky_tld', 25, { tld: '.' + tld });

      // Prekės ženklas adrese, bet domenas ne oficialus
      const tokens = stripDiacritics(host).split(/[.-]/).filter(Boolean);
      const flat = stripDiacritics(host).replace(/[.-]/g, '');
      let impersonated = null, lookalike = null;
      for (const b of BRANDS) {
        for (const k of b.keys) {
          const key = k.replace(/-/g, '');
          if (key.length <= 4) {
            if (tokens.includes(key)) { impersonated = b; break; }
          } else if (flat.includes(key)) { impersonated = b; break; }
        }
        if (impersonated) break;
      }
      if (!impersonated) {
        outer:
        for (const t of tokens.concat([reg.split('.')[0]])) {
          if (t.length < 5) continue;
          const dh = deHomoglyph(t);
          for (const b of BRANDS) {
            for (const k of b.keys) {
              const key = k.replace(/-/g, '');
              if (key.length < 5) continue;
              if (dh === key || dh.includes(key) || lev(t, key) <= (key.length >= 8 ? 2 : 1)) {
                lookalike = b; break outer;
              }
            }
          }
        }
      }
      if (impersonated) add('url_brand_mismatch', 50, { brand: impersonated.name, host: reg }, true);
      else if (lookalike) add('url_lookalike', 60, { brand: lookalike.name, host: reg }, true);

      const words = SUSPICIOUS_HOST_WORDS.filter(w => host.includes(w));
      if (words.length) add('url_keywords', Math.min(30, 12 * words.length), { words: words.slice(0, 3).join(', ') });

      const depth = host.split('.').length;
      if (depth >= 5) add('url_deep', 15, { host });
      if ((decoded.replace(/xn--/g, '').match(/-/g) || []).length >= 3) add('url_hyphens', 10, { host });
      if (host.length > 40) add('url_long', 10, { host });
      if (/\d{4,}/.test(reg)) add('url_digits', 10, { host: reg });
      // Nemokami svetainių kūrėjai – labai mėgstami sukčių
      if (/(^|\.)(000webhostapp\.com|weebly\.com|wixsite\.com|webflow\.io|glitch\.me|netlify\.app|vercel\.app|pages\.dev|workers\.dev|firebaseapp\.com|web\.app|github\.io|blogspot\.com|ngrok(-free)?\.app|ngrok\.io|r2\.dev|square\.site|godaddysites\.com|duckdns\.org|repl\.co|herokuapp\.com|azurewebsites\.net|sites\.google\.com|forms\.gle|typedream\.app|framer\.website|teletype\.in|mystrikingly\.com|ipfs\.)/.test(host)) {
        add('url_free_host', 20, { host: reg });
      }
    }

    if (u.protocol === 'http:' && /^https?:\/\//i.test(rawStr)) add('url_no_https', 10, {});
    if (u.port && !['80', '443'].includes(u.port)) add('url_port', 15, { port: u.port });
    const path = (u.pathname + u.search).toLowerCase();
    if (!official && /(\.apk|\.exe|\.scr|\.msi|\.bat|\.js|\.vbs|\.iso)(\?|$)/.test(path)) add('url_download', 45, {}, true);
    if (!official && /(login|signin|verify|bank|account|wallet|pay|bauda|fine|parcel|track|customs|refund|secure|confirm)/.test(path)) add('url_path_keywords', 10, {});

    return finalize({ valid: true, input: raw, href: u.href, host, registrable: reg, official: official ? official.name : null, signals });
  }

  // Bendrinami serveriai (sites.google.com ir pan.) – blokuojame tik konkretų puslapį, ne visą serverį
  const SHARED_HOSTS = new Set([
    'sites.google.com', 'docs.google.com', 'drive.google.com', 'forms.gle', 'storage.googleapis.com',
    'firebasestorage.googleapis.com', 'dropbox.com', 'www.dropbox.com', 'dl.dropboxusercontent.com', 'onedrive.live.com',
    '1drv.ms', 'github.com', 'raw.githubusercontent.com', 'bit.ly', 'tinyurl.com', 'linktr.ee', 'notion.so', 'www.notion.so',
    'ipfs.io', 'cloudflare-ipfs.com', 'telegra.ph', 'docs.zoho.com', 'forms.office.com', 'sway.office.com', 'canva.com', 'www.canva.com'
  ]);

  function normUrl(u) {
    return (u.hostname.toLowerCase() + u.pathname.replace(/\/+$/, '')).toLowerCase();
  }

  // Grąžina { hosts: Set, urls: Set } iš sąrašo eilučių (domenai arba pilnos nuorodos)
  function buildFeed(lines) {
    const hosts = new Set(), urls = new Set();
    for (let line of lines) {
      line = String(line).trim();
      if (!line || line[0] === '#' || line[0] === '!') continue;
      // „0.0.0.0 blogas.lt“ (hosts failo formatas)
      const hm = /^(?:0\.0\.0\.0|127\.0\.0\.1)\s+(\S+)/.exec(line);
      if (hm) line = hm[1];
      const u = parseUrl(line);
      if (!u) continue;
      const h = u.hostname.toLowerCase();
      if (!h.includes('.') || h === 'localhost') continue;
      const hasPath = /^[a-z]+:\/\//i.test(line) && u.pathname.length > 1;
      if (SHARED_HOSTS.has(h)) {
        if (hasPath) urls.add(normUrl(u));
      } else if (!officialBrand(h)) {
        hosts.add(h);
      }
    }
    return { hosts, urls };
  }

  function matchFeed(u, feed) {
    if (typeof u === 'string') u = parseUrl(u);
    if (!u || !feed) return false;
    const h = u.hostname.toLowerCase();
    if (feed.hosts && !SHARED_HOSTS.has(h) && inList(h, feed.hosts)) return true;
    if (feed.urls && feed.urls.size) {
      const n = normUrl(u);
      const parts = n.split('/');
      for (let i = parts.length; i >= 2; i--) if (feed.urls.has(parts.slice(0, i).join('/'))) return true;
    }
    return false;
  }

  function inList(host, list) {
    if (!list) return false;
    const has = typeof list.has === 'function' ? (h) => list.has(h) : (h) => list.indexOf(h) !== -1;
    const parts = host.split('.');
    for (let i = 0; i < parts.length - 1; i++) {
      if (has(parts.slice(i).join('.'))) return true;
    }
    return false;
  }

  function finalize(res) {
    let score = 0, critical = false;
    for (const s of res.signals) { score += s.w; if (s.critical) critical = true; }
    score = Math.max(0, Math.min(100, score));
    res.score = score;
    res.critical = critical;
    res.level = critical || score >= 50 ? 'danger' : score >= 20 ? 'warn' : 'ok';
    res.signals.sort((a, b) => b.w - a.w);
    return res;
  }

  /* ---------- Teksto (SMS, el. laiško, žinutės) analizė ---------- */
  const URL_RE = /(?:https?:\/\/[^\s<>"'«»]+)|(?:www\.[^\s<>"'«»]+)|(?:\b(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+([a-z]{2,24})(?::\d{2,5})?(?:\/[^\s<>"'«»]*)?)/gi;

  function extractUrls(text) {
    const out = [];
    let m;
    URL_RE.lastIndex = 0;
    while ((m = URL_RE.exec(text))) {
      let s = m[0].replace(/[.,;:!?)\]}'"»]+$/, '');
      const before = text[m.index - 1];
      if (before === '@') continue; // el. pašto adresas
      if (!/^(https?:\/\/|www\.)/i.test(s)) {
        const tld = (m[1] || '').toLowerCase();
        if (!TEXT_TLDS.has(tld)) continue;
        if (/^\d+(\.\d+)+$/.test(s)) continue;
      }
      if (!out.includes(s)) out.push(s);
    }
    return out;
  }

  function mentionsBrand(text) {
    const t = stripDiacritics(text.toLowerCase());
    for (const b of BRANDS) {
      for (const k of b.keys) {
        const re = new RegExp('(^|[^a-z0-9])' + k.replace(/[-]/g, '[- ]?') + '([^a-z0-9]|$)', 'i');
        if (re.test(t)) return b;
      }
    }
    return null;
  }

  // „Niekam nesakykite PIN kodo“ – tai įspėjimas, o ne prašymas
  const NEGATION_RE = /(niekam|niekada|niekuomet|nesakyk|neatskleisk|nesidalink|neperduok|neįvesk|neivesk|never|do not|don't|dont|nobody|no one|will not ask|won't ask|никогда|никому|nigdy|nie podawaj|niemals|nunca)/i;
  function isNegated(text, idx) {
    return NEGATION_RE.test(text.slice(Math.max(0, idx - 60), idx));
  }

  function analyzeText(text, opts) {
    opts = opts || {};
    text = String(text || '');
    const signals = [];
    const hits = {};
    if (!text.trim()) return { score: 0, level: 'none', signals, urls: [] };

    for (const rule of TEXT_RULES) {
      for (const re of rule.re) {
        const m = text.match(re);
        if (m && rule.negatable && isNegated(text, m.index)) continue;
        if (m) {
          hits[rule.id] = true;
          signals.push({ id: 't_' + rule.id, w: rule.w, critical: !!rule.critical, p: { quote: m[0].trim().slice(0, 40) } });
          break;
        }
      }
    }

    const urls = extractUrls(text).map(u => analyzeUrl(u, opts));
    const brand = mentionsBrand(text);
    const anyBadUrl = urls.some(u => u.level !== 'ok');
    const allOfficial = urls.length > 0 && urls.every(u => u.official);

    if (urls.length) {
      const worst = urls.reduce((a, b) => (b.score > a.score ? b : a));
      if (worst.level === 'danger') signals.push({ id: 't_bad_link', w: 50, critical: true, p: { host: worst.host } });
      else if (worst.level === 'warn') signals.push({ id: 't_warn_link', w: 25, p: { host: worst.host } });
      // Žinutė mini prekės ženklą, bet nuoroda veda kitur
      if (brand && !urls.some(u => u.official === brand.name) && !allOfficial) {
        signals.push({ id: 't_brand_link_mismatch', w: 40, critical: true, p: { brand: brand.name, host: urls[0].host || urls[0].input } });
      }
      const pretext = hits.fine || hits.delivery || hits.account_threat || hits.prize || hits.asks_secret || hits.investment;
      if (pretext && !allOfficial) signals.push({ id: 't_link_pretext', w: 20, p: {} });
      if (allOfficial && !anyBadUrl) signals.push({ id: 't_official_links', w: -20, p: { brand: urls[0].official } });
    }

    // Siuntėjas – paprastas telefono numeris, bet apsimeta įstaiga
    const sender = String(opts.sender || '').trim();
    if (sender && /^\+?[\d\s()-]{7,}$/.test(sender) && (brand || hits.fine || hits.delivery || hits.account_threat)) {
      signals.push({ id: 't_sender_number', w: 20, p: { sender } });
    }
    if (sender && /^\+?[\d\s()-]{7,}$/.test(sender) && opts.homeCountryCode) {
      const digits = sender.replace(/[^\d+]/g, '');
      if (digits.startsWith('+') && !digits.startsWith('+' + opts.homeCountryCode)) {
        signals.push({ id: 't_sender_foreign', w: 15, p: { sender } });
      }
    }

    // Derinys: skubinimas + pinigai/duomenys – klasikinis sukčiavimo receptas
    if (hits.urgency && (hits.money_request || hits.asks_secret || hits.fine || hits.account_threat)) {
      signals.push({ id: 't_combo_pressure', w: 15, p: {} });
    }

    const letters = text.replace(/[^A-Za-zĄČĘĖĮŠŲŪŽąčęėįšųūž]/g, '');
    const caps = letters.replace(/[^A-ZĄČĘĖĮŠŲŪŽ]/g, '');
    if (letters.length > 25 && caps.length / letters.length > 0.6) signals.push({ id: 't_caps', w: 5, p: {} });

    const res = finalize({ signals, urls, brand: brand ? brand.name : null });
    return res;
  }

  /* ---------- Banko sąskaitos (IBAN) analizė ---------- */
  const IBAN_LEN = {
    AD: 24, AE: 23, AL: 28, AT: 20, AZ: 28, BA: 20, BE: 16, BG: 22, BH: 22, BR: 29, BY: 28, CH: 21, CR: 22,
    CY: 28, CZ: 24, DE: 22, DK: 18, DO: 28, EE: 20, EG: 29, ES: 24, FI: 18, FO: 18, FR: 27, GB: 22, GE: 22,
    GI: 23, GL: 18, GR: 27, GT: 28, HR: 21, HU: 28, IE: 22, IL: 23, IQ: 23, IS: 26, IT: 27, JO: 30, KW: 30,
    KZ: 20, LB: 28, LC: 32, LI: 21, LT: 20, LU: 20, LV: 21, MC: 27, MD: 24, ME: 22, MK: 19, MR: 27, MT: 31,
    MU: 30, NL: 18, NO: 15, PK: 24, PL: 28, PS: 29, PT: 25, QA: 29, RO: 24, RS: 22, SA: 24, SC: 31, SE: 24,
    SI: 19, SK: 24, SM: 27, ST: 25, SV: 28, TL: 23, TN: 24, TR: 26, UA: 29, VA: 22, VG: 24, XK: 20
  };

  // Lietuvos bankų kodai (5 skaitmenys po kontrolinių skaitmenų)
  const LT_BANKS = {
    '73000': 'Swedbank', '70440': 'SEB bankas', '40100': 'Luminor', '21400': 'Luminor',
    '71800': 'Šiaulių bankas', '72900': 'Citadele', '72300': 'Medicinos bankas', '32500': 'Revolut Bank',
    '35000': 'Paysera'
  };

  function ibanChecksumOk(iban) {
    const re = iban.slice(4) + iban.slice(0, 4);
    let rem = 0;
    for (const ch of re) {
      const v = /[A-Z]/.test(ch) ? (ch.charCodeAt(0) - 55).toString() : ch;
      for (const d of v) rem = (rem * 10 + Number(d)) % 97;
    }
    return rem === 1;
  }

  function analyzeIban(raw, opts) {
    opts = opts || {};
    const iban = String(raw || '').toUpperCase().replace(/[\s-]/g, '');
    const signals = [];
    const add = (id, w, p, critical) => signals.push({ id, w, p: p || {}, critical: !!critical });
    const info = { iban, formatted: iban.replace(/(.{4})/g, '$1 ').trim(), country: null, bank: null, valid: false };

    if (!iban) return { info, signals, score: 0, level: 'none' };
    if (!/^[A-Z]{2}\d{2}[A-Z0-9]+$/.test(iban)) {
      add('iban_format', 30, {});
    } else {
      info.country = iban.slice(0, 2);
      const expected = IBAN_LEN[info.country];
      if (!expected) add('iban_country_unknown', 25, { country: info.country });
      else if (iban.length !== expected) add('iban_length', 30, { len: iban.length, expected });
      else if (!ibanChecksumOk(iban)) add('iban_checksum', 35, {});
      else {
        info.valid = true;
        add('iban_valid', 0, { country: info.country });
      }
      if (info.country === 'LT' && iban.length >= 9) {
        const code = iban.slice(4, 9);
        info.bank = LT_BANKS[code] || null;
        if (!info.bank) add('iban_lt_unknown_bank', 5, { code });
      }
      if (info.country === 'BE' && iban.slice(4, 7) === '967') info.bank = 'Wise';
      if (info.country === 'GB' && /^GB\d{2}REVO/.test(iban)) info.bank = 'Revolut';
      if (info.country === 'GB' && /^GB\d{2}CLRB/.test(iban)) info.bank = 'Clear Junction';
    }

    const who = opts.who || '';
    const home = (opts.homeCountry || '').toUpperCase();
    if (who === 'bank') add('iban_who_bank', 70, {}, true);
    if (who === 'family') add('iban_who_family', 45, {});
    if (who === 'investment') add('iban_who_investment', 55, {}, true);
    if (who === 'romance') add('iban_who_romance', 60, {}, true);
    if (who === 'police') add('iban_who_police', 60, {}, true);
    if (who === 'gov' || who === 'courier') {
      add(who === 'gov' ? 'iban_who_gov' : 'iban_who_courier', 25, {});
      if (info.country && home && info.country !== home) add('iban_foreign_for_local', 35, { country: info.country, home });
    }
    if (who === 'seller') add('iban_who_seller', 15, {});
    if (who === 'job') add('iban_who_job', 50, {}, true);

    const res = finalize({ info, signals });
    return res;
  }

  /* ---------- Paskyros / profilio analizė ---------- */
  const PROFILE_FLAGS = {
    new_account: 15, few_friends: 10, stolen_photo: 25, asks_money: 40, investment: 40, moves_chat: 15,
    no_video: 20, pressure: 15, asks_codes: 60, duplicate: 45, no_verified: 15, other_payment_link: 55,
    love_fast: 25, too_good: 25
  };
  const CRITICAL_FLAGS = new Set(['asks_codes', 'other_payment_link']);

  function analyzeProfile(input) {
    input = input || {};
    const signals = [];
    const flags = input.flags || [];
    for (const f of flags) {
      if (PROFILE_FLAGS[f] != null) signals.push({ id: 'p_' + f, w: PROFILE_FLAGS[f], critical: CRITICAL_FLAGS.has(f), p: {} });
    }
    const name = stripDiacritics(String(input.name || '').toLowerCase().trim());
    if (name) {
      if (/\d{4,}/.test(name)) signals.push({ id: 'p_name_digits', w: 10, p: {} });
      const brand = mentionsBrand(name.replace(/[._]/g, ' '));
      const flat = name.replace(/[^a-z0-9]/g, '');
      let br = brand;
      if (!br) {
        for (const b of BRANDS) for (const k of b.keys) if (k.length >= 5 && flat.includes(k.replace(/-/g, ''))) { br = b; break; }
      }
      if (br && /(support|help|service|official|oficial|pagalb|klient|admin|security|saug|team|care|info|desk|centr|center|refund|verif)/.test(name)) {
        signals.push({ id: 'p_name_support', w: 45, critical: true, p: { brand: br.name } });
      } else if (br) {
        signals.push({ id: 'p_name_brand', w: 15, p: { brand: br.name } });
      }
    }
    let res = finalize({ signals });
    if (input.text && String(input.text).trim()) {
      const t = analyzeText(input.text, input.opts);
      res.signals = res.signals.concat(t.signals);
      res = finalize({ signals: res.signals, urls: t.urls });
    }
    return res;
  }

  /* ---------- Laukai, kuriuose PIN / kortelės duomenys (plėtiniui) ---------- */
  const FIELD_PIN_RE = /(^|[^a-z])(pin|pinkod|pin-?kod|pin1|pin2|pincode|pin_code|geheimzahl)([^a-z]|$)|пин|smart-?id.{0,10}(pin|kod)|kodų kortel/i;
  const FIELD_CARD_RE = /card.?num|cc-?num|cardnumber|kortel(ės|es)? ?(nr|numer)|kartennummer|numer karty|номер карты|pan\b/i;
  const FIELD_CVV_RE = /cvv|cvc|cv2|csc|security.?code|saugos kod|kod cvv/i;
  const FIELD_OTP_RE = /otp|one.?time|verification.?code|sms.?kod|patvirtinimo kod|2fa|auth.?code|tan\b/i;

  function classifyField(el) {
    if (!el || !el.tagName) return null;
    const tag = el.tagName.toLowerCase();
    if (tag !== 'input' && tag !== 'textarea') return null;
    const type = (el.getAttribute('type') || 'text').toLowerCase();
    if (['hidden', 'checkbox', 'radio', 'submit', 'button', 'image', 'file', 'range', 'color', 'date', 'email', 'search', 'url'].includes(type)) return null;
    const ac = (el.getAttribute('autocomplete') || '').toLowerCase();
    let label = '';
    try {
      if (el.labels) for (const l of el.labels) label += ' ' + l.textContent;
    } catch (e) { /* senos naršyklės */ }
    const hay = [el.name, el.id, el.getAttribute('placeholder'), el.getAttribute('aria-label'), label, ac, el.className && String(el.className)]
      .filter(Boolean).join(' ').toLowerCase();
    if (FIELD_PIN_RE.test(hay)) return 'pin';
    if (ac === 'cc-csc' || FIELD_CVV_RE.test(hay)) return 'cvv';
    if (ac === 'cc-number' || FIELD_CARD_RE.test(hay)) return 'card';
    if (ac === 'one-time-code' || FIELD_OTP_RE.test(hay)) return 'otp';
    if (type === 'password') {
      const max = Number(el.getAttribute('maxlength') || 0);
      const im = (el.getAttribute('inputmode') || '').toLowerCase();
      if ((max >= 4 && max <= 6) || im === 'numeric' || el.getAttribute('pattern') === '[0-9]*') return 'pin';
      return 'password';
    }
    return null;
  }

  const api = {
    BRANDS, analyzeUrl, analyzeText, analyzeIban, analyzeProfile, extractUrls, classifyField,
    registrable, officialBrand: (h) => { const b = officialBrand(String(h).toLowerCase()); return b ? b.name : null; },
    inList, ibanCountries: Object.keys(IBAN_LEN), decodeHost, skeleton, buildFeed, matchFeed, version: '1.1.0'
  };
  if (typeof module === 'object' && module.exports) module.exports = api;
  root.ScamDetector = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
