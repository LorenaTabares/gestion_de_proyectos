// Funciones para animaciones del LOGIN
const container      = document.querySelector('.container');
const btnSignUp      = document.querySelector('#btn-sign-up');
const btnSignIn      = document.querySelector('#btn-sign-in');
// Cambia entre el formulario de login y el de registro usando la clase CSS "toggle"
btnSignUp.addEventListener('click', () => container.classList.add('toggle'));
btnSignIn.addEventListener('click', () => container.classList.remove('toggle'));

