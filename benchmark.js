// benchmark.ts
// Pruebas de desempeño del algoritmo A* sobre el juego Tube Sort.
// Este archivo NO reimplementa A*: llama directamente a AEstrella()
// definida en algoritmo.js, con estados construidos con la lógica del juego.
//
// Orden de carga esperado: logicaJuego.js → algoritmo.js → benchmark.js → juego3d.js
// ── Captura de métricas ───────────────────────────────────────────────────────
// AEstrella imprime al final:
//   "[A*] SOLUCION: X nodos | Y movimientos | Z.ZZms"
//   "[A*] SIN SOLUCION | X nodos | Z.ZZms"
// Interceptamos console.log para leer esos valores sin modificar el algoritmo.
function ejecutar(nombre, descripcion, estado) {
    var nodos = 0;
    var tiempo = 0;
    var longitud = null;
    var exito = false;
    var logOriginal = console.log;
    console.log = function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        var msg = String(args[0] || '');
        var mOk = msg.match(/\[A\*\] SOLUCION: (\d+) nodos \| (\d+) movimientos \| ([\d.]+)ms/);
        var mFail = msg.match(/\[A\*\] SIN SOLUCION \| (\d+) nodos \| ([\d.]+)ms/);
        if (mOk) {
            nodos = +mOk[1];
            longitud = +mOk[2];
            tiempo = +mOk[3];
            exito = true;
        }
        if (mFail) {
            nodos = +mFail[1];
            tiempo = +mFail[2];
            exito = false;
        }
        logOriginal.apply(console, args);
    };
    AEstrella(clonarEstado(estado)); // ← se llama al A* real del juego
    console.log = logOriginal;
    return { nombre: nombre, descripcion: descripcion, exito: exito, tiempo_ms: tiempo, nodos_explorados: nodos, longitud_solucion: longitud };
}
// ── Configuraciones de prueba ─────────────────────────────────────────────────
// Cada función devuelve un Estado válido del juego (12 tubos, 40 piezas en total).
// Las configuraciones tienen dificultad creciente; los tubos sin mezclar ya son iguales.
/** Trivial: 2 tubos con 1 pieza intercambiada. Solución óptima: 3 movimientos. */
function configTrivial() {
    return [
        crearTubo(['0', '0', '0', '1']), // tubo 0: 3×rojo + 1×verde (arriba)
        crearTubo(['1', '1', '1', '0']), // tubo 1: 3×verde + 1×rojo (arriba)
        crearTubo(['2', '2', '2', '2']),
        crearTubo(['3', '3', '3', '3']),
        crearTubo(['4', '4', '4', '4']),
        crearTubo(['5', '5', '5', '5']),
        crearTubo(['6', '6', '6', '6']),
        crearTubo(['7', '7', '7', '7']),
        crearTubo(['8', '8', '8', '8']),
        crearTubo(['9', '9', '9', '9']),
        crearTubo([]), // vacío
        crearTubo([]), // vacío
    ];
}
/** Fácil: 2 tubos con patrón alternado (0,1,0,1). ~8 movimientos. */
function configFacil() {
    return [
        crearTubo(['0', '1', '0', '1']), // alternado
        crearTubo(['1', '0', '1', '0']), // alternado
        crearTubo(['2', '2', '2', '2']),
        crearTubo(['3', '3', '3', '3']),
        crearTubo(['4', '4', '4', '4']),
        crearTubo(['5', '5', '5', '5']),
        crearTubo(['6', '6', '6', '6']),
        crearTubo(['7', '7', '7', '7']),
        crearTubo(['8', '8', '8', '8']),
        crearTubo(['9', '9', '9', '9']),
        crearTubo([]),
        crearTubo([]),
    ];
}
/** Medio: 2 pares de tubos alternados (4 tubos mezclados). ~16 movimientos. */
function configMedio() {
    return [
        crearTubo(['0', '1', '0', '1']),
        crearTubo(['1', '0', '1', '0']),
        crearTubo(['2', '3', '2', '3']),
        crearTubo(['3', '2', '3', '2']),
        crearTubo(['4', '4', '4', '4']),
        crearTubo(['5', '5', '5', '5']),
        crearTubo(['6', '6', '6', '6']),
        crearTubo(['7', '7', '7', '7']),
        crearTubo(['8', '8', '8', '8']),
        crearTubo(['9', '9', '9', '9']),
        crearTubo([]),
        crearTubo([]),
    ];
}
/** Clásico: 3 pares de tubos alternados (6 tubos mezclados). ~30+ movimientos. */
function configClasico() {
    return [
        crearTubo(['0', '1', '0', '1']),
        crearTubo(['1', '0', '1', '0']),
        crearTubo(['2', '3', '2', '3']),
        crearTubo(['3', '2', '3', '2']),
        crearTubo(['4', '5', '4', '5']),
        crearTubo(['5', '4', '5', '4']),
        crearTubo(['6', '6', '6', '6']),
        crearTubo(['7', '7', '7', '7']),
        crearTubo(['8', '8', '8', '8']),
        crearTubo(['9', '9', '9', '9']),
        crearTubo([]),
        crearTubo([]),
    ];
}
// ── Renderizado del panel de resultados ───────────────────────────────────────
function mostrarPanel(resultados) {
    var modal = document.getElementById('bm-modal');
    var exitos = resultados.filter(function (r) { return r.exito; }).length;
    var filas = resultados.map(function (r) { return "\n        <tr>\n            <td>".concat(r.nombre, "</td>\n            <td style=\"font-size:.82rem;color:#8b949e\">").concat(r.descripcion, "</td>\n            <td style=\"color:").concat(r.exito ? '#4eff91' : '#ff4e4e', "\">").concat(r.exito ? '✓ Sí' : '✗ No', "</td>\n            <td>").concat(r.tiempo_ms.toFixed(2), " ms</td>\n            <td>").concat(r.nodos_explorados.toLocaleString(), "</td>\n            <td>").concat(r.longitud_solucion !== null ? r.longitud_solucion : '—', "</td>\n        </tr>"); }).join('');
    modal.innerHTML = "\n        <div class=\"bm-box\">\n            <h2 class=\"bm-title\">Benchmark A* \u2014 Tube Sort</h2>\n            <p class=\"bm-sub\">\n                Tasa de \u00E9xito: <strong style=\"color:#4eff91\">".concat(exitos, "/").concat(resultados.length, "</strong>\n                configuraciones resueltas\n            </p>\n            <table class=\"bm-table\">\n                <thead>\n                    <tr>\n                        <th>Configuraci\u00F3n</th>\n                        <th>Descripci\u00F3n</th>\n                        <th>Soluci\u00F3n</th>\n                        <th>Tiempo</th>\n                        <th>Nodos</th>\n                        <th>Movs.</th>\n                    </tr>\n                </thead>\n                <tbody>").concat(filas, "</tbody>\n            </table>\n            <p class=\"bm-note\">\n                Heur\u00EDstica: suma de (bloques distintos \u2212 1) por tubo &nbsp;|&nbsp;\n                Motor: A* con MinHeap + poda mejorG\n            </p>\n            <div class=\"bm-actions\">\n                <button class=\"bm-btn bm-btn-primary\"\n                    onclick=\"document.getElementById('bm-modal').style.display='none'\">\n                    Cerrar\n                </button>\n                <button class=\"bm-btn bm-btn-secondary\" onclick=\"solveWithAStar()\">\n                    Resolver tablero actual\n                </button>\n            </div>\n        </div>");
    modal.style.display = 'flex';
}
// ── Runner principal ──────────────────────────────────────────────────────────
;
window.runBenchmarks = function () {
    var configs = [
        { nombre: 'Trivial', desc: '1 par intercambiado — 8 tubos resueltos', fn: configTrivial },
        { nombre: 'Fácil', desc: '1 par alternado — 8 tubos resueltos', fn: configFacil },
        { nombre: 'Medio', desc: '2 pares alternados — 6 tubos resueltos', fn: configMedio },
        { nombre: 'Clásico', desc: '3 pares alternados — 4 tubos resueltos', fn: configClasico },
    ];
    var modal = document.getElementById('bm-modal');
    modal.style.display = 'flex';
    modal.innerHTML = "\n        <div class=\"bm-box\" style=\"text-align:center\">\n            <h2 class=\"bm-title\">Ejecutando benchmarks\u2026</h2>\n            <p id=\"bm-status\" class=\"bm-sub\">Preparando\u2026</p>\n            <div class=\"bm-progress-track\">\n                <div id=\"bm-bar\" class=\"bm-progress-fill\"></div>\n            </div>\n        </div>";
    var resultados = [];
    var i = 0;
    function paso() {
        if (i >= configs.length) {
            mostrarPanel(resultados);
            return;
        }
        var cfg = configs[i];
        var statusEl = document.getElementById('bm-status');
        var barEl = document.getElementById('bm-bar');
        if (statusEl)
            statusEl.textContent = "Probando \"".concat(cfg.nombre, "\" (").concat(i + 1, " / ").concat(configs.length, ")\u2026");
        if (barEl)
            barEl.style.width = "".concat((i / configs.length) * 100, "%");
        setTimeout(function () {
            resultados.push(ejecutar(cfg.nombre, cfg.desc, cfg.fn()));
            i++;
            paso();
        }, 60);
    }
    paso();
};
