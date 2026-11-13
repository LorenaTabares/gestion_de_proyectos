
require('dotenv').config();

const express = require('express');
const path = require('path');
const session = require('express-session');
const multer = require('multer');

const CatalogoController = require('./controllers/catalogoController');
const AuthController = require('./controllers/authController');
const CarritoController = require('./controllers/carritoController');
const InventarioController = require('./controllers/inventarioController');
const ControladorPerfil = require('./controllers/perfilController');
const ReportesController = require('./controllers/reportesController');
const PedidosController = require('./controllers/pedidosController');
const UsuariosController = require('./controllers/usuariosController');
<<<<<<< HEAD
const DashboardController = require('./controllers/dashboardController');
=======
const ProductosAdminController = require('./controllers/productosAdminController');
>>>>>>> origin/xim


const app = express();

console.log('INDEX.JS EJECUTÁNDOSE CON INTEGRACIÓN COMPLETA');

// =====================================================
// MIDDLEWARES DE PARSEO Y SESIÓN
// =====================================================

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: false }));

app.use(
    session({
        secret: process.env.SESSION_SECRET || 'aventuraworks-carrito',
        resave: false,
        saveUninitialized: false,
        cookie: {
            httpOnly: true,
            maxAge: 1000 * 60 * 60 * 2
        }
    })
);

// Pasar los datos del usuario a las vistas EJS.
app.use((req, res, next) => {
    res.locals.usuario = req.session
        ? req.session.usuario
        : null;

    next();
});

// =====================================================
// MIDDLEWARES DE PROTECCIÓN (RBAC)
// =====================================================

const obtenerRol = (req) => {
    return String(
        req.session?.usuario?.Rol ||
        req.session?.usuario?.role ||
        'cliente'
    ).toLowerCase();
};

const requerirSesion = (req, res, next) => {
    if (req.session && req.session.usuario) {
        return next();
    }

    return res.redirect('/login');
};

// =====================================================
// CONFIGURACIÓN DE IMÁGENES DE PRODUCTOS (MULTER)
// =====================================================

const almacenamientoProductos = multer.memoryStorage();

const uploadProducto = multer({
    storage: almacenamientoProductos,
    limits: {
        fileSize: 5 * 1024 * 1024
    },
    fileFilter: (req, file, callback) => {

        const tiposPermitidos = [
            'image/jpeg',
            'image/png',
            'image/webp'
        ];

        if (!tiposPermitidos.includes(file.mimetype)) {
            return callback(
                new Error(
                    'Formato de imagen no permitido. Usa JPG, PNG o WEBP.'
                )
            );
        }

        callback(null, true);
    }
});

const recibirImagenProducto = (req, res, next) => {

    uploadProducto.single('imagen')(
        req,
        res,
        error => {

            if (error) {
                const destino = req.params.id
                    ? `/admin/productos/${req.params.id}/editar`
                    : '/admin/productos/nuevo';

                return res.redirect(
                    destino +
                    '?error=' +
                    encodeURIComponent(error.message)
                );
            }

            next();
        }
    );
};

// =====================================================
// ACCESO EXCLUSIVO PARA ADMINISTRADORES
// =====================================================

const requerirAdministrador = (req, res, next) => {

    if (!req.session || !req.session.usuario) {
        return res.redirect('/login');
    }

    if (obtenerRol(req) !== 'administrador') {
        return res.status(403).send(
            'No tienes permisos para acceder a esta sección.'
        );
    }

    next();
};

// =====================================================
// ACCESO EXCLUSIVO PARA CLIENTES
// =====================================================

const requerirCliente = (req, res, next) => {

    if (!req.session || !req.session.usuario) {
        return res.redirect('/login');
    }

    const rol = obtenerRol(req);

    if (rol !== 'cliente') {

        if (rol === 'administrador') {
            return res.redirect('/admin/usuarios');
        }

        return res.redirect('/inventario');
    }

    next();
};

// =====================================================
// ACCESO EXCLUSIVO PARA OPERARIOS DE BODEGA
// =====================================================

const requerirTrabajador = (req, res, next) => {

    if (!req.session || !req.session.usuario) {
        return res.redirect('/login');
    }

    const rol = obtenerRol(req);

    if (rol !== 'trabajador') {

        if (rol === 'administrador') {
            return res.redirect('/admin/usuarios');
        }

        return res.redirect('/catalogo');
    }

    next();
};

// =====================================================
// ARCHIVOS ESTÁTICOS
// =====================================================

// Se utiliza Frontend con la misma escritura de la carpeta
// que aparece en la configuración de las vistas.
app.use(
    express.static(path.join(__dirname, '../Frontend'))
);

app.use(
    '/components',
    express.static(path.join(__dirname, '../components'))
);

// =====================================================
// MOTOR DE PLANTILLAS (EJS)
// =====================================================

app.set('view engine', 'ejs');

app.set(
    'views',
    path.join(__dirname, '../Frontend/html')
);

// =====================================================
// RUTAS DE CATÁLOGO (SOLO CLIENTES)
// =====================================================

app.get(
    '/catalogo',
    requerirCliente,
    CatalogoController.mostrarCatalogo
);

app.get(
    '/producto/:id',
    requerirCliente,
    CatalogoController.mostrarDetalle
);

// =====================================================
// RUTAS DE CARRITO (SOLO CLIENTES)
// =====================================================

app.get(
    '/carrito',
    requerirCliente,
    CarritoController.mostrar
);

app.post(
    '/carrito/agregar',
    requerirCliente,
    CarritoController.agregar
);

