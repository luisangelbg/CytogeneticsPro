// ventana 1400x1000
/* Capítulo 8: los avisos de la matriz con «cada pareja con las variables que comparte» */
(async () => {
  await bloque(8, 'sechium');
  const s = porId('b8Missing'); s.value = 'pairwise'; s.dispatchEvent(new Event('change')); await W(700);
  const m = porId('b8Msg');
  irA(m, 150); await W(500);
  return caja([m], 8);
})()
