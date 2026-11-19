// index.js → clima, reportes públicos y galería aleatoria
const $ = (id) => document.getElementById(id);
if (document.body.dataset.pag === "u") {                          // indexUsuario: solo con la sesión iniciada
  const usuario = getSesionUsuario();
  if (!usuario) window.location.href = "acceso.html"; else $("nombre-usuario").textContent = usuario.nombre;
}

// ---------- Clima (Open-Meteo, sin clave). Si falla, se deja el texto por defecto ----------
fetch("https://api.open-meteo.com/v1/forecast?latitude=-12.07&longitude=-75.21&current=temperature_2m,relative_humidity_2m")
  .then((r) => r.json())
  .then((d) => { $("temp").textContent = d.current.temperature_2m + " °C"; $("clima").textContent = "Huancayo ahora · humedad " + d.current.relative_humidity_2m + " %"; })
  .catch(() => { $("clima").textContent = "Temperatura no disponible sin conexión"; });

// ---------- Reportes públicos (SQL: SELECT ... FROM reporte_ambiental ORDER BY fecha_envio DESC) ----------
function pintarReportes() {
  $("lista-reportes").innerHTML = getReportes().slice().reverse().map((r) => `
    <div class="tarjeta"><img src="${r.foto}" alt="Contaminación en ${esc(r.zona)}">
      <h5>${esc(r.zona)}</h5><small>${esc(r.fecha)} · ${esc(r.nombres.split(" ")[0])}</small>
      <p>${esc(r.descripcion)}</p>
      <small><span class="estado ${r.estado.toLowerCase()}">${r.estado}</span> · <a href="${urlMapa(r.lat, r.lng)}" target="_blank" rel="noopener">Ver mapa</a></small></div>`).join("")
    || `<p class="vacio">Aún no hay reportes. Sé la primera persona en reportar una zona contaminada.</p>`;
}

pintarGaleria("galeria", 3);
pintarReportes();
