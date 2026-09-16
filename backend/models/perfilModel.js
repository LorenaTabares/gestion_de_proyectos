const { obtenerConexion, sql } = require('../conexion');

class ModeloPerfil {
    static async obtenerPorId(customerId) {
        const pool = await obtenerConexion();
        const result = await pool.request()
            .input('customerId', sql.Int, customerId)
            .query(`
                SELECT
                    c.CustomerID, c.FirstName, c.LastName, c.EmailAddress, c.Phone, c.Rol, c.FotoPerfil,
                    a.AddressID, a.AddressLine1, a.AddressLine2, a.City,
                    a.StateProvince, a.CountryRegion, a.PostalCode
                FROM SalesLT.Customer c
                LEFT JOIN SalesLT.CustomerAddress ca ON ca.CustomerID = c.CustomerID
                LEFT JOIN SalesLT.Address a ON a.AddressID = ca.AddressID
                WHERE c.CustomerID = @customerId;
            `);

        return result.recordset[0] || null;
    }

    static async obtenerFotoBinaria(customerId) {
        const pool = await obtenerConexion();
        const result = await pool.request()
            .input('customerId', sql.Int, customerId)
            .query(`
                SELECT FotoPerfil
                FROM SalesLT.Customer
                WHERE CustomerID = @customerId;
            `);

        const foto = result.recordset[0]?.FotoPerfil;
        return foto ? Buffer.from(foto) : null;
    }

    static async guardarFotoPerfil(customerId, fotoBuffer) {
        const pool = await obtenerConexion();
        await pool.request()
            .input('customerId', sql.Int, customerId)
            .input('fotoPerfil', sql.VarBinary(sql.MAX), fotoBuffer)
            .query(`
                UPDATE SalesLT.Customer
                SET FotoPerfil = @fotoPerfil,
                    ModifiedDate = GETDATE()
                WHERE CustomerID = @customerId;
            `);
    }

    static async actualizarPerfil(datos) {
        const pool = await obtenerConexion();
        const transaction = new sql.Transaction(pool);
        let transactionStarted = false;

        try {
            await transaction.begin();
            transactionStarted = true;
            const request = transaction.request()
                .input('customerId', sql.Int, datos.customerId)
                .input('firstName', sql.NVarChar(50), datos.firstName)
                .input('lastName', sql.NVarChar(50), datos.lastName)
                .input('email', sql.NVarChar(50), datos.email)
                .input('phone', sql.NVarChar(25), datos.phone || null)
                .input('addressLine1', sql.NVarChar(60), datos.addressLine1 || null)
                .input('addressLine2', sql.NVarChar(60), datos.addressLine2 || null)
                .input('city', sql.NVarChar(30), datos.city || null)
                .input('stateProvince', sql.NVarChar(50), datos.stateProvince || null)
                .input('countryRegion', sql.NVarChar(50), datos.countryRegion || null)
                .input('postalCode', sql.NVarChar(15), datos.postalCode || null);

            await request.query(`
                UPDATE SalesLT.Customer
                SET FirstName = @firstName, LastName = @lastName,
                    EmailAddress = @email, Phone = @phone,
                    ModifiedDate = GETDATE()
                WHERE CustomerID = @customerId;

                DECLARE @addressId INT;
                SELECT TOP 1 @addressId = AddressID
                FROM SalesLT.CustomerAddress
                WHERE CustomerID = @customerId;

                IF @addressId IS NULL AND @addressLine1 IS NOT NULL
                BEGIN
                    INSERT INTO SalesLT.Address
                        (AddressLine1, AddressLine2, City, StateProvince, CountryRegion, PostalCode)
                    VALUES
                        (@addressLine1, @addressLine2, @city, @stateProvince, @countryRegion, @postalCode);

                    SET @addressId = SCOPE_IDENTITY();
                    INSERT INTO SalesLT.CustomerAddress (CustomerID, AddressID, AddressType)
                    VALUES (@customerId, @addressId, 'Main Office');
                END
                ELSE IF @addressId IS NOT NULL
                BEGIN
                    UPDATE SalesLT.Address
                    SET AddressLine1 = @addressLine1, AddressLine2 = @addressLine2,
                        City = @city, StateProvince = @stateProvince,
                        CountryRegion = @countryRegion, PostalCode = @postalCode,
                        ModifiedDate = GETDATE()
                    WHERE AddressID = @addressId;
                END
            `);

            await transaction.commit();
            return this.obtenerPorId(datos.customerId);
        } catch (error) {
            if (transactionStarted) await transaction.rollback();
            throw error;
        }
    }

    static async actualizarContrasena(customerId, passwordHash, passwordSalt) {
        const pool = await obtenerConexion();
        await pool.request()
            .input('customerId', sql.Int, customerId)
            .input('passwordHash', sql.VarChar(128), passwordHash)
            .input('passwordSalt', sql.VarChar(10), passwordSalt)
            .query(`
                UPDATE SalesLT.Customer
                SET PasswordHash = @passwordHash, PasswordSalt = @passwordSalt,
                    ModifiedDate = GETDATE()
                WHERE CustomerID = @customerId;
            `);
    }
}

module.exports = ModeloPerfil;
