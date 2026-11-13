
const { obtenerConexion } = require('../conexion');

class DashboardModel {

    static async obtenerDatosDashboard() {
        const pool = await obtenerConexion();

        // 1. Total de productos
        const productos = await pool.request().query(`
            SELECT COUNT(*) AS TotalProductos
            FROM SalesLT.Product;
        `);

        // 2. Total de clientes
        const clientes = await pool.request().query(`
            SELECT COUNT(*) AS TotalClientes
            FROM SalesLT.Customer;
        `);

        // 3. Total de pedidos
        const pedidos = await pool.request().query(`
            SELECT COUNT(*) AS TotalPedidos
            FROM SalesLT.SalesOrderHeader;
        `);

        // 4. Ingresos sin pedidos cancelados
        const ingresos = await pool.request().query(`
            SELECT
                ISNULL(SUM(TotalDue), 0) AS IngresosTotales
            FROM SalesLT.SalesOrderHeader
            WHERE Status <> 4;
        `);

        // 5. Los cinco productos más vendidos
        const productosMasVendidos = await pool.request().query(`
            SELECT TOP 5
                p.ProductID,
                p.Name AS NombreProducto,
                SUM(d.OrderQty) AS CantidadVendida
            FROM SalesLT.SalesOrderDetail d
            INNER JOIN SalesLT.Product p
                ON d.ProductID = p.ProductID
            GROUP BY p.ProductID, p.Name
            ORDER BY SUM(d.OrderQty) DESC;
        `);

        // 6. Cantidad de pedidos por estado
        const pedidosPorEstado = await pool.request().query(`
            SELECT
                Status,
                COUNT(*) AS TotalPedidos
            FROM SalesLT.SalesOrderHeader
            GROUP BY Status
            ORDER BY Status;
        `);

        return {
            totalProductos: productos.recordset[0]?.TotalProductos || 0,
            totalClientes: clientes.recordset[0]?.TotalClientes || 0,
            totalPedidos: pedidos.recordset[0]?.TotalPedidos || 0,
            ingresosTotales: ingresos.recordset[0]?.IngresosTotales || 0,
            productosMasVendidos: productosMasVendidos.recordset || [],
            pedidosPorEstado: pedidosPorEstado.recordset || []
        };
    }
}

module.exports = DashboardModel;
