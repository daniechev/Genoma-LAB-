# Guion del stand · ¿Qué cambia con una letra?

Una guía para que cualquiera del grupo pueda presentar igual de bien. Los tiempos son aproximados: no hace falta memorizarlo palabra por palabra.

## Antes de abrir el stand

- [ ] Abrir `index.html` y ponerla en pantalla completa (botón ⛶ arriba a la derecha, o F11).
- [ ] En **Resultados del stand** (abajo a la derecha), activar el **modo stand**. Si nadie toca la pantalla durante 90 segundos, la app vuelve sola al inicio y muestra el recorrido guiado.
- [ ] Imprimir el cartel con el código QR (en **Resultados del stand**, o abriendo `cartel.html`).
- [ ] Probar que el QR abra la app en un celular.
- [ ] Si viene el jurado: tener una terminal lista para correr `node --test` (muestra las 27 pruebas automáticas).
- [ ] Para presentar al jurado: abrir `presentacion.html` en la pantalla grande y apretar **P** para abrir la vista del presentador en la notebook (notas, cronómetro y diapositiva siguiente).
- [ ] Probar el sonido (botón del parlante, arriba a la derecha). Si hay mucho ruido, conviene unos parlantes chicos.

## Para que se acerquen (10 segundos)

> «¿Sabías que cambiar **una sola letra** de tu ADN puede causar una enfermedad? ¿Querés probar?»

## La explicación de un minuto

**1. El ADN es una receta** (15 s)

> «El ADN es como un libro de recetas escrito con solo cuatro letras: A, T, C y G. Esta es la receta de la hemoglobina, la proteína que lleva el oxígeno en la sangre. Tiene 444 letras.»

**2. Se lee de a tres** (15 s)

> «La célula lee la receta de a tres letras. Cada grupo de tres, el **codón**, es como una palabra que le dice qué pieza poner. La proteína es como un collar de 146 cuentas.»

**3. La demostración** (20 s). Tocá **Casos reales**, elegí **Anemia falciforme** y cambiá la A del medio por una T.

> «Cambiamos una sola letra: GAG pasa a ser GTG. Mirá: la pieza 6 era glutamato y ahora es valina. Es una pieza de 146… y alcanza para que la hemoglobina forme fibras y los glóbulos rojos se deformen. Eso es la anemia falciforme.»

**4. El cierre** (10 s)

> «Una letra puede no cambiar nada, cambiar una pieza o cortar toda la proteína. Depende de **dónde** cae el cambio y de **qué tipo** de cambio es. ¿Querés probar vos?»

**5. Lo que pasa después** (si hay 30 segundos más). Bajá hasta **Lo que pasa después**:

> «Mirá la fábrica: el ribosoma lee de a tres y por cada codón llega una pieza. Ahí está la valina. Y en la sangre: con poco oxígeno, los glóbulos se vuelven medialunas y se traban. ¿Querés escucharlo? La pieza 6 era una nota aguda y ahora es grave.»

## Analogías que funcionan

| Idea | Analogía |
|---|---|
| ADN | Un libro de recetas con solo cuatro letras |
| Gen | Una receta del libro |
| Codón | Una palabra de tres letras |
| Proteína | Un collar de cuentas (las piezas) |
| Mutación | Una errata en la receta |
| Mutación silenciosa | Escribir «kilo» o «quilo»: cambia una letra, pero se entiende lo mismo |
| STOP antes de tiempo | Un punto final en la mitad de la receta: lo que sigue no se lee |
| Quitar o agregar una letra | «LUZ SOL MAR PAN» sin la S queda «LUZ OLM ARP AN»: todo lo que sigue pierde sentido |
| Portadores y malaria | Como un seguro: una copia protege contra la malaria, dos copias enferman |
| Mutación recesiva (leopardo negro) | Un auto con dos frenos: si uno se rompe, el otro alcanza |
| Valina 6 y las fibras | Un velcro: la valina son los ganchitos y el bolsillo de otra hemoglobina, los pelitos |
| Piezas que la evolución no cambia | Las paredes que sostienen una casa: se puede cambiar el color de una puerta, pero no sacar una columna |
| Reloj molecular | Los cambios se acumulan con el tiempo, como las marcas de un reloj de arena |

