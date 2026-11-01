// ventana 1400x1000
/* Capítulo 7: el patrón de la accesión de Uruapan (chayote), la concordancia entre células y todas las accesiones */
(async () => {
  await bloque(7, 'sechium');
  const s = porId('b7AccSel'); s.value = 'uru'; s.dispatchEvent(new Event('change')); await W(600);
  const t = porId('b7SumCard');
  irA(t, 100); await W(500);
  return caja([t], 6);
})()
