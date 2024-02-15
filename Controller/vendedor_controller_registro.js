// controller/vendedor_controller_registro.js

const express = require('express');
const router = express.Router();
const vendedorModel = require('../Model/vendedor_model_registro');

router.post('/registrar-vendedor', (req, res) => {
    const datosVendedor = req.body;
    vendedorModel.insertarVendedor(datosVendedor, (error, results) => {
        if (error) {
            console.error('Error al insertar vendedor:', error);
            return res.status(500).send('Error interno del servidor');
        }
        res.send('Vendedor registrado exitosamente');
    });
});

module.exports = router;
