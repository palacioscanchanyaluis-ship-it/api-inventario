
const express = require('express');
const router = express.Router();
const db = require('../config/database');

// ==========================================
// ACTIVIDAD 4: VALIDAR LOS DATOS DEL PRODUCTO
// ==========================================

function validarProducto(req, res, next) {

    const {
        nombre,
        estado,
        precio_compra,
        precio_venta,
        stock_actual,
        stock_minimo,
        unidad_medida
    } = req.body;

    // VALIDAR NOMBRE
    if (
        typeof nombre !== 'string' ||
        nombre.trim() === ''
    ) {
        return res.status(400).json({
            error: 'El nombre del producto es obligatorio'
        });
    }

    // VALIDAR UNIDAD DE MEDIDA
    if (
        typeof unidad_medida !== 'string' ||
        unidad_medida.trim() === ''
    ) {
        return res.status(400).json({
            error: 'La unidad de medida es obligatoria'
        });
    }

    // VALIDAR ESTADO
    if (!['ACTIVO', 'INACTIVO'].includes(estado)) {
        return res.status(400).json({
            error: 'El estado debe ser ACTIVO o INACTIVO'
        });
    }

    // VALIDAR PRECIOS
    const compra = Number(precio_compra);
    const venta = Number(precio_venta);

    if (
        precio_compra === undefined ||
        precio_venta === undefined ||
        precio_compra === null ||
        precio_venta === null ||
        String(precio_compra).trim() === '' ||
        String(precio_venta).trim() === '' ||
        !Number.isFinite(compra) ||
        !Number.isFinite(venta) ||
        compra < 0 ||
        venta < 0
    ) {
        return res.status(400).json({
            error: 'Los precios deben ser números válidos y no negativos'
        });
    }

    // VALIDAR STOCK ACTUAL Y MÍNIMO
    const actual = Number(stock_actual);
    const minimo = Number(stock_minimo);

    if (
        stock_actual === undefined ||
        stock_minimo === undefined ||
        stock_actual === null ||
        stock_minimo === null ||
        String(stock_actual).trim() === '' ||
        String(stock_minimo).trim() === '' ||
        !Number.isInteger(actual) ||
        !Number.isInteger(minimo) ||
        actual < 0 ||
        minimo < 0
    ) {
        return res.status(400).json({
            error: 'Los stocks deben ser números enteros no negativos'
        });
    }

    // NORMALIZAR LOS DATOS
    req.body.nombre = nombre.trim();
    req.body.unidad_medida = unidad_medida.trim();
    req.body.precio_compra = compra;
    req.body.precio_venta = venta;
    req.body.stock_actual = actual;
    req.body.stock_minimo = minimo;

    next();
}

// ==========================================
// LISTAR TODOS LOS PRODUCTOS
// ==========================================

router.get('/', async (req, res) => {
    try {

        const [rows] = await db.query(
            'SELECT * FROM producto ORDER BY id DESC'
        );

        res.json(rows);

    } catch (error) {

        res.status(500).json({
            error: error.message
        });

    }
});

// ==========================================
// CONSULTAR PRODUCTOS CON STOCK BAJO
// ==========================================

router.get('/stock-bajo', async (req, res) => {
    try {

        const [rows] = await db.query(`
            SELECT *
            FROM producto
            WHERE stock_actual <= stock_minimo
            ORDER BY stock_actual ASC
        `);

        res.json(rows);

    } catch (error) {

        res.status(500).json({
            error: error.message
        });

    }
});

// ==========================================
// REGISTRAR PRODUCTO
// ==========================================

router.post('/', validarProducto, async (req, res) => {
    try {

        const {
            nombre,
            estado,
            precio_compra,
            precio_venta,
            stock_actual,
            stock_minimo,
            unidad_medida
        } = req.body;

        const [result] = await db.query(`
            INSERT INTO producto
            (
                nombre,
                estado,
                precio_compra,
                precio_venta,
                stock_actual,
                stock_minimo,
                unidad_medida
            )
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `, [
            nombre,
            estado,
            precio_compra,
            precio_venta,
            stock_actual,
            stock_minimo,
            unidad_medida
        ]);

        res.status(201).json({
            mensaje: 'Producto registrado correctamente',
            id: result.insertId
        });

    } catch (error) {

        res.status(500).json({
            error: error.message
        });

    }
});

// ==========================================
// ACTUALIZAR PRODUCTO COMPLETO
// ==========================================

router.put('/:id', validarProducto, async (req, res) => {
    try {

        const id = Number(req.params.id);

        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({
                error: 'ID de producto no válido'
            });
        }

        const {
            nombre,
            estado,
            precio_compra,
            precio_venta,
            stock_actual,
            stock_minimo,
            unidad_medida
        } = req.body;

        const [result] = await db.query(`
            UPDATE producto SET
                nombre = ?,
                estado = ?,
                precio_compra = ?,
                precio_venta = ?,
                stock_actual = ?,
                stock_minimo = ?,
                unidad_medida = ?
            WHERE id = ?
        `, [
            nombre,
            estado,
            precio_compra,
            precio_venta,
            stock_actual,
            stock_minimo,
            unidad_medida,
            id
        ]);

        if (result.affectedRows === 0) {
            return res.status(404).json({
                error: 'Producto no encontrado'
            });
        }

        res.json({
            mensaje: 'Producto actualizado correctamente'
        });

    } catch (error) {

        res.status(500).json({
            error: error.message
        });

    }
});

// ==========================================
// ACTIVIDAD 3: ACTUALIZAR SOLAMENTE EL STOCK
// ==========================================

router.patch('/:id/stock', async (req, res) => {
    try {

        const id = Number(req.params.id);
        const { stock_actual } = req.body;

        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({
                error: 'ID de producto no válido'
            });
        }

        if (
            !Number.isInteger(stock_actual) ||
            stock_actual < 0
        ) {
            return res.status(400).json({
                error: 'El stock debe ser un entero no negativo'
            });
        }

        const [result] = await db.query(
            'UPDATE producto SET stock_actual = ? WHERE id = ?',
            [stock_actual, id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                error: 'Producto no encontrado'
            });
        }

        res.json({
            mensaje: 'Inventario actualizado correctamente',
            stock_actual: stock_actual
        });

    } catch (error) {

        res.status(500).json({
            error: error.message
        });

    }
});

// ==========================================
// ELIMINAR PRODUCTO
// ==========================================

router.delete('/:id', async (req, res) => {
    try {

        const id = Number(req.params.id);

        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({
                error: 'ID de producto no válido'
            });
        }

        const [result] = await db.query(
            'DELETE FROM producto WHERE id = ?',
            [id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                error: 'Producto no encontrado'
            });
        }

        res.json({
            mensaje: 'Producto eliminado correctamente'
        });

    } catch (error) {

        res.status(500).json({
            error: error.message
        });

    }
});

module.exports = router;
