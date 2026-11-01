# CytogeneticsPro en el portal de la LABG Suite

Lo que hace falta para que CytogeneticsPro aparezca en `luisangelbg.github.io`.

1. **Imágenes.** `CytogeneticsPro.webp` (captura de la portada, 1200 × 750) va a
   `assets/apps/CytogeneticsPro.webp`, y `CytogeneticsPro.jpg` (imagen para redes,
   1200 × 630, hecha con `og.html`) a `assets/og/CytogeneticsPro.jpg`.
2. **Catálogo.** El bloque de abajo va en `data/apps.js`, dentro de
   `window.LABG_APPS` (después de GermplasmPro, en Genética). Va con
   `estado: "proximamente"`; cuando el repositorio esté en GitHub Pages se cambia a
   `"enlinea"`, y si se archiva en Zenodo, el DOI de concepto va en `doi`.
3. **Páginas generadas.** `node scripts/build.mjs` (o el flujo de GitHub al cambiar
   `data/`) crea `apps/cytogeneticspro/` y la añade al mapa del sitio.

```js
  {
    id: "CytogeneticsPro", nombre: "CytogeneticsPro",
    lema: "Del conteo cromosómico al cariotipo publicable",
    descripcion: "Citogenética vegetal en el navegador, de la fotomicrografía al informe: medición de cromosomas sobre imágenes calibradas, cariotipo con su fórmula e idiograma a escala, índices de asimetría y categorías de Stebbins, meiosis con las configuraciones esperadas según la ploidía, conteos, citometría de flujo y prueba de Allium, bandeo y FISH, comparación entre taxones con distancias, ACP y evolución del número cromosómico sobre un árbol, docencia con simuladores de mitosis y meiosis, y un informe con métodos redactados y paquete reproducible. Validada contra R.",
    categoria: "genetica", estado: "proximamente", version: "1.0.0", doi: "", licencia: "GPL-3.0",
    manualPdf: "", manualMb: 0, manualHtml: false, datos: true,
    puntos: ["Medición sobre la imagen, cariotipo, fórmula e idiograma a escala", "Asimetría, meiosis con configuraciones esperadas y citometría de flujo", "Bandeo y FISH, distancias, ACP y evolución del número sobre un árbol", "Simuladores de mitosis y meiosis, ejercicios, informe y .zip reproducible"],
    destacada: false
  },
```
