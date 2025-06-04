async function cargarVistaClientes(contenedor) {
  contenedor.innerHTML = `
    <div class="gestion-header">
      <h2>Gestión de Clientes</h2>
      <button id="btnAgregarCliente" class="btn-agregar">Agregar Cliente</button>
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

  const btnAgregarCliente = document.getElementById('btnAgregarCliente');
  const formularioContainer = document.getElementById('formularioClienteContainer');
  const tablaClientesBody = document.querySelector('#tablaClientes tbody');

  btnAgregarCliente.addEventListener('click', () => {
    mostrarFormularioCliente(null, formularioContainer, tablaClientesBody);
  });

  await listarClientes(tablaClientesBody, formularioContainer);
}

async function listarClientes(tbody, formularioContainer) {
  try {
    const response = await fetch(`${API_BASE_URL}/clientes`);
    if (!response.ok) throw new Error('Error al obtener clientes: ' + response.status);
    const clientes = await response.json();

    tbody.innerHTML = ''; 
    clientes.forEach(cliente => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${cliente.nombre}</td>
        <td>${cliente.cedula}</td>
        <td>${cliente.telefono}</td>
        <td>${cliente.direccion}</td>
        <td>${cliente.correo}</td>
        <td>
          <button class="btn-editar" data-id="${cliente._id}">Editar</button>
          <button class="btn-eliminar" data-id="${cliente._id}">Eliminar</button>
        </td>
      `;
      tbody.appendChild(tr);
    });

    tbody.querySelectorAll('.btn-editar').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const id = e.target.dataset.id;
        const cliResponse = await fetch(`${API_BASE_URL}/clientes/${id}`);
        if (!cliResponse.ok) {
          alert('No se pudo cargar el cliente para editar.');
          return;
        }
        const clienteParaEditar = await cliResponse.json();
        mostrarFormularioCliente(clienteParaEditar, formularioContainer, tbody);
      });
    });

    tbody.querySelectorAll('.btn-eliminar').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const id = e.target.dataset.id;
        if (confirm('¿Está seguro de eliminar este cliente?')) {
          await eliminarCliente(id, tbody, formularioContainer);
        }
      });
    });

  } catch (error) {
    console.error(error);
    tbody.innerHTML = `<tr><td colspan="6">Error al cargar clientes: ${error.message}</td></tr>`;
  }
}

function mostrarFormularioCliente(cliente, container, tablaBody) {
  const esEdicion = cliente !== null;
  container.innerHTML = `
    <form id="formCliente" class="form-gestion">
      <h3>${esEdicion ? 'Editar' : 'Agregar'} Cliente</h3>
      <input type="hidden" id="clienteId" value="${cliente?._id || ''}">
      
      <label for="nombre">Nombre:</label>
      <input type="text" id="nombre" value="${cliente?.nombre || ''}" required>
      
      <label for="cedula">Cédula:</label>
      <input type="text" id="cedula" value="${cliente?.cedula || ''}" required>
      
      <label for="telefono">Teléfono:</label>
      <input type="text" id="telefono" value="${cliente?.telefono || ''}" required>
      
      <label for="direccion">Dirección:</label>
      <input type="text" id="direccion" value="${cliente?.direccion || ''}" required>
      
      <label for="correo">Correo:</label>
      <input type="email" id="correo" value="${cliente?.correo || ''}" required>
      
      <div class="form-actions">
        <button type="submit" class="btn-guardar">${esEdicion ? 'Actualizar' : 'Guardar'}</button>
        <button type="button" id="btnCancelarCliente" class="btn-cancelar">Cancelar</button>
      </div>
    </form>
  `;

  const formCliente = document.getElementById('formCliente');
  formCliente.addEventListener('submit', async (e) => {
    e.preventDefault();
    await guardarCliente(formCliente, tablaBody, container);
  });

  document.getElementById('btnCancelarCliente').addEventListener('click', () => {
    container.innerHTML = '';
  });
}

async function guardarCliente(form, tablaBody, formularioContainer) {
  const id = form.clienteId.value;
  const esEdicion = id !== '';
  const data = {
    nombre: form.nombre.value,
    cedula: form.cedula.value,
    telefono: form.telefono.value,
    direccion: form.direccion.value,
    correo: form.correo.value
  };

  try {
    const response = await fetch(`${API_BASE_URL}/clientes${esEdicion ? `/${id}` : ''}`, {
      method: esEdicion ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Error al guardar: ${errorData.mensaje || response.status}`);
    }
    alert(`Cliente ${esEdicion ? 'actualizado' : 'creado'} con éxito.`);
    formularioContainer.innerHTML = '';
    await listarClientes(tablaBody, formularioContainer);
  } catch (error) {
    console.error(error);
    alert(`Error: ${error.message}`);
  }
}

async function eliminarCliente(id, tablaBody, formularioContainer) {
  try {
    const response = await fetch(`${API_BASE_URL}/clientes/${id}`, { method: 'DELETE' });
    if (!response.ok) throw new Error('Error al eliminar cliente: ' + response.status);
    alert('Cliente eliminado con éxito.');
    await listarClientes(tablaBody, formularioContainer);
  } catch (error) {
    console.error(error);
    alert(error.message);
  }
}