// Funciones para animaciones del LOGIN
const container = document.querySelector('.container');
const btnSignUp = document.querySelector('#btn-sign-up');
const btnSignIn = document.querySelector('#btn-sign-in');
// Cambia entre el formulario de login y el de registro usando la clase CSS "toggle"
btnSignUp.addEventListener('click', () => container.classList.add('toggle'));
btnSignIn.addEventListener('click', () => container.classList.remove('toggle'));

// Conecta los formularios con las rutas de autenticacion del backend.
const btnLogin = document.querySelector('#btn-login');
const btnRegistro = document.querySelector('#btn-registro');

const mostrarMensaje = mensaje => {
	window.alert(mensaje);
};

if (btnRegistro) {
	btnRegistro.addEventListener('click', async () => {
		const nombre = document.querySelector('#registro-nombre');
		const correo = document.querySelector('#registro-correo');
		const password = document.querySelector('#registro-password');

		const datos = {
			name: nombre.value.trim(),
			email: correo.value.trim(),
			password: password.value
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
				nombre.value = '';
				correo.value = '';
				password.value = '';

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

if (btnLogin) {
	btnLogin.addEventListener('click', async () => {
		const correo = document.querySelector('#login-email');
		const password = document.querySelector('#login-password');

		const datos = {
			email: correo.value.trim(),
			password: password.value
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
			mostrarMensaje(resultado.message);

			if (respuesta.ok) {
				console.log("Datos recibidos del servidor:", resultado.usuario); // <-- DEPURACIÓN
				// Guardar los datos del usuario en la sesión del navegador
				sessionStorage.setItem(
					'usuario',
					JSON.stringify(resultado.usuario)
				);

				// Redirección según el rol asignado
				if (resultado.usuario && resultado.usuario.role === 'trabajador') {
					window.location.assign('/inventario'); // Vista para trabajador/bodega
				} else {
					window.location.assign('/catalogo');   // Vista para cliente
				}
			}
		} catch (error) {
			console.error('ERROR DE LOGIN:', error);
			mostrarMensaje('No se pudo conectar con el servidor.');
		} finally {
			btnLogin.disabled = false;
		}
	});
}

