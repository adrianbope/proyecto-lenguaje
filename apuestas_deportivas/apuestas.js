const STORAGE_KEY = "combinada";


document.addEventListener("DOMContentLoaded", () => {
  const botones = document.querySelectorAll(".opcion button");
  const listaApuestas = document.getElementById("listaApuestas");
  const cuotaTotalDiv = document.getElementById("cuotaTotal");
  const gananciaDiv = document.getElementById("ganancia");
  const importeInput = document.getElementById("importe");
  const apostarBtn = document.getElementById("apostar");

  function getBets() {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
  }

  function saveBets(bets) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(bets));
  }

  let apuestas = getBets();

  botones.forEach(boton => {
    const partido = boton.closest(".partido");
    const equipos = partido.querySelectorAll(".equipo");
    const nombrePartido = equipos[0].innerText + " vs " + equipos[1].innerText;
    const opcion = boton.parentElement.querySelector("span").innerText;
    const cuota = parseFloat(boton.innerText);

    // Restaurar selección si ya estaba guardada
    if (apuestas[nombrePartido] && apuestas[nombrePartido].opcion === opcion) {
      boton.classList.add("seleccionado");
    }

    boton.addEventListener("click", () => {
      apuestas = getBets();

      if (boton.classList.contains("seleccionado")) {
        boton.classList.remove("seleccionado");
        delete apuestas[nombrePartido];
        saveBets(apuestas);
        actualizarTicket();
        return;
      }

      partido.querySelectorAll("button").forEach(b => b.classList.remove("seleccionado"));
      boton.classList.add("seleccionado");

      apuestas[nombrePartido] = { opcion, cuota };
      saveBets(apuestas);
      actualizarTicket();
    });
  });

  apostarBtn.addEventListener("click", () => {
    apuestas = getBets();
    const importe = parseFloat(importeInput.value);

    if (Object.keys(apuestas).length === 0) {
      alert("Selecciona al menos un partido para apostar.");
      return;
    }

    if (!importe || importe <= 0) {
      alert("Introduce un importe válido.");
      return;
    }

    const cuotaTotal = calcularCuotaTotal();
    const ganancia = (importe * cuotaTotal).toFixed(2);

    alert(
      "✅ Apuesta realizada\n\n" +
      "Importe: " + importe.toFixed(2) + " €\n" +
      "Cuota total: " + cuotaTotal.toFixed(2) + "\n" +
      "Ganancia posible: " + ganancia + " €\n\n" +
      "¡Suerte! 🍀"
    );
  });

  function calcularCuotaTotal() {
    let total = 1;
    Object.values(getBets()).forEach(apuesta => total *= apuesta.cuota);
    return total;
  }

  function actualizarTicket() {
    apuestas = getBets();
    listaApuestas.innerHTML = "";
    const partidos = Object.keys(apuestas);

    if (partidos.length === 0) {
      listaApuestas.innerText = "No has seleccionado ninguna apuesta";
      cuotaTotalDiv.innerText = "Cuota total: 1.00";
      gananciaDiv.innerText = "Ganancia posible: 0.00 €";
      return;
    }

    const cuotaTotal = calcularCuotaTotal();

    partidos.forEach(partido => {
      const apuesta = apuestas[partido];
      const div = document.createElement("div");
      div.className = "apuesta-item";
      div.innerText = `${partido} → ${apuesta.opcion} (Cuota: ${apuesta.cuota})`;
      listaApuestas.appendChild(div);
    });

    cuotaTotalDiv.innerText = "Cuota total: " + cuotaTotal.toFixed(2);
    const importe = parseFloat(importeInput.value) || 0;
    gananciaDiv.innerText =
      "Ganancia posible: " + (importe * cuotaTotal).toFixed(2) + " €";
  }

  importeInput.addEventListener("input", actualizarTicket);

  actualizarTicket();
});
/* --- TU LÓGICA DE SELECCIÓN --- */
let apuestasSeleccionadas = [];

