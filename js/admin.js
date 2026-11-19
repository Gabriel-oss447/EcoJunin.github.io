// admin.js → resumen, reportes, detalle del quiz y alta de preguntas
if (!sessionStorage.getItem("amb_sesion")) window.location.href = "ingreso.html";   // protección de la página
const $ = (id) => document.getElementById(id);

// SQL: SELECT COUNT(*), SUM(estado_atencion='FINALIZADO'), SUM(estado_atencion<>'FINALIZADO') FROM reporte_ambiental  (vista v_resumen_reportes)
function pintarResumen() {
  const r = getReportes(), at = r.filter((x) => x.estado === "Solucionado").length;
  $("n-total").textContent = r.length; $("n-atendidos").textContent = at; $("n-pendientes").textContent = r.length - at;
}

// SQL: vista v_reportes_admin
function pintarReportes() {
  $("tabla-reportes").innerHTML = getReportes().map((r) => `<tr>
    <td>${r.id}</td><td>${esc(r.nombres)} ${esc(r.apellidos)}</td>
    <td><span class="estado ${r.estado.toLowerCase()}">${r.estado}</span></td>
    <td><button type="button" data-ver="${r.id}">Ver detalles</button>
      ${r.estado === "Pendiente" ? `<button type="button" class="ok" data-ok="${r.id}">Solucionado</button>` : ""}</td></tr>`).join("")
    || `<tr><td colspan="4" class="vacio">Todavía no hay reportes.</td></tr>`;
}

$("tabla-reportes").addEventListener("click", (e) => {
  const ver = e.target.closest("[data-ver]"), ok = e.target.closest("[data-ok]");
  const reportes = getReportes();
  if (ver) {
    const r = reportes.find((x) => x.id == ver.dataset.ver);
    $("detalle").innerHTML = `<h2>Reporte N° ${r.id}</h2><img src="${r.foto}" alt="Foto del reporte">
      <dl><dt>Nombre</dt><dd>${esc(r.nombres)} ${esc(r.apellidos)}</dd><dt>Fecha</dt><dd>${esc(r.fecha)}</dd>
      <dt>Zona</dt><dd>${esc(r.zona)}</dd><dt>Descripción</dt><dd>${esc(r.descripcion)}</dd>
      <dt>Ubicación</dt><dd><a href="${urlMapa(r.lat, r.lng)}" target="_blank" rel="noopener">${r.lat}, ${r.lng} (abrir en Google Maps)</a></dd>
      <dt>Estado</dt><dd>${r.estado}</dd></dl><button type="button" id="cerrar" class="claro" style="margin-top:14px">Cerrar</button>`;
    $("detalle").showModal();
    $("cerrar").onclick = () => $("detalle").close();
  }
  if (ok) {                                                       // SQL: CALL sp_resolver_reporte(id) → FINALIZADO + historial_estado
    reportes.find((x) => x.id == ok.dataset.ok).estado = "Solucionado";
    setReportes(reportes); pintarTodo();
  }
});

// SQL: SELECT p.id_pregunta, p.enunciado, o.texto_opcion FROM pregunta p JOIN opcion_respuesta o ON ... WHERE o.es_correcta
function pintarQuiz() {
  const p = getPreguntas();
  $("n-preguntas").textContent = `El banco tiene ${p.length} preguntas; cada intento muestra 10 al azar.`;
  $("tabla-quiz").innerHTML = p.map((q, i) => `<tr><td>${i + 1}</td><td>${esc(q.enunciado)}</td><td>${esc(q.opciones[q.correcta])}</td>
    <td><button type="button" data-borrar="${q.id}">Eliminar</button></td></tr>`).join("");
}

$("tabla-quiz").addEventListener("click", (e) => {
  const b = e.target.closest("[data-borrar]"); if (!b) return;
  if (confirm("¿Eliminar esta pregunta del quiz?")) { setPreguntas(getPreguntas().filter((q) => q.id != b.dataset.borrar)); pintarQuiz(); }
});

$("form-pregunta").addEventListener("submit", (e) => {         // SQL: INSERT INTO pregunta ...; INSERT INTO opcion_respuesta ... (x4)
  e.preventDefault();
  const p = getPreguntas();
  p.push({ id: Math.max(0, ...p.map((q) => q.id)) + 1, enunciado: $("q-enunciado").value.trim(), imagen: $("q-imagen").value.trim(),
    opciones: [0, 1, 2, 3].map((i) => $("q-o" + i).value.trim()), correcta: +$("q-correcta").value, retro: $("q-retro").value.trim() });
  setPreguntas(p); e.target.reset(); pintarQuiz();
  alert("¡Pregunta agregada! Ya puede salir en el quiz de la página principal.");
});

$("btn-salir").addEventListener("click", () => { sessionStorage.removeItem("amb_sesion"); window.location.href = "ingreso.html"; });
function pintarTodo() { pintarResumen(); pintarReportes(); pintarQuiz(); }
window.addEventListener("storage", pintarTodo);                  // se actualiza si llega un reporte desde otra pestaña
pintarTodo();
