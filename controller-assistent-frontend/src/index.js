import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';
import jwt_decode from 'jwt-decode';
import { dataDecrypt } from './util';

const accessToken = dataDecrypt(localStorage.getItem("Token"));

if (accessToken) {
  const tokenData = jwt_decode(accessToken);
  if (new Date(tokenData.expiry) <= new Date()) {
    // Si el token está vencido, realiza la accion de cerrar sesion
    localStorage.removeItem("Token");
    localStorage.removeItem("Login");
    localStorage.removeItem("id");
    localStorage.removeItem("Rol");

  }
}


ReactDOM.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
  document.getElementById('root')
);

// document.addEventListener('copy', function(e) {
//   e.preventDefault();
//   alert('El copiado está deshabilitado en esta página.');
// });

document.addEventListener('cut', function (e) {
  e.preventDefault();
  alert('El cortado está deshabilitado en esta página.');
});

// document.addEventListener('paste', function(e) {
//   e.preventDefault();
//   alert('El pegado está deshabilitado en esta página.');
// });
