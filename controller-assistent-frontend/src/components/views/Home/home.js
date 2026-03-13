import React from "react";
import "./HomeView.css";
import { HomeView } from "./homeView";
import { Navigate } from "react-router-dom";


export function Home() {

  const isAuthenticated = localStorage.getItem("Token") === null;

  return (
    <>
      {isAuthenticated ? <HomeView /> : <Navigate to="/Bienvenida" />}
    </>
  );
}