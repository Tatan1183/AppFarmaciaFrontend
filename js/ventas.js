let listaDeMedicamentosDisponibles = [];
let listaDeClientesDisponibles = [];

async function cargarVistaVentas(contenedor) {
  contenedor.innerHTML = `
    <div class="gestion-header">
      <h2>Gestión de Ventas</h2>
      <button id="btnAgregarVenta" class="btn-agregar">Registrar Nueva Venta</button>
    </div>
    <div id="formularioVentaContainer"></div>
    <table id="tablaVentas">
      <thead>
        <tr>
          <th>Fecha</th>
          <th>Cliente</th>
          <th>Cédula Cliente</th>
          <th>Total</th>
          <th>Método Pago</th>
          <th>Items</th>
          <th>Acciones</th>
        </tr>
      </thead>
      <tbody>
        <!-- Los datos se cargarán aquí -->
      </tbody>
    </table>
  `;

  // Precargar medicamentos y clientes para el formulario de nueva venta
  await precargarDatosParaVenta();


  const btnAgregarVenta = document.getElementById('btnAgregarVenta');
  const formularioContainer = document.getElementById('formularioVentaContainer');
  const tablaVentasBody = document.querySelector('#tablaVentas tbody');

  btnAgregarVenta.addEventListener('click', () => {
    mostrarFormularioVenta(null, formularioContainer, tablaVentasBody);
  });

  await listarVentas(tablaVentasBody, formularioContainer);
}

async function precargarDatosParaVenta() {
  try {
    const [medicamentosRes, clientesRes] = await Promise.all([
      fetch(`${API_BASE_URL}/medicamentos`),
      fetch(`${API_BASE_URL}/clientes`)
    ]);

    if (!medicamentosRes.ok || !clientesRes.ok) {
      throw new Error('Error al precargar datos para ventas.');
    }
    
    listaDeMedicamentosDisponibles = await medicamentosRes.json();
    listaDeClientesDisponibles = await clientesRes.json();

  } catch (error) {
    console.error(error);
    alert('No se pudieron cargar los datos necesarios para registrar ventas (medicamentos/clientes).');
    // Podrías deshabilitar el botón de "Agregar Venta" aquí si es crítico
  }
}


async function listarVentas(tbody, formularioContainer) {
  try {
    const response = await fetch(`${API_BASE_URL}/ventas`);
    if (!response.ok) throw new Error('Error al obtener ventas: ' + response.status);
    const ventas = await response.json();

    tbody.innerHTML = '';
    ventas.forEach(venta => {
      const tr = document.createElement('tr');
      const itemsHtml = venta.items.map(item => `<li>${item.cantidad} x ${item.nombre} ($${item.precio_unitario})</li>`).join('');
      tr.innerHTML = `
        <td>${new Date(venta.fecha).toLocaleString()}</td>
        <td>${venta.cliente.nombre}</td>
        <td>${venta.cliente.cedula}</td>
        <td>${venta.total}</td>
        <td>${venta.metodo_pago}</td>
        <td><ul>${itemsHtml}</ul></td>
        <td>
          <!-- <button class="btn-editar" data-id="${venta._id}">Editar</button> Podría ser complejo -->
          <button class="btn-eliminar" data-id="${venta._id}">Eliminar</button>
        </td>
      `;
      tbody.appendChild(tr);
    });
    
    // No implementaremos edición de ventas por simplicidad aquí, pero el botón de eliminar sí.
    tbody.querySelectorAll('.btn-eliminar').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const id = e.target.dataset.id;
        if (confirm('¿Está seguro de eliminar esta venta? Esta acción no se puede deshacer.')) {
          await eliminarVenta(id, tbody, formularioContainer);
        }
      });
    });

  } catch (error) {
    console.error(error);
    tbody.innerHTML = `<tr><td colspan="7">Error al cargar ventas: ${error.message}</td></tr>`;
  }
}

