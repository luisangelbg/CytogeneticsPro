/* CytogeneticsPro — plant cytogenetics in the browser.
   Copyright (C) 2026  Luis Ángel Barrera-Guzmán

   This program is free software: you can redistribute it and/or modify it under
   the terms of the GNU General Public License as published by the Free Software
   Foundation, either version 3 of the License, or (at your option) any later
   version. It is distributed in the hope that it will be useful, but WITHOUT ANY
   WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR
   A PARTICULAR PURPOSE. See the GNU General Public License, in the file LICENSE
   at the root of this program, or <https://www.gnu.org/licenses/>. */

/* CytogeneticsPro — the karyotype asymmetry indices (Asym).

   Input: the chromosomes of one set, each with its short arm s and long arm l
   (the means of the homologous pairs of Block 3). Every index follows the
   formula of the paper that proposed it; `opts.pop` chooses the population
   standard deviation (divide by n) instead of the sample one (n − 1) for the
   indices built on a coefficient of variation.

   Two kinds of asymmetry (Peruzzi and Eroğlu 2013):
   - intrachromosomal: where the centromere sits (TF%, AsK%, Syi, A1, A, MCA, CVCI);
   - interchromosomal: how different the lengths are (Rec, A2, CVCL). */
(function () {
  'use strict';
  const S = () => window.Stats;

  function compute(chrs, opts) {
    const o = opts || {};
    const L = chrs.map(x => {
      let s = +x.s, l = +x.l;
      if (s > l) { const t = s; s = l; l = t; }
      return { s, l, c: s + l };
    }).filter(x => x.c > 0);
    const n = L.length;
    if (!n) return null;
    const ss = S().sum(L.map(x => x.s)), sl = S().sum(L.map(x => x.l)), sc = ss + sl;
    const cl = L.map(x => x.c), cmax = Math.max(...cl), cmin = Math.min(...cl);
    const ci = L.map(x => x.s / x.c);
    const sdCL = S().sd(cl, o.pop), mCL = S().mean(cl);
    const sdCI = S().sd(ci, o.pop), mCI = S().mean(ci);
    const R = {
      n,
      TF: 100 * ss / sc,                                            // Huziwara 1962
      AsK: 100 * sl / sc,                                           // Arano 1963
      Syi: 100 * (ss / n) / (sl / n),                               // Greilhuber and Speta 1976
      Rec: 100 * S().mean(cl.map(c => c / cmax)),                   // Greilhuber and Speta 1976
      A1: 1 - S().mean(L.map(x => x.l > 0 ? x.s / x.l : 0)),         // Romero Zarco 1986
      A2: sdCL / mCL,                                               // Romero Zarco 1986
      A: S().mean(L.map(x => (x.l - x.s) / x.c)),                   // Watanabe et al. 1999
      CVCL: 100 * sdCL / mCL,                                       // Paszko 2006
      CVCI: mCI > 0 ? 100 * sdCI / mCI : NaN,                       // Paszko 2006 (undefined when all are telocentric)
      THL: sc,
      meanCI: 100 * mCI,
      ratioLS: cmax / cmin,
    };
    R.MCA = 100 * R.A;                                              // Peruzzi and Eroğlu 2013
    R.AI = R.CVCL * R.CVCI / 100;                                   // Paszko 2006
    /* Lavania and Srivastava (1992): centromeric gradient CG from the MEDIAN short
       arm and the MEDIAN length, times the coefficient of variation of length */
    R.CG = 100 * S().median(L.map(x => x.s)) / S().median(cl);
    R.DI = R.CG * R.CVCL / 100;
    const st = stebbins(L);
    R.stebbins = st.cls; R.stebbinsRow = st.row; R.stebbinsCol = st.col; R.propAsym = st.prop; R.propBelow2 = st.below;
    return R;
  }

  /* Stebbins (1971): the letter by the ratio of the longest to the shortest
     chromosome (A < 2:1, B 2:1–4:1, C > 4:1); the number by the proportion of
     chromosomes with an arm ratio below 2:1, as the table is printed (1: 1.00;
     2: 0.99–0.51; 3: 0.50–0.01; 4: 0.00). A chromosome with r = 2 exactly is
     not «below 2:1»; a ratio of exactly 2 or 4 goes to B. */
  function stebbins(L) {
    const cl = L.map(x => x.c);
    const ratio = Math.max(...cl) / Math.min(...cl);
    const below = L.filter(x => x.s > 0 && x.l / x.s < 2 - 1e-12).length / L.length;
    const row = ratio < 2 - 1e-12 ? 'A' : ratio <= 4 + 1e-12 ? 'B' : 'C';
    const col = below === 1 ? 1 : below > 0.5 ? 2 : below > 0 ? 3 : 4;
    return { cls: col + row, row, col, ratio, prop: 1 - below, below };
  }

  /* what each index is, for the tables, the help and the methods */
  const INDICES = [
    { k: 'TF', name: 'TF%', kind: 'intra', ref: 'Huziwara 1962', up: false,
      f: 'TF% = 100 · Σs / Σ(s + l)',
      es: 'Porcentaje de forma total: la parte del complemento que está en los brazos cortos. Baja cuando el cariotipo se vuelve asimétrico (50 = todos metacéntricos).',
      en: 'Total form percentage: the share of the complement in the short arms. It falls as the karyotype becomes asymmetric (50 = all metacentric).' },
    { k: 'AsK', name: 'AsK%', kind: 'intra', ref: 'Arano 1963', up: true, redundant: 'TF',
      f: 'AsK% = 100 · Σl / Σ(s + l)',
      es: 'Índice de asimetría del cariotipo: la parte en los brazos largos. Es 100 − TF%; no añade información.',
      en: 'Karyotype asymmetry index: the share in the long arms. It is 100 − TF%; it adds no information.' },
    { k: 'Syi', name: 'Syi', kind: 'intra', ref: 'Greilhuber y Speta 1976', up: false, redundant: 'TF',
      f: 'Syi = 100 · s̄ / l̄',
      es: 'Índice de simetría: brazo corto medio entre brazo largo medio. Es una función de TF% (Syi = 100 · TF / (100 − TF)).',
      en: 'Symmetry index: mean short arm over mean long arm. It is a function of TF% (Syi = 100 · TF / (100 − TF)).' },
    { k: 'A1', name: 'A1', kind: 'intra', ref: 'Romero Zarco 1986', up: true,
      f: 'A1 = 1 − (1/n) Σ (sᵢ / lᵢ)',
      es: 'Asimetría intracromosómica, cromosoma por cromosoma: 0 si todos son metacéntricos, cerca de 1 si casi todos son telocéntricos.',
      en: 'Intrachromosomal asymmetry, chromosome by chromosome: 0 if all are metacentric, near 1 if nearly all are telocentric.' },
    { k: 'A', name: 'A', kind: 'intra', ref: 'Watanabe et al. 1999', up: true,
      f: 'A = (1/n) Σ (lᵢ − sᵢ) / (lᵢ + sᵢ)',
      es: 'Asimetría centromérica media, de 0 (todos metacéntricos) a 1 (todos telocéntricos), lineal en la posición del centrómero.',
      en: 'Mean centromeric asymmetry, from 0 (all metacentric) to 1 (all telocentric), linear in the position of the centromere.' },
    { k: 'MCA', name: 'MCA', kind: 'intra', ref: 'Peruzzi y Eroğlu 2013', up: true, recommended: true,
      f: 'MCA = 100 · A',
      es: 'Asimetría centromérica media en porcentaje. Es la medida intracromosómica que se recomienda hoy, junto a CVCL.',
      en: 'Mean centromeric asymmetry as a percentage. It is the intrachromosomal measure recommended today, together with CVCL.' },
    { k: 'CVCI', name: 'CVCI', kind: 'intra', ref: 'Paszko 2006', up: true, recommended: true,
      f: 'CVCI = 100 · sd(CI) / media(CI)',
      es: 'Coeficiente de variación del índice centromérico: qué tan distintas son las posiciones del centrómero entre cromosomas (heterogeneidad, no asimetría).',
      en: 'Coefficient of variation of the centromeric index: how different the positions of the centromere are among chromosomes (heterogeneity, not asymmetry).' },
    { k: 'Rec', name: 'Rec', kind: 'inter', ref: 'Greilhuber y Speta 1976', up: false,
      f: 'Rec = 100 · (1/n) Σ (cᵢ / c_máx)',
      es: 'Índice de semejanza de longitudes: longitud media relativa al cromosoma más largo. 100 si todos miden lo mismo.',
      en: 'Resemblance index: mean length relative to the longest chromosome. 100 if all are the same length.' },
    { k: 'A2', name: 'A2', kind: 'inter', ref: 'Romero Zarco 1986', up: true,
      f: 'A2 = sd(c) / media(c)',
      es: 'Asimetría intercromosómica: coeficiente de variación de las longitudes, como proporción.',
      en: 'Interchromosomal asymmetry: coefficient of variation of the lengths, as a proportion.' },
    { k: 'CVCL', name: 'CVCL', kind: 'inter', ref: 'Paszko 2006', up: true, recommended: true,
      f: 'CVCL = 100 · A2',
      es: 'Coeficiente de variación de la longitud cromosómica, en porcentaje. La medida intercromosómica que se recomienda.',
      en: 'Coefficient of variation of chromosome length, as a percentage. The recommended interchromosomal measure.' },
    { k: 'AI', name: 'AI', kind: 'both', ref: 'Paszko 2006', up: true, historical: true,
      f: 'AI = CVCL · CVCI / 100',
      es: 'Índice de asimetría de Paszko: combina la variación de longitudes y la de posiciones del centrómero. Sigue casi sólo a CVCI y hoy se desaconseja (Peruzzi et al. 2009; Peruzzi y Eroğlu 2013).',
      en: 'Paszko\'s asymmetry index: combines the variation of lengths and of centromere positions. It follows CVCI almost alone and is discouraged today (Peruzzi et al. 2009; Peruzzi and Eroğlu 2013).' },
    { k: 'DI', name: 'DI', kind: 'both', ref: 'Lavania y Srivastava 1992', up: true, historical: true,
      f: 'DI = CG · CVCL / 100,  CG = 100 · mediana(s) / mediana(c)',
      es: 'Índice de dispersión: el gradiente centromérico (brazo corto mediano entre longitud mediana) por la variación de longitudes. Un índice histórico, poco usado hoy.',
      en: 'Dispersion index: the centromeric gradient (median short arm over median length) times the variation of lengths. A historical index, little used today.' },
  ];

  /* the order in which the indices go in tables */
  const ORDER = ['TF', 'AsK', 'Syi', 'A1', 'A', 'MCA', 'CVCI', 'Rec', 'A2', 'CVCL', 'AI', 'DI'];

  window.Asym = { compute, stebbins, INDICES, ORDER };
})();
