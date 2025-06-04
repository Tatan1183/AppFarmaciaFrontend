/*
  Código de autenticación simple para login
  - Valida usuario y contraseña hardcodeados
  - Muestra mensajes de error o éxito
  - Redirige a la página principal si el login es correcto
  - Función para cerrar sesión que redirige a la página de inicio
*/

// Credenciales correctas
const usuarioCorrecto = "admin";
const contrasenaCorrecta = "1234";

// Evento que captura el submit del formulario de login
const loginForm = document.getElementById("loginForm");
if (loginForm) {
  loginForm.addEventListener("submit", function (e) {
    e.preventDefault();

    // Obtener valores ingresados
    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;
    const errorMessage = document.getElementById("error-message");

    // Validación de credenciales
    if (username === usuarioCorrecto && password === contrasenaCorrecta) {
      errorMessage.style.color = "green";
      errorMessage.textContent = "Inicio de sesión exitoso. Redirigiendo...";
      setTimeout(() => {
        window.location.href = "/frontend/index.html";
      }, 1000);
    } else {
      errorMessage.style.color = "red";
      errorMessage.textContent = "Usuario o contraseña incorrectos.";
    }
  });
}

// Función para cerrar sesión
function cerrarSesion() {
  // Aquí podrías limpiar sesión/JWT si lo usas más adelante
  window.location.href = "./Inicio.html";
}