function mostrarFormularioVenta(venta, container, tablaBody) {
  // La edición de ventas es compleja, nos enfocaremos en crear nuevas ventas.
  const esEdicion = venta !== null;
  if (esEdicion) {
    alert("La edición de ventas no está implementada en esta versión.");
    return;
  }

  // Opciones para select de clientes
  const opcionesClientes = listaDeClientesDisponibles.map(cli => 
    `<option value="${cli._id}" data-nombre="${cli.nombre}" data-cedula="${cli.cedula}">${cli.nombre} (${cli.cedula})</option>`
  ).join('');

  // Opciones para select de medicamentos
  const opcionesMedicamentos = listaDeMedicamentosDisponibles.map(med => 
    `<option value="${med._id}" data-nombre="${med.nombre}" data-precio="${med.precio}">${med.nombre} ($${med.precio}) - Stock: ${med.stock}</option>`
  ).join('');
  
  container.innerHTML = `
    <form id="formVenta" class="form-gestion">
      <h3>Registrar Nueva Venta</h3>
      
      <label for="cliente">Cliente:</label>
      <select id="cliente" required>
        <option value="">Seleccione un cliente...</option>
        ${opcionesClientes}
      </select>
      
      <fieldset id="itemsVentaFieldset">
        <legend>Items de la Venta</legend>
        <div id="itemsContainer">
          <!-- Aquí se agregarán los items dinámicamente -->
        </div>
        <button type="button" id="btnAgregarItemVenta" class="btn-accion-secundaria">Agregar Medicamento</button>
      </fieldset>
      
      <label for="metodo_pago">Método de Pago:</label>
      <select id="metodo_pago" required>
        <option value="Efectivo">Efectivo</option>
        <option value="Tarjeta">Tarjeta</option>
        <option value="Transferencia">Transferencia</option>
      </select>

      <p><strong>Total Venta: $<span id="totalVentaCalculado">0.00</span></strong></p>
      
      <div class="form-actions">
        <button type="submit" class="btn-guardar">Registrar Venta</button>
        <button type="button" id="btnCancelarVenta" class="btn-cancelar">Cancelar</button>
      </div>
    </form>
  `;
  
  const formVenta = document.getElementById('formVenta');
  const itemsContainer = document.getElementById('itemsContainer');
  const btnAgregarItemVenta = document.getElementById('btnAgregarItemVenta');

  btnAgregarItemVenta.addEventListener('click', () => agregarItemAlFormulario(itemsContainer, opcionesMedicamentos));
  
  // Agregar un item por defecto al cargar el formulario
  agregarItemAlFormulario(itemsContainer, opcionesMedicamentos);

  formVenta.addEventListener('submit', async (e) => {
    e.preventDefault();
    await guardarVenta(formVenta, tablaBody, container);
  });

  document.getElementById('btnCancelarVenta').addEventListener('click', () => {
    container.innerHTML = '';
  });

  // Escuchar cambios en items para recalcular total
  itemsContainer.addEventListener('change', () => calcularTotalVenta(itemsContainer));
  itemsContainer.addEventListener('input', () => calcularTotalVenta(itemsContainer)); // Para input de cantidad
}

function agregarItemAlFormulario(itemsContainer, opcionesMedicamentos) {
  const itemDiv = document.createElement('div');
  itemDiv.classList.add('item-venta-linea');
  itemDiv.innerHTML = `
    <select class="medicamento-select" required>
      <option value="">Seleccione medicamento...</option>
      ${opcionesMedicamentos}
    </select>
    <input type="number" class="cantidad-medicamento" placeholder="Cant." min="1" value="1" required>
    <span class="precio-unitario-display"></span>
    <button type="button" class="btn-remover-item btn-accion-peligro">Quitar</button>
  `;
  itemsContainer.appendChild(itemDiv);

  itemDiv.querySelector('.btn-remover-item').addEventListener('click', () => {
    itemDiv.remove();
    calcularTotalVenta(itemsContainer);
  });

  itemDiv.querySelector('.medicamento-select').addEventListener('change', (e) => {
    const selectedOption = e.target.options[e.target.selectedIndex];
    const precio = selectedOption.dataset.precio;
    const displayPrecio = itemDiv.querySelector('.precio-unitario-display');
    if (precio) {
        displayPrecio.textContent = `P.U: $${parseFloat(precio).toFixed(2)}`;
    } else {
        displayPrecio.textContent = '';
    }
    calcularTotalVenta(itemsContainer);
  });

  calcularTotalVenta(itemsContainer); // Recalcular si se añade
}

function calcularTotalVenta(itemsContainer) {
  let totalGeneral = 0;
  itemsContainer.querySelectorAll('.item-venta-linea').forEach(itemDiv => {
    const selectMedicamento = itemDiv.querySelector('.medicamento-select');
    const cantidadInput = itemDiv.querySelector('.cantidad-medicamento');
    
    const selectedOption = selectMedicamento.options[selectMedicamento.selectedIndex];
    const precioUnitario = parseFloat(selectedOption.dataset.precio);
    const cantidad = parseInt(cantidadInput.value);

    if (selectedOption.value && !isNaN(precioUnitario) && !isNaN(cantidad) && cantidad > 0) {
      totalGeneral += precioUnitario * cantidad;
    }
  });
  document.getElementById('totalVentaCalculado').textContent = totalGeneral.toFixed(2);
}


