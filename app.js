
require('dotenv').config();

const express = require('express');
const cors = require('cors');

const app = express();

// Permitir solicitudes externas
app.use(cors());

// Permitir recibir datos JSON
app.use(express.json());

// Rutas de productos
app.use(
    '/api/productos',
    require('./routes/producto.routes')
);

// Ruta de prueba
app.get('/', (req, res) => {
    res.json({
        mensaje: 'API de Inventario funcionando correctamente'
    });
});

// Iniciar servidor
const PORT = process.env.PORT || 3000;

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Servidor ejecutándose en puerto ${PORT}`);
});
