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
  version: '1.2.0',
  feedbackUrl: ''
};
