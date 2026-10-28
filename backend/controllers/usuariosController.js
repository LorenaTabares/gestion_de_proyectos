
const UsuariosModel = require('../models/usuariosModel');

const ROLES_PERMITIDOS = [
    'cliente',
    'trabajador',
    'administrador'
];

// ==========================================
// CONVERTIR FOTO BINARIA A DATA URL
// ==========================================
function convertirFoto(foto) {
    if (!foto) {
        return null;
    }

    const buffer = Buffer.from(foto);
    let tipo = null;

    // JPEG
    if (
        buffer.length >= 3 &&
        buffer[0] === 0xFF &&
        buffer[1] === 0xD8 &&
        buffer[2] === 0xFF
    ) {
        tipo = 'image/jpeg';
    }

    // PNG
    else if (
        buffer.length >= 8 &&
        buffer[0] === 0x89 &&
        buffer[1] === 0x50 &&
        buffer[2] === 0x4E &&
        buffer[3] === 0x47 &&
        buffer[4] === 0x0D &&
        buffer[5] === 0x0A &&
        buffer[6] === 0x1A &&
        buffer[7] === 0x0A
    ) {
        tipo = 'image/png';
    }

    // GIF
    else if (
        buffer.length >= 6 &&
        ['GIF87a', 'GIF89a'].includes(
            buffer.toString('ascii', 0, 6)
        )
    ) {
        tipo = 'image/gif';
    }

    // No intentar mostrar formatos desconocidos.
    if (!tipo) {
        return null;
    }

    return `data:${tipo};base64,${buffer.toString('base64')}`;
}

class UsuariosController {

    // ==========================================
    // MOSTRAR PANEL DE ADMINISTRACIÓN
    // ==========================================
    static async mostrarUsuarios(req, res) {
        try {
            const [usuarios, totalUsuarios] = await Promise.all([
                UsuariosModel.obtenerTodos(),
                UsuariosModel.contarTodos()
            ]);

            const usuariosPreparados = usuarios.map(usuario => ({
                ...usuario,
                fotoBase64: convertirFoto(usuario.FotoPerfil)
            }));

            return res.render('adminUsuarios', {
                usuarios: usuariosPreparados,
                totalUsuarios,
                usuarioActualId: req.session.usuario.CustomerID,
                usuario: req.session.usuario,
                pagina: 'admin-usuarios',
                mensaje: req.query.mensaje || '',
                error: req.query.error || ''
            });

        } catch (error) {
            console.error(
                'Error al cargar los usuarios:',
                error
            );

            return res.status(500).send(
                'No se pudo cargar el panel de usuarios.'
            );
        }
    }

    // ==========================================
    // CAMBIAR EL ROL DE UN USUARIO
    // ==========================================
    static async actualizarRol(req, res) {
        try {
            const customerId = Number(req.params.id);

            const rol = String(req.body.rol || '')
                .trim()
                .toLowerCase();

            if (
                !Number.isInteger(customerId) ||
                customerId <= 0
            ) {
                return res.status(400).json({
                    success: false,
                    message: 'El identificador del usuario no es válido.'
                });
            }

            if (!ROLES_PERMITIDOS.includes(rol)) {
                return res.status(400).json({
                    success: false,
                    message: 'El rol seleccionado no está permitido.'
                });
            }

            const administradorId = Number(
                req.session.usuario.CustomerID
            );

            // Evitar que el administrador se quite su propio rol.
            if (customerId === administradorId) {
                return res.status(400).json({
                    success: false,
                    message: 'No puedes cambiar tu propio rol desde este panel.'
                });
            }

            const usuarioExistente =
                await UsuariosModel.obtenerPorId(customerId);

            if (!usuarioExistente) {
                return res.status(404).json({
                    success: false,
                    message: 'El usuario no existe.'
                });
            }

            const usuarioActualizado =
                await UsuariosModel.actualizarRol(
                    customerId,
                    rol
                );

            if (!usuarioActualizado) {
                return res.status(404).json({
                    success: false,
                    message: 'No se pudo actualizar el usuario.'
                });
            }

            return res.status(200).json({
                success: true,
                message: 'Rol actualizado correctamente.',
                usuario: {
                    CustomerID: usuarioActualizado.CustomerID,
                    FirstName: usuarioActualizado.FirstName,
                    LastName: usuarioActualizado.LastName,
                    EmailAddress: usuarioActualizado.EmailAddress,
                    Rol: usuarioActualizado.Rol
                }
            });

        } catch (error) {
            console.error(
                'Error al actualizar el rol:',
                error
            );

            return res.status(500).json({
                success: false,
                message: 'Ocurrió un error al actualizar el rol.'
            });
        }
    }
}

module.exports = UsuariosController;
