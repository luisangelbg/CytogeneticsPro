// ventana 1400x900
/* Capítulo 6: la tarjeta Accesión del Bloque 6 con la serie poliploide, en la población tetraploide */
(async () => {
  await bloque(6, 'poly');
  const s = porId('b6AccSel'); s.value = 'p4'; s.dispatchEvent(new Event('change')); await W(600);
  const t = porId('b6Acc');
  irA(t, 100); await W(400);
  return caja([t], 6);
})()
