/*
 * Apsauga – nustatymai, kuriuos keičia projekto savininkas.
 *
 * feedbackUrl – nuoroda į atsiliepimų formą (pvz. Google Forms „iš anksto užpildyta nuoroda“).
 * Į ją įrašomi šie žymekliai, kuriuos programėlė pakeičia tikromis reikšmėmis:
 *   {type}     feedback (vertinimas) arba report (pranešimas apie sukčius)
 *   {correct}  yes / no – ar įvertinimas buvo teisingas
 *   {verdict}  ok / warn / danger
 *   {reasons}  rastų požymių kodai, pvz. t_fine,url_risky_tld
 *   {text}     tikrintas tekstas – TIK jei žmogus pats pažymėjo „Pridėti tekstą“
 *   {lang}     lt / en
 *   {version}  programėlės versija
 * Kol nuoroda tuščia, atsiliepimų mygtukai nerodomi.
 * Kaip susikurti formą – žr. MVP.md, skyrių „Atsiliepimų forma“.
 */
window.APSAUGA_CONFIG = {
  version: '1.3.0',
  feedbackUrl: '',

  /*
   * Parama kūrėjams. Rodoma tik tai, kas užpildyta. Naudokite tik patikimas platformas –
   * šioje svetainėje niekada neprašome kortelės duomenų.
   * links: [{ label: 'Paremti per PayPal', url: 'https://www.paypal.com/donate/?hosted_button_id=...' },
   *         { label: 'Buy Me a Coffee', url: 'https://buymeacoffee.com/...' },
   *         { label: 'Revolut', url: 'https://revolut.me/...' }]
   * bank: { name: 'Gavėjo vardas', iban: 'LT00 0000 0000 0000 0000', purpose: 'Parama Apsaugai' }
   */
  donate: {
    links: [],
    bank: null
  }
};
