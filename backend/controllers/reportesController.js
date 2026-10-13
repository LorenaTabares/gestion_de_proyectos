const ReportesModel = require('../models/reportesModel');

const estados = {
    1: 'Pendiente',
    2: 'En proceso',
    3: 'Despachado',
    4: 'Cancelado'
};

const conteosVacios = () => ({ todos: 0, 1: 0, 2: 0, 3: 0, 4: 0 });

const convertirFoto = foto => {
    if (!foto) return '';

    const imagen = Buffer.from(foto);
    let mimeType = '';

    if (imagen.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) {
        mimeType = 'image/png';
    } else if (imagen.subarray(0, 3).equals(Buffer.from([255, 216, 255]))) {
        mimeType = 'image/jpeg';
    } else if (imagen.subarray(0, 3).toString('ascii') === 'GIF') {
        mimeType = 'image/gif';
    }

    return mimeType ? `data:${mimeType};base64,${imagen.toString('base64')}` : '';
};

const mostrarReportes = async (req, res) => {
    const query = req.query;
    const valorEstado = typeof query.estado === 'string' ? query.estado : 'todos';
    const estadoSeleccionado = Object.hasOwn(estados, valorEstado) ? valorEstado : 'todos';
    const busqueda = typeof query.buscar === 'string' ? query.buscar.trim().slice(0, 100) : '';
    const numeroPedido = busqueda.replace(/^#\s*/, '');
    const busquedaEsPedido = /^\d+$/.test(numeroPedido);
    const filtros = {
        status: estadoSeleccionado === 'todos' ? null : Number(estadoSeleccionado),
        cliente: busqueda && !busquedaEsPedido ? busqueda : '',
        salesOrderID: busquedaEsPedido ? Number(numeroPedido) : null
    };
    let errorFiltro = '';

    if (busquedaEsPedido && numeroPedido.length > 10) {
        errorFiltro = 'El número de pedido no puede superar 10 dígitos.';
    }

    const renderizar = (reportes, opciones = {}) => res.status(opciones.estadoHttp || 200).render('reportes', {
        reportes,
        estadoSeleccionado,
        busqueda,
        conteos: opciones.conteos || conteosVacios(),
        errorFiltro,
        errorCarga: opciones.errorCarga || false,
        pagina: 'reportes'
    });

    if (errorFiltro) return renderizar([], { estadoHttp: 400 });

    try {
        const resultado = await ReportesModel.obtenerPedidos(filtros);
        const conteos = conteosVacios();
        resultado.conteos.forEach(conteo => {
            const estado = String(conteo.Status);
            if (Object.hasOwn(conteos, estado)) conteos[estado] = Number(conteo.Total);
        });
        conteos.todos = resultado.conteos.reduce((total, conteo) => total + Number(conteo.Total), 0);

        const fotosClientes = new Map(resultado.fotosClientes.map(cliente => [
            String(cliente.CustomerID),
            convertirFoto(cliente.FotoPerfil)
        ]));

        const reportes = resultado.pedidos.map(pedido => ({
            ...pedido,
            CustomerName: [pedido.FirstName, pedido.LastName]
                .filter(Boolean)
                .join(' '),
            CustomerPhoto: fotosClientes.get(String(pedido.CustomerID)) || '',
            StatusName: estados[pedido.Status] || String(pedido.Status)
        }));

        return renderizar(reportes, { conteos });
    } catch (error) {
        console.error('Error al mostrar reportes:', error);
        return renderizar([], { estadoHttp: 500, errorCarga: true });
    }
};

module.exports = { mostrarReportes };