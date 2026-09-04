
const CatalogoModel = require('../models/catalogoModel');
const CarritoModel = require('../models/carritoModel');

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

        console.log(
            'CARRITO ACTUAL:',
            req.session.carrito
        );

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

        console.log(
            'PRODUCTO ELIMINADO:',
            productId
        );

        console.log(
            'CARRITO ACTUAL:',
            req.session.carrito
        );

        res.redirect('/carrito');
    }


    // =====================================================
    // MOSTRAR CARRITO
    // =====================================================

    static async mostrar(req, res) {

        try {

            const carrito =
                req.session.carrito || [];

            console.log(
                'CARRITO PARA MOSTRAR:',
                carrito
            );

            const productos = [];

            for (const item of carrito) {

                const producto =
                    await CatalogoModel.obtenerProductoPorId(
                        item.productId
                    );

                if (producto) {

                    productos.push({

                        ...producto,

                        cantidad:
                            item.cantidad,

                        subtotal:
                            Number(producto.ListPrice) *
                            item.cantidad

                    });

                }

            }

            const total =
                productos.reduce(
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


    // =====================================================
    // FINALIZAR COMPRA
    // =====================================================

    static async finalizarCompra(req, res) {

        try {

            const carrito =
                req.session.carrito || [];


            // Verificar que haya productos

            if (carrito.length === 0) {

                return res
                    .status(400)
                    .send('El carrito está vacío.');

            }


            // Obtener CustomerID

            const customerId =
                parseInt(req.body.customerId);


            if (!customerId) {

                return res
                    .status(400)
                    .send(
                        'No se pudo identificar al cliente.'
                    );

            }


            console.log(
                '================================='
            );

            console.log(
                'FINALIZANDO COMPRA'
            );

            console.log(
                'CUSTOMER ID:',
                customerId
            );

            console.log(
                'PRODUCTOS:',
                carrito
            );

            console.log(
                '================================='
            );


            // Crear pedido y detalles

            const salesOrderId =
                await CarritoModel.finalizarCompra(
                    customerId,
                    carrito
                );


            // Vaciar carrito

            req.session.carrito = [];


            console.log(
                'COMPRA FINALIZADA.'
            );

            console.log(
                'PEDIDO:',
                salesOrderId
            );


            // Mostrar mensaje

            res.send(`

                <script>

                    alert(
                        'Compra realizada correctamente. Pedido #${salesOrderId}'
                    );

                    window.location.href =
                        '/catalogo';

                </script>

            `);

        } catch (error) {

            console.error(
                'ERROR AL FINALIZAR COMPRA:',
                error
            );

            res
                .status(500)
                .send(
                    'No se pudo finalizar la compra.'
                );
        }

    }

}


// =====================================================
// EXPORTAR CONTROLADOR
// =====================================================

module.exports = CarritoController;

console.log(
    'ARCHIVO CARRITOCONTROLLER CORRECTO'
);

