const { obtenerConexion, sql } = require('../conexion');

class InventarioModel {

    // =====================================================
    // OBTENER TODOS LOS PEDIDOS CON SUS PRODUCTOS
    // =====================================================
    static async obtenerPedidos() {
        try {
            const pool = await obtenerConexion();

            const result = await pool.request().query(`
                SELECT 
                    h.SalesOrderID,
                    CONVERT(VARCHAR(10), h.OrderDate, 120) AS OrderDate,
                    h.Status,
                    d.ProductID,
                    d.OrderQty,
                    p.Name,
                    p.ProductNumber
                FROM SalesLT.SalesOrderHeader h
                INNER JOIN SalesLT.SalesOrderDetail d 
                    ON h.SalesOrderID = d.SalesOrderID
                INNER JOIN SalesLT.Product p 
                    ON d.ProductID = p.ProductID
                ORDER BY h.OrderDate DESC, h.SalesOrderID DESC;
            `);

            // Mapear y agrupar los detalles de productos por cada Pedido
            const pedidosMap = new Map();

            result.recordset.forEach(row => {
                if (!pedidosMap.has(row.SalesOrderID)) {
                    pedidosMap.set(row.SalesOrderID, {
                        SalesOrderID: row.SalesOrderID,
                        OrderDate: row.OrderDate,
                        Status: row.Status,
                        productos: []
                    });
                }

                pedidosMap.get(row.SalesOrderID).productos.push({
                    ProductID: row.ProductID,
                    Name: row.Name,
                    ProductNumber: row.ProductNumber,
                    OrderQty: row.OrderQty
                });
            });

            // Convertir el Map a un array de pedidos
            return Array.from(pedidosMap.values());

        } catch (error) {
            console.error('ERROR SQL OBTENER PEDIDOS INVENTARIO:', error);
            throw error;
        }
    }


    // =====================================================
    // ACTUALIZAR ESTADO DEL PEDIDO
    // =====================================================
    static async actualizarEstadoPedido(salesOrderID, status) {
        try {
            const pool = await obtenerConexion();

            await pool
                .request()
                .input('salesOrderID', sql.Int, salesOrderID)
                .input('status', sql.TinyInt, status)
                .query(`
                    UPDATE SalesLT.SalesOrderHeader
                    SET Status = @status,
                        ModifiedDate = GETDATE()
                    WHERE SalesOrderID = @salesOrderID;
                `);

            return true;

        } catch (error) {
            console.error('ERROR SQL ACTUALIZAR ESTADO PEDIDO:', error);
            throw error;
        }
    }

}

module.exports = InventarioModel;