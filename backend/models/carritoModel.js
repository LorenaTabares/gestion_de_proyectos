const { obtenerConexion, sql } = require('../conexion');
const CatalogoModel = require('./catalogoModel');

class CarritoModel {

    // =====================================================
    // OBTENER PRODUCTO
    // =====================================================

    static async obtenerProducto(productId) {

        return await CatalogoModel.obtenerProductoPorId(productId);

    }


    // =====================================================
    // FINALIZAR COMPRA
    // =====================================================

    static async finalizarCompra(customerId, carrito) {

        const pool = await obtenerConexion();

        const transaction = new sql.Transaction(pool);

        try {

            await transaction.begin();


            // =================================================
            // CREAR PEDIDO
            // =================================================

            const pedido = await transaction
                .request()

                .input(
                    'CustomerID',
                    sql.Int,
                    customerId
                )

                .input(
                    'SubTotal',
                    sql.Money,
                    0
                )

                .input(
                    'TaxAmt',
                    sql.Money,
                    0
                )

                .input(
                    'Freight',
                    sql.Money,
                    0
                )

                .query(`

                    INSERT INTO SalesLT.SalesOrderHeader
                    (
                        OrderDate,
                        DueDate,
                        Status,
                        OnlineOrderFlag,
                        CustomerID,
                        ShipToAddressID,
                        BillToAddressID,
                        ShipMethod,
                        SubTotal,
                        TaxAmt,
                        Freight
                    )

                    VALUES
                    (
                        GETDATE(),
                        DATEADD(DAY, 7, GETDATE()),
                        1,
                        1,
                        @CustomerID,
                        NULL,
                        NULL,
                        'STANDARD',
                        @SubTotal,
                        @TaxAmt,
                        @Freight
                    );

                    SELECT SCOPE_IDENTITY() AS SalesOrderID;

                `);


            const salesOrderId =
                pedido.recordset[0].SalesOrderID;


            // =================================================
            // AGREGAR PRODUCTOS DEL CARRITO
            // Y DISMINUIR STOCK
            // =================================================

            let subtotal = 0;


            for (const item of carrito) {

                const producto =
                    await CatalogoModel.obtenerProductoPorId(
                        item.productId
                    );


                if (!producto) {

                    throw new Error(
                        `Producto ${item.productId} no encontrado`
                    );

                }


                const unitPrice =
                    Number(producto.ListPrice);


                const lineTotal =
                    unitPrice * item.cantidad;


                subtotal += lineTotal;


                // =================================================
                // INSERTAR PRODUCTO EN EL PEDIDO
                // =================================================

                await transaction
                    .request()

                    .input(
                        'SalesOrderID',
                        sql.Int,
                        salesOrderId
                    )

                    .input(
                        'OrderQty',
                        sql.SmallInt,
                        item.cantidad
                    )

                    .input(
                        'ProductID',
                        sql.Int,
                        item.productId
                    )

                    .input(
                        'UnitPrice',
                        sql.Money,
                        unitPrice
                    )

                    .input(
                        'UnitPriceDiscount',
                        sql.Money,
                        0
                    )

                    .query(`

                        INSERT INTO SalesLT.SalesOrderDetail
                        (
                            SalesOrderID,
                            OrderQty,
                            ProductID,
                            UnitPrice,
                            UnitPriceDiscount
                        )

                        VALUES
                        (
                            @SalesOrderID,
                            @OrderQty,
                            @ProductID,
                            @UnitPrice,
                            @UnitPriceDiscount
                        );

                    `);


                // =================================================
                // DISMINUIR STOCK
                // =================================================

                const stockResult = await transaction
                    .request()

                    .input(
                        'ProductID',
                        sql.Int,
                        item.productId
                    )

                    .input(
                        'Cantidad',
                        sql.Int,
                        item.cantidad
                    )

                    .query(`

                        UPDATE SalesLT.Product

                        SET Stock = Stock - @Cantidad

                        WHERE ProductID = @ProductID
                          AND Stock >= @Cantidad;

                        SELECT @@ROWCOUNT AS FilasActualizadas;

                    `);


                // =================================================
                // COMPROBAR QUE HABÍA STOCK SUFICIENTE
                // =================================================

                const filasActualizadas =
                    stockResult.recordset[0].FilasActualizadas;


                if (filasActualizadas === 0) {

                    throw new Error(
                        `Stock insuficiente para el producto ${item.productId}`
                    );

                }

            }


            // =================================================
            // ACTUALIZAR SUBTOTAL
            // =================================================

            await transaction
                .request()

                .input(
                    'SalesOrderID',
                    sql.Int,
                    salesOrderId
                )

                .input(
                    'SubTotal',
                    sql.Money,
                    subtotal
                )

                .query(`

                    UPDATE SalesLT.SalesOrderHeader

                    SET
                        SubTotal = @SubTotal,
                        ModifiedDate = GETDATE()

                    WHERE SalesOrderID = @SalesOrderID;

                `);


            // =================================================
            // CONFIRMAR COMPRA
            // =================================================

            await transaction.commit();


            return salesOrderId;


        } catch (error) {

            console.error(
                'ERROR AL FINALIZAR COMPRA:',
                error
            );


            try {

                await transaction.rollback();

            } catch (rollbackError) {

                console.error(
                    'ERROR AL HACER ROLLBACK:',
                    rollbackError
                );

            }


            throw error;

        }

    }

}


module.exports = CarritoModel;
