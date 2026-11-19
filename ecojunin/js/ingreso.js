// ingreso.js → valida usuario y contraseña del administrador
// SQL real: SELECT ... FROM usuario WHERE correo_electronico = ? AND rol_usuario = 'ADMINISTRADOR' y comparar el hash (Argon2id) en el servidor
document.getElementById("form-login").addEventListener("submit", (e) => {
  e.preventDefault();
  const u = document.getElementById("usuario").value.trim().toLowerCase();
  const c = document.getElementById("clave").value;
  if (u === ADMIN.usuario && c === ADMIN.clave) {
    sessionStorage.setItem("amb_sesion", u);      // sessionStorage: se borra al cerrar la pestaña
    window.location.href = "admin.html";
  } else document.getElementById("error").hidden = false;
});
