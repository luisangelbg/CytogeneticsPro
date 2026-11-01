// ventana 1600x1100
/* Capítulo 5: «Anormalidades por fase» del tetraploide de ejemplo */
(async () => {
  await bloque(5, 'poly');
  /* columnas más juntas para que la tabla quepa sin desplazamiento lateral a 1600 px */
  document.querySelector('main').style.maxWidth = 'none';
  { const st = document.createElement('style'); st.textContent = 'table:not(.grid) th, table:not(.grid) td { padding: 6px 5px !important; } '; document.head.appendChild(st); }
  const s = porId('b5AccSel'); s.value = 'p4'; s.dispatchEvent(new Event('change')); await W(500);
  const t = porId('b5PhaseCard');
  const sc = t.querySelector('#b5Phase .table-scroll'); if (sc) sc.style.maxHeight = '250px';
  t.querySelectorAll('.fig-head').forEach(h => [...h.querySelectorAll('.lfs-open')].slice(1).forEach(b => b.remove()));
  irA(t, 100); await W(400);
  return caja([t], 4);
})()
