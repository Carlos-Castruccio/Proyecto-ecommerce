import { db, auth } from "./firebase.js";
import {
  collection, getDocs, doc, deleteDoc, getDoc, updateDoc
} from "https://www.gstatic.com/firebasejs/11.9.1/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-auth.js";

// -------- DOM principal
const acc = document.getElementById("accordion-categorias");
const buscador = document.getElementById("buscador");
const soloStock = document.getElementById("solo-stock");

// -------- Modal editar
let modal;
const modalEl = document.getElementById("modalEditar");
if (modalEl) modal = new bootstrap.Modal(modalEl);

const fId = document.getElementById("edit-id");
const fNombre = document.getElementById("edit-nombre");
const fCategoria = document.getElementById("edit-categoria");
const fDescripcion = document.getElementById("edit-descripcion");
const fPrecio = document.getElementById("edit-precio");
const fStock = document.getElementById("edit-stock");
const fImgUrl = document.getElementById("edit-imagen-url");
const fImgFile = document.getElementById("edit-imagen-file");
const fPreview = document.getElementById("edit-preview");
const btnGuardarEdicion = document.getElementById("btn-guardar-edicion");
const alerta = document.getElementById("editar-alerta");
const exito  = document.getElementById("editar-exito");

// -------- Config
const ORDEN_CATEGORIAS = ["Camperas", "Cascos", "Antiparras", "Guantes", "Botas"];
const ordenMap = new Map(ORDEN_CATEGORIAS.map((c, i) => [c.toLowerCase(), i]));
const fmt = new Intl.NumberFormat("es-AR", { maximumFractionDigits: 0 });

// Cloudinary (usá tus valores)
const CLOUD_NAME = "dr1efbpsk";
const UPLOAD_PRESET = "MotoStore";

