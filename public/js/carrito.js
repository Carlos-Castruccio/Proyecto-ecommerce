// public/js/carrito.js

// --- Estado inicial del carrito (normalizado) ---
let carrito = JSON.parse(localStorage.getItem("carrito")) || [];
carrito = carrito.map((p) => ({
  ...p,
  precio: Number(p.precio) || 0,
  cantidad: Number(p.cantidad) || 1,
  categoria: (p.categoria ?? p.categoría ?? "Otros").toString().trim() || "Otros",
}));

// --- Orden deseado de categorías ---
const ORDEN_CATEGORIAS = ["Camperas", "Cascos", "Antiparras", "Guantes", "Botas"];
const _ordenMap = new Map(ORDEN_CATEGORIAS.map((c, i) => [c.toLowerCase(), i]));

function normalizarProducto(producto) {
  const catRaw = producto.categoria ?? producto.categoría ?? "Otros";
  const categoria = typeof catRaw === "string" ? (catRaw.trim() || "Otros") : "Otros";
  return {
    ...producto,
    categoria,
    precio: Number(producto.precio) || 0,
  };
}

// --- API pública ---
export function agregarAlCarrito(producto) {
  const existe = carrito.find((p) => p.id === producto.id);
  if (existe) {
    existe.cantidad = Number(existe.cantidad) + 1;
  } else {
    const prod = normalizarProducto(producto);
    carrito.push({ ...prod, cantidad: 1 });
  }
  guardarCarrito();
  actualizarCarritoUI();
}

export function actualizarCarritoUI() {
  const lista = document.getElementById("carrito-items");
  const total = document.getElementById("carrito-total");
  const cantidad = document.getElementById("carrito-cantidad");
  if (!lista || !total || !cantidad) return;

  lista.innerHTML = "";

  if (carrito.length === 0) {
    lista.innerHTML = "<li class='list-group-item'>El carrito está vacío.</li>";
    total.textContent = "0";
    cantidad.textContent = "0";
    return;
  }

  let totalPrecio = 0;
  let totalCantidad = 0;

  // Ordenar por categoría (según ORDEN_CATEGORIAS) y por nombre
  const itemsOrdenados = [...carrito].sort((a, b) => {
    const ai = _ordenMap.get((a.categoria || "otros").toLowerCase()) ?? 999;
    const bi = _ordenMap.get((b.categoria || "otros").toLowerCase()) ?? 999;
    if (ai !== bi) return ai - bi;
    return String(a.nombre).localeCompare(String(b.nombre));
  });

  // Encabezados por categoría
  let categoriaActualKey = null;

  itemsOrdenados.forEach((p) => {
    const precio = Number(p.precio) || 0;
    const cant = Number(p.cantidad) || 0;
    const sub = precio * cant;

    const catKey = (p.categoria || "Otros").toLowerCase();
    if (catKey !== categoriaActualKey) {
      categoriaActualKey = catKey;
      const header = document.createElement("li");
      header.className = "list-group-item bg-light fw-semibold";
      header.textContent = p.categoria || "Otros";
      lista.appendChild(header);
    }

    const li = document.createElement("li");
    li.classList.add("list-group-item");

    li.innerHTML = `
      <div class="d-flex align-items-center w-100">
        <!-- Detalle del producto (izquierda) -->
        <div class="flex-grow-1 me-3">
          <strong>${p.nombre}</strong><br>
          <small>Precio: $${precio} x ${cant} = $${sub}</small>
        </div>

        <!-- Controles (derecha, alineados) -->
        <div class="ms-auto d-flex align-items-center"
            style="min-width: 220px; justify-content: flex-end; gap: .5rem;">
          <div class="btn-group" role="group" aria-label="Cantidad">
            <button class="btn btn-sm btn-outline-secondary btn-menos" data-id="${p.id}">−</button>
            <span class="btn btn-sm btn-outline-secondary px-3 text-dark fw-semibold"
                  style="pointer-events:none; min-width:42px; text-align:center; opacity:1;">
              ${cant}
            </span>
            <button class="btn btn-sm btn-outline-secondary btn-mas" data-id="${p.id}">+</button>
          </div>
          <button class="btn btn-sm btn-outline-danger btn-eliminar" data-id="${p.id}">✕</button>
        </div>
      </div>
    `;

    lista.appendChild(li);
    totalPrecio += sub;
    totalCantidad += cant;
  });

  total.textContent = String(totalPrecio);
  cantidad.textContent = String(totalCantidad);
}

export function manejarEventosCarrito(e) {
  const id = e.target.dataset.id;
  const item = carrito.find((p) => p.id === id);
  if (!item) return;

  if (e.target.classList.contains("btn-mas")) item.cantidad = Number(item.cantidad) + 1;
  if (e.target.classList.contains("btn-menos"))
    item.cantidad = Math.max(1, Number(item.cantidad) - 1);
  if (e.target.classList.contains("btn-eliminar"))
    carrito = carrito.filter((p) => p.id !== id);

  guardarCarrito();
  actualizarCarritoUI();
}

export function vaciarCarrito() {
  carrito = [];
  guardarCarrito();
  actualizarCarritoUI();
}

// --- Persistencia ---
function guardarCarrito() {
  localStorage.setItem("carrito", JSON.stringify(carrito));
}
