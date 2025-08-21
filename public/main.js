import {
  actualizarCarritoUI,
  manejarEventosCarrito,
  vaciarCarrito
} from "./js/carrito.js";

import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-auth.js";
import { auth } from './js/firebase.js';
import { loginCheck } from './js/loginCheck.js';

import './js/signupForm.js';
import './js/signinForm.js';
import './js/logout.js';
import './js/mostrarMensaje.js';
import './js/productos.js';

document.addEventListener("DOMContentLoaded", () => {
  actualizarCarritoUI();

  const carritoItems = document.getElementById("carrito-items");
  const vaciarBtn = document.getElementById("vaciar-carrito");
  const comprarBtn = document.getElementById("comprar");
  const modal = document.getElementById("modal-compra");
  const cerrarModal = document.getElementById("cerrar-modal");

  if (carritoItems) carritoItems.addEventListener("click", manejarEventosCarrito);
  if (vaciarBtn) vaciarBtn.addEventListener("click", vaciarCarrito);

  if (comprarBtn) {
    comprarBtn.addEventListener("click", () => {
      const cantidad = document.getElementById("carrito-cantidad").textContent;
      if (cantidad !== "0") {
        window.location.href = "public/page/finalizar.html";
      } else {
        alert("El carrito está vacío.");
      }
    });
  }

  if (cerrarModal) {
    cerrarModal.addEventListener("click", () => {
      modal.style.display = "none";
    });
  }

  window.addEventListener("click", (event) => {
    if (event.target === modal) {
      modal.style.display = "none";
    }
  });
});

// Escucha de autenticación
onAuthStateChanged(auth, async (user) => {
  await loginCheck(user);
  if (user) {
    console.log("Usuario logueado:", user.email);
  } else {
    console.log("No hay usuario logueado");
  }
});

