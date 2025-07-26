export async function cargarProductos() {
  try {
    const respuesta = await fetch("data/productos.json");
    const productos = await respuesta.json();

    const container = document.getElementById("productos-container");
    container.innerHTML = "";

    productos.forEach(producto => {
      const card = document.createElement("div");
      card.classList.add("producto-card");

      card.innerHTML = `
        <img src="${producto.imagen}" alt="${producto.nombre}">
        <h2>${producto.nombre}</h2>
        <p class="precio">$${producto.precio}</p>
        <button data-id="${producto.id}" class="btn-agregar">Agregar al carrito</button>
      `;

      container.appendChild(card);
    });
  } catch (error) {
    console.error("Error al cargar productos:", error);
  }
}
