import { auth } from './firebase.js';
import { onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/11.9.1/firebase-auth.js';
import {
  getFirestore,
  collection,
  addDoc,
  serverTimestamp
} from 'https://www.gstatic.com/firebasejs/11.9.1/firebase-firestore.js';

const db = getFirestore();

const form = document.getElementById('form-finalizar');
const emailInput = document.getElementById('email');
const confirmacion = document.getElementById('mensaje-confirmacion');

// Mostrar correo del usuario activo
onAuthStateChanged(auth, user => {
  if (user) {
    emailInput.value = user.email;
  } else {
    alert("Debés iniciar sesión para finalizar la compra.");
    window.location.href = '../index.html';
  }
});

// Obtener carrito desde localStorage
const obtenerCarrito = () => {
  const carrito = localStorage.getItem('carrito');
  return carrito ? JSON.parse(carrito) : [];
};

form.addEventListener('submit', async (e) => {
  e.preventDefault();

  const nombre = document.getElementById('nombre').value;
  const apellido = document.getElementById('apellido').value;
  const direccion = document.getElementById('direccion').value;
  const telefono = document.getElementById('telefono').value;
  const pago = document.getElementById('pago').value;
  const productos = obtenerCarrito();

  if (productos.length === 0) {
    alert("El carrito está vacío. No se puede registrar el pedido.");
    return;
  }

  try {
    const nuevoPedido = {
      uid: auth.currentUser.uid,
      email: auth.currentUser.email,
      nombre,
      apellido,
      direccion,
      telefono,
      metodoPago: pago,
      productos: productos.map(p => ({
        id: p.id,
        nombre: p.nombre,
        cantidad: p.cantidad,
        precio: p.precio,
        imagen: p.imagen,
        stock: p.stock
      })),
      estado: "En preparación",
      fechaCompra: serverTimestamp()
    };

    await addDoc(collection(db, "pedidos"), nuevoPedido);

    confirmacion.classList.remove('d-none');
    form.reset();
    localStorage.removeItem('carrito');

    setTimeout(() => {
      window.location.href = "../page/pedidos.html";
    }, 2000);

  } catch (error) {
    console.error("❌ Error al guardar el pedido:", error);
    alert("Error al guardar el pedido. Intentalo nuevamente.");
  }
});
