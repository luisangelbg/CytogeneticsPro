// ventana 1400x1000
/* Capítulo 6: el histograma del tetraploide con patrón de tomate, sus compuertas y la elección de picos, con marcas */
(async () => {
  await bloque(6, 'poly');
  const t = porId('b6HistCard');
  irA(t, 100); await W(600);
  const R = t.getBoundingClientRect(), p = 6;
  const m = (n, node, dx, dy) => { const r = node.getBoundingClientRect(); return [n, +((r.left + (dx || 0) - R.left + p) / (R.width + 2 * p) * 100).toFixed(1), +((r.top + r.height / 2 + (dy || 0) - R.top + p) / (R.height + 2 * p) * 100).toFixed(1)]; };
  window.__marcas = [
    m(1, porId('b6HistSel'), -14),
    m(2, porId('b6HistOpen'), -14),
    m(3, porId('b6HistFig').querySelector('svg') || porId('b6HistFig'), 30, -40),
    m(4, porId('b6Gates').querySelector('table'), -14),
    m(5, porId('b6GSample'), -14),
    m(6, porId('b6GAdd'), -14),
    m(7, porId('b6GateInfo'), -14),
  ];
  return caja([t], p);
})()
