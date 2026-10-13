const { obtenerConexion, sql } = require('../conexion');

class ReportesModel {
    static async obtenerPedidos(filtros) {
        const pool = await obtenerConexion();
        const result = await pool
            .request()
            .input('status', sql.TinyInt, filtros.status)
            .input('cliente', sql.NVarChar(100), filtros.cliente || null)
            .input('salesOrderID', sql.Int, filtros.salesOrderID)
            .query(`
                SELECT
                    h.SalesOrderID,
                    h.CustomerID,
                    c.FirstName,
                    c.LastName,
                    CONVERT(VARCHAR(10), h.OrderDate, 103) AS OrderDate,
                    h.Status
                FROM SalesLT.SalesOrderHeader h
                INNER JOIN SalesLT.Customer c
                    ON h.CustomerID = c.CustomerID
                WHERE (@status IS NULL OR h.Status = @status)
                    AND (@cliente IS NULL OR CONCAT(c.FirstName, ' ', c.LastName) LIKE N'%' + @cliente + N'%')
                    AND (@salesOrderID IS NULL OR h.SalesOrderID = @salesOrderID)
                ORDER BY h.OrderDate DESC, h.SalesOrderID DESC;

                SELECT Status, COUNT_BIG(*) AS Total
                FROM SalesLT.SalesOrderHeader
                GROUP BY Status;

                SELECT DISTINCT c.CustomerID, c.FotoPerfil
                FROM SalesLT.SalesOrderHeader h
                INNER JOIN SalesLT.Customer c
                    ON h.CustomerID = c.CustomerID
                WHERE (@status IS NULL OR h.Status = @status)
                    AND (@cliente IS NULL OR CONCAT(c.FirstName, ' ', c.LastName) LIKE N'%' + @cliente + N'%')
                    AND (@salesOrderID IS NULL OR h.SalesOrderID = @salesOrderID)
                    AND c.FotoPerfil IS NOT NULL;
            `);

        return {
            pedidos: result.recordsets[0],
            conteos: result.recordsets[1],
            fotosClientes: result.recordsets[2]
        };
    }
}

module.exports = ReportesModel;