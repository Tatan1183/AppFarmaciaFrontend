async function cargarVistaEmpleados(contenedor) {
  contenedor.innerHTML = `
    <div class="gestion-header">
      <h2>Gestión de Empleados</h2>
      <button id="btnAgregarEmpleado" class="btn-agregar">Agregar Empleado</button>
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
  const btnAgregarEmpleado = document.getElementById('btnAgregarEmpleado');
  const formularioContainer = document.getElementById('formularioEmpleadoContainer');
  const tablaEmpleadosBody = document.querySelector('#tablaEmpleados tbody');

  btnAgregarEmpleado.addEventListener('click', () => {
    mostrarFormularioEmpleado(null, formularioContainer, tablaEmpleadosBody);
  });

  await listarEmpleados(tablaEmpleadosBody, formularioContainer);
}

async function listarEmpleados(tbody, formularioContainer) {
  try {
    const response = await fetch(`${API_BASE_URL}/empleados`);
    if (!response.ok) throw new Error('Error al obtener empleados: ' + response.status);
    const empleados = await response.json();

    tbody.innerHTML = '';
    empleados.forEach(empleado => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${empleado.nombre}</td>
        <td>${empleado.cedula}</td>
        <td>${empleado.cargo}</td>
        <td>${empleado.telefono}</td>
        <td>${empleado.turno}</td>
        <td>
          <button class="btn-editar" data-id="${empleado._id}">Editar</button>
          <button class="btn-eliminar" data-id="${empleado._id}">Eliminar</button>
        </td>
      `;
      tbody.appendChild(tr);
    });

    tbody.querySelectorAll('.btn-editar').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const id = e.target.dataset.id;
        const empResponse = await fetch(`${API_BASE_URL}/empleados/${id}`);
        if (!empResponse.ok) {
          alert('No se pudo cargar el empleado para editar.');
          return;
        }
        const empleadoParaEditar = await empResponse.json();
        mostrarFormularioEmpleado(empleadoParaEditar, formularioContainer, tbody);
      });
    });

    tbody.querySelectorAll('.btn-eliminar').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const id = e.target.dataset.id;
        if (confirm('¿Está seguro de eliminar este empleado?')) {
          await eliminarEmpleado(id, tbody, formularioContainer);
        }
      });
    });

  } catch (error) {
    console.error(error);
    tbody.innerHTML = `<tr><td colspan="6">Error al cargar empleados: ${error.message}</td></tr>`;
  }
}

function mostrarFormularioEmpleado(empleado, container, tablaBody) {
  const esEdicion = empleado !== null;
  container.innerHTML = `
    <form id="formEmpleado" class="form-gestion">
      <h3>${esEdicion ? 'Editar' : 'Agregar'} Empleado</h3>
      <input type="hidden" id="empleadoId" value="${empleado?._id || ''}">
      
      <label for="nombre">Nombre:</label>
      <input type="text" id="nombre" value="${empleado?.nombre || ''}" required>
      
      <label for="cedula">Cédula:</label>
      <input type="text" id="cedula" value="${empleado?.cedula || ''}" required>
      
      <label for="cargo">Cargo:</label>
      <input type="text" id="cargo" value="${empleado?.cargo || ''}" required>
      
      <label for="telefono">Teléfono:</label>
      <input type="text" id="telefono" value="${empleado?.telefono || ''}" required>
      
      <label for="turno">Turno:</label>
      <select id="turno" required>
        <option value="Mañana" ${empleado?.turno === 'Mañana' ? 'selected' : ''}>Mañana</option>
        <option value="Tarde" ${empleado?.turno === 'Tarde' ? 'selected' : ''}>Tarde</option>
        <option value="Noche" ${empleado?.turno === 'Noche' ? 'selected' : ''}>Noche</option>
      </select>
      
      <div class="form-actions">
        <button type="submit" class="btn-guardar">${esEdicion ? 'Actualizar' : 'Guardar'}</button>
        <button type="button" id="btnCancelarEmpleado" class="btn-cancelar">Cancelar</button>
      </div>
    </form>
  `;

  const formEmpleado = document.getElementById('formEmpleado');
  formEmpleado.addEventListener('submit', async (e) => {
    e.preventDefault();
    await guardarEmpleado(formEmpleado, tablaBody, container);
  });

  document.getElementById('btnCancelarEmpleado').addEventListener('click', () => {
    container.innerHTML = '';
  });
}

async function guardarEmpleado(form, tablaBody, formularioContainer) {
  const id = form.empleadoId.value;
  const esEdicion = id !== '';
  const data = {
    nombre: form.nombre.value,
    cedula: form.cedula.value,
    cargo: form.cargo.value,
    telefono: form.telefono.value,
    turno: form.turno.value
  };

  try {
    const response = await fetch(`${API_BASE_URL}/empleados${esEdicion ? `/${id}` : ''}`, {
      method: esEdicion ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Error al guardar: ${errorData.mensaje || response.status}`);
    }
    alert(`Empleado ${esEdicion ? 'actualizado' : 'creado'} con éxito.`);
    formularioContainer.innerHTML = '';
    await listarEmpleados(tablaBody, formularioContainer);
  } catch (error) {
    console.error(error);
    alert(`Error: ${error.message}`);
  }
}

async function eliminarEmpleado(id, tablaBody, formularioContainer) {
  try {
    const response = await fetch(`${API_BASE_URL}/empleados/${id}`, { method: 'DELETE' });
    if (!response.ok) throw new Error('Error al eliminar empleado: ' + response.status);
    alert('Empleado eliminado con éxito.');
    await listarEmpleados(tablaBody, formularioContainer);
  } catch (error) {
    console.error(error);
    alert(error.message);
  }
}