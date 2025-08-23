// public/js/finalizarPedido.js
import { db, auth } from "./firebase.js";
import { addDoc, collection, serverTimestamp } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-auth.js";

// Helpers de selección robusta
const $ = (sel) => document.querySelector(sel);
const pick = (...sels) => sels.map($).find(Boolean);
const val = (el) => (el?.value ?? "").trim();

const form       = $("#form-finalizar");
const nombreEl   = pick("#nombre","[name='nombre']","#Nombre","#firstName");
const apellidoEl = pick("#apellido","[name='apellido']","#Apellido","#lastName");
const emailEl    = pick("#email","[name='email']","#correo","#correoElectronico");
const direccionEl= pick("#direccion","[name='direccion']","#address");
const telefonoEl = pick("#telefono","[name='telefono']","#phone");
const pagoEl     = pick("#pago","[name='pago']","#metodoPago");
const okBox      = $("#mensaje-confirmacion");

// Autocompletar email del usuario logueado
onAuthStateChanged(auth, (user) => {
  if (!user) {
    alert("Debés iniciar sesión para finalizar la compra.");
    location.href = "../../index.html";
    return;
  }
  if (emailEl && !val(emailEl)) emailEl.value = user.email || "";
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
      subtotal: (Number(p.precio)||0) * (Number(p.cantidad)||1),
    }));
  } catch { return []; }
}

form?.addEventListener("submit", async (e) => {
  e.preventDefault();
  const btn = form.querySelector("button[type='submit']");
  if (btn) { btn.disabled = true; btn.textContent = "Guardando..."; }

  try {
    const user = auth.currentUser;
    if (!user) throw new Error("NO_AUTH");

    // Datos cliente (con fallbacks sanos)
    let nombre   = val(nombreEl);
    let apellido = val(apellidoEl);
    const dn = (user.displayName || "").trim();
    if (!nombre && dn) nombre = dn.split(" ")[0] || "";
    if (!apellido && dn) apellido = dn.split(" ").slice(1).join(" ").trim();
    if (!nombre) nombre = (user.email || "").split("@")[0];

    // Validaciones mínimas exigidas por tu flujo
    if (!val(direccionEl) || !val(telefonoEl) || !val(pagoEl)) throw new Error("FALTAN_DATOS");

    const items = leerCarrito();
    if (!items.length) throw new Error("CARRITO_VACIO");

    const total = items.reduce((s,i)=>s + i.subtotal, 0);

    // === Claves compatibles con tus REGLAS ===
    const pedido = {
      uid: user.uid,
      nombre,
      apellido,
      email: val(emailEl) || user.email || "",
      direccion: val(direccionEl),
      telefono: val(telefonoEl),
      pago: val(pagoEl),
      estado: "pendiente",
      items,                 // usamos "items" (tu regla acepta items[] o productos[])
      total,                 // permitido en create
      creadoEn: serverTimestamp(), // permitido en create
    };

    await addDoc(collection(db, "pedidos"), pedido);

    localStorage.removeItem("carrito");
    okBox?.classList.remove("d-none");
    setTimeout(()=> location.href = "./misPedidos.html", 1200);
  } catch (err) {
    console.error("[finalizarPedido] Error:", err);
    alert("Hubo un error al procesar tu pedido. Intentalo nuevamente.");
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = "Confirmar Pedido"; }
  }
});
