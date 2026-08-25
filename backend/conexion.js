require('dotenv').config({
    path: require('path').join(__dirname, '.env')
});

const sql = require('mssql/msnodesqlv8');

console.log('========================================');
console.log('CONFIGURACIÓN SQL SERVER');
console.log('========================================');
console.log('DB_SERVER:', process.env.DB_SERVER);
console.log('DB_DATABASE:', process.env.DB_DATABASE);
console.log('DB_DRIVER:', process.env.DB_DRIVER);
console.log('========================================');


const connectionString =
    `Driver={${process.env.DB_DRIVER}};` +
    `Server=${process.env.DB_SERVER};` +
    `Database=${process.env.DB_DATABASE};` +
    `Trusted_Connection=yes;` +
    `TrustServerCertificate=yes;`;


const config = {
    connectionString: connectionString,

    connectionTimeout: 10000,
    requestTimeout: 10000
};


let poolPromise = null;


async function obtenerConexion() {

    if (poolPromise) {
        return poolPromise;
    }


    console.log('Intentando conectar con SQL Server...');

    console.log(
        'Cadena de conexión:',
        `Driver={${process.env.DB_DRIVER}};` +
        `Server=${process.env.DB_SERVER};` +
        `Database=${process.env.DB_DATABASE};` +
        `Trusted_Connection=yes;`
    );


    poolPromise = sql.connect(config)

        .then(pool => {

            console.log('========================================');
            console.log('CONEXIÓN A SQL SERVER EXITOSA');
            console.log('========================================');

            return pool;

        })

        .catch(error => {

            poolPromise = null;

            console.error('========================================');
            console.error('ERROR DE CONEXIÓN A SQL SERVER');
            console.error('========================================');

            console.error('Mensaje:', error.message);
            console.error('Código:', error.code);
            console.error('Número:', error.number);

            console.error('========================================');

            throw error;
        });


    return poolPromise;
}


module.exports = {
    sql,
    obtenerConexion
};