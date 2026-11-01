// ventana 1400x1000
/* Capítulo 7: el mapa físico del par 9 de Uruapan (chayote): el sitio de ADNr 45S en un solo homólogo */
(async () => {
  await bloque(7, 'sechium');
  const s = porId('b7AccSel'); s.value = 'uru'; s.dispatchEvent(new Event('change')); await W(600);
  const p = porId('b7Pair'); p.value = '9'; p.dispatchEvent(new Event('change')); await W(500);
  const t = porId('b7MapCard');
  irA(t, 100); await W(500);
  return caja([t], 6);
})()
