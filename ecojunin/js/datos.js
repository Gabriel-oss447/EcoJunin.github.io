// datos.js → "cerebro compartido". Cada colección de localStorage replica una tabla SQL (ver sql/base_datos.sql):
//   amb_reportes  ↔ reporte_ambiental + evidencia_reporte      amb_preguntas ↔ pregunta + opcion_respuesta
// Demo: en una web real el acceso y los datos viven en el servidor/MySQL, nunca en el navegador.
const ADMIN = { usuario: "admin", clave: "junin2026" };

const PREGUNTAS_INICIALES = [
  { id: 1, enunciado: "¿Qué porcentaje de los residuos municipales de la región Junín se dispuso de forma adecuada en 2020?", imagen: "",
    opciones: ["12,5 %", "45 %", "70 %", "95 %"], correcta: 0,
    retro: "Según el MINAM, Junín generó cerca de 271 mil toneladas de residuos municipales al año y solo el 12,5 % tuvo una disposición adecuada." },
  { id: 2, enunciado: "Los botaderos «El Edén» y «Agua de las Vírgenes» están a orillas de un río de Junín. ¿Cuál?", imagen: "",
    opciones: ["Río Mantaro", "Río Chanchamayo", "Río Perené", "Río Tulumayo"], correcta: 0,
    retro: "El OEFA denunció la inadecuada disposición de residuos en esos botaderos, ubicados a orillas del río Mantaro." },
  { id: 3, enunciado: "¿Qué ODS está relacionado con la acción contra el cambio climático?", imagen: "",
    opciones: ["ODS 1", "ODS 7", "ODS 13", "ODS 16"], correcta: 2,
    retro: "El ODS 13, «Acción por el Clima», promueve medidas urgentes contra el cambio climático y la educación ambiental." },
  { id: 4, enunciado: "¿Qué entidad es responsable de la gestión de los residuos sólidos dentro de su jurisdicción?", imagen: "",
    opciones: ["Las municipalidades", "Los colegios", "Las empresas de transporte", "Los mercados"], correcta: 0,
    retro: "Las municipalidades gestionan los residuos sólidos de su distrito o provincia; por eso los reportes llegan a ellas." },
  { id: 5, enunciado: "¿Qué significan las 3R del reciclaje?", imagen: "",
    opciones: ["Reducir, reutilizar, reciclar", "Recoger, reunir, repartir", "Reparar, renovar, regalar", "Rechazar, reemplazar, resumir"], correcta: 0,
    retro: "Reducir el consumo, reutilizar lo que se pueda y reciclar el resto disminuye la cantidad de residuos que llega a los botaderos." },
  { id: 6, enunciado: "¿Qué ocurre cuando se queman residuos a cielo abierto?", imagen: "",
    opciones: ["Se liberan gases y humo contaminantes", "Se purifica el aire", "Se genera abono", "No pasa nada"], correcta: 0,
    retro: "La quema libera humo y gases tóxicos que dañan la salud y contaminan el aire; es una de las categorías de reporte." },
  { id: 7, enunciado: "¿Para qué sirve el compostaje?", imagen: "",
    opciones: ["Convertir restos orgánicos en abono", "Derretir plásticos", "Fabricar vidrio", "Limpiar ríos"], correcta: 0,
    retro: "El compostaje transforma restos de frutas, verduras y hojas en abono natural, y reduce los residuos orgánicos." },
  { id: 8, enunciado: "¿Cuál es el principal gas de efecto invernadero emitido por las actividades humanas?", imagen: "",
    opciones: ["Dióxido de carbono (CO₂)", "Oxígeno", "Nitrógeno", "Helio"], correcta: 0,
    retro: "El CO₂, producido sobre todo al quemar combustibles, es el principal responsable del calentamiento global." },
  { id: 9, enunciado: "¿Cómo afecta un botadero informal cercano a un río?", imagen: "",
    opciones: ["Contamina el agua y daña a la fauna", "Mejora la calidad del agua", "No tiene efectos", "Aumenta los peces"], correcta: 0,
    retro: "Los residuos y sus líquidos llegan al cauce y empeoran la calidad del agua; la ANA identificó botaderos como fuente de contaminación en la cuenca del Mantaro." },
  { id: 10, enunciado: "Si ves un foco de basura en tu barrio, ¿qué es lo más útil para ayudar a resolverlo?", imagen: "",
    opciones: ["Reportarlo con foto y ubicación", "Quemarlo", "Taparlo con tierra", "Ignorarlo"], correcta: 0,
    retro: "Un reporte con foto, ubicación y descripción permite que la municipalidad lo identifique y le dé seguimiento." },
  { id: 11, enunciado: "El botadero El Porvenir (El Tambo) tendría una capacidad remanente de aproximadamente…", imagen: "",
    opciones: ["Dos meses", "Diez años", "Cincuenta años", "Un día"], correcta: 0,
    retro: "El OEFA alertó que su capacidad remanente era de unos dos meses, lo que muestra la urgencia de una mejor gestión de residuos." },
  { id: 12, enunciado: "¿Qué recomendó el OEFA desde 2011 para Huancayo?", imagen: "",
    opciones: ["Construir una planta de tratamiento de residuos", "Cerrar todos los mercados", "Prohibir el reciclaje", "Importar basura"], correcta: 0,
    retro: "El OEFA recomendó construir una planta de tratamiento de residuos, porque los botaderos no son una solución definitiva." }
];

