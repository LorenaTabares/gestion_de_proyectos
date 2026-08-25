require('dotenv').config();

const express = require('express');
const path = require('path');

const CatalogoController =
    require('./controllers/catalogoController');

const AuthController =
    require('./controllers/authController');

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: false }));


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


// =====================================================
// RUTAS DE AUTENTICACIÓN
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