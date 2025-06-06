// Listas globales para almacenar los datos precargados de medicamentos y clientes
let listaDeMedicamentosDisponibles = [];
let listaDeClientesDisponibles = [];

/**
 * Función principal para cargar la vista de ventas en un contenedor dado.
 * Construye la tabla, el botón para agregar venta y precarga los datos necesarios.
 * @param {HTMLElement} contenedor - Elemento donde se renderiza la vista
 */

async function cargarVistaVentas(contenedor) {
  // Renderizado inicial de la estructura HTML básica
  contenedor.innerHTML = `
    <div class="gestion-header">
      <h2>Gestión de Ventas</h2>
      <button id="btnAgregarVenta" class="btn-agregar"><i class="fa fa-cart-arrow-down"></i> Registrar Nueva Venta</button>
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

  // Precarga datos de medicamentos y clientes para el formulario de venta
  await precargarDatosParaVenta();

  // Referencias a elementos del DOM para agregar eventos
  const btnAgregarVenta = document.getElementById("btnAgregarVenta");
  const formularioContainer = document.getElementById(
    "formularioVentaContainer"
  );
  const tablaVentasBody = document.querySelector("#tablaVentas tbody");

  // Evento para mostrar formulario de nueva venta al hacer clic
  btnAgregarVenta.addEventListener("click", () => {
    mostrarFormularioVenta(null, formularioContainer, tablaVentasBody);
  });

  // Carga y muestra las ventas existentes en la tabla
  await listarVentas(tablaVentasBody, formularioContainer);
}

/**
 * Precarga medicamentos y clientes desde la API para usarlos en el formulario de ventas.
 * Actualiza las listas globales correspondientes.
 */
async function precargarDatosParaVenta() {
  try {
    const [medicamentosRes, clientesRes] = await Promise.all([
      fetch(`${API_BASE_URL}/medicamentos`),
      fetch(`${API_BASE_URL}/clientes`),
    ]);

    if (!medicamentosRes.ok || !clientesRes.ok) {
      throw new Error("Error al precargar datos para ventas.");
    }

    listaDeMedicamentosDisponibles = await medicamentosRes.json();
    listaDeClientesDisponibles = await clientesRes.json();
  } catch (error) {
    console.error(error);
    alert(
      "No se pudieron cargar los datos necesarios para registrar ventas (medicamentos/clientes)."
    );
    // Aquí se podría deshabilitar el botón de "Agregar Venta" si es necesario
  }
}

/**
 * Obtiene las ventas desde la API y las lista en el tbody de la tabla.
 * También añade funcionalidad para eliminar cada venta.
 * @param {HTMLElement} tbody - Cuerpo de la tabla donde se mostrarán las ventas
 * @param {HTMLElement} formularioContainer - Contenedor del formulario para recargar
 */

async function listarVentas(tbody, formularioContainer) {
  try {
    const response = await fetch(`${API_BASE_URL}/ventas`);
    if (!response.ok)
      throw new Error("Error al obtener ventas: " + response.status);
    const ventas = await response.json();

    tbody.innerHTML = "";

    // Construcción dinámica de cada fila con los datos de cada venta
    ventas.forEach((venta) => {
      const tr = document.createElement("tr");
      const itemsHtml = venta.items
        .map(
          (item) =>
            `<li>${item.cantidad} x ${item.nombre} ($${item.precio_unitario})</li>`
        )
        .join("");
      tr.innerHTML = `
        <td>${new Date(venta.fecha).toLocaleString()}</td>
        <td>${venta.cliente.nombre}</td>
        <td>${venta.cliente.cedula}</td>
        <td>${venta.total}</td>
        <td>${venta.metodo_pago}</td>
        <td><ul>${itemsHtml}</ul></td>
        <td>
  <button class="btn-editar btn-icon" data-id="${
    venta._id
  }" title="Editar"><i class="fas fa-edit"></i></button>
  <button class="btn-eliminar btn-icon" data-id="${
    venta._id
  }" title="Eliminar"><i class="fas fa-trash"></i></button>
