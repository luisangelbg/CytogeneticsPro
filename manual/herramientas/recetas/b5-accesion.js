// ventana 1400x900
/* Capítulo 5: la tarjeta «Accesión» con la serie poliploide de ejemplo (población tetraploide) */
(async () => {
  await bloque(5, 'poly');
  const s = porId('b5AccSel'); s.value = 'p4'; s.dispatchEvent(new Event('change')); await W(500);
  const t = porId('b5Acc');
  irA(t, 100); await W(300);
  return caja([t], 4);
})()
