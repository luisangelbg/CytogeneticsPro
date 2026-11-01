// ventana 1400x1000
/* Capítulo 8: la tabla «Otros taxones» del ejemplo del chayote, con su aviso */
(async () => {
  await bloque(8, 'sechium');
  const h = [...porId('b8MatCard').querySelectorAll('h3')].find(x => x.getBoundingClientRect().height > 0);
  irA(h, 100); await W(500);
  return caja([h, porId('b8Extra'), porId('b8Msg')], 8);
})()
