# CytogeneticsPro

<!-- DOI: when the Zenodo record exists, put its badge here:
[![DOI](https://zenodo.org/badge/DOI/10.5281/zenodo.XXXXXXXX.svg)](https://doi.org/10.5281/zenodo.XXXXXXXX) -->

**From the chromosome count to the publishable karyotype** · *Español: [LEEME.md](LEEME.md)*

Plant cytogenetics in the browser: chromosome measurement on calibrated
micrographs, karyotype and idiogram, asymmetry indices, meiosis, ploidy and
genome size, banding and in-situ hybridization, comparison among taxa,
teaching, and figures and methods ready to publish. It is meant for crops and
their wild relatives (maize, chayote, fruit and forest trees) and for teaching
genetics. The interface is in Spanish and English, with light and dark themes.
There is nothing to install, and everything is computed on your own computer:
the data never leave it.

## Statement of need

A cytogenetic study goes from photographs to numbers through many small
steps: calibrating the micrographs, measuring each chromosome along its
curvature, pairing homologs, averaging over cells, classifying the
chromosomes, computing a dozen asymmetry indices, checking the meiosis,
converting flow-cytometry peaks into genome size, and drawing the idiogram
for the paper. In practice those steps are spread over an image editor, a
spreadsheet, a drawing program and scripts, and every transfer is a chance
for error. CytogeneticsPro puts the whole chain in one page that opens with a
double click: it measures on the image, computes each index with its source
cited, explains what each number means, draws the figures at journal widths
and writes the methods section from what was actually done.

## Open it

- **On line:** https://luisangelbg.github.io/CytogeneticsPro/
- **On your computer:** download the repository and double-click
  `index.html`. No server, no installation, no build step and no internet
  connection; the bundled examples work offline. Any current browser works.

To open it from another device on the same network, run
`Open CytogeneticsPro.bat` (Windows; it starts `server.ps1`, a minimal local
server on port 9900).

## The ten blocks

1. **Home** — the logic of cytogenetics in plain words, two labs that really
   compute (an idiogram drawn by dragging the arms, and the meiotic
   configurations expected for each ploidy level), the methods with their
   sources, the references and the bundled examples.
2. **Images and measurement** — micrographs calibrated with the micron bar;
   counting with numbered markers, each chromosome traced with a polyline that
   follows its curvature, centromere, secondary constrictions and satellites,
   zoom, contrast, brightness and undo; several cells per accession and the
   annotated image. Measurements can also be typed or pasted.
3. **Karyotype** — homolog pairing with correction by dragging, means over
   cells, absolute and relative lengths, centromeric index, arm ratio,
   classification by Levan et al. (1964) or Guerra (1986) with configurable
   limits, satellites, karyotype formula, total length of the complement,
   fundamental number and the idiogram to scale.
4. **Asymmetry** — TF%, AsK%, Syi, Rec, A1, A2, A, CVCL, CVCI, MCA, AI and DI
   and the Stebbins (1971) categories, with what each index measures, which
   ones are redundant and which are recommended.
5. **Meiosis** — configurations per cell, chiasmata, recombination index,
   abnormalities by phase, Love's (1951) meiotic index, pollen viability with
   its intervals and homogeneity tests, and the configurations expected for
   each ploidy level and origin (autopolyploid or allopolyploid), computed
   exactly from a model of random pairing of chromosome ends.
6. **Ploidy and genome** — 2n counts, ploidy level from the basic number,
   aneuploidy, flow cytometry in pg and Mbp with its histogram, and the
   *Allium* test: mitotic index, phases, aberrations and micronuclei.
7. **Banding and FISH** — C and N bands, fluorochromes and in-situ
   hybridization signals by chromosome and position, drawn on the idiogram and
   on the map of each chromosome, with their agreement among cells.
8. **Comparison** — matrix of karyological parameters, distances, UPGMA,
   Ward, principal components with a biplot, parallel idiograms, chromosome
   number evolution by parsimony on a Newick tree and a map of cytotypes.
9. **Teaching** — mitosis and meiosis step by step for one to six pairs (with
   crossing-over, random orientation and what to count in each phase), a
   karyotype exercise on a simulated metaphase that grades itself,
   self-assessment in Spanish and English with new numbers each time, an
   illustrated glossary and a printable practice sheet with cited protocols.
10. **Figures and report** — every figure of the project (idiograms,
    karyogram cut from the image, Stebbins categories, MCA × CVCL, cytometry
    histograms, dendrogram, biplot, tree with the numbers and map) in SVG or
    PNG; every table in CSV or TSV; methods written in Spanish or English with
    their references; a printable report and a reproducible `.zip` package
    with the project, the tables, the figures and the report.

## Tests and validation

- **Unit tests.** Open `tests/index.html` with a double click: 684 tests of
  every engine, against published examples (Peruzzi and Eroğlu 2013; Zuo and
  Yuan 2011), values computed in R, closed formulas and small cases solved by
  hand. Every line must be green.
- **Validation against R.** The asymmetry indices of 81 karyotypes, the
  Stebbins categories, the centromeric index, the arm ratio and the class of
  1,289 chromosomes (Levan et al. 1964 and Guerra 1986), the Wilson and
  Clopper–Pearson intervals, the χ² and G tests, the two-proportion test,
  Holm's correction and the genome-size conversions were recomputed with
  formulas written independently in R 4.4.2: **9,310 comparisons, none
  failing** (tolerance 1e-6). The distances, UPGMA, Ward, the cophenetic
  correlation and the principal components were also checked against base R.
  The comparison scripts and their reports stay on the author's computer and
  are not part of the distributed program; `CHANGELOG.md` gives the counts
  and the errors the validation caught.

## Documentation

| Document | Language | What it is |
|---|---|---|
| `manual/CytogeneticsPro_Manual_de_usuario_ES.pdf` | Spanish | User manual, 145 pages: introduction, one chapter per block, appendices (files, decision rules, glossary, common problems, licence and how to cite, the 48 references) |
| `manual/en/CytogeneticsPro User's Manual (English).pdf` | English | The same manual in English, 147 pages |
| `manual/es/`, `manual/en/` | Spanish, English | The parts of the manuals in HTML; `manual/LEEME.md` explains how they are built |
| Home page of the app (Block 1) | Spanish and English | Theory in plain words, the methods with their sources, and the references |
| [`CHANGELOG.md`](CHANGELOG.md) | Spanish | What changed in each stage and version |
| [`PROCEDENCIA.md`](PROCEDENCIA.md) | Spanish | Item by item, what is original work and where the methods and the example data come from |

## Data and third-party material

All the statistical and cytogenetic engines, the figures and the interface
are the author's own code, and the program requests nothing from the
internet. It implements published methods, each one cited to its original
source in the code, on the Home page and in the methods written by Block 10.
The only third-party material is the line icons drawn by the shared modules
of the suite (navigator, figure studio and effects), from the Lucide project
under the ISC licence (those derived from Feather also under MIT), listed
with their licence texts in [`LICENSES-TERCEROS.md`](LICENSES-TERCEROS.md).
The four examples are simulated with the author's own script
(`data/generar_ejemplos.js`): the species and places are real, the
measurements are not, and the app says so on screen. `PROCEDENCIA.md` (in
Spanish) gives the details.

## How to cite

Barrera-Guzmán, L. Á. (2026). CytogeneticsPro: plant cytogenetics in the
browser (Version 1.0.0) [Computer software].
https://github.com/luisangelbg/CytogeneticsPro

<!-- DOI: when the Zenodo record exists, replace the repository address above with
https://doi.org/10.5281/zenodo.XXXXXXXX (concept DOI) and add the line below. -->

The **Home** page of the app gives the citation ready to copy, also as a
BibTeX entry. `CITATION.cff` has the same data for reference managers.

## Contributing and support

Problems and proposals go to
https://github.com/luisangelbg/CytogeneticsPro/issues (the **Report a
problem** button of the app opens one with the block and the browser already
filled in).

## Licence

GNU General Public License, version 3 or later (`LICENSE`).
