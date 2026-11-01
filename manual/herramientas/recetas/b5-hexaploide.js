// ventana 1400x900
/* Capítulo 5: la tabla de hipótesis del hexaploide de ejemplo con una tercera fórmula, AAAABB, y sus avisos */
(async () => {
  await bloque(5, 'poly');
  const s = porId('b5AccSel'); s.value = 'p6'; s.dispatchEvent(new Event('change')); await W(600);
  const h = porId('b5H3'); h.value = 'AAAABB'; h.dispatchEvent(new Event('change')); await W(400);
  const t = porId('b5HypCard');
  t.querySelector('.fig-block').style.display = 'none';
  irA(t, 100); await W(400);
  return caja([t.querySelector('.form-grid'), porId('b5Hyp'), porId('b5HypMsg')], 8);
})()