async function subirACloudinary(file) {
  const fd = new FormData();
  fd.append("file", file);
  fd.append("upload_preset", UPLOAD_PRESET);
  const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/upload`, {
    method: "POST",
    body: fd
  });
  if (!res.ok) throw new Error("Error al subir imagen");
  const data = await res.json();
  return data.secure_url;
}

// -------- Helpers
let adminOk = false;
let productosMem = [];

function showError(msg) {
  console.error(msg);
  if (exito) exito.classList.add("d-none");
  if (alerta) { alerta.textContent = msg; alerta.classList.remove("d-none"); }
}
function showSuccess(msg = "Cambios guardados.") {
  if (alerta) alerta.classList.add("d-none");
  if (exito) { exito.textContent = msg; exito.classList.remove("d-none"); }
}

function thumb(url, w = 56, h = 56) {
  if (!url) return "";
  try {
    const u = new URL(url);
    if (u.hostname.includes("res.cloudinary.com")) {
      return url.replace("/upload/", `/upload/c_fill,w_${w},h_${h},q_auto,f_auto/`);
    }
  } catch (_) {}
  return url;
}

function categoriaPorTexto(texto = "") {
  const t = texto.toLowerCase();
  if (t.includes("campera") || t.includes("camperón") || t.includes("camperon") || t.includes("chaqueta") || t.includes("jacket")) return "Camperas";
  if (t.includes("casco") || t.includes("helmet")) return "Cascos";
  if (t.includes("antiparra") || t.includes("goggle") || t.includes("lente")) return "Antiparras";
  if (t.includes("guante") || t.includes("glove")) return "Guantes";
  if (t.includes("bota") || t.includes("botín") || t.includes("botin") || t.includes("boot")) return "Botas";
  return null;
}
function detectarCategoria(p) {
  const directa = p.categoria ?? p.categoría ?? p.tipo ?? p.rubro;
  if (typeof directa === "string" && directa.trim()) return directa.trim();
  return categoriaPorTexto(p.nombre || "") ||
         categoriaPorTexto(p.descripcion || p.detalle || "") ||
         "Otros";
}
function slug(s) {
  return String(s).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}
function ordenar(list) {
  return list.sort((a, b) => {
    const ai = ordenMap.get((a.categoria || "otros").toLowerCase()) ?? 999;
    const bi = ordenMap.get((b.categoria || "otros").toLowerCase()) ?? 999;
    if (ai !== bi) return ai - bi;
    return String(a.nombre).localeCompare(String(b.nombre));
  });
}

// -------- Carga / Render
async function cargarProductos() {
  const snap = await getDocs(collection(db, "productos"));
  productosMem = [];
  snap.forEach(d => {
    const p = d.data();
    productosMem.push({
      id: d.id,
      nombre: p.nombre,
      descripcion: p.descripcion || "",
      precio: Number(p.precio) || 0,
      stock: Number(p.stock) || 0,
      imagen: p.imagen || "",
      categoria: detectarCategoria(p),
    });
  });
  render();
}

function render() {
  if (!acc) return;

  const q = (buscador?.value || "").toLowerCase();
  const onlyStock = !!soloStock?.checked;

  // Filtrado + orden
  let list = productosMem.filter(p => {
    if (q && !String(p.nombre || "").toLowerCase().includes(q)) return false;
    if (onlyStock && (Number(p.stock) || 0) <= 0) return false;
    return true;
  });
  list = ordenar(list);

  // Agrupar por categoría
  const grupos = new Map();
  list.forEach(p => {
    const cat = p.categoria || "Otros";
    if (!grupos.has(cat)) grupos.set(cat, []);
    grupos.get(cat).push(p);
  });

  const categoriasOrdenadas = [...grupos.keys()].sort((a, b) => {
    const ai = ordenMap.get(a.toLowerCase()) ?? 999;
    const bi = ordenMap.get(b.toLowerCase()) ?? 999;
    return ai - bi;
  });

  // Render accordion
  acc.innerHTML = "";
  if (categoriasOrdenadas.length === 0) {
    acc.innerHTML = `<div class="text-center text-muted py-5">No hay productos para mostrar.</div>`;
    return;
  }

  categoriasOrdenadas.forEach((cat, idx) => {
    const items = grupos.get(cat);
    const id = slug(`cat-${cat}`);

    const item = document.createElement("div");
    item.className = "accordion-item";

    item.innerHTML = `
      <h2 class="accordion-header" id="h-${id}">
        <button class="accordion-button ${idx === 0 ? "" : "collapsed"}" type="button"
                data-bs-toggle="collapse" data-bs-target="#c-${id}"
                aria-expanded="${idx === 0 ? "true" : "false"}" aria-controls="c-${id}">
          ${cat} <span class="badge bg-secondary ms-2">${items.length}</span>
        </button>
      </h2>
      <div id="c-${id}" class="accordion-collapse collapse ${idx === 0 ? "show" : ""}" aria-labelledby="h-${id}">
        <div class="accordion-body">
          <div class="table-responsive">
            <table class="table table-dark table-hover align-middle">
              <thead>
                <tr>
                  <th>Img</th>
                  <th>Nombre</th>
                  <th class="text-end">Precio</th>
                  <th class="text-end">Stock</th>
                  ${adminOk ? '<th class="col-acciones text-end">Acciones</th>' : ""}
                </tr>
              </thead>
              <tbody>
                ${items.map(p => `
                  <tr>
                    <td><img class="admin-thumb rounded border" src="${thumb(p.imagen)}" alt=""></td>
                    <td class="text-break">${p.nombre || "-"}</td>
                    <td class="text-end">$${fmt.format(p.precio)}</td>
                    <td class="text-end">${p.stock}</td>
                    ${adminOk ? `<td class="text-end">
                      <div class="btn-group btn-group-sm" role="group">
                        <button class="btn btn-outline-primary btn-editar-producto" data-id="${p.id}">Editar</button>
                        <button class="btn btn-outline-danger btn-eliminar-producto" data-id="${p.id}">Eliminar</button>
                      </div>
                    </td>` : ""}
                  </tr>`).join("")}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;
    acc.appendChild(item);
  });
}

