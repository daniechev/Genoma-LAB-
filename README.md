# Genoma LAB · ¿Qué cambia con una letra?

Laboratorio interactivo para una feria de ciencias. El visitante elige una letra del ADN de la **hemoglobina** (gen *HBB*), la cambia, predice qué le va a pasar a la proteína y ve el resultado en 3D.

## Cómo usarlo

Descargá el repositorio y abrí `index.html` en el navegador. No hace falta instalar nada ni tener internet: todo funciona sin servidor.

> Abrí `index.html` junto con sus carpetas `css/`, `js/` e `img/`. El archivo solo no funciona.

### En la feria

- **Modo stand:** en **Resultados del stand**, activá *Modo stand* (o abrí `index.html?stand`). Si nadie toca la pantalla durante 90 segundos, la app vuelve al simulador y muestra el recorrido guiado en bucle, sin sumar al contador. Un toque lo corta. Queda guardado en ese navegador.
- **Cartel con QR:** `cartel.html` es un cartel A4 para imprimir con un código QR que abre la app en el celular de los visitantes.
- **Tarjeta del descubrimiento:** después de cada resultado, *Guardar mi descubrimiento* arma una imagen con el cambio y su efecto, para descargarla, compartirla o sacarle una foto.
- **Guion:** [`docs/guion-del-stand.md`](docs/guion-del-stand.md) tiene una explicación de un minuto con analogías y respuestas a las preguntas que suele hacer el jurado.

### Publicarla en internet (GitHub Pages)

El QR apunta a **https://daniechev.github.io/Genoma-LAB-/**. Para que esa dirección funcione hay que hacer dos cosas una sola vez:

1. En GitHub, ir a **Settings → Pages** y en **Source** elegir **GitHub Actions**.
2. Llevar los cambios a la rama `main`. Cada vez que `main` cambia, el workflow `Publicar en GitHub Pages` corre las pruebas y, si pasan, publica la página.

Si la dirección cambia, hay que generar un QR nuevo y reemplazar `img/qr-sitio.svg`.

### Para el jurado

La página abre en **Proyecto**, una portada tipo póster con la pregunta, la hipótesis, el método, los resultados y la conclusión. Los resultados de las 1.332 sustituciones se calculan en el momento con el mismo motor del simulador.

El botón **Ver el recorrido guiado** muestra los tres casos reales solo, paso a paso, en unos dos minutos. Se puede pausar, avanzar o volver con los botones, con las flechas del teclado o con un control remoto de presentaciones (AvPág/RePág); Esc lo cierra. Para que arranque directamente, abrí `index.html#jurado`. El recorrido no suma al contador del stand, salvo que el jurado haga su propia predicción.

### El simulador

Todo está en una sola pantalla:

1. **Tocá una letra** de los 444 nucleótidos del gen.
2. **Cambiala, quitala o agregá una letra** con un solo toque. La tira del ADN muestra el *antes* y el *después* de cada codón, con la pieza (aminoácido) que fabrica.
3. **Mirá al instante** qué le pasa a la proteína y dónde cae el cambio en el modelo 3D. **Deshacer** vuelve al gen normal.

Con el **modo desafío** activado, primero hay que predecir qué va a pasar y después se ve el resultado. Las predicciones se suman a los resultados del stand.

La sección **Casos reales** propone tres mutaciones conocidas para encontrar:

| Caso | Cambio en el ADN | Efecto en la proteína |
|---|---|---|
| Anemia falciforme | codón 7: GAG → GTG | Glu6Val (cambia una pieza) |
| Hemoglobina C | codón 7: GAG → AAG | Glu6Lys (cambia una pieza) |
| Beta-talasemia | codón 40: CAG → TAG | Gln39Stop (la proteína se corta) |

Los codones se cuentan desde el ATG inicial; las piezas de la proteína, sin la metionina inicial, como en la literatura científica.

### Naturaleza

La pestaña **Naturaleza** muestra cómo cambió la hemoglobina fuera del laboratorio:

- **Una mutación que protege:** por qué la anemia falciforme es común donde había malaria. Tiene un mapa con capas (HbS, HbC, talasemias y HbE, con la malaria superpuesta) y el juego **Jugá a la evolución**: un pueblo de 100 personas donde se ve, generación a generación, cómo la malaria hace crecer a los portadores hasta un equilibrio (selección balanceada). Los valores del juego son ilustrativos.
- **Animales con hemoglobinas especiales:** la llama, el ánsar indio, el mamut lanudo y el pez de hielo. Los cambios de la llama y del mamut son de una sola letra en el gen humano y se pueden probar en el simulador, que los reconoce.

Fuentes: Piel y col. 2010 (*Nature Communications*), Taylor y col. 2012 (*Lancet Infectious Diseases*), Weatherall y Clegg 2001 (*Bull. OMS*), OMS región africana 2010, Piccinini y col. 1990, Jessen y col. 1991 (*PNAS*), Campbell y col. 2010 (*Nature Genetics*) y Cocca y col. 1995 (*PNAS*). El mapa usa Natural Earth (dominio público) y es un esquema simplificado por país.

## Estructura

```
index.html              estructura de la página
cartel.html             cartel A4 para imprimir, con el código QR
css/estilos.css         estilos
js/datos-modelos.js     coordenadas 3D de la hemoglobina (PDB y AlphaFold)
js/datos-mapa.js        mapa del mundo simplificado (Natural Earth)
js/genetica.js          ADN, código genético, casos reales y clasificación de mutaciones
js/visor-3d.js          visor 3D dibujado en canvas
js/helice.js            hélice de ADN animada de la portada
js/app.js               interfaz, póster, recorrido guiado, naturaleza, misiones, tarjeta, modo stand y contador
img/qr-sitio.svg        código QR de la dirección pública
docs/                   guion para presentar en el stand
tests/                  pruebas automáticas
.github/workflows/      pruebas en cada cambio y publicación en GitHub Pages
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

Las pruebas verifican los 64 codones contra el código genético estándar, la traducción del gen completo, cada tipo de mutación, los tres casos reales, el reparto de las 1.332 sustituciones que muestra el póster y que el póster diga cuántas pruebas hay. Conviene correrlas después de tocar `js/genetica.js`.

El código se ordena con [Prettier](https://prettier.io):

```
npx prettier@3.8.1 --write .
```

En GitHub, cada cambio corre las pruebas y revisa el formato automáticamente.

## Datos y créditos

- Secuencia y proteína: [UniProt P68871](https://www.uniprot.org/uniprotkb/P68871/entry) (hemoglobina beta humana).
- Estructura experimental: [PDB 2HHB](https://www.rcsb.org/structure/2HHB).
- Modelo predicho: [AlphaFold DB, P68871](https://alphafold.ebi.ac.uk/entry/P68871).

El contador del stand se guarda en el navegador de cada dispositivo (`localStorage`).

## Licencia

MIT. Ver [LICENSE](LICENSE).
