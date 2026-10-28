
const { obtenerConexion, sql } = require('../conexion');

class UsuariosModel {

    // ==========================================
    // OBTENER LOS 50 USUARIOS MÁS RECIENTES
    // ==========================================
    static async obtenerTodos() {
        const pool = await obtenerConexion();

        const resultado = await pool.request().query(`
            SELECT TOP (50)
                CustomerID,
                FirstName,
                LastName,
                EmailAddress,
                FechaRegistro,
                COALESCE(
                    NULLIF(LTRIM(RTRIM(Rol)), ''),
                    'cliente'
                ) AS Rol,
                FotoPerfil
            FROM SalesLT.Customer
            ORDER BY FechaRegistro DESC, CustomerID DESC;
        `);

        return resultado.recordset;
    }

    // ==========================================
    // CONTAR TODOS LOS USUARIOS
    // ==========================================
    static async contarTodos() {
        const pool = await obtenerConexion();

        const resultado = await pool.request().query(`
            SELECT COUNT(*) AS Total
            FROM SalesLT.Customer;
        `);

        return resultado.recordset[0].Total;
    }

    // ==========================================
    // ACTUALIZAR EL ROL DE UN USUARIO
    // ==========================================
    static async actualizarRol(customerId, rol) {
        const pool = await obtenerConexion();

        const resultado = await pool.request()
            .input('CustomerID', sql.Int, customerId)
            .input('Rol', sql.NVarChar(20), rol)
            .query(`
                UPDATE SalesLT.Customer
                SET Rol = @Rol,
                    ModifiedDate = GETDATE()
                OUTPUT
                    INSERTED.CustomerID,
                    INSERTED.FirstName,
                    INSERTED.LastName,
                    INSERTED.EmailAddress,
                    INSERTED.Rol,
                    INSERTED.FechaRegistro
                WHERE CustomerID = @CustomerID;
            `);

        return resultado.recordset[0] || null;
    }

    // ==========================================
    // CONSULTAR UN USUARIO POR ID
    // ==========================================
    static async obtenerPorId(customerId) {
        const pool = await obtenerConexion();

        const resultado = await pool.request()
            .input('CustomerID', sql.Int, customerId)
            .query(`
                SELECT
                    CustomerID,
                    FirstName,
                    LastName,
                    EmailAddress,
                    FechaRegistro,
                    COALESCE(
                        NULLIF(LTRIM(RTRIM(Rol)), ''),
                        'cliente'
                    ) AS Rol
                FROM SalesLT.Customer
                WHERE CustomerID = @CustomerID;
            `);

        return resultado.recordset[0] || null;
    }
}

module.exports = UsuariosModel;