async function guardarVenta(form, tablaBody, formularioContainer) {
  const clienteSelect = form.cliente;
  const selectedClienteOption = clienteSelect.options[clienteSelect.selectedIndex];

  if (!selectedClienteOption.value) {
    alert('Por favor, seleccione un cliente.');
    return;
  }
  
  const itemsData = [];
  const itemsRows = form.querySelectorAll('#itemsContainer .item-venta-linea');
  
  let stockSuficiente = true;
  let hayItems = false;

  itemsRows.forEach(row => {
    hayItems = true;
    const medicamentoSelect = row.querySelector('.medicamento-select');
    const cantidadInput = row.querySelector('.cantidad-medicamento');
    const selectedMedOption = medicamentoSelect.options[medicamentoSelect.selectedIndex];
    
    if (!selectedMedOption.value) {
        alert('Un item no tiene medicamento seleccionado.');
        stockSuficiente = false; // Usamos esta variable para detener el proceso
        return;
    }

    const medicamentoId = selectedMedOption.value;
    const medicamento = listaDeMedicamentosDisponibles.find(m => m._id === medicamentoId);
    const cantidad = parseInt(cantidadInput.value);

    if (!medicamento || isNaN(cantidad) || cantidad <= 0) {
        alert('Datos de item inválidos.');
        stockSuficiente = false;
        return;
    }

    if (medicamento.stock < cantidad) {
      alert(`Stock insuficiente para ${medicamento.nombre}. Disponible: ${medicamento.stock}, Solicitado: ${cantidad}`);
      stockSuficiente = false;
      return; // Salir del forEach si hay error
    }

    itemsData.push({
      nombre: medicamento.nombre, // Almacenamos nombre directamente como en tu schema
      cantidad: cantidad,
      precio_unitario: medicamento.precio 
    });
  });

  if (!stockSuficiente) return; // Si hubo error de stock o item inválido, no continuar

  if (!hayItems || itemsData.length === 0) {
    alert('Debe agregar al menos un medicamento a la venta.');
    return;
  }

  const totalVenta = parseFloat(document.getElementById('totalVentaCalculado').textContent);

  const ventaData = {
    fecha: new Date().toISOString(), // Fecha actual en formato ISO
    cliente: {
      nombre: selectedClienteOption.dataset.nombre,
      cedula: selectedClienteOption.dataset.cedula
    },
    items: itemsData,
    total: totalVenta,
    metodo_pago: form.metodo_pago.value
  };

  try {
    // Primero, intentamos registrar la venta
    const response = await fetch(`${API_BASE_URL}/ventas`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(ventaData)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Error al registrar la venta: ${errorData.mensaje || response.status}`);
    }
    
    // Si la venta se registra con éxito, actualizamos el stock de los medicamentos
    // Esto debería ser una transacción en el backend idealmente, pero aquí lo hacemos secuencial.
    for (const item of itemsData) {
        const medicamentoOriginal = listaDeMedicamentosDisponibles.find(m => m.nombre === item.nombre); // Buscamos por nombre
        if (medicamentoOriginal) {
            const nuevoStock = medicamentoOriginal.stock - item.cantidad;
            await fetch(`${API_BASE_URL}/medicamentos/${medicamentoOriginal._id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ stock: nuevoStock }) // Solo actualizamos el stock
            });
        }
    }
    
    alert('Venta registrada con éxito. Stock actualizado.');
    formularioContainer.innerHTML = '';
    await precargarDatosParaVenta(); // Recargar datos por si el stock cambió
    await listarVentas(tablaBody, formularioContainer);

  } catch (error) {
    console.error(error);
    alert(`Error: ${error.message}`);
  }
}

async function eliminarVenta(id, tablaBody, formularioContainer) {
  // IMPORTANTE: Eliminar una venta NO revierte el stock en esta implementación.
  // Para ello, necesitarías una lógica más compleja en el backend o aquí.
  try {
    const response = await fetch(`${API_BASE_URL}/ventas/${id}`, { method: 'DELETE' });
    if (!response.ok) throw new Error('Error al eliminar venta: ' + response.status);
    
    alert('Venta eliminada con éxito. (Nota: El stock de medicamentos no se ha revertido).');
    await listarVentas(tablaBody, formularioContainer);
  } catch (error) {
    console.error(error);
    alert(error.message);
  }
}