</td>
      `;
      tbody.appendChild(tr);
    });

    // Evento para eliminar venta, con confirmación previa
    tbody.querySelectorAll(".btn-eliminar").forEach((btn) => {
      btn.addEventListener("click", async (e) => {
        const id = e.target.dataset.id;
        if (
          confirm(
            "¿Está seguro de eliminar esta venta? Esta acción no se puede deshacer."
          )
        ) {
          await eliminarVenta(id, tbody, formularioContainer);
        }
      });
    });
  } catch (error) {
    console.error(error);
    tbody.innerHTML = `<tr><td colspan="7">Error al cargar ventas: ${error.message}</td></tr>`;
  }
}

/**
 * Muestra el formulario para registrar una nueva venta.
 * Permite seleccionar cliente, agregar items de medicamentos y método de pago.
 * @param {Object|null} venta - Si se pasa, sería para edición (no implementado)
 * @param {HTMLElement} container - Contenedor donde se renderiza el formulario
 * @param {HTMLElement} tablaBody - Cuerpo de tabla para refrescar lista tras guardado
 */
function mostrarFormularioVenta(venta, container, tablaBody) {
  // La edición no está implementada, sólo creación
  const esEdicion = venta !== null;
  if (esEdicion) {
    alert("La edición de ventas no está implementada en esta versión.");
    return;
  }

  // Construcción de opciones para select de clientes y medicamentos
  const opcionesClientes = listaDeClientesDisponibles
    .map(
      (cli) =>
        `<option value="${cli._id}" data-nombre="${cli.nombre}" data-cedula="${cli.cedula}">${cli.nombre} (${cli.cedula})</option>`
    )
    .join("");

  const opcionesMedicamentos = listaDeMedicamentosDisponibles
    .map(
      (med) =>
        `<option value="${med._id}" data-nombre="${med.nombre}" data-precio="${med.precio}">${med.nombre} ($${med.precio}) - Stock: ${med.stock}</option>`
    )
    .join("");

  // Renderizado del formulario HTML completo
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
        <button type="submit" class="btn-guardar"><i class="fas fa-save" style="margin-right: 6px;"></i>Registrar Venta </button>
        <button type="button" id="btnCancelarVenta" class="btn-cancelar"><i class="fas fa-times-circle" style="margin-right: 6px;"></i>Cancelar Venta</button>
      </div>
    </form>
  `;

  // Referencias a elementos dentro del formulario
  const formVenta = document.getElementById("formVenta");
  const itemsContainer = document.getElementById("itemsContainer");
  const btnAgregarItemVenta = document.getElementById("btnAgregarItemVenta");

  // Evento para agregar un nuevo item medicamento
  btnAgregarItemVenta.addEventListener("click", () =>
    agregarItemAlFormulario(itemsContainer, opcionesMedicamentos)
  );

  // Añadir un item por defecto al mostrar el formulario
  agregarItemAlFormulario(itemsContainer, opcionesMedicamentos);

  // Manejo de envío del formulario para guardar la venta
  formVenta.addEventListener("submit", async (e) => {
    e.preventDefault();
    await guardarVenta(formVenta, tablaBody, container);
  });

  // Botón cancelar limpia el formulario
  document.getElementById("btnCancelarVenta").addEventListener("click", () => {
    container.innerHTML = "";
  });

  // Escuchar cambios para recalcular el total
  itemsContainer.addEventListener("change", () =>
    calcularTotalVenta(itemsContainer)
  );
  itemsContainer.addEventListener("input", () =>
    calcularTotalVenta(itemsContainer)
  ); // Para inputs tipo cantidad
}

/**
 * Agrega un nuevo item de medicamento al formulario con selección y cantidad.
 * @param {HTMLElement} itemsContainer - Contenedor donde se agregan los items
 * @param {string} opcionesMedicamentos - HTML con las opciones del select medicamento
 */
function agregarItemAlFormulario(itemsContainer, opcionesMedicamentos) {
  const itemDiv = document.createElement("div");
  itemDiv.classList.add("item-venta-linea");
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

  // Evento para quitar el item y recalcular total
  itemDiv.querySelector(".btn-remover-item").addEventListener("click", () => {
    itemDiv.remove();
    calcularTotalVenta(itemsContainer);
  });

  // Mostrar precio unitario al seleccionar medicamento y recalcular total
  itemDiv
    .querySelector(".medicamento-select")
    .addEventListener("change", (e) => {
      const optionSeleccionada = e.target.selectedOptions[0] || { dataset: {} };
      const precio = optionSeleccionada.dataset.precio || 0;
      itemDiv.querySelector(".precio-unitario-display").textContent = precio
        ? `Precio unitario: $${precio}`
        : "";
      calcularTotalVenta(itemsContainer);
    });

  // Recalcular al cambiar cantidad
  itemDiv
    .querySelector(".cantidad-medicamento")
    .addEventListener("input", () => calcularTotalVenta(itemsContainer));
}

/**
 * Calcula y actualiza el total de la venta sumando (cantidad * precio) de todos los items.
 * @param {HTMLElement} itemsContainer - Contenedor con todos los items del formulario
 */
function calcularTotalVenta(itemsContainer) {
  let total = 0;
  itemsContainer.querySelectorAll(".item-venta-linea").forEach((itemDiv) => {
    const selectMedicamento = itemDiv.querySelector(".medicamento-select");
    const cantidadInput = itemDiv.querySelector(".cantidad-medicamento");

    const precioUnitario = parseFloat(
      selectMedicamento.selectedOptions[0]?.dataset.precio || 0
    );
    const cantidad = parseInt(cantidadInput.value) || 0;

    if (precioUnitario > 0 && cantidad > 0) {
      total += precioUnitario * cantidad;
    }
  });

  document.getElementById("totalVentaCalculado").textContent = total.toFixed(2);
}