function configurarBotonesApuesta() {
    const botones = document.querySelectorAll('.opcion button');
    botones.forEach(boton => {
        boton.onclick = (e) => {
            const contenedorOpcion = e.target.parentElement;
            const contenedorPartido = e.target.closest('.partido');
            const equipos = contenedorPartido.querySelector('.equipos').innerText.replace(/\n/g, ' vs ');
            const seleccion = contenedorOpcion.querySelector('span').innerText;
            const cuota = parseFloat(e.target.innerText);
            agregarAlTicket(equipos, seleccion, cuota);
        };
    });
}

function agregarAlTicket(partido, seleccion, cuota) {
    apuestasSeleccionadas = apuestasSeleccionadas.filter(a => a.partido !== partido);
    apuestasSeleccionadas.push({ partido, seleccion, cuota });
    renderizarTicket();
}

// ESTA FUNCIÓN LIMPIA EL ARRAY Y RE-RENDERIZA EL TICKET VACÍO
function limpiarSeleccionManual() {
    apuestasSeleccionadas = [];
    const importeInput = document.getElementById('importe');
    if(importeInput) importeInput.value = "";
    renderizarTicket();
}

function renderizarTicket() {
    const lista = document.getElementById('listaApuestas');
    const cuotaTotalDiv = document.getElementById('cuotaTotal');
    const gananciaDiv = document.getElementById('ganancia');
    const importeInput = document.getElementById('importe');

    if (apuestasSeleccionadas.length === 0) {
        lista.innerHTML = "No has seleccionado ninguna apuesta";
        if(cuotaTotalDiv) cuotaTotalDiv.innerText = "Cuota total: 0.00";
        if(gananciaDiv) gananciaDiv.innerText = "Ganancia posible: 0.00 €";
        return;
    }

    let html = "";
    let cuotaTotal = 1;

    apuestasSeleccionadas.forEach((apuesta, index) => {
        html += `
            <div style="border-bottom: 1px solid #444; padding: 5px; position: relative;">
                <small>${apuesta.partido}</small><br>
                <b>${apuesta.seleccion}</b> - <span style="color: #ffd700">${apuesta.cuota}</span>
            </div>
        `;
        cuotaTotal *= apuesta.cuota;
    });

    lista.innerHTML = html;
    cuotaTotalDiv.innerText = `Cuota total: ${cuotaTotal.toFixed(2)}`;
    
    const calcular = () => {
        const importe = parseFloat(importeInput.value) || 0;
        gananciaDiv.innerText = `Ganancia posible: ${(importe * cuotaTotal).toFixed(2)} €`;
    };
    importeInput.oninput = calcular;
    calcular();
}

document.addEventListener('DOMContentLoaded', configurarBotonesApuesta);

/* --- LÓGICA DE GUARDADO Y LIMPIEZA AUTOMÁTICA AL APOSTAR --- */
document.addEventListener('click', function(e) {
    if (e.target && (e.target.innerText.toLowerCase().includes('apostar') || e.target.id === 'btnApostar')) {
        
        const lista = document.getElementById('listaApuestas');
        const importe = document.getElementById('importe');
        const ganancia = document.getElementById('ganancia');

        if (importe && parseFloat(importe.value) > 0 && lista && lista.innerText !== "No has seleccionado ninguna apuesta") {
            
            // 1. Guardamos en el historial
            const nuevaApuesta = {
                fecha: new Date().toLocaleString(),
                detalles: lista.innerText,
                dinero: importe.value,
                posible: ganancia ? ganancia.innerText.replace('Ganancia posible: ', '') : '0.00',
                estado: 'Pendiente ⏳'
            };

            let historial = JSON.parse(localStorage.getItem('mis_apuestas_guardadas')) || [];
            historial.push(nuevaApuesta);
            localStorage.setItem('mis_apuestas_guardadas', JSON.stringify(historial));
            
            alert("✅ ¡Apuesta realizada y guardada!");

            // 2. LIMPIEZA AUTOMÁTICA: Borramos la selección después de apostar
            limpiarSeleccionManual();
        }
    }
});