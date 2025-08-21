import { db, auth } from "./firebase.js";
import {
  collection,
  getDocs,
  orderBy,
  query,
  doc,
  getDoc,
  updateDoc,
} from "https://www.gstatic.com/firebasejs/11.9.1/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-auth.js";

// -------- Helpers de DOM (robustos) --------
// Devuelve una miniatura 56x56. Si es Cloudinary, usa transformación; si no, limita por CSS.
function thumbUrl(url, w = 56, h = 56) {
  if (!url) return "";
  try {
    const u = new URL(url);
    if (u.hostname.includes("res.cloudinary.com")) {
      // Inserta transformación después de /upload/
      return url.replace("/upload/", `/upload/c_fill,w_${w},h_${h},q_auto,f_auto/`);
    }
  } catch (_) {}
  return url; // otras CDNs o archivos locales
}


function getTbody() {
  return (
    document.getElementById("tabla-admin-pedidos") ||
    document.getElementById("tabla-pedidos") ||
    document.querySelector("table tbody")
  );
}

const fmt = new Intl.NumberFormat("es-AR", { maximumFractionDigits: 0 });

function setEmptyRow(texto = "No hay pedidos para mostrar.") {
  const tb = getTbody();
  if (!tb) {
    console.error("[AdminPedidos] No se encontró <tbody>.");
    return;
  }
  tb.innerHTML = `
    <tr>
      <td colspan="7" class="text-center text-muted">${texto}</td>
    </tr>
  `;
}

function renderRow(d) {
  const p = d.data();
  const fechaTxt = p?.fechaCompra?.toDate?.()
    ? p.fechaCompra.toDate().toLocaleString("es-AR")
    : "-";

  const productos = Array.isArray(p?.productos) ? p.productos : [];
  const total = productos.reduce((acc, it) => {
    const precio = Number(it.precio) || 0;
    const cant = Number(it.cantidad) || 1;
    return acc + precio * cant;
  }, 0);

  // HTML con miniaturas
  const productosHtml = productos.length
    ? productos
        .map((it) => {
          const src = thumbUrl(it.imagen || "");
          return `
            <div class="d-flex align-items-center gap-2 mb-1">
              ${
                src
                  ? `<img src="${src}" alt="${it.nombre}"
                       style="width:56px;height:56px;object-fit:cover;border-radius:8px;border:1px solid rgba(255,255,255,.15);"
                       onerror="this.style.display='none'">`
                  : ""
              }
              <span>${it.nombre} × ${it.cantidad}</span>
            </div>
          `;
        })
        .join("")
    : "-";

  const tr = document.createElement("tr");
  tr.dataset.id = d.id;
  tr.innerHTML = `
    <td class="text-break" style="max-width:180px">${d.id}</td>
    <td>${fechaTxt}</td>
    <td>
      <div class="small">
        <div><strong>${p?.nombre || "-" } ${p?.apellido || ""}</strong></div>
        <div class="text-info">${p?.email || "-"}</div>
        <div class="text-muted">${p?.direccion || "-"}</div>
        <div class="text-muted">${p?.telefono || "-"}</div>
      </div>
    </td>
    <td>${productosHtml}</td>
    <td>$${fmt.format(total)}</td>
    <td>
      <select class="form-select form-select-sm estado-select">
        ${["En preparación","En tránsito","Entregado","Finalizado"]
          .map((e) => `<option value="${e}" ${p?.estado === e ? "selected" : ""}>${e}</option>`)
          .join("")}
      </select>
    </td>
    <td><button class="btn btn-sm btn-warning btn-guardar">Guardar</button></td>
  `;
  return tr;
}


async function cargarPedidosAdmin() {
  const tb = getTbody();
  if (!tb) {
    console.error("[AdminPedidos] No se encontró <tbody>.");
    return;
  }

  try {
    const pedidosRef = collection(db, "pedidos");
    const q = query(pedidosRef, orderBy("fechaCompra", "desc")); // sin where => ve TODOS
    const snap = await getDocs(q);

    tb.innerHTML = "";
    if (snap.empty) {
      setEmptyRow();
      return;
    }

    snap.forEach((d) => tb.appendChild(renderRow(d)));
  } catch (err) {
    console.error("[AdminPedidos] Error al cargar pedidos:", err);
    setEmptyRow("No se pudieron cargar los pedidos.");
  }
}

// Guardar cambio de estado
async function guardarEstado(id, nuevoEstado, boton) {
  try {
    if (boton) {
      boton.disabled = true;
      boton.textContent = "Guardando...";
    }
    await updateDoc(doc(db, "pedidos", id), { estado: nuevoEstado });
    if (boton) {
      boton.textContent = "Guardado";
      setTimeout(() => {
        boton.textContent = "Guardar";
        boton.disabled = false;
      }, 800);
    }
  } catch (err) {
    console.error("[AdminPedidos] No se pudo actualizar el estado:", err);
    if (boton) {
      boton.disabled = false;
      boton.textContent = "Guardar";
    }
  }
}

document.addEventListener("DOMContentLoaded", () => {
  // Delegación de eventos para el botón "Guardar"
  getTbody()?.addEventListener("click", (e) => {
    const btn = e.target.closest(".btn-guardar");
    if (!btn) return;
    const fila = btn.closest("tr");
    const id = fila?.dataset?.id;
    const select = fila?.querySelector(".estado-select");
    if (!id || !select) return;
    guardarEstado(id, select.value, btn);
  });

  // Gate de auth + verificación de admin
  onAuthStateChanged(auth, async (user) => {
    if (!user) {
      setEmptyRow("Iniciá sesión como administrador.");
      return;
    }
    try {
      const rolSnap = await getDoc(doc(db, "roles", user.uid));
      const esAdmin = rolSnap.exists() && rolSnap.data()?.admin === true;
      if (!esAdmin) {
        setEmptyRow("No tenés permisos de administrador.");
        return;
      }
    } catch (e) {
      console.warn("[AdminPedidos] No se pudo validar el rol:", e);
      setEmptyRow("No se pudo validar el rol de administrador.");
      return;
    }

    // Si es admin, cargar pedidos
    await cargarPedidosAdmin();
  });
});
