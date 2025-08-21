// public/js/productos.js
import { db } from "./firebase.js";
import { collection, getDocs, doc, getDoc } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-firestore.js";
import { agregarAlCarrito } from "./carrito.js";

const contenedorProductos = document.getElementById("contenedor-productos");
const productosRef = collection(db, "productos");

// ---------- Orden deseado de categorías ----------
const ORDEN_CATEGORIAS = ["Camperas", "Cascos", "Antiparras", "Guantes", "Botas"];
const ordenMap = new Map(ORDEN_CATEGORIAS.map((c, i) => [c.toLowerCase(), i]));

// ---------- Helpers de categoría ----------
function capitalizar(s) {
  if (!s) return s;
  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
}

function extraerCategoriaDeDescripcion(desc = "") {
  // Ej.: "Accesorio para moto-Guantes" → "Guantes"
  const m = desc.match(/[-–—]\s*([\p{L}\s]{3,})$/u);
  return m ? capitalizar(m[1].trim()) : null;
}

function categoriaPorNombre(nombre = "") {
  const n = nombre.toLowerCase();
  if (n.includes("campera") || n.includes("chaqueta")) return "Camperas";
  if (n.includes("casco")) return "Cascos";
  if (n.includes("antiparra") || n.includes("goggle") || n.includes("lente")) return "Antiparras";
  if (n.includes("guante")) return "Guantes";
  if (n.includes("bota") || n.includes("botín") || n.includes("botin")) return "Botas";
  return null;
}

function detectarCategoria(p) {
  const directa = p.categoria ?? p.categoría ?? p.tipo ?? p.rubro;
  if (typeof directa === "string" && directa.trim()) return capitalizar(directa.trim());
  const deDesc = extraerCategoriaDeDescripcion(p.descripcion || p.detalle || "");
  if (deDesc) return deDesc;
  const deNombre = categoriaPorNombre(p.nombre || "");
  if (deNombre) return deNombre;
  return "Otros";
}
// ------------------------------------------------

async function mostrarProductos() {
  try {
    const snapshot = await getDocs(productosRef);

    // Construyo lista en memoria con categoría detectada
    const productos = [];
    snapshot.forEach((docSnap) => {
      const p = docSnap.data();
      productos.push({
        id: docSnap.id,
        nombre: p.nombre,
        descripcion: p.descripcion || "",
        precio: Number(p.precio) || 0,
        stock: Number(p.stock) || 0,
        imagen: p.imagen || "",
        categoria: detectarCategoria(p),
      });
    });

    // Ordenar por categoría deseada y luego por nombre
    productos.sort((a, b) => {
      const ai = ordenMap.get((a.categoria || "otros").toLowerCase()) ?? 999;
      const bi = ordenMap.get((b.categoria || "otros").toLowerCase()) ?? 999;
      if (ai !== bi) return ai - bi;
      return String(a.nombre).localeCompare(String(b.nombre));
    });

    // Render
    contenedorProductos.innerHTML = "";
    const idx = new Map(productos.map((p) => [p.id, p]));

    productos.forEach((producto) => {
      const card = document.createElement("div");
      card.classList.add("card", "m-2");
      card.style.width = "18rem";
      card.innerHTML = `
        <img src="${producto.imagen}" class="card-img-top" alt="${producto.nombre}">
        <div class="card-body">
          <h5 class="card-title">${producto.nombre}</h5>
          <p class="card-text">${producto.descripcion}</p>
          <p class="card-text"><strong>Precio:</strong> $${producto.precio}</p>
          <p class="card-text"><strong>Stock:</strong> ${producto.stock}</p>
          <button class="btn btn-primary btn-agregar" data-id="${producto.id}">Agregar al carrito</button>
        </div>
      `;
      contenedorProductos.appendChild(card);
    });

    // Delegación de eventos para "Agregar al carrito"
    contenedorProductos.addEventListener("click", async (e) => {
      const btn = e.target.closest(".btn-agregar");
      if (!btn) return;

      const id = btn.getAttribute("data-id");
      // Usamos el producto ya cargado y ordenado; si no aparece, fallback a Firestore
      let p = idx.get(id);
      if (!p) {
        const ref = doc(db, "productos", id);
        const snap = await getDoc(ref);
        if (!snap.exists()) return alert("El producto ya no está disponible.");
        const d = snap.data();
        p = {
          id: snap.id,
          nombre: d.nombre,
          precio: Number(d.precio) || 0,
          stock: Number(d.stock) || 0,
          imagen: d.imagen || "",
          categoria: detectarCategoria(d),
        };
      }

      agregarAlCarrito(p);
    });
  } catch (error) {
    console.error("Error al mostrar productos:", error);
    contenedorProductos.innerHTML = "<p class='text-danger'>Error al cargar productos.</p>";
  }
}

mostrarProductos();
