const CatalogoModel = require('../models/catalogoModel');
const CarritoModel = require('../models/carritoModel');

class CarritoController {

    // =====================================================
    // AGREGAR PRODUCTO AL CARRITO
    // =====================================================
    static agregar(req, res) {
        const productId = parseInt(req.body.productId);

        if (!productId) {
            if (req.xhr || (req.headers.accept && req.headers.accept.indexOf('json') > -1)) {
                return res.status(400).json({ success: false, message: 'Producto no válido.' });
            }
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

        console.log('CARRITO ACTUALIZADO:', req.session.carrito);

        if (req.xhr || (req.headers.accept && req.headers.accept.indexOf('json') > -1)) {
            return res.json({ 
                success: true, 
                message: 'Producto agregado al carrito.',
                totalItems: req.session.carrito.reduce((acc, p) => acc + p.cantidad, 0)
            });
        }

        res.redirect('/catalogo');
    }

    // =====================================================
    // ELIMINAR PRODUCTO DEL CARRITO
    // =====================================================
    static eliminar(req, res) {
        const productId = parseInt(req.body.productId);

        if (!productId) {
            if (req.xhr || (req.headers.accept && req.headers.accept.indexOf('json') > -1)) {
                return res.status(400).json({ success: false, message: 'Producto no válido.' });
            }
            return res.status(400).send('Producto no válido.');
        }

        if (!req.session.carrito) {
            return res.redirect('/carrito');
        }

        req.session.carrito = req.session.carrito.filter(
            producto => producto.productId !== productId
        );

        console.log('PRODUCTO ELIMINADO DEL CARRITO:', productId);

        if (req.xhr || (req.headers.accept && req.headers.accept.indexOf('json') > -1)) {
            return res.json({ success: true, message: 'Producto eliminado del carrito.' });
        }

        res.redirect('/carrito');
    }

    // =====================================================
    // MOSTRAR CARRITO
    // =====================================================
    static async mostrar(req, res) {
        try {
            const carrito = req.session.carrito || [];
            const productos = [];

            for (const item of carrito) {
                const producto = await CatalogoModel.obtenerProductoPorId(item.productId);

                if (producto) {
                    productos.push({
                        ...producto,
                        cantidad: item.cantidad,
                        subtotal: Number(producto.ListPrice || 0) * item.cantidad
                    });
                }
            }

            const total = productos.reduce(
                (suma, producto) => suma + producto.subtotal,
                0
            );

            // Se agrega 'pagina: carrito' para la integración con navbar.ejs
            res.render('carrito', {
                productos,
                total,
                pagina: 'carrito'
            });

        } catch (error) {
            console.error('ERROR AL MOSTRAR CARRITO:', error);
            res.status(500).send('Error al cargar el carrito.');
        }
    }

    // =====================================================
    // FINALIZAR COMPRA
    // =====================================================
    static async finalizarCompra(req, res) {
        try {
            const carrito = req.session.carrito || [];

            // 1. Verificar que haya productos en el carrito
            if (carrito.length === 0) {
                if (req.xhr || (req.headers.accept && req.headers.accept.indexOf('json') > -1)) {
                    return res.status(400).json({ success: false, message: 'El carrito está vacío.' });
                }
                return res.status(400).send('El carrito está vacío.');
            }

            // 2. OBTENER CustomerID SEGURAMENTE DESDE LA SESIÓN
            const usuario = req.session.usuario;
            const customerId = usuario ? parseInt(usuario.CustomerID) : null;

            if (!customerId) {
                if (req.xhr || (req.headers.accept && req.headers.accept.indexOf('json') > -1)) {
                    return res.status(401).json({ 
                        success: false, 
                        message: 'Debes iniciar sesión para finalizar la compra.',
                        redirectUrl: '/login' 
                    });
                }
                return res.redirect('/login');
            }

            console.log('=================================');
            console.log('FINALIZANDO COMPRA');
            console.log('CUSTOMER ID:', customerId);
            console.log('PRODUCTOS:', carrito);
            console.log('=================================');

            // 3. Crear pedido y guardar en la BD
            const salesOrderId = await CarritoModel.finalizarCompra(
                customerId,
                carrito
            );

            // 4. Vaciar carrito de la sesión
            req.session.carrito = [];

            console.log('COMPRA FINALIZADA CON ÉXITO. PEDIDO #', salesOrderId);

            // Respuesta si es petición AJAX / Fetch
            if (req.xhr || (req.headers.accept && req.headers.accept.indexOf('json') > -1)) {
                return res.status(200).json({
                    success: true,
                    message: `Compra realizada correctamente. Pedido #${salesOrderId}`,
                    salesOrderId,
                    redirectUrl: '/catalogo'
                });
            }

            // Respuesta para navegación tradicional
            return res.send(`
                <script>
                    alert('Compra realizada correctamente. Pedido #${salesOrderId}');
                    window.location.href = '/catalogo';
                </script>
            `);

        } catch (error) {
            console.error('ERROR AL FINALIZAR COMPRA:', error);
            
            if (req.xhr || (req.headers.accept && req.headers.accept.indexOf('json') > -1)) {
                return res.status(500).json({ success: false, message: 'No se pudo finalizar la compra.' });
            }
            
            res.status(500).send('No se pudo finalizar la compra.');
        }
    }
}

module.exports = CarritoController;