
// =====================================
// AGROSMART - CONTROL DEL DASHBOARD
// =====================================

// ELEMENTOS DEL SISTEMA DE RIEGO

const botonRiego = document.getElementById("boton-riego");
const estadoRiego = document.getElementById("estado-riego");
const estadoSistemaRiego = document.getElementById("estado-riego-sistema");

let riegoActivo = false;


// =====================================
// CONTROL VISUAL DEL RIEGO
// =====================================

if (botonRiego) {

    botonRiego.addEventListener("click", function () {

        riegoActivo = !riegoActivo;

        if (riegoActivo) {

            estadoRiego.textContent = "Activo";
            botonRiego.textContent = "Detener riego";

            if (estadoSistemaRiego) {
                estadoSistemaRiego.textContent = "● Activo";
                estadoSistemaRiego.className = "conectado";
            }

        } else {

            estadoRiego.textContent = "Apagado";
            botonRiego.textContent = "Activar riego";

            if (estadoSistemaRiego) {
                estadoSistemaRiego.textContent = "● Apagado";
                estadoSistemaRiego.className = "apagado";
            }

        }

    });

}


// =====================================
// VALORES INICIALES DE LOS SENSORES
// =====================================

let temperatura = 25;
let humedadAmbiental = 68;
let humedadSuelo = 54;
let nivelAgua = 82;


// =====================================
// HISTORIAL DE HUMEDAD DEL SUELO
// =====================================

const historialSuelo = [];

function registrarHistorial(valor) {

    const hora = new Date().toLocaleTimeString(
        "es-EC",
        {
            hour: "2-digit",
            minute: "2-digit"
        }
    );

    historialSuelo.push({
        hora: hora,
        humedad: Math.round(valor)
    });
        // Conservar las ultimas 10 lecturas
    if (historialSuelo.length > 10) {
        historialSuelo.shift();
    }

    dibujarGrafica();
    actualizarResumenHistorial();
}

// =====================================
// RESUMEN DE MEDICIONES DEL SUELO
// =====================================

function actualizarResumenHistorial() {

    if (historialSuelo.length === 0) return;

    const valores = historialSuelo.map(
        dato => dato.humedad
    );

    const actual = valores[valores.length - 1];
    const maxima = Math.max(...valores);
    const minima = Math.min(...valores);

    document.getElementById("humedad-actual").textContent =
        actual + " %";

    document.getElementById("humedad-maxima").textContent =
        maxima + " %";

    document.getElementById("humedad-minima").textContent =
        minima + " %";
}


// =====================================
// DIBUJAR GRAFICA
// =====================================


