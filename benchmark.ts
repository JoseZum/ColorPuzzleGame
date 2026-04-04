// benchmark.ts
// Pruebas del algoritmo A* sobre el juego Tube Sort

type Estado = any[]
declare var NUMERO_TUBOS: number
declare var CAPACIDAD:    number
declare function crearTubo(colores: any[]): any
declare function clonarEstado(e: Estado): Estado
declare function detectarVictoria(e: Estado): boolean
declare function AEstrella(estadoInicial: Estado): Array<[number, number]> | null

interface ResultadoBenchmark {
    nombre:            string
    descripcion:       string
    exito:             boolean
    tiempo_ms:         number
    nodos_explorados:  number
    longitud_solucion: number | null
}

// AEstrella imprime al final:
//   "[A*] SOLUCION: X nodos | Y movimientos | Z.ZZms"
//   "[A*] SIN SOLUCION | X nodos | Z.ZZms"
// Interceptamos console.log para leer esos valores sin modificar el algoritmo.
function ejecutar(nombre: string, descripcion: string, estado: Estado): ResultadoBenchmark {
    let nodos  = 0
    let tiempo = 0
    let longitud: number | null = null
    let exito  = false

    const logOriginal = console.log
    console.log = function (...args: any[]): void {
        const msg = String(args[0] || '')
        const mOk  = msg.match(/\[A\*\] SOLUCION: (\d+) nodos \| (\d+) movimientos \| ([\d.]+)ms/)
        const mFail = msg.match(/\[A\*\] SIN SOLUCION \| (\d+) nodos \| ([\d.]+)ms/)
        if (mOk)  { nodos = +mOk[1];   longitud = +mOk[2];  tiempo = +mOk[3];  exito = true  }
        if (mFail){ nodos = +mFail[1];                       tiempo = +mFail[2]; exito = false }
        logOriginal.apply(console, args)
    }

    AEstrella(clonarEstado(estado))  // ← se llama al A* real del juego
    console.log = logOriginal

    return { nombre, descripcion, exito, tiempo_ms: tiempo, nodos_explorados: nodos, longitud_solucion: longitud }
}

// Cada función devuelve un Estado válido del juego (12 tubos, 40 piezas en total).
// Las configuraciones tienen dificultad creciente; los tubos sin mezclar ya son iguales.

/** Trivial: 2 tubos con 1 pieza intercambiada. Solución óptima: 3 movimientos. */
function configTrivial(): Estado {
    return [
        crearTubo(['0','0','0','1']), // tubo 0: 3×rojo + 1×verde (arriba)
        crearTubo(['1','1','1','0']), // tubo 1: 3×verde + 1×rojo (arriba)
        crearTubo(['2','2','2','2']),
        crearTubo(['3','3','3','3']),
        crearTubo(['4','4','4','4']),
        crearTubo(['5','5','5','5']),
        crearTubo(['6','6','6','6']),
        crearTubo(['7','7','7','7']),
        crearTubo(['8','8','8','8']),
        crearTubo(['9','9','9','9']),
        crearTubo([]),               // vacío
        crearTubo([]),               // vacío
    ]
}

/** Fácil: 2 tubos con patrón alternado (0,1,0,1). ~8 movimientos. */
function configFacil(): Estado {
    return [
        crearTubo(['0','1','0','1']), // alternado
        crearTubo(['1','0','1','0']), // alternado
        crearTubo(['2','2','2','2']),
        crearTubo(['3','3','3','3']),
        crearTubo(['4','4','4','4']),
        crearTubo(['5','5','5','5']),
        crearTubo(['6','6','6','6']),
        crearTubo(['7','7','7','7']),
        crearTubo(['8','8','8','8']),
        crearTubo(['9','9','9','9']),
        crearTubo([]),
        crearTubo([]),
    ]
}

/** Medio: 2 pares de tubos alternados (4 tubos mezclados). ~16 movimientos. */
function configMedio(): Estado {
    return [
        crearTubo(['0','1','0','1']),
        crearTubo(['1','0','1','0']),
        crearTubo(['2','3','2','3']),
        crearTubo(['3','2','3','2']),
        crearTubo(['4','4','4','4']),
        crearTubo(['5','5','5','5']),
        crearTubo(['6','6','6','6']),
        crearTubo(['7','7','7','7']),
        crearTubo(['8','8','8','8']),
        crearTubo(['9','9','9','9']),
        crearTubo([]),
        crearTubo([]),
    ]
}

