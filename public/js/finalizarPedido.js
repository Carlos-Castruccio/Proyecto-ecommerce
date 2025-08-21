// public/js/finalizarPedido.js
import { db, auth } from "./firebase.js";
import {
  addDoc, collection, serverTimestamp
} from "https://www.gstatic.com/firebasejs/11.9.1/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-auth.js";

// DOM (coincide con tu finalizar.html)
const form = document.getElementById("form-finalizar");
const nombreEl = document.getElementById("nombre");
const apellidoEl = document.getElementById("apellido");
const emailEl = document.getElementById("email");
const direccionEl = document.getElementById("direccion");
const telefonoEl = document.getElementById("telefono");
const pagoEl = document.getElementById("pago");
const okBox = document.getElementById("mensaje-confirmacion");

// Completar email del usuario logueado
onAuthStateChanged(auth, (user) => {
  if (!user) {
    alert("Debés iniciar sesión para finalizar la compra.");
    window.location.href = "../../index.html";
    return;
  }
  emailEl.value = user.email || "";
});

function leerCarrito() {
  try {
    const arr = JSON.parse(localStorage.getItem("carrito") || "[]");
    if (!Array.isArray(arr)) return [];
    return arr.map(p => ({
      id: String(p.id),
      nombre: String(p.nombre || ""),
      precio: Number(p.precio) || 0,
      cantidad: Number(p.cantidad) || 1,
      categoria: p.categoria || null,
      subtotal: (Number(p.precio) || 0) * (Number(p.cantidad) || 1),
    }));
  } catch {
    return [];
  }
}

form?.addEventListener("submit", async (e) => {
  e.preventDefault();

  const btn = form.querySelector('button[type="submit"]');
  if (btn) { btn.disabled = true; btn.textContent = "Guardando..."; }

  try {
    const user = auth.currentUser;
    if (!user) throw new Error("NO_AUTH");

    // Validaciones simples
    if (!nombreEl.value.trim() || !apellidoEl.value.trim()) throw new Error("FALTAN_DATOS");
    if (!direccionEl.value.trim() || !telefonoEl.value.trim()) throw new Error("FALTAN_DATOS");
    if (!pagoEl.value) throw new Error("SIN_PAGO");

    const items = leerCarrito();
    if (!items.length) throw new Error("CARRITO_VACIO");

    const total = items.reduce((s, i) => s + i.subtotal, 0);

    const pedido = {
      uid: user.uid,
      email: user.email || "",
      nombre: nombreEl.value.trim(),
      apellido: apellidoEl.value.trim(),
      direccion: direccionEl.value.trim(),
      telefono: telefonoEl.value.trim(),
      pago: pagoEl.value,
      items,
      total,
      estado: "pendiente",
      creadoEn: serverTimestamp(),
    };

    await addDoc(collection(db, "pedidos"), pedido);

    // éxito
    localStorage.removeItem("carrito");
    okBox?.classList.remove("d-none");
    setTimeout(() => (window.location.href = "./misPedidos.html"), 1200);
  } catch (err) {
    console.error("[finalizarPedido] Error al guardar:", err);
    alert("Hubo un error al procesar tu pedido. Intentalo nuevamente.");
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = "Confirmar Pedido"; }
  }
});
