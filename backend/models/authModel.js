const { obtenerConexion, sql } = require('../conexion');

class AuthModel {

    // =====================================================
    // BUSCAR USUARIO POR CORREO
    // =====================================================
    static async buscarUsuarioPorEmail(email) {
        try {
            const pool = await obtenerConexion();

            const result = await pool
                .request()
                .input('email', sql.NVarChar(50), email)
                .query(`
                    SELECT
                        CustomerID,
                        FirstName,
                        LastName,
                        EmailAddress,
                        PasswordHash,
                        PasswordSalt,
                        Rol -- <--- SE AGREGÓ ESTA COLUMNA
                    FROM SalesLT.Customer
                    WHERE EmailAddress = @email;
                `);

            return result.recordset[0] || null;

        } catch (error) {
            console.error('ERROR SQL BUSCAR USUARIO:', error);
            throw error;
        }
    }


    // =====================================================
    // REGISTRAR USUARIO
    // =====================================================
    static async registrarUsuario(datos) {
        try {
            const pool = await obtenerConexion();

            const result = await pool
                .request()
                .input('firstName', sql.NVarChar(50), datos.firstName)
                .input('lastName', sql.NVarChar(50), datos.lastName)
                .input('email', sql.NVarChar(50), datos.email)
                .input('passwordHash', sql.VarChar(128), datos.passwordHash)
                .input('passwordSalt', sql.VarChar(10), datos.passwordSalt)
                .query(`
                    INSERT INTO SalesLT.Customer
                    (
                        FirstName,
                        LastName,
                        EmailAddress,
                        PasswordHash,
                        PasswordSalt,
                        Rol
                    )
                    VALUES
                    (
                        @firstName,
                        @lastName,
                        @email,
                        @passwordHash,
                        @passwordSalt,
                        'cliente'
                    );

                    SELECT
                        CustomerID,
                        FirstName,
                        LastName,
                        EmailAddress,
                        Rol -- <--- SE AGREGÓ PARA DEVOLVER EL ROL TRAS EL REGISTRO
                    FROM SalesLT.Customer
                    WHERE CustomerID = SCOPE_IDENTITY();
                `);

            return result.recordset[0];

        } catch (error) {
            console.error('ERROR SQL REGISTRAR USUARIO:', error);
            throw error;
        }
    }

}

module.exports = AuthModel;