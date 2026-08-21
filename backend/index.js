const express = require('express');
const app = express();
const PORT = 3000;

// Esto permite que el backend entienda los datos JSON que envíe el frontend
app.use(express.json());

// Ruta de prueba para saber si el framework funciona
app.get('/', (req, res) => {
    res.send('¡El servidor de Express está funcionando perfectamente!');
});

app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
