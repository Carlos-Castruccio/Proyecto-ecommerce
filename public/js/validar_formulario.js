document.addEventListener("DOMContentLoaded", () => {
  const form = document.querySelector(".form-contacto");
  const mensajeExito = document.createElement("p");
  const mensajeError = document.createElement("p");

  mensajeExito.id = "mensaje-envio";
  mensajeError.id = "mensaje-error";

  form.appendChild(mensajeExito);
  form.appendChild(mensajeError);

  // Inicializar EmailJS
  emailjs.init("XjCZDXlsP9SikwhSu"); // Reemplazar con tu clave pública de EmailJS

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const nombre = document.getElementById("nombre").value.trim();
    const apellido = document.getElementById("apellido").value.trim();
    const email = document.getElementById("email").value.trim();
    const mensaje = document.getElementById("mensaje").value.trim();

    mensajeExito.textContent = "";
    mensajeError.textContent = "";

    if (!nombre || !apellido || !email || !mensaje) {
      mensajeError.textContent = "Por favor, completá todos los campos.";
      return;
    }

    const emailValido = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    if (!emailValido) {
      mensajeError.textContent = "El email ingresado no es válido.";
      return;
    }

    // Mostrar mensaje de carga
    mensajeExito.textContent = "Enviando mensaje...";
    mensajeExito.style.color = "#007bff";

    // Parámetros del email
    const templateParams = {
      from_name: `${nombre} ${apellido}`,
      from_email: email,
      message: mensaje,
      to_email: "motostore1977@gmail.com"
    };

    // Enviar email usando EmailJS
    emailjs.send("service_fel0i5k", "template_zloebxv", templateParams)
      .then((response) => {
        console.log("Email enviado exitosamente:", response);
        mensajeExito.textContent = "¡Mensaje enviado correctamente! Te responderemos pronto.";
        mensajeExito.style.color = "#28a745";
        mensajeError.textContent = "";
        form.reset();
      })
      .catch((error) => {
        console.error("Error al enviar email:", error);
        mensajeError.textContent = "Error al enviar el mensaje. Por favor, intentá nuevamente.";
        mensajeExito.textContent = "";
      });
  });
});
