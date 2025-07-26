import { cargarProductos } from "./js/productos.js";
import {
  agregarAlCarrito,
  actualizarCarritoUI,
  manejarEventosCarrito,
  vaciarCarrito
} from "./js/carrito.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-auth.js";
import { auth } from './js/firebase.js';
import {loginCheck} from './js/loginCheck.js';
import './js/signupForm.js';
import './js/signinForm.js';
import'./js/logout.js';


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
  const cantidad = document.getElementById("carrito-cantidad").textContent;

  if (cantidad !== "0") {
    // Redirigir a formulario de finalización de compra
    window.location.href = "./page/finalizar.html";
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

onAuthStateChanged(auth, async (user) => {
  if (user) {
    loginCheck(user);
    const token = await user.getIdTokenResult();
    console.log("fXzeIfAPoAfSyQXXSrXedvyRJOd2:", user.uid);
    console.log("¿Es admin?", token.claims.admin);
  }else{
    loginCheck(null)
  }
});