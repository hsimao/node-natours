/* eslint-disable */
import '@babel/polyfill';
import { displayMap } from './mapbox';
import { login, logout } from './login';

// DOM ELements
const mapBox = document.getElementById('map');
const inputEmail = document.getElementById('email');
const loginForm = document.querySelector('.form');
const logOutBtn = document.querySelector('.nav__el--logout');

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
