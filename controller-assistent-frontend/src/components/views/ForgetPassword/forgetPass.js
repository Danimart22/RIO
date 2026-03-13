import React from "react";
import { ForgetPassView } from "./forgetPassView";
import { Navigate } from "react-router-dom";

export function ForgetPass() {
  // Verifica si no hay un token en el localStorage
  const isAuthenticated = localStorage.getItem("Token") === null;

  return (
    <>
      {isAuthenticated ? <ForgetPassView /> : <Navigate to="/bienvenida" />}
    </>
  );
}
