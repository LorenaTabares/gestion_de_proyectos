
const ProductosAdminModel = require('../models/productosAdminModel');
const path = require('path');

// Imágenes que ya utiliza el catálogo.
const IMAGENES_PRODUCTOS = {
    680: '/imagenes/road_frame_black_58.jpg',
    706: '/imagenes/road_frame_red_58.jpg',
    707: '/imagenes/Helmet_Red.png',
    708: '/imagenes/Helmet_Black.jpg',
    709: '/imagenes/Mountain_Bike_Socks_Size_M.jpg',
    710: '/imagenes/Mountain_Bike_Socks_Size_L.jpg',
    711: '/imagenes/Helmet_Blue.jpg',
    712: '/imagenes/AWC_Logo_Cap.jpg',
    713: '/imagenes/Long_Sleeve_Logo_Jersey_S.jpg',
    714: '/imagenes/Long_Sleeve_Logo_Jersey_M.jpg',
    715: '/imagenes/Long_Sleeve_Logo_Jersey_L.jpg',
    716: '/imagenes/Long_Sleeve_Logo_Jersey_XL.jpg',
    717: '/imagenes/HL_Road_Frame_Red_62.png',
    718: '/imagenes/HL_Road_Frame_Red_48.jpg',
    719: '/imagenes/HL_Road_Frame_Red_44.jpg'
};

class ProductosAdminController {

    // ==========================================
    // PREPARAR IMAGEN PARA MOSTRAR
    // ==========================================
    static obtenerImagen(producto) {

        const nombreArchivo = String(
            producto.ThumbnailPhotoFileName || ''
        );

        // Las imágenes subidas por el administrador
        // tienen prioridad.
        if (
            nombreArchivo.startsWith('ADMIN_') &&
            producto.ThumbNailPhoto &&
            Buffer.isBuffer(producto.ThumbNailPhoto)
        ) {
            const extension = nombreArchivo.toLowerCase();

            let tipo = 'image/jpeg';

            if (extension.endsWith('.png')) {
                tipo = 'image/png';
            } else if (extension.endsWith('.webp')) {
                tipo = 'image/webp';
            }

            return `data:${tipo};base64,${producto.ThumbNailPhoto.toString('base64')}`;
        }

        // Para los productos antiguos utilizamos
        // las imágenes definidas en el catálogo.
        if (IMAGENES_PRODUCTOS[producto.ProductID]) {
            return IMAGENES_PRODUCTOS[producto.ProductID];
        }

        // Para productos nuevos utilizamos su imagen guardada.
        if (
            producto.ThumbNailPhoto &&
            Buffer.isBuffer(producto.ThumbNailPhoto)
        ) {
            return `data:image/jpeg;base64,${producto.ThumbNailPhoto.toString('base64')}`;
        }

        return null;
    }

    // ==========================================
    // MOSTRAR LISTADO
    // ==========================================
    static async mostrarProductos(req, res) {
        try {
            const productos = await ProductosAdminModel.obtenerTodos();

            productos.forEach(producto => {
                producto.imagenUrl =
                    ProductosAdminController.obtenerImagen(producto);
            });

            return res.render('adminProductos', {
                productos,
                mensaje: req.query.mensaje || '',
                error: req.query.error || '',
                pagina: 'admin-productos'
            });

        } catch (error) {
            console.error('Error al mostrar productos:', error);

            return res.status(500).send(
                'No se pudo cargar la administración de productos.'
            );
        }
    }

    // ==========================================
    // MOSTRAR FORMULARIO DE CREACIÓN
    // ==========================================
    static async mostrarCrear(req, res) {
        try {
            const categorias =
                await ProductosAdminModel.obtenerCategorias();

            return res.render('adminProductoFormulario', {
                producto: null,
                categorias,
                modo: 'crear',
                error: ''
            });

        } catch (error) {
            console.error('Error al cargar categorías:', error);

            return res.status(500).send(
                'No se pudieron cargar las categorías.'
            );
        }
    }

    // ==========================================
    // CREAR PRODUCTO
    // ==========================================
    static async crear(req, res) {
        try {
            const datos = ProductosAdminController.validarDatos(req.body);

            if (!datos.valido) {
                return res.redirect(
                    '/admin/productos/nuevo?error=' +
                    encodeURIComponent(datos.mensaje)
                );
            }

            if (!req.file) {
                return res.redirect(
                    '/admin/productos/nuevo?error=' +
                    encodeURIComponent('Debes seleccionar una imagen.')
                );
            }

            const id = await ProductosAdminModel.crear(
                datos,
                {
                    buffer: req.file.buffer,
                    nombre: (
                        'ADMIN_' +
                        req.file.originalname.split(/[\\/]/).pop()
                    ).slice(0, 50)
                }
            );

            return res.redirect(
                '/admin/productos?mensaje=' +
                encodeURIComponent(`Producto creado correctamente. ID: ${id}`)
            );

        } catch (error) {
            console.error('Error al crear producto:', error);

            return res.redirect(
                '/admin/productos?error=' +
                encodeURIComponent('No se pudo crear el producto. Verifica los datos.')
            );
        }
    }

