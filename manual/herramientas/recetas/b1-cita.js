// ventana 1400x1000
/* Capítulo 1: «Cómo citar», con el BibTeX desplegado (el título y el recuadro de la cita) */
(async () => {
  await W(1800);
  const d = document.querySelector('.cite-box details'); if (d) d.open = true;
  await W(300);
  const h = porId('cite'), box = document.querySelector('#panel-1 .cite-box');
  irA(h, 240); await W(700);
  return caja([h, box], 8);
})()
