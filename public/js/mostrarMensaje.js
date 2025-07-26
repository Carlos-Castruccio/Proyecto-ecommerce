
export function mostrarMensaje(message, type="success") {
  // Mostrar un mensaje de bienvenida al usuario
        Toastify({
                text: message,
                duration: 5000,
                destination: "https://github.com/apvarun/toastify-js",
                newWindow: true,
                close: true,
                gravity: "top", // `top` or `bottom`
                position: "left", // `left`, `center` or `right`
                stopOnFocus: true, // Prevents dismissing of toast on hover
                style: {
                        background: type === "success" ? "green" : "red",
                        },
                onClick: function () {}, // Callback after click
                }).showToast();
                }