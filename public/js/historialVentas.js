// public/js/historialVentas.js
import { db, auth } from "./firebase.js";
import {
  collection, getDocs, doc, getDoc, updateDoc, serverTimestamp, 
  query, where, orderBy, addDoc, deleteDoc
} from "https://www.gstatic.com/firebasejs/11.9.1/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-auth.js";

/* -------------------- DOM -------------------- */
const tbodyHistorial = document.getElementById("tbody-historial");
const btnMoverAlHistorial = document.getElementById("btn-mover-al-historial");
const btnLimpiarHistorial = document.getElementById("btn-limpiar-historial");

const money = new Intl.NumberFormat("es-AR", { maximumFractionDigits: 0 });

/* -------------------- Helpers -------------------- */
function tsToDate(ts) {
  if (!ts) return null;
  if (typeof ts?.toDate === "function") return ts.toDate();
  if (typeof ts === "number") {
    const ms = ts < 1e12 ? ts * 1000 : ts;
    return new Date(ms);
  }
  if (typeof ts === "string") {
    const d = new Date(ts);
    return isNaN(+d) ? null : d;
  }
  return null;
}

const fechaTxt = (d) =>
  d ? d.toLocaleString("es-AR", { dateStyle: "short", timeStyle: "short" }) : "-";

const qNum = (v, def = 0) => Number(v ?? def) || def;
const qtyOf = (it) => qNum(it.cantidad ?? it.qty, 1);
const lineTotal = (it) => {
  const sub = qNum(it.subtotal ?? it.total, 0);
  return sub || qtyOf(it) * qNum(it.precio ?? it.precioUnitario ?? it.unitPrice, 0);
};
const orderTotal = (items = []) => items.reduce((s, i) => s + lineTotal(i), 0);

const thumb = (url, w = 48, h = 48) => {
  if (!url) return "";
  try {
    const u = new URL(url);
    if (u.hostname.includes("res.cloudinary.com")) {
      return url.replace("/upload/", `/upload/c_fill,w_${w},h_${h},q_auto,f_auto/`);
    }
  } catch {}
  return url;
};

const getItemId = (it) =>
  String(
    it.id ?? it.productId ?? it.product_id ?? it.idProducto ?? it.productoId ?? it.pid ?? ""
  );

const productoCache = new Map();
async function getProducto(id) {
  if (!id) return {};
  if (productoCache.has(id)) return productoCache.get(id);
  try {
    const s = await getDoc(doc(db, "productos", id));
    const d = s.exists() ? s.data() : {};
    const info = {
      nombre: d?.nombre || "",
      imagen: d?.imagen || "",
      categoria: d?.categoria || "",
    };
    productoCache.set(id, info);
    return info;
  } catch {
    const info = {};
    productoCache.set(id, info);
    return info;
  }
}

/* -------------------- Lógica de Estados y Tiempos -------------------- */
function calcularEstadoPedido(pedido) {
  const fechaEntrega = tsToDate(pedido.fechaEntrega);
  const fechaCreacion = tsToDate(pedido.creadoEn);
  
  if (!fechaEntrega) return "pendiente";
  
  const ahora = new Date();
  const diasDesdeEntrega = Math.floor((ahora - fechaEntrega) / (1000 * 60 * 60 * 24));
  
  if (diasDesdeEntrega <= 30) {
    return "entregado_reclamo_permitido";
  } else {
    return "finalizado_sin_reclamo";
  }
}

function puedeReclamar(pedido) {
  const estado = calcularEstadoPedido(pedido);
  return estado === "entregado_reclamo_permitido";
}

