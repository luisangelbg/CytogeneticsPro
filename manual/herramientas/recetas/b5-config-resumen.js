// ventana 1600x1100
/* Capítulo 5: las cifras, el resumen por planta y la gráfica de configuraciones del tetraploide de ejemplo */
(async () => {
  await bloque(5, 'poly');
  /* columnas más juntas para que la tabla quepa sin desplazamiento lateral a 1600 px */
  document.querySelector('main').style.maxWidth = 'none';
  { const st = document.createElement('style'); st.textContent = 'table:not(.grid) th, table:not(.grid) td { padding: 6px 5px !important; } '; document.head.appendChild(st); }
  const s = porId('b5AccSel'); s.value = 'p4'; s.dispatchEvent(new Event('change')); await W(500);
  const card = porId('b5ConfCard');
  card.querySelectorAll('.fig-head').forEach(h => [...h.querySelectorAll('.lfs-open')].slice(1).forEach(b => b.remove()));
  const a = porId('b5ConfTiles'), f = card.querySelector('.fig-block');
  irA(a, 100); await W(400);
  return caja([a, porId('b5ConfSum'), f], 8);
})()
