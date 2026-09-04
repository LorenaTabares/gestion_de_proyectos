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


const app = express();


console.log('INDEX.JS QUE ESTOY EJECUTANDO');


// =====================================================
// MIDDLEWARE
// =====================================================

app.use(express.json());

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


// =====================================================
// ARCHIVOS ESTÁTICOS
// =====================================================

app.use(

    express.static(

        path.join(
            __dirname,
            '../frontend'
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
        '../frontend/html'
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


app.get(

    '/login',

    (req, res) => {

        res.sendFile(

            path.join(

                __dirname,

                '../frontend/html/login.html'

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