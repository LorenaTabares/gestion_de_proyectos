const crypto = require('crypto');

const AuthModel =
    require('../models/authModel');


class AuthController {


    // =====================================================
    // GENERAR HASH
    // =====================================================

    static generarHash(password, salt) {

        return new Promise((resolve, reject) => {

            crypto.scrypt(
                password,
                salt,
                64,
                (error, derivedKey) => {

                    if (error) {

                        reject(error);

                        return;
                    }

                    resolve(
                        derivedKey.toString('hex')
                    );

                }
            );

        });

    }


    // =====================================================
    // GENERAR SALT
    // =====================================================

    static generarSalt() {


        return crypto
            .randomBytes(5)
            .toString('hex');

    }


    // =====================================================
    // COMPARAR CONTRASEÑA
    // =====================================================

    static async verificarPassword(
        password,
        salt,
        hashAlmacenado
    ) {

        if (
            typeof password !== 'string' ||
            typeof salt !== 'string' ||
            typeof hashAlmacenado !== 'string' ||
            !/^[0-9a-f]+$/i.test(hashAlmacenado) ||
            hashAlmacenado.length % 2 !== 0
        ) {

            return false;

        }

        const hashCalculado =
            await AuthController.generarHash(
                password,
                salt
            );


        const bufferCalculado =
            Buffer.from(
                hashCalculado,
                'hex'
            );


        const bufferAlmacenado =
            Buffer.from(
                hashAlmacenado,
                'hex'
            );


        if (
            bufferCalculado.length !==
            bufferAlmacenado.length
        ) {

            return false;

        }


        return crypto.timingSafeEqual(
            bufferCalculado,
            bufferAlmacenado
        );

    }


    // =====================================================
    // REGISTRO
    // =====================================================

    static async registrar(req, res) {

        try {

            const {
                firstName,
                lastName,
                email,
                password
            } = req.body || {};

            const nombreCompleto =
                typeof req.body?.name === 'string'
                    ? req.body.name.trim()
                    : '';

            const partesNombre = nombreCompleto
                ? nombreCompleto.split(/\s+/)
                : [];

            const nombre =
                typeof firstName === 'string'
                    ? firstName.trim()
                    : partesNombre.shift() || '';

            const apellido =
                typeof lastName === 'string'
                    ? lastName.trim()
                    : partesNombre.join(' ');

            const correo =
                typeof email === 'string'
                    ? email.trim().toLowerCase()
                    : '';


            // -------------------------------------------------
            // VALIDAR CAMPOS
            // -------------------------------------------------

            if (
                !nombre ||
                !correo ||
                typeof password !== 'string' ||
                !password
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        'Todos los campos son obligatorios.'

                });

            }


            // -------------------------------------------------
            // VALIDAR CONTRASEÑA
            // -------------------------------------------------

            if (password.length < 8) {

                return res.status(400).json({

                    success: false,

                    message:
                        'La contraseña debe tener mínimo 8 caracteres.'

                });

            }


            // -------------------------------------------------
            // NORMALIZAR CORREO
            // -------------------------------------------------

            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) {

                return res.status(400).json({

                    success: false,

                    message:
                        'El correo electrónico no es válido.'

                });

            }


            // -------------------------------------------------
            // COMPROBAR SI YA EXISTE
            // -------------------------------------------------

            const usuarioExistente =
                await AuthModel.buscarUsuarioPorEmail(
                    correo
                );


            if (usuarioExistente) {

                return res.status(409).json({

                    success: false,

                    message:
                        'El correo ya está registrado.'

                });

            }


            // -------------------------------------------------
            // GENERAR SALT
            // -------------------------------------------------

            const salt =
                AuthController.generarSalt();


            // -------------------------------------------------
            // GENERAR HASH
            // -------------------------------------------------

            const passwordHash =
                await AuthController.generarHash(
                    password,
                    salt
                );


            // -------------------------------------------------
            // GUARDAR USUARIO
            // -------------------------------------------------

            const usuario =
                await AuthModel.registrarUsuario({

                    firstName:
                        nombre,

                    lastName:
                        apellido,

                    email:
                        correo,

                    passwordHash,

                    passwordSalt:
                        salt

                });


            // -------------------------------------------------
            // RESPUESTA
            // -------------------------------------------------

            return res.status(201).json({

                success: true,

                message:
                    'Usuario registrado correctamente.',

                usuario: {

                    CustomerID:
                        usuario.CustomerID,

                    FirstName:
                        usuario.FirstName,

                    LastName:
                        usuario.LastName,

                    EmailAddress:
                        usuario.EmailAddress,

                    role:
                        'regular'

                }

            });

        } catch (error) {

            console.error(
                'ERROR EN REGISTRO:',
                error
            );

            return res.status(500).json({

                success: false,

                message:
                    'Error interno del servidor.'

            });

        }

    }


    // =====================================================
    // LOGIN
    // =====================================================

    static async login(req, res) {

        try {

            const {
                email,
                password
            } = req.body;


            // -------------------------------------------------
            // VALIDAR CAMPOS
            // -------------------------------------------------

            if (
                !email ||
                !password
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        'Correo y contraseña son obligatorios.'

                });

            }


            // -------------------------------------------------
            // NORMALIZAR CORREO
            // -------------------------------------------------

            const emailNormalizado =
                email.trim().toLowerCase();


            // -------------------------------------------------
            // BUSCAR USUARIO
            // -------------------------------------------------

            const usuario =
                await AuthModel.buscarUsuarioPorEmail(
                    emailNormalizado
                );


            if (!usuario) {

                return res.status(401).json({

                    success: false,

                    message:
                        'Correo o contraseña incorrectos.'

                });

            }


            // -------------------------------------------------
            // VERIFICAR CONTRASEÑA
            // -------------------------------------------------

            const passwordCorrecta =
                await AuthController.verificarPassword(

                    password,

                    usuario.PasswordSalt,

                    usuario.PasswordHash

                );


            if (!passwordCorrecta) {

                return res.status(401).json({

                    success: false,

                    message:
                        'Correo o contraseña incorrectos.'

                });

            }


            // -------------------------------------------------
            // USUARIO REGULAR
            // -------------------------------------------------

            const usuarioAutenticado = {

                CustomerID:
                    usuario.CustomerID,

                FirstName:
                    usuario.FirstName,

                LastName:
                    usuario.LastName,

                EmailAddress:
                    usuario.EmailAddress,

                role:
                    'regular'

            };


            // -------------------------------------------------
            // RESPUESTA
            // -------------------------------------------------

            return res.status(200).json({

                success: true,

                message:
                    'Inicio de sesión exitoso.',

                usuario:
                    usuarioAutenticado

            });

        } catch (error) {

            console.error(
                'ERROR EN LOGIN:',
                error
            );

            return res.status(500).json({

                success: false,

                message:
                    'Error interno del servidor.'

            });

        }

    }

}


module.exports = AuthController;