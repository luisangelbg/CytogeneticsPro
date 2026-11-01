// ventana 1400x1100
/* Capítulo 9: el ejercicio de cariotipo con la semilla 20261007 (la de inicio) y 5 pares: la metafase y los recortes */
(async () => {
  await bloque(9);
  await Block9.newExercise(20261007); await W(800);
  const t = porId('b9ExCard');
  irA(t); await W(900);
  return caja([t.querySelector('h2'), porId('b9ExCuts')], 8);
})()
