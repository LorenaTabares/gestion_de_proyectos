const { obtenerConexion } = require('../conexion');

class CatalogoModel {

  // =====================================================
  // OBTENER PRODUCTOS PAGINADOS
  // =====================================================

  static async obtenerProductosPaginados(offset, limite) {

    try {

      const pool = await obtenerConexion();

      console.log('Consultando productos...');

      const result = await pool
        .request()
        .input('offset', parseInt(offset))
        .input('limite', parseInt(limite))
        .query(`

          SELECT

            p.ProductID,
            p.Name,
            p.ProductNumber,
            p.Color,
            p.ListPrice,
            p.ProductCategoryID,

            pc.Name AS CategoryName,

            p.ThumbNailPhoto,
            p.ThumbnailPhotoFileName

          FROM SalesLT.Product p

          LEFT JOIN SalesLT.ProductCategory pc
            ON p.ProductCategoryID = pc.ProductCategoryID

          ORDER BY p.ProductID ASC

          OFFSET @offset ROWS
          FETCH NEXT @limite ROWS ONLY;

        `);

      console.log(
        'Productos obtenidos:',
        result.recordset.length
      );

      return result.recordset;

    }

    catch (error) {

      console.error(
        'ERROR SQL OBTENER PRODUCTOS:',
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

      console.log('Consultando total de productos...');

      const result = await pool
        .request()
        .query(`

          SELECT COUNT(*) AS total

          FROM SalesLT.Product;

        `);

      const total =
        result.recordset[0].total;

      console.log(
        'Total de productos:',
        total
      );

      return total;

    }

    catch (error) {

      console.error(
        'ERROR SQL TOTAL PRODUCTOS:',
        error
      );

      throw error;

    }

  }

}

module.exports = CatalogoModel;