function dibujarGrafica() {

    const canvas = document.getElementById("grafica-suelo");

    if (!canvas) return;

    const ctx = canvas.getContext("2d");

    const ancho = canvas.width;
    const alto = canvas.height;

    const margenIzquierdo = 55;
    const margenDerecho = 20;
    const margenSuperior = 25;
    const margenInferior = 40;

    const anchoGrafica = ancho - margenIzquierdo - margenDerecho;
    const altoGrafica = alto - margenSuperior - margenInferior;

    ctx.clearRect(0, 0, ancho, alto);

    // LÍNEAS DE REFERENCIA

    ctx.strokeStyle = "#35483c";
    ctx.lineWidth = 1;
    ctx.fillStyle = "#aebeb3";
    ctx.font = "12px Arial";

    for (let i = 0; i <= 4; i++) {

        const valor = 100 - (i * 25);
        const y = margenSuperior + (altoGrafica / 4) * i;

        ctx.beginPath();
        ctx.moveTo(margenIzquierdo, y);
        ctx.lineTo(ancho - margenDerecho, y);
        ctx.stroke();

        ctx.fillText(valor + "%", 8, y + 4);
    }

    // MENSAJE CUANDO NO EXISTEN LECTURAS

    if (historialSuelo.length === 0) {

        ctx.fillStyle = "#aebeb3";
        ctx.font = "15px Arial";
        ctx.fillText(
            "Esperando lecturas...",
            margenIzquierdo + 20,
            alto / 2
        );

        return;
    }

    // UBICACIÓN DE LOS PUNTOS

    const puntos = historialSuelo.map((dato, index) => {

        const x = historialSuelo.length === 1
            ? margenIzquierdo + anchoGrafica / 2
            : margenIzquierdo +
              (anchoGrafica / (historialSuelo.length - 1)) * index;

        const y = margenSuperior + altoGrafica -
                  (dato.humedad / 100) * altoGrafica;

        return {
            x: x,
            y: y,
            hora: dato.hora
        };
    });

    // RELLENO DE LA GRÁFICA

    const degradado = ctx.createLinearGradient(
        0,
        margenSuperior,
        0,
        alto - margenInferior
    );

    degradado.addColorStop(0, "rgba(142, 230, 154, 0.25)");
    degradado.addColorStop(1, "rgba(142, 230, 154, 0.01)");

    ctx.beginPath();
    ctx.moveTo(puntos[0].x, alto - margenInferior);

    puntos.forEach(punto => {
        ctx.lineTo(punto.x, punto.y);
    });

    ctx.lineTo(
        puntos[puntos.length - 1].x,
        alto - margenInferior
    );

    ctx.closePath();
    ctx.fillStyle = degradado;
    ctx.fill();

    // LÍNEA DE HUMEDAD

    ctx.beginPath();

    puntos.forEach((punto, index) => {

        if (index === 0) {
            ctx.moveTo(punto.x, punto.y);
        } else {
            const anterior = puntos[index - 1];

            const medioX = (anterior.x + punto.x) / 2;

            ctx.quadraticCurveTo(
                anterior.x,
                anterior.y,
                medioX,
                (anterior.y + punto.y) / 2
            );
        }
    });

    if (puntos.length > 1) {
        const ultimo = puntos[puntos.length - 1];
        ctx.lineTo(ultimo.x, ultimo.y);
    }

    ctx.strokeStyle = "#8ee69a";
    ctx.lineWidth = 3;
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    ctx.stroke();

    // PUNTOS DORADOS

    puntos.forEach(punto => {

        ctx.beginPath();
        ctx.arc(punto.x, punto.y, 5, 0, Math.PI * 2);

        ctx.fillStyle = "#d4af37";
        ctx.fill();

        ctx.strokeStyle = "#101a17";
        ctx.lineWidth = 2;
        ctx.stroke();
    });

    // HORAS DE LAS LECTURAS

    ctx.fillStyle = "#aebeb3";
    ctx.font = "11px Arial";
    ctx.textAlign = "center";

    puntos.forEach(punto => {
        ctx.fillText(punto.hora, punto.x, alto - 10);
    });

    ctx.textAlign = "start";

    // CONTADOR DE LECTURAS

    const contador = document.getElementById("cantidad-lecturas");

    if (contador) {
        contador.textContent =
            historialSuelo.length + " lecturas registradas";
    }
}


// =====================================
// ACTUALIZACIÓN DE LOS SENSORES
// =====================================

function actualizarSensores() {

    // Variación de los valores simulados

    temperatura += Math.random() * 2 - 1;

    humedadAmbiental += Math.random() * 4 - 2;

    humedadSuelo += Math.random() * 4 - 2;

    nivelAgua += Math.random() * 2 - 1;


    // Límites de los valores

    temperatura = Math.max(18, Math.min(35, temperatura));

    humedadAmbiental = Math.max(30, Math.min(90, humedadAmbiental));

    humedadSuelo = Math.max(10, Math.min(90, humedadSuelo));

    nivelAgua = Math.max(0, Math.min(100, nivelAgua));


    // =================================
    // ACTUALIZAR LOS NÚMEROS
    // =================================

    document.getElementById("valor-temperatura").textContent =
        temperatura.toFixed(1) + " °C";

    document.getElementById("valor-ambiental").textContent =
        Math.round(humedadAmbiental) + " %";

    document.getElementById("valor-suelo").textContent =
        Math.round(humedadSuelo) + " %";

    document.getElementById("valor-agua").textContent =
        Math.round(nivelAgua) + " %";


    // =================================
    // ACTUALIZAR LAS BARRAS
    // =================================

    document.getElementById("barra-temperatura").style.width =
        (temperatura / 40 * 100) + "%";

    document.getElementById("barra-ambiental").style.width =
        humedadAmbiental + "%";

    document.getElementById("barra-suelo").style.width =
        humedadSuelo + "%";

    document.getElementById("barra-agua").style.width =
        nivelAgua + "%";
// ACTUALIZAR ALERTAS
actualizarAlertas(
    temperatura,
    humedadAmbiental,
    humedadSuelo,
    nivelAgua
);

actualizarRecomendaciones(humedadSuelo, nivelAgua);

actualizarResumenInicio();

registrarHistorial(humedadSuelo);
}

