import { signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-auth.js";
import { mostrarMensaje } from './mostrarMensaje.js';
import { auth } from './firebase.js';

const signInForm = document.querySelector('#login-form');

signInForm.addEventListener('submit', async e => {
  e.preventDefault();

  const email = signInForm['login-email'].value;
  const password = signInForm['login-password'].value;

  try {
    const credentials = await signInWithEmailAndPassword(auth, email, password);
    const user = credentials.user; // ✅ definimos "user"

    console.log("Usuario logueado:", user.email);
    console.log("UID:", user.uid);

    // Cerrar el modal
    const modal = bootstrap.Modal.getInstance(document.querySelector('#signinModal'));
    if (modal) modal.hide();

    // Limpiar el formulario
    signInForm.reset();

    mostrarMensaje("Bienvenido " + user.email + ", ingreso exitoso");

  } catch (error) {
    if (error.code === 'auth/invalid-credential') {
      mostrarMensaje('Credenciales inválidas', "error");
    } else {
      mostrarMensaje(error.message, "error");
    }
  }
});


