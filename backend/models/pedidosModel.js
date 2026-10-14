const { obtenerConexion, sql } = require('../conexion');

class PedidosModel {

    // =====================================================
    // OBTENER TODOS LOS PEDIDOS DE UN CLIENTE CON SUS PRODUCTOS
    // =====================================================
    static async obtenerPedidosPorCliente(customerId) {
        try {
            const pool = await obtenerConexion();

            const query = `
                SELECT 
                    soh.SalesOrderID AS numeroPedido,
                    soh.OrderDate AS fechaPedido,
                    soh.Status AS estadoCodigo,
                    CASE soh.Status
                        WHEN 1 THEN 'Pendiente'
                        WHEN 2 THEN 'En proceso'
                        WHEN 3 THEN 'Despachado'
                        WHEN 4 THEN 'Cancelado'
                        ELSE 'Pendiente'
                    END AS estadoNombre,
                    soh.SubTotal AS subtotal,
                    soh.TaxAmt AS impuesto,
                    soh.Freight AS flete,
                    (soh.SubTotal + soh.TaxAmt + soh.Freight) AS totalPedido,
                    sod.ProductID AS productId,
                    p.Name AS nombreProducto,
                    p.ProductNumber AS codigoProducto,
                    sod.OrderQty AS cantidad,
                    sod.UnitPrice AS precioUnitario,
                    sod.LineTotal AS subtotalLinea
                FROM SalesLT.SalesOrderHeader soh
                INNER JOIN SalesLT.SalesOrderDetail sod 
                    ON soh.SalesOrderID = sod.SalesOrderID
                INNER JOIN SalesLT.Product p 
                    ON sod.ProductID = p.ProductID
                WHERE soh.CustomerID = @CustomerID
                ORDER BY soh.OrderDate DESC, soh.SalesOrderID DESC;
            `;

            const result = await pool.request()
                .input('CustomerID', sql.Int, customerId)
                .query(query);

            // Agrupar los resultados por pedido para facilitar la renderización en EJS
            const pedidosMap = new Map();

            result.recordset.forEach(row => {
                if (!pedidosMap.has(row.numeroPedido)) {
                    pedidosMap.set(row.numeroPedido, {
                        numeroPedido: row.numeroPedido,
                        fechaPedido: row.fechaPedido,
                        estadoCodigo: row.estadoCodigo,
                        estadoNombre: row.estadoNombre,
                        totalPedido: Number(row.totalPedido || 0).toFixed(2),
                        productos: []
                    });
                }

                pedidosMap.get(row.numeroPedido).productos.push({
                    productId: row.productId,
                    nombreProducto: row.nombreProducto,
                    codigoProducto: row.codigoProducto,
                    cantidad: row.cantidad,
                    precioUnitario: Number(row.precioUnitario || 0).toFixed(2),
                    subtotalLinea: Number(row.subtotalLinea || 0).toFixed(2)
                });
            });

            return Array.from(pedidosMap.values());

        } catch (error) {
            console.error('Error al obtener pedidos del cliente:', error);
            throw error;
        }
    }
}

module.exports = PedidosModel;