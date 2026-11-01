// ventana 1400x1000
/* Capítulo 7: el mapa físico del par 1 de Huatusco (chayote): ADNr 45S y CMA+ en el satélite (sólo la figura) */
(async () => {
  await bloque(7, 'sechium');
  const f = porId('b7Map');
  irA(porId('b7MapCard'), 100); await W(500);
  return caja([f.querySelector('svg') || f], 8);
})()