## Preguntas que suele hacer el jurado

**¿Lo programaron ustedes? ¿Cómo sabe qué pieza sale?**
Programamos la tabla del código genético (los 64 codones) en `js/genetica.js`. Para cada mutación, el programa lee el ADN de a tres letras hasta el STOP y compara la proteína con la normal. Hay 21 pruebas automáticas; una de ellas verifica que el gen normal da exactamente la proteína real publicada en UniProt.

**¿De dónde sacaron los datos?**
La proteína, de UniProt (P68871). La estructura 3D, de una medición con rayos X (PDB 2HHB).

**¿El modelo 3D muestra la proteína con la mutación?**
No. Marca dónde cae el cambio sobre la proteína normal. Calcular cómo se pliega una proteína mutada es un problema mucho más difícil que no resolvemos.

**¿Por qué es la pieza 6 si cambiamos el codón 7?**
El primer codón, ATG, pone una metionina que la célula quita cuando termina de fabricar la proteína. Por eso las piezas se cuentan desde la segunda.

**¿Qué pasa con todas las mutaciones posibles?**
Probamos las 1.332 formas de cambiar una letra por otra (444 letras × 3 letras nuevas). Unas 7 de cada 10 cambian una pieza, 1 de cada 4 no cambia nada y muy pocas cortan la proteína o tocan su inicio o su final. Los números exactos están en la portada.

**¿Qué es el segundo experimento?**
Comparamos nuestra cadena beta con la de 16 especies (del mandril a la rana) y medimos en la estructura 3D real la distancia de cada pieza al hierro del hemo, donde se agarra el oxígeno. Cerca del hemo, 21 de 37 piezas son iguales en todas las especies (57 %); lejos, 22 de 109 (20 %). Las piezas que hacen el trabajo casi no pueden cambiar.

**¿De dónde sacaron las otras especies?**
De UniProt/Swiss-Prot, la misma base de datos de la proteína humana. Vienen en un archivo de ejemplo del programa HMMER, que usan los científicos para comparar proteínas. Una prueba automática verifica que las 16 tengan 146 piezas válidas.

**¿La pieza 6 nunca cambia en la evolución?**
Sí cambia: en el suslik, el equidna y el ornitorrinco es otra. Pero ninguna especie tiene valina. No importa solo dónde cae el cambio, también qué pieza llega.

**¿Lo que muestra «En la sangre» lo calcula el programa?**
No. Es una ilustración de lo que se sabe de los casos reales (falciforme, hemoglobina C y talasemias). Para los demás cambios dice que no se sabe.

**Si la anemia falciforme es grave, ¿por qué es tan común?**
Porque tener una sola copia de la mutación protege contra la malaria. Donde había mucha malaria, los portadores sobrevivían más. 

**¿Qué límites tiene el simulador?**
No calcula la forma ni la función de la proteína mutada, no incluye el ADN que está después del gen y no sirve como diagnóstico.

## Recorrido guiado para el jurado

Abrí `index.html#jurado`: arranca solo un recorrido de unos dos minutos por los tres casos reales. Se avanza con las flechas o con un control remoto de presentaciones, la barra espaciadora lo pausa y Esc lo cierra.

## Presentación formal

`presentacion.html` tiene 12 diapositivas (unos 5 minutos) con notas para cada una. Con **P** se abre la vista del presentador en otra ventana; las dos avanzan juntas con las flechas o con el control remoto. **B** deja la pantalla en negro mientras se responde una pregunta. La diapositiva 10 invita a probar el simulador en vivo.
