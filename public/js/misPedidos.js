// public/js/misPedidos.js
import { db, auth } from "./firebase.js";
import {
  collection, query, where, getDocs, doc, getDoc
} from "https://www.gstatic.com/firebasejs/11.9.1/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-auth.js";

const tbody = document.getElementById("tabla-mis-pedidos");
const money = new Intl.NumberFormat("es-AR", { maximumFractionDigits: 0 });

const tsToDate = (ts) => (ts?.toDate?.() ?? (typeof ts === "number" ? new Date(ts) : new Date(ts)));
const fmtDate = (d) => isNaN(+d) ? "-" : d.toLocaleString("es-AR",{dateStyle:"short",timeStyle:"short"});
const qNum = (v,def=0)=> Number(v ?? def) || def;
const qtyOf = (it)=> qNum(it.cantidad ?? it.qty, 1);
const lineTotal = (it)=> {
  const sub = qNum(it.subtotal ?? it.total, 0);
  return sub || qtyOf(it) * qNum(it.precio ?? it.precioUnitario ?? it.unitPrice, 0);
};
const orderTotal = (items=[]) => items.reduce((s,i)=> s + lineTotal(i), 0);
const thumb = (url,w=56,h=56) => {
  if (!url) return "";
  try {
    const u = new URL(url);
    if (u.hostname.includes("res.cloudinary.com")) {
      return url.replace("/upload/", `/upload/c_fill,w_${w},h_${h},q_auto,f_auto/`);
    }
  } catch {}
  return url;
};
const getItemId = (it)=> String(it.id ?? it.productId ?? it.product_id ?? it.idProducto ?? it.productoId ?? it.pid ?? "");

const cache = new Map();
async function getProductoInfo(id){
  if (!id) return {};
  if (cache.has(id)) return cache.get(id);
  try {
    const s = await getDoc(doc(db,"productos",id));
    const d = s.exists()? s.data(): {};
    const info = { nombre: d?.nombre || "", imagen: d?.imagen || "" };
    cache.set(id, info);
    return info;
  } catch { const info = {}; cache.set(id, info); return info; }
}

function rowBase(p){
  const tr = document.createElement("tr");
  const fecha = tsToDate(p.creadoEn) || tsToDate(p.fechaCompra) || new Date(0);
  const items = p.items || p.productos || [];
  const total = qNum(p.total, orderTotal(items));
  tr.innerHTML = `
    <td><code class="orden-id" data-id="${p.id}" title="Click para copiar">${p.id}</code></td>
    <td>${fmtDate(fecha)}</td>
    <td class="productos-cell"><div class="small text-muted">Cargando productos…</div></td>
    <td>$${money.format(total)}</td>
    <td><span class="badge text-bg-secondary">${p.estado || "pendiente"}</span></td>
  `;
  return tr;
}

async function fillProductsCell(td, items){
  if (!td) return;
  if (!items?.length){ td.textContent = "-"; return; }
  const bloques = await Promise.all(items.map(async it=>{
    const id = getItemId(it);
    const qty = qtyOf(it);
    const info = await getProductoInfo(id);
    const nombre = String(it.nombre || info.nombre || "Producto");
    const img = thumb(info.imagen);
    return `
      <div class="d-flex align-items-center gap-2 mb-1">
        ${img ? `<img src="${img}" class="admin-thumb rounded border" alt="">` : ""}
        <div>
          <div class="fw-semibold">${nombre}</div>
          <div class="text-muted">ID:
            <code class="producto-id" data-id="${id}" title="Click para copiar">${id || "-"}</code> • x${qty}
          </div>
        </div>
      </div>
    `;
  }));
  td.innerHTML = bloques.join("");
}

// Copiar IDs al click
document.addEventListener("click", async (e)=>{
  const code = e.target.closest(".orden-id, .producto-id");
  if (!code) return;
  const id = code.getAttribute("data-id");
  if (!id) return;
  try { await navigator.clipboard.writeText(id); } catch {}
});

async function cargar(user){
  tbody.innerHTML = `<tr><td colspan="5" class="text-center text-muted">Cargando...</td></tr>`;
  try {
    const q = query(collection(db,"pedidos"), where("uid","==",user.uid));
    const snap = await getDocs(q);
    const pedidos = [];
    snap.forEach(d => pedidos.push({ id: d.id, ...d.data() }));

    pedidos.sort((a,b)=>{
      const da = tsToDate(a.creadoEn) || tsToDate(a.fechaCompra) || new Date(0);
      const db = tsToDate(b.creadoEn) || tsToDate(b.fechaCompra) || new Date(0);
      return db - da; // desc
    });

    tbody.innerHTML = "";
    if (!pedidos.length){
      tbody.innerHTML = `<tr><td colspan="5" class="text-center text-muted">No tenés pedidos todavía.</td></tr>`;
      return;
    }

    for (const p of pedidos){
      const tr = rowBase(p);
      tbody.appendChild(tr);
      const td = tr.querySelector(".productos-cell");
      fillProductsCell(td, p.items || p.productos || []);
    }
  } catch (err){
    console.error("[misPedidos] error:", err);
    tbody.innerHTML = `<tr><td colspan="5" class="text-center text-danger">No se pudieron cargar tus pedidos.</td></tr>`;
  }
}

onAuthStateChanged(auth, (user)=>{
  if (!user){ location.href = "../../index.html"; return; }
  cargar(user);
});
