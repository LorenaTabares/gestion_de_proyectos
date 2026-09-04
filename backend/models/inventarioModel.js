const sql = require('mssql/msnodesqlv8');

const config = {
  connectionString:
    `Driver={${process.env.DB_DRIVER}};` +
    `Server=${process.env.DB_SERVER};` +
    `Database=${process.env.DB_DATABASE};` +
    `Trusted_Connection=yes;`
};

let poolPromise = null;

const obtenerPool = async () => {
  if (!poolPromise) {
    poolPromise = sql.connect(config).catch(error => {
      poolPromise = null;
      throw error;
    });
  }

  return poolPromise;
};


// ==========================================
// OBTENER PEDIDOS
// ==========================================
const obtenerPedidos = async () => {

  const pool = await obtenerPool();

  const result = await pool.request().query(`
    SELECT
      h.SalesOrderID,
      CONVERT(varchar(10), h.OrderDate, 103) AS OrderDate,
      h.Status,

      d.SalesOrderDetailID,
      d.OrderQty,

      p.ProductID,
      p.Name,
      p.ProductNumber

    FROM SalesLT.SalesOrderHeader AS h

    INNER JOIN SalesLT.SalesOrderDetail AS d
      ON h.SalesOrderID = d.SalesOrderID

    INNER JOIN SalesLT.Product AS p
      ON d.ProductID = p.ProductID

    WHERE
      h.SalesOrderID IN (
        71946,
        71935,
        71923,
        71920,
        71917
      )
      OR h.OrderDate >= DATEFROMPARTS(YEAR(GETDATE()), 1, 1)

    ORDER BY
      h.SalesOrderID DESC,
      d.SalesOrderDetailID ASC
  `);

  return result.recordset;
};


// ==========================================
// CAMBIAR ESTADO DEL PEDIDO
// ==========================================
const cambiarEstado = async (salesOrderID, nuevoEstado) => {

  const pool = await obtenerPool();

  const result = await pool.request()

    .input(
      'SalesOrderID',
      sql.Int,
      salesOrderID
    )

    .input(
      'Status',
      sql.TinyInt,
      nuevoEstado
    )

    .query(`
      UPDATE SalesLT.SalesOrderHeader

      SET
        Status = @Status,
        ModifiedDate = GETDATE()

      WHERE
        SalesOrderID = @SalesOrderID
    `);

  return result.rowsAffected[0] || 0;
};


module.exports = {
  obtenerPedidos,
  cambiarEstado
};