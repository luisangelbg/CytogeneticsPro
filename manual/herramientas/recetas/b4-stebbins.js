// ventana 1400x1000
/* Capítulo 4: la tarjeta «Categorías de Stebbins y dispersión» (cuadrícula y MCA × CVCL) con el chayote */
(async () => {
  await bloque(4, 'sechium');
  const t = porId('b4FigCard');
  t.querySelectorAll('.fig-head').forEach(h => [...h.querySelectorAll('.lfs-open')].slice(1).forEach(b => b.remove()));
  irA(t, 100); await W(500);
  return caja([t], 4);
})()
