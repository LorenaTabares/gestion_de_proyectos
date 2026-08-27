const CatalogoModel = require('../models/catalogoModel');

class CarritoController {

    // =====================================================
    // AGREGAR PRODUCTO AL CARRITO
    // =====================================================

    static agregar(req, res) {

        const productId = parseInt(req.body.productId);

        if (!productId) {
            return res.status(400).send('Producto no válido.');
        }

        if (!req.session.carrito) {
            req.session.carrito = [];
        }

        const productoExistente = req.session.carrito.find(
            producto => producto.productId === productId
        );

        if (productoExistente) {

            productoExistente.cantidad++;

        } else {

            req.session.carrito.push({
                productId: productId,
                cantidad: 1
            });

        }

        console.log('CARRITO ACTUAL:', req.session.carrito);

        res.redirect('/catalogo');
    }

// =====================================================
// ELIMINAR PRODUCTO DEL CARRITO
// =====================================================

static eliminar(req, res) {

    console.log('=================================');
    console.log('INTENTANDO ELIMINAR PRODUCTO');
    console.log('BODY RECIBIDO:', req.body);
    console.log('CARRITO ANTES:', req.session.carrito);
    console.log('=================================');

    const productId = parseInt(req.body.productId);

    if (!productId) {
        return res.status(400).send('Producto no válido.');
    }

    if (!req.session.carrito) {
        return res.redirect('/carrito');
    }

    req.session.carrito = req.session.carrito.filter(
        producto => producto.productId !== productId
    );

    console.log('PRODUCTO ELIMINADO:', productId);
    console.log('CARRITO ACTUAL:', req.session.carrito);

    res.redirect('/carrito');
}

    // =====================================================
    // MOSTRAR CARRITO
    // =====================================================

    static async mostrar(req, res) {

        try {

            const carrito = req.session.carrito || [];

            console.log('CARRITO PARA MOSTRAR:', carrito);

            const productos = [];

            for (const item of carrito) {

                const producto =
                    await CatalogoModel.obtenerProductoPorId(
                        item.productId
                    );

                if (producto) {

                    productos.push({
                        ...producto,
                        cantidad: item.cantidad,
                        subtotal:
                            Number(producto.ListPrice) *
                            item.cantidad
                    });

                }

            }

            const total = productos.reduce(
                (suma, producto) =>
                    suma + producto.subtotal,
                0
            );

            res.render(
                'carrito',
                {
                    productos,
                    total
                }
            );

        } catch (error) {

            console.error(
                'ERROR AL MOSTRAR CARRITO:',
                error
            );

            res.status(500).send(
                'Error al cargar el carrito.'
            );
        }

    }

}

module.exports = CarritoController;
console.log('ARCHIVO CARRITOCONTROLLER CORRECTO');