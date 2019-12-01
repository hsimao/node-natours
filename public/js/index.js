/* eslint-disable */
import '@babel/polyfill';
import { displayMap } from './mapbox';
import { login, logout } from './login';
import { updateData } from './updateSettings';

// DOM ELements
const mapBox = document.getElementById('map');
const inputEmail = document.getElementById('email');
const loginForm = document.getElementById('formLogin');
const logOutBtn = document.querySelector('.nav__el--logout');
const userDataForm = document.querySelector('.form.form-user-data');

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
  userDataForm.addEventListener('submit', e => {
    e.preventDefault();
    const name = document.getElementById('name').value;
    const email = document.getElementById('email').value;

    updateData(name, email);
  });
}
