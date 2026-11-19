// acceso.js → iniciar sesión o crear cuenta (SQL: SELECT/INSERT en la tabla usuario con rol CIUDADANO)
const $ = (id) => document.getElementById(id);
if (getSesionUsuario()) window.location.href = "indexUsuario.html";

function ver(modo) {
  $("form-login").hidden = modo !== "login"; $("form-registro").hidden = modo !== "registro";
  $("t-login").classList.toggle("activo", modo === "login"); $("t-registro").classList.toggle("activo", modo === "registro");
}
$("t-login").onclick = () => ver("login");
$("t-registro").onclick = () => ver("registro");

function entrar(u) {                                              // sesión de la pestaña; luego a la página de usuario
  sessionStorage.setItem("amb_usuario", JSON.stringify({ id: u.id, nombre: u.nombre, correo: u.correo }));
  window.location.href = "indexUsuario.html";
}

$("form-login").addEventListener("submit", async (e) => {
  e.preventDefault();
  const correo = $("l-correo").value.trim().toLowerCase(), hash = await hashClave($("l-clave").value);
  const u = getUsuarios().find((x) => x.correo === correo && x.hash === hash);
  if (u) entrar(u); else $("err-login").hidden = false;
});

$("form-registro").addEventListener("submit", async (e) => {
  e.preventDefault();
  const err = $("err-registro"), usuarios = getUsuarios();
  const nombre = $("r-nombre").value.trim(), correo = $("r-correo").value.trim().toLowerCase(), clave = $("r-clave").value;
  if (clave.length < 6) { err.textContent = "La contraseña debe tener al menos 6 caracteres."; err.hidden = false; return; }
  if (usuarios.some((x) => x.correo === correo)) { err.textContent = "Ya existe una cuenta con ese correo. Usa «Ya tengo cuenta» para ingresar."; err.hidden = false; return; }
  const u = { id: usuarios.length ? Math.max(...usuarios.map((x) => x.id)) + 1 : 1, nombre, correo, hash: await hashClave(clave) };
  usuarios.push(u); setUsuarios(usuarios);
  entrar(u);
});
pintarGaleria("galeria", 3);
