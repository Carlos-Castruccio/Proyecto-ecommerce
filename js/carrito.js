let carrito = JSON.parse(localStorage.getItem("carrito")) || [];

export function agregarAlCarrito(producto) {
  const existe = carrito.find(p => p.id === producto.id);
  if (existe) {
    existe.cantidad++;
  } else {
    carrito.push({ ...producto, cantidad: 1 });
  }
  guardarCarrito();
  actualizarCarritoUI();
}

export function actualizarCarritoUI() {
  const lista = document.getElementById("carrito-items");
  const total = document.getElementById("carrito-total");
  const cantidad = document.getElementById("carrito-cantidad");

  lista.innerHTML = "";

  if (carrito.length === 0) {
    lista.innerHTML = "<li>El carrito está vacío.</li>";
    total.textContent = "0";
    cantidad.textContent = "0";
    return;
  }

  let totalPrecio = 0;
  let totalCantidad = 0;

  carrito.forEach(p => {
    const li = document.createElement("li");

    li.innerHTML = `
      <div class="detalle-producto">
        <span class="carrito-nombre">${p.nombre}</span>
        <span class="carrito-cantidad">Cantidad: ${p.cantidad}</span>
        <span class="carrito-subtotal">Subtotal: $${p.precio * p.cantidad}</span>
      </div>
      <div class="carrito-botones">
        <button class="btn-menos" data-id="${p.id}">-</button>
        <button class="btn-mas" data-id="${p.id}">+</button>
        <button class="btn-eliminar" data-id="${p.id}">Eliminar</button>
      </div>
    `;

    lista.appendChild(li);
    totalPrecio += p.precio * p.cantidad;
    totalCantidad += p.cantidad;
  });

  total.textContent = totalPrecio;
  cantidad.textContent = totalCantidad;
}

export function manejarEventosCarrito(e) {
  const id = parseInt(e.target.dataset.id);
  const item = carrito.find(p => p.id === id);

  if (e.target.classList.contains("btn-mas")) {
    item.cantidad++;
  }

  if (e.target.classList.contains("btn-menos")) {
    if (item.cantidad > 1) item.cantidad--;
  }

  if (e.target.classList.contains("btn-eliminar")) {
    carrito = carrito.filter(p => p.id !== id);
  }

  guardarCarrito();
  actualizarCarritoUI();
}

export function vaciarCarrito() {
  carrito = [];
  guardarCarrito();
  actualizarCarritoUI();
}

function guardarCarrito() {
  localStorage.setItem("carrito", JSON.stringify(carrito));
}
