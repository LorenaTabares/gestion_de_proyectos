
const CatalogoModel = require('../models/catalogoModel');
const CarritoModel = require('../models/carritoModel');

class CarritoController {

    // =====================================================
    // AGREGAR PRODUCTO AL CARRITO
    // =====================================================

    static async agregar(req, res) {
        const aceptaJSON =
            (req.headers.accept || '').includes('application/json') ||
            req.xhr === true;

        const responderError = (status, message, extra = {}) => {
            if (aceptaJSON) {
                return res.status(status).json({
                    success: false,
                    message,
                    ...extra
                });
            }

            return res.status(status).send(message);
        };

        try {
            const productId = Number(req.body.productId);
            const cantidad = Number(req.body.cantidad ?? 1);

            if (
                !Number.isInteger(productId) ||
                productId <= 0 ||
                !Number.isInteger(cantidad) ||
                cantidad <= 0
            ) {
                return responderError(
                    400,
                    'El producto o la cantidad no son válidos.'
                );
            }

            const producto =
                await CatalogoModel.obtenerProductoPorId(productId);

            if (!producto) {
                return responderError(404, 'El producto no existe.');
            }

            const stockDisponible = Number(producto.Stock);

            console.log('[CARRITO] Validación de inventario:', {
                productId,
                stockRecibidoDelModelo: producto.Stock,
                stockDisponible,
                cantidadSolicitada: cantidad
            });

            if (
                !Number.isInteger(stockDisponible) ||
                stockDisponible < 0
            ) {
                return responderError(
                    500,
                    'El servidor no pudo leer correctamente el stock.'
                );
            }

            if (stockDisponible === 0) {
                return responderError(
                    400,
                    'El producto está agotado.',
                    { stockDisponible }
                );
            }

            if (!req.session.carrito) {
                req.session.carrito = [];
            }

            const carrito = req.session.carrito;

            const existente = carrito.find(
                item => Number(item.productId) === productId
            );

            const cantidadActual = existente
                ? Number(existente.cantidad)
                : 0;

            const nuevaCantidad = cantidadActual + cantidad;

            if (nuevaCantidad > stockDisponible) {
                return responderError(
                    400,
                    `Solo hay ${stockDisponible} unidades disponibles. ` +
                    `Ya tienes ${cantidadActual} en el carrito.`,
                    {
                        stockDisponible,
                        cantidadEnCarrito: cantidadActual
                    }
                );
            }

            if (existente) {
                existente.cantidad = nuevaCantidad;
            } else {
                carrito.push({
                    productId,
                    cantidad
                });
            }

            return req.session.save(error => {
                if (error) {
                    console.error(
                        '[CARRITO] Error al guardar la sesión:',
                        error
                    );

                    return responderError(
                        500,
                        'No se pudo guardar el producto en el carrito.'
                    );
                }

                const totalItems = carrito.reduce(
                    (total, item) => total + Number(item.cantidad),
                    0
                );

                console.log('[CARRITO] Producto agregado:', {
                    productId,
                    cantidadEnCarrito: nuevaCantidad,
                    totalItems
                });

                if (aceptaJSON) {
                    return res.status(200).json({
                        success: true,
                        message: 'Producto agregado correctamente al carrito.',
                        stockDisponible,
                        cantidadEnCarrito: nuevaCantidad,
                        totalItems
                    });
                }

                // El formulario normal del catálogo vuelve al catálogo.
                return res.redirect('/catalogo');
            });

        } catch (error) {
            console.error('[CARRITO] Error al agregar:', error);

            return responderError(
                500,
                'Ocurrió un error al agregar el producto al carrito.'
            );
        }
    }


    // =====================================================
    // MOSTRAR CARRITO
    // =====================================================
    static async mostrar(req, res) {
        try {
            const carrito = req.session.carrito || [];
            const productos = [];

            for (const item of carrito) {
                const producto =
                    await CatalogoModel.obtenerProductoPorId(
                        item.productId
                    );

                if (producto) {
                    productos.push({
                        ...producto,
                        cantidad: Number(item.cantidad),
                        subtotal:
                            Number(producto.ListPrice || 0) *
                            Number(item.cantidad)
                    });
                }
            }

            const total = productos.reduce(
                (suma, producto) => suma + producto.subtotal,
                0
            );

            return res.render('carrito', {
                productos,
                total,
                pagina: 'carrito'
            });

        } catch (error) {
            console.error('ERROR AL MOSTRAR EL CARRITO:', error);

            return res.status(500).send(
                'Error al cargar el carrito.'
            );
        }
    }

    // =====================================================
    // ELIMINAR PRODUCTO DEL CARRITO
    // =====================================================
    static eliminar(req, res) {
        const productId = Number(req.body.productId);

        if (!Number.isInteger(productId) || productId <= 0) {
            return res.status(400).json({
                success: false,
                message: 'El producto no es válido.'
            });
        }

        if (!req.session.carrito) {
            return res.redirect('/carrito');
        }

        const carritoAnterior = req.session.carrito;

        req.session.carrito = carritoAnterior.filter(
            item => Number(item.productId) !== productId
        );

        return req.session.save(error => {
            if (error) {
                console.error(
                    'ERROR AL GUARDAR EL CARRITO:',
                    error
                );

                req.session.carrito = carritoAnterior;

                return res.status(500).json({
                    success: false,
                    message: 'No se pudo eliminar el producto.'
                });
            }

            return res.redirect('/carrito');
        });
    }

    // =====================================================
    // FINALIZAR COMPRA
    // =====================================================
    static async finalizarCompra(req, res) {
        const aceptaJSON =
            req.xhr ||
            (req.headers.accept || '').includes('application/json');

        try {
            const carrito = req.session.carrito || [];

            if (carrito.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'El carrito está vacío.'
                });
            }

            const usuario = req.session.usuario;
            const customerId = usuario
                ? Number(usuario.CustomerID)
                : null;

            if (
                !Number.isInteger(customerId) ||
                customerId <= 0
            ) {
                if (aceptaJSON) {
                    return res.status(401).json({
                        success: false,
                        message: 'Debes iniciar sesión para comprar.',
                        redirectUrl: '/login'
                    });
                }

                return res.redirect('/login');
            }

            const salesOrderId =
                await CarritoModel.finalizarCompra(
                    customerId,
                    carrito
                );

            req.session.carrito = [];

            return req.session.save(error => {
                if (error) {
                    console.error(
                        'ERROR AL GUARDAR LA SESIÓN DE COMPRA:',
                        error
                    );

                    return res.status(500).json({
                        success: false,
                        compraRegistrada: true,
                        salesOrderId,
                        message:
                            `El pedido #${salesOrderId} se registró, ` +
                            'pero no se pudo actualizar la sesión.'
                    });
                }

                if (aceptaJSON) {
                    return res.json({
                        success: true,
                        message:
                            `Compra realizada correctamente. ` +
                            `Pedido #${salesOrderId}`,
                        salesOrderId,
                        redirectUrl: '/catalogo'
                    });
                }

                return res.redirect('/catalogo');
            });

        } catch (error) {
            console.error('ERROR AL FINALIZAR COMPRA:', error);

            const mensaje =
                error.message || 'No se pudo finalizar la compra.';

            return res.status(400).json({
                success: false,
                message: mensaje
            });
        }
    }
}

module.exports = CarritoController;
