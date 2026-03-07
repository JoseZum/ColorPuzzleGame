const CAPACIDAD = 4
const NUMERO_TUBOS = 12
const TUBOS_VACIOS = 2

type Color = string
type Tubo = Pila<Color>
type Estado = Tubo[]
type Timeline = Pila<Estado>

class Pila<T> {
  private items: T[] = []

  push(item: T) {
    this.items.push(item)
  }

  pop(): T | undefined {
    return this.items.pop()
  }

  peek(): T | undefined {
    return this.items[this.items.length - 1]
  }

  size(): number {
    return this.items.length
  }

  isEmpty(): boolean {
    return this.items.length === 0
  }

  clone(): Pila<T> {
    const nueva = new Pila<T>()
    nueva.items = [...this.items]
    return nueva
  }

  toArray(): T[] {
    return [...this.items]
  }

  clear():void {
    this.items = []
  }

  first():T|undefined {
    return this.items[0]
  }
}

function clonarEstado(estado: Estado): Estado {
    const nuevo: Estado = []
    for (const tubo of estado) {
        nuevo.push(tubo.clone())
    }
    return nuevo
}

function guardarHistorial(estado: Estado, historial: Timeline): void {
    const clonado = clonarEstado(estado)
    historial.push(clonado)
}   

function resetear(historial: Timeline) : void {
    const estadoInicial = historial.first()
    if(!estadoInicial) return
    const clon = clonarEstado(estadoInicial)
    historial.clear()
    historial.push(clon)
}

function undo(historial: Timeline): void {
    if(historial.size()>1) historial.pop()
}

function estadoActual(historial:Timeline): Estado|undefined {
    return historial.peek()
}

function validarIndices(from:number,to:number):boolean {
    if(from<0||to<0) return false

    if(from>=NUMERO_TUBOS||to>=NUMERO_TUBOS) return false

    if(from === to) return false

    return true
}

function moverEntreTubos(estado:Estado, from:number, to:number):boolean {
    if(!validarIndices(from,to)) return false

    const origen = estado[from]
    const destino = estado[to]

    return mover(origen,destino)
}

function hacerMovimiento(historial:Timeline,from:number,to:number):boolean {
    const actual = estadoActual(historial)

    if(!actual) return false

    if(!validarIndices(from,to)) return false

    const nuevoEstado = clonarEstado(actual)
    const exito = moverEntreTubos(nuevoEstado, from, to)

    if(!exito) return false

    historial.push(nuevoEstado)
    if(detectarVictoria(nuevoEstado)) console.log("Ganaste")
    return true
}

function printEstado(estado:Estado):void {
    for(let i=0;i<estado.length;i++){
        const arr = estado[i].toArray()
        console.log(`Tubo ${i}: [${arr.join(", ")}]`)
    }
}

function printJuego(historial:Timeline):void {
    const actual = estadoActual(historial)
    if(!actual) return
    printEstado(actual)
}

function crearTubo(colores: Color[]): Tubo {
  const tubo = new Pila<Color>()

  for (const c of colores) {
    tubo.push(c)
  }

  return tubo
}

function contarBloqueSuperior(tubo: Tubo): number {
    const arr = tubo.toArray()

    if (arr.length === 0) return 0

    const topColor = arr[arr.length - 1]
    let count = 0

    //Va desde len -1 hasta 0
    for(let i = arr.length -1; i>=0; i--){
        if (arr[i] === topColor) {
            count += 1
        }
        else break
    }
    return count

}

function puedeMover(origen: Tubo, destino: Tubo): boolean {
    if (origen.isEmpty()) return false
    if (destino.size() >= CAPACIDAD) return false
    const bloque = contarBloqueSuperior(origen)
    const espacio = CAPACIDAD - destino.size()
    if (espacio < bloque) return false
    if (destino.isEmpty()) return true
    return destino.peek() === origen.peek()
}

function mover(origen:Tubo,destino:Tubo):boolean {
    if(!puedeMover(origen,destino)) return false
    const bloque = contarBloqueSuperior(origen)
    for(let i=0;i<bloque;i++){
        const color = origen.pop()!
        destino.push(color)
    }
    return true
}

function isTuboResuelto(tubo: Tubo): boolean {
    const arr = tubo.toArray()
    if (arr.length !== CAPACIDAD) return false
    const firstColor = arr[0]
    for (const color of arr) {
        if (color !== firstColor) return false
    }
    return true
}

function detectarVictoria(estado: Estado): boolean {
    for (const tubo of estado) {
        if (tubo.isEmpty()) continue
        if (!isTuboResuelto(tubo)) return false
    }
    return true
}

function randomizarPrimerEstado(): Estado {
    const coloresNecesarios = (NUMERO_TUBOS - TUBOS_VACIOS)
    const piezas: Color[] = []

    //Generar colores
    for (let i = 0; i < coloresNecesarios; i++) {
        const color = `C${i}`

        for (let j = 0; j < CAPACIDAD; j++) {
            piezas.push(color)
        }
    }
    //Mezclar colores
    for (let i = piezas.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1))
        const temp = piezas[i]
        piezas[i] = piezas[j]
        piezas[j] = temp
    }
    const estado: Estado = []
    let index = 0
    //Llenar tubos
    for (let i = 0; i < NUMERO_TUBOS - TUBOS_VACIOS; i++) {
        const tubo = new Pila<Color>()

        for (let j = 0; j < CAPACIDAD; j++) {
            tubo.push(piezas[index++])
        }

        estado.push(tubo)
    }
    //Meter tubos vacíos
    for (let i = 0; i < TUBOS_VACIOS; i++) {
        estado.push(new Pila<Color>())
    }

    return estado
}

function empezarJuego():Timeline {
    const estado = randomizarPrimerEstado()
    const historial:Timeline = new Pila<Estado>()
    guardarHistorial(estado,historial)
    return historial
}