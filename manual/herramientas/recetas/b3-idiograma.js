// ventana 1400x1000
/* Capítulo 3: la tarjeta «Idiograma» del chayote de Huatusco con las opciones por omisión (un cromosoma por par,
   micras, bandas y señales del Bloque 7). Cada vez que el idiograma se vuelve a dibujar, la app añade otro botón
   del estudio de figuras en su encabezado (error anotado); aquí se deja uno solo, como debe verse. */
(async () => {
  await bloque(3, 'sechium');
  const t = porId('b3IdioCard');
  [...t.querySelectorAll('.fig-head .lfs-open')].slice(1).forEach(b => b.remove());
  irA(t, 100); await W(600);
  return caja([t], 4);
})()
