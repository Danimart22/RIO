import React, { useEffect, useRef } from "react";
import { Navigate } from "react-router-dom";
import { ReporteAsistencia } from "./ReporteAsistencia";
import { dataDecrypt } from "../../../util";
import jwt_decode from "jwt-decode";
import Swal from "sweetalert2";

export function ReporteAsistencia() {
  const accessToken = dataDecrypt(localStorage.getItem("Token"));
  const tokenData = accessToken ? jwt_decode(accessToken) : null;

  const isAuthenticated = tokenData && new Date(tokenData.expiry) > new Date();

  const alertShownRef = useRef(false);

  const userRoles = () => {
    let roles = dataDecrypt(localStorage.getItem("Rol"));
    return roles;
  };

  useEffect(() => {
    const checkTokenExpiration = () => {
      if (tokenData && new Date(tokenData.expiry) <= new Date() && !alertShownRef.current) {
        alertShownRef.current = true;
        Swal.fire({
          background: localStorage.getItem("darkMode") === "true" ? "#212121" : "#FFFFFF",
          color: localStorage.getItem("darkMode") === "true" ? "white" : "black",
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

  let roles = userRoles();
  const hasRole = roles?.includes("RRHH");

  return (
    <>
      {isAuthenticated && hasRole ? <ReporteAsistencia /> : <Navigate to="/Login" />}
    </>
  );
}