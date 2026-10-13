
document.addEventListener('DOMContentLoaded', () => {
    const detalle = document.getElementById('detalle-producto');
    const formulario = document.getElementById('form-agregar-carrito');

    if (!detalle || !formulario) {
        console.error(
            '[DETALLE] No se encontró el producto o el formulario.'
        );
        return;
    }

    const btnMenos = document.getElementById('btn-menos');
    const btnMas = document.getElementById('btn-mas');
    const inputCantidad = document.getElementById('cantidad-input');
    const btnAgregar = document.getElementById('btn-agregar');
    const stockBadge = document.getElementById('stock-badge');
    const mensaje = document.getElementById('mensaje-cantidad');

    if (
        !btnMenos ||
        !btnMas ||
        !inputCantidad ||
        !btnAgregar ||
        !stockBadge ||
        !mensaje
    ) {
        console.error(
            '[DETALLE] Faltan elementos requeridos en productoDetalle.ejs.'
        );
        return;
    }

    const productId = Number(detalle.dataset.productId);
    let stock = Number(detalle.dataset.stock);
    let cantidad = stock > 0 ? 1 : 0;

    if (
        !Number.isInteger(productId) ||
        productId <= 0 ||
        !Number.isInteger(stock) ||
        stock < 0
    ) {
        btnAgregar.disabled = true;
        mensaje.textContent =
            'No se pudo leer el producto o su inventario.';
        console.error('[DETALLE] Datos inválidos:', {
            productId,
            stock
        });
        return;
    }

    function actualizarVista() {
        const agotado = stock === 0;
        const pocasUnidades = stock > 0 && stock <= 3;

        cantidad = agotado
            ? 0
            : Math.max(1, Math.min(cantidad, stock));

        inputCantidad.value = cantidad;
        inputCantidad.max = stock;

        btnMenos.disabled = agotado || cantidad <= 1;
        btnMas.disabled = agotado || cantidad >= stock;
        btnAgregar.disabled = agotado;

        stockBadge.classList.remove(
            'disponible',
            'stock-bajo',
            'agotado'
        );

        if (agotado) {
            stockBadge.classList.add('agotado');
            stockBadge.textContent = '✖ Agotado (0 unidades en stock)';
            btnAgregar.textContent = 'Producto Agotado';
            mensaje.textContent = 'No hay unidades disponibles.';
        } else if (pocasUnidades) {
            stockBadge.classList.add('stock-bajo');
            stockBadge.textContent =
                `⚠️ ¡Quedan pocas unidades! (${stock} en stock)`;
            btnAgregar.textContent = 'Agregar al Carrito';
            mensaje.textContent = `Puedes elegir hasta ${stock} unidades.`;
        } else {
            stockBadge.classList.add('disponible');
            stockBadge.textContent =
                `✔ Disponible (${stock} unidades en stock)`;
            btnAgregar.textContent = 'Agregar al Carrito';
            mensaje.textContent = `Puedes elegir hasta ${stock} unidades.`;
        }
    }

    btnMenos.addEventListener('click', () => {
        if (cantidad > 1) {
            cantidad -= 1;
            actualizarVista();
        }
    });

    btnMas.addEventListener('click', () => {
        if (cantidad < stock) {
            cantidad += 1;
            actualizarVista();
        } else {
            mensaje.textContent = `Solo hay ${stock} unidades disponibles.`;
        }
    });

    formulario.addEventListener('submit', async event => {
        event.preventDefault();

        if (stock <= 0 || cantidad < 1 || cantidad > stock) {
            actualizarVista();
            return;
        }

        btnAgregar.disabled = true;
        btnAgregar.textContent = 'Agregando...';

        try {
            console.log('[DETALLE] Enviando al carrito:', {
                productId,
                cantidad
            });

            const response = await fetch('/carrito/agregar', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({
                    productId,
                    cantidad
                })
            });

            const data = await response.json();

            if (!response.ok || !data.success) {
                mensaje.textContent =
                    data.message || 'No se pudo agregar el producto.';

                if (
                    Number.isInteger(data.stockDisponible) &&
                    data.stockDisponible >= 0
                ) {
                    stock = data.stockDisponible;
                    detalle.dataset.stock = String(stock);
                }

                return;
            }

            mensaje.textContent = data.message;
            window.alert(data.message);

        } catch (error) {
            console.error('[DETALLE] Error de conexión:', error);
            mensaje.textContent =
                'No fue posible conectar con el servidor.';
        } finally {
            actualizarVista();
        }
    });

    actualizarVista();
});
