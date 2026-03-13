import React, { useEffect, useRef } from "react";
import { Bienvenida } from "./bienvenidaView";
import { dataDecrypt } from "../../../util";
import jwt_decode from "jwt-decode";
import Swal from "sweetalert2"; // Importa SweetAlert2

export function BienvenidaCal() {
  // Obtiene el valor del token de localStorage
  const tokenValue = localStorage.getItem("Token");

  // Verifica si tokenValue es nulo o una cadena vacía
  const isTokenValid = tokenValue && tokenValue.trim() !== "";

  // Utiliza un estado adicional para controlar si la alerta se ha mostrado
  const alertShownRef = useRef(false);

  useEffect(() => {
    // Función para verificar si el token ha expirado
    const checkTokenExpiration = () => {
      // Si el token no es válido, muestra la alerta y redirige
      if (!isTokenValid) {
        alertShownRef.current = true;
        Swal.fire({
          background: localStorage.getItem("darkMode")==="true"?'#212121':'#FFFFFF',
          color: localStorage.getItem("darkMode")==="true"?'white':'black',
          icon: "info",
          title: "Sesión Expirada",
          text: "La sesión ha expirado. Por favor, inicia sesión nuevamente.",
          timer: 10000,
          allowOutsideClick: true,
        }).then(() => {
              localStorage.removeItem("Token");
    localStorage.removeItem("Login");
    localStorage.removeItem("id");
localStorage.removeItem("Rol");
    localStorage.removeItem("Rol");;
          window.location.href = "/Login";
        });
      } else {
        // Si el token es válido, verifica su expiración
        const accessToken = dataDecrypt(tokenValue);
        const tokenData = accessToken ? jwt_decode(accessToken) : null;

        if (tokenData && new Date(tokenData.expiry) <= new Date() && !alertShownRef.current) {
          alertShownRef.current = true;
          Swal.fire({
          background: localStorage.getItem("darkMode")==="true"?'#212121':'#FFFFFF',
          color: localStorage.getItem("darkMode")==="true"?'white':'black',
            icon: "info",
            title: "Sesión Expirada",
            text: "La sesión ha expirado. Por favor, inicia sesión nuevamente.",
            timer: 10000,
            allowOutsideClick: true,
          }).then(() => {
                localStorage.removeItem("Token");
    localStorage.removeItem("Login");
    localStorage.removeItem("id");
localStorage.removeItem("Rol");
            window.location.href = "/Login";
          });
        }
      }
    };

    // Verifica el estado del token cada minuto (o ajusta el intervalo según tus necesidades)
    const tokenCheckInterval = setInterval(checkTokenExpiration, 1000);

    // Limpia el intervalo cuando el componente se desmonta
    return () => clearInterval(tokenCheckInterval);
  }, [isTokenValid, tokenValue]);

  // Renderiza el componente según la autenticación
  if (!isTokenValid) {
    return null; // Evita renderizar el componente si no es válido
  }

  return (
    <>
      <Bienvenida />
    </>
  );
}
