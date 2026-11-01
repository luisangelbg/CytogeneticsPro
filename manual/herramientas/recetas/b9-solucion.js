// ventana 1400x1100
/* Capítulo 9: «Ver la solución» del ejercicio de la semilla 20261007 */
(async () => {
  await bloque(9);
  await Block9.newExercise(20261007); await W(800);
  porId('b9ExShow').click(); await W(600);
  const s = porId('b9ExSol');
  irA(s, 120); await W(900);
  return caja([s], 8);
})()
