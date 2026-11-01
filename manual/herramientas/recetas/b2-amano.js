// ventana 1400x1000
/* Capítulo 2: la tabla de una célula capturada a mano (la célula 2 del maíz de ejemplo), sólo sus primeras filas */
(async () => {
  await bloque(2, 'zea');
  Block2.select(state.cells[1].acc, state.cells[1].id); await W(600);
  const t = porId('b2TableCard'); irA(t, 120); await W(600);
  const rows = [...t.querySelectorAll('tbody tr')];
  return caja([t.querySelector('h2'), t.querySelector('.hint'), t.querySelector('thead'), rows[5]], 8);
})()
