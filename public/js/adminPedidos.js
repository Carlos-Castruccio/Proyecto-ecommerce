// public/js/adminPedidos.js
import { db, auth } from "./firebase.js";
import {
  collection, getDocs, doc, getDoc, updateDoc, serverTimestamp
} from "https://www.gstatic.com/firebasejs/11.9.1/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-auth.js";

/* -------------------- DOM -------------------- */
const tbody =
  document.getElementById("tabla-admin-pedidos") ||
  document.getElementById("tbody-pedidos-admin");

const money = new Intl.NumberFormat("es-AR", { maximumFractionDigits: 0 });

/* -------------------- Helpers -------------------- */
function tsToDate(ts) {
  if (!ts) return null;
  if (typeof ts?.toDate === "function") return ts.toDate(); // Firestore Timestamp
  if (typeof ts === "number") {
    // si viene en segundos (Unix), lo pasamos a ms
    const ms = ts < 1e12 ? ts * 1000 : ts;
    return new Date(ms);
  }
  if (typeof ts === "string") {
    const d = new Date(ts);
    return isNaN(+d) ? null : d;
  }
  return null;
}

// Intenta resolver una fecha válida con muchos alias comunes
function resolveFecha(obj, fallbacks = {}) {
  const cand = [
    obj.creadoEn, obj.fechaCompra, obj.createdAt, obj.created_at,
    obj.timestamp, obj.ts, obj.fecha, obj.fecha_creacion,
    fallbacks.__createTime, fallbacks.__updateTime
  ];
  for (const x of cand) {
    const d = tsToDate(x);
    if (d) return d;
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
    it.id ??
      it.productId ??
      it.product_id ??
      it.idProducto ??
      it.productoId ??
      it.pid ??
      ""
  );

// Función para calcular si un pedido puede reclamar
function calcularEstadoReclamo(pedido) {
  if (!pedido.fechaEntrega || pedido.estado !== "completado") return "no_aplica";
  
  const fechaEntrega = tsToDate(pedido.fechaEntrega);
  if (!fechaEntrega) return "no_aplica";
  
  const ahora = new Date();
  const diasDesdeEntrega = Math.floor((ahora - fechaEntrega) / (1000 * 60 * 60 * 24));
  
  if (diasDesdeEntrega <= 30) {
    return "puede_reclamar";
  } else {
    return "sin_reclamo";
  }
}

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

/* -------------------- Render -------------------- */
function filaBase(p) {
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

  tr.innerHTML = `
    <td><code class="orden-id" data-id="${p.id}" title="Click para copiar">${p.id}</code></td>
    <td class="fecha-cell">-</td>
    <td class="cliente-cell">${clienteTxt || "-"}</td>
    <td class="productos-cell"><div class="small text-muted">Cargando...</div></td>
    <td>$${money.format(total)}</td>
    <td>
      <select class="form-select form-select-sm estado-select" data-id="${p.id}">
        ${["pendiente","procesando","enviado","completado","cancelado"]
          .map((s) => `<option value="${s}" ${s === (p.estado || "pendiente") ? "selected" : ""}>${s}</option>`)
          .join("")}
      </select>
      ${p.estado === "completado" ? `
        <div class="mt-1">
          <small class="text-muted">Fecha entrega:</small><br>
          <input type="datetime-local" class="form-control form-control-sm fecha-entrega-input" 
                 data-id="${p.id}" value="${p.fechaEntrega ? new Date(p.fechaEntrega.seconds * 1000).toISOString().slice(0, 16) : ''}">
        </div>
        ${p.fechaEntrega ? `
          <div class="mt-1">
            <span class="badge ${calcularEstadoReclamo(p) === 'puede_reclamar' ? 'bg-warning' : 'bg-success'}">
              ${calcularEstadoReclamo(p)}
            </span>
          </div>
        ` : ''}
      ` : ''}
    </td>
    <td class="text-end">
      <button class="btn btn-sm btn-outline-danger btn-cancelar" data-id="${p.id}">Eliminar</button>
    </td>
  `;
  return tr;
}

async function fillProductosCell(td, items) {
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

/* -------------------- Carga de pedidos (ADMIN) -------------------- */
async function cargarAdmin() {
  tbody.innerHTML = `<tr><td colspan="7" class="text-center text-muted">Cargando...</td></tr>`;
  try {
    const snap = await getDocs(collection(db, "pedidos"));

    const pedidos = [];
    snap.forEach((d) =>
      pedidos.push({
        id: d.id,
        __createTime: d.createTime?.toDate?.(), // fallback si el SDK lo expone
        __updateTime: d.updateTime?.toDate?.(),
        ...d.data(),
      })
    );

    // ordenar por fecha desc con el resolver
    pedidos.sort((a, b) => {
      const da = resolveFecha(a, a) || new Date(0);
      const db_ = resolveFecha(b, b) || new Date(0);
      return db_ - da;
    });

    tbody.innerHTML = "";
    if (!pedidos.length) {
      tbody.innerHTML = `<tr><td colspan="7" class="text-center text-muted">No hay pedidos.</td></tr>`;
      return;
    }

    for (const p of pedidos) {
      const tr = filaBase(p);
      tbody.appendChild(tr);

      // Fecha resuelta y pintada
      const f = resolveFecha(p, p);
      tr.querySelector(".fecha-cell").textContent = fechaTxt(f);

      // Productos (async)
      const td = tr.querySelector(".productos-cell");
      fillProductosCell(td, p.items || p.productos || []);
    }
  } catch (err) {
    console.error("[adminPedidos] Error:", err);
    tbody.innerHTML = `<tr><td colspan="7" class="text-center text-danger">No se pudieron cargar los pedidos.</td></tr>`;
  }
}

/* -------------------- Acciones: copiar IDs y cambiar estado -------------------- */
document.addEventListener("click", async (e) => {
  const code = e.target.closest(".orden-id, .producto-id");
  if (code) {
    const id = code.getAttribute("data-id");
    if (id) {
      try {
        await navigator.clipboard.writeText(id);
      } catch {}
    }
    return;
  }
});

document.addEventListener("change", async (e) => {
  const sel = e.target.closest(".estado-select");
  if (!sel) return;
  const id = sel.getAttribute("data-id");
  const nuevo = sel.value;
  try {
    await updateDoc(doc(db, "pedidos", id), {
      estado: nuevo,
      actualizadoEn: serverTimestamp(),
    });
    
    // Si el estado cambió a completado, agregar fecha de entrega automáticamente
    if (nuevo === "completado") {
      await updateDoc(doc(db, "pedidos", id), {
        fechaEntrega: serverTimestamp(),
      });
    }
    
    // Recargar la tabla para mostrar los cambios
    cargarAdmin();
  } catch (err) {
    console.error("No se pudo actualizar estado:", err);
    alert("No se pudo actualizar el estado.");
  }
});

// Event listener para la fecha de entrega
document.addEventListener("change", async (e) => {
  const fechaInput = e.target.closest(".fecha-entrega-input");
  if (!fechaInput) return;
  
  const id = fechaInput.getAttribute("data-id");
  const fecha = fechaInput.value;
  
  if (!fecha) return;
  
  try {
    const fechaDate = new Date(fecha);
    await updateDoc(doc(db, "pedidos", id), {
      fechaEntrega: fechaDate,
      actualizadoEn: serverTimestamp(),
    });
    
    // Recargar la tabla para mostrar el estado de reclamo actualizado
    cargarAdmin();
  } catch (err) {
    console.error("No se pudo actualizar fecha de entrega:", err);
    alert("No se pudo actualizar la fecha de entrega.");
  }
});

/* -------------------- Gate de ADMIN -------------------- */
async function esAdmin(uid) {
  try {
    const s = await getDoc(doc(db, "roles", uid));
    return s.exists() && s.data()?.admin === true;
  } catch {
    return false;
  }
}

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
  cargarAdmin();
});
