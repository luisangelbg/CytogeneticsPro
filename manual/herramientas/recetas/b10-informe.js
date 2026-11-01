// ventana 1400x1000
/* Capítulo 10: la tarjeta «Informe del proyecto» con el ejemplo del chayote: título del ejemplo, autoría vacía y
   los cuatro recuadros */
(async () => {
  await bloque(10, 'sechium'); await W(2500);
  const t = porId('b10RepCard');
  irA(t); await W(900);
  return caja([t], 6);
})()
