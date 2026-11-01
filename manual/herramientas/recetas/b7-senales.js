// ventana 1400x1000
/* Capítulo 7: la tarjeta Señales con la accesión de Uruapan (chayote), en la vista de los homólogos, con marcas */
(async () => {
  await bloque(7, 'sechium');
  const s = porId('b7AccSel'); s.value = 'uru'; s.dispatchEvent(new Event('change')); await W(600);
  const v = porId('b7View'); v.value = 'diploid'; v.dispatchEvent(new Event('change')); await W(600);
  const t = porId('b7SigCard');
  irA(t, 100); await W(600);
  const R = t.getBoundingClientRect(), p = 6;
  const m = (n, node, dx, dy) => { const r = node.getBoundingClientRect(); return [n, +((r.left + (dx || 0) - R.left + p) / (R.width + 2 * p) * 100).toFixed(1), +((r.top + r.height / 2 + (dy || 0) - R.top + p) / (R.height + 2 * p) * 100).toFixed(1)]; };
  window.__marcas = [
    m(1, porId('b7ClickProbe'), -14),
    m(2, porId('b7ClickHom'), -14),
    m(3, porId('b7View'), -14),
    m(4, porId('b7Idio').querySelector('svg') || porId('b7Idio'), 0, -20),
    m(5, porId('b7Signals').querySelector('table') || porId('b7Signals'), -14, -30),
  ];
  return caja([t], p);
})()
