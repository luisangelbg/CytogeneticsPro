// ventana 1400x1000
/* Capítulo 6: los conteos de la población tetraploide (serie poliploide): las cifras, la frecuencia de los números
   contados y la tabla de todas las accesiones (sin la tabla de captura, que va arriba) */
(async () => {
  await bloque(6, 'poly');
  const s = porId('b6AccSel'); s.value = 'p4'; s.dispatchEvent(new Event('change')); await W(600);
  const a = porId('b6CountTiles'), b = porId('b6CountAll');
  irA(a, 100); await W(500);
  return caja([a, b], 8);
})()
