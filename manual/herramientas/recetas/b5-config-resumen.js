// ventana 1400x1100
/* Capítulo 5: las cifras, el resumen por planta y la gráfica de configuraciones del tetraploide de ejemplo */
(async () => {
  await bloque(5, 'poly');
  const s = porId('b5AccSel'); s.value = 'p4'; s.dispatchEvent(new Event('change')); await W(500);
  const card = porId('b5ConfCard');
  const a = porId('b5ConfTiles'), f = card.querySelector('.fig-block');
  irA(a, 100); await W(400);
  return caja([a, porId('b5ConfSum'), f], 8);
})()
