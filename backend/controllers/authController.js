const crypto = require('crypto');
const AuthModel = require('../models/authModel');
const CarritoModel = require('../models/carritoModel'); // Importación añadida

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
                    resolve(derivedKey.toString('hex'));
                }
            );
        });
    }

    // =====================================================
    // GENERAR SALT
    // =====================================================
    static generarSalt() {
        return crypto.randomBytes(5).toString('hex');
    }

    // =====================================================
    // COMPARAR CONTRASEÑA
    // =====================================================
    static async verificarPassword(password, salt, hashAlmacenado) {
        if (
            typeof password !== 'string' ||
            typeof salt !== 'string' ||
            typeof hashAlmacenado !== 'string' ||
            !/^[0-9a-f]+$/i.test(hashAlmacenado) ||
            hashAlmacenado.length % 2 !== 0
        ) {
            return false;
        }

        const hashCalculado = await AuthController.generarHash(password, salt);
        const bufferCalculado = Buffer.from(hashCalculado, 'hex');
        const bufferAlmacenado = Buffer.from(hashAlmacenado, 'hex');

        if (bufferCalculado.length !== bufferAlmacenado.length) {
            return false;
        }

        return crypto.timingSafeEqual(bufferCalculado, bufferAlmacenado);
    }

    // =====================================================
    // REGISTRO
    // =====================================================
    static async registrar(req, res) {
        try {
            const { firstName, lastName, email, password } = req.body || {};

            const nombreCompleto = typeof req.body?.name === 'string'
                ? req.body.name.trim()
                : '';

            const partesNombre = nombreCompleto ? nombreCompleto.split(/\s+/) : [];

            const nombre = typeof firstName === 'string'
                ? firstName.trim()
                : partesNombre.shift() || '';

            const apellido = typeof lastName === 'string'
                ? lastName.trim()
                : partesNombre.join(' ');

            const correo = typeof email === 'string'
                ? email.trim().toLowerCase()
                : '';

            // VALIDAR CAMPOS
            if (!nombre || !correo || typeof password !== 'string' || !password) {
                return res.status(400).json({
                    success: false,
                    message: 'Todos los campos son obligatorios.'
                });
            }

            // VALIDAR CONTRASEÑA
            if (password.length < 8) {
                return res.status(400).json({
                    success: false,
                    message: 'La contraseña debe tener mínimo 8 caracteres.'
                });
            }

            // NORMALIZAR CORREO
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) {
                return res.status(400).json({
                    success: false,
                    message: 'El correo electrónico no es válido.'
                });
            }

            // COMPROBAR SI YA EXISTE
            const usuarioExistente = await AuthModel.buscarUsuarioPorEmail(correo);

            if (usuarioExistente) {
                return res.status(409).json({
                    success: false,
                    message: 'El correo ya está registrado.'
                });
            }

            // GENERAR SALT Y HASH
            const salt = AuthController.generarSalt();
            const passwordHash = await AuthController.generarHash(password, salt);

            // GUARDAR USUARIO EN BD
            const usuario = await AuthModel.registrarUsuario({
                firstName: nombre,
                lastName: apellido,
                email: correo,
                passwordHash,
                passwordSalt: salt
            });

            const rolDefinido = (usuario.Rol || usuario.role || 'cliente').toLowerCase();

            const datosUsuario = {
                CustomerID: usuario.CustomerID,
                FirstName: usuario.FirstName || nombre,
                LastName: usuario.LastName || apellido,
                EmailAddress: usuario.EmailAddress || correo,
                Rol: rolDefinido,
                role: rolDefinido
            };

            // Determinar la vista destino según el rol
            const redirectUrl = rolDefinido === 'trabajador' ? '/inventario' : '/catalogo';

            // Guardar en sesión express e inicializar carrito vacío
            if (req.session) {
                req.session.usuario = datosUsuario;
                req.session.carrito = [];
            }

            // RESPUESTA
            return res.status(201).json({
                success: true,
                message: 'Usuario registrado correctamente.',
                usuario: datosUsuario,
                redirectUrl
            });

        } catch (error) {
            console.error('ERROR EN REGISTRO:', error);
            return res.status(500).json({
                success: false,
                message: 'Error interno del servidor.'
            });
        }
    }

    // =====================================================
    // LOGIN
    // =====================================================
    static async login(req, res) {
        try {
            const { email, password } = req.body || {};

            // VALIDAR CAMPOS
            if (!email || !password) {
                return res.status(400).json({
                    success: false,
                    message: 'Correo y contraseña son obligatorios.'
                });
            }

            // NORMALIZAR CORREO
            const emailNormalizado = email.trim().toLowerCase();

            // BUSCAR USUARIO EN BD
            const usuario = await AuthModel.buscarUsuarioPorEmail(emailNormalizado);

            if (!usuario) {
                return res.status(401).json({
                    success: false,
                    message: 'Correo o contraseña incorrectos.'
                });
            }

            // VERIFICAR CONTRASEÑA
            const passwordCorrecta = await AuthController.verificarPassword(
                password,
                usuario.PasswordSalt,
                usuario.PasswordHash
            );

            if (!passwordCorrecta) {
                return res.status(401).json({
                    success: false,
                    message: 'Correo o contraseña incorrectos.'
                });
            }

            // Mapeo normalizado del rol
            const rolDefinido = (usuario.Rol || usuario.role || 'cliente').toLowerCase();

            const usuarioAutenticado = {
                CustomerID: usuario.CustomerID,
                FirstName: usuario.FirstName,
                LastName: usuario.LastName,
                EmailAddress: usuario.EmailAddress,
                Rol: rolDefinido,
                role: rolDefinido
            };

            // Determinar a qué vista enviar al usuario según su rol
            const redirectUrl = rolDefinido === 'trabajador' ? '/inventario' : '/catalogo';

            // GUARDAR USUARIO Y CARGAR SU CARRITO GUARDADO DESDE LA BD
            if (req.session) {
                req.session.usuario = usuarioAutenticado;
                
                // Carga los productos guardados previamente en SQL Server
                const carritoBD = await CarritoModel.obtenerCarritoDeBD(usuario.CustomerID);
                req.session.carrito = carritoBD || [];
            }

            // RESPUESTA
            return res.status(200).json({
                success: true,
                message: 'Inicio de sesión exitoso.',
                usuario: usuarioAutenticado,
                redirectUrl
            });

        } catch (error) {
            console.error('ERROR EN LOGIN:', error);
            return res.status(500).json({
                success: false,
                message: 'Error interno del servidor.'
            });
        }
    }

    // =====================================================
    // CERRAR SESIÓN
    // =====================================================
    static async logout(req, res) {
        if (req.session) {
            try {
                // Si hay un usuario en sesión y un carrito, guardamos en la BD antes de salir
                if (req.session.usuario && req.session.carrito) {
                    await CarritoModel.guardarCarritoEnBD(
                        req.session.usuario.CustomerID,
                        req.session.carrito
                    );
                }
            } catch (error) {
                console.error('Error al guardar el carrito antes de cerrar sesión:', error);
            }

            req.session.destroy((err) => {
                if (err) {
                    console.error('Error al destruir la sesión:', err);
                    if (req.xhr || (req.headers.accept && req.headers.accept.indexOf('json') > -1)) {
                        return res.status(500).json({ success: false, message: 'No se pudo cerrar la sesión.' });
                    }
                    return res.status(500).send('No se pudo cerrar la sesión.');
                }

                // Limpiar cookie de sesión express
                res.clearCookie('connect.sid', { path: '/' });

                // Si la petición vino por AJAX / Fetch
                if (req.xhr || (req.headers.accept && req.headers.accept.indexOf('json') > -1)) {
                    return res.status(200).json({
                        success: true,
                        message: 'Sesión cerrada correctamente.',
                        redirectUrl: '/login?mensaje=sesion_cerrada'
                    });
                }

                // Si fue una navegación web directa (GET /logout)
                return res.redirect('/login?mensaje=sesion_cerrada');
            });
        } else {
            return res.redirect('/login');
        }
    }
}

module.exports = AuthController;