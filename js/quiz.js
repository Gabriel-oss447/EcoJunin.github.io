// quiz.js → quiz de 10 preguntas al azar
const $ = (id) => document.getElementById(id);
if (!getSesionUsuario()) window.location.href = "acceso.html";   // el quiz es solo para usuarios con cuenta
// ---------- Quiz: 10 preguntas al azar del banco (SQL: SELECT ... FROM pregunta ORDER BY RAND() LIMIT 10) ----------
let preguntas = [], pos = 0, resp = [], elegida = null;
const caja = $("quiz-caja");

function inicio() {
  caja.innerHTML = `<p>Responde 10 preguntas al azar sobre lo que aprendiste y mira tu resultado al final.</p><button type="button" id="btn-empezar" style="margin-top:12px">Empezar quiz</button>`;
  $("btn-empezar").onclick = () => {
    preguntas = getPreguntas().slice().sort(() => Math.random() - 0.5).slice(0, 10);
    if (!preguntas.length) return alert("El administrador aún no agregó preguntas.");
    pos = 0; resp = []; pintarPregunta();
  };
}

function pintarPregunta() {
  const q = preguntas[pos]; elegida = null;
  caja.innerHTML = `<div class="barra"><i style="width:${(pos / preguntas.length) * 100}%"></i></div>
    <small>Pregunta ${pos + 1} de ${preguntas.length}</small>
    ${q.imagen ? `<img class="quiz-img" src="${esc(q.imagen)}" alt="" onerror="this.remove()">` : ""}
    <h3 style="margin:8px 0">${esc(q.enunciado)}</h3>
    ${q.opciones.map((o, i) => `<button type="button" class="opcion" data-i="${i}">${esc(o)}</button>`).join("")}
    <button type="button" id="btn-sig" disabled style="margin-top:10px;width:100%">${pos + 1 === preguntas.length ? "Ver resultado" : "Continuar"}</button>`;
  caja.querySelectorAll(".opcion").forEach((b) => b.onclick = () => {
    caja.querySelectorAll(".opcion").forEach((x) => x.classList.remove("sel"));
    b.classList.add("sel"); elegida = +b.dataset.i; $("btn-sig").disabled = false;
  });
  $("btn-sig").onclick = () => { resp.push(elegida); pos++; pos < preguntas.length ? pintarPregunta() : resultado(); };
}

function resultado() {
  const aciertos = preguntas.filter((q, i) => resp[i] === q.correcta).length;
  const u = getSesionUsuario(), intentos = getIntentos();        // SQL: INSERT INTO intento_quiz (id_usuario, id_quiz, aciertos, puntaje, aprobado) ...
  intentos.push({ idUsuario: u.id, nombre: u.nombre, aciertos, total: preguntas.length, nota: +(aciertos / preguntas.length * 20).toFixed(1), ts: Date.now() });
  setIntentos(intentos); pintarRanking();
  const msg = aciertos >= 9 ? "¡Excelente! Eres un guardián del ambiente."
    : aciertos >= 7 ? "¡Muy bien! Dominas casi todo; repasa lo que fallaste."
    : aciertos >= 5 ? "Vas por buen camino. Lee la información de Junín y vuelve a intentarlo."
    : "Aún te falta reforzar. Revisa los datos de la página y reintenta, ¡tú puedes!";
  caja.innerHTML = `<p class="nota">${aciertos} / ${preguntas.length}</p><p><b>${msg}</b></p>
    <p><small>Nota: ${(aciertos / preguntas.length * 20).toFixed(0)}/20 · ${aciertos / preguntas.length * 20 >= 11 ? "Aprobado" : "Por mejorar"}</small></p>
    <h3 style="margin-top:12px">Respuestas correctas</h3>
    ${preguntas.map((q, i) => `<div class="rev"><b>${i + 1}. ${esc(q.enunciado)}</b>
      <p class="${resp[i] === q.correcta ? "ok" : "mal"}">${resp[i] === q.correcta ? "✔ Acertaste" : "✘ Marcaste: " + esc(q.opciones[resp[i]])}</p>
      <p>Correcta: <b>${esc(q.opciones[q.correcta])}</b></p><p>${esc(q.retro)}</p></div>`).join("")}
    <button type="button" id="btn-otra" style="margin-top:12px;width:100%">Intentar otra vez</button>`;
  $("btn-otra").onclick = inicio;
}

inicio();
pintarGaleria("galeria", 3);

// ---------- Ranking por jerarquía (SQL: vista v_ranking_quiz) ----------
function pintarRanking() {
  const yo = getSesionUsuario(), mejor = {};
  getIntentos().forEach((t) => {
    const m = mejor[t.idUsuario];
    if (!m) mejor[t.idUsuario] = { ...t, n: 1 };
    else { m.n++; if (t.nota > m.nota) { m.nota = t.nota; m.aciertos = t.aciertos; m.ts = t.ts; } }
  });
  const fila = Object.values(mejor).sort((a, b) => b.nota - a.nota || a.ts - b.ts);
  $("tabla-ranking").innerHTML = fila.map((f, i) => `<tr class="${yo && f.idUsuario === yo.id ? "yo" : ""}">
    <td>${["🥇", "🥈", "🥉"][i] || i + 1}</td><td>${esc(f.nombre)}</td><td>${f.aciertos}/${f.total} · ${f.nota}/20</td><td>${f.n}</td></tr>`).join("")
    || `<tr><td colspan="4" class="vacio">Aún nadie ha completado el quiz.</td></tr>`;
}
pintarRanking();
