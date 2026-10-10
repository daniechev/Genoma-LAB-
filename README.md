# Genoma LAB · ¿Qué cambia con una letra?

Laboratorio interactivo para una feria de ciencias. El visitante elige una letra del ADN de la **hemoglobina** (gen *HBB*), la cambia, predice qué le va a pasar a la proteína y ve el resultado en 3D.

## Cómo usarlo

Descargá el repositorio y abrí `index.html` en el navegador. No hace falta instalar nada ni tener internet: todo funciona sin servidor.

> Abrí `index.html` junto con sus carpetas `css/` y `js/`. El archivo solo no funciona.

### Para el jurado

La página abre en **Proyecto**, una portada tipo póster con la pregunta, la hipótesis, el método, los resultados y la conclusión. Los resultados de las 1.332 sustituciones se calculan en el momento con el mismo motor del simulador.

El botón **Ver el recorrido guiado** muestra los tres casos reales solo, paso a paso, en unos dos minutos. Se puede pausar, avanzar o volver con los botones, con las flechas del teclado o con un control remoto de presentaciones (AvPág/RePág); Esc lo cierra. Para que arranque directamente, abrí `index.html#jurado`. El recorrido no suma al contador del stand, salvo que el jurado haga su propia predicción.

### Recorrido del simulador

1. **Elegí una letra** de los 444 nucleótidos del gen.
2. **Hacé un cambio:** reemplazarla, quitarla o agregar una letra nueva.
3. **Predecí** qué va a pasar con la proteína.
4. **Mirá el resultado** y la pieza afectada en el modelo 3D.

La sección **Casos reales** propone tres mutaciones conocidas para encontrar:

| Caso | Cambio en el ADN | Efecto en la proteína |
|---|---|---|
| Anemia falciforme | codón 7: GAG → GTG | Glu6Val (cambia una pieza) |
| Hemoglobina C | codón 7: GAG → AAG | Glu6Lys (cambia una pieza) |
| Beta-talasemia | codón 40: CAG → TAG | Gln39Stop (la proteína se corta) |

Los codones se cuentan desde el ATG inicial; las piezas de la proteína, sin la metionina inicial, como en la literatura científica.

## Estructura

```
index.html              estructura de la página
css/estilos.css         estilos
js/datos-modelos.js     coordenadas 3D de la hemoglobina (PDB y AlphaFold)
js/genetica.js          ADN, código genético, casos reales y clasificación de mutaciones
js/visor-3d.js          visor 3D dibujado en canvas
js/app.js               interfaz, póster, recorrido guiado, pasos, misiones y contador del stand
tests/                  pruebas automáticas
```

`js/genetica.js` es el corazón científico. Clasifica cada mutación así:

| Qué pasó | Categoría | Nombre científico |
|---|---|---|
| La proteína quedó igual | Nada | mutación silenciosa |
| Cambió un aminoácido | Pieza | cambio de aminoácido (*missense*) |
| Apareció un STOP antes o se perdió el ATG | Corte | sin sentido / pérdida del inicio |
| Se quitó o agregó una letra, o se perdió el STOP | Desorden | corrimiento del marco / pérdida del final |

## Pruebas

Con [Node.js](https://nodejs.org) 18 o más reciente:

```
node --test
```

Las pruebas verifican los 64 codones contra el código genético estándar, la traducción del gen completo, cada tipo de mutación, los tres casos reales y el reparto de las 1.332 sustituciones que muestra el póster. Conviene correrlas después de tocar `js/genetica.js`.

## Datos y créditos

- Secuencia y proteína: [UniProt P68871](https://www.uniprot.org/uniprotkb/P68871/entry) (hemoglobina beta humana).
- Estructura experimental: [PDB 2HHB](https://www.rcsb.org/structure/2HHB).
- Modelo predicho: [AlphaFold DB, P68871](https://alphafold.ebi.ac.uk/entry/P68871).

El contador del stand se guarda en el navegador de cada dispositivo (`localStorage`).

## Licencia

MIT. Ver [LICENSE](LICENSE).
