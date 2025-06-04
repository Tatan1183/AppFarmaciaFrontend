// Función principal para cargar la vista de medicamentos en el contenedor dado
async function cargarVistaMedicamentos(contenedor) {
  // Renderizar estructura HTML principal: encabezado, botón y tabla vacía
  contenedor.innerHTML = `
    <div class="gestion-header">
      <h2>Gestión de Medicamentos</h2>
      <button id="btnAgregarMedicamento" class="btn-agregar">Agregar Medicamento</button>
    </div>
    <div id="formularioMedicamentoContainer"></div>
    <table id="tablaMedicamentos">
      <thead>
        <tr>
          <th>Nombre</th>
          <th>Descripción</th>
          <th>Categoría</th>
          <th>Precio</th>
          <th>Stock</th>
          <th>Laboratorio</th>
          <th>Vencimiento</th>
          <th>Presentación</th>
          <th>Acciones</th>
        </tr>
      </thead>
      <tbody>
        <!-- Los datos se cargarán aquí -->
      </tbody>
    </table>
  `;

  // Obtener referencias a elementos clave para interacción
  const btnAgregarMedicamento = document.getElementById(
    "btnAgregarMedicamento"
  );
  const formularioContainer = document.getElementById(
    "formularioMedicamentoContainer"
  );
  const tablaMedicamentosBody = document.querySelector(
    "#tablaMedicamentos tbody"
  );

  // Asignar evento para mostrar formulario de nuevo medicamento al hacer clic en botón
  btnAgregarMedicamento.addEventListener("click", () => {
    mostrarFormularioMedicamento(
      null,
      formularioContainer,
      tablaMedicamentosBody
    );
  });

  // Cargar listado inicial de medicamentos desde la API y mostrarlos en la tabla
  await listarMedicamentos(tablaMedicamentosBody, formularioContainer);
}

