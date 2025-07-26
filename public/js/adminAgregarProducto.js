import { auth } from './firebase.js';
import { onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/11.9.1/firebase-auth.js';
import {
  getFirestore,
  collection,
  addDoc
} from 'https://www.gstatic.com/firebasejs/11.9.1/firebase-firestore.js';

const db = getFirestore();
const form = document.getElementById('form-agregar-producto');
const mensaje = document.getElementById('mensaje');

// Solo permitir acceso si es admin
onAuthStateChanged(auth, async (user) => {
  if (user) {
    const token = await user.getIdTokenResult();
    if (!token.claims.admin) {
      alert("Acceso denegado. Solo para administradores.");
      window.location.href = "../index.html";
    }
  } else {
    alert("Debés iniciar sesión como administrador.");
    window.location.href = "../index.html";
  }
});

form.addEventListener('submit', async (e) => {
  e.preventDefault();

  const nuevoProducto = {
    nombre: document.getElementById('nombre').value,
    descripcion: document.getElementById('descripcion').value,
    precio: parseFloat(document.getElementById('precio').value),
    stock: parseInt(document.getElementById('stock').value),
    imagen: document.getElementById('imagen').value,
    categoria: document.getElementById('categoria').value
  };

  try {
    await addDoc(collection(db, "productos"), nuevoProducto);
    mensaje.innerHTML = `<div class="alert alert-success">✅ Producto agregado con éxito</div>`;
    form.reset();
  } catch (error) {
    console.error("❌ Error al guardar producto:", error);
    mensaje.innerHTML = `<div class="alert alert-danger">Error al agregar el producto</div>`;
  }
});
