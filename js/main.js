// AppFarmacia - Control de Vistas
// Este script permite cambiar entre las vistas de medicamentos, clientes, empleados y ventas.

const API_BASE_URL = "https://appfarmaciabackend.onrender.com/api";

// Función para mostrar la vista correspondiente
function mostrarVista(vista) {
  const contenido = document.getElementById("contenido");

  contenido.innerHTML = "<h2>Cargando...</h2>"; // Mensaje mientras carga

  switch (vista) {
    case "medicamentos":
      cargarVistaMedicamentos(contenido);
      break;
    case "clientes":
      cargarVistaClientes(contenido);
      break;
    case "empleados":
      cargarVistaEmpleados(contenido);
      break;
    case "ventas":
      cargarVistaVentas(contenido);
      break;
    default:
      contenido.innerHTML = "<h2>Vista no encontrada</h2>";
  }
}

// Llama a la vista de medicamentos por defecto al cargar la página
document.addEventListener("DOMContentLoaded", () => {
  mostrarVista("medicamentos");
});
