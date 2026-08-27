require('dotenv').config();

const express = require('express');
const path = require('path');
const session = require('express-session');

const CatalogoController =
    require('./controllers/catalogoController');



const CarritoController =
    require('./controllers/carritoController');


const app = express();
console.log('INDEX.JS QUE ESTOY EJECUTANDO');

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use(session({
    secret: 'aventuraworks-carrito',
    resave: false,
    saveUninitialized: true
}));


// =====================================================
// ARCHIVOS ESTÁTICOS
// =====================================================

app.use(
    express.static(
        path.join(__dirname, '../frontend')
    )
);

app.use(
    '/components',
    express.static(
        path.join(__dirname, '../components')
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
// RUTA CATÁLOGO
// =====================================================

app.get(
    '/catalogo',
    CatalogoController.mostrarCatalogo
);

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

console.log('RUTA POST /carrito/agregar REGISTRADA');



// =====================================================
// RUTAS DE AUTENTICACIÓN
// =====================================================

app.get(
    '/login',
    (req, res) => {

        res.sendFile(
            path.join(__dirname, '../frontend/html/login.html')
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