# Los ejemplos de CytogeneticsPro: cómo se simularon

**Ninguno de estos datos es una medición.** Los nombres de las especies y de los
lugares son reales; los números se generaron con `generar_ejemplos.js` (se corre
con `node generar_ejemplos.js` desde esta carpeta), con una semilla fija
(20261006), a partir de cariotipos base escritos a mano con valores redondos. El
guion escribe los datos dentro de `../js/examples.js`, entre las marcas
`GENERADO`; la app no lee esta carpeta. Sirven para recorrer la app de principio a
fin y para las pruebas, no para describir a esas especies.

## (a) *Zea mays*, 2n = 2x = 20

- **Cariotipo base:** longitud de un juego de 56 µm; longitud relativa de los diez
  pares 14.5, 12.6, 11.4, 11.0, 10.8, 9.2, 8.9, 8.2, 7.6 y 5.8 %; razón de brazos
  1.25, 1.30, 2.15, 1.60, 1.10, 2.40, 2.70, 2.90, 1.85 y 2.60. El par 6 lleva un
  satélite de 0.45 µm en el brazo corto (la NOR). Nudos heterocromáticos en los
  pares 2, 4, 5, 6, 7 y 8 (brazo largo) y 9 (brazo corto, cerca del telómero).
  Valores redondos que recuerdan la forma general del cariotipo del maíz.
- **Célula 1:** una metafase **dibujada por la app** (`Img.synth`): cada cromosoma
  es una línea curva con dos cromátidas, la constricción primaria, el satélite y
  los nudos, sobre un fondo claro con manchas y grano, y una barra de 10 µm
  (13.5 píxeles por micra). Los trazos que trae son los de una persona cuidadosa:
  un punto cada 8 a 14 píxeles a lo largo del centro, con un temblor de ±0.6 px.
- **Células 2 a 5:** medidas directas. Cada célula tiene un factor de
  condensación normal (media 1, desviación 0.08) y cada brazo de cada homólogo un
  error de medición normal (coeficiente de variación de 4 %). Los cromosomas
  vienen en desorden, como se miden en la placa.
- Los nudos y la NOR van como bandas del Bloque 7; doce conteos de 2n (uno de 19,
  un cromosoma perdido al aplastar) para el Bloque 6.

## (b) *Sechium edule*, 2n = 28 y 24

- **Cariotipo base de las cultivadas:** 14 pares, longitud de un juego de 30 µm,
  longitudes relativas de 10.2 a 5.2 % y razones de brazos de 1.05 a 2.4, con un
  satélite de 0.3 µm en el brazo corto del par 1.
- **Tres accesiones cultivadas** (Huatusco, Veracruz; Chilchotla, Puebla;
  Uruapan, Michoacán) con longitudes de 29.2 a 31.5 µm y una o dos razones de
  brazos cambiadas.
- **Una accesión silvestre** (*S. edule* subsp. *sylvestre*, Coscomatepec,
  Veracruz) con 2n = 24: los pares 11 + 12 y 13 + 14 de la base se fusionaron
  (disploidía descendente), lo que deja dos pares más largos.
- Tres células por accesión con el mismo modelo de error (coeficiente de
  variación de 5 %).
- **Señales:** ADNr 45S y CMA⁺ en el satélite del par 1 (en la silvestre, el par
  que le corresponde, más un segundo sitio de 45S en el par 2); ADNr 5S en el
  brazo largo del par 4; en Uruapan, un sitio extra de 45S en un solo homólogo del
  par 9 (heteromorfismo). La señal 5S se registró además célula por célula, con un
  error de posición de 0.04.
- **Coordenadas** aproximadas de las localidades y un **árbol ilustrativo** en
  Newick con siete géneros de cucurbitáceas y sus números cromosómicos (2n = 22,
  14, 24, 22, 40, 26 y 24), para la comparación y la evolución de los números. El
  árbol no es una filogenia publicada.

## (c) Serie poliploide ficticia (2x, 4x, 6x), x = 7

- Una especie inventada («Especie ficticia A») con tres poblaciones.
- **Meiosis:** 25 células por planta, dos plantas por población, sacadas del
  modelo de configuraciones esperadas de la app (`Meiosis.simulateCell`): el
  diploide como AA con c = 0.90, el tetraploide como autotetraploide AAAA con
  c = 0.78 y el hexaploide como alohexaploide AABBCC con c = 0.85, salvo un 16 %
  de sus células, sacadas como AAAABB (un apareamiento fuera del propio genoma de
  vez en cuando) para que la prueba de la hipótesis alopoliploide tenga algo que
  encontrar.
- **Fases, tétradas y polen:** anormalidades con probabilidad 2 %, 11 % y 5 % (más
  en anafase), tétradas anormales en proporción, y 380 a 440 granos de polen por
  planta con viabilidad cercana a 95 %, 78 % y 88 %.
- **Conteos:** 15 células por población; en los poliploides un 12 % tiene un
  cromosoma de más o de menos.
- **Citometría:** valores 2C de 1.62, 3.18 y 4.71 pg con un patrón interno de
  tomate (2C = 1.96 pg) en el canal 200, y un **histograma** de 1024 canales del
  tetraploide: restos celulares, los picos G0/G1 y G2 del patrón (CV 2.4 %) y los
  de la muestra (CV 3.1 %).

## (d) *Allium cepa*, prueba de citotoxicidad

- Un testigo y dos concentraciones de un extracto ficticio, tres bulbos por
  tratamiento y 1000 células por bulbo.
- Índice mitótico de 9.2, 6.6 y 3.8 %; fases en proporción 42 : 24 : 12 : 22 (pro,
  meta, ana y telofase); células en división con aberraciones en 1.8, 6.2 y
  14.1 % (c-metafase, adherencias, puentes, rezagados, fragmentos y husos
  multipolares) y micronúcleos en 0.06, 0.26 y 0.71 % de las células en
  interfase.

## El ejercicio de cariotipo del Bloque 9

No está en `js/examples.js`: cada metafase del ejercicio se inventa en el
momento (`Teach.exercise` en `js/teach.js`) con una semilla al azar y se dibuja
con el mismo generador de imágenes de los ejemplos. Tampoco son mediciones
reales.
