// Define la URL base de tu API.
// CAMBIA ESTO CUANDO DESPLIEGUES A RENDER.COM
const API_BASE_URL = 'http://localhost:4000/api'; // O la URL de tu backend en Render

function mostrarVista(vista) {
  const contenido = document.getElementById('contenido');
  contenido.innerHTML = '<h2>Cargando...</h2>'; // Mensaje mientras carga

  switch (vista) {
    case 'medicamentos':
      cargarVistaMedicamentos(contenido);
      break;
    case 'clientes':
      cargarVistaClientes(contenido);
      break;
    case 'empleados':
      cargarVistaEmpleados(contenido);
      break;
    case 'ventas':
      cargarVistaVentas(contenido);
      break;
    default:
      contenido.innerHTML = '<h2>Vista no encontrada</h2>';
  }
}

// Llama a la vista de medicamentos por defecto al cargar la página
document.addEventListener('DOMContentLoaded', () => {
  mostrarVista('medicamentos');
});