// -------- Acciones de fila (Editar / Eliminar)
acc?.addEventListener("click", async (e) => {
  const editBtn = e.target.closest(".btn-editar-producto");
  const delBtn  = e.target.closest(".btn-eliminar-producto");

  if (editBtn) {
    if (!adminOk) return alert("No tenés permisos para editar.");
    const id = editBtn.getAttribute("data-id");
    const prod = productosMem.find(p => p.id === id);
    if (!prod) return;

    // Cargar modal
    fId.value = prod.id;
    fNombre.value = prod.nombre || "";
    fCategoria.value = (prod.categoria && ["Camperas","Cascos","Antiparras","Guantes","Botas","Otros"].includes(prod.categoria)) ? prod.categoria : "Auto";
    fDescripcion.value = prod.descripcion || "";
    fPrecio.value = Number(prod.precio) || 0;
    fStock.value = Number(prod.stock) || 0;
    fImgUrl.value = prod.imagen || "";
    fPreview.src = prod.imagen || "";
    fImgFile.value = "";
    alerta?.classList.add("d-none");
    exito?.classList.add("d-none");
    modal.show();
  }

  if (delBtn) {
    if (!adminOk) return alert("No tenés permisos para eliminar.");
    const id = delBtn.getAttribute("data-id");
    if (!id) return;
    if (!confirm("¿Eliminar este producto? Esta acción no se puede deshacer.")) return;
    try {
      await deleteDoc(doc(db, "productos", id));
      productosMem = productosMem.filter(p => p.id !== id);
      render();
    } catch (err) {
      console.error(err);
      alert("No se pudo eliminar (revisá reglas/permisos).");
    }
  }
});

// -------- Guardar edición
btnGuardarEdicion?.addEventListener("click", async () => {
  if (!adminOk) return showError("Sin permisos de administrador.");
  const id = fId.value;
  if (!id) return showError("ID inválido.");

  // Validaciones
  const nombre = (fNombre.value || "").trim();
  const precio = Number(fPrecio.value) || 0;
  const stock  = Number(fStock.value) || 0;
  if (!nombre) return showError("El nombre es obligatorio.");
  if (precio < 0) return showError("El precio no puede ser negativo.");
  if (stock < 0)  return showError("El stock no puede ser negativo.");

  let imagenUrl = (fImgUrl.value || "").trim();
  const file = fImgFile.files?.[0];

  try {
    btnGuardarEdicion.disabled = true;
    btnGuardarEdicion.textContent = "Guardando...";

    // Subida opcional a Cloudinary
    if (file) {
      imagenUrl = await subirACloudinary(file);
      fImgUrl.value = imagenUrl;
    }

    // Categoría: si eligen "Auto", detectamos por nombre/desc
    let categoria = fCategoria.value;
    if (categoria === "Auto") {
      categoria = categoriaPorTexto(nombre) ||
                  categoriaPorTexto(fDescripcion.value || "") ||
                  "Otros";
    }

    const payload = {
      nombre,
      descripcion: (fDescripcion.value || "").trim(),
      precio,
      stock,
      imagen: imagenUrl,
      categoria,
    };

    await updateDoc(doc(db, "productos", id), payload);

    // Actualizar memoria y re-render
    const idx = productosMem.findIndex(p => p.id === id);
    if (idx !== -1) productosMem[idx] = { ...productosMem[idx], ...payload };
    showSuccess("Cambios guardados.");
    modal.hide();
    render();
  } catch (err) {
    console.error(err);
    showError("No se pudo guardar la edición.");
  } finally {
    btnGuardarEdicion.disabled = false;
    btnGuardarEdicion.textContent = "Guardar cambios";
  }
});

// -------- Preview local de imagen
fImgFile?.addEventListener("change", () => {
  const file = fImgFile.files?.[0];
  if (!file) return;
  fPreview.src = URL.createObjectURL(file);
});

// -------- Auth (acciones solo si sos admin) + carga
onAuthStateChanged(auth, async (user) => {
  adminOk = false;
  if (user) {
    try {
      const rol = await getDoc(doc(db, "roles", user.uid));
      adminOk = rol.exists() && rol.data()?.admin === true;
    } catch (e) { adminOk = false; }
  }
  await cargarProductos();
});

// Filtros
buscador?.addEventListener("input", render);
soloStock?.addEventListener("change", render);
