document.addEventListener("DOMContentLoaded", () => {
  const form = document.querySelector(".form-contacto");
  const mensajeExito = document.createElement("p");
  const mensajeError = document.createElement("p");

  mensajeExito.id = "mensaje-envio";
  mensajeError.id = "mensaje-error";

  form.appendChild(mensajeExito);
  form.appendChild(mensajeError);

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const nombre = document.getElementById("nombre").value.trim();
    const apellido=document.getElementById("apellido").value.trim();
    const email = document.getElementById("email").value.trim();
    const mensaje = document.getElementById("mensaje").value.trim();

    mensajeExito.textContent = "";
    mensajeError.textContent = "";

    if (!nombre || !email || !mensaje) {
      mensajeError.textContent = "Por favor, completá todos los campos.";
      return;
    }

    const emailValido = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    if (!emailValido) {
      mensajeError.textContent = "El email ingresado no es válido.";
      return;
    }

    mensajeExito.textContent = "Formulario enviado correctamente. (simulado)";
    form.reset();
  });
});
