/* CytogeneticsPro — plant cytogenetics in the browser.
   Copyright (C) 2026  Luis Ángel Barrera-Guzmán

   This program is free software: you can redistribute it and/or modify it under
   the terms of the GNU General Public License as published by the Free Software
   Foundation, either version 3 of the License, or (at your option) any later
   version. It is distributed in the hope that it will be useful, but WITHOUT ANY
   WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR
   A PARTICULAR PURPOSE. See the GNU General Public License, in the file LICENSE
   at the root of this program, or <https://www.gnu.org/licenses/>. */

/* CytogeneticsPro — Block 1, the home page.
   Builds the block bar, the cards of the ten blocks, the workflow, the
   examples, the gallery of methods with their sources, the theory, the
   references and how to cite. Every text is written in both languages side by
   side (L2), so a change of language needs no redraw except for the pictures. */
(function () {
  const BLOCKS = [
    { n: 1, es: 'Inicio', en: 'Home', tag: ['Teoría y laboratorios', 'Theory and labs'],
      d: ['La lógica de la citogenética en lenguaje llano, dos laboratorios que calculan de verdad, las referencias y los ejemplos.', 'The logic of cytogenetics in plain words, two labs that really compute, the references and the examples.'] },
    { n: 2, es: 'Imágenes y medición', en: 'Images and measurement', tag: ['Medir', 'Measure'],
      d: ['Fotomicrografías calibradas con la barra de micras: contar con marcadores, trazar cada cromosoma con su curvatura, marcar centrómero y satélites, brillo, contraste y deshacer; o capturar las medidas a mano.', 'Micrographs calibrated with the micron bar: count with markers, trace each chromosome along its curvature, mark centromere and satellites, brightness, contrast and undo; or type the measurements by hand.'] },
    { n: 3, es: 'Cariotipo', en: 'Karyotype', tag: ['Ordenar', 'Arrange'],
      d: ['Homólogos emparejados por longitud e índice centromérico, con corrección por arrastre; promedios entre células, clasificación de Levan, fórmula cariotípica, número fundamental e idiograma a escala.', 'Homologues paired by length and centromeric index, corrected by dragging; means over cells, Levan classification, karyotype formula, fundamental number and idiogram to scale.'] },
    { n: 4, es: 'Asimetría', en: 'Asymmetry', tag: ['Describir', 'Describe'],
      d: ['TF%, AsK%, Syi, Rec, A1, A2, A, CVCL, CVCI, MCA, AI, DI y las categorías de Stebbins, con qué mide cada índice y cuáles se recomiendan hoy.', 'TF%, AsK%, Syi, Rec, A1, A2, A, CVCL, CVCI, MCA, AI, DI and the Stebbins categories, with what each index measures and which are recommended today.'] },
    { n: 5, es: 'Meiosis', en: 'Meiosis', tag: ['Aparear', 'Pair'],
      d: ['Configuraciones por célula, quiasmas, índice de recombinación, anormalidades por fase, índice meiótico, viabilidad del polen y lo esperado para un autopoliploide o un alopoliploide.', 'Configurations per cell, chiasmata, recombination index, abnormalities by phase, meiotic index, pollen viability and what is expected for an autopolyploid or an allopolyploid.'] },
    { n: 6, es: 'Ploidía y genoma', en: 'Ploidy and genome', tag: ['Contar', 'Count'],
      d: ['Conteos de 2n con su moda, nivel de ploidía por el número básico, citometría de flujo en pg y Mpb con su histograma, e índice mitótico y aberraciones de la prueba de Allium.', 'Counts of 2n with their mode, ploidy level from the base number, flow cytometry in pg and Mbp with its histogram, and mitotic index and aberrations of the Allium test.'] },
    { n: 7, es: 'Bandeo y FISH', en: 'Banding and FISH', tag: ['Marcar', 'Mark'],
      d: ['Bandas C y N, fluorocromos y señales de hibridación in situ por cromosoma y posición, con heteromorfismos, dibujadas sobre el idiograma con un color por sonda.', 'C and N bands, fluorochromes and in-situ hybridization signals by chromosome and position, with heteromorphisms, drawn on the idiogram with one colour per probe.'] },
    { n: 8, es: 'Comparación', en: 'Comparison', tag: ['Comparar', 'Compare'],
      d: ['Matriz de parámetros cariológicos, distancias, UPGMA, Ward, ACP con biplot, idiogramas en paralelo, evolución del número cromosómico sobre un árbol y mapa de citotipos.', 'Matrix of karyological parameters, distances, UPGMA, Ward, PCA with biplot, parallel idiograms, chromosome number evolution on a tree and a map of cytotypes.'] },
    { n: 9, es: 'Docencia', en: 'Teaching', tag: ['Enseñar', 'Teach'],
      d: ['Simuladores de mitosis y meiosis paso a paso, ejercicio de cariotipo con retroalimentación, autoevaluación, glosario ilustrado y hoja de prácticas para imprimir.', 'Step-by-step mitosis and meiosis simulators, a karyotype exercise with feedback, self-assessment, an illustrated glossary and a printable practical sheet.'] },
    { n: 10, es: 'Figuras e informe', en: 'Figures and report', tag: ['Publicar', 'Publish'],
      d: ['Idiograma, cariograma recortado de la imagen, dispersión de Stebbins, histogramas y árbol con números en SVG o PNG; tablas, métodos redactados, informe imprimible y paquete reproducible.', 'Idiogram, karyogram cut out of the image, Stebbins scatter, histograms and tree with numbers in SVG or PNG; tables, written methods, a printable report and a reproducible package.'] },
  ];

  const WORKFLOW = [
    ['Preparar', 'Prepare', 'raíces, anteras, tinción', 'roots, anthers, staining'],
    ['Contar', 'Count', 'el número 2n', 'the number 2n'],
    ['Medir', 'Measure', 'cada brazo, a escala', 'each arm, to scale'],
    ['Ordenar', 'Arrange', 'homólogos e idiograma', 'homologues and idiogram'],
    ['Describir', 'Describe', 'asimetría y fórmula', 'asymmetry and formula'],
    ['Comparar', 'Compare', 'citotipos y taxones', 'cytotypes and taxa'],
    ['Publicar', 'Publish', 'figuras, métodos, paquete', 'figures, methods, package'],
  ];

  const EXAMPLES = [
    { k: 'zea', t: '<i>Zea mays</i> · 2n = 20', tag: ['Bloques 2, 3, 4 y 7', 'Blocks 2, 3, 4 and 7'],
      d: ['Cinco células medidas, con una metafase dibujada para trazarla, el satélite del par 6 y nudos heterocromáticos.', 'Five measured cells, with a drawn metaphase to trace, the satellite of pair 6 and heterochromatic knobs.'] },
    { k: 'sechium', t: '<i>Sechium edule</i> · 2n = 28 y 24', tag: ['Bloques 3, 7 y 8', 'Blocks 3, 7 and 8'],
      d: ['Tres accesiones cultivadas con 2n = 28 y una silvestre con 2n = 24, con señales de ADNr, coordenadas y un árbol para la evolución del número.', 'Three cultivated accessions with 2n = 28 and a wild one with 2n = 24, with rDNA signals, coordinates and a tree for number evolution.'] },
    { k: 'poly', t: L2('Serie poliploide ficticia', 'Fictitious polyploid series') + ' · 2x, 4x, 6x', tag: ['Bloques 5 y 6', 'Blocks 5 and 6'],
      d: ['Configuraciones meióticas célula por célula, polen, tétradas, conteos y citometría con su histograma.', 'Meiotic configurations cell by cell, pollen, tetrads, counts and cytometry with its histogram.'] },
    { k: 'allium', t: '<i>Allium cepa</i> · ' + L2('prueba de citotoxicidad', 'cytotoxicity test'), tag: ['Bloque 6', 'Block 6'],
      d: ['Un testigo y dos tratamientos con tres bulbos cada uno: fases mitóticas, aberraciones y micronúcleos.', 'A control and two treatments with three bulbs each: mitotic phases, aberrations and micronuclei.'] },
  ];

  /* the methods of the app, each with the source it follows */
  const FAMS = {
    img: ['Imagen y medición', 'Image and measurement'], kar: ['Cariotipo', 'Karyotype'], asy: ['Asimetría', 'Asymmetry'],
    mei: ['Meiosis', 'Meiosis'], plo: ['Ploidía y genoma', 'Ploidy and genome'], ban: ['Bandeo y FISH', 'Banding and FISH'],
    cmp: ['Comparación', 'Comparison'], est: ['Estadística', 'Statistics'],
  };
  const METHODS = [
    ['img', 'Calibración con la barra de escala', 'Calibration with the scale bar', 'µm por píxel'],
    ['img', 'Longitud a lo largo de la curvatura', 'Length along the curvature', 'polilínea / polyline'],
    ['kar', 'Posición del centrómero', 'Centromere position', 'Levan et al. 1964'],
    ['kar', 'Nomenclatura revisada', 'Revised nomenclature', 'Guerra 1986'],
    ['kar', 'Satélites y constricciones secundarias', 'Satellites and secondary constrictions', 'Battaglia 1955'],
    ['kar', 'Número cromosómico y número básico', 'Chromosome and base number', 'Guerra 2008'],
    ['asy', 'Porcentaje de forma total (TF%)', 'Total form percentage (TF%)', 'Huziwara 1962'],
    ['asy', 'Índice de asimetría AsK%', 'Asymmetry index AsK%', 'Arano 1963'],
    ['asy', 'Syi y Rec', 'Syi and Rec', 'Greilhuber y Speta 1976'],
    ['asy', 'A1 y A2', 'A1 and A2', 'Romero Zarco 1986'],
    ['asy', 'Asimetría centromérica A', 'Centromeric asymmetry A', 'Watanabe et al. 1999'],
    ['asy', 'CVCL, CVCI y AI', 'CVCL, CVCI and AI', 'Paszko 2006'],
    ['asy', 'MCA', 'MCA', 'Peruzzi y Eroğlu 2013'],
    ['asy', 'Heterogeneidad del índice centromérico', 'Heterogeneity of the centromeric index', 'Zuo y Yuan 2011'],
    ['asy', 'Índice de dispersión DI', 'Dispersion index DI', 'Lavania y Srivastava 1992'],
    ['asy', 'Categorías 1A–4C', 'Categories 1A–4C', 'Stebbins 1971'],
    ['mei', 'Configuraciones y quiasmas', 'Configurations and chiasmata', 'Sybenga 1975'],
    ['mei', 'Configuraciones esperadas en poliploides', 'Expected configurations in polyploids', 'Jackson y Casey 1982'],
    ['mei', 'Índice de recombinación', 'Recombination index', 'Colombo 1992'],
    ['mei', 'Índice meiótico', 'Meiotic index', 'Love 1951'],
    ['mei', 'Viabilidad del polen por tinción', 'Pollen viability by staining', 'Alexander 1969'],
    ['plo', 'Contenido de ADN por citometría', 'DNA content by flow cytometry', 'Doležel et al. 2007'],
    ['plo', 'De picogramos a pares de bases', 'From picograms to base pairs', 'Doležel et al. 2003'],
    ['plo', 'Valores C y Cx', 'C- and Cx-values', 'Greilhuber et al. 2005'],
    ['plo', 'Prueba de Allium', 'Allium test', 'Fiskesjö 1985'],
    ['ban', 'Heterocromatina y fluorocromos', 'Heterochromatin and fluorochromes', 'Guerra 2000'],
    ['ban', 'Hibridación in situ fluorescente', 'Fluorescence in situ hybridization', 'Jiang y Gill 2006'],
    ['cmp', 'Relaciones cariológicas multivariadas', 'Multivariate karyological relationships', 'Peruzzi y Altınordu 2014'],
    ['cmp', 'Distancia de Gower', 'Gower distance', 'Gower 1971'],
    ['cmp', 'UPGMA', 'UPGMA', 'Sneath y Sokal 1973'],
    ['cmp', 'Agrupamiento de Ward', 'Ward clustering', 'Ward 1963'],
    ['cmp', 'Correlación cofenética', 'Cophenetic correlation', 'Sokal y Rohlf 1962'],
    ['cmp', 'Componentes principales y biplot', 'Principal components and biplot', 'Jolliffe 2002; Gabriel 1971'],
    ['cmp', 'Evolución del número por parsimonia', 'Number evolution by parsimony', 'Sankoff 1975'],
    ['est', 'Intervalos para una proporción', 'Intervals for a proportion', 'Wilson 1927; Clopper y Pearson 1934'],
    ['est', 'Homogeneidad χ² y G', 'Homogeneity χ² and G', 'Sokal y Rohlf 1995'],
  ];

  const REFS = [
    ['Alexander MP. 1969. Differential staining of aborted and nonaborted pollen. <i>Stain Technology</i> 44: 117–122.', 'mei'],
    ['Arano H. 1963. Cytological studies in subfamily Carduoideae (Compositae) of Japan. IX. The karyotype analysis and phylogenic considerations on <i>Pertya</i> and <i>Ainsliaea</i>. <i>The Botanical Magazine, Tokyo</i> 76: 32–39.', 'asy'],
    ['Battaglia E. 1955. Chromosome morphology and terminology. <i>Caryologia</i> 8: 179–187.', 'kar'],
    ['Clopper CJ, Pearson ES. 1934. The use of confidence or fiducial limits illustrated in the case of the binomial. <i>Biometrika</i> 26: 404–413.', 'est'],
    ['Colombo PC. 1992. A new index for estimating genetic recombination from chiasma distribution data. <i>Heredity</i> 69: 412–415.', 'mei'],
    ['Darlington CD, La Cour LF. 1976. <i>The Handling of Chromosomes</i>, 6.ª ed. George Allen &amp; Unwin, Londres.', 'tec'],
    ['Doležel J, Bartoš J, Voglmayr H, Greilhuber J. 2003. Nuclear DNA content and genome size of trout and human. <i>Cytometry Part A</i> 51: 127–128.', 'plo'],
    ['Doležel J, Greilhuber J, Suda J. 2007. Estimation of nuclear DNA content in plants using flow cytometry. <i>Nature Protocols</i> 2: 2233–2244.', 'plo'],
    ['Fiskesjö G. 1985. The <i>Allium</i> test as a standard in environmental monitoring. <i>Hereditas</i> 102: 99–112.', 'plo'],
    ['Gabriel KR. 1971. The biplot graphic display of matrices with application to principal component analysis. <i>Biometrika</i> 58: 453–467.', 'cmp'],
    ['Gower JC. 1971. A general coefficient of similarity and some of its properties. <i>Biometrics</i> 27: 857–871.', 'cmp'],
    ['Greilhuber J, Doležel J, Lysák MA, Bennett MD. 2005. The origin, evolution and proposed stabilization of the terms ‘genome size’ and ‘C-value’ to describe nuclear DNA contents. <i>Annals of Botany</i> 95: 255–260.', 'plo'],
    ['Greilhuber J, Speta F. 1976. C-banded karyotypes in the <i>Scilla hohenackeri</i> group, <i>S. persica</i>, and <i>Puschkinia</i> (Liliaceae). <i>Plant Systematics and Evolution</i> 126: 149–188.', 'asy'],
    ['Guerra M. 1986. Reviewing the chromosome nomenclature of Levan et al. <i>Revista Brasileira de Genética</i> 9: 741–743.', 'kar'],
    ['Guerra M. 2000. Patterns of heterochromatin distribution in plant chromosomes. <i>Genetics and Molecular Biology</i> 23: 1029–1041.', 'ban'],
    ['Guerra M. 2008. Chromosome numbers in plant cytotaxonomy: concepts and implications. <i>Cytogenetic and Genome Research</i> 120: 339–350.', 'kar'],
    ['Guerra M, Souza MJ. 2002. <i>Como observar cromossomos: um guia de técnicas em citogenética vegetal, animal e humana</i>. FUNPEC, Ribeirão Preto.', 'tec'],
    ['Holm S. 1979. A simple sequentially rejective multiple test procedure. <i>Scandinavian Journal of Statistics</i> 6: 65–70.', 'est'],
    ['Huziwara Y. 1962. Karyotype analysis in some genera of Compositae. VIII. Further studies on the chromosomes of <i>Aster</i>. <i>American Journal of Botany</i> 49: 116–119.', 'asy'],
    ['Jackson RC, Casey J. 1982. Cytogenetic analyses of autopolyploids: models and methods for triploids to octoploids. <i>American Journal of Botany</i> 69: 487–501.', 'mei'],
    ['Jiang J, Gill BS. 2006. Current status and the future of fluorescence in situ hybridization (FISH) in plant genome research. <i>Genome</i> 49: 1057–1068.', 'ban'],
    ['Jolliffe IT. 2002. <i>Principal Component Analysis</i>, 2.ª ed. Springer, Nueva York.', 'cmp'],
    ['Lavania UC, Srivastava S. 1992. A simple parameter of dispersion index that serves as an adjunct to karyotype asymmetry. <i>Journal of Biosciences</i> 17: 179–182.', 'asy'],
    ['Leme DM, Marin-Morales MA. 2009. <i>Allium cepa</i> test in environmental monitoring: a review on its application. <i>Mutation Research</i> 682: 71–81.', 'plo'],
    ['Levan A, Fredga K, Sandberg AA. 1964. Nomenclature for centromeric position on chromosomes. <i>Hereditas</i> 52: 201–220.', 'kar'],
    ['Love RM. 1951. Varietal differences in meiotic chromosome behavior of Brazilian wheats. <i>Agronomy Journal</i> 43: 72–76.', 'mei'],
    ['Mayrose I, Barker MS, Otto SP. 2010. Probabilistic models of chromosome number evolution and the inference of polyploidy. <i>Systematic Biology</i> 59: 132–144.', 'cmp'],
    ['Okabe M, Ito K. 2008. Color universal design (CUD): how to make figures and presentations that are friendly to colorblind people. Documento en línea.', 'est'],
    ['Paszko B. 2006. A critical review and a new proposal of karyotype asymmetry indices. <i>Plant Systematics and Evolution</i> 258: 39–48.', 'asy'],
    ['Peruzzi L, Altınordu F. 2014. A proposal for a multivariate quantitative approach to infer karyological relationships among taxa. <i>Comparative Cytogenetics</i> 8: 337–349.', 'cmp'],
    ['Peruzzi L, Leitch IJ, Caparelli KF. 2009. Chromosome diversity and evolution in Liliaceae. <i>Annals of Botany</i> 103: 459–475.', 'asy'],
    ['Peruzzi L, Eroğlu HE. 2013. Karyotype asymmetry: again, how to measure and what to measure? <i>Comparative Cytogenetics</i> 7: 1–9.', 'asy'],
    ['Rice A, Glick L, Abadi S, Einhorn M, Kopelman NM, Salman-Minkov A, Mayzel J, Chay O, Mayrose I. 2015. The Chromosome Counts Database (CCDB) – a community resource of plant chromosome numbers. <i>New Phytologist</i> 206: 19–26.', 'kar'],
    ['Romero Zarco C. 1986. A new method for estimating karyotype asymmetry. <i>Taxon</i> 35: 526–530.', 'asy'],
    ['Sankoff D. 1975. Minimal mutation trees of sequences. <i>SIAM Journal on Applied Mathematics</i> 28: 35–42.', 'cmp'],
    ['Schubert I, Lysak MA. 2011. Interpretation of karyotype evolution should consider chromosome structural constraints. <i>Trends in Genetics</i> 27: 207–216.', 'cmp'],
    ['Schwarzacher T, Heslop-Harrison P. 2000. <i>Practical in situ Hybridization</i>. BIOS Scientific Publishers, Oxford.', 'ban'],
    ['Sharma AK, Sharma A. 1980. <i>Chromosome Techniques: Theory and Practice</i>, 3.ª ed. Butterworths, Londres.', 'tec'],
    ['Singh RJ. 2017. <i>Plant Cytogenetics</i>, 3.ª ed. CRC Press, Boca Raton.', 'tec'],
    ['Sneath PHA, Sokal RR. 1973. <i>Numerical Taxonomy</i>. W. H. Freeman, San Francisco.', 'cmp'],
    ['Sokal RR, Rohlf FJ. 1962. The comparison of dendrograms by objective methods. <i>Taxon</i> 11: 33–40.', 'cmp'],
    ['Sokal RR, Rohlf FJ. 1995. <i>Biometry</i>, 3.ª ed. W. H. Freeman, Nueva York.', 'est'],
    ['Stebbins GL. 1971. <i>Chromosomal Evolution in Higher Plants</i>. Edward Arnold, Londres.', 'asy'],
    ['Sybenga J. 1975. <i>Meiotic Configurations: A Source of Information for Estimating Genetic Parameters</i>. Springer, Berlín.', 'mei'],
    ['Ward JH. 1963. Hierarchical grouping to optimize an objective function. <i>Journal of the American Statistical Association</i> 58: 236–244.', 'cmp'],
    ['Watanabe K, Yahara T, Denda T, Kosuge K. 1999. Chromosomal evolution in the genus <i>Brachyscome</i> (Asteraceae, Astereae): statistical tests regarding correlation between changes in karyotype and habit using phylogenetic information. <i>Journal of Plant Research</i> 112: 145–161.', 'asy'],
    ['Wilson EB. 1927. Probable inference, the law of succession, and statistical inference. <i>Journal of the American Statistical Association</i> 22: 209–212.', 'est'],
    ['Zuo L, Yuan Q. 2011. The difference between the heterogeneity of the centromeric index and intrachromosomal asymmetry. <i>Plant Systematics and Evolution</i> 297: 141–145.', 'asy'],
  ];
  const REF_TOPICS = Object.assign({ tec: ['Técnicas', 'Techniques'] }, FAMS);

  /* ---------------- theory ---------------- */
  const THEORY = [
    { h: ['El cromosoma y sus partes', 'The chromosome and its parts'], tag: ['Bloques 2 y 3', 'Blocks 2 and 3'],
      fig: ['anatomy', 'Un cromosoma en metafase, con sus dos cromátidas hermanas.', 'A metaphase chromosome, with its two sister chromatids.'],
      es: '<p>En metafase cada <b>cromosoma</b> está formado por dos <b>cromátidas hermanas</b> unidas por el <b>centrómero</b> (la constricción primaria). El centrómero divide al cromosoma en un <b>brazo corto (p)</b> y un <b>brazo largo (q)</b>; los extremos son los <b>telómeros</b>. Algunos cromosomas tienen una <b>constricción secundaria</b> donde está la región organizadora del nucléolo (NOR, los genes del ADNr 45S); el trozo que queda más allá se llama <b>satélite</b> (Battaglia 1955).</p><p>Para medir un cromosoma se recorre cada brazo desde el centrómero hasta su telómero siguiendo su curvatura: un cromosoma doblado mide lo mismo que uno recto.</p>',
      en: '<p>At metaphase each <b>chromosome</b> is made of two <b>sister chromatids</b> joined at the <b>centromere</b> (the primary constriction). The centromere divides the chromosome into a <b>short arm (p)</b> and a <b>long arm (q)</b>; the ends are the <b>telomeres</b>. Some chromosomes have a <b>secondary constriction</b> where the nucleolus organizer region lies (NOR, the 45S rDNA genes); the piece beyond it is called a <b>satellite</b> (Battaglia 1955).</p><p>To measure a chromosome each arm is followed from the centromere to its telomere along its curvature: a bent chromosome measures the same as a straight one.</p>' },
    { h: ['Dónde está el centrómero: m, sm, st y t', 'Where the centromere is: m, sm, st and t'], tag: ['Bloque 3', 'Block 3'],
      fig: ['levan', 'Las cuatro clases de Levan et al. (1964) por la razón de brazos r = q/p.', 'The four classes of Levan et al. (1964) by the arm ratio r = q/p.'],
      es: '<p>La <b>razón de brazos</b> r = q/p y el <b>índice centromérico</b> IC = 100·p/(p + q) dicen dónde está el centrómero. Levan, Fredga y Sandberg (1964) fijaron los nombres que se usan hoy: <b>metacéntrico</b> (m, r hasta 1.7), <b>submetacéntrico</b> (sm, hasta 3.0), <b>subtelocéntrico</b> (st, hasta 7.0) y <b>telocéntrico</b> (t, más de 7.0); M y T son los casos exactos r = 1 y r = ∞. Guerra (1986) propuso juntar st y t en «acrocéntrico». La app usa los límites de Levan, pero puedes cambiarlos.</p>',
      en: '<p>The <b>arm ratio</b> r = q/p and the <b>centromeric index</b> CI = 100·p/(p + q) say where the centromere is. Levan, Fredga and Sandberg (1964) set the names used today: <b>metacentric</b> (m, r up to 1.7), <b>submetacentric</b> (sm, up to 3.0), <b>subtelocentric</b> (st, up to 7.0) and <b>telocentric</b> (t, above 7.0); M and T are the exact cases r = 1 and r = ∞. Guerra (1986) proposed merging st and t into «acrocentric». The app uses Levan\'s limits, but you can change them.</p>' },
    { h: ['Cariotipo, idiograma y fórmula', 'Karyotype, idiogram and formula'], tag: ['Bloque 3', 'Block 3'],
      es: '<p>El <b>cariotipo</b> es el conjunto de cromosomas de una especie descrito por su número, su tamaño y su forma. Los homólogos se emparejan y se ordenan, casi siempre de mayor a menor. El <b>idiograma</b> es su dibujo esquemático a escala, hecho con los promedios de varias células, porque una sola célula puede estar más o menos condensada. La <b>longitud relativa</b> (el porcentaje de cada par en la longitud del juego haploide) corrige esa diferencia de condensación.</p><p>La <b>fórmula cariotípica</b> resume el cariotipo: 2n = 2x = 20 = 14m + 6sm quiere decir 20 cromosomas, dos juegos de 10, catorce metacéntricos y seis submetacéntricos. El <b>número fundamental</b> cuenta los brazos: dos por cada m o sm y uno por cada st o t.</p>',
      en: '<p>The <b>karyotype</b> is the chromosome complement of a species described by its number, size and shape. Homologues are paired and ordered, almost always from longest to shortest. The <b>idiogram</b> is its schematic drawing to scale, made from the means of several cells, because a single cell may be more or less condensed. The <b>relative length</b> (the percentage of each pair in the length of the haploid set) corrects for that difference in condensation.</p><p>The <b>karyotype formula</b> sums it up: 2n = 2x = 20 = 14m + 6sm means 20 chromosomes, two sets of 10, fourteen metacentric and six submetacentric. The <b>fundamental number</b> counts the arms: two for each m or sm and one for each st or t.</p>' },
    { h: ['Asimetría: dos cosas distintas', 'Asymmetry: two different things'], tag: ['Bloque 4', 'Block 4'],
      fig: ['asym', 'Mismo número de cromosomas, distinta asimetría.', 'Same chromosome number, different asymmetry.'],
      es: '<p>Un cariotipo es <b>simétrico</b> cuando sus cromosomas son parecidos en tamaño y casi todos metacéntricos, y <b>asimétrico</b> cuando hay cromosomas de tamaños muy distintos o con el centrómero cerca de un extremo. Stebbins (1971) vio que en muchos grupos de plantas la evolución lleva de cariotipos simétricos a asimétricos y propuso doce categorías, de 1A (simétrico) a 4C.</p><p>Son dos fenómenos: la asimetría <b>intracromosómica</b> (dónde están los centrómeros) y la <b>intercromosómica</b> (cuánto varían las longitudes). Por eso un solo índice no basta. Se han propuesto muchos; varios son redundantes (AsK% = 100 − TF%; Syi es función de TF%). Peruzzi y Eroğlu (2013) recomiendan describirla con <b>MCA</b> (intra) y <b>CVCL</b> (inter), y Paszko (2006) añadió <b>CVCI</b>, que mide la heterogeneidad de las posiciones del centrómero.</p>',
      en: '<p>A karyotype is <b>symmetric</b> when its chromosomes are similar in size and nearly all metacentric, and <b>asymmetric</b> when there are chromosomes of very different sizes or with the centromere near one end. Stebbins (1971) saw that in many plant groups evolution goes from symmetric to asymmetric karyotypes and proposed twelve categories, from 1A (symmetric) to 4C.</p><p>These are two phenomena: <b>intrachromosomal</b> asymmetry (where the centromeres are) and <b>interchromosomal</b> asymmetry (how much the lengths vary). That is why one index is not enough. Many have been proposed; several are redundant (AsK% = 100 − TF%; Syi is a function of TF%). Peruzzi and Eroğlu (2013) recommend describing it with <b>MCA</b> (intra) and <b>CVCL</b> (inter), and Paszko (2006) added <b>CVCI</b>, which measures the heterogeneity of centromere positions.</p>' },
    { h: ['La mitosis y el conteo de 2n', 'Mitosis and the count of 2n'], tag: ['Bloques 2 y 6', 'Blocks 2 and 6'],
      es: '<p>Los cromosomas se cuentan y se miden en <b>metafase mitótica</b>, cuando están más condensados, casi siempre en puntas de raíz. Un <b>pretratamiento</b> (agua helada, 8-hidroxiquinoleína, colchicina) detiene las células en metafase y acorta los cromosomas; luego se <b>fija</b>, se <b>hidroliza</b>, se <b>tiñe</b> (orceína, carmín o Feulgen) y se <b>aplasta</b>. El número <b>2n</b> se cuenta en varias células; la <b>moda</b> es el número de la planta, y las células con números distintos suelen ser cromosomas perdidos o encimados al aplastar.</p><p>El <b>índice mitótico</b> (células en división entre células observadas) y las aberraciones en las fases son la base de la prueba de <i>Allium</i> para medir la toxicidad de una sustancia (Fiskesjö 1985).</p>',
      en: '<p>Chromosomes are counted and measured at <b>mitotic metaphase</b>, when they are most condensed, almost always in root tips. A <b>pretreatment</b> (ice water, 8-hydroxyquinoline, colchicine) arrests the cells at metaphase and shortens the chromosomes; then they are <b>fixed</b>, <b>hydrolysed</b>, <b>stained</b> (orcein, carmine or Feulgen) and <b>squashed</b>. The number <b>2n</b> is counted in several cells; the <b>mode</b> is the number of the plant, and cells with other numbers are usually chromosomes lost or overlapping in the squash.</p><p>The <b>mitotic index</b> (dividing cells over cells observed) and the aberrations in the phases are the basis of the <i>Allium</i> test for the toxicity of a substance (Fiskesjö 1985).</p>' },
    { h: ['La meiosis: apareamiento, quiasmas y configuraciones', 'Meiosis: pairing, chiasmata and configurations'], tag: ['Bloque 5', 'Block 5'],
      fig: ['meiosis', 'Las configuraciones más comunes en diacinesis y metafase I.', 'The most common configurations at diakinesis and metaphase I.'],
      es: '<p>En la profase I los homólogos se aparean y se entrecruzan; cada entrecruzamiento se ve en diacinesis como un <b>quiasma</b>. Un <b>bivalente en anillo</b> tiene quiasmas en los dos brazos y uno <b>en varilla</b>, en uno solo; un <b>univalente</b> es un cromosoma sin pareja. Contar las configuraciones de cada célula da la frecuencia de quiasmas y el <b>índice de recombinación</b> (número haploide más quiasmas por célula).</p><p>En un <b>autopoliploide</b> hay más de dos homólogos de cada cromosoma y pueden aparearse varios a la vez: aparecen <b>trivalentes</b> y <b>cuadrivalentes</b>. En un <b>alopoliploide</b> cada cromosoma se aparea sólo con el de su propio genoma y se forman bivalentes. Comparar lo observado con lo esperado bajo cada hipótesis (Jackson y Casey 1982) ayuda a decidir el origen de un poliploide. Una meiosis irregular deja tétradas anormales y polen inviable: el <b>índice meiótico</b> (Love 1951) y la tinción del polen lo miden.</p>',
      en: '<p>In prophase I homologues pair and cross over; each crossover is seen at diakinesis as a <b>chiasma</b>. A <b>ring bivalent</b> has chiasmata in both arms and a <b>rod bivalent</b> in one only; a <b>univalent</b> is a chromosome without a partner. Counting the configurations of each cell gives the chiasma frequency and the <b>recombination index</b> (haploid number plus chiasmata per cell).</p><p>In an <b>autopolyploid</b> there are more than two homologues of each chromosome and several may pair at once: <b>trivalents</b> and <b>quadrivalents</b> appear. In an <b>allopolyploid</b> each chromosome pairs only with the one of its own genome and bivalents form. Comparing the observed with the expected under each hypothesis (Jackson and Casey 1982) helps decide the origin of a polyploid. An irregular meiosis leaves abnormal tetrads and inviable pollen: the <b>meiotic index</b> (Love 1951) and pollen staining measure it.</p>' },
    { h: ['Ploidía, número básico, aneuploidía y disploidía', 'Ploidy, base number, aneuploidy and dysploidy'], tag: ['Bloques 6 y 8', 'Blocks 6 and 8'],
      fig: ['ploidy', 'Un diploide y un tetraploide con el mismo número básico.', 'A diploid and a tetraploid with the same base number.'],
      es: '<p>El <b>número básico x</b> es el número de cromosomas de un juego monoploide del grupo; el <b>nivel de ploidía</b> es cuántos juegos tiene una planta (2n = 4x = 28 con x = 7 es un tetraploide). Los niveles múltiplos de x forman una <b>serie euploide</b>. Ganar o perder cromosomas sueltos es <b>aneuploidía</b> (2n = 2x + 1, un trisómico). La <b>disploidía</b> es otra cosa: un cambio del número básico por fusiones o fisiones de cromosomas, sin cambiar la cantidad de ADN de golpe (Guerra 2008; Schubert y Lysak 2011). El Bloque 8 reconstruye estos eventos sobre un árbol.</p>',
      en: '<p>The <b>base number x</b> is the number of chromosomes of one monoploid set of the group; the <b>ploidy level</b> is how many sets a plant has (2n = 4x = 28 with x = 7 is a tetraploid). Levels that are multiples of x form a <b>euploid series</b>. Gaining or losing single chromosomes is <b>aneuploidy</b> (2n = 2x + 1, a trisomic). <b>Dysploidy</b> is something else: a change of the base number by fusions or fissions of chromosomes, with no sudden change in the amount of DNA (Guerra 2008; Schubert and Lysak 2011). Block 8 reconstructs these events on a tree.</p>' },
    { h: ['El tamaño del genoma: valores C y Cx', 'Genome size: C- and Cx-values'], tag: ['Bloque 6', 'Block 6'],
      es: '<p>El <b>valor 2C</b> es la cantidad de ADN del núcleo de una célula somática antes de replicarse; el <b>1C</b>, la mitad (la de un gameto). El <b>valor 1Cx</b> es la cantidad de un solo juego monoploide: 2C dividido entre el nivel de ploidía (Greilhuber et al. 2005). En la <b>citometría de flujo</b> los núcleos teñidos de la muestra se miden junto con los de un <b>patrón interno</b> de contenido conocido: 2C muestra = (pico de la muestra / pico del patrón) × 2C patrón. Un buen pico tiene un <b>coeficiente de variación</b> bajo (menos de 3 a 5 %). Para pasar de picogramos a pares de bases, 1 pg = 978 Mpb (Doležel et al. 2003).</p>',
      en: '<p>The <b>2C-value</b> is the amount of DNA of a somatic nucleus before it replicates; <b>1C</b>, half of it (that of a gamete). The <b>1Cx-value</b> is the amount of a single monoploid set: 2C divided by the ploidy level (Greilhuber et al. 2005). In <b>flow cytometry</b> the stained nuclei of the sample are measured together with those of an <b>internal standard</b> of known content: sample 2C = (sample peak / standard peak) × standard 2C. A good peak has a low <b>coefficient of variation</b> (under 3 to 5%). To go from picograms to base pairs, 1 pg = 978 Mbp (Doležel et al. 2003).</p>' },
    { h: ['Bandeo e hibridación in situ', 'Banding and in-situ hybridization'], tag: ['Bloque 7', 'Block 7'],
      es: '<p>Las <b>bandas</b> reconocen cromosomas que se parecen por su tamaño y forma. Las <b>bandas C</b> muestran la heterocromatina constitutiva; los <b>fluorocromos</b> la distinguen por su composición: CMA⁺ marca regiones ricas en GC (a menudo las NOR) y DAPI⁺, ricas en AT (Guerra 2000). La <b>hibridación in situ fluorescente</b> (FISH) pone una sonda de ADN marcada sobre los cromosomas: los <b>ADNr 5S y 45S</b> y los <b>telómeros</b> son las sondas más usadas en plantas, y la hibridación genómica (GISH) distingue los genomas de un híbrido o un alopoliploide (Jiang y Gill 2006). Cada señal se registra por su cromosoma, su brazo y su posición relativa desde el centrómero.</p>',
      en: '<p><b>Bands</b> tell apart chromosomes that look alike by size and shape. <b>C-bands</b> show constitutive heterochromatin; <b>fluorochromes</b> distinguish it by composition: CMA⁺ marks GC-rich regions (often the NORs) and DAPI⁺, AT-rich ones (Guerra 2000). <b>Fluorescence in situ hybridization</b> (FISH) lays a labelled DNA probe on the chromosomes: the <b>5S and 45S rDNA</b> and the <b>telomeres</b> are the most used probes in plants, and genomic hybridization (GISH) tells apart the genomes of a hybrid or an allopolyploid (Jiang and Gill 2006). Each signal is recorded by its chromosome, its arm and its relative position from the centromere.</p>' },
    { h: ['Comparar cariotipos y la evolución del número', 'Comparing karyotypes and number evolution'], tag: ['Bloque 8', 'Block 8'],
      es: '<p>Para comparar taxones se reúnen sus parámetros cariológicos (2n, x, longitud haploide, MCA, CVCL, CVCI, contenido 2C, posiciones de las señales) en una matriz y se analizan con métodos multivariados: distancias, agrupamiento y componentes principales (Peruzzi y Altınordu 2014). Sobre un árbol de los taxones, la <b>parsimonia</b> reconstruye los números de los antepasados con el menor costo de eventos: duplicación (poliploidía), <b>disploidía</b> ascendente o descendente y demiploidía (Sankoff 1975; los tipos de evento siguen a Mayrose et al. 2010).</p>',
      en: '<p>To compare taxa their karyological parameters (2n, x, haploid length, MCA, CVCL, CVCI, 2C content, positions of the signals) are gathered in a matrix and analysed with multivariate methods: distances, clustering and principal components (Peruzzi and Altınordu 2014). On a tree of the taxa, <b>parsimony</b> reconstructs the numbers of the ancestors with the lowest cost of events: duplication (polyploidy), ascending or descending <b>dysploidy</b> and demiploidy (Sankoff 1975; the kinds of event follow Mayrose et al. 2010).</p>' },
  ];

  /* ---------------- builders ---------------- */
  function buildStepper() {
    const nav = el('stepper');
    if (!nav) return;
    nav.innerHTML = STEPS.map(s => `<button type="button" class="step-btn${s.n === 1 ? ' active' : ''}${s.ready ? '' : ' soon'}" data-step="${s.n}"${s.ready ? '' : ' disabled data-soon="' + T('pronto', 'soon') + '"'}><span class="step-num">${s.n}</span>${L2(s.es, s.en)}</button>`).join('');
    nav.addEventListener('click', e => { const b = e.target.closest('.step-btn'); if (b && !b.disabled) goStep(b.dataset.step); });
  }
  function buildWorkflow() {
    const host = el('workflow');
    if (!host) return;
    host.innerHTML = WORKFLOW.map((w, i) => `<div class="wf-step"><div class="wf-n">${L2('PASO ' + (i + 1), 'STEP ' + (i + 1))}</div>` +
      `<div class="wf-t">${L2(w[0], w[1])}</div><div class="wf-d">${L2(w[2], w[3])}</div></div>`).join('');
  }
  function buildBlocks() {
    const host = el('blockGrid');
    if (!host) return;
    host.innerHTML = BLOCKS.map(b => {
      const st = STEPS.find(s => s.n === b.n);
      return `<button type="button" class="feature" data-go="${b.n}"${st && st.ready ? '' : ' aria-disabled="true"'}>` +
        `<span class="f-num">${b.n}</span><div class="f-art" data-card="${b.n}"></div>` +
        `<span class="f-tag">${L2(b.tag[0], b.tag[1])}${st && st.ready ? '' : ` <span class="f-soon">${L2('pronto', 'soon')}</span>`}</span>` +
        `<h3>${L2(b.es, b.en)}</h3><p>${L2(b.d[0], b.d[1])}</p></button>`;
    }).join('');
    host.addEventListener('click', e => {
      const b = e.target.closest('.feature');
      if (!b) return;
      const n = b.dataset.go;
      if (stepOn(n)) goStep(n);
      else toast(T('Ese bloque llega en una próxima etapa de esta construcción.', 'That block arrives in a later stage of this build.'));
    });
  }
  function buildExamples() {
    const host = el('exampleStrip');
    if (!host) return;
    host.innerHTML = EXAMPLES.map(x => `<div class="material"><div class="mt-art" data-ex="${x.k}"></div>` +
      `<div class="mt-t">${x.t}</div><div class="mt-s">${L2(x.d[0], x.d[1])}</div><span class="mt-k">${L2(x.tag[0], x.tag[1])}</span>` +
      `<button type="button" class="btn btn-secondary btn-sm" data-example="${x.k}">${L2('Abrir el ejemplo', 'Open the example')}</button></div>`).join('');
    host.addEventListener('click', e => {
      const b = e.target.closest('[data-example]');
      if (!b) return;
      if (window.Examples && Examples.open) Examples.open(b.dataset.example);
      else toast(T('Los ejemplos se abren cuando lleguen los bloques que los usan.', 'The examples open when the blocks that use them arrive.'));
    });
  }
  function buildMethods() {
    const host = el('methodGallery'), filt = el('methodFilter');
    if (!host || !filt) return;
    filt.innerHTML = `<button type="button" class="chip on" data-f="" aria-pressed="true">${L2('Todos', 'All')} (${METHODS.length})</button>` +
      Object.keys(FAMS).map(f => `<button type="button" class="chip" data-f="${f}" aria-pressed="false">${L2(FAMS[f][0], FAMS[f][1])}</button>`).join('');
    host.innerHTML = METHODS.map(m => `<div class="method-card" data-fam="${m[0]}">` +
      `<span class="m-fam ${m[0]}">${L2(FAMS[m[0]][0], FAMS[m[0]][1])}</span>` +
      `<div class="m-name">${L2(m[1], m[2])}</div><div class="m-sub">${L2(m[3], m[3].replace(/ y /g, ' &amp; '))}</div></div>`).join('');
    filt.addEventListener('click', e => {
      const b = e.target.closest('.chip');
      if (!b) return;
      filt.querySelectorAll('.chip').forEach(c => { c.classList.toggle('on', c === b); c.setAttribute('aria-pressed', c === b ? 'true' : 'false'); });
      const f = b.dataset.f;
      host.querySelectorAll('.method-card').forEach(c => { c.hidden = !!f && c.dataset.fam !== f; });
    });
  }
  function buildTheory() {
    const fig = (k, es, en) => `<figure class="theory-fig"><div data-theory="${k}"></div><figcaption class="cap">${L2(es, en)}</figcaption></figure>`;
    const host = el('theoryHost');
    if (!host) return;
    host.innerHTML = THEORY.map((t, i) => `<details class="acc"${i === 0 ? ' open' : ''}><summary>${L2(t.h[0], t.h[1])}<span class="acc-tag">${L2(t.tag[0], t.tag[1])}</span></summary>` +
      `<div class="acc-body clearfix">${t.fig ? fig(t.fig[0], t.fig[1], t.fig[2]) : ''}${L2(t.es, t.en)}</div></details>`).join('');
  }
  function buildRefs() {
    const host = el('refList'), tools = el('refTools');
    if (!host) return;
    const topics = Object.keys(REF_TOPICS).filter(t => REFS.some(r => r[1] === t));
    if (tools) {
      tools.innerHTML = `<button type="button" class="chip on" data-t="" aria-pressed="true">${L2('Todas', 'All')} (${REFS.length})</button>` +
        topics.map(t => `<button type="button" class="chip" data-t="${t}" aria-pressed="false">${L2(REF_TOPICS[t][0], REF_TOPICS[t][1])}</button>`).join('');
      tools.addEventListener('click', e => {
        const b = e.target.closest('.chip');
        if (!b) return;
        tools.querySelectorAll('.chip').forEach(c => { c.classList.toggle('on', c === b); c.setAttribute('aria-pressed', c === b ? 'true' : 'false'); });
        host.querySelectorAll('li').forEach(li => { li.hidden = !!b.dataset.t && li.dataset.t !== b.dataset.t; });
      });
    }
    host.innerHTML = REFS.map(r => `<li data-t="${r[1]}">${r[0]} <span class="ref-topic">${L2(REF_TOPICS[r[1]][0], REF_TOPICS[r[1]][1])}</span></li>`).join('');
  }
  /* cited by its author, title and version; there is no DOI yet */
  const CITE_TITLE = 'CytogeneticsPro: citogenética vegetal en el navegador';
  function citeText() {
    return {
      apa: `Barrera-Guzmán, L. Á. (2026). <i>${CITE_TITLE}</i> (versión ${APP_VERSION}) [Programa de cómputo]. LABG Suite.`,
      apaEn: `Barrera-Guzmán, L. Á. (2026). <i>${CITE_TITLE}</i> (version ${APP_VERSION}) [Computer software]. LABG Suite.`,
      bib: `@software{barreraguzman2026cytogeneticspro,\n  author  = {Barrera-Guzmán, Luis Ángel},\n  title   = {${CITE_TITLE}},\n  version = {${APP_VERSION}},\n  year    = {2026},\n  note    = {LABG Suite}\n}`,
    };
  }
  function buildCite() {
    const C = citeText();
    const a = el('citeApa'), b = el('citeBib');
    if (a) a.innerHTML = L2(C.apa, C.apaEn);
    if (b) b.textContent = C.bib;
    const copy = (btn, text) => btn && btn.addEventListener('click', () => {
      const done = () => toast(T('Copiado', 'Copied'), 'success');
      if (navigator.clipboard) navigator.clipboard.writeText(text()).then(done, () => {}); else done();
    });
    copy(el('copyApa'), () => T(C.apa, C.apaEn).replace(/<[^>]+>/g, ''));
    copy(el('copyBib'), () => C.bib);
  }
  /* every picture is drawn again when the language changes: their labels are
     written with T() at drawing time */
  function paintArt() {
    const h = el('heroArt');
    if (h) try { h.innerHTML = Art.hero(); } catch (e) { console.error(e); }
    els('[data-card]').forEach(d => { const f = Art.cards[d.dataset.card]; if (f) d.innerHTML = f(); });
    els('[data-ex]').forEach(d => { const f = Art.examples[d.dataset.ex]; if (f) d.innerHTML = f(); });
    els('[data-theory]').forEach(d => { const f = Art.theory[d.dataset.theory]; if (f) d.innerHTML = f(); });
    els('.soon-art[data-art]').forEach(d => { const g = Art.cards[d.dataset.art]; if (g) d.innerHTML = g(); });
  }

  /* opening a project from the Home or with Ctrl+O */
  function bindProjectFile() {
    const input = el('projectFile');
    if (!input) return;
    input.addEventListener('change', async () => {
      const f = input.files && input.files[0];
      input.value = '';
      if (!f) return;
      try {
        loadProject(await readFileText(f));
        toast(T('Proyecto abierto: ', 'Project opened: ') + f.name, 'success');
        if (stepOn(2)) goStep(2);
      } catch (e) {
        toast(T('No se pudo abrir el proyecto: ', 'Could not open the project: ') + e.message, 'error');
      }
    });
  }

  /* ---------------- start ---------------- */
  document.addEventListener('DOMContentLoaded', () => {
    const bl = el('brandLogo');
    if (bl) bl.innerHTML = Art.logo(30);
    const iso = el('suiteIso');
    if (iso && window.LABG && LABG.isotipo) iso.outerHTML = LABG.isotipo('labg-iso');
    const brand = el('brand');
    if (brand) brand.addEventListener('click', () => goStep(1));
    buildStepper();
    buildWorkflow();
    buildBlocks();
    buildExamples();
    buildMethods();
    buildTheory();
    buildRefs();
    buildCite();
    paintArt();
    bindProjectFile();
    const go = (id, f) => { const b = el(id); if (b) b.addEventListener('click', f); };
    const scrollTo = id => { const t = el(id); if (t) t.scrollIntoView({ behavior: 'smooth', block: 'start' }); };
    go('startBtn', () => { if (stepOn(2)) goStep(2); else { scrollTo('labs'); toast(T('La medición sobre imágenes llega con el Bloque 2; mientras, prueba los laboratorios.', 'Measuring on images arrives with Block 2; meanwhile, try the labs.')); } });
    go('labsBtn', () => scrollTo('labs'));
    go('theoryBtn', () => scrollTo('theory'));
    go('openProjBtn', () => { const f = el('projectFile'); if (f) f.click(); });
  });
  document.addEventListener('langchange', () => {
    paintArt();
    const nav = el('stepper');
    if (nav) nav.querySelectorAll('.step-btn.soon').forEach(b => b.setAttribute('data-soon', T('pronto', 'soon')));
  });
  document.addEventListener('themechange', () => { /* the pictures use CSS variables: nothing to redraw */ });

  window.Home = { BLOCKS, METHODS, REFS, FAMS, REF_TOPICS, THEORY, EXAMPLES, citeText, CITE_TITLE, paintArt };
})();
