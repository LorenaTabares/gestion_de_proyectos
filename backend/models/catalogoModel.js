const { obtenerConexion, sql } = require('../conexion');

class CatalogoModel {

  // =====================================================
  // OBTENER PRODUCTOS PAGINADOS (ORIGINAL - SIN CAMBIOS)
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
      console.error('ERROR SQL OBTENER PRODUCTOS:', error);
      throw error;
    }
  }

  // =====================================================
  // OBTENER UN PRODUCTO POR ID (ORIGINAL - SIN CAMBIOS)
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

      return result.recordset[0] || null;

    } catch (error) {
      console.error('[CATÁLOGO] Error al consultar producto:', error);
      throw error;
    }
  }

  // =====================================================
  // OBTENER TOTAL DE PRODUCTOS (ORIGINAL - SIN CAMBIOS)
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
      console.error('ERROR SQL TOTAL PRODUCTOS:', error);
      throw error;
    }
  }

  // =====================================================
  // OBTENER DETALLE COMPLETO DE UN PRODUCTO (ORIGINAL)
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
              ON pmpd.ProductDescriptionID = pd.ProductDescriptionID
          WHERE p.ProductID = @productId;
        `);

      return result.recordset[0] || null;

    } catch (error) {
      console.error('ERROR SQL OBTENER DETALLE DE PRODUCTO:', error);
      throw error;
    }
  }

  // =====================================================
  // NUEVO: OBTENER CATEGORÍAS PARA EL FILTRO
  // =====================================================
  static async obtenerCategorias() {
    try {
      const pool = await obtenerConexion();
      const result = await pool.request().query(`
        SELECT DISTINCT
          pc.ProductCategoryID,
          pc.Name AS NombreCategoria
        FROM SalesLT.ProductCategory pc
        INNER JOIN SalesLT.Product p ON pc.ProductCategoryID = p.ProductCategoryID
        ORDER BY pc.Name ASC;
      `);
      return result.recordset;
    } catch (error) {
      console.error('ERROR SQL OBTENER CATEGORÍAS:', error);
      throw error;
    }
  }

  // =====================================================
  // NUEVO: OBTENER PRODUCTOS FILTRADOS Y PAGINADOS
  // =====================================================
  static async obtenerProductosFiltrados({ nombre, categoria, orden, offset, limite }) {
    try {
      const pool = await obtenerConexion();

      let whereClause = ' WHERE 1 = 1 ';
      if (nombre && nombre.trim() !== '') {
        whereClause += ' AND LOWER(p.Name) LIKE LOWER(@nombre) ';
      }
      if (categoria && categoria !== 'todas' && categoria !== '') {
        whereClause += ' AND p.ProductCategoryID = @categoria ';
      }

      let orderByClause = ' ORDER BY p.ProductID ASC ';
      if (orden === 'precio_desc') {
        orderByClause = ' ORDER BY p.ListPrice DESC, p.Name ASC ';
      }

      // 1. Contar total de resultados filtrados
      const countRequest = pool.request();
      if (nombre && nombre.trim() !== '') {
        countRequest.input('nombre', sql.VarChar, `%${nombre.trim()}%`);
      }
      if (categoria && categoria !== 'todas' && categoria !== '') {
        countRequest.input('categoria', sql.Int, parseInt(categoria, 10));
      }

      const countResult = await countRequest.query(`
        SELECT COUNT(*) AS total
        FROM SalesLT.Product AS p
        ${whereClause};
      `);
      const total = countResult.recordset[0].total;

      // 2. Obtener productos filtrados y paginados con sus columnas de imagen
      const dataRequest = pool.request()
        .input('offset', sql.Int, parseInt(offset, 10))
        .input('limite', sql.Int, parseInt(limite, 10));

      if (nombre && nombre.trim() !== '') {
        dataRequest.input('nombre', sql.VarChar, `%${nombre.trim()}%`);
      }
      if (categoria && categoria !== 'todas' && categoria !== '') {
        dataRequest.input('categoria', sql.Int, parseInt(categoria, 10));
      }

      const dataResult = await dataRequest.query(`
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
        ${whereClause}
        ${orderByClause}
        OFFSET @offset ROWS
        FETCH NEXT @limite ROWS ONLY;
      `);

      return {
        productosRaw: dataResult.recordset,
        totalProductos: total
      };
    } catch (error) {
      console.error('ERROR SQL FILTRAR PRODUCTOS:', error);
      throw error;
    }
  }
}

module.exports = CatalogoModel;
