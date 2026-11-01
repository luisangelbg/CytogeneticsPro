// ventana 1400x1000
/* Capítulo 3: la tarjeta «Idiograma» del chayote de Huatusco con las opciones por omisión (un cromosoma por par,
   micras, bandas y señales del Bloque 7) */
(async () => {
  await bloque(3, 'sechium');
  const t = porId('b3IdioCard');
  irA(t, 100); await W(600);
  return caja([t], 4);
})()
