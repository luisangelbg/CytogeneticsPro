// ventana 1400x900
/* Capítulo 3: la tarjeta «Ajustes del cariotipo» con el ejemplo del chayote (Huatusco), valores por omisión */
(async () => {
  await bloque(3, 'sechium');
  const t = porId('b3Settings');
  irA(t, 100); await W(400);
  return caja([t], 4);
})()