// =====================================
// RECOMENDACIONES INTELIGENTES
// =====================================

function actualizarRecomendaciones(humedadSuelo, nivelAgua) {

    const titulo = document.getElementById("titulo-recomendacion");
    const texto = document.getElementById("texto-recomendacion");

    if (!titulo || !texto) return;

    if (nivelAgua < 20) {

        titulo.textContent = "Depósito de agua bajo";
        texto.textContent = "El nivel de agua es bajo. Se recomienda revisar el depósito para mantener disponible el suministro de riego.";

    } else if (humedadSuelo < 35) {

        titulo.textContent = "El suelo necesita humedad";
        texto.textContent = "La humedad del suelo está por debajo del nivel recomendado. Se recomienda revisar las condiciones del cultivo y considerar activar el riego.";

    } else if (humedadSuelo > 80) {

        titulo.textContent = "Humedad elevada";
        texto.textContent = "El suelo presenta demasiada humedad. Se recomienda pausar el riego y continuar monitoreando los valores.";

    } else {

        titulo.textContent = "Tus cultivos están en observación";
        texto.textContent = "La humedad del suelo se encuentra dentro del rango establecido. Continúa monitoreando las condiciones para mantener un buen cuidado de las plantas.";
    }
}
// =====================================
// RESUMEN DEL INICIO
// =====================================

function actualizarResumenInicio() {

    // Actualizar los cuatro indicadores

    const temperaturaInicio = document.getElementById("resumen-temperatura");
    const ambientalInicio = document.getElementById("resumen-ambiental");
    const sueloInicio = document.getElementById("resumen-suelo");
    const aguaInicio = document.getElementById("resumen-agua");

    if (temperaturaInicio) {
        temperaturaInicio.textContent = temperatura.toFixed(1) + " °C";
    }

    if (ambientalInicio) {
        ambientalInicio.textContent = Math.round(humedadAmbiental) + " %";
    }

    if (sueloInicio) {
        sueloInicio.textContent = Math.round(humedadSuelo) + " %";
    }

    if (aguaInicio) {
        aguaInicio.textContent = Math.round(nivelAgua) + " %";
    }

    // Actualizar el estado general

    const estadoInicio = document.getElementById("estado-general-inicio");

    if (estadoInicio) {

        const hayAlertas =
            temperatura < 18 || temperatura > 30 ||
            humedadAmbiental < 35 || humedadAmbiental > 85 ||
            humedadSuelo < 35 || humedadSuelo > 80 ||
            nivelAgua < 20;

        if (hayAlertas) {
            estadoInicio.textContent = "● Revisión recomendada";
            estadoInicio.className = "estado-general con-alerta";
        } else {
            estadoInicio.textContent = "● Todo en orden";
            estadoInicio.className = "estado-general normal";
        }
    }
}
// =====================================
// SISTEMA DE ALERTAS AGROSMART
// =====================================

