const crypto = require('crypto');
const ModeloPerfil = require('../models/perfilModel');
const AuthModel = require('../models/authModel');

class ControladorPerfil {
    // =====================================================
    // MIDDLEWARE DE VERIFICACIÓN DE SESIÓN
    // =====================================================
    static requerirSesion(req, res, next) {
        if (!req.session || !req.session.usuario) {
            return res.redirect('/login');
        }
        next();
    }

    // =====================================================
    // MOSTRAR PERFIL
    // =====================================================
    static async mostrarPerfil(req, res) {
        try {
            const customerId = req.session.usuario.CustomerID;
            const perfil = await ModeloPerfil.obtenerPorId(customerId);

            if (!perfil) return res.redirect('/login');

            return res.render('perfil', {
                perfil,
                fotoPerfil: await ControladorPerfil.obtenerFotoPerfil(perfil.CustomerID),
                pagina: 'perfil'
            });
        } catch (error) {
            console.error('ERROR AL MOSTRAR PERFIL:', error);
            return res.status(500).send('No se pudo cargar el perfil.');
        }
    }

    // =====================================================
    // ACTUALIZAR DATOS DE PERFIL
    // =====================================================
    static async actualizarDatosPerfil(req, res) {
        try {
            const datos = {
                customerId: req.session.usuario.CustomerID,
                firstName: String(req.body.firstName || '').trim(),
                lastName: String(req.body.lastName || '').trim(),
                email: String(req.body.email || '').trim().toLowerCase(),
                phone: String(req.body.phone || '').trim(),
                addressLine1: String(req.body.addressLine1 || '').trim(),
                addressLine2: String(req.body.addressLine2 || '').trim(),
                city: String(req.body.city || '').trim(),
                stateProvince: String(req.body.stateProvince || '').trim(),
                countryRegion: String(req.body.countryRegion || '').trim(),
                postalCode: String(req.body.postalCode || '').trim()
            };

            // Validación básica
            if (!datos.firstName || !datos.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(datos.email)) {
                return res.status(400).json({ message: 'Nombre y correo válido son obligatorios.' });
            }

            // Validación de dirección
            const camposDireccion = [
                datos.addressLine1,
                datos.city,
                datos.stateProvince,
                datos.countryRegion,
                datos.postalCode
            ];
            const direccionIniciada = camposDireccion.some(Boolean);
            const direccionValida = datos.addressLine1 && datos.city &&
                datos.stateProvince && datos.countryRegion && datos.postalCode;

            if (direccionIniciada && !direccionValida) {
                return res.status(400).json({
                    message: 'Completa dirección, ciudad, estado, país y código postal.'
                });
            }

            // Verificar duplicidad de email en otro usuario
            const existente = await AuthModel.buscarUsuarioPorEmail(datos.email);
            if (existente && existente.CustomerID !== datos.customerId) {
                return res.status(409).json({ message: 'El correo ya está registrado.' });
            }

            const perfilActualizado = await ModeloPerfil.actualizarPerfil(datos);

            // Preservar el rol previo si el modelo de perfil no devuelve el rol
            const rolActual = req.session.usuario.Rol || req.session.usuario.role || 'cliente';
            
            // Reconstruir y actualizar la sesión de Express
            req.session.usuario = ControladorPerfil.usuarioSesion(perfilActualizado, rolActual);

            return res.json({ message: 'Información actualizada correctamente.' });
        } catch (error) {
            console.error('ERROR AL ACTUALIZAR PERFIL:', error);
            return res.status(500).json({ message: 'No se pudo actualizar la información.' });
        }
    }

