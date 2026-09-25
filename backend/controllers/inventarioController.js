// Asegurar la coincidencia exacta de mayúsculas/minúsculas del archivo
const InventarioModel = require('../models/inventarioModel');

// ==========================================
// MOSTRAR INVENTARIO
// ==========================================
const mostrarInventario = async (req, res) => {
  try {
    // El modelo devuelve los pedidos agrupados con sus productos y stock
    const pedidos = await InventarioModel.obtenerPedidos();

    // --------------------------------------
    // Separar pedidos por estado
    // --------------------------------------
    const pedidosPorEstado = {
      pendiente: pedidos.filter(pedido => Number(pedido.Status) === 1),
      proceso: pedidos.filter(pedido => Number(pedido.Status) === 2),
      despachado: pedidos.filter(pedido => Number(pedido.Status) === 3),
      cancelado: pedidos.filter(pedido => Number(pedido.Status) === 4)
    };

    console.log('Pedidos encontrados:', pedidos.length);

    return res.render('inventario', {
      pedidosPorEstado: pedidosPorEstado,
      pagina: 'inventario',
      usuario: req.session ? req.session.usuario : null
    });

  } catch (error) {
    console.error('Error al mostrar inventario:', error);
    return res.status(500).send('Error al cargar el inventario');
  }
};

// ==========================================
// CAMBIAR ESTADO
// ==========================================
const cambiarEstado = async (req, res) => {
  try {
    const salesOrderID = Number(req.body.SalesOrderID);
    const status = Number(req.body.Status);

    const estadosPermitidos = [1, 2, 3, 4];

    // Validar datos
    if (!Number.isInteger(salesOrderID) || !estadosPermitidos.includes(status)) {
      return res.status(400).send('Datos de estado inválidos.');
    }

    // Actualizar estado del pedido
    await InventarioModel.actualizarEstadoPedido(salesOrderID, status);

    // Volver a cargar el inventario
    return res.redirect('/inventario');

  } catch (error) {
    console.error('Error al cambiar estado:', error);
    return res.status(500).send('No se pudo cambiar el estado del pedido.');
  }
};

module.exports = {
  mostrarInventario,
  cambiarEstado
};