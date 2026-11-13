const { obtenerConexion, sql } = require('../conexion');

class PedidosModel {

    static async cancelarPedido(salesOrderId, customerId) {
        const pool = await obtenerConexion();
        const transaction = new sql.Transaction(pool);
        let transactionFinished = false;

        try {
            await transaction.begin();

            const pedidoResult = await transaction.request()
                .input('SalesOrderID', sql.Int, salesOrderId)
                .input('CustomerID', sql.Int, customerId)
                .query(`
                    SELECT Status
                    FROM SalesLT.SalesOrderHeader WITH (UPDLOCK, ROWLOCK)
                    WHERE SalesOrderID = @SalesOrderID
                        AND CustomerID = @CustomerID;
                `);

            if (pedidoResult.recordset.length === 0) {
                await transaction.rollback();
                transactionFinished = true;
                return { cancelado: false, motivo: 'no-encontrado' };
            }

            if (Number(pedidoResult.recordset[0].Status) !== 1) {
                await transaction.rollback();
                transactionFinished = true;
                return { cancelado: false, motivo: 'no-pendiente' };
            }

            const detallesResult = await transaction.request()
                .input('SalesOrderID', sql.Int, salesOrderId)
                .query(`
                    SELECT ProductID, SUM(CONVERT(INT, OrderQty)) AS Cantidad
                    FROM SalesLT.SalesOrderDetail
                    WHERE SalesOrderID = @SalesOrderID
                    GROUP BY ProductID;
                `);

            if (detallesResult.recordset.length === 0) {
                throw new Error('El pedido no tiene productos para restituir.');
            }

            for (const detalle of detallesResult.recordset) {
                const stockResult = await transaction.request()
                    .input('ProductID', sql.Int, detalle.ProductID)
                    .input('Cantidad', sql.Int, detalle.Cantidad)
                    .query(`
                        UPDATE SalesLT.Product
                        SET Stock = ISNULL(Stock, 0) + @Cantidad
                        OUTPUT INSERTED.ProductID
                        WHERE ProductID = @ProductID;
                    `);

                if (stockResult.recordset.length !== 1) {
                    throw new Error(
                        `No se pudo restituir el stock del producto ${detalle.ProductID}.`
                    );
                }
            }

            const actualizacionResult = await transaction.request()
                .input('SalesOrderID', sql.Int, salesOrderId)
                .query(`
                    UPDATE SalesLT.SalesOrderHeader
                    SET Status = 4,
                        ModifiedDate = GETDATE()
                    WHERE SalesOrderID = @SalesOrderID
                        AND Status = 1;
                `);

            if (actualizacionResult.rowsAffected[0] !== 1) {
                throw new Error('No se pudo actualizar el estado del pedido.');
            }

            await transaction.commit();
            transactionFinished = true;
            return { cancelado: true };
        } catch (error) {
            if (!transactionFinished) {
                try {
                    await transaction.rollback();
                } catch (rollbackError) {
                    console.error('Error al revertir la cancelación del pedido:', rollbackError);
                }
            }

            console.error('Error al cancelar el pedido:', error);
            throw error;
        }
    }

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