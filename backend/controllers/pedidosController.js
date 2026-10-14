const PedidosModel = require('../models/pedidosModel');

class PedidosController {

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