    // =====================================================
    // CAMBIAR CONTRASEÑA
    // =====================================================
    static async cambiarContrasena(req, res) {
        const { currentPassword, newPassword, confirmPassword } = req.body || {};

        if (!currentPassword || !newPassword || newPassword !== confirmPassword) {
            return res.status(400).json({ message: 'Verifica las contraseñas ingresadas.' });
        }

        if (newPassword.length < 8) {
            return res.status(400).json({ message: 'La contraseña debe tener mínimo 8 caracteres.' });
        }

        try {
            const usuario = await AuthModel.buscarUsuarioPorEmail(req.session.usuario.EmailAddress);
            const valida = await ControladorPerfil.verificarContrasena(currentPassword, usuario);

            if (!valida) {
                return res.status(400).json({ message: 'La contraseña actual no es correcta.' });
            }

            const salt = crypto.randomBytes(5).toString('hex');
            const hash = await ControladorPerfil.generarHashContrasena(newPassword, salt);

            await ModeloPerfil.actualizarContrasena(req.session.usuario.CustomerID, hash, salt);

            return res.json({ message: 'Contraseña cambiada correctamente.' });
        } catch (error) {
            console.error('ERROR AL CAMBIAR CONTRASEÑA:', error);
            return res.status(500).json({ message: 'No se pudo cambiar la contraseña.' });
        }
    }

    // =====================================================
    // FOTO DE PERFIL
    // =====================================================
    static async guardarFotoPerfil(req, res) {
        const { foto } = req.body || {};
        const coincidencia = /^data:image\/(png|jpeg|jpg|gif);base64,([\s\S]+)$/.exec(foto || '');
        const bytes = coincidencia ? Buffer.byteLength(coincidencia[2], 'base64') : 0;

        if (!coincidencia || bytes > 500 * 1024) {
            return res.status(400).json({ message: 'Selecciona una imagen válida menor de 500 KB.' });
        }

        try {
            const fotoBuffer = Buffer.from(coincidencia[2], 'base64');
            await ModeloPerfil.guardarFotoPerfil(req.session.usuario.CustomerID, fotoBuffer);

            return res.json({
                message: 'Foto de perfil actualizada.',
                foto: `data:image/${coincidencia[1] === 'jpeg' ? 'jpeg' : coincidencia[1]};base64,${coincidencia[2]}`
            });
        } catch (error) {
            console.error('ERROR AL GUARDAR FOTO:', error);
            return res.status(500).json({ message: 'No se pudo guardar la foto.' });
        }
    }

    static async obtenerFotoPerfil(customerId) {
        const fotoBuffer = await ModeloPerfil.obtenerFotoBinaria(customerId);
        if (!fotoBuffer || fotoBuffer.length === 0) return null;

        const mimeType = ControladorPerfil.determinarTipoMime(fotoBuffer);
        if (!mimeType) return null;

        return `data:${mimeType};base64,${fotoBuffer.toString('base64')}`;
    }

    static determinarTipoMime(buffer) {
        if (!buffer || buffer.length < 3) return null;

        if (buffer.length >= 8 && buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47) return 'image/png';
        if (buffer.length >= 4 && buffer[0] === 0x47 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x38) return 'image/gif';
        if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return 'image/jpeg';

        return null;
    }

    // =====================================================
    // HELPER - ENCRIPTACIÓN
    // =====================================================
    static generarHashContrasena(password, salt) {
        return new Promise((resolve, reject) =>
            crypto.scrypt(password, salt, 64, (error, key) => (error ? reject(error) : resolve(key.toString('hex'))))
        );
    }

    static async verificarContrasena(password, usuario) {
        if (!usuario || !usuario.PasswordHash || !usuario.PasswordSalt) return false;
        const hash = await ControladorPerfil.generarHashContrasena(password, usuario.PasswordSalt);
        
        const bufferCalculado = Buffer.from(hash, 'hex');
        const bufferAlmacenado = Buffer.from(usuario.PasswordHash, 'hex');

        if (bufferCalculado.length !== bufferAlmacenado.length) return false;

        return crypto.timingSafeEqual(bufferCalculado, bufferAlmacenado);
    }

    // =====================================================
    // HELPER - CONSTRUIR OBJ DE SESIÓN
    // =====================================================
    static usuarioSesion(usuario, rolExistente = 'cliente') {
        const rolNormalizado = (usuario.Rol || usuario.role || rolExistente).toLowerCase();

        return {
            CustomerID: usuario.CustomerID,
            FirstName: usuario.FirstName,
            LastName: usuario.LastName,
            EmailAddress: usuario.EmailAddress,
            Phone: usuario.Phone,
            Rol: rolNormalizado,
            role: rolNormalizado
        };
    }
}

module.exports = ControladorPerfil;