
const { obtenerConexion, sql } = require('../conexion');

class InventarioModel {

    // =====================================================
    // OBTENER TODOS LOS PEDIDOS CON PRODUCTOS Y UBICACIONES
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
                    p.ProductNumber,
                    ISNULL(p.Stock, 0) AS Stock,

                    u.LocationID,
                    u.Nombre AS Zona,
                    u.Pasillo,
                    u.Estante,
                    u.Bin

                FROM SalesLT.SalesOrderHeader h

                INNER JOIN SalesLT.SalesOrderDetail d
                    ON h.SalesOrderID = d.SalesOrderID

                INNER JOIN SalesLT.Product p
                    ON d.ProductID = p.ProductID

                LEFT JOIN dbo.ProductoUbicacion pu
                    ON p.ProductID = pu.ProductID

                LEFT JOIN dbo.Ubicacion u
                    ON pu.LocationID = u.LocationID

                ORDER BY
                    h.OrderDate DESC,
                    h.SalesOrderID DESC,
                    p.ProductID,
                    u.LocationID;
            `);

            const pedidosMap = new Map();

            result.recordset.forEach(row => {

                if (!pedidosMap.has(row.SalesOrderID)) {
                    pedidosMap.set(row.SalesOrderID, {
                        SalesOrderID: row.SalesOrderID,
                        OrderDate: row.OrderDate,
                        Status: row.Status,
                        productos: [],
                        productosMap: new Map()
                    });
                }

                const pedido = pedidosMap.get(row.SalesOrderID);

                if (!pedido.productosMap.has(row.ProductID)) {

                    pedido.productosMap.set(row.ProductID, {
                        ProductID: row.ProductID,
                        Name: row.Name,
                        ProductNumber: row.ProductNumber,
                        OrderQty: row.OrderQty,
                        Stock: row.Stock,
                        ubicaciones: []
                    });

                }

                const producto = pedido.productosMap.get(row.ProductID);

                // Agregar las ubicaciones del producto
                if (row.LocationID !== null) {

                    producto.ubicaciones.push({
                        LocationID: row.LocationID,
                        Zona: row.Zona,
                        Pasillo: row.Pasillo,
                        Estante: row.Estante,
                        Bin: row.Bin
                    });

                }

            });

            // Convertir los Map en arreglos
            return Array.from(pedidosMap.values()).map(pedido => {

                pedido.productos = Array.from(
                    pedido.productosMap.values()
                );

                delete pedido.productosMap;

                return pedido;

            });

        } catch (error) {

            console.error(
                'ERROR SQL OBTENER PEDIDOS INVENTARIO:',
                error
            );

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

            console.error(
                'ERROR SQL ACTUALIZAR ESTADO PEDIDO:',
                error
            );

            throw error;
        }
    }

}

module.exports = InventarioModel;
