/* CytogeneticsPro — plant cytogenetics in the browser.
   Copyright (C) 2026  Luis Ángel Barrera-Guzmán

   This program is free software: you can redistribute it and/or modify it under
   the terms of the GNU General Public License as published by the Free Software
   Foundation, either version 3 of the License, or (at your option) any later
   version. It is distributed in the hope that it will be useful, but WITHOUT ANY
   WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR
   A PARTICULAR PURPOSE. See the GNU General Public License, in the file LICENSE
   at the root of this program, or <https://www.gnu.org/licenses/>. */

/* CytogeneticsPro — the report (Report).
   - `methods(lang)`: the methods of the project written in Spanish or English,
     paragraph by paragraph, only for what the project has, with the sources
     cited by author and year and the full references at the end.
   - `tables()`: every table of the project (data and results) as rows, for
     CSV and TSV, the report and the package.
   - `karyogram(acc)`: the karyogram of one cell, with the chromosomes cut out
     of its image, straightened and ordered by pair.
   - `page`, `printHtml`: a standalone printable page (light, A4) and its
     printing from a hidden frame. */
(function () {
  'use strict';
  const has = () => ({
    cells: state.cells.filter(c => (c.chromosomes || []).length),
    karyo: state.accessions.filter(a => window.Block3 && Block3.karyo(a.id)),
    meiosis: state.meiosis.configs.length, tetrads: state.meiosis.tetrads.length, pollen: state.meiosis.pollen.length,
    counts: state.ploidy.counts.length, fcm: state.ploidy.fcm.length, mitosis: state.ploidy.mitosis.length,
    signals: state.bands.signals.length, compare: !!(window.Block8 && Block8.analyse().CL),
  });
  /* the full reference of an author–year citation, from the list of Home */
  function refFor(cite) {
    const m = /^(\S+?)(?:\s|,).*?(\d{4})/.exec(cite.replace(/^Barrera-Guzmán.*/, ''));
    if (!m || !window.Home) return null;
    const first = m[1].replace(/,$/, '');
    const r = Home.REFS.find(x => x[0].startsWith(first) && x[0].includes(m[2] + '.'));
    return r ? r[0] : null;
  }
  const stripTags = s => String(s).replace(/<[^>]+>/g, '');
  /* the name of a variable of the comparison in the language of the methods */
  function varName(k, L) {
    const N = { n2: ['2n', '2n'], THL: ['la longitud de un juego (THL)', 'the length of one set (THL)'], C2: ['el contenido 2C', 'the 2C content'], TF: ['TF%', 'TF%'] };
    if (k.startsWith('site:')) { const p = Bands.probe(k.slice(5)); return (L ? 'the sites of ' : 'los sitios de ') + (p ? p.name : k.slice(5)); }
    return N[k] ? N[k][L ? 1 : 0] : k;
  }
  const list = (arr, L) => arr.length <= 1 ? arr.join('') : arr.slice(0, -1).join(', ') + (L ? ' and ' : ' y ') + arr[arr.length - 1];

  /* ---------------- written methods ---------------- */
  function methods(lang) {
    const L = lang === 'en', w = (es, en) => (L ? en : es), H = has(), P = [], cites = new Set();
    const cite = (...c) => { c.forEach(x => cites.add(x)); return c.join('; '); };
    const nAcc = H.karyo.length, nCells = H.cells.length;
    if (state.meta && state.meta.example) P.push(w('Nota: los datos de este proyecto son simulados (un ejemplo de la aplicación); no son mediciones reales.', 'Note: the data of this project are simulated (an example of the application); they are not real measurements.'));
    if (nCells) {
      const nChr = H.cells.reduce((s, c) => s + c.chromosomes.length, 0), withImg = H.cells.filter(c => c.image).length;
      const taxa = [...new Set(state.accessions.filter(a => H.cells.some(c => c.acc === a.id)).map(a => a.taxon).filter(Boolean))];
      P.push(w(`Se midieron ${nChr} cromosomas en ${nCells} células metafásicas de ${plural(new Set(H.cells.map(c => c.acc)).size, 'accesión', 'accesiones')}${taxa.length ? ' (' + taxa.map(t => '<i>' + esc(t) + '</i>').join(', ') + ')' : ''}${withImg ? `, ${withImg === nCells ? 'todas' : withImg} sobre fotomicrografías calibradas con una barra de escala` : ''}. En cada cromosoma se trazó la línea media siguiendo su curvatura y se marcaron el centrómero y, cuando la hubo, la constricción secundaria${Block3.settings().includeSat ? '; la longitud del satélite se sumó a la de su brazo' : '; los satélites no se sumaron a su brazo'}.`,
        `${nChr} chromosomes were measured in ${nCells} metaphase cells of ${(k => k + (k === 1 ? ' accession' : ' accessions'))(new Set(H.cells.map(c => c.acc)).size)}${taxa.length ? ' (' + taxa.map(t => '<i>' + esc(t) + '</i>').join(', ') + ')' : ''}${withImg ? `, ${withImg === nCells ? 'all' : withImg} on photomicrographs calibrated with a scale bar` : ''}. In each chromosome the midline was traced along its curvature and the centromere and, when present, the secondary constriction were marked${Block3.settings().includeSat ? '; the length of the satellite was added to its arm' : '; satellites were not added to their arm'}.`));
    }
    if (nAcc) {
      const S = Block3.settings(), sch = typeof S.scheme === 'string' ? Karyo.SCHEMES[S.scheme] : null;
      const scheme = sch ? narr(cite(sch.ref)) : w('límites definidos por el usuario', 'limits defined by the user');
      const forms = H.karyo.map(a => { const K = Block3.karyo(a.id); return `${esc(accName(a.id))}: ${esc(K.formula)}, ${w('longitud haploide', 'haploid length')} ${fmtFixed(K.thl, 2)} ${esc(K.unit || 'µm')}`; });
      P.push(w(`Los homólogos se emparejaron por longitud e índice centromérico y se revisaron a mano; los valores de cada par son la media (± desviación estándar) entre células. Se calcularon la longitud absoluta y relativa (porcentaje del juego haploide), el índice centromérico (IC = 100 p / (p + q)) y la razón de brazos (r = q / p), y los cromosomas se clasificaron según ${scheme}${S.scheme === 'levan' ? ' (el valor justo en un límite se asignó a la clase más mediana)' : ''}. El número fundamental contó dos brazos en los cromosomas m y sm y ${S.stArms === 2 ? 'dos' : 'uno'} en los st y t. Fórmulas cariotípicas: ${forms.join('; ')}.`,
        `Homologues were paired by length and centromeric index and checked by hand; the values of each pair are the mean (± standard deviation) among cells. Absolute and relative length (percentage of the haploid set), centromeric index (CI = 100 p / (p + q)) and arm ratio (r = q / p) were computed, and the chromosomes were classified after ${scheme}${S.scheme === 'levan' ? ' (a value exactly on a limit was assigned to the more median class)' : ''}. The fundamental number counted two arms in m and sm chromosomes and ${S.stArms === 2 ? 'two' : 'one'} in st and t. Karyotype formulas: ${forms.join('; ')}.`));
      const As = H.karyo.map(a => ({ a, r: Block4.asym(a.id) })).filter(x => x.r);
      if (As.length) {
        const vals = As.map(x => `${esc(accName(x.a.id))}: MCA = ${fmtFixed(x.r.R.MCA, 2)}, CVCL = ${fmtFixed(x.r.R.CVCL, 2)}, CVCI = ${fmtFixed(x.r.R.CVCI, 2)}, ${w('categoría', 'category')} ${esc(x.r.R.stebbins)}`);
        P.push(w(`La asimetría del cariotipo se describió con el índice MCA (${cite('Peruzzi y Eroğlu 2013')}) y los coeficientes de variación CVCL y CVCI (${cite('Paszko 2006')}), como recomiendan Peruzzi y Eroğlu (2013); se dan también TF% (${cite('Huziwara 1962')}), AsK% (${cite('Arano 1963')}), Syi y Rec (${cite('Greilhuber y Speta 1976')}), A1 y A2 (${cite('Romero Zarco 1986')}), A (${cite('Watanabe et al. 1999')}) y las categorías de ${narr(cite('Stebbins 1971'))}. Los coeficientes de variación usan la desviación ${state.settings.pop ? 'poblacional (n)' : 'muestral (n − 1)'}. ${vals.join('; ')}.`,
          `Karyotype asymmetry was described with the MCA index (${cite('Peruzzi y Eroğlu 2013').replace(' y ', ' and ')}) and the coefficients of variation CVCL and CVCI (Paszko 2006), as recommended by Peruzzi and Eroğlu (2013); TF% (Huziwara 1962), AsK% (Arano 1963), Syi and Rec (Greilhuber and Speta 1976), A1 and A2 (Romero Zarco 1986), A (Watanabe et al. 1999) and the categories of Stebbins (1971) are also given. The coefficients of variation use the ${state.settings.pop ? 'population (n)' : 'sample (n − 1)'} standard deviation. ${vals.join('; ')}.`));
      }
    }
    if (H.meiosis || H.tetrads || H.pollen) {
      const parts = [];
      if (H.meiosis) {
        cite('Sybenga 1975');
        const nc = state.meiosis.configs.length;
        parts.push(w(`En ${nc} células en metafase I se registraron las configuraciones (univalentes, bivalentes en varilla y en anillo, multivalentes) y se estimaron los quiasmas por célula y por bivalente y el índice de recombinación (n + quiasmas por célula) (${cite('Sybenga 1975')}; ${cite('Colombo 1992')})`,
          `In ${nc} metaphase I cells the configurations (univalents, rod and ring bivalents, multivalents) were recorded and the chiasmata per cell and per bivalent and the recombination index (n + chiasmata per cell) were estimated (Sybenga 1975; Colombo 1992)`));
        if (state.meiosis.hyp) parts.push(w(`las frecuencias observadas se compararon con las esperadas bajo un modelo de apareamiento al azar de los extremos de los homólogos según la fórmula genómica (${cite('Jackson y Casey 1982')}), con una prueba de χ²`, `the observed frequencies were compared with those expected under a model of random pairing of the ends of the homologues according to the genomic formula (Jackson and Casey 1982), with a χ² test`));
      }
      if (H.tetrads) parts.push(w(`el índice meiótico se calculó como el porcentaje de tétradas normales (${cite('Love 1951')}), con intervalos de ${cite('Wilson 1927')}`, `the meiotic index was computed as the percentage of normal tetrads (Love 1951), with Wilson (1927) intervals`));
      if (H.pollen) parts.push(w(`la viabilidad del polen se estimó por tinción diferencial (${cite('Alexander 1969')}) con intervalos de Wilson (1927) y de ${cite('Clopper y Pearson 1934')}, y la homogeneidad entre plantas con las pruebas de χ² y G (${cite('Sokal y Rohlf 1995')})`, `pollen viability was estimated by differential staining (Alexander 1969) with Wilson (1927) and Clopper and Pearson (1934) intervals, and the homogeneity among plants with χ² and G tests (Sokal and Rohlf 1995)`));
      P.push(cap(parts.join('; ')) + '.');
    }
    if (H.counts || H.fcm || H.mitosis) {
      const parts = [];
      if (H.counts) {
        const per = state.accessions.map(a => ({ a, C: Ploidy.counts(state.ploidy.counts.filter(r => r.acc === a.id)) })).filter(x => x.C);
        cite('Guerra 2008');
        parts.push(w(`El número cromosómico se determinó como la moda de ${state.ploidy.counts.length} células contadas (${per.map(x => `${esc(accName(x.a.id))}: 2n = ${x.C.mode != null ? x.C.mode : '?'}`).join('; ')}); el nivel de ploidía se dedujo del número básico x del grupo (${cite('Guerra 2008')})`,
          `The chromosome number was determined as the mode of ${state.ploidy.counts.length} counted cells (${per.map(x => `${esc(accName(x.a.id))}: 2n = ${x.C.mode != null ? x.C.mode : '?'}`).join('; ')}); the ploidy level was inferred from the base number x of the group (Guerra 2008)`));
      }
      if (H.fcm) {
        cite('Doležel, Greilhuber y Suda 2007', 'Doležel et al. 2003', 'Greilhuber et al. 2005');
        const per = state.accessions.map(a => { const g = state.ploidy.fcm.filter(r => r.acc === a.id).map(r => Block6.run(r)).filter(Boolean).map(r => r.c2).filter(isFinite); return { a, g }; }).filter(x => x.g.length);
        parts.push(w(`el contenido de ADN nuclear se estimó por citometría de flujo con un estándar interno procesado junto con la muestra (${'Doležel, Greilhuber y Suda 2007'}): 2C = (pico G1 de la muestra / pico G1 del estándar) × 2C del estándar, con 1 pg = 978 Mpb (${'Doležel et al. 2003'}) y la terminología de ${'Greilhuber et al. 2005'} (${per.map(x => `${esc(accName(x.a.id))}: 2C = ${fmtFixed(Stats.mean(x.g), 2)} pg`).join('; ')})`,
          `nuclear DNA content was estimated by flow cytometry with an internal standard processed together with the sample (Doležel, Greilhuber and Suda 2007): 2C = (sample G1 peak / standard G1 peak) × standard 2C, with 1 pg = 978 Mbp (Doležel et al. 2003) and the terminology of Greilhuber et al. 2005 (${per.map(x => `${esc(accName(x.a.id))}: 2C = ${fmtFixed(Stats.mean(x.g), 2)} pg`).join('; ')})`));
      }
      if (H.mitosis) {
        cite('Fiskesjö 1985', 'Leme y Marin-Morales 2009', 'Holm 1979');
        parts.push(w('en la prueba de <i>Allium</i> (Fiskesjö 1985; Leme y Marin-Morales 2009) se calcularon el índice mitótico, la proporción de cada fase, el índice de aberraciones y la frecuencia de micronúcleos por tratamiento, y cada tratamiento se comparó con el testigo con una prueba de dos proporciones corregida por Holm (1979)',
          'in the <i>Allium</i> test (Fiskesjö 1985; Leme and Marin-Morales 2009) the mitotic index, the proportion of each phase, the aberration index and the micronucleus frequency were computed per treatment, and each treatment was compared with the control with a two-proportion test corrected by Holm (1979)'));
      }
      P.push(cap(parts.join('; ')) + '.');
    }
    if (H.signals) {
      cite('Guerra 2000', 'Jiang y Gill 2006');
      const used = Bands.probes().filter(p => state.bands.signals.some(s => s.probe === p.id)).map(p => esc(p.name));
      P.push(w(`Las bandas y señales (${list(used, L)}) se registraron por par, homólogo, brazo y posición relativa desde el centrómero (0) hasta el telómero (1), y se clasificaron como proximales (< 1/3 del brazo), intersticiales o terminales (> 0.8) (Guerra 2000; Jiang y Gill 2006); un sitio presente en un solo homólogo se contó como heteromorfismo.`,
        `Bands and signals (${list(used, L)}) were recorded by pair, homologue, arm and relative position from the centromere (0) to the telomere (1), and classed as proximal (< 1/3 of the arm), interstitial or terminal (> 0.8) (Guerra 2000; Jiang and Gill 2006); a site present on one homologue only was counted as a heteromorphism.`));
    }
    if (H.compare) {
      const A = Block8.analyse(), s = Block8.settings(), names = A.V.map(k => varName(k, L));
      const nExtra = A.use.filter(r => r.kind === 'extra').length;
      cite('Peruzzi y Altınordu 2014', s.dist === 'euclid' ? 'Sneath y Sokal 1973' : 'Gower 1971', s.method === 'ward' ? 'Ward 1963' : 'Sneath y Sokal 1973', 'Sokal y Rohlf 1962');
      let t = w(`Las ${A.use.length} accesiones y taxones${nExtra ? ` (${nExtra} tomados de la literatura)` : ''} se compararon con ${list(names.map(esc), L)} (${'Peruzzi y Altınordu 2014'}), mediante ${s.dist === 'euclid' ? 'la distancia euclidiana sobre valores estandarizados' : 'la distancia de Gower (Gower 1971)'} y un agrupamiento ${s.method === 'ward' ? 'de Ward (Ward 1963)' : 'UPGMA (Sneath y Sokal 1973)'}; la correlación cofenética fue r = ${fmtFixed(A.coph, 3)} (Sokal y Rohlf 1962).`,
        `The ${A.use.length} accessions and taxa${nExtra ? ` (${nExtra} taken from the literature)` : ''} were compared with ${list(names.map(esc), L)} (Peruzzi and Altınordu 2014), by ${s.dist === 'euclid' ? 'the Euclidean distance on standardized values' : 'the Gower distance (Gower 1971)'} and ${s.method === 'ward' ? 'Ward clustering (Ward 1963)' : 'UPGMA clustering (Sneath and Sokal 1973)'}; the cophenetic correlation was r = ${fmtFixed(A.coph, 3)} (Sokal and Rohlf 1962).`);
      if (A.P) { cite('Jolliffe 2002', 'Gabriel 1971'); t += ' ' + w(`Un análisis de componentes principales de la matriz de correlaciones (Jolliffe 2002), mostrado como biplot (Gabriel 1971), resumió ${fmtPct(A.P.explained[0] + (A.P.explained[1] || 0), 1)} de la varianza en los dos primeros componentes.`, `A principal component analysis of the correlation matrix (Jolliffe 2002), shown as a biplot (Gabriel 1971), summarised ${fmtPct(A.P.explained[0] + (A.P.explained[1] || 0), 1)} of the variance in the first two components.`); }
      const E = Block8.evolution();
      if (E.P) {
        cite('Sankoff 1975', 'Mayrose, Barker y Otto 2010');
        t += ' ' + w(`La evolución del número cromosómico haploide se reconstruyó sobre el árbol por parsimonia de Sankoff (1975) con los eventos de Mayrose, Barker y Otto (2010) y costos +1 = ${s.gain}, −1 = ${s.loss}, ×2 = ${s.dup} y ×1.5 = ${s.demi}; el costo mínimo fue ${fmtNum(E.P.cost, 2)} y el número de la raíz, n = ${E.P.root.mpr.join('/')}.`,
          `The evolution of the haploid chromosome number was reconstructed on the tree by Sankoff (1975) parsimony with the events of Mayrose, Barker and Otto (2010) and costs +1 = ${s.gain}, −1 = ${s.loss}, ×2 = ${s.dup} and ×1.5 = ${s.demi}; the minimum cost was ${fmtNum(E.P.cost, 2)} and the number at the root, n = ${E.P.root.mpr.join('/')}.`);
      }
      P.push(t);
    }
    P.push(w(`Todos los cálculos se hicieron con CytogeneticsPro ${APP_VERSION} (Barrera-Guzmán 2026), programa libre de la LABG Suite que funciona en el navegador, sin conexión.`, `All computations were done with CytogeneticsPro ${APP_VERSION} (Barrera-Guzmán 2026), free software of the LABG Suite that runs in the browser, offline.`));
    const refs = [...cites].map(refFor).filter(Boolean);
    const C = window.Home ? Home.citeText() : null;
    if (C) refs.push(L ? C.apaEn : C.apa);
    return { paragraphs: P, refs: [...new Set(refs)].sort((a, b) => stripTags(a).localeCompare(stripTags(b))), cites: [...cites] };
  }
  const cap = s => s ? s[0].toUpperCase() + s.slice(1) : s;
  /* «Levan et al. 1964» → «Levan et al. (1964)», to cite inside a sentence */
  const narr = c => c.replace(/ (\d{4})$/, ' ($1)');
  const methodsText = lang => { const M = methods(lang); return M.paragraphs.map(stripTags).join('\n\n') + '\n\n' + (lang === 'en' ? 'References' : 'Referencias') + '\n\n' + M.refs.map(stripTags).join('\n') + '\n'; };

  /* ---------------- tables ---------------- */
  function objRows(list, skip) {
    const keys = [];
    list.forEach(r => Object.keys(r).forEach(k => { if (!keys.includes(k) && !(skip || []).includes(k) && typeof r[k] !== 'object') keys.push(k); }));
    return [keys.map(k => (k === 'acc' ? T('accesión', 'accession') : k))].concat(list.map(r => keys.map(k => (k === 'acc' ? accName(r[k]) : r[k] == null ? '' : r[k]))));
  }
  function tables() {
    const out = [], H = has();
    const add = (id, es, en, rows) => { if (rows && rows.length > 1) out.push({ id, es, en, rows }); };
    add('accesiones', 'Accesiones', 'Accessions', [[T('nombre', 'name'), T('taxón', 'taxon'), T('localidad', 'locality'), T('latitud', 'latitude'), T('longitud', 'longitude'), 'x']]
      .concat(state.accessions.map(a => [a.name || '', a.taxon || '', a.locality || '', a.lat ?? '', a.lon ?? '', a.x ?? ''])));
    if (H.cells.length && window.Block2 && Block2.csvRows) add('mediciones', 'Mediciones por cromosoma', 'Measurements per chromosome', Block2.csvRows(state.cells));
    if (H.karyo.length) add('cariotipo', 'Cariotipo (pares)', 'Karyotype (pairs)', [Block3.HEAD()].concat(H.karyo.flatMap(a => Block3.tableRows(Block3.karyo(a.id), a.id))));
    if (H.karyo.length) add('asimetria', 'Índices de asimetría', 'Asymmetry indices', Block4.csvRows());
    if (H.meiosis) add('meiosis_configuraciones', 'Configuraciones meióticas por célula', 'Meiotic configurations per cell', objRows(state.meiosis.configs, ['id']));
    if (state.meiosis.phases.length) add('meiosis_anormalidades', 'Anormalidades por fase', 'Abnormalities by phase', objRows(state.meiosis.phases, ['id']));
    if (H.tetrads) add('tetradas', 'Tétradas', 'Tetrads', objRows(state.meiosis.tetrads, ['id']));
    if (H.pollen) add('polen', 'Viabilidad del polen', 'Pollen viability', objRows(state.meiosis.pollen, ['id']));
    if (H.counts) add('conteos', 'Conteos de 2n', '2n counts', objRows(state.ploidy.counts, ['id']));
    if (H.fcm) add('citometria', 'Citometría de flujo', 'Flow cytometry', [[T('accesión', 'accession'), T('muestra', 'sample'), T('patrón', 'standard'), T('pico_patron', 'standard_peak'), T('pico_muestra', 'sample_peak'), 'CV_' + T('patron', 'standard'), 'CV_' + T('muestra', 'sample'), '2C_pg', '1C_pg', '1Cx_pg', '2C_Mbp']]
      .concat(state.ploidy.fcm.map(r => { const g = Block6.run(r) || {}; return [accName(r.acc), r.sample || '', r.std || '', r.stdPeak, r.samplePeak, r.cvStd ?? '', r.cvSample ?? '', g.c2 ?? '', g.c1 ?? '', g.c1x ?? '', g.mbp2 ?? '']; })));
    if (H.mitosis) add('mitosis_allium', 'Prueba de Allium', 'Allium test', objRows(state.ploidy.mitosis, ['id']));
    if (H.signals) add('senales', 'Bandas y señales', 'Bands and signals', [[T('accesión', 'accession'), T('par', 'pair'), T('homólogo', 'homologue'), T('brazo', 'arm'), T('posición', 'position'), T('tamaño', 'size'), T('sonda', 'probe'), T('célula', 'cell'), T('región', 'region')]]
      .concat(state.bands.signals.map(s => [accName(s.acc), s.pair, s.homolog || '', s.arm === 's' ? 'p' : 'q', s.pos, s.size ?? '', (Bands.probe(s.probe) || {}).name || s.probe, s.cell || '', isFinite(+s.pos) ? T(Bands.POS_NAMES[Bands.posClass(+s.pos)]) : ''])));
    if (window.Block8) {
      const R = Block8.rows();
      if (R.length) {
        const V = Block8.varList().filter(v => R.some(r => isFinite(+r[v.k])));
        add('matriz_comparacion', 'Matriz de comparación', 'Comparison matrix', [[T('accesión o taxón', 'accession or taxon'), T('origen', 'source')].concat(V.map(v => v.label))]
          .concat(R.map(r => [r.name, r.kind === 'acc' ? T('proyecto', 'project') : T('literatura', 'literature')].concat(V.map(v => (isFinite(+r[v.k]) ? +r[v.k] : ''))))));
        const A = Block8.analyse();
        if (A.CL) add('distancias', 'Matriz de distancias', 'Distance matrix', [[''].concat(A.use.map(r => r.name))].concat(A.D.map((row, i) => [A.use[i].name].concat(row.map(v => +v.toFixed(6))))));
      }
    }
    return out;
  }

  /* ---------------- the karyogram from the image ---------------- */
  function loadImage(src) { return new Promise((res, rej) => { const im = new Image(); im.onload = () => res(im); im.onerror = () => rej(new Error('image')); im.src = src; }); }
  async function karyogram(acc) {
    const K = window.Block3 ? Block3.karyo(acc) : null;
    if (!K) return null;
    /* the first cell with its image and every grouped chromosome traced */
    const pick = K.cells.map(kc => ({ kc, src: state.cells.find(c => c.id === kc.id) })).find(({ kc, src }) => src && src.image && state.images[src.image] && kc.groups &&
      kc.groups.every(g => g && g.homolog.every(h => { const o = (src.chromosomes || []).find(x => x.id === h.id); return o && o.trace && o.cen != null; })));
    if (!pick) return null;
    const { kc, src } = pick, k = Img.umPerPx(src);
    const im = await loadImage(state.images[src.image].dataUrl);
    const cv = document.createElement('canvas'); cv.width = im.width; cv.height = im.height; cv.getContext('2d').drawImage(im, 0, 0);
    const width = Math.max(14, Math.min(40, k ? 1.4 / k : 18));
    const pairs = K.order.map(j => ({ j, P: K.pairs[j], cut: (kc.groups[j] ? kc.groups[j].homolog : []).map(h => Img.straighten(cv, src.chromosomes.find(x => x.id === h.id), width)) }));
    const perRow = Math.min(pairs.length, pairs.length > 12 ? 8 : 7), gapIn = 6, gapPair = 26, font = 12;
    const pw = p => p.cut.length * width + (p.cut.length - 1) * gapIn;
    const rows = [];
    for (let i = 0; i < pairs.length; i += perRow) rows.push(pairs.slice(i, i + perRow));
    let y = 40, body = '', W = 0;
    rows.forEach(row => {
      const up = Math.max(...row.flatMap(p => p.cut.map(c => c.cenY))), down = Math.max(...row.flatMap(p => p.cut.map(c => c.length - c.cenY)));
      let x = 30;
      row.forEach(p => {
        p.cut.forEach((c, i) => {
          body += `<image href="${c.canvas.toDataURL('image/png')}" x="${(x + i * (width + gapIn)).toFixed(1)}" y="${(y + up - c.cenY).toFixed(1)}" width="${c.canvas.width}" height="${c.canvas.height}"/>`;
        });
        const cx = x + pw(p) / 2;
        body += `<text class="txt" x="${cx.toFixed(1)}" y="${(y + up + down + font + 6).toFixed(1)}" font-size="${font}" font-weight="700" text-anchor="middle">${p.j + 1}</text>` +
          `<text class="mut" x="${cx.toFixed(1)}" y="${(y + up + down + 2 * font + 8).toFixed(1)}" font-size="${font - 1}" text-anchor="middle">${esc(p.P.type)}${p.P.sat ? '-sat' : ''}</text>`;
        x += pw(p) + gapPair;
      });
      body += `<line class="ax" x1="20" x2="${(x - gapPair + 10).toFixed(1)}" y1="${(y + up).toFixed(1)}" y2="${(y + up).toFixed(1)}" stroke-dasharray="3 3"/>`;
      W = Math.max(W, x - gapPair + 30);
      y += up + down + 2 * font + 30;
    });
    if (k) {
      const um = [1, 2, 5, 10, 20].find(v => v / k >= 40) || 5, px = um / k;
      body += `<line class="kg-bar" x1="${(W - px - 20).toFixed(1)}" x2="${(W - 20).toFixed(1)}" y1="${y.toFixed(1)}" y2="${y.toFixed(1)}" stroke="var(--text)" stroke-width="4"/>` +
        `<text class="txt" x="${(W - px / 2 - 20).toFixed(1)}" y="${(y - 8).toFixed(1)}" font-size="${font}" text-anchor="middle">${um} µm</text>`;
      y += 20;
    }
    const title = `${accName(acc)} · ${src.label || ''} · ${K.formula}`;
    return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" class="fig karyogram" viewBox="0 0 ${Math.ceil(W)} ${Math.ceil(y)}" width="${Math.ceil(W)}" height="${Math.ceil(y)}" role="img" aria-label="${esc(T('Cariograma de ', 'Karyogram of ') + title)}">` +
      `<text class="ttl" x="30" y="24" font-size="${font + 2}">${esc(title)}</text>${body}</svg>`;
  }

  /* ---------------- printable pages ---------------- */
  const CSS = `@page{size:A4;margin:16mm 14mm}*{box-sizing:border-box}body{font:11pt/1.45 system-ui,sans-serif;color:#1d1a1c;background:#fff;margin:0 auto;max-width:190mm;padding:12px}
h1{font-size:18pt;margin:0 0 6px;color:#6c1f54}h2{font-size:13pt;margin:18px 0 6px;color:#6c1f54;border-bottom:1px solid #d9cfd5;padding-bottom:3px}h3{font-size:11.5pt;margin:12px 0 4px}
p{margin:5px 0}table{border-collapse:collapse;width:100%;margin:6px 0 10px;font-size:9.5pt}th,td{border:1px solid #c9bcc4;padding:3px 6px;text-align:left;vertical-align:top}th{background:#f4eef2}td.num,th.num{text-align:right;font-variant-numeric:tabular-nums}
figure{margin:10px 0;page-break-inside:avoid;break-inside:avoid}figure svg{max-width:100%;height:auto}figcaption{font-size:9.5pt;color:#555;margin-top:2px}
.meta{color:#555;font-size:10pt}.refs li{margin-bottom:3px;font-size:9.5pt}.note{background:#fff6dd;border:1px solid #e8d49a;padding:6px 8px;border-radius:4px;font-size:10pt}
.pr-head td{border:0;padding:4px 6px}.pr-head td.line{border-bottom:1px solid #777;width:40%}.pr-steps li{margin-bottom:5px}.pr-src{color:#666;font-size:9pt}.pr-table td{height:24px}
.pr-draw{display:grid;grid-template-columns:1fr 1fr;gap:10px}.pr-draw div{border:1px solid #999;height:60mm;padding:4px;font-size:9pt;color:#666}.pr-refs li{font-size:9pt}.pr-foot{margin-top:14px;font-size:8.5pt;color:#777}
@media print{body{padding:0}h2{page-break-after:avoid;break-after:avoid}}`;
  function page(title, body, lang) {
    return `<!DOCTYPE html>\n<html lang="${lang === 'en' ? 'en' : 'es'}">\n<head>\n<meta charset="UTF-8">\n<meta name="viewport" content="width=device-width, initial-scale=1">\n<meta name="generator" content="CytogeneticsPro ${APP_VERSION}">\n<title>${esc(title)}</title>\n<style>${CSS}</style>\n</head>\n<body>\n${body}\n</body>\n</html>\n`;
  }
  /* print a page from a hidden frame; if the browser does not let the frame
     print, the page opens in a new tab to print from there */
  function printHtml(html) {
    const f = document.createElement('iframe');
    f.setAttribute('aria-hidden', 'true'); f.tabIndex = -1;
    f.style.cssText = 'position:fixed;right:0;bottom:0;width:1px;height:1px;border:0;opacity:0;pointer-events:none';
    f.onload = () => {
      try { f.contentWindow.focus(); f.contentWindow.print(); }
      catch (e) { const u = URL.createObjectURL(new Blob([html], { type: 'text/html;charset=utf-8' })); window.open(u, '_blank'); setTimeout(() => URL.revokeObjectURL(u), 60000); }
      setTimeout(() => f.remove(), 60000);
    };
    f.srcdoc = html;
    document.body.appendChild(f);
  }
  /* an HTML table of rows (the first is the header) */
  function htmlTable(rows, caption) {
    const isNum = v => typeof v === 'number' || (/^[−-]?\d+(\.\d+)?$/.test(String(v)) && String(v) !== '');
    const fmt = v => typeof v === 'number' ? (isFinite(v) ? String(+v.toPrecision(6)) : '') : String(v ?? '');
    return `<table>${caption ? `<caption>${esc(caption)}</caption>` : ''}<thead><tr>${rows[0].map(h => `<th>${esc(h)}</th>`).join('')}</tr></thead><tbody>` +
      rows.slice(1).map(r => '<tr>' + r.map(v => `<td${isNum(v) ? ' class="num"' : ''}>${esc(fmt(v))}</td>`).join('') + '</tr>').join('') + '</tbody></table>';
  }

  window.Report = { methods, methodsText, tables, karyogram, page, printHtml, htmlTable, refFor, CSS };
})();