function actualizarAlertas(
    temperatura,
    humedadAmbiental,
    humedadSuelo,
    nivelAgua
) {
    let avisos = [];

    // FUNCION PARA ACTUALIZAR CADA TARJETA

    function cambiarEstado(
        idEstado,
        idMensaje,
        esAlerta,
        estadoNormal,
        estadoAlerta,
        mensajeNormal,
        mensajeAlerta
    ) {

        const etiqueta = document.getElementById(idEstado);
        const mensaje = document.getElementById(idMensaje);
const idMonitor = idEstado.replace(
    "estado-",
    "monitor-estado-"
);

const etiquetaMonitor = document.getElementById(idMonitor);

     if (esAlerta) {

    if (etiqueta) {
        etiqueta.textContent = estadoAlerta;
        etiqueta.className = "estado-alerta";
    }

    if (mensaje) {
        mensaje.textContent = mensajeAlerta;
    }

    if (etiquetaMonitor) {
        etiquetaMonitor.textContent = estadoAlerta;
        etiquetaMonitor.className = "estado-alerta";
    }

} else {

    if (etiqueta) {
        etiqueta.textContent = estadoNormal;
        etiqueta.className = "estado-ok";
    }

    if (mensaje) {
        mensaje.textContent = mensajeNormal;
    }

    if (etiquetaMonitor) {
        etiquetaMonitor.textContent = estadoNormal;
        etiquetaMonitor.className = "estado-ok";
    }
}
    }


    // TEMPERATURA

    let alertaTemperatura =
        temperatura < 18 || temperatura > 30;

cambiarEstado(
    "estado-temperatura",
"mensaje-temperatura",
        alertaTemperatura,
        "Normal",
        "Revisar",
        "Temperatura dentro del rango de referencia.",
        "La temperatura está fuera del rango de referencia."
    );

    if (alertaTemperatura) {
        avisos.push("Revisar la temperatura del invernadero");
    }


    // HUMEDAD AMBIENTAL

    let alertaAmbiental =
        humedadAmbiental < 35 || humedadAmbiental > 85;

cambiarEstado(
    "estado-ambiental",
"mensaje-ambiental",
        alertaAmbiental,
        "Normal",
        "Revisar",
        "Humedad ambiental dentro del rango de referencia.",
        "La humedad ambiental está fuera del rango de referencia."
    );

    if (alertaAmbiental) {
        avisos.push("Revisar la humedad ambiental");
    }


    // HUMEDAD DEL SUELO

    let alertaSuelo =
        humedadSuelo < 35 || humedadSuelo > 80;

cambiarEstado(
   "estado-suelo",
"mensaje-suelo",
        alertaSuelo,
        "Normal",
        "Revisar",
        "Humedad del suelo dentro del rango de referencia.",
        humedadSuelo < 35
            ? "La humedad del suelo es baja. Revisar si necesita riego."
            : "La humedad del suelo es elevada. Revisar las condiciones del cultivo."
    );

    if (humedadSuelo < 35) {
        avisos.push("El suelo necesita revisión de humedad");
    }

    if (humedadSuelo > 80) {
        avisos.push("Revisar la humedad elevada del suelo");
    }


    // NIVEL DE AGUA

    let alertaAgua = nivelAgua < 20;

cambiarEstado(
   "estado-agua",
"mensaje-agua",
        alertaAgua,
        "Disponible",
        "Nivel bajo",
        "La reserva de agua se encuentra disponible.",
        "La reserva de agua está baja. Revisar el tanque."
    );

    if (alertaAgua) {
        avisos.push("La reserva de agua está baja");
    }


    // RESUMEN GENERAL

    const resumen = document.getElementById("alerta-resumen");

    const icono = document.getElementById("alerta-icono");

    const titulo = document.getElementById("alerta-titulo");

    const mensaje = document.getElementById("alerta-mensaje");

    const nivel = document.getElementById("alerta-nivel");


    if (avisos.length > 0) {

        resumen.className = "alerta-resumen alerta-advertencia";

        icono.textContent = "⚠️";

        titulo.textContent = "Revisión recomendada";

        mensaje.textContent = avisos.join(". ") + ".";

        nivel.textContent = "Atención";

    } else {

        resumen.className = "alerta-resumen alerta-normal";

        icono.textContent = "✓";

        titulo.textContent = "Todo en orden";

        mensaje.textContent =
            "Las mediciones están dentro de los rangos de demostración.";

        nivel.textContent = "Normal";
    }

}
// =====================================
// MENÚ LATERAL DINÁMICO
// =====================================

const enlacesMenu = document.querySelectorAll(
    'nav a[href^="#"]'
);

const seccionesMenu = Array.from(enlacesMenu)
    .map(enlace => {
        return document.querySelector(
            enlace.getAttribute("href")
        );
    })
    .filter(seccion => seccion !== null);

function actualizarMenuActivo() {

    let seccionActual = seccionesMenu[0];

    seccionesMenu.forEach(seccion => {

        if (seccion.getBoundingClientRect().top <= 160) {
            seccionActual = seccion;
        }

    });

    enlacesMenu.forEach(enlace => {

        enlace.classList.toggle(
            "activo",
            enlace.getAttribute("href") === "#" + seccionActual.id
        );

    });

}

window.addEventListener("scroll", actualizarMenuActivo);

actualizarMenuActivo();
// =====================================
// INICIAR ACTUALIZACIÓN AUTOMÁTICA
// =====================================

actualizarSensores();

setInterval(actualizarSensores, 3000);
