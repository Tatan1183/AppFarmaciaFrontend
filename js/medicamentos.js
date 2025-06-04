async function cargarVistaMedicamentos(contenedor) {
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

  const btnAgregarMedicamento = document.getElementById('btnAgregarMedicamento');
  const formularioContainer = document.getElementById('formularioMedicamentoContainer');
  const tablaMedicamentosBody = document.querySelector('#tablaMedicamentos tbody');

  btnAgregarMedicamento.addEventListener('click', () => {
    mostrarFormularioMedicamento(null, formularioContainer, tablaMedicamentosBody);
  });

  await listarMedicamentos(tablaMedicamentosBody, formularioContainer);
}

async function listarMedicamentos(tbody, formularioContainer) {
  try {
    const response = await fetch(`${API_BASE_URL}/medicamentos`);
    if (!response.ok) throw new Error('Error al obtener medicamentos: ' + response.status);
    const medicamentos = await response.json();

    tbody.innerHTML = ''; // Limpiar tabla
    medicamentos.forEach(medicamento => {
      const tr = document.createElement('tr');
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
          <button class="btn-editar" data-id="${medicamento._id}">Editar</button>
          <button class="btn-eliminar" data-id="${medicamento._id}">Eliminar</button>
        </td>
      `;
      tbody.appendChild(tr);
    });

    // Event listeners para botones de editar y eliminar
    tbody.querySelectorAll('.btn-editar').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const id = e.target.dataset.id;
        const medResponse = await fetch(`${API_BASE_URL}/medicamentos/${id}`);
        if (!medResponse.ok) {
          alert('No se pudo cargar el medicamento para editar.');
          return;
        }
        const medicamentoParaEditar = await medResponse.json();
        mostrarFormularioMedicamento(medicamentoParaEditar, formularioContainer, tbody);
      });
    });

    tbody.querySelectorAll('.btn-eliminar').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const id = e.target.dataset.id;
        if (confirm('¿Está seguro de eliminar este medicamento?')) {
          await eliminarMedicamento(id, tbody, formularioContainer);
        }
      });
    });

  } catch (error) {
    console.error(error);
    tbody.innerHTML = `<tr><td colspan="9">Error al cargar medicamentos: ${error.message}</td></tr>`;
  }
}

function mostrarFormularioMedicamento(medicamento, container, tablaBody) {
  const esEdicion = medicamento !== null;
  const fechaVencimiento = medicamento?.fecha_vencimiento ? medicamento.fecha_vencimiento.split('T')[0] : '';

  container.innerHTML = `
    <form id="formMedicamento" class="form-gestion">
      <h3>${esEdicion ? 'Editar' : 'Agregar'} Medicamento</h3>
      <input type="hidden" id="medicamentoId" value="${medicamento?._id || ''}">
      
      <label for="nombre">Nombre:</label>
      <input type="text" id="nombre" value="${medicamento?.nombre || ''}" required>
      
      <label for="descripcion">Descripción:</label>
      <input type="text" id="descripcion" value="${medicamento?.descripcion || ''}" required>
      
      <label for="categoria">Categoría:</label>
      <input type="text" id="categoria" value="${medicamento?.categoria || ''}" required>
      
      <label for="precio">Precio:</label>
      <input type="number" id="precio" value="${medicamento?.precio || ''}" required step="0.01">
      
      <label for="stock">Stock:</label>
      <input type="number" id="stock" value="${medicamento?.stock || ''}" required>
      
      <label for="laboratorio">Laboratorio:</label>
      <input type="text" id="laboratorio" value="${medicamento?.laboratorio || ''}" required>
      
      <label for="fecha_vencimiento">Fecha Vencimiento:</label>
      <input type="date" id="fecha_vencimiento" value="${fechaVencimiento}" required>
      
      <label for="presentacion">Presentación:</label>
      <input type="text" id="presentacion" value="${medicamento?.presentacion || ''}" required>
      
      <div class="form-actions">
        <button type="submit" class="btn-guardar">${esEdicion ? 'Actualizar' : 'Guardar'}</button>
        <button type="button" id="btnCancelarMedicamento" class="btn-cancelar">Cancelar</button>
      </div>
    </form>
  `;

  const formMedicamento = document.getElementById('formMedicamento');
  formMedicamento.addEventListener('submit', async (e) => {
    e.preventDefault();
    await guardarMedicamento(formMedicamento, tablaBody, container);
  });

  document.getElementById('btnCancelarMedicamento').addEventListener('click', () => {
    container.innerHTML = ''; // Limpiar formulario
  });
}

async function guardarMedicamento(form, tablaBody, formularioContainer) {
  const id = form.medicamentoId.value;
  const esEdicion = id !== '';
  const data = {
    nombre: form.nombre.value,
    descripcion: form.descripcion.value,
    categoria: form.categoria.value,
    precio: parseFloat(form.precio.value),
    stock: parseInt(form.stock.value),
    laboratorio: form.laboratorio.value,
    fecha_vencimiento: form.fecha_vencimiento.value, // Ya está en formato YYYY-MM-DD
    presentacion: form.presentacion.value
  };

  try {
    const response = await fetch(`${API_BASE_URL}/medicamentos${esEdicion ? `/${id}` : ''}`, {
      method: esEdicion ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Error al guardar: ${errorData.mensaje || response.status}`);
    }
    
    alert(`Medicamento ${esEdicion ? 'actualizado' : 'creado'} con éxito.`);
    formularioContainer.innerHTML = ''; // Limpiar formulario
    await listarMedicamentos(tablaBody, formularioContainer); // Recargar lista
  } catch (error) {
    console.error(error);
    alert(`Error: ${error.message}`);
  }
}

async function eliminarMedicamento(id, tablaBody, formularioContainer) {
  try {
    const response = await fetch(`${API_BASE_URL}/medicamentos/${id}`, { method: 'DELETE' });
    if (!response.ok) throw new Error('Error al eliminar medicamento: ' + response.status);
    
    alert('Medicamento eliminado con éxito.');
    await listarMedicamentos(tablaBody, formularioContainer); // Recargar lista
  } catch (error) {
    console.error(error);
    alert(error.message);
  }
}