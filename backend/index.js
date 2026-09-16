require('dotenv').config();

const express = require('express');

const path = require('path');

const session = require('express-session');


const CatalogoController =
    require('./controllers/catalogoController');

const AuthController =
    require('./controllers/authController');

const CarritoController =
    require('./controllers/carritoController');

const InventarioController =
    require('./controllers/inventarioController');

const ControladorPerfil =
    require('./controllers/perfilController');


const app = express();


console.log('INDEX.JS QUE ESTOY EJECUTANDO');


// =====================================================
// MIDDLEWARE
// =====================================================

app.use(express.json({ limit: '1mb' }));

app.use(
    express.urlencoded({
        extended: false
    })
);


app.use(
    session({

        secret: 'aventuraworks-carrito',

        resave: false,

        saveUninitialized: true

    })
);

app.use((req, res, next) => {
    res.locals.usuario = req.session.usuario || null;
    next();
});


// =====================================================
// ARCHIVOS ESTÁTICOS
// =====================================================

app.use(

    express.static(

        path.join(
            __dirname,
            '../Frontend'
        )

    )

);


app.use(

    '/components',

    express.static(

        path.join(
            __dirname,
            '../components'
        )

    )

);


// =====================================================
// EJS
// =====================================================

app.set(
    'view engine',
    'ejs'
);


app.set(

    'views',

    path.join(
        __dirname,
        '../Frontend/html'
    )

);


// =====================================================
// CATÁLOGO
// =====================================================

app.get(

    '/catalogo',

    CatalogoController.mostrarCatalogo

);


// =====================================================
// CARRITO
// =====================================================

app.post(

    '/carrito/agregar',

    CarritoController.agregar

);


app.post(

    '/carrito/eliminar',

    CarritoController.eliminar

);


app.get(

    '/carrito',

    CarritoController.mostrar

);

app.post(

    '/carrito/finalizar',

    CarritoController.finalizarCompra

);


console.log(
    'RUTA POST /carrito/agregar REGISTRADA'
);


// =====================================================
// INVENTARIO
// =====================================================

app.get(

    '/inventario',

    InventarioController.mostrarInventario

);


app.post(

    '/inventario/estado',

    InventarioController.cambiarEstado

);


// =====================================================
// AUTENTICACIÓN
// =====================================================

app.post(

    '/api/auth/registro',

    AuthController.registrar

);


app.post(

    '/api/auth/login',

    AuthController.login

);

// =====================================================
// PERFIL
// =====================================================
app.get('/perfil', ControladorPerfil.requerirSesion, ControladorPerfil.mostrarPerfil);
app.post('/api/perfil/datos', ControladorPerfil.requerirSesion, ControladorPerfil.actualizarDatosPerfil);
app.post('/api/perfil/password', ControladorPerfil.requerirSesion, ControladorPerfil.cambiarContrasena);
app.post('/api/perfil/foto', ControladorPerfil.requerirSesion, ControladorPerfil.guardarFotoPerfil);


app.get(

    '/login',

    (req, res) => {

        res.sendFile(

            path.join(

                __dirname,

                '../Frontend/html/login.html'

            )

        );

    }

);


// =====================================================
// RUTA PRINCIPAL
// =====================================================

app.get(

    '/',

    (req, res) => {

        res.redirect('/login');

    }

);


// =====================================================
// SERVIDOR
// =====================================================

const PORT =
    process.env.PORT || 3000;


app.listen(

    PORT,

    () => {

        console.log(

            `Servidor corriendo en http://localhost:${PORT}`

        );

    }

);