const leer = (k, def) => { const t = localStorage.getItem(k); return t ? JSON.parse(t) : def; };
const guardar = (k, v) => localStorage.setItem(k, JSON.stringify(v));
function getPreguntas() { let p = leer("amb_preguntas", null); if (!p) { p = PREGUNTAS_INICIALES; guardar("amb_preguntas", p); } return p; }
const setPreguntas = (p) => guardar("amb_preguntas", p);
const getReportes = () => leer("amb_reportes", []);
const setReportes = (r) => guardar("amb_reportes", r);
const esc = (t) => String(t ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const urlMapa = (lat, lng) => `https://www.google.com/maps?q=${lat},${lng}`;

// ---------- Imágenes aleatorias del aside ----------
// Pon tus fotos en assets/img/ con estos nombres. Si falta alguna, se dibuja una ilustración de reemplazo.
const IMAGENES = [
  { f: "rio-mantaro.jpg", t: "El río Mantaro necesita cuidado", e: "🏞️", c: "#cfe8e0" },
  { f: "reciclaje.jpg", t: "Reciclar reduce la basura", e: "♻️", c: "#dcefc9" },
  { f: "compostaje.jpg", t: "Los restos orgánicos son abono", e: "🌱", c: "#e8e0c4" },
  { f: "bosque.jpg", t: "Los árboles limpian el aire", e: "🌳", c: "#cde5c0" },
  { f: "agua.jpg", t: "El agua limpia es vida", e: "💧", c: "#cfe6f0" },
  { f: "limpieza.jpg", t: "Una limpieza comunitaria cambia un barrio", e: "🧤", c: "#f0e2c8" }
];
function pintarGaleria(id, n = 3) {
  const el = document.getElementById(id); if (!el) return;
  el.innerHTML = IMAGENES.slice().sort(() => Math.random() - 0.5).slice(0, n).map((i) => {
    const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='400' height='200'><rect width='100%' height='100%' fill='${i.c}'/><text x='50%' y='62%' font-size='80' text-anchor='middle'>${i.e}</text></svg>`;
    return `<figure class="foto"><img src="assets/img/${i.f}" alt="${esc(i.t)}" data-r="data:image/svg+xml;utf8,${encodeURIComponent(svg)}"
      onerror="this.onerror=null;this.src=this.dataset.r"><figcaption>${esc(i.t)}</figcaption></figure>`;
  }).join("");
}

// ---------- Cuentas de usuario (SQL: tabla usuario con rol CIUDADANO) e intentos del quiz (tabla intento_quiz) ----------
const getUsuarios = () => leer("amb_usuarios", []);
const setUsuarios = (u) => guardar("amb_usuarios", u);
const getIntentos = () => leer("amb_intentos", []);
const setIntentos = (i) => guardar("amb_intentos", i);
const getSesionUsuario = () => { try { return JSON.parse(sessionStorage.getItem("amb_usuario")); } catch { return null; } };
// Demo: la contraseña se guarda como hash SHA-256. En un servidor real se usa Argon2id (usuario.contrasena_hash).
async function hashClave(t) {
  if (!(window.crypto && crypto.subtle)) return "p:" + btoa(unescape(encodeURIComponent(t)));
  const b = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(t));
  return [...new Uint8Array(b)].map((x) => x.toString(16).padStart(2, "0")).join("");
}

// ---------- Menú según la sesión: visitante o usuario con cuenta ----------
function pintarNav() {
  const nav = document.getElementById("nav"); if (!nav) return;
  const act = document.body.dataset.pag, u = getSesionUsuario();
  const li = (k, h, t) => `<li><a${act === k ? ' class="activo"' : ""} href="${h}">${t}</a></li>`;
  nav.innerHTML = `<a class="marca" href="${u ? "indexUsuario.html" : "index.html"}">🌿 EcoJunín</a>` + (u
    ? `<ul>${li("u", "indexUsuario.html", "Inicio")}${li("r", "reportar.html", "Reportar")}${li("q", "quiz.html", "Quiz")}</ul>
       <ul><li><span class="hola">Hola, ${esc(u.nombre.split(" ")[0])}</span></li><li><button type="button" id="btn-salir-u" class="claro">Cerrar sesión</button></li></ul>`
    : `<ul>${li("i", "index.html", "Inicio")}${li("r", "reportar.html", "Reportar")}</ul>
       <ul>${li("c", "acceso.html", "Usuario")}${li("a", "ingreso.html", "Administrador")}</ul>`);
  const b = document.getElementById("btn-salir-u");
  if (b) b.onclick = () => { sessionStorage.removeItem("amb_usuario"); window.location.href = "index.html"; };
}
pintarNav();
