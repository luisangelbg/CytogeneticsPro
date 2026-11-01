/* CytogeneticsPro — plant cytogenetics in the browser.
   Copyright (C) 2026  Luis Ángel Barrera-Guzmán

   This program is free software: you can redistribute it and/or modify it under
   the terms of the GNU General Public License as published by the Free Software
   Foundation, either version 3 of the License, or (at your option) any later
   version. It is distributed in the hope that it will be useful, but WITHOUT ANY
   WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR
   A PARTICULAR PURPOSE. See the GNU General Public License, in the file LICENSE
   at the root of this program, or <https://www.gnu.org/licenses/>. */

/* CytogeneticsPro — an editable table for records (Grid).
   The records of Blocks 5 to 8 are typed in tables: one row per cell, per
   individual, per signal or per taxon. Grid.make draws one bound to an array of plain
   objects (cfg.rows()): each change writes into the object and calls onChange;
   cfg.filter shows only some rows (those of one accession) while the array
   keeps all of them; a block of cells copied from a spreadsheet is pasted over
   the focused cell (adding rows as needed); rows are added and deleted; the
   table is exported to CSV and filled from a CSV whose headers name the columns.

   columns: [{ key, es, en, type: 'text' | 'num' | 'int' | 'select', options: [[value, es, en]] | () => [...],
               width, min, readOnly, get(row) (computed, read only), digits, csv, alias: [] }] */
