// Gestión de Clientes - AppFarmacia
// Módulo para cargar, mostrar, agregar, editar y eliminar clientes.

// Función principal para cargar la vista de gestión de clientes
async function cargarVistaClientes(contenedor) {
  // Inserta el HTML con encabezado, botón y tabla de clientes
  contenedor.innerHTML = `
    <div class="gestion-header">
      <h2>Gestión de Clientes</h2>
      <button id="btnAgregarCliente" class="btn-agregar"><i class="fas fa-user-plus"></i>Agregar Cliente</button>
    </div>
    <div id="formularioClienteContainer"></div>
    <table id="tablaClientes">
      <thead>
        <tr>
          <th>Nombre</th>
          <th>Cédula</th>
          <th>Teléfono</th>
          <th>Dirección</th>
          <th>Correo</th>
          <th>Acciones</th>
        </tr>
      </thead>
      <tbody>
        <!-- Los datos se cargarán aquí -->
      </tbody>
    </table>
  `;

  // Obtiene referencias a los elementos del DOM
  const btnAgregarCliente = document.getElementById("btnAgregarCliente");
  const formularioContainer = document.getElementById(
    "formularioClienteContainer"
  );
  const tablaClientesBody = document.querySelector("#tablaClientes tbody");

  // Evento para mostrar el formulario al hacer clic en "Agregar Cliente"
  btnAgregarCliente.addEventListener("click", () => {
    mostrarFormularioCliente(null, formularioContainer, tablaClientesBody);
  });

  // Carga los datos de los clientes en la tabla
  await listarClientes(tablaClientesBody, formularioContainer);
}

// Función para obtener y mostrar los clientes desde la API
async function listarClientes(tbody, formularioContainer) {
  try {
    const response = await fetch(`${API_BASE_URL}/clientes`);
    if (!response.ok)
      throw new Error("Error al obtener clientes: " + response.status);

    const clientes = await response.json();

    // Limpia el contenido actual de la tabla
    tbody.innerHTML = "";

    // Crea una fila por cada cliente
    clientes.forEach((cliente) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${cliente.nombre}</td>
        <td>${cliente.cedula}</td>
        <td>${cliente.telefono}</td>
        <td>${cliente.direccion}</td>
        <td>${cliente.correo}</td>
        <td>
          <button class="btn-editar btn-icon" data-id="${cliente._id}" title="Editar"><i class="fas fa-edit"></i></button>
          <button class="btn-eliminar btn-icon" data-id="${cliente._id}" title="Eliminar"><i class="fas fa-trash"></i></button>
        </td>
      `;
      tbody.appendChild(tr);
    });

    // Agrega eventos a los botones de editar
    tbody.querySelectorAll(".btn-editar").forEach((btn) => {
      btn.addEventListener("click", async (e) => {
        const id = e.target.dataset.id;
        const cliResponse = await fetch(`${API_BASE_URL}/clientes/${id}`);
        if (!cliResponse.ok) {
          alert("No se pudo cargar el cliente para editar.");
          return;
        }
        const clienteParaEditar = await cliResponse.json();
        mostrarFormularioCliente(clienteParaEditar, formularioContainer, tbody);
      });
    });

    // Agrega eventos a los botones de eliminar
    tbody.querySelectorAll(".btn-eliminar").forEach((btn) => {
      btn.addEventListener("click", async (e) => {
        const id = e.target.dataset.id;
        if (confirm("¿Está seguro de eliminar este cliente?")) {
          await eliminarCliente(id, tbody, formularioContainer);
        }
      });
    });
  } catch (error) {
    console.error(error);
    // Muestra error en la tabla si falla la carga
    tbody.innerHTML = `<tr><td colspan="6">Error al cargar clientes: ${error.message}</td></tr>`;
  }
}

// Función para mostrar el formulario de agregar/editar cliente
function mostrarFormularioCliente(cliente, container, tablaBody) {
  const esEdicion = cliente !== null;

  // Carga el formulario con los datos si es edición
  container.innerHTML = `
    <form id="formCliente" class="form-gestion">
      <h3>${esEdicion ? "Editar" : "Agregar"} Cliente</h3>
      <input type="hidden" id="clienteId" value="${cliente?._id || ""}">
      
      <label for="nombre">Nombre:</label>
      <input type="text" id="nombre" value="${cliente?.nombre || ""}" required>
      
      <label for="cedula">Cédula:</label>
      <input type="text" id="cedula" value="${cliente?.cedula || ""}" required>
      
      <label for="telefono">Teléfono:</label>
      <input type="text" id="telefono" value="${
        cliente?.telefono || ""
      }" required>
      
      <label for="direccion">Dirección:</label>
      <input type="text" id="direccion" value="${
        cliente?.direccion || ""
      }" required>
      
      <label for="correo">Correo:</label>
      <input type="email" id="correo" value="${cliente?.correo || ""}" required>
      
      <div class="form-actions">
        <button type="submit" class="btn-guardar">
        <i class="fas fa-save" style="margin-rigth: 6px;"></i>
        ${esEdicion ? "Actualizar" : "Guardar"}</button>
        <button type="button" id="btnCancelarCliente" class="btn-cancelar"><i class="fas fa-times-circle" style="margin-rigth: 6px;"></i>Cancelar</button>
      </div>
    </form>
  `;

  // Evento para guardar cliente al enviar el formulario
  const formCliente = document.getElementById("formCliente");
  formCliente.addEventListener("submit", async (e) => {
    e.preventDefault();
    await guardarCliente(formCliente, tablaBody, container);
  });

  // Evento para cancelar y ocultar el formulario
  document
    .getElementById("btnCancelarCliente")
    .addEventListener("click", () => {
      container.innerHTML = "";
    });
}

// Función para guardar un nuevo cliente o actualizar uno existente
async function guardarCliente(form, tablaBody, formularioContainer) {
  const id = form.clienteId.value;
  const esEdicion = id !== "";

  const data = {
    nombre: form.nombre.value,
    cedula: form.cedula.value,
    telefono: form.telefono.value,
    direccion: form.direccion.value,
    correo: form.correo.value,
  };

  try {
    const response = await fetch(
      `${API_BASE_URL}/clientes${esEdicion ? `/${id}` : ""}`,
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

    alert(`Cliente ${esEdicion ? "actualizado" : "creado"} con éxito.`);
    formularioContainer.innerHTML = ""; // Oculta el formulario
    await listarClientes(tablaBody, formularioContainer); // Recarga la tabla
  } catch (error) {
    console.error(error);
    alert(`Error: ${error.message}`);
  }
}

// Función para eliminar un cliente
async function eliminarCliente(id, tablaBody, formularioContainer) {
  try {
    const response = await fetch(`${API_BASE_URL}/clientes/${id}`, {
      method: "DELETE",
    });

    if (!response.ok)
      throw new Error("Error al eliminar cliente: " + response.status);

    alert("Cliente eliminado con éxito.");
    await listarClientes(tablaBody, formularioContainer); // Recarga tabla
  } catch (error) {
    console.error(error);
    alert(error.message);
  }
}

