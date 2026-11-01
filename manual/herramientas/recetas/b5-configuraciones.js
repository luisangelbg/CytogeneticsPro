// ventana 1400x1000
/* Capítulo 5: la tabla de configuraciones del tetraploide de ejemplo (las primeras filas) */
(async () => {
  await bloque(5, 'poly');
  const s = porId('b5AccSel'); s.value = 'p4'; s.dispatchEvent(new Event('change')); await W(500);
  const t = porId('b5ConfCard');
  const sc = t.querySelector('#b5Conf .table-scroll'); if (sc) sc.style.maxHeight = '330px';
  irA(t, 100); await W(400);
  return caja([t.querySelector('h2'), porId('b5Conf')], 8);
})()
