const { obtenerConexion, sql } = require('../conexion');
const CatalogoModel = require('./catalogoModel');

class CarritoModel {

    // =====================================================
    // OBTENER PRODUCTO POR ID
    // =====================================================
    static async obtenerProducto(productId) {
        return await CatalogoModel.obtenerProductoPorId(productId);
    }

    // =====================================================
    // OBTENER CARRITO PERSISTENTE DE LA BASE DE DATOS
    // =====================================================
    static async obtenerCarritoDeBD(customerId) {
        try {
            const pool = await obtenerConexion();
            const result = await pool.request()
                .input('CustomerID', sql.Int, customerId)
                .query(`
                    SELECT ProductID as productId, Cantidad as cantidad
                    FROM SalesLT.CarritoItem
                    WHERE CustomerID = @CustomerID
                `);
            return result.recordset;
        } catch (error) {
            console.error('Error al obtener carrito de la BD:', error);
            return [];
        }
    }

    // =====================================================
    // GUARDAR O ACTUALIZAR ÍTEM DEL CARRITO EN LA BD
    // =====================================================
    static async guardarCarritoEnBD(customerId, carrito) {
        try {
            const pool = await obtenerConexion();
            
            // Limpiamos la lista previa del cliente para guardar el estado actual
            await pool.request()
                .input('CustomerID', sql.Int, customerId)
                .query('DELETE FROM SalesLT.CarritoItem WHERE CustomerID = @CustomerID');

            // Insertamos cada producto del carrito activo
            for (const item of carrito) {
                await pool.request()
                    .input('CustomerID', sql.Int, customerId)
                    .input('ProductID', sql.Int, item.productId)
                    .input('Cantidad', sql.Int, item.cantidad)
                    .query(`
                        INSERT INTO SalesLT.CarritoItem (CustomerID, ProductID, Cantidad)
                        VALUES (@CustomerID, @ProductID, @Cantidad)
                    `);
            }
        } catch (error) {
            console.error('Error al guardar carrito en la BD:', error);
        }
    }

    // =====================================================
    // VACIAR CARRITO EN LA BD
    // =====================================================
    static async limpiarCarritoDeBD(customerId) {
        try {
            const pool = await obtenerConexion();
            await pool.request()
                .input('CustomerID', sql.Int, customerId)
                .query('DELETE FROM SalesLT.CarritoItem WHERE CustomerID = @CustomerID');
        } catch (error) {
            console.error('Error al limpiar carrito en BD:', error);
        }
    }

    // =====================================================
    // FINALIZAR COMPRA (REGISTRAR PEDIDO EN ADVENTUREWORKS)
    // =====================================================
    static async finalizarCompra(customerId, carrito) {
        const pool = await obtenerConexion();
        const transaction = new sql.Transaction(pool);

        try {
            await transaction.begin();

            // 1. Calcular el total acumulado
            let subtotalTotal = 0;
            const detallesItems = [];

            for (const item of carrito) {
                const producto = await CatalogoModel.obtenerProductoPorId(item.productId);
                if (!producto) {
                    throw new Error(`El producto con ID ${item.productId} no existe.`);
                }

                const unitPrice = Number(producto.ListPrice || 0);
                const lineTotal = unitPrice * item.cantidad;
                subtotalTotal += lineTotal;

                detallesItems.push({
                    productId: item.productId,
                    cantidad: item.cantidad,
                    unitPrice: unitPrice
                });
            }

            // 2. Crear cabecera del pedido (SalesOrderHeader)
            const pedidoResult = await transaction.request()
                .input('CustomerID', sql.Int, customerId)
                .input('SubTotal', sql.Money, subtotalTotal)
                .input('TaxAmt', sql.Money, subtotalTotal * 0.08) // 8% estimado de impuesto
                .input('Freight', sql.Money, 10.00) // Valor estimado de flete
                .query(`
                    INSERT INTO SalesLT.SalesOrderHeader (
                        OrderDate,
                        DueDate,
                        Status,
                        OnlineOrderFlag,
                        CustomerID,
                        ShipMethod,
                        SubTotal,
                        TaxAmt,
                        Freight
                    )
                    VALUES (
                        GETDATE(),
                        DATEADD(DAY, 7, GETDATE()),
                        1,
                        1,
                        @CustomerID,
                        'CARGO TRANSPORT',
                        @SubTotal,
                        @TaxAmt,
                        @Freight
                    );

                    SELECT SCOPE_IDENTITY() AS SalesOrderID;
                `);

            const salesOrderId = pedidoResult.recordset[0].SalesOrderID;

            // 3. Insertar detalle de productos (SalesOrderDetail)
            for (const item of detallesItems) {
                await transaction.request()
                    .input('SalesOrderID', sql.Int, salesOrderId)
                    .input('OrderQty', sql.SmallInt, item.cantidad)
                    .input('ProductID', sql.Int, item.productId)
                    .input('UnitPrice', sql.Money, item.unitPrice)
                    .input('UnitPriceDiscount', sql.Money, 0)
                    .query(`
                        INSERT INTO SalesLT.SalesOrderDetail (
                            SalesOrderID,
                            OrderQty,
                            ProductID,
                            UnitPrice,
                            UnitPriceDiscount
                        )
                        VALUES (
                            @SalesOrderID,
                            @OrderQty,
                            @ProductID,
                            @UnitPrice,
                            @UnitPriceDiscount
                        );
                    `);
            }

            // 4. Confirmar la transacción
            await transaction.commit();

            // 5. Limpiar carrito guardado en la BD
            await this.limpiarCarritoDeBD(customerId);

            return salesOrderId;

        } catch (error) {
            console.error('ERROR AL FINALIZAR COMPRA:', error);
            try {
                await transaction.rollback();
            } catch (rollbackError) {
                console.error('ERROR EN ROLLBACK:', rollbackError);
            }
            throw error;
        }
    }
}

module.exports = CarritoModel;