// public/js/misPedidos.js
import { db, auth } from "./firebase.js";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
} from "https://www.gstatic.com/firebasejs/11.9.1/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-auth.js";

const tbody =
  document.getElementById("tabla-mis-pedidos") ||
  document.getElementById("tbody-pedidos");

const fmtMoney = new Intl.NumberFormat("es-AR", { maximumFractionDigits: 0 });

/* ---------- Utils ---------- */
function tsToDate(ts) {
  if (!ts) return null;
  if (typeof ts?.toDate === "function") return ts.toDate();
  if (typeof ts === "number") return new Date(ts);
  const d = new Date(ts);
  return isNaN(+d) ? null : d;
}
function formatearFecha(fecha) {
  if (!fecha) return "-";
  return fecha.toLocaleString("es-AR", { dateStyle: "short", timeStyle: "short" });
}
function lineaTotal(item) {
  const precio = Number(item.precio ?? item.precioUnitario ?? item.unitPrice ?? 0) || 0;
  const cantidad = Number(item.cantidad ?? item.qty ?? 1) || 1;
  const sub = Number(item.subtotal ?? item.total ?? 0);
  return sub || precio * cantidad;
}
function calcularTotal(items) {
  return (items || []).reduce((acc, it) => acc + lineaTotal(it), 0);
}
function thumb(url, w = 56, h = 56) {
  if (!url) return "";
  try {
    const u = new URL(url);
    if (u.hostname.includes("res.cloudinary.com")) {
      return url.replace("/upload/", `/upload/c_fill,w_${w},h_${h},q_auto,f_auto/`);
    }
  } catch {}
  return url;
}

/* ---------- Cache de productos (para imagen/nombre por id) ---------- */
const productoCache = new Map();
async function getProductoInfo(id) {
  if (!id) return {};
  if (productoCache.has(id)) return productoCache.get(id);
  try {
    const snap = await getDoc(doc(db, "productos", id));
    const data = snap.exists() ? snap.data() : {};
    const info = {
      nombre: data?.nombre,
      imagen: data?.imagen || "",
      categoria: data?.categoria || "",
    };
    productoCache.set(id, info);
    return info;
  } catch {
    const info = {};
    productoCache.set(id, info);
    return info;
  }
}

/* ---------- Render ---------- */
function renderFilaBase(p) {
  const tr = document.createElement("tr");

  const fecha = tsToDate(p.creadoEn) || tsToDate(p.fechaCompra) || null;
  const items = p.items || p.productos || [];
  const total = Number(p.total) || calcularTotal(items);

  tr.innerHTML = `
    <td class="text-muted">${p.id.slice(0, 6)}</td>
    <td>${formatearFecha(fecha)}</td>
    <td class="productos-cell"><div class="small text-muted">Cargando productos…</div></td>
    <td>$${fmtMoney.format(total)}</td>
    <td><span class="badge text-bg-secondary">${p.estado || "pendiente"}</span></td>
  `;
  return tr;
}

async function renderProductosCell(td, items) {
  if (!td) return;
  if (!items || items.length === 0) {
    td.textContent = "-";
    return;
  }
  const bloques = await Promise.all(
    items.map(async (it) => {
      const id = String(it.id || "");
      const qty = Number(it.cantidad ?? it.qty ?? 1) || 1;
      const info = await getProductoInfo(id);
      const nombre = String(it.nombre || info.nombre || "Producto");
      const img = thumb(info.imagen);

      return `
        <div class="d-flex align-items-center gap-2 mb-1">
          ${img ? `<img src="${img}" alt="" class="admin-thumb rounded border">` : ""}
          <div>
            <div class="fw-semibold">${nombre}</div>
            <div class="text-muted">ID: <code title="${id}">${id ? id.slice(0, 8) : "-"}</code> • x${qty}</div>
          </div>
        </div>
      `;
    })
  );
  td.innerHTML = bloques.join("");
}

/* ---------- Carga de pedidos del usuario ---------- */
async function cargarPedidosDelUsuario(user) {
  if (!tbody) return;
  tbody.innerHTML =
    `<tr><td colspan="5" class="text-center text-muted">Cargando...</td></tr>`;

  try {
    const q = query(collection(db, "pedidos"), where("uid", "==", user.uid));
    const snap = await getDocs(q);

    const pedidos = [];
    snap.forEach((docSnap) => pedidos.push({ id: docSnap.id, ...docSnap.data() }));

    pedidos.sort((a, b) => {
      const da = tsToDate(a.creadoEn) || tsToDate(a.fechaCompra) || new Date(0);
      const db_ = tsToDate(b.creadoEn) || tsToDate(b.fechaCompra) || new Date(0);
      return db_ - da; // desc
    });

    tbody.innerHTML = "";
    if (pedidos.length === 0) {
      tbody.innerHTML =
        `<tr><td colspan="5" class="text-center text-muted">No tenés pedidos todavía.</td></tr>`;
      return;
    }

    for (const p of pedidos) {
      const tr = renderFilaBase(p);
      tbody.appendChild(tr);
      const tdProductos = tr.querySelector(".productos-cell");
      const items = p.items || p.productos || [];
      renderProductosCell(tdProductos, items); // async
    }
  } catch (err) {
    console.error("[misPedidos] Error:", err);
    tbody.innerHTML =
      `<tr><td colspan="5" class="text-center text-danger">No se pudieron cargar tus pedidos.</td></tr>`;
  }
}

/* ---------- Auth gate ---------- */
onAuthStateChanged(auth, (user) => {
  if (!user) {
    window.location.href = "../../index.html";
    return;
  }
  cargarPedidosDelUsuario(user);
});