    // ==========================================
    // MOSTRAR FORMULARIO DE EDICIÓN
    // ==========================================
    static async mostrarEditar(req, res) {
        try {
            const id = Number(req.params.id);

            if (!Number.isInteger(id) || id <= 0) {
                return res.redirect('/admin/productos?error=ID%20inv%C3%A1lido');
            }

            const producto = await ProductosAdminModel.obtenerPorId(id);

            if (!producto) {
                return res.redirect(
                    '/admin/productos?error=' +
                    encodeURIComponent('El producto no existe o no se puede administrar.')
                );
            }

            producto.imagenUrl =
                ProductosAdminController.obtenerImagen(producto);

            const categorias =
                await ProductosAdminModel.obtenerCategorias();

            return res.render('adminProductoFormulario', {
                producto,
                categorias,
                modo: 'editar',
                error: req.query.error || ''
            });

        } catch (error) {
            console.error('Error al cargar producto:', error);

            return res.status(500).send(
                'No se pudo cargar el producto.'
            );
        }
    }

    // ==========================================
    // ACTUALIZAR PRODUCTO
    // ==========================================
    static async actualizar(req, res) {
        try {
            const id = Number(req.params.id);

            if (!Number.isInteger(id) || id <= 0) {
                return res.redirect('/admin/productos?error=ID%20inv%C3%A1lido');
            }

            const existente = await ProductosAdminModel.obtenerPorId(id);

            if (!existente) {
                return res.redirect(
                    '/admin/productos?error=' +
                    encodeURIComponent('El producto no existe o no se puede administrar.')
                );
            }

            const datos = ProductosAdminController.validarDatos(req.body);

            if (!datos.valido) {
                return res.redirect(
                    `/admin/productos/${id}/editar?error=` +
                    encodeURIComponent(datos.mensaje)
                );
            }

            const imagen = req.file
                ? {
                    buffer: req.file.buffer,
                    nombre: (
                        'ADMIN_' +
                        req.file.originalname.split(/[\\/]/).pop()
                    ).slice(0, 50)
                }
                : null;

            await ProductosAdminModel.actualizar(id, datos, imagen);

            return res.redirect(
                '/admin/productos?mensaje=' +
                encodeURIComponent('Producto actualizado correctamente.')
            );

        } catch (error) {
            console.error('Error al actualizar producto:', error);

            return res.redirect(
                '/admin/productos?error=' +
                encodeURIComponent('No se pudo actualizar el producto.')
            );
        }
    }

    // ==========================================
    // ELIMINAR PRODUCTO
    // ==========================================
    static async eliminar(req, res) {
        try {
            const id = Number(req.params.id);

            if (!Number.isInteger(id) || id <= 0) {
                return res.redirect('/admin/productos?error=ID%20inv%C3%A1lido');
            }

            const eliminado = await ProductosAdminModel.eliminar(id);

            if (!eliminado) {
                return res.redirect(
                    '/admin/productos?error=' +
                    encodeURIComponent('El producto no existe o no se puede eliminar.')
                );
            }

            return res.redirect(
                '/admin/productos?mensaje=' +
                encodeURIComponent('Producto eliminado correctamente.')
            );

        } catch (error) {
            console.error('Error al eliminar producto:', error);

            if (error.number === 547) {
                return res.redirect(
                    '/admin/productos?error=' +
                    encodeURIComponent(
                        'No se puede eliminar este producto porque está relacionado con pedidos o carritos.'
                    )
                );
            }

            return res.redirect(
                '/admin/productos?error=' +
                encodeURIComponent('Ocurrió un error al eliminar el producto.')
            );
        }
    }

    // ==========================================
    // VALIDAR FORMULARIO
    // ==========================================
    static validarDatos(body) {
        const nombre = String(body.nombre || '').trim();
        const precio = Number(body.precio);
        const stock = Number(body.stock);
        const categoria = Number(body.categoria);

        if (!nombre) {
            return {
                valido: false,
                mensaje: 'El nombre del producto es obligatorio.'
            };
        }

        if (nombre.length > 50) {
            return {
                valido: false,
                mensaje: 'El nombre no puede superar los 50 caracteres.'
            };
        }

        if (!Number.isFinite(precio) || precio < 0) {
            return {
                valido: false,
                mensaje: 'El precio debe ser un número válido mayor o igual a cero.'
            };
        }

        if (
            !Number.isInteger(stock) ||
            stock < 0
        ) {
            return {
                valido: false,
                mensaje: 'El stock debe ser un número entero mayor o igual a cero.'
            };
        }

        if (!Number.isInteger(categoria) || categoria <= 0) {
            return {
                valido: false,
                mensaje: 'Debes seleccionar una categoría válida.'
            };
        }

        return {
            valido: true,
            nombre,
            precio,
            stock,
            categoria
        };
    }
}

module.exports = ProductosAdminController;