/* -------------------- Mover Pedidos al Historial -------------------- */
async function moverPedidosAlHistorial() {
  try {
    // Obtener pedidos entregados hace más de 30 días
    const ahora = new Date();
    const limite30Dias = new Date(ahora.getTime() - (30 * 24 * 60 * 60 * 1000));
    
    const pedidosRef = collection(db, "pedidos");
    const q = query(
      pedidosRef,
      where("estado", "==", "completado"),
      orderBy("fechaEntrega", "desc")
    );
    
    const snap = await getDocs(q);
    const pedidosAMover = [];
    
    snap.forEach((doc) => {
      const pedido = { id: doc.id, ...doc.data() };
      const fechaEntrega = tsToDate(pedido.fechaEntrega);
      
      if (fechaEntrega && fechaEntrega < limite30Dias) {
        pedidosAMover.push(pedido);
      }
    });
    
    if (pedidosAMover.length === 0) {
      alert("No hay pedidos para mover al historial.");
      return;
    }
    
    // Mover cada pedido al historial
    for (const pedido of pedidosAMover) {
      // Agregar al historial
      await addDoc(collection(db, "historialVentas"), {
        ...pedido,
        movidoAlHistorialEn: serverTimestamp(),
        estadoFinal: "finalizado_sin_reclamo",
        motivo: "Período de reclamo vencido (30 días)"
      });
      
      // Eliminar de pedidos activos
      await deleteDoc(doc(db, "pedidos", pedido.id));
    }
    
    alert(`Se movieron ${pedidosAMover.length} pedidos al historial.`);
    cargarHistorial();
    
  } catch (error) {
    console.error("Error al mover pedidos:", error);
    alert("Error al mover pedidos al historial.");
  }
}

/* -------------------- Render del Historial -------------------- */
function filaHistorial(p) {
  const tr = document.createElement("tr");
  
  const items = p.items || p.productos || [];
  const total = qNum(p.total, orderTotal(items));
  
  const clienteTxt = [
    [p.nombre, p.apellido].filter(Boolean).join(" "),
    p.email,
    !p.nombre && !p.apellido && !p.email ? `uid: ${p.uid}` : null,
  ]
    .filter(Boolean)
    .join(" · ");
  
  const fechaEntrega = tsToDate(p.fechaEntrega);
  const fechaMovimiento = tsToDate(p.movidoAlHistorialEn);
  
  tr.innerHTML = `
    <td><code class="orden-id" data-id="${p.id}" title="Click para copiar">${p.id}</code></td>
    <td class="fecha-entrega">${fechaTxt(fechaEntrega)}</td>
    <td class="fecha-movimiento">${fechaTxt(fechaMovimiento)}</td>
    <td class="cliente-cell">${clienteTxt || "-"}</td>
    <td class="productos-cell"><div class="small text-muted">Cargando...</div></td>
    <td>$${money.format(total)}</td>
    <td>
      <span class="badge bg-secondary">${p.estadoFinal || "finalizado"}</span>
    </td>
    <td class="text-end">
      <button class="btn btn-sm btn-outline-info btn-ver-detalle" data-id="${p.id}">Ver Detalle</button>
    </td>
  `;
  
  return tr;
}

async function fillProductosCellHistorial(td, items) {
  if (!td) return;
  if (!items || !items.length) {
    td.textContent = "-";
    return;
  }
  
  const bloques = await Promise.all(
    items.map(async (it) => {
      const pid = getItemId(it);
      const info = await getProducto(pid);
      const qty = qtyOf(it);
      const nombre = String(it.nombre || info.nombre || "Producto");
      const img = thumb(info.imagen);
      
      return `
        <div class="d-flex align-items-center gap-2 mb-1">
          ${img ? `<img src="${img}" class="admin-thumb rounded border" alt="">` : ""}
          <div>
            <div class="fw-semibold">${nombre}</div>
            <div class="text-muted">
              ID: <code class="producto-id" data-id="${pid}" title="Click para copiar">${pid || "-"}</code> • x${qty}
            </div>
          </div>
        </div>`;
    })
  );
  
  td.innerHTML = bloques.join("");
}

