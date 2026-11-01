// ventana 1400x1000
/* Capítulo 10: la tarjeta «Tablas» con el chayote: ocho tablas con sus filas, columnas y botones CSV y TSV */
(async () => {
  await bloque(10, 'sechium'); await W(2500);
  const t = porId('b10TabCard');
  irA(t); await W(900);
  return caja([t], 6);
})()
