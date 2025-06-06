/*
  -Gestión de Empleados - AppFarmacia

  -Este archivo contiene las funciones necesarias 
  para mostrar, crear, editar y eliminar empleados 
  desde una interfaz HTML utilizando Fetch API 
  para comunicarse con un backend basado en Node.js.
*/

// Carga la vista de empleados en el contenedor HTML dado
async function cargarVistaEmpleados(contenedor) {
  contenedor.innerHTML = `
    <div class="gestion-header">
      <h2>Gestión de Empleados</h2>
      <button id="btnAgregarEmpleado" class="btn-agregar"><i class="fas fa-user-tie"></i> Agregar Empleado</button>
    </div>
    <div id="formularioEmpleadoContainer"></div>
    <table id="tablaEmpleados">
      <thead>
        <tr>
          <th>Nombre</th>
          <th>Cédula</th>
          <th>Cargo</th>
          <th>Teléfono</th>
          <th>Turno</th>
          <th>Acciones</th>
        </tr>
      </thead>
      <tbody>
        <!-- Los datos se cargarán aquí -->
      </tbody>
    </table>
  `;

  // Referencias a elementos del DOM
  const btnAgregarEmpleado = document.getElementById("btnAgregarEmpleado");
  const formularioContainer = document.getElementById(
    "formularioEmpleadoContainer"
  );
  const tablaEmpleadosBody = document.querySelector("#tablaEmpleados tbody");

  // Muestra el formulario para agregar un nuevo empleado
  btnAgregarEmpleado.addEventListener("click", () => {
    mostrarFormularioEmpleado(null, formularioContainer, tablaEmpleadosBody);
  });

  // Carga la lista de empleados desde el servidor
  await listarEmpleados(tablaEmpleadosBody, formularioContainer);
}

// Obtiene los empleados desde el backend y los muestra en la tabla
async function listarEmpleados(tbody, formularioContainer) {
  try {
    const response = await fetch(`${API_BASE_URL}/empleados`);
    if (!response.ok)
      throw new Error("Error al obtener empleados: " + response.status);
    const empleados = await response.json();

    tbody.innerHTML = ""; // Limpiar tabla

    // Crear una fila por cada empleado
    empleados.forEach((empleado) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${empleado.nombre}</td>
        <td>${empleado.cedula}</td>
        <td>${empleado.cargo}</td>
        <td>${empleado.telefono}</td>
        <td>${empleado.turno}</td>
        <td>
          <button class="btn-editar btn-icon" data-id="${empleado._id}" title="Editar"><i class="fas fa-edit"></i></button>
          <button class="btn-eliminar btn-icon" data-id="${empleado._id}" title="Eliminar"><i class="fas fa-trash"></i></button>
        </td>
      `;
      tbody.appendChild(tr);
    });

    // Agrega eventos a los botones de editar
    tbody.querySelectorAll(".btn-editar").forEach((btn) => {
      btn.addEventListener("click", async (e) => {
        const id = e.target.dataset.id;
        const empResponse = await fetch(`${API_BASE_URL}/empleados/${id}`);
        if (!empResponse.ok) {
          alert("No se pudo cargar el empleado para editar.");
          return;
        }
        const empleadoParaEditar = await empResponse.json();
        mostrarFormularioEmpleado(
          empleadoParaEditar,
          formularioContainer,
          tbody
        );
      });
    });

    // Agrega eventos a los botones de eliminar
    tbody.querySelectorAll(".btn-eliminar").forEach((btn) => {
      btn.addEventListener("click", async (e) => {
        const id = e.target.dataset.id;
        if (confirm("¿Está seguro de eliminar este empleado?")) {
          await eliminarEmpleado(id, tbody, formularioContainer);
        }
      });
    });
  } catch (error) {
    console.error(error);
    tbody.innerHTML = `<tr><td colspan="6">Error al cargar empleados: ${error.message}</td></tr>`;
  }
}

// Muestra el formulario para agregar o editar un empleado
function mostrarFormularioEmpleado(empleado, container, tablaBody) {
  const esEdicion = empleado !== null;
  container.innerHTML = `
    <form id="formEmpleado" class="form-gestion">
      <h3>${esEdicion ? "Editar" : "Agregar"} Empleado</h3>
      <input type="hidden" id="empleadoId" value="${empleado?._id || ""}">
      
      <label for="nombre">Nombre:</label>
      <input type="text" id="nombre" value="${empleado?.nombre || ""}" required>
      
      <label for="cedula">Cédula:</label>
      <input type="text" id="cedula" value="${empleado?.cedula || ""}" required>
      
      <label for="cargo">Cargo:</label>
      <input type="text" id="cargo" value="${empleado?.cargo || ""}" required>
      
      <label for="telefono">Teléfono:</label>
      <input type="text" id="telefono" value="${
        empleado?.telefono || ""
      }" required>
      
      <label for="turno">Turno:</label>
      <select id="turno" required>
        <option value="Mañana" ${
          empleado?.turno === "Mañana" ? "selected" : ""
        }>Mañana</option>
        <option value="Tarde" ${
          empleado?.turno === "Tarde" ? "selected" : ""
        }>Tarde</option>
        <option value="Noche" ${
          empleado?.turno === "Noche" ? "selected" : ""
        }>Noche</option>
      </select>
      
      <div class="form-actions">
  <button type="submit" class="btn-guardar">
    <i class="fas fa-save" style="margin-right: 6px;"></i>
    ${esEdicion ? "Actualizar" : "Guardar"}
  </button>
  
  <button type="button" id="btnCancelarEmpleado" class="btn-cancelar">
    <i class="fas fa-times-circle"></i>
    Cancelar
  </button>
</div>

    </form>
  `;

  // Evento para guardar o actualizar empleado
  const formEmpleado = document.getElementById("formEmpleado");
  formEmpleado.addEventListener("submit", async (e) => {
    e.preventDefault();
    await guardarEmpleado(formEmpleado, tablaBody, container);
  });

  // Evento para cancelar y cerrar formulario
  document
    .getElementById("btnCancelarEmpleado")
    .addEventListener("click", () => {
      container.innerHTML = "";
    });
}

// Guarda un nuevo empleado o actualiza uno existente
async function guardarEmpleado(form, tablaBody, formularioContainer) {
  const id = form.empleadoId.value;
  const esEdicion = id !== "";
  const data = {
    nombre: form.nombre.value,
    cedula: form.cedula.value,
    cargo: form.cargo.value,
    telefono: form.telefono.value,
    turno: form.turno.value,
  };

  try {
    const response = await fetch(
      `${API_BASE_URL}/empleados${esEdicion ? `/${id}` : ""}`,
      {
        method: esEdicion ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }
    );
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        `Error al guardar: ${errorData.mensaje || response.status}`
      );
    }

    alert(`Empleado ${esEdicion ? "actualizado" : "creado"} con éxito.`);
    formularioContainer.innerHTML = ""; // Cierra el formulario
    await listarEmpleados(tablaBody, formularioContainer); // Actualiza tabla
  } catch (error) {
    console.error(error);
    alert(`Error: ${error.message}`);
  }
}

// Elimina un empleado por su ID
async function eliminarEmpleado(id, tablaBody, formularioContainer) {
  try {
    const response = await fetch(`${API_BASE_URL}/empleados/${id}`, {
      method: "DELETE",
    });
    if (!response.ok)
      throw new Error("Error al eliminar empleado: " + response.status);
    alert("Empleado eliminado con éxito.");
    await listarEmpleados(tablaBody, formularioContainer); // Actualiza tabla
  } catch (error) {
    console.error(error);
    alert(error.message);
  }
}