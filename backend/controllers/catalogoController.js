const CatalogoModel = require('../models/catalogoModel');

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

class CatalogoController {


  // =====================================================
  // DETERMINAR QUÉ TIPO DE PRODUCTO ES
  // =====================================================

  static obtenerConsultaImagen(nombreProducto, categoria) {

    const name = (nombreProducto || '').toLowerCase();

    const category = (categoria || '').toLowerCase();


    // -----------------------------------------------------
    // CASCOS
    // -----------------------------------------------------

    if (
      name.includes('helmet') ||
      category.includes('helmet')
    ) {

      return 'professional cycling helmet product photography';

    }


    // -----------------------------------------------------
    // GUANTES
    // -----------------------------------------------------

    if (
      name.includes('glove') ||
      category.includes('glove')
    ) {

      return 'professional cycling gloves product photography';

    }


    // -----------------------------------------------------
    // MEDIAS
    // -----------------------------------------------------

    if (
      name.includes('sock') ||
      category.includes('sock')
    ) {

      return 'professional cycling socks product photography';

    }


    // -----------------------------------------------------
    // JERSEYS / CAMISETAS
    // -----------------------------------------------------

    if (
      name.includes('jersey') ||
      name.includes('shirt') ||
      name.includes('vest')
    ) {

      return 'professional cycling jersey product photography';

    }


    // -----------------------------------------------------
    // ZAPATOS
    // -----------------------------------------------------

    if (
      name.includes('shoe') ||
      name.includes('shoes')
    ) {

      return 'professional cycling shoes product photography';

    }


    // -----------------------------------------------------
    // MARCO DE RUTA
    // -----------------------------------------------------

    if (
      name.includes('road frame')
    ) {

      return 'professional road bicycle frame product photography';

    }


    // -----------------------------------------------------
    // MARCO DE MONTAÑA
    // -----------------------------------------------------

    if (
      name.includes('mountain frame')
    ) {

      return 'professional mountain bike frame product photography';

    }


    // -----------------------------------------------------
    // MARCOS GENÉRICOS
    // -----------------------------------------------------

    if (
      name.includes('frame') ||
      category.includes('frame')
    ) {

      return 'professional bicycle frame product photography';

    }


    // -----------------------------------------------------
    // RUEDAS
    // -----------------------------------------------------

    if (
      name.includes('wheel') ||
      category.includes('wheel')
    ) {

      return 'professional bicycle wheel product photography';

    }


    // -----------------------------------------------------
    // LLANTAS
    // -----------------------------------------------------

    if (
      name.includes('tire') ||
      name.includes('tyre')
    ) {

      return 'professional bicycle tire product photography';

    }


    // -----------------------------------------------------
    // PEDALES
    // -----------------------------------------------------

    if (
      name.includes('pedal')
    ) {

      return 'professional bicycle pedals product photography';

    }


    // -----------------------------------------------------
    // FRENOS
    // -----------------------------------------------------

    if (
      name.includes('brake')
    ) {

      return 'professional bicycle brake product photography';

    }


    // -----------------------------------------------------
    // BIELAS
    // -----------------------------------------------------

    if (
      name.includes('crank')
    ) {

      return 'professional bicycle crankset product photography';

    }


    // -----------------------------------------------------
    // CAMBIOS
    // -----------------------------------------------------

    if (
      name.includes('derailleur')
    ) {

      return 'professional bicycle derailleur product photography';

    }


    // -----------------------------------------------------
    // BICICLETAS
    // -----------------------------------------------------

    if (
      name.includes('bike') ||
      name.includes('bicycle')
    ) {

      return 'professional bicycle product photography';

    }


    // -----------------------------------------------------
    // FALLBACK
    // -----------------------------------------------------

    return 'professional cycling equipment product photography';

  }


  // =====================================================
  // CONVERTIR BUFFER DE SQL SERVER EN DATA URL
  // =====================================================

  static convertirImagenBase64(buffer, nombreArchivo) {

    if (!buffer) {
      return null;
    }


    if (!Buffer.isBuffer(buffer)) {
      return null;
    }


    if (buffer.length === 0) {
      return null;
    }


    const extension =
      (nombreArchivo || '').toLowerCase();


    let mimeType = 'image/jpeg';


    if (extension.endsWith('.png')) {

      mimeType = 'image/png';

    }

    else if (extension.endsWith('.gif')) {

      mimeType = 'image/gif';

    }

    else if (extension.endsWith('.webp')) {

      mimeType = 'image/webp';

    }


    return `data:${mimeType};base64,${buffer.toString('base64')}`;

  }


  // =====================================================
  // OBTENER IMAGEN DE ADVENTUREWORKS
  // =====================================================

  static obtenerImagenDeBaseDeDatos(producto) {

    // Primero intentamos utilizar la fotografía grande.

    const imagenGrande =
      CatalogoController.convertirImagenBase64(
        producto.LargePhoto,
        producto.LargePhotoFileName
      );


    if (imagenGrande) {

      return imagenGrande;

    }


    // Si no existe, utilizamos la miniatura.

    const miniatura =
      CatalogoController.convertirImagenBase64(
        producto.ThumbNailPhoto,
        producto.ThumbNailPhotoFileName
      );


    if (miniatura) {

      return miniatura;

    }


    return null;

  }


  // =====================================================
  // BUSCAR IMAGEN EN UNSPLASH
  // =====================================================

