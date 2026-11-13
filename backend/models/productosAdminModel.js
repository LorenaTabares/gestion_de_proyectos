
const { obtenerConexion, sql } = require('../conexion');

// Productos antiguos que deben aparecer inicialmente en la administración.
const IDS_PRODUCTOS_INICIALES = [
    680, 706, 707, 708, 709, 710, 711,
    712, 713, 714, 715, 716, 717, 718, 719
];

class ProductosAdminModel {

    // ==========================================
    // OBTENER PRODUCTOS ADMINISTRABLES
    // ==========================================
    static async obtenerTodos() {
        const pool = await obtenerConexion();

        const request = pool.request();

        const parametros = IDS_PRODUCTOS_INICIALES.map(
            (id, indice) => {
                request.input(`id${indice}`, sql.Int, id);
                return `@id${indice}`;
            }
        );

        const condicionIds = parametros.length
            ? `p.ProductID IN (${parametros.join(', ')})`
            : '1 = 0';

        const resultado = await request.query(`
            SELECT
                p.ProductID,
                p.Name,
                p.ProductNumber,
                p.ListPrice,
                ISNULL(p.Stock, 0) AS Stock,
                ISNULL(p.StockQty, 0) AS StockQty,
                p.ProductCategoryID,
                pc.Name AS CategoryName,
                p.ThumbNailPhoto,
                p.ThumbnailPhotoFileName
            FROM SalesLT.Product AS p
            LEFT JOIN SalesLT.ProductCategory AS pc
                ON p.ProductCategoryID = pc.ProductCategoryID
            WHERE
                ${condicionIds}
                OR p.ProductNumber LIKE 'ADM-%'
            ORDER BY p.ProductID DESC;
        `);

        return resultado.recordset;
    }

    // ==========================================
    // OBTENER UN PRODUCTO POR ID
    // ==========================================
    static async obtenerPorId(productId) {
        const pool = await obtenerConexion();

        const resultado = await pool.request()
            .input('ProductID', sql.Int, productId)
            .query(`
                SELECT
                    p.ProductID,
                    p.Name,
                    p.ProductNumber,
                    p.ListPrice,
                    ISNULL(p.Stock, 0) AS Stock,
                    ISNULL(p.StockQty, 0) AS StockQty,
                    p.ProductCategoryID,
                    pc.Name AS CategoryName,
                    p.ThumbNailPhoto,
                    p.ThumbnailPhotoFileName
                FROM SalesLT.Product AS p
                LEFT JOIN SalesLT.ProductCategory AS pc
                    ON p.ProductCategoryID = pc.ProductCategoryID
                WHERE p.ProductID = @ProductID
                  AND (
                      p.ProductID IN (
                          680, 706, 707, 708, 709, 710, 711,
                          712, 713, 714, 715, 716, 717, 718, 719
                      )
                      OR p.ProductNumber LIKE 'ADM-%'
                  );
            `);

        return resultado.recordset[0] || null;
    }

    // ==========================================
    // OBTENER CATEGORÍAS
    // ==========================================
    static async obtenerCategorias() {
        const pool = await obtenerConexion();

        const resultado = await pool.request().query(`
            SELECT
                ProductCategoryID,
                Name
            FROM SalesLT.ProductCategory
            ORDER BY Name ASC;
        `);

        return resultado.recordset;
    }

    // ==========================================
    // CREAR PRODUCTO
    // ==========================================
    static async crear(datos, imagen) {
        const pool = await obtenerConexion();

        const productNumber = `ADM-${Date.now()}`;

        const resultado = await pool.request()
            .input('Name', sql.NVarChar(50), datos.nombre)
            .input('ProductNumber', sql.NVarChar(25), productNumber)
            .input('ListPrice', sql.Money, datos.precio)
            .input('Stock', sql.Int, datos.stock)
            .input('StockQty', sql.Int, datos.stock)
            .input('ProductCategoryID', sql.Int, datos.categoria)
            .input(
                'ThumbNailPhoto',
                sql.VarBinary(sql.MAX),
                imagen.buffer
            )
            .input(
                'ThumbnailPhotoFileName',
                sql.NVarChar(50),
                imagen.nombre
            )
            .query(`
                INSERT INTO SalesLT.Product (
                    Name,
                    ProductNumber,
                    StandardCost,
                    ListPrice,
                    ProductCategoryID,
                    SellStartDate,
                    Stock,
                    StockQty,
                    ThumbNailPhoto,
                    ThumbnailPhotoFileName
                )
                OUTPUT INSERTED.ProductID
                VALUES (
                    @Name,
                    @ProductNumber,
                    0,
                    @ListPrice,
                    @ProductCategoryID,
                    GETDATE(),
                    @Stock,
                    @StockQty,
                    @ThumbNailPhoto,
                    @ThumbnailPhotoFileName
                );
            `);

        return resultado.recordset[0].ProductID;
    }

    // ==========================================
    // ACTUALIZAR PRODUCTO
    // ==========================================
    static async actualizar(productId, datos, imagen) {
        const pool = await obtenerConexion();

        const request = pool.request()
            .input('ProductID', sql.Int, productId)
            .input('Name', sql.NVarChar(50), datos.nombre)
            .input('ListPrice', sql.Money, datos.precio)
            .input('Stock', sql.Int, datos.stock)
            .input('StockQty', sql.Int, datos.stock)
            .input('ProductCategoryID', sql.Int, datos.categoria);

        let consultaImagen = '';

        if (imagen) {
            request
                .input(
                    'ThumbNailPhoto',
                    sql.VarBinary(sql.MAX),
                    imagen.buffer
                )
                .input(
                    'ThumbnailPhotoFileName',
                    sql.NVarChar(50),
                    imagen.nombre
                );

            consultaImagen = `,
                ThumbNailPhoto = @ThumbNailPhoto,
                ThumbnailPhotoFileName = @ThumbnailPhotoFileName`;
        }

        const resultado = await request.query(`
            UPDATE SalesLT.Product
            SET
                Name = @Name,
                ListPrice = @ListPrice,
                Stock = @Stock,
                StockQty = @StockQty,
                ProductCategoryID = @ProductCategoryID,
                ModifiedDate = GETDATE()
                ${consultaImagen}
            OUTPUT INSERTED.ProductID
            WHERE ProductID = @ProductID
              AND (
                  ProductID IN (
                      680, 706, 707, 708, 709, 710, 711,
                      712, 713, 714, 715, 716, 717, 718, 719
                  )
                  OR ProductNumber LIKE 'ADM-%'
              );
        `);

        return resultado.recordset[0] || null;
    }

    // ==========================================
    // ELIMINAR PRODUCTO
    // ==========================================
    static async eliminar(productId) {
        const pool = await obtenerConexion();

        const resultado = await pool.request()
            .input('ProductID', sql.Int, productId)
            .query(`
                DELETE FROM SalesLT.Product
                WHERE ProductID = @ProductID
                  AND (
                      ProductID IN (
                          680, 706, 707, 708, 709, 710, 711,
                          712, 713, 714, 715, 716, 717, 718, 719
                      )
                      OR ProductNumber LIKE 'ADM-%'
                  );
            `);

        return resultado.rowsAffected[0] > 0;
    }
}

module.exports = ProductosAdminModel;
