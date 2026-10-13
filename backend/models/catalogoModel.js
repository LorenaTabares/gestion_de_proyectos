
const { obtenerConexion } = require('../conexion');

class CatalogoModel {

  // =====================================================
  // OBTENER PRODUCTOS PAGINADOS
  // =====================================================
  static async obtenerProductosPaginados(offset, limite) {
    try {
      const pool = await obtenerConexion();

      const result = await pool.request()
        .input('offset', parseInt(offset, 10))
        .input('limite', parseInt(limite, 10))
        .query(`
                    SELECT
                        p.ProductID,
                        p.Name,
                        p.ProductNumber,
                        p.Color,
                        p.ListPrice,
                        p.ProductCategoryID,
                        ISNULL(p.Stock, 0) AS Stock,
                        pc.Name AS CategoryName,
                        p.ThumbNailPhoto,
                        p.ThumbnailPhotoFileName
                    FROM SalesLT.Product AS p
                    LEFT JOIN SalesLT.ProductCategory AS pc
                        ON p.ProductCategoryID = pc.ProductCategoryID
                    ORDER BY p.ProductID ASC
                    OFFSET @offset ROWS
                    FETCH NEXT @limite ROWS ONLY;
                `);

      return result.recordset;

    } catch (error) {
      console.error(
        'ERROR SQL OBTENER PRODUCTOS:',
        error
      );
      throw error;
    }
  }

  // =====================================================
  // OBTENER UN PRODUCTO POR ID
  // Utilizado por el carrito y otras vistas.
  // IMPORTANTE: ahora incluye Stock.
  // =====================================================

  static async obtenerProductoPorId(productId) {
    try {
      const id = Number(productId);

      if (!Number.isInteger(id) || id <= 0) {
        return null;
      }

      const pool = await obtenerConexion();

      const result = await pool.request()
        .input('productId', id)
        .query(`
                SELECT
                    p.ProductID,
                    p.Name,
                    p.ProductNumber,
                    p.Color,
                    p.ListPrice,
                    p.ProductCategoryID,
                    ISNULL(p.Stock, 0) AS Stock,
                    pc.Name AS CategoryName,
                    p.ThumbNailPhoto,
                    p.ThumbnailPhotoFileName
                FROM SalesLT.Product AS p
                LEFT JOIN SalesLT.ProductCategory AS pc
                    ON p.ProductCategoryID = pc.ProductCategoryID
                WHERE p.ProductID = @productId;
            `);

      const producto = result.recordset[0] || null;

      console.log('[CATÁLOGO] Producto consultado:', {
        productId: id,
        stock: producto?.Stock
      });

      return producto;

    } catch (error) {
      console.error(
        '[CATÁLOGO] Error al consultar producto:',
        error
      );
      throw error;
    }
  }


  // =====================================================
  // OBTENER TOTAL DE PRODUCTOS
  // =====================================================
  static async obtenerTotalProductos() {
    try {
      const pool = await obtenerConexion();

      const result = await pool.request().query(`
                SELECT COUNT(*) AS total
                FROM SalesLT.Product;
            `);

      return result.recordset[0].total;

    } catch (error) {
      console.error(
        'ERROR SQL TOTAL PRODUCTOS:',
        error
      );
      throw error;
    }
  }

  // =====================================================
  // OBTENER DETALLE COMPLETO DE UN PRODUCTO
  // =====================================================
  static async obtenerDetalleProducto(productId) {
    try {
      const pool = await obtenerConexion();

      const result = await pool.request()
        .input('productId', parseInt(productId, 10))
        .query(`
                    SELECT
                        p.ProductID,
                        p.Name,
                        p.ProductNumber,
                        p.Color,
                        p.ListPrice,
                        p.Size,
                        p.Weight,
                        ISNULL(p.Stock, 0) AS Stock,
                        p.ProductCategoryID,
                        pc.Name AS CategoryName,
                        pd.Description
                    FROM SalesLT.Product AS p
                    LEFT JOIN SalesLT.ProductCategory AS pc
                        ON p.ProductCategoryID = pc.ProductCategoryID
                    LEFT JOIN SalesLT.ProductModelProductDescription AS pmpd
                        ON p.ProductModelID = pmpd.ProductModelID
                        AND pmpd.Culture = 'en'
                    LEFT JOIN SalesLT.ProductDescription AS pd
                        ON pmpd.ProductDescriptionID =
                           pd.ProductDescriptionID
                    WHERE p.ProductID = @productId;
                `);

      return result.recordset[0] || null;

    } catch (error) {
      console.error(
        'ERROR SQL OBTENER DETALLE DE PRODUCTO:',
        error
      );
      throw error;
    }
  }
}

module.exports = CatalogoModel;
