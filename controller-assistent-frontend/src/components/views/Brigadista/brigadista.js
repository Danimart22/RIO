import React, { useEffect, useRef } from "react";
import { Navigate } from "react-router-dom";
import { BrigadistaView } from "./brigadistaView";
import { dataDecrypt } from "../../../util";
import jwt_decode from "jwt-decode";
import Swal from "sweetalert2";

export function Brigadista() {
  const accessToken = dataDecrypt(localStorage.getItem("Token"));
  const tokenData = accessToken ? jwt_decode(accessToken) : null;

      /*const [isAuthenticated, setIsAuthenticated] = useState(
    tokenData && new Date(tokenData.expiry) > new Date()
  );*/
  const isAuthenticated =tokenData && new Date(tokenData.expiry) > new Date();

  const alertShownRef = useRef(false);

  const userBrigadista = () => {
    let brigadista = dataDecrypt(localStorage.getItem("helpers"));
    return brigadista === "Si"; // Compara el valor con "Si" y devuelve true o false
  };

  useEffect(() => {
    const checkTokenExpiration = () => {
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
    };

    const tokenCheckInterval = setInterval(checkTokenExpiration, 1000);
    return () => clearInterval(tokenCheckInterval);
  }, [tokenData]);

  const isBrigadista = userBrigadista(); // Ahora verifica si es igual a "Si"

  return (
    <>
      {isAuthenticated && isBrigadista ? <BrigadistaView /> : <Navigate to="/Login" />}
    </>
  );
}