/* -------------------- Cargar Historial -------------------- */
async function cargarHistorial() {
  if (!tbodyHistorial) return;
  
  tbodyHistorial.innerHTML = `<tr><td colspan="8" class="text-center text-muted">Cargando...</td></tr>`;
  
  try {
    const snap = await getDocs(collection(db, "historialVentas"));
    
    const historial = [];
    snap.forEach((d) =>
      historial.push({
        id: d.id,
        ...d.data(),
      })
    );
    
    // Ordenar por fecha de movimiento (más reciente primero)
    historial.sort((a, b) => {
      const da = tsToDate(a.movidoAlHistorialEn) || new Date(0);
      const db_ = tsToDate(b.movidoAlHistorialEn) || new Date(0);
      return db_ - da;
    });
    
    tbodyHistorial.innerHTML = "";
    
    if (!historial.length) {
      tbodyHistorial.innerHTML = `<tr><td colspan="8" class="text-center text-muted">No hay historial de ventas.</td></tr>`;
      return;
    }
    
    for (const p of historial) {
      const tr = filaHistorial(p);
      tbodyHistorial.appendChild(tr);
      
      // Productos (async)
      const td = tr.querySelector(".productos-cell");
      fillProductosCellHistorial(td, p.items || p.productos || []);
    }
    
  } catch (err) {
    console.error("[historialVentas] Error:", err);
    tbodyHistorial.innerHTML = `<tr><td colspan="8" class="text-center text-danger">No se pudo cargar el historial.</td></tr>`;
  }
}

/* -------------------- Event Listeners -------------------- */
document.addEventListener("click", async (e) => {
  // Copiar IDs
  const code = e.target.closest(".orden-id, .producto-id");
  if (code) {
    const id = code.getAttribute("data-id");
    if (id) {
      try {
        await navigator.clipboard.writeText(id);
        // Mostrar feedback
        code.style.backgroundColor = "#28a745";
        setTimeout(() => code.style.backgroundColor = "", 1000);
      } catch {}
    }
    return;
  }
  
  // Ver detalle del pedido
  const btnDetalle = e.target.closest(".btn-ver-detalle");
  if (btnDetalle) {
    const id = btnDetalle.getAttribute("data-id");
    // Aquí podrías abrir un modal con más detalles
    alert(`Detalles del pedido ${id} - Funcionalidad en desarrollo`);
  }
});

// Botón para mover pedidos automáticamente
if (btnMoverAlHistorial) {
  btnMoverAlHistorial.addEventListener("click", moverPedidosAlHistorial);
}

// Botón para limpiar historial (opcional, solo para admins)
if (btnLimpiarHistorial) {
  btnLimpiarHistorial.addEventListener("click", async () => {
    if (confirm("¿Estás seguro de que quieres limpiar todo el historial? Esta acción no se puede deshacer.")) {
      try {
        const snap = await getDocs(collection(db, "historialVentas"));
        const batch = [];
        snap.forEach((doc) => batch.push(deleteDoc(doc.ref)));
        await Promise.all(batch);
        alert("Historial limpiado exitosamente.");
        cargarHistorial();
      } catch (error) {
        console.error("Error al limpiar historial:", error);
        alert("Error al limpiar el historial.");
      }
    }
  });
}

/* -------------------- Gate de ADMIN -------------------- */
async function esAdmin(uid) {
  try {
    const s = await getDoc(doc(db, "roles", uid));
    return s.exists() && s.data()?.admin === true;
  } catch {
    return false;
  }
}

/* -------------------- Inicialización -------------------- */
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    location.href = "../../index.html";
    return;
  }
  
  const ok = await esAdmin(user.uid);
  if (!ok) {
    alert("No tenés permisos de administrador.");
    location.href = "../../index.html";
    return;
  }
  
  cargarHistorial();
});

// Exportar funciones para uso en otros archivos
export { moverPedidosAlHistorial, puedeReclamar, calcularEstadoPedido };
