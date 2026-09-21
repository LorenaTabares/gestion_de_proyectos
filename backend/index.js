require('dotenv').config();

const express = require('express');
const path = require('path');
const session = require('express-session');

const CatalogoController = require('./controllers/catalogoController');
const AuthController = require('./controllers/authController');
const CarritoController = require('./controllers/carritoController');
const InventarioController = require('./controllers/inventarioController');
const ControladorPerfil = require('./controllers/perfilController');

const app = express();

console.log('INDEX.JS EJECUTÁNDOSE CON INTEGRACIÓN COMPLETA');

// =====================================================
// MIDDLEWARES DE PARSEO Y SESIÓN
// =====================================================
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: false }));

app.use(
    session({
        secret: 'aventuraworks-carrito',
        resave: false,
        saveUninitialized: false,
        cookie: {
            httpOnly: true,
            maxAge: 1000 * 60 * 60 * 2 // 2 horas
        }
    })
);

// Middleware global para pasar los datos de usuario a las vistas EJS
app.use((req, res, next) => {
    res.locals.usuario = req.session ? req.session.usuario : null;
    next();
});

// =====================================================
// MIDDLEWARES DE PROTECCIÓN (RBAC)
// =====================================================
const requerirSesion = (req, res, next) => {
    if (req.session && req.session.usuario) {
        return next();
    }
    return res.redirect('/login');
};

// Exclusivo para clientes (Bloquea a trabajadores)
const requerirCliente = (req, res, next) => {
    if (!req.session || !req.session.usuario) {
        return res.redirect('/login');
    }
    const rol = (req.session.usuario.Rol || req.session.usuario.role || 'cliente').toLowerCase();
    if (rol === 'trabajador') {
        return res.redirect('/inventario');
    }
    next();
};

// Exclusivo para trabajadores (Bloquea a clientes)
const requerirTrabajador = (req, res, next) => {
    if (!req.session || !req.session.usuario) {
        return res.redirect('/login');
    }
    const rol = (req.session.usuario.Rol || req.session.usuario.role || '').toLowerCase();
    if (rol !== 'trabajador') {
        return res.redirect('/catalogo');
    }
    next();
};

// =====================================================
// ARCHIVOS ESTÁTICOS
// =====================================================
app.use(express.static(path.join(__dirname, '../Frontend')));
app.use('/components', express.static(path.join(__dirname, '../components')));

// =====================================================
// MOTOR DE PLANTILLAS (EJS)
// =====================================================
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '../Frontend/html'));

// =====================================================
// RUTAS DE CATÁLOGO (SOLO CLIENTES)
// =====================================================
app.get('/catalogo', requerirCliente, CatalogoController.mostrarCatalogo);

// =====================================================
// RUTAS DE CARRITO (SOLO CLIENTES)
// =====================================================
app.get('/carrito', requerirCliente, CarritoController.mostrar);
app.post('/carrito/agregar', requerirCliente, CarritoController.agregar);
app.post('/carrito/eliminar', requerirCliente, CarritoController.eliminar);
app.post('/carrito/finalizar', requerirCliente, CarritoController.finalizarCompra);

// =====================================================
// RUTAS DE INVENTARIO (SOLO TRABAJADORES)
// =====================================================
app.get('/inventario', requerirTrabajador, InventarioController.mostrarInventario);
app.post('/inventario/estado', requerirTrabajador, InventarioController.cambiarEstado);

// =====================================================
// AUTENTICACIÓN Y LOGOUT
// =====================================================
app.post('/api/auth/registro', AuthController.registrar);
app.post('/api/auth/login', AuthController.login);

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

// =====================================================
// RUTA PRINCIPAL
// =====================================================
app.get('/', (req, res) => {
    res.redirect('/login');
});

// =====================================================
// SERVIDOR
// =====================================================
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});