import { db, auth } from "./firebase.js";
import {
  doc,
  setDoc,
  getDoc,
} from "https://www.gstatic.com/firebasejs/11.9.1/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-auth.js";

const form = document.getElementById("formAdmin");
const mensaje = document.getElementById("mensaje");
const adminContent = document.getElementById("admin-content");

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    alert("Debés iniciar sesión.");
    window.location.href = "../../index.html";
    return;
  }

  const rolRef = doc(db, "roles", user.uid);
  const rolSnap = await getDoc(rolRef);

  if (rolSnap.exists() && rolSnap.data().admin === true) {
    adminContent.classList.remove("oculto");
  } else {
    alert("Solo administradores pueden asignar roles.");
    window.location.href = "../../index.html";
  }
});

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const uid = document.getElementById("uid").value.trim();

  if (!uid) {
    mensaje.innerHTML = `<div class="alert alert-danger">⚠️ Ingresá un UID válido.</div>`;
    return;
  }

  try {
    await setDoc(doc(db, "roles", uid), { admin: true });
    mensaje.innerHTML = `<div class="alert alert-success">✅ UID <code>${uid}</code> ahora es administrador.</div>`;
    form.reset();
  } catch (error) {
    console.error("Error:", error);
    mensaje.innerHTML = `<div class="alert alert-danger">❌ Error al asignar rol: ${error.message}</div>`;
  }
});
