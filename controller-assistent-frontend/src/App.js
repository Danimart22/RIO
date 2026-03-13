import { useEffect, useState } from "react";
import { BrowserRouter, Route, Routes, Navigate,useLocation } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import { Home } from "./components/views/Home/home";
import { Login } from "./components/views/Login/login";
import { BienvenidaCal } from "./components/views/Bienvenida/bienvenida";
import { Perfil } from "./components/views/Perfil/perfil";
import { RRHH } from "./components/views/RRHH/rrhh";
import { Oficina } from "./components/views/Oficina/oficina";
import { Asistencias } from "./components/views/Asistencias/asistencias";
import { Privacidad } from "./components/views/Perfil/privacidad";
import { Admin } from "./components/views/Admin/admin";
import { Porteria } from "./components/views/Porteria/porteria";
import { ForgetPass } from "./components/views/ForgetPassword/forgetPass";
import { Visitante } from "./components/views/Visitantes/visitante";
import { Brigadista } from "./components/views/Brigadista/brigadista";
import { Reemplazo } from "./components/views/Reemplazo/reemplazo";
import { Reporte } from "./components/views/Reporte/reporte"
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { ConfigProvider, theme } from 'antd';
import { Reservas } from "./components/views/Reservas/Reservas";
import { Navbar } from "./components/views/Navbar/navbar";
import { ReporteAsistenciaView } from "./components/views/ReporteAsistencia/ReporteAsistenciaView";
import { HealthCheck } from "./components/views/HealthCheck/HealthCheck";
import NoBorrar from "./components/views/NoBorrar/NoBorrar";

function App() {
    const hideNavbarPaths = ['/login','/Login', '/ForgetPass','/Bienvenida','/'];
    
    useEffect(() => {
    const storedDarkMode = localStorage.getItem("darkMode");
    if (storedDarkMode === null) {
      localStorage.setItem("darkMode", "true");
    }
    }, []);

  const [darkMode, setDarkMode] = useState(localStorage.getItem("darkMode") === "true");
  if (darkMode) {
    document.body.style.backgroundColor = '#212121';
    document.body.style.color = 'white';
  } else {
    document.body.style.backgroundColor = 'white';
    document.body.style.color = 'black';
  }
  

  useEffect(() => {
    localStorage.removeItem("true");
    localStorage.removeItem("Login");
  }, []);

  useEffect(() => {
    const handleStorageChange = () => {
      setDarkMode(localStorage.getItem("darkMode") === "true");
    };
    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);


  const darkTheme = createTheme({
    palette: {
      mode: localStorage.getItem("darkMode") === "true"?'dark':'light',
    },
  });
const AppContent = () => {
    const location = useLocation();
    return (
      <>
        {!hideNavbarPaths.includes(location.pathname) && <Navbar />}
        <Routes>
          <Route path="/health.json" element={<HealthCheck />} />
          <Route exact path='/' element={<Home />} />
          <Route exact path='/Login' element={<Login />} />
          <Route exact path='/ForgetPass' element={<ForgetPass />} />
          <Route path='/Bienvenida' element={<BienvenidaCal />} />
          <Route path='/Perfil' element={<Perfil />} />
          <Route path='/Empleados' element={<RRHH />} />
          <Route path='/Oficina' element={<Oficina />} />
          <Route path='/Asistencias' element={<Asistencias />} />
          <Route path='/Privacidad' element={<Privacidad />} />
          <Route path='/Admin' element={<Admin />} />
          <Route path='/Reportes' element={<Reporte />} />
          <Route path='/Porteria' element={<Porteria />} />
          <Route path='/Visitantes' element={<Visitante />} />
          <Route path='/Reservas' element={<Reservas />} />
          <Route path='/Brigadista' element={<Brigadista />} />
          <Route path='/Reemplazos' element={<Reemplazo />} />
          <Route path='*' element={<Navigate to='/Login' replace />} />
          <Route path='/login' element={<Navigate to='/Login' replace />} />
          <Route path='/ReporteAsistencia' element={<ReporteAsistenciaView />} />
          <Route path="/env.js" element={<Navigate to="/" replace />} />
          {/*No entrar a esta ruta, esta prohibido, puede destruir RIO💣 🏃🏿💨*/}
          <Route path="/Idkfa" element={<NoBorrar />} />
        </Routes>
      </>
    );
  };

  return (
    <ThemeProvider theme={darkTheme} data-prefers-color-scheme='dark'>
      <ConfigProvider theme={{ algorithm: darkMode ? theme.darkAlgorithm : theme.defaultAlgorithm }}>
        <BrowserRouter>
          <AppContent />
        </BrowserRouter>
      </ConfigProvider>
    </ThemeProvider>
  );

}

export default App;
