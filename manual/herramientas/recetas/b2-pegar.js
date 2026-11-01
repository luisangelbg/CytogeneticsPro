// ventana 1400x1000
/* Capítulo 2: «Pegar medidas» en un proyecto nuevo, con el CSV que la propia app escribe para la célula 2 del maíz de
   ejemplo (botón «Esta célula (CSV)»), y el mensaje después de «Leer las medidas» */
(async () => {
  await bloque(2, 'zea');
  const txt = toDelimited(Block2.csvRows([state.cells[1]])).replace(/^﻿/, '');
  window.confirm = () => true;
  porId('b2NewProj').click(); await W(600);
  porId('b2PasteBtn').click(); await W(300);
  porId('b2PasteText').value = txt;
  const t = porId('b2Start'); irA(t, 240); await W(300);
  porId('b2PasteRead').click(); await W(300);
  porId('b2PasteBtn').click(); await W(300);   /* the box closes after reading: open it again to show the text */
  porId('b2PasteText').value = txt; await W(300);
  porId('b2PasteText').scrollTop = 0; irA(t, 240); await W(500);
  return caja([t], 4);
})()
