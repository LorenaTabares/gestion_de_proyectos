const DashboardModel = require('../models/dashboardModel');

class DashboardController {

    static async mostrarDashboard(req, res) {
        try {
            const datos = await DashboardModel.obtenerDatosDashboard();

            res.render('dashboard', {
                ...datos,
                pagina: 'dashboard'
            });

        } catch (error) {
            console.error('Error al cargar el dashboard:', error);

            res.status(500).render('dashboard', {
                totalProductos: 0,
                totalClientes: 0,
                totalPedidos: 0,
                ingresosTotales: 0,
                productosMasVendidos: [],
                pedidosPorEstado: [],
                pagina: 'dashboard',
                errorCarga: true
            });
        }
    }
}

module.exports = DashboardController;