/** Clásico: 3 pares de tubos alternados (6 tubos mezclados). ~30+ movimientos. */
function configClasico(): Estado {
    return [
        crearTubo(['0','1','0','1']),
        crearTubo(['1','0','1','0']),
        crearTubo(['2','3','2','3']),
        crearTubo(['3','2','3','2']),
        crearTubo(['4','5','4','5']),
        crearTubo(['5','4','5','4']),
        crearTubo(['6','6','6','6']),
        crearTubo(['7','7','7','7']),
        crearTubo(['8','8','8','8']),
        crearTubo(['9','9','9','9']),
        crearTubo([]),
        crearTubo([]),
    ]
}

function mostrarPanel(resultados: ResultadoBenchmark[]): void {
    const modal = document.getElementById('bm-modal')!
    const exitos = resultados.filter(r => r.exito).length
    const filas  = resultados.map(r => `
        <tr>
            <td>${r.nombre}</td>
            <td style="font-size:.82rem;color:#8b949e">${r.descripcion}</td>
            <td style="color:${r.exito ? '#4eff91' : '#ff4e4e'}">${r.exito ? '✓ Sí' : '✗ No'}</td>
            <td>${r.tiempo_ms.toFixed(2)} ms</td>
            <td>${r.nodos_explorados.toLocaleString()}</td>
            <td>${r.longitud_solucion !== null ? r.longitud_solucion : '—'}</td>
        </tr>`).join('')

    modal.innerHTML = `
        <div class="bm-box">
            <h2 class="bm-title">Benchmark A* — Tube Sort</h2>
            <p class="bm-sub">
                Tasa de éxito: <strong style="color:#4eff91">${exitos}/${resultados.length}</strong>
                configuraciones resueltas
            </p>
            <table class="bm-table">
                <thead>
                    <tr>
                        <th>Configuración</th>
                        <th>Descripción</th>
                        <th>Solución</th>
                        <th>Tiempo</th>
                        <th>Nodos</th>
                        <th>Movs.</th>
                    </tr>
                </thead>
                <tbody>${filas}</tbody>
            </table>
            <p class="bm-note">
                Heurística: suma de (bloques distintos − 1) por tubo &nbsp;|&nbsp;
                Motor: A* con MinHeap + poda mejorG
            </p>
            <div class="bm-actions">
                <button class="bm-btn bm-btn-primary"
                    onclick="document.getElementById('bm-modal').style.display='none'">
                    Cerrar
                </button>
                <button class="bm-btn bm-btn-secondary" onclick="solveWithAStar()">
                    Resolver tablero actual
                </button>
            </div>
        </div>`
    modal.style.display = 'flex'
}

;(window as any).runBenchmarks = function (): void {
    const configs = [
        { nombre: 'Trivial',  desc: '1 par intercambiado — 8 tubos resueltos',     fn: configTrivial  },
        { nombre: 'Fácil',    desc: '1 par alternado — 8 tubos resueltos',          fn: configFacil    },
        { nombre: 'Medio',    desc: '2 pares alternados — 6 tubos resueltos',       fn: configMedio    },
        { nombre: 'Clásico',  desc: '3 pares alternados — 4 tubos resueltos',       fn: configClasico  },
    ]

    const modal = document.getElementById('bm-modal')!
    modal.style.display = 'flex'
    modal.innerHTML = `
        <div class="bm-box" style="text-align:center">
            <h2 class="bm-title">Ejecutando benchmarks…</h2>
            <p id="bm-status" class="bm-sub">Preparando…</p>
            <div class="bm-progress-track">
                <div id="bm-bar" class="bm-progress-fill"></div>
            </div>
        </div>`

    const resultados: ResultadoBenchmark[] = []
    let i = 0

    function paso(): void {
        if (i >= configs.length) { mostrarPanel(resultados); return }
        const cfg = configs[i]
        const statusEl = document.getElementById('bm-status')
        const barEl    = document.getElementById('bm-bar')
        if (statusEl) statusEl.textContent = `Probando "${cfg.nombre}" (${i + 1} / ${configs.length})…`
        if (barEl)    barEl.style.width    = `${(i / configs.length) * 100}%`
        setTimeout(function () {
            resultados.push(ejecutar(cfg.nombre, cfg.desc, cfg.fn()))
            i++
            paso()
        }, 60)
    }
    paso()
}
