// public/js/adminAgregarProducto.js
import { db, auth } from "./firebase.js";
import {
  collection,
  addDoc,
  serverTimestamp,
  doc,
  getDoc,
} from "https://www.gstatic.com/firebasejs/11.9.1/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-auth.js";

/* ========= Cloudinary ========= */
const CLOUD_NAME = "dr1efbpsk";
const UPLOAD_PRESET = "MotoStore";

async function subirACloudinary(file) {
  const fd = new FormData();
  fd.append("file", file);
  fd.append("upload_preset", UPLOAD_PRESET);

  const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/upload`, {
    method: "POST",
    body: fd,
  });
  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`Cloudinary ${res.status}: ${txt || "falló la subida"}`);
  }
  const data = await res.json();
  return data.secure_url; // URL final
}

/* ========= DOM ========= */
// Estos ids existen en tu HTML:
const form          = document.getElementById("form-agregar-producto"); // :contentReference[oaicite:2]{index=2}
const nombreEl      = document.getElementById("nombre");                // :contentReference[oaicite:3]{index=3}
const descripcionEl = document.getElementById("descripcion");           // :contentReference[oaicite:4]{index=4}
const precioEl      = document.getElementById("precio");                // :contentReference[oaicite:5]{index=5}
const stockEl       = document.getElementById("stock");                 // :contentReference[oaicite:6]{index=6}
const imagenInput   = document.getElementById("imagen");                // :contentReference[oaicite:7]{index=7}
const exitoBox      = document.getElementById("mensaje-exito");         // :contentReference[oaicite:8]{index=8}
const alertaBox     = document.getElementById("alerta");                // (lo agregás vos en el HTML)

/* ========= Helpers UI ========= */
function showError(msg) {
  console.error(msg);
  if (exitoBox) exitoBox.classList.add("d-none");
  if (alertaBox) {
    alertaBox.textContent = msg;
    alertaBox.classList.remove("d-none");
  } else {
    alert(msg);
  }
}

function hideError() {
  if (alertaBox) alertaBox.classList.add("d-none");
}

function showSuccess(msg = "Producto guardado correctamente.") {
  if (alertaBox) alertaBox.classList.add("d-none");
  if (exitoBox) {
    exitoBox.textContent = msg;
    exitoBox.classList.remove("d-none");
  }
}

/* ========= Detección simple de categoría (por texto) ========= */
function categoriaPorTexto(texto = "") {
  const t = texto.toLowerCase();
  if (t.includes("campera") || t.includes("camperón") || t.includes("camperon") || t.includes("chaqueta") || t.includes("jacket")) return "Camperas";
  if (t.includes("casco") || t.includes("helmet")) return "Cascos";
  if (t.includes("antiparra") || t.includes("goggle") || t.includes("lente")) return "Antiparras";
  if (t.includes("guante") || t.includes("glove")) return "Guantes";
  if (t.includes("bota") || t.includes("botín") || t.includes("botin") || t.includes("boot")) return "Botas";
  return null;
}
function detectarCategoria({ nombre, descripcion }) {
  return (
    categoriaPorTexto(nombre) ||
    categoriaPorTexto(descripcion) ||
    "Otros"
  );
}

/* ========= Gate de autenticación (solo admin) ========= */
let adminOk = false;
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    showError("Debés iniciar sesión como administrador.");
    window.location.href = "../../index.html";
    return;
  }
  try {
    const rolSnap = await getDoc(doc(db, "roles", user.uid));
    adminOk = rolSnap.exists() && rolSnap.data()?.admin === true;
  } catch (e) {
    adminOk = false;
  }
  if (!adminOk) {
    showError("No tenés permisos de administrador.");
    window.location.href = "../../index.html";
  }
});

/* ========= Submit del formulario ========= */
if (form) {
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    hideError();
    if (!adminOk) {
      showError("No tenés permisos de administrador.");
      return;
    }

    const nombre      = (nombreEl?.value || "").trim();
    const descripcion = (descripcionEl?.value || "").trim();
    const precio      = Number(precioEl?.value) || 0;
    const stock       = Number(stockEl?.value) || 0;
    const archivo     = imagenInput?.files?.[0];

    if (!nombre || !descripcion) return showError("Completá nombre y descripción.");
    if (precio <= 0)               return showError("Ingresá un precio válido.");
    if (stock < 0)                 return showError("El stock no puede ser negativo.");
    if (!archivo)                  return showError("Seleccioná una imagen.");

    // UI: bloquear botón mientras trabajamos
    const submitBtn = form.querySelector('button[type="submit"]');
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = "Guardando...";
    }

    try {
      // 1) Subir imagen
      const imagenUrl = await subirACloudinary(archivo);

      // 2) Determinar categoría automáticamente
      const categoria = detectarCategoria({ nombre, descripcion });

      // 3) Guardar en Firestore
      await addDoc(collection(db, "productos"), {
        nombre,
        descripcion,
        precio,
        stock,
        imagen: imagenUrl,
        categoria,
        creadoEn: serverTimestamp(),
      });

      form.reset();
      showSuccess("Producto guardado correctamente.");
    } catch (err) {
      console.error(err);
      showError("No se pudo guardar el producto. Intentá de nuevo.");
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = "Guardar Producto";
      }
    }
  });
}

/* ========= (Opcional) Preview local de la imagen ========= */
imagenInput?.addEventListener("change", () => {
  const f = imagenInput.files?.[0];
  if (!f) return;
  // Si en tu HTML agregás <img id="preview-agregar" ...>, lo actualizamos:
  const prev = document.getElementById("preview-agregar");
  if (prev) prev.src = URL.createObjectURL(f);
});
