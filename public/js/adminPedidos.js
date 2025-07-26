import { auth } from './firebase.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-auth.js";
import {
  getFirestore,
  collection,
  getDocs,
  updateDoc,
  doc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/11.9.1/firebase-firestore.js";

const db = getFirestore();
const tablaPedidos = document.getElementById("tabla-pedidos");

// Verificar usuario y cargar pedidos si es admin
onAuthStateChanged(auth, async (user) => {
  if (user) {
    const token = await user.getIdTokenResult();

    if (token.claims.admin) {
      cargarPedidos();
    } else {
      alert("Acceso restringido. Esta página es solo para administradores.");
      window.location.href = "../index.html";
    }
  } else {
    alert("Debés iniciar sesión como administrador para acceder.");
    window.location.href = "../index.html";
  }
});

// Cargar todos los pedidos
async function cargarPedidos() {
  const pedidosSnapshot = await getDocs(collection(db, "pedidos"));
  tablaPedidos.innerHTML = "";

  pedidosSnapshot.forEach(docPedido => {
    const pedido = docPedido.data();
    const id = docPedido.id;

    // Revisar si debe pasarse a "Finalizado"
    const estadoActualizado = calcularEstadoFinalizado(pedido.estado, pedido.fechaEntrega);

    const fila = document.createElement("tr");

    // Productos en lista
    const productosHTML = pedido.productos.map(p => `
      <li>${p.nombre} (${p.cantidad}u) - $${p.precio}</li>
    `).join("");

    fila.innerHTML = `
      <td>${id}</td>
      <td>${pedido.nombre} ${pedido.apellido}</td>
      <td>${pedido.email}</td>
      <td>${pedido.direccion}</td>
      <td>${pedido.telefono}</td>
      <td><ul>${productosHTML}</ul></td>
      <td class="estado-actual">${estadoActualizado}</td>
      <td>
        <select class="form-select form-select-sm cambiar-estado">
          <option value="En preparación" ${estadoActualizado === "En preparación" ? "selected" : ""}>En preparación</option>
          <option value="En tránsito" ${estadoActualizado === "En tránsito" ? "selected" : ""}>En tránsito</option>
          <option value="Entregado" ${estadoActualizado === "Entregado" ? "selected" : ""}>Entregado</option>
          <option value="Finalizado" ${estadoActualizado === "Finalizado" ? "selected" : ""}>Finalizado</option>
        </select>
      </td>
    `;

    // Evento para cambiar estado
    const selectEstado = fila.querySelector(".cambiar-estado");
    selectEstado.addEventListener("change", async () => {
      const nuevoEstado = selectEstado.value;
      const pedidoRef = doc(db, "pedidos", id);

      const actualizacion = { estado: nuevoEstado };

      if (nuevoEstado === "Entregado") {
        actualizacion.fechaEntrega = serverTimestamp();
      }

      await updateDoc(pedidoRef, actualizacion);
      alert("✅ Estado actualizado correctamente");
    });

    tablaPedidos.appendChild(fila);
  });
}

// Función que marca "Finalizado" si pasaron más de 30 días desde fechaEntrega
function calcularEstadoFinalizado(estadoActual, fechaEntrega) {
  if (estadoActual !== "Entregado" || !fechaEntrega) return estadoActual;

  const fecha = fechaEntrega.toDate ? fechaEntrega.toDate() : new Date(fechaEntrega.seconds * 1000);
  const hoy = new Date();
  const diferenciaDias = Math.floor((hoy - fecha) / (1000 * 60 * 60 * 24));

  return diferenciaDias >= 30 ? "Finalizado" : "Entregado";
}
