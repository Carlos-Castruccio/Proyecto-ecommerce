import { auth } from "./firebase.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-auth.js";
import {
  getFirestore,
  collection,
  query,
  where,
  getDocs,
} from "https://www.gstatic.com/firebasejs/11.9.1/firebase-firestore.js";

const db = getFirestore();
const pedidosContainer = document.getElementById("pedidos-container");
const emailSpan = document.getElementById("user-email");
const alertaNoPedidos = document.getElementById("no-pedidos");

onAuthStateChanged(auth, async (user) => {
  if (user) {
    emailSpan.textContent = user.email;

    // 🔍 DEBUG opcional
    console.log("UID logueado:", user.uid);

    const q = query(collection(db, "pedidos"), where("uid", "==", user.uid));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      alertaNoPedidos.classList.remove("d-none");
      return;
    }

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      const fecha =
        data.fechaCompra?.toDate()?.toLocaleString() ?? "(sin fecha)";
      const estado = data.estado || "Desconocido";
      const nombre = data.nombre || "";
      const apellido = data.apellido || "";
      const direccion = data.direccion || "";
      const productos = Array.isArray(data.productos)
        ? data.productos
            .map((p) => `<li>${p.nombre} (x${p.cantidad}) - $${p.precio}</li>`)
            .join("")
        : "<li>(Sin productos)</li>";

      pedidosContainer.innerHTML += `
        <div class="card mb-3 border-dark">
          <div class="card-body">
            <h5 class="card-title">Pedido ID: ${doc.id}</h5>
            <p><strong>Estado:</strong> ${estado}</p>
            <p><strong>Fecha:</strong> ${fecha}</p>
            <p><strong>Cliente:</strong> ${nombre} ${apellido}</p>
            <p><strong>Dirección:</strong> ${direccion}</p>
            <p><strong>Productos:</strong></p>
            <ul>${productos}</ul>
          </div>
        </div>
      `;
    });
  } else {
    window.location.href = "../index.html";
  }
});
