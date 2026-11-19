// reporte-enviado.js → confirmación después de enviar un reporte
const ult = JSON.parse(sessionStorage.getItem("amb_ultimo") || "null");
if (ult) {
  const p = document.getElementById("detalle-envio");
  p.textContent = `Reporte N° ${ult.id} · ${ult.zona} · Pendiente`; p.hidden = false;
}
if (getSesionUsuario()) document.getElementById("volver").href = "indexUsuario.html";   // si tiene cuenta, vuelve a su inicio
pintarGaleria("galeria", 3);
