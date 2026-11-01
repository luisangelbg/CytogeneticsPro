// ventana 1400x900
/* Capítulo 4: la tabla de índices calculada célula por célula (media ± de), sólo con los recomendados, y sus avisos */
(async () => {
  await bloque(4, 'sechium');
  const m = porId('b4Mode'); m.value = 'cells'; m.dispatchEvent(new Event('change')); await W(500);
  const s = porId('b4Set'); s.value = 'rec'; s.dispatchEvent(new Event('change')); await W(400);
  const t = porId('b4TableCard');
  irA(t, 100); await W(400);
  return caja([porId('b4Table'), porId('b4Msg')], 6);
})()
