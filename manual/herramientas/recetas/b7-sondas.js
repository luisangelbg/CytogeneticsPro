// ventana 1400x900
/* Capítulo 7: la tarjeta Accesión y sondas del Bloque 7 con el ejemplo del chayote (Huatusco) */
(async () => {
  await bloque(7, 'sechium');
  const t = porId('b7Acc');
  irA(t, 100); await W(400);
  return caja([t], 6);
})()
