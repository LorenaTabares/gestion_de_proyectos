// =====================================================
// ANIMACIONES DEL LOGIN / REGISTRO
// =====================================================
const container = document.querySelector('.container');
const btnSignUp = document.querySelector('#btn-sign-up');
const btnSignIn = document.querySelector('#btn-sign-in');

// Cambia entre el formulario de login y el de registro usando la clase CSS "toggle"
btnSignUp?.addEventListener('click', () => container?.classList.add('toggle'));
btnSignIn?.addEventListener('click', () => container?.classList.remove('toggle'));

// =====================================================
// AUTENTICACIÓN CON EL BACKEND
// =====================================================
const btnLogin = document.querySelector('#btn-login');
const btnRegistro = document.querySelector('#btn-registro');

const mostrarMensaje = mensaje => {
    window.alert(mensaje);
};

// -----------------------------------------------------
// PROCESO DE REGISTRO
// -----------------------------------------------------
if (btnRegistro) {
    btnRegistro.addEventListener('click', async (e) => {
        e.preventDefault();

        const nombre = document.querySelector('#registro-nombre');
        const correo = document.querySelector('#registro-correo');
        const password = document.querySelector('#registro-password');

        const datos = {
            name: nombre ? nombre.value.trim() : '',
            email: correo ? correo.value.trim() : '',
            password: password ? password.value : ''
        };

        if (!datos.name || !datos.email || !datos.password) {
            mostrarMensaje('Todos los campos son obligatorios.');
            return;
        }

        btnRegistro.disabled = true;

        try {
            const respuesta = await fetch('/api/auth/registro', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(datos)
            });

            const resultado = await respuesta.json();
            mostrarMensaje(resultado.message);

            if (respuesta.ok) {
                if (nombre) nombre.value = '';
                if (correo) correo.value = '';
                if (password) password.value = '';

                if (container) {
                    container.classList.remove('toggle');
                }
            }
        } catch (error) {
            console.error('ERROR DE REGISTRO:', error);
            mostrarMensaje('No se pudo conectar con el servidor.');
        } finally {
            btnRegistro.disabled = false;
        }
    });
}

// -----------------------------------------------------
// PROCESO DE LOGIN
// -----------------------------------------------------
if (btnLogin) {
    btnLogin.addEventListener('click', async (e) => {
        e.preventDefault();

        const correo = document.querySelector('#login-email');
        const password = document.querySelector('#login-password');

        const datos = {
            email: correo ? correo.value.trim() : '',
            password: password ? password.value : ''
        };

        if (!datos.email || !datos.password) {
            mostrarMensaje('Correo y contraseña son obligatorios.');
            return;
        }

        btnLogin.disabled = true;

        try {
            const respuesta = await fetch('/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(datos)
            });

            const resultado = await respuesta.json();

            if (respuesta.ok) {
                // 1. Limpiar cualquier resto de sesión o carrito de un usuario anterior
                localStorage.removeItem('carrito');
                sessionStorage.clear();

                // 2. Guardar los datos del usuario logueado
                const usuario = resultado.usuario || {};
                sessionStorage.setItem('usuario', JSON.stringify(usuario));

                // 3. Evaluar el rol (soporta 'Rol' y 'role')
                const rolUsuario = (usuario.Rol || usuario.role || 'cliente').toLowerCase();

                // 4. Redireccionar a la vista según el rol
                if (rolUsuario === 'trabajador') {
                    window.location.assign('/inventario');
                } else {
                    window.location.assign('/catalogo');
                }
            } else {
                mostrarMensaje(resultado.message || 'Error al iniciar sesión.');
            }
        } catch (error) {
            console.error('ERROR DE LOGIN:', error);
            mostrarMensaje('No se pudo conectar con el servidor.');
        } finally {
            btnLogin.disabled = false;
        }
    });
}