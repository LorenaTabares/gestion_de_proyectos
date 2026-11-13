const PedidosModel = require('../models/pedidosModel');

class PedidosController {

    static async cancelarPedido(req, res) {
        const salesOrderId = Number(req.params.salesOrderId);

        if (!Number.isInteger(salesOrderId) || salesOrderId <= 0) {
            return res.status(400).send('El número de pedido no es válido.');
        }

        const customerId = Number(req.session?.usuario?.CustomerID);

        if (!Number.isInteger(customerId) || customerId <= 0) {
            return res.status(401).send('No se pudo identificar al cliente.');
        }

        try {
            const resultado = await PedidosModel.cancelarPedido(
                salesOrderId,
                customerId
            );

            if (!resultado.cancelado) {
                const noEncontrado = resultado.motivo === 'no-encontrado';
                return res.status(noEncontrado ? 404 : 409).send(
                    noEncontrado
                        ? 'No se encontró el pedido solicitado.'
                        : 'Solo se pueden cancelar pedidos pendientes.'
                );
            }

            return res.redirect('/mis-pedidos');
        } catch (error) {
            console.error('Error en cancelarPedido:', error);
            return res.status(500).send(
                'No se pudo cancelar el pedido ni restituir el inventario.'
            );
        }
    }

    static async mostrarMisPedidos(req, res) {
        try {
            // Verificar usuario desde sesión
            const customerId = req.session?.usuario?.CustomerID;

            if (!customerId) {
                return res.redirect('/login');
            }

            // Consultar pedidos de la BD
            const pedidos = await PedidosModel.obtenerPedidosPorCliente(customerId);

            // Renderizar la vista
            return res.render('pedidos', {
                pagina: 'pedidos',
                usuario: req.session.usuario,
                pedidos: pedidos
            });

        } catch (error) {
            console.error('Error en mostrarMisPedidos:', error);
            return res.status(500).render('error', {
                message: 'Ocurrió un error al cargar tus pedidos.'
            });
        }
    }
}

module.exports = PedidosController;
