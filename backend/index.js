require('dotenv').config();

const express = require('express');
const path = require('path');

const CatalogoController =
    require('./controllers/catalogoController');

const app = express();


// =====================================================
// ARCHIVOS ESTÁTICOS
// =====================================================

app.use(
    express.static(
        path.join(__dirname, '../frontend')
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
// RUTA PRINCIPAL
// =====================================================

app.get(
    '/',
    (req, res) => {

        res.redirect('/catalogo');

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