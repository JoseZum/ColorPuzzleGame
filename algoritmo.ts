// Globales de logicaJuego.js y juego3d.js (cargados como <script> antes que éste)
type Estado = any[]
declare var NUMERO_TUBOS: number
declare function clonarEstado(e: Estado): Estado
declare function moverEntreTubos(e: Estado, f: number, t: number): boolean
declare function detectarVictoria(e: Estado): boolean
declare function estadoActual(h: any): Estado | undefined
declare function hacerMovimiento(h: any, from: number, to: number): boolean
declare function updateLiquids(): void
declare function render2D(): void
declare var historial: any
declare function puedeMover(origen: any, destino: any): boolean

// Cada nodo representa un estado del tablero alcanzado durante la búsqueda
interface NodoAEstrella {
    estado: Estado     
    g: number               
    h: number               
    f: number //f = g + h
    padre: NodoAEstrella | null //nodo anterior para reconstruir el camino
    movimiento: [number, number] | null  //par (desde, hasta) que produjo este estado

}

class MinHeap<T> {
    items: T[] = []
    comparador: (a: T, b: T) => number

    constructor(comparador: (a: T, b: T) => number) {
        this.comparador = comparador
    }

    push(item: T) {
        this.items.push(item)
        this.items.sort(this.comparador)
    }

    pop(): T {
        return this.items.shift()!
    }

    isEmpty(): boolean {
        return this.items.length === 0
    }
}

function estadoToString(estado: Estado): string {
    // Ordenar los tubos antes de serializar para evitar duplicados
    const tubosSerializados = estado.map((tubo: any) => tubo.toArray().join(","))
    tubosSerializados.sort()
    return tubosSerializados.join("|")
}

// Si un tubo tiene k colores , aporta k - 1 a h, ya que cada tubo tiene que tener 1 color
function heuristica(estado: Estado): number {
    let h = 0;
    for (const tubo of estado) {
        const arr = tubo.toArray()
        if (arr.length === 0) continue
        let bloques = 1
        for (let i = 1; i < arr.length; i++) {
            if (arr[i] !== arr[i-1]) bloques++
        }
        h += bloques - 1
    }
    return h
}

// Devuelve todos los estados validos a los q se pueden llegar desde el actual
function generarSucesores(estado: Estado): Array<{estado: Estado, movimiento: [number, number]}> {
    const sucesores: Array<{estado: Estado, movimiento: [number, number]}> = []
    for (let desde = 0; desde < NUMERO_TUBOS; desde++){
        for (let hasta = 0; hasta < NUMERO_TUBOS; hasta++){
            if (desde === hasta) continue
            // cLonar el estado si solo si el movimiento es valido
            if (!puedeMover(estado[desde], estado[hasta])) continue
            const nuevoEstado = clonarEstado(estado)
            moverEntreTubos(nuevoEstado, desde, hasta)
            sucesores.push({estado: nuevoEstado, movimiento: [desde, hasta]})
        }
    }
    return sucesores
}

function AEstrella(estadoInicial: Estado): Array<[number, number]> | null {
    const pendientes = new MinHeap<NodoAEstrella>((a, b) => a.f - b.f)
    const visitados = new Set<string>()
    // mejorG: guarda el menor g con el que se ha llegado a cada estado para descartar nodos iguales o peores cuando lleguen a la cola
    const mejorG = new Map<string, number>()

    const heuristicaInicial = heuristica(estadoInicial)
    const nodoInicial: NodoAEstrella = {estado: estadoInicial, g:0, h:heuristicaInicial, f:heuristicaInicial, padre: null, movimiento:null}

    console.log(`[A*] Inicio | h0=${heuristicaInicial}`)
    const t0 = performance.now()
    let pasos = 0

    pendientes.push(nodoInicial)
    while (!pendientes.isEmpty()){
        const actual = pendientes.pop() //sacamos el nodo con menor f
        pasos++
        console.log(`[A*] Paso ${pasos} | g=${actual.g} h=${actual.h} f=${actual.f} | cola=${pendientes.items.length} visitados=${visitados.size}`)

        if (detectarVictoria(actual.estado)) {
            const t1 = performance.now()
            const camino = reconstruirCamino(actual)
            console.log(`[A*] SOLUCION: ${pasos} nodos | ${camino.length} movimientos | ${(t1-t0).toFixed(2)}ms`)
            return camino
        }

        const estadoActualString = estadoToString(actual.estado)
        if (visitados.has(estadoActualString)) continue

        visitados.add(estadoActualString)
        const sucesores = generarSucesores(actual.estado)

        for (const sucesor of sucesores){
            const estadoSucesorString = estadoToString(sucesor.estado)
            if (visitados.has(estadoSucesorString)) continue

            const g = actual.g + 1
            // Si ya tenemos registrado un camino igual o mejor hacia este estado, se ignora 
            const gAnterior = mejorG.get(estadoSucesorString)
            if (gAnterior !== undefined && g >= gAnterior) continue
            mejorG.set(estadoSucesorString, g)

            const hSuc = heuristica(sucesor.estado)
            const nodoSuc: NodoAEstrella = {estado: sucesor.estado, g, h: hSuc, f: g + hSuc, padre: actual, movimiento: sucesor.movimiento}
            pendientes.push(nodoSuc)
        }
    }
    const t1 = performance.now()
    console.log(`[A*] SIN SOLUCION | ${pasos} nodos | ${(t1-t0).toFixed(2)}ms`)
    return null
}

// Sube x los punteros hasta llegar al nodo raíz 
function reconstruirCamino(nodo: NodoAEstrella): Array<[number, number]> {
    const movimientos: Array<[number, number]> = []
    let actual: NodoAEstrella  = nodo

    while (actual !== null && actual.padre !== null) {
        movimientos.push(actual.movimiento!)
        actual = actual.padre
    }
    return movimientos.reverse()
}

// Integración con el juego
;(window as any).solveWithAStar = function (): void {
    const estado = estadoActual(historial)
    if (!estado) { console.warn("[A*] Sin estado actual"); return }
    console.log("[A*] Calculando solución...")
    const movimientos = AEstrella(clonarEstado(estado))
    if (!movimientos) { console.warn("[A*] El puzzle no tiene solución"); return }
    console.log(`[A*] Aplicando ${movimientos.length} movimientos...`)
    let delay = 0
    for (const [desde, hasta] of movimientos) {
        setTimeout(function() {
            hacerMovimiento(historial, desde, hasta)
            updateLiquids()
            render2D()
        }, delay)
        delay += 400
    }
}