(function () {
  'use strict';
  let seq = 0;

  function make(host, cfg) {
    const id = 'grid' + (++seq);
    const g = { host, cfg, id };
    const cols = cfg.columns;
    const all = () => cfg.rows();
    /* the visible rows as [row, index in the whole array] */
    const view = () => all().map((r, i) => [r, i]).filter(([r]) => !cfg.filter || cfg.filter(r));
    const label = c => T(c.es, c.en);
    const cellId = (r, c) => `${id}-${r}-${c}`;
    const newRow = () => (cfg.newRow ? cfg.newRow(all()) : {});
    function render() {
      const V = view();
      const head = cols.map(c => `<th${c.type === 'num' || c.type === 'int' || c.get ? ' class="num"' : ''} scope="col"${c.title ? ` title="${esc(T(c.title))}"` : ''}>${esc(label(c))}</th>`).join('');
      const body = V.map(([row, ri], vi) => '<tr>' + cols.map((c, ci) => {
        if (c.get) { const v = c.get(row); return `<td class="num">${v == null || v === '' || (typeof v === 'number' && !isFinite(v)) ? '—' : esc(typeof v === 'number' ? fmtNum(v, c.digits != null ? c.digits : 3) : v)}</td>`; }
        const v = row[c.key];
        const aria = `aria-label="${esc(label(c) + ' · ' + T('fila', 'row') + ' ' + (vi + 1))}"`;
        if (c.type === 'select') {
          const opts = (typeof c.options === 'function' ? c.options() : c.options).map(o => `<option value="${esc(o[0])}"${String(v) === String(o[0]) ? ' selected' : ''}>${esc(o[2] != null ? T(o[1], o[2]) : o[1])}</option>`).join('');
          return `<td><select id="${cellId(ri, ci)}" data-r="${ri}" data-c="${ci}" ${aria}>${opts}</select></td>`;
        }
        const numc = c.type === 'num' || c.type === 'int';
        return `<td${numc ? ' class="num"' : ''}><input type="${numc ? 'number' : 'text'}"${numc ? ` step="${c.type === 'int' ? 1 : 'any'}" min="${c.min != null ? c.min : 0}"` : ''} id="${cellId(ri, ci)}" data-r="${ri}" data-c="${ci}"` +
          ` value="${v == null || (numc && v === '') ? '' : esc(v)}"${c.width ? ` style="width:${c.width}"` : ''} ${aria}${c.readOnly ? ' readonly' : ''}></td>`;
      }).join('') + `<td><button type="button" class="icon-btn grid-del" data-del="${ri}" aria-label="${esc(T('Borrar la fila ', 'Delete row ') + (vi + 1))}" title="${esc(T('Borrar la fila', 'Delete the row'))}">×</button></td></tr>`).join('');
      host.innerHTML = `<div class="table-scroll tall"><table class="grid"><thead><tr>${head}<th><span class="sr-only">${esc(T('Acciones', 'Actions'))}</span></th></tr></thead><tbody>${body}</tbody></table></div>` +
        (V.length ? '' : `<p class="hint grid-empty">${esc(T(cfg.emptyEs || 'Sin filas todavía.', cfg.emptyEn || 'No rows yet.'))}</p>`) +
        `<div class="btn-row"><button type="button" class="btn btn-secondary btn-sm" data-act="add">${esc(T('+ Fila', '+ Row'))}</button>` +
        `<button type="button" class="btn btn-ghost btn-sm" data-act="csv">${esc(T('Exportar (CSV)', 'Export (CSV)'))}</button>` +
        `<button type="button" class="btn btn-ghost btn-sm" data-act="import">${esc(T('Importar CSV', 'Import CSV'))}</button>` +
        (V.length ? `<button type="button" class="btn btn-ghost btn-sm danger" data-act="clear">${esc(T('Vaciar', 'Clear'))}</button>` : '') +
        (cfg.extraButtons ? cfg.extraButtons() : '') + `<input type="file" accept=".csv,.tsv,.txt,text/csv" hidden data-act="file" aria-label="${esc(T('Archivo CSV', 'CSV file'))}"></div>`;
    }
    const commit = (keepFocus) => { if (cfg.onChange) cfg.onChange(); render(); if (keepFocus) { const n = document.getElementById(keepFocus); if (n) n.focus(); } };
    const parseVal = (c, v) => {
      if (c.type === 'num') { const n = num(v); return isFinite(n) ? n : ''; }
      if (c.type === 'int') { const n = num(v); return isFinite(n) ? Math.round(n) : ''; }
      return String(v == null ? '' : v).trim();
    };
    host.addEventListener('change', e => {
      if (e.target.matches('input[type=file][data-act="file"]')) { importFile(e.target); return; }
      const n = e.target.closest('[data-r]');
      if (!n) return;
      const row = all()[+n.dataset.r], c = cols[+n.dataset.c];
      if (!row || !c) return;
      row[c.key] = parseVal(c, n.value);
      commit(n.id);
    });
    host.addEventListener('click', e => {
      const d = e.target.closest('[data-del]');
      if (d) { all().splice(+d.dataset.del, 1); commit(); return; }
      const a = e.target.closest('[data-act]');
      if (!a || a.tagName === 'INPUT') return;
      if (a.dataset.act === 'add') {
        all().push(newRow());
        commit(cellId(all().length - 1, cols.findIndex(c => !c.get)));
      } else if (a.dataset.act === 'csv') download(toDelimited(toRows()), (typeof cfg.fileName === 'function' ? cfg.fileName() : cfg.fileName || 'tabla') + '.csv', 'text/csv;charset=utf-8');
      else if (a.dataset.act === 'import') host.querySelector('input[data-act="file"]').click();
      else if (a.dataset.act === 'clear') {
        if (!window.confirm(T('¿Borrar todas las filas de esta tabla?', 'Delete every row of this table?'))) return;
        const keep = all().filter(r => cfg.filter && !cfg.filter(r));
        all().splice(0, all().length, ...keep);
        commit();
      } else if (cfg.onAction) cfg.onAction(a.dataset.act);
    });
    host.addEventListener('paste', e => {
      const n = e.target.closest('input[data-r]');
      if (!n) return;
      const text = (e.clipboardData || window.clipboardData).getData('text');
      if (!/[\t\n]/.test(text)) return;
      e.preventDefault();
      const { rows: P } = parseDelimited(text);
      const V = view().map(v => v[1]);
      let vi = V.indexOf(+n.dataset.r);
      const ci0 = +n.dataset.c;
      const editable = cols.map((c, i) => i).filter(i => !cols[i].get);
      const start = editable.indexOf(ci0);
      P.forEach(pr => {
        let ri = V[vi];
        if (ri == null) { all().push(newRow()); ri = all().length - 1; V.push(ri); }
        pr.forEach((v, j) => { const ci = editable[start + j]; if (ci != null) all()[ri][cols[ci].key] = parseVal(cols[ci], v); });
        vi++;
      });
      commit();
      toast(T(`Se pegaron ${P.length} filas.`, `${P.length} rows pasted.`), 'success');
    });
    function toRows() {
      const vis = cols.filter(c => !c.noExport);
      return [vis.map(c => c.csv || c.key)].concat(view().map(([r]) => vis.map(c => { const v = c.get ? c.get(r) : r[c.key]; return typeof v === 'number' && !isFinite(v) ? '' : v; })));
    }
    async function importFile(input) {
      const f = input.files && input.files[0];
      input.value = '';
      if (!f) return;
      const n = importText(await readFileText(f));
      toast(n ? T(`Se leyeron ${n} filas de ${f.name}.`, `${n} rows read from ${f.name}.`) : T('El archivo no tenía columnas reconocibles.', 'The file had no recognizable columns.'), n ? 'success' : 'warning');
    }
    /* a CSV with headers: each header is matched with the key, the csv name, either label or an alias of a column */
    const norm = s => String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '');
    function importText(text) {
      const { rows: P } = parseDelimited(text);
      if (P.length < 2) return 0;
      const map = P[0].map(h => cols.findIndex(c => !c.get && [c.key, c.csv, c.es, c.en].concat(c.alias || []).filter(Boolean).some(x => norm(x) === norm(h))));
      if (!map.some(i => i >= 0)) return 0;
      let k = 0;
      P.slice(1).forEach(pr => {
        const r = newRow();
        pr.forEach((v, j) => { if (map[j] >= 0) r[cols[map[j]].key] = parseVal(cols[map[j]], v); });
        if (cfg.acceptRow ? cfg.acceptRow(r) : true) { all().push(r); k++; }
      });
      if (cfg.onChange) cfg.onChange();
      render();
      return k;
    }
    g.render = render; g.toRows = toRows; g.importText = importText; g.view = view;
    render();
    return g;
  }

  window.Grid = { make };
})();
