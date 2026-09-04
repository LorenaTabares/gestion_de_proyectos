const InventarioModel = require('../models/inventarioModel');


// ==========================================
// MOSTRAR INVENTARIO
// ==========================================
const mostrarInventario = async (req, res) => {

  try {

    const datos = await InventarioModel.obtenerPedidos();

    // --------------------------------------
    // Agrupar productos por pedido
    // --------------------------------------

    const pedidosMap = new Map();

    datos.forEach(fila => {

      if (!pedidosMap.has(fila.SalesOrderID)) {

        pedidosMap.set(fila.SalesOrderID, {

          SalesOrderID: fila.SalesOrderID,

          OrderDate: fila.OrderDate,

          Status: Number(fila.Status),

          productos: []

        });

      }

      const pedido = pedidosMap.get(fila.SalesOrderID);

      pedido.productos.push({

        ProductID: fila.ProductID,

        Name: fila.Name,

        ProductNumber: fila.ProductNumber,

        OrderQty: fila.OrderQty

      });

    });


    // Convertir Map en arreglo
    const pedidos = Array.from(pedidosMap.values());


    // --------------------------------------
    // Separar pedidos por estado
    // --------------------------------------

    const pedidosPorEstado = {

      pendiente: pedidos.filter(
        pedido => pedido.Status === 1
      ),

      proceso: pedidos.filter(
        pedido => pedido.Status === 2
      ),

      despachado: pedidos.filter(
        pedido => pedido.Status === 3
      ),

      cancelado: pedidos.filter(
        pedido => pedido.Status === 4
      )

    };


    console.log(
      'Pedidos encontrados:',
      pedidos.length
    );

    console.log(
      'Pedidos por estado:',
      pedidosPorEstado
    );


    return res.render(
      'inventario',
      {
        pedidosPorEstado: pedidosPorEstado,
        pagina: 'inventario'
      }
    );


  } catch (error) {

    console.error(
      'Error al mostrar inventario:',
      error
    );

    return res
      .status(500)
      .send('Error al cargar el inventario');

  }

};


// ==========================================
// CAMBIAR ESTADO
// ==========================================
const cambiarEstado = async (req, res) => {

  try {

    const salesOrderID =
      Number(req.body.SalesOrderID);

    const status =
      Number(req.body.Status);


    const estadosPermitidos = [
      1,
      2,
      3,
      4
    ];


    // Validar datos
    if (
      !Number.isInteger(salesOrderID) ||
      !estadosPermitidos.includes(status)
    ) {

      return res
        .status(400)
        .send('Datos de estado inválidos.');

    }


    // Actualizar en SQL Server
    const filasActualizadas =
      await InventarioModel.cambiarEstado(
        salesOrderID,
        status
      );


    if (filasActualizadas !== 1) {

      return res
        .status(404)
        .send('El pedido no existe.');

    }


    // Volver al inventario
    return res.redirect('/inventario');


  } catch (error) {

    console.error(
      'Error al cambiar estado:',
      error
    );

    return res
      .status(500)
      .send(
        'No se pudo cambiar el estado del pedido.'
      );

  }

};


module.exports = {
  mostrarInventario,
  cambiarEstado
};