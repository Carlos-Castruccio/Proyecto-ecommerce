import { cargarProductos } from "./productos.js";
import {
  agregarAlCarrito,
  actualizarCarritoUI,
  manejarEventosCarrito,
  vaciarCarrito
} from "./carrito.js";

document.addEventListener("DOMContentLoaded", async () => {
  await cargarProductos();
  actualizarCarritoUI();

  const productosContainer = document.getElementById("productos-container");
  const carritoItems = document.getElementById("carrito-items");
  const vaciarBtn = document.getElementById("vaciar-carrito");
  const comprarBtn = document.getElementById("comprar");
  const modal = document.getElementById("modal-compra");
  const cerrarModal = document.getElementById("cerrar-modal");

  productosContainer.addEventListener("click", async (e) => {
    if (e.target.classList.contains("btn-agregar")) {
      const id = parseInt(e.target.dataset.id);
      try {
        const respuesta = await fetch("data/productos.json");
        const productos = await respuesta.json();
        const producto = productos.find(p => p.id === id);
        if (producto) agregarAlCarrito(producto);
      } catch (error) {
        console.error("Error al agregar al carrito:", error);
      }
    }
  });

  carritoItems.addEventListener("click", manejarEventosCarrito);
  vaciarBtn.addEventListener("click", vaciarCarrito);

  comprarBtn.addEventListener("click", () => {
    if (document.getElementById("carrito-cantidad").textContent !== "0") {
      modal.style.display = "block";
      vaciarCarrito();
    } else {
      alert("El carrito está vacío.");
    }
  });

  cerrarModal.addEventListener("click", () => {
    modal.style.display = "none";
  });

  window.addEventListener("click", (event) => {
    if (event.target === modal) {
      modal.style.display = "none";
    }
  });
});
