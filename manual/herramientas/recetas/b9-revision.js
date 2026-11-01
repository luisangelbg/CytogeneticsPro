// ventana 1400x1100
/* Capítulo 9: el mismo ejercicio (semilla 20261007) contestado con dos errores a propósito: los cromosomas 5 y 10
   (par 4, st) se dan como sm, y los pares 4 y 5 se numeran al revés. Después «Revisar». */
(async () => {
  await bloque(9);
  await Block9.newExercise(20261007); await W(800);
  const ex = Block9.exercise;
  const swap = { 4: 5, 5: 4 };
  ex.chrs.forEach((c, i) => {
    const p = porId('b9ExP' + i), t = porId('b9ExT' + i);
    p.value = String(swap[c.pair] || c.pair); p.dispatchEvent(new Event('change', { bubbles: true }));
    t.value = c.pair === 4 ? 'sm' : c.type; t.dispatchEvent(new Event('change', { bubbles: true }));
  });
  porId('b9ExCheck').click(); await W(600);
  const t = porId('b9ExCard');
  irA(porId('b9ExCuts')); await W(900);
  return caja([porId('b9ExCuts'), porId('b9ExCheck'), porId('b9ExTiles'), porId('b9ExMsg')], 8);
})()
