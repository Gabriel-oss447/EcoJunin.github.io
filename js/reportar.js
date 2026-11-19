// reportar.js → formulario de reporte ambiental
const $ = (id) => document.getElementById(id);
// ---------- Formulario de reporte ----------
$("fecha").value = new Date().toLocaleDateString("es-PE");        // fecha automática del día
let fotoData = "";

$("foto").addEventListener("change", (e) => {                     // comprime la foto de la galería (máx. 800 px)
  const f = e.target.files[0]; if (!f) return;
  const lector = new FileReader();
  lector.onload = () => {
    const img = new Image();
    img.onload = () => {
      const k = Math.min(1, 800 / Math.max(img.width, img.height));
      const c = document.createElement("canvas"); c.width = img.width * k; c.height = img.height * k;
      c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
      fotoData = c.toDataURL("image/jpeg", 0.7);
      $("vista").src = fotoData; $("vista").hidden = false;
    };
    img.src = lector.result;
  };
  lector.readAsDataURL(f);
});

function leerCoords(t) {                                          // acepta "-12.06, -75.21" o un enlace de Google Maps con @lat,lng
  const m = t.match(/(-?\d{1,2}\.\d+)\s*,\s*(-?\d{1,3}\.\d+)/);
  return m ? { lat: +m[1], lng: +m[2] } : null;
}
function actualizarMapa() {
  const c = leerCoords($("coords").value);
  if (c) $("mapa").src = `https://www.google.com/maps?q=${c.lat},${c.lng}&output=embed`;
}
$("coords").addEventListener("change", actualizarMapa);
$("btn-gps").addEventListener("click", () => {
  navigator.geolocation?.getCurrentPosition(
    (p) => { $("coords").value = p.coords.latitude.toFixed(6) + ", " + p.coords.longitude.toFixed(6); actualizarMapa(); },
    () => alert("No se pudo obtener tu ubicación. Pega las coordenadas desde Google Maps."));
});

function aviso(t) { $("msg-reporte").textContent = t; $("msg-reporte").hidden = false; }

$("form-reporte").addEventListener("submit", (e) => {
  e.preventDefault();
  const c = leerCoords($("coords").value);
  if (!c) return aviso("No se reconoce la ubicación. Usa el botón de GPS o pega coordenadas como -12.0903, -75.2090.");
  if (!fotoData) return aviso("Espera a que cargue la foto e inténtalo de nuevo.");
  const reportes = getReportes();
  reportes.push({                                                 // SQL: CALL sp_registrar_reporte(...) → estado REGISTRADO (Pendiente)
    id: reportes.length ? Math.max(...reportes.map((r) => r.id)) + 1 : 1,
    nombres: $("nombres").value.trim(), apellidos: $("apellidos").value.trim(),
    fecha: $("fecha").value, zona: $("zona").value.trim(), descripcion: $("descripcion").value.trim(),
    lat: c.lat, lng: c.lng, foto: fotoData, estado: "Pendiente"
  });
  try { setReportes(reportes); } catch { return aviso("No hay espacio para guardar la foto. Usa una imagen más liviana."); }
  e.target.reset(); fotoData = ""; $("vista").hidden = true; $("msg-reporte").hidden = true;
  $("fecha").value = new Date().toLocaleDateString("es-PE");
  sessionStorage.setItem("amb_ultimo", JSON.stringify({ id: reportes[reportes.length - 1].id, zona: reportes[reportes.length - 1].zona }));
  window.location.href = "reporte-enviado.html";                 // muestra la pantalla de éxito
});

pintarGaleria("galeria", 3);
