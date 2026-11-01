// ventana 1400x1100
/* Capítulo 5: «Viabilidad del polen» del tetraploide de ejemplo, tinción y confianza por omisión */
(async () => {
  await bloque(5, 'poly');
  const s = porId('b5AccSel'); s.value = 'p4'; s.dispatchEvent(new Event('change')); await W(500);
  const t = porId('b5PolCard');
  t.querySelectorAll('.fig-head').forEach(h => [...h.querySelectorAll('.lfs-open')].slice(1).forEach(b => b.remove()));
  irA(t, 100); await W(400);
  return caja([t], 4);
})()
