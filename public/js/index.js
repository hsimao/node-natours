/* eslint-disable */
import '@babel/polyfill';
import { displayMap } from './mapbox';
import { login, logout } from './login';
import { updateSettings } from './updateSettings';

// DOM ELements
const mapBox = document.getElementById('map');
const inputEmail = document.getElementById('email');
const loginForm = document.getElementById('formLogin');
const logOutBtn = document.querySelector('.nav__el--logout');
const userDataForm = document.querySelector('.form-user-data');
const userPasswordForm = document.querySelector('.form-user-password');

let apiActive = false;

if (mapBox) {
  const locations = JSON.parse(mapBox.dataset.locations);
  displayMap(locations);
}

if (inputEmail) inputEmail.focus();
function handleLoginSubmit() {
  loginForm.addEventListener('submit', e => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    login(email, password);
  });
}

if (loginForm) handleLoginSubmit();

if (logOutBtn) logOutBtn.addEventListener('click', logout);

if (userDataForm) {
  userDataForm.addEventListener('submit', async e => {
    if (apiActive) return;
    e.preventDefault();
    apiActive = true;
    const name = document.getElementById('name').value;
    const email = document.getElementById('email').value;

    await updateSettings({ name, email }, 'data');
    apiActive = false;
  });
}

if (userPasswordForm) {
  userPasswordForm.addEventListener('submit', async e => {
    if (apiActive) return;

    e.preventDefault();
    apiActive = true;
    document.querySelector('.btn--save-password').textContent = 'Updating...';

    const passwordCurrent = document.getElementById('password-current').value;
    const password = document.getElementById('password').value;
    const passwordConfirm = document.getElementById('password-confirm').value;

    await updateSettings(
      { passwordCurrent, password, passwordConfirm },
      'password'
    );
    apiActive = false;

    document.querySelector('.btn--save-password').textContent = 'Save password';
    document.getElementById('password-current').value = '';
    document.getElementById('password').value = '';
    document.getElementById('password-confirm').value = '';
  });
}
