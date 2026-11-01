// ventana 1400x1000
/* Capítulo 3: el tablero de homólogos del maíz de ejemplo, célula 2 (medidas directas: cromosomas dibujados a
   escala), con un cromosoma del par 3 seleccionado */
(async () => {
  await bloque(3, 'zea');
  const chip = [...document.querySelectorAll('#b3CellChips [data-cell]')][1];
  chip.click(); await W(500);
  const b = document.querySelector('#b3Board .kb-row[data-g="2"] .kb-chr');
  b.click(); await W(400);
  const t = porId('b3PairCard');
  irA(t, 100); await W(500);
  return caja([t], 4);
})()