  static async buscarImagenUnsplash(
    nombreProducto,
    categoria,
    idProducto
  ) {

    try {

      const accessKey =
        process.env.UNSPLASH_ACCESS_KEY;


      if (!accessKey) {

        console.warn(
          'No se encontró UNSPLASH_ACCESS_KEY en .env'
        );

        return null;

      }


      const consulta =
        CatalogoController.obtenerConsultaImagen(
          nombreProducto,
          categoria
        );


      const url =
        'https://api.unsplash.com/search/photos?' +
        new URLSearchParams({

          query: consulta,

          per_page: '30',

          orientation: 'landscape',

          content_filter: 'high'

        });


      const response =
        await fetch(url, {

          headers: {

            Authorization:
              `Client-ID ${accessKey}`

          }

        });


      if (!response.ok) {

        console.error(
          'ERROR UNSPLASH:',
          response.status,
          response.statusText
        );

        return null;

      }


      const data =
        await response.json();


      if (
        !data.results ||
        data.results.length === 0
      ) {

        return null;

      }


      /*
       * Utilizamos el ProductID para seleccionar
       * una posición estable dentro de los resultados.
       *
       * Así no todos los productos utilizan
       * exactamente la primera fotografía.
       */

      const indice =
        idProducto % data.results.length;


      const fotografia =
        data.results[indice];


      if (
        !fotografia ||
        !fotografia.urls ||
        !fotografia.urls.regular
      ) {

        return null;

      }


      return fotografia.urls.regular +
        '&w=900&h=600&fit=crop';


    } catch (error) {

      console.error(
        'ERROR BUSCANDO IMAGEN EN UNSPLASH:',
        error
      );

      return null;

    }

  }


  // =====================================================
  // IMAGEN FINAL DEL PRODUCTO
  // =====================================================

  static async obtenerImagenProducto(producto) {


    // -----------------------------------------------------
    // 1. INTENTAR IMAGEN DE ADVENTUREWORKS
    // -----------------------------------------------------

    const imagenBD =
      CatalogoController.obtenerImagenDeBaseDeDatos(
        producto
      );


    if (imagenBD) {

      return imagenBD;

    }


    // -----------------------------------------------------
    // 2. SI NO EXISTE → BUSCAR EN UNSPLASH
    // -----------------------------------------------------

    const imagenUnsplash =
      await CatalogoController.buscarImagenUnsplash(

        producto.Name,

        producto.CategoryName,

        producto.ProductID

      );


    if (imagenUnsplash) {

      return imagenUnsplash;

    }


    // -----------------------------------------------------
    // 3. ÚLTIMO FALLBACK
    // -----------------------------------------------------

    return '/imagenes/logo.png';

  }


  // =====================================================
  // MOSTRAR CATÁLOGO
  // =====================================================

  static async mostrarCatalogo(req, res) {

    try {


      // ---------------------------------------------------
      // PAGINACIÓN
      // ---------------------------------------------------

      const limite = 9;


      const paginaActual =
        parseInt(req.query.pagina) || 1;


      const offset =
        (paginaActual - 1) * limite;


      // ---------------------------------------------------
      // TOTAL DE PRODUCTOS
      // ---------------------------------------------------

      const totalProductos =
        await CatalogoModel.obtenerTotalProductos();


      // ---------------------------------------------------
      // PRODUCTOS
      // ---------------------------------------------------

      const productosRaw =
        await CatalogoModel.obtenerProductosPaginados(

          offset,

          limite

        );


      // ---------------------------------------------------
      // TOTAL DE PÁGINAS
      // ---------------------------------------------------

      const totalPaginas =
        Math.ceil(
          totalProductos / limite
        );


      // ---------------------------------------------------
      // OBTENER IMÁGENES
      // ---------------------------------------------------

      const productos =
        await Promise.all(

          productosRaw.map(
            async producto => ({

              ...producto,

              imagenUrl:
                await CatalogoController
                  .obtenerImagenProducto(
                    producto
                  )

            })
          )

        );


      // ---------------------------------------------------
      // RENDER
      // ---------------------------------------------------

      res.render(
        'catalogo',
        {

          productos,

          paginaActual,

          totalPaginas,

          pagina: 'catalogo'

        }
      );


    } catch (error) {

      console.error(
        '--- ERROR EN MOSTRAR CATALOGO ---'
      );

      console.error(error);


      res.status(500).send(
        'Error al cargar el catálogo.'
      );

    }

  }

  // =====================================================
  // MOSTRAR DETALLES DEL PRODUCTO
  // =====================================================
  static async mostrarDetalle(req, res) {
    try {
      const productId = parseInt(req.params.id);

      if (isNaN(productId) || productId <= 0) {
        return res.status(400).send('ID de producto no válido.');
      }

      const productoRaw = await CatalogoModel.obtenerDetalleProducto(productId);

      if (!productoRaw) {
        return res.status(404).send('Producto no encontrado.');
      }

      // Mapeo de imagen
      const imagenUrl = IMAGENES_PRODUCTOS[productId] || 'https://images.unsplash.com/photo-1485965120184-e220f721d03e?w=600&q=80';

      const producto = {
        ProductID: productoRaw.ProductID,
        Name: productoRaw.Name || 'Producto sin nombre',
        ProductNumber: productoRaw.ProductNumber || 'N/A',
        Color: productoRaw.Color || null,
        ListPrice: productoRaw.ListPrice || 0,
        Size: productoRaw.Size || null,
        Weight: productoRaw.Weight || null,
        Stock: productoRaw.Stock ?? 0, // Se obtiene directo de la base de datos
        CategoryName: productoRaw.CategoryName || 'General',
        Description: productoRaw.Description || 'Sin descripción disponible.',
        imagenUrl: imagenUrl
      };

      res.render('productoDetalle', {
        producto,
        pagina: 'catalogo'
      });
    } catch (error) {
      console.error('ERROR AL MOSTRAR DETALLES DEL PRODUCTO:', error);
      res.status(500).send('Error al cargar los detalles del producto.');
    }
  }


}


module.exports = CatalogoController;