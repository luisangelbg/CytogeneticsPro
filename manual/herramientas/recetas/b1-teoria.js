// ventana 1400x1000
/* Capítulo 1: «La teoría, en lenguaje llano», con el primer tema abierto y el segundo también (las clases de Levan) */
(async () => {
  await W(1800);
  const ds = [...document.querySelectorAll('#theoryHost details')];
  if (ds[1]) ds[1].open = true;
  await W(400);
  const ns = seccion('theory'); irA(ns[0], 240); await W(700);
  return caja(ns, 8);
})()
