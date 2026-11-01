// ventana 1400x1100
/* Capítulo 9: el simulador en la meiosis, paso «Metafase I», con 3 pares, entrecruzamiento y la orientación de la
   semilla 1 (la de inicio); la respuesta («Ver lo que hay que contar») abierta. Marcas en los controles. */
(async () => {
  await bloque(9);
  const k = porId('b9Kind'); k.value = 'meiosis'; k.dispatchEvent(new Event('change', { bubbles: true })); await W(300);
  for (let i = 0; i < 6; i++) { porId('b9Next').click(); await W(120); }
  porId('b9Answer').open = true; await W(300);
  const t = porId('b9SimCard');
  irA(t); await W(900);
  const R = t.getBoundingClientRect(), pad = 6, Wc = R.width + 2 * pad, Hc = R.height + 2 * pad;
  const m = (n, node, dx, dy) => { const r = node.getBoundingClientRect(); return [n, +((r.left - R.left + pad + (dx || 0)) / Wc * 100).toFixed(1), +((r.top - R.top + pad + r.height / 2 + (dy || 0)) / Hc * 100).toFixed(1)]; };
  const k0 = porId('b9Kind').closest('label'), n0 = porId('b9N'), sd = porId('b9Seed'), sl = porId('b9Step');
  window.__marcas = [m(1, k0, -24), m(2, n0, n0.getBoundingClientRect().width + 22), m(3, sd, sd.getBoundingClientRect().width + 24), m(4, porId('b9Prev'), -24), m(5, sl, sl.getBoundingClientRect().width - 30), m(6, porId('b9Sim'), 20, -60), m(7, porId('b9Counts'), -18)];
  return caja([t], pad);
})()
