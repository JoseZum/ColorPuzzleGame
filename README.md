# Tube Sort 3D

Juego de ordenar tubos por colores. Tiene vista 3D con Three.js y vista 2D. Incluye un solucionador automatico con el algoritmo A*.

## Requisitos

- Node.js v18 o superior

## Instalacion

```
npm install
```

## Compilar

Los archivos TypeScript se deben compilar a JavaScript antes de abrir el juego en el navegador.

Compilar todo (logica del juego + algoritmo A*):

```
npm run build
```

Compilar solo el algoritmo A*:

```
npm run build:algo
```

Compilar la logica automaticamente al guardar cambios:

```
npm run watch
```

Los archivos `.js` generados son los que carga el navegador. No editarlos directamente.

## Correr el juego

Abrir `index.html` directamente en el navegador. No necesita servidor.

Si se prefiere usar un servidor local:

```
npx serve .
```

## Archivos

| Archivo | Descripcion |
|---|---|
| `logicaJuego.ts` | Logica del juego: tubos, movimientos, victoria. Editar este. |
| `logicaJuego.js` | Generado por el compilador. No editar. |
| `algoritmo.ts` | Algoritmo A* para resolver el puzzle. Editar este. |
| `algoritmo.js` | Generado por el compilador. No editar. |
| `juego3d.js` | Renderizado 3D/2D con Three.js y controles del juego. |
| `index.html` | Pagina principal. |
| `styles.css` | Estilos visuales. |
| `tsconfig.json` | Configuracion de compilacion para logicaJuego.ts. |
| `tsconfig.algoritmo.json` | Configuracion de compilacion para algoritmo.ts. |
| `benchmark.ts` | Benchmarks automaticos para probar A* en distintas configuraciones. |
| `benchmark.js` | Generado por el compilador. No editar. |

## Controles

- Clic en un tubo para seleccionarlo, clic en otro para mover el bloque de colores
- Boton 2D / 3D para cambiar la vista
- Undo para deshacer el ultimo movimiento
- Reset para volver al estado inicial del tablero actual
- New Game para generar un tablero nuevo aleatorio
- A* para que el algoritmo resuelva el tablero automaticamente
- Benchmark para ejecutar pruebas automaticas en 4 configuraciones distintas

## Como funciona A*

Al presionar "PROBAR A*", el algoritmo busca la secuencia de movimientos mas corta para resolver el estado actual del tablero. Cada movimiento se aplica con una animacion de 400ms entre pasos.

En la consola del navegador se puede ver el detalle de cada paso:

```
[A*] Inicio | h0=18
[A*] Paso 1 | g=0 h=18 f=18 | cola=24 visitados=0
[A*] Paso 2 | g=1 h=17 f=18 | cola=47 visitados=1
...
[A*] SOLUCION: 142 nodos | 35 movimientos | 210.45ms
```

La heuristica usada es la cantidad de bloques de colores mezclados en todos los tubos. Cuantos mas colores distintos haya apilados juntos, mayor es el costo estimado.

## Benchmark

Se incluye un sistema de pruebas automaticas (`benchmark.ts`) que evalua el desempeño del algoritmo A* en 4 configuraciones predefinidas:

- **Trivial**: 2 tubos con 1 pieza intercambiada (~3 movimientos)
- **Facil**: 2 tubos con patron alternado (~8 movimientos)
- **Medio**: 2 pares de tubos alternados (~16 movimientos)
- **Clasico**: 3 pares de tubos alternados (~30+ movimientos)

Al presionar el boton "Benchmark" en el juego, se ejecutan las pruebas y se muestra una tabla con:
- Exito/Fracaso de cada configuracion
- Tiempo de resolucion (ms)
- Numero de nodos explorados
- Longitud de la solucion (movimientos)

