# Tube Sort 3D

Juego de ordenar tubos por colores con vista 3D (Three.js) y vista 2D minimalista.

## Requisitos

- Node.js (v18 o superior)

## Instalacion

```
npm install
```

## Compilar la logica del juego

La logica esta escrita en TypeScript (`logicaJuego.ts`). Hay que compilarla a JavaScript antes de abrir el juego.

Compilar una vez:

```
npm run build
```

Compilar automaticamente cada vez que se guarda el archivo:

```
npm run watch
```

Esto genera `logicaJuego.js` que el navegador carga. No editar ese archivo directamente.

## Correr el juego

Abrir `index.html` en el navegador. No requiere servidor, funciona directamente desde el sistema de archivos.

Si se quiere usar un servidor local:

```
npx serve .
```

## Archivos

- `logicaJuego.ts` - Logica del juego (editar este)
- `logicaJuego.js` - Generado por el compilador, no se sube al repositorio
- `juego3d.js` - Renderizado 3D y 2D con Three.js
- `index.html` - Pagina principal
- `styles.css` - Estilos

## Controles

- Clic en un tubo para seleccionarlo, clic en otro para mover el bloque
- Boton 2D / 3D para cambiar la vista
- Undo para deshacer el ultimo movimiento
- Reset para volver al estado inicial
- New Game para generar un nuevo tablero

