// ventana 1400x1000
/* Capítulo 4: la tarjeta «Qué mide cada índice», con MCA abierto además del primero (TF%) */
(async () => {
  await bloque(4, 'sechium');
  const d = [...document.querySelectorAll('#b4Info details')];
  if (d[5]) d[5].open = true;
  const t = porId('b4InfoCard');
  irA(t, 100); await W(400);
  return caja([t], 4);
})()
