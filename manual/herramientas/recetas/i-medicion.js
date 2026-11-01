// ventana 1400x1000
/* Introducción: la metafase simulada del maíz en el editor del Bloque 2, con sus trazos */
(async () => {
  await bloque(2, 'zea');
  const t = tarjeta(2, I18N.lang === 'en' ? 'Measuring on the image' : 'Medición sobre la imagen');
  irA(t, 100); await W(1200);
  return caja([t], 4);
})()