/**
 * Envía los datos del formulario para crear una nueva venta en la API.
 * Tras guardar, actualiza la tabla y limpia el formulario.
 * @param {HTMLFormElement} form - Formulario con los datos de la venta
 * @param {HTMLElement} tablaBody - Cuerpo de la tabla para refrescar la lista
 * @param {HTMLElement} formularioContainer - Contenedor para limpiar formulario
 */
async function guardarVenta(form, tablaBody, formularioContainer) {
  try {
    // Validar que haya al menos un item
    const itemsDivs = form.querySelectorAll(".item-venta-linea");
    if (itemsDivs.length === 0) {
      alert("Debe agregar al menos un medicamento a la venta.");
      return;
    }

    // Construcción del array de items con id, nombre, cantidad, precio_unitario
    const itemsVenta = [];
    for (const itemDiv of itemsDivs) {
      const selectMedicamento = itemDiv.querySelector(".medicamento-select");
      const cantidadInput = itemDiv.querySelector(".cantidad-medicamento");

      if (!selectMedicamento.value) {
        alert("Debe seleccionar un medicamento en todos los items.");
        return;
      }
      const medicamento = listaDeMedicamentosDisponibles.find(
        (med) => med._id === selectMedicamento.value
      );
      if (!medicamento) {
        alert("Medicamento seleccionado no válido.");
        return;
      }
      const cantidad = parseInt(cantidadInput.value);
      if (cantidad <= 0) {
        alert("La cantidad debe ser mayor que cero.");
        return;
      }
      if (cantidad > medicamento.stock) {
        alert(
          `La cantidad de ${medicamento.nombre} supera el stock disponible (${medicamento.stock}).`
        );
        return;
      }

      itemsVenta.push({
        medicamento_id: medicamento._id,
        nombre: medicamento.nombre,
        cantidad,
        precio_unitario: medicamento.precio,
      });
    }

    // Obtener cliente seleccionado y datos para la venta
    const clienteSelect = form.querySelector("#cliente");
    if (!clienteSelect.value) {
      alert("Debe seleccionar un cliente.");
      return;
    }
    const cliente = listaDeClientesDisponibles.find(
      (cli) => cli._id === clienteSelect.value
    );
    if (!cliente) {
      alert("Cliente seleccionado no válido.");
      return;
    }

    // Método de pago
    const metodoPago = form.querySelector("#metodo_pago").value;
    if (!metodoPago) {
      alert("Debe seleccionar un método de pago.");
      return;
    }

    // Calcular total venta
    const totalVenta = itemsVenta.reduce(
      (acc, item) => acc + item.precio_unitario * item.cantidad,
      0
    );

    // Objeto venta a enviar
    const nuevaVenta = {
      fecha: new Date().toISOString(),
      cliente: {
        _id: cliente._id,
        nombre: cliente.nombre,
        cedula: cliente.cedula,
      },
      items: itemsVenta,
      total: totalVenta,
      metodo_pago: metodoPago,
    };

    // Petición POST para crear la venta
    const respuesta = await fetch(`${API_BASE_URL}/ventas`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(nuevaVenta),
    });

    if (!respuesta.ok) {
      throw new Error("Error al registrar la venta: " + respuesta.statusText);
    }

    alert("Venta registrada exitosamente.");

    // Limpiar formulario y ocultarlo
    formularioContainer.innerHTML = "";

    // Actualizar listado de ventas
    await listarVentas(tablaBody, formularioContainer);

    // Actualizar lista medicamentos (stock), recargar datos precargados
    await precargarDatosParaVenta();
  } catch (error) {
    console.error(error);
    alert("Error al guardar venta: " + error.message);
  }
}

/**
 * Elimina una venta dado su ID y actualiza la tabla y formulario.
 * @param {string} id - ID de la venta a eliminar
 * @param {HTMLElement} tablaBody - Cuerpo de la tabla para refrescar
 * @param {HTMLElement} formularioContainer - Contenedor para limpiar formulario
 */
async function eliminarVenta(id, tablaBody, formularioContainer) {
  try {
    const respuesta = await fetch(`${API_BASE_URL}/ventas/${id}`, {
      method: "DELETE",
    });
    if (!respuesta.ok) {
      throw new Error("Error al eliminar venta: " + respuesta.statusText);
    }
    alert("Venta eliminada correctamente.");
    // Recargar tabla y limpiar formulario si está abierto
    await listarVentas(tablaBody, formularioContainer);
    formularioContainer.innerHTML = "";
    await precargarDatosParaVenta();
  } catch (error) {
    console.error(error);
    alert("No se pudo eliminar la venta: " + error.message);
  }
}