// Función para obtener medicamentos desde la API y mostrarlos en la tabla
async function listarMedicamentos(tbody, formularioContainer) {
  try {
    // Solicitar datos de medicamentos
    const response = await fetch(`${API_BASE_URL}/medicamentos`);
    if (!response.ok)
      throw new Error("Error al obtener medicamentos: " + response.status);
    const medicamentos = await response.json();

    // Limpiar contenido previo de la tabla
    tbody.innerHTML = "";

    // Crear filas por cada medicamento y agregarlas a la tabla
    medicamentos.forEach((medicamento) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${medicamento.nombre}</td>
        <td>${medicamento.descripcion}</td>
        <td>${medicamento.categoria}</td>
        <td>${medicamento.precio}</td>
        <td>${medicamento.stock}</td>
        <td>${medicamento.laboratorio}</td>
        <td>${new Date(medicamento.fecha_vencimiento).toLocaleDateString()}</td>
        <td>${medicamento.presentacion}</td>
        <td>
          <button class="btn-editar" data-id="${
            medicamento._id
          }">Editar</button>
          <button class="btn-eliminar" data-id="${
            medicamento._id
          }">Eliminar</button>
        </td>
      `;
      tbody.appendChild(tr);
    });

    // Añadir listeners para botones editar
    tbody.querySelectorAll(".btn-editar").forEach((btn) => {
      btn.addEventListener("click", async (e) => {
        const id = e.target.dataset.id;
        const medResponse = await fetch(`${API_BASE_URL}/medicamentos/${id}`);
        if (!medResponse.ok) {
          alert("No se pudo cargar el medicamento para editar.");
          return;
        }
        const medicamentoParaEditar = await medResponse.json();
        mostrarFormularioMedicamento(
          medicamentoParaEditar,
          formularioContainer,
          tbody
        );
      });
    });

    // Añadir listeners para botones eliminar
    tbody.querySelectorAll(".btn-eliminar").forEach((btn) => {
      btn.addEventListener("click", async (e) => {
        const id = e.target.dataset.id;
        if (confirm("¿Está seguro de eliminar este medicamento?")) {
          await eliminarMedicamento(id, tbody, formularioContainer);
        }
      });
    });
  } catch (error) {
    // Mostrar error en consola y en la tabla
    console.error(error);
    tbody.innerHTML = `<tr><td colspan="9">Error al cargar medicamentos: ${error.message}</td></tr>`;
  }
}

// Función para mostrar el formulario para agregar o editar medicamento
function mostrarFormularioMedicamento(medicamento, container, tablaBody) {
  const esEdicion = medicamento !== null;
  const fechaVencimiento = medicamento?.fecha_vencimiento
    ? medicamento.fecha_vencimiento.split("T")[0]
    : "";

  // Renderizar formulario con datos si es edición o vacío si es nuevo
  container.innerHTML = `
    <form id="formMedicamento" class="form-gestion">
      <h3>${esEdicion ? "Editar" : "Agregar"} Medicamento</h3>
      <input type="hidden" id="medicamentoId" value="${medicamento?._id || ""}">
      
      <label for="nombre">Nombre:</label>
      <input type="text" id="nombre" value="${
        medicamento?.nombre || ""
      }" required>
      
      <label for="descripcion">Descripción:</label>
      <input type="text" id="descripcion" value="${
        medicamento?.descripcion || ""
      }" required>
      
      <label for="categoria">Categoría:</label>
      <input type="text" id="categoria" value="${
        medicamento?.categoria || ""
      }" required>
      
      <label for="precio">Precio:</label>
      <input type="number" id="precio" value="${
        medicamento?.precio || ""
      }" required step="0.01">
      
      <label for="stock">Stock:</label>
      <input type="number" id="stock" value="${
        medicamento?.stock || ""
      }" required>
      
      <label for="laboratorio">Laboratorio:</label>
      <input type="text" id="laboratorio" value="${
        medicamento?.laboratorio || ""
      }" required>
      
      <label for="fecha_vencimiento">Fecha Vencimiento:</label>
      <input type="date" id="fecha_vencimiento" value="${fechaVencimiento}" required>
      
      <label for="presentacion">Presentación:</label>
      <input type="text" id="presentacion" value="${
        medicamento?.presentacion || ""
      }" required>
      
      <div class="form-actions">
        <button type="submit" class="btn-guardar">${
          esEdicion ? "Actualizar" : "Guardar"
        }</button>
        <button type="button" id="btnCancelarMedicamento" class="btn-cancelar">Cancelar</button>
      </div>
    </form>
  `;

  // Listener para guardar medicamento (crear o actualizar)
  const formMedicamento = document.getElementById("formMedicamento");
  formMedicamento.addEventListener("submit", async (e) => {
    e.preventDefault();
    await guardarMedicamento(formMedicamento, tablaBody, container);
  });

  // Listener para cancelar y limpiar formulario
  document
    .getElementById("btnCancelarMedicamento")
    .addEventListener("click", () => {
      container.innerHTML = ""; // Limpiar formulario
    });
}

// Función para guardar (crear o actualizar) medicamento enviando datos a la API
async function guardarMedicamento(form, tablaBody, formularioContainer) {
  const id = form.medicamentoId.value;
  const esEdicion = id !== "";
  const data = {
    nombre: form.nombre.value,
    descripcion: form.descripcion.value,
    categoria: form.categoria.value,
    precio: parseFloat(form.precio.value),
    stock: parseInt(form.stock.value),
    laboratorio: form.laboratorio.value,
    fecha_vencimiento: form.fecha_vencimiento.value, // Ya está en formato YYYY-MM-DD
    presentacion: form.presentacion.value,
  };

  try {
    // Enviar petición POST o PUT según sea nuevo o edición
    const response = await fetch(
      `${API_BASE_URL}/medicamentos${esEdicion ? `/${id}` : ""}`,
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

    alert(`Medicamento ${esEdicion ? "actualizado" : "creado"} con éxito.`);
    formularioContainer.innerHTML = ""; // Limpiar formulario
    await listarMedicamentos(tablaBody, formularioContainer); // Recargar lista actualizada
  } catch (error) {
    // Manejo de error en consola y alerta al usuario
    console.error(error);
    alert(`Error: ${error.message}`);
  }
}

// Función para eliminar medicamento por id mediante la API
async function eliminarMedicamento(id, tablaBody, formularioContainer) {
  try {
    // Enviar petición DELETE para eliminar medicamento
    const response = await fetch(`${API_BASE_URL}/medicamentos/${id}`, {
      method: "DELETE",
    });
    if (!response.ok)
      throw new Error("Error al eliminar medicamento: " + response.status);

    alert("Medicamento eliminado con éxito.");
    await listarMedicamentos(tablaBody, formularioContainer); // Recargar lista actualizada
  } catch (error) {
    // Manejo de error en consola y alerta
    console.error(error);
    alert(error.message);
  }
}