app.post(
    '/carrito/eliminar',
    requerirCliente,
    CarritoController.eliminar
);

app.post(
    '/carrito/finalizar',
    requerirCliente,
    CarritoController.finalizarCompra
);

// =====================================================
// RUTA DE MIS PEDIDOS (SOLO CLIENTES)
// =====================================================

app.get(
    '/mis-pedidos',
    requerirCliente,
    PedidosController.mostrarMisPedidos
);
app.get('/mis-pedidos', requerirCliente, PedidosController.mostrarMisPedidos);
app.post('/pedidos/:salesOrderId/cancelar', requerirCliente, PedidosController.cancelarPedido);

// =====================================================
// RUTAS DE INVENTARIO (SOLO TRABAJADORES)
// =====================================================

app.get(
    '/inventario',
    requerirTrabajador,
    InventarioController.mostrarInventario
);

app.post(
    '/inventario/estado',
    requerirTrabajador,
    InventarioController.cambiarEstado
);

app.get(
    '/reportes',
    requerirTrabajador,
    ReportesController.mostrarReportes
);

// =====================================================
// ADMINISTRACIÓN DE USUARIOS (SOLO ADMINISTRADORES)
// =====================================================

<<<<<<< HEAD
// Ruta para cerrar sesión
app.get('/logout', AuthController.logout);

app.get('/login', (req, res) => {
    // Si ya tiene sesión, redirigir según su rol
    if (req.session && req.session.usuario) {
        const rol = (req.session.usuario.Rol || req.session.usuario.role || '').toLowerCase();
        if (rol === 'trabajador') {
            return res.redirect('/inventario');
        }
        return res.redirect('/catalogo');
    }

    res.sendFile(path.join(__dirname, '../Frontend/html/login.html'));
});

// =====================================================
// PERFIL DE USUARIO
// =====================================================
app.get('/perfil', requerirSesion, ControladorPerfil.mostrarPerfil);
app.post('/api/perfil/datos', requerirSesion, ControladorPerfil.actualizarDatosPerfil);
app.post('/api/perfil/password', requerirSesion, ControladorPerfil.cambiarContrasena);
app.post('/api/perfil/foto', requerirSesion, ControladorPerfil.guardarFotoPerfil);

// ==========================================
// DASHBOARD ADMINISTRATIVO
// ==========================================
app.get(
    '/admin/dashboard',
    requerirAdministrador,
    DashboardController.mostrarDashboard
);
// ==========================================
// ADMINISTRACIÓN DE USUARIOS
// ==========================================
=======
>>>>>>> origin/xim
app.get(
    '/admin/usuarios',
    requerirAdministrador,
    UsuariosController.mostrarUsuarios
);

app.post(
    '/admin/usuarios/:id/rol',
    requerirAdministrador,
    UsuariosController.actualizarRol
);

// =====================================================
// ADMINISTRACIÓN DE PRODUCTOS (SOLO ADMINISTRADORES)
// =====================================================

app.get(
    '/admin/productos',
    requerirAdministrador,
    ProductosAdminController.mostrarProductos
);

app.get(
    '/admin/productos/nuevo',
    requerirAdministrador,
    ProductosAdminController.mostrarCrear
);

app.post(
    '/admin/productos/crear',
    requerirAdministrador,
    recibirImagenProducto,
    ProductosAdminController.crear
);

app.get(
    '/admin/productos/:id/editar',
    requerirAdministrador,
    ProductosAdminController.mostrarEditar
);

app.post(
    '/admin/productos/:id/editar',
    requerirAdministrador,
    recibirImagenProducto,
    ProductosAdminController.actualizar
);

app.post(
    '/admin/productos/:id/eliminar',
    requerirAdministrador,
    ProductosAdminController.eliminar
);

// =====================================================
// AUTENTICACIÓN Y LOGOUT
// =====================================================

app.post(
    '/api/auth/registro',
    AuthController.registrar
);

app.post(
    '/api/auth/login',
    AuthController.login
);

app.get(
    '/logout',
    AuthController.logout
);

// =====================================================
// RUTA DE INICIO DE SESIÓN
// =====================================================

app.get('/login', (req, res) => {

    // Si ya existe una sesión, redirigir según el rol.
    if (req.session && req.session.usuario) {

        const rol = obtenerRol(req);

        if (rol === 'administrador') {
            return res.redirect('/admin/usuarios');
        }

        if (rol === 'trabajador') {
            return res.redirect('/inventario');
        }

        return res.redirect('/catalogo');
    }

    res.sendFile(
        path.join(__dirname, '../Frontend/html/login.html')
    );
});

// =====================================================
// PERFIL DE USUARIO
// =====================================================

app.get(
    '/perfil',
    requerirSesion,
    ControladorPerfil.mostrarPerfil
);

app.post(
    '/api/perfil/datos',
    requerirSesion,
    ControladorPerfil.actualizarDatosPerfil
);

app.post(
    '/api/perfil/password',
    requerirSesion,
    ControladorPerfil.cambiarContrasena
);

app.post(
    '/api/perfil/foto',
    requerirSesion,
    ControladorPerfil.guardarFotoPerfil
);

// =====================================================
// RUTA PRINCIPAL
// =====================================================

app.get('/', (req, res) => {
    res.redirect('/login');
});

// =====================================================
// MANEJO DE ERRORES
// =====================================================

app.use((error, req, res, next) => {

    console.error('Error en la aplicación:', error);

    if (res.headersSent) {
        return next(error);
    }

    return res.status(500).send(
        'Ocurrió un error interno en el servidor.'
    );
});

// =====================================================
// SERVIDOR
// =====================================================

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
