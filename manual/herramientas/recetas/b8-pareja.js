// ventana 1400x1000
/* Capítulo 8: «Filas incompletas» en «cada pareja con las variables que comparte»: el dendrograma de las once filas y los avisos */
(async () => {
  await bloque(8, 'sechium');
  const s = porId('b8Missing'); s.value = 'pairwise'; s.dispatchEvent(new Event('change')); await W(700);
  const c = porId('b8CluCard');
  irA(c, 100); await W(500);
  return caja([c.querySelector('h2'), porId('b8Dendro'), porId('b8CluTiles')], 8);
})()
