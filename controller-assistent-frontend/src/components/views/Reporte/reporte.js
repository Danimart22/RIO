import React, { useEffect, useRef } from "react";
import { Navigate } from "react-router-dom";
import { ReporteView } from "./reporteView"
import { Navbar } from "../Navbar/navbar";
import { dataDecrypt } from "../../../util";
import jwt_decode from "jwt-decode";
import Swal from "sweetalert2";

export function Reporte() {
  const accessToken = dataDecrypt(localStorage.getItem("Token"));
  const tokenData = accessToken ? jwt_decode(accessToken) : null;

    /*const [isAuthenticated, setIsAuthenticated] = useState(
    tokenData && new Date(tokenData.expiry) > new Date()
  );*/
  const isAuthenticated =tokenData && new Date(tokenData.expiry) > new Date();

  const alertShownRef = useRef(false);

  const userRoles = () => {
    let roles = dataDecrypt(localStorage.getItem("Rol"));
    return roles; // Devuelve el valor de los roles
  };

  useEffect(() => {
    // Función para verificar si el token ha expirado
    const checkTokenExpiration = () => {
      if (tokenData && new Date(tokenData.expiry) <= new Date() && !alertShownRef.current) {
        
        // La sesión ha expirado, muestra una modal de SweetAlert2
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
          // Elimina la información de autenticación del localStorage
              localStorage.removeItem("Token");
    localStorage.removeItem("Login");
    localStorage.removeItem("id");
localStorage.removeItem("Rol");

          // Redirige al usuario a la página de inicio de sesión
          window.location.href = "/Login"; // Ajusta la URL según tu enrutador
        });
      }
    };

        // Verifica el estado del token cada minuto (o ajusta el intervalo según tus necesidades)
        const tokenCheckInterval = setInterval(checkTokenExpiration, 1000);

        // Limpia el intervalo cuando el componente se desmonta
        return () => clearInterval(tokenCheckInterval);
      }, [tokenData]);
  
 // Obtén directamente el valor de userLoggin()
  let roles = userRoles(); // Obtén directamente el valor de userRoles()

  // Verifica si el array "roles" contiene el rol "RRHH" o "TI"
  const hasRole = roles && (roles.includes("RRHH")||roles.includes("TI"));

  return (
    <>
      {isAuthenticated && hasRole ? (<ReporteView />) : (<Navigate to="/Login" />)}
    </>
  );
}
