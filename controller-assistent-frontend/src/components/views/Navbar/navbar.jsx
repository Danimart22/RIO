import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Button } from "react-bootstrap";
import images from "../../../assets/images/images";
import "./navbar.css";
import { dataDecrypt } from "../../../util";
import ReserveForm from "../Modals/ReserveModals/reserveForm";
import ReserveVisitante from "../Modals/ReserveModals/reserveVisitante";
import moment from "moment";
import oficinaMFSApi from "../../../api/oficinaMFSApi";
import ReportIcon from '@mui/icons-material/Report';
import Tooltip from "../../tools/tooltip";
import ReportObjeto from "../Modals/ReporteModals/reporteObjetos"
import ButtonUser from "./ButtonUserComponent";
import ButtonUserDarkMode from "./ButtonUserComponentDarkMode";
import { Brigadista } from "../Brigadista/brigadista";
import { useMediaQuery } from "react-responsive";
import { IoIosArrowUp } from "react-icons/io";
import { IoIosArrowDown } from "react-icons/io";
import styles from "./btn-hover.module.css"
import { MdLogout } from "react-icons/md";
import { IoSunnyOutline } from "react-icons/io5";
import { IoSunny } from "react-icons/io5";

const NavbarDesktop = () => {
  const [loading, setLoading] = useState(true);
  const [asientoReservado, setAsiento] = useState("");
  const [filteredData, setFilteredData] = useState([]);
  const [nombre, setNombre] = useState("");
  const location = useLocation();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showModalReserve, setShowModalReserve] = useState(false);
  const [showModalReporte, setShowModalReporte] = useState(false);
  const roles = [...new Set(dataDecrypt(localStorage.getItem("Rol")) || [])];
  const helpers = dataDecrypt(localStorage.getItem("helpers"));
  const [darkMode, setDarkMode] = useState(localStorage.getItem("darkMode") === "true" ? true : false);
  let empresas = dataDecrypt(localStorage.getItem("corp")) || [];
  let brigadista = dataDecrypt(localStorage.getItem("helpers"));
  const [navDisabled, setNavDisabled] = useState(true);


  // Verificar si empresas es una cadena y convertirla en array
  if (typeof empresas === "string") {
    empresas = [empresas]; // Convertir a un array con un solo elemento
  }

  const hiddenWinwdowPopup = () => setNavDisabled(!navDisabled);

  useEffect(() => {
    const id = dataDecrypt(localStorage.getItem("id"));
    const nombreGuardado = dataDecrypt(localStorage.getItem("nombre"));

    if (id) {
      fetchData(id);
    }
    if (nombreGuardado) {
      setNombre(nombreGuardado);
    } else {
      setNombre("Nombre Predeterminado");
    }
  }, []);

  const toggleMenu = () => setIsOpen(!isOpen);

  const logout = async () => {
    await localStorage.removeItem("Token");
    localStorage.removeItem("Login");
    localStorage.removeItem("id");
    localStorage.removeItem("Rol");
    localStorage.setItem("darkMode", darkMode);
    navigate("/", { replace: true });
  };
  const changeMode = () => {
    localStorage.setItem("darkMode", !darkMode);
    setDarkMode(!darkMode);
    window.dispatchEvent(new Event('storage'))
  }
  const fetchData = async (id) => {
    try {
      const response = await oficinaMFSApi.get(`/oficina/reserva/${id}`);
      const responseData = response.data.reservas.map((reserva) => {
        return {
          ...reserva,
          fechaReserva: moment.utc(reserva.fechaReserva).local().format(),
          _fechaOrden: moment.utc(reserva.fechaReserva).local().format("YYYY-MM-DD"),
        };
      });
      responseData.forEach(reserva => {
        if (moment.utc(reserva.fechaReserva).format("YYYY-MM-DD") === moment().tz("America/Bogota").format("YYYY-MM-DD")) {
          setAsiento(reserva.numeroSilla)
        };
      });
      setFilteredData(responseData);
      setLoading(false);
    } catch (error) {
      console.log(error);
      setLoading(false);
    }
  };

  const handleOpenModalNewReserve = () => setShowModal(true);
  const handleOpenModalReserveVisit = () => setShowModalReserve(true);
  const handleOpenModalReport = () => setShowModalReporte(true);

  const dropmenu1 = {
    RRHH: ['Nueva Reserva', ['Mis Reservas', 'reservas'],
      , ['Mis Asistencias', 'asistencias'], 'Reservar Visitante'],
    porteria: ['Nueva Reserva', ['Mis Reservas', 'reservas'],
      , ['Mis Asistencias', 'asistencias'], 'Reservar Visitante'],
    empleado: ['Nueva Reserva', ['Mis Reservas', 'reservas'],
      , ['Mis Asistencias', 'asistencias'], 'Reservar Visitante'],
    TI: ['Nueva Reserva', ['Mis Reservas', 'reservas'],
      , ['Mis Asistencias', 'asistencias'], 'Reservar Visitante'],
    gerente: ['Nueva Reserva', ['Mis Asistencias', 'asistencias'], 'Reservar Visitante', ['Mis Reservas', 'reservas']],
    director: [['Mis Asistencias', 'asistencias'], 'Reservar Visitante'],
  }
  const dropmenu2 = {
    RRHH: ['Empleados', 'Reemplazos', 'Oficina', 'Reportes', 'Visitantes', 'Porteria'],
    porteria: ['Porteria', 'Visitantes'],
    TI: ['Reportes'],
  }


  const userAccess1 = Array.from(
    new Map(
      roles
        .filter((rol) => !(["empleado"].includes(rol) && (roles.includes("director") || roles.includes("gerente"))))
        .flatMap((rol) => dropmenu1[rol] || [])
        .map((access) => [Array.isArray(access) ? access[0] : access, access])
    ).values()
  );
  const userAccess2 = (() => {
    // Definir el orden deseado explícitamente para RRHH
    const ordenRRHH = ['Reportes', 'Empleados', 'Reemplazos', 'Oficina', 'Visitantes', 'Porteria'];

    // Si el usuario tiene rol RRHH, usar ese orden
    if (roles.includes('RRHH')) {
      const baseAccess = [...ordenRRHH];

      // Agregar Brigadista al final si aplica
      if (helpers === "Si" && !baseAccess.includes("Brigadista")) {
        baseAccess.push("Brigadista");
      }

      return baseAccess;
    }

    // Para otros roles, usar la lógica normal
    const baseAccess = [];
    const seen = new Set();

    roles.forEach((rol) => {
      const accesses = dropmenu2[rol] || [];
      accesses.forEach((access) => {
        if (!seen.has(access)) {
          baseAccess.push(access);
          seen.add(access);
        }
      });
    });

    if (helpers === "Si" && !seen.has("Brigadista")) {
      baseAccess.push("Brigadista");
    }

    return baseAccess;
  })();



  return (
    <nav className="navbar" style={{ backgroundColor: location.pathname === '/Bienvenida' || location.pathname === '/' ? "transparent" : darkMode ? "#1c1c1c" : 'white', width: "100%", height: "12vh", marginBottom: "1%" }}>
      <a href={location.pathname === '/' ? null : "/Bienvenida"}>
        {(() => {
          let imageToShow = !darkMode ? images[0].img : images[3].img; // Imagen predeterminada

          const foundEmpresa = empresas.find((empresa) => empresa === "Mobilize Lease&Co");

          if (foundEmpresa) {
            imageToShow = images[1].img;
          }

          return (
            <img src={imageToShow} alt="Logo" style={{ marginLeft: "12%" }} />);
        })()}
      </a>
      <div style={{ alignContent: "center", display: "flex" }} className={`list ${isOpen ? "show" : ""}`}>
        <ul style={{ display: "flex", justifyContent: "center", height: "100%", margin: 0, alignItems: "center", padding: 0 }} className="list">

          {location.pathname !== '/' ?
            <div className="menu" style={{ border: location.pathname === '/Bienvenida' || location.pathname === '/' ? null : "none" }}>
              <div className="item" style={{ border: location.pathname === '/Bienvenida' || location.pathname === '/' ? null : "none" }}>
                <a className="link">
                  <span style={{ color: darkMode ? "white" : "black", cursor: "pointer" }}> Reservaciones </span>
                  <svg viewBox="0 0 360 360" xmlSpace="preserve">
                    <g id="SVGRepo_iconCarrier">
                      <path
                        id="XMLID_225_"
                        fill={darkMode ? "white" : "black"}
                        d="M325.607,79.393c-5.857-5.857-15.355-5.858-21.213,0.001l-139.39,139.393L25.607,79.393 c-5.857-5.857-15.355-5.858-21.213,0.001c-5.858,5.858-5.858,15.355,0,21.213l150.004,150c2.813,2.813,6.628,4.393,10.606,4.393 s7.794-1.581,10.606-4.394l149.996-150C331.465,94.749,331.465,85.251,325.607,79.393z"
                      ></path>
                    </g>
                  </svg>
                </a>
                <div className="submenu" style={{ border: location.pathname === '/Bienvenida' || location.pathname === '/' ? null : "none" }}>
                  {userAccess1.map((access, index) => (
                    <div className="submenu-item" key={index}>
                      <Link
                        to={Array.isArray(access) ? `/${access[1]}` : null}
                        className="submenu-link"
                        style={{
                          color: darkMode ? "white" : "black",
                          backgroundColor: location.pathname === '/Bienvenida' || location.pathname === '/' ? "transparent" : darkMode ? '#1c1c1c' : 'white',
                        }}
                        onMouseEnter={(e) => (e.target.style.backgroundColor = "#F45000")}
                        onMouseLeave={(e) =>
                          (e.target.style.backgroundColor = location.pathname === '/Bienvenida' || location.pathname === '/' ? "transparent" : darkMode ? '#1c1c1c' : 'white')
                        }
                        onClick={access === 'Nueva Reserva' ? handleOpenModalNewReserve : access === 'Reservar Visitante' ? handleOpenModalReserveVisit : null}
                      >
                        {Array.isArray(access) ? access[0] : access}
                      </Link>
                    </div>
                  ))}
                </div>
              </div>
            </div> : null}
          {location.pathname !== '/' && (roles.includes('RRHH') || roles.includes('TI') || roles.includes('porteria') || helpers === 'Si') ? (
            <div className="menu" style={{ border: location.pathname === '/Bienvenida' || location.pathname === '/' ? null : "none" }}>
              <div className="item" style={{ border: location.pathname === '/Bienvenida' || location.pathname === '/' ? null : "none" }}>
                <a className="link">
                  <span style={{ color: darkMode ? "white" : "black", cursor: "pointer" }}> Gestión </span>
                  <svg viewBox="0 0 360 360" xmlSpace="preserve">
                    <g id="SVGRepo_iconCarrier">
                      <path
                        id="XMLID_225_"
                        fill={darkMode ? "white" : "black"}
                        d="M325.607,79.393c-5.857-5.857-15.355-5.858-21.213,0.001l-139.39,139.393L25.607,79.393 c-5.857-5.857-15.355-5.858-21.213,0.001c-5.858,5.858-5.858,15.355,0,21.213l150.004,150c2.813,2.813,6.628,4.393,10.606,4.393 s7.794-1.581,10.606-4.394l149.996-150C331.465,94.749,331.465,85.251,325.607,79.393z"
                      ></path>
                    </g>
                  </svg>
                </a>
                <div className="submenu" style={{ border: location.pathname === '/Bienvenida' ? null : "none" }}>
                  {userAccess2.map((access, index) => (
                    <div className="submenu-item" key={index}>
                      {access === "Reportes" ? (
                        <div className="item">
                          <span
                            className="link"
                            style={{
                              color: darkMode ? "white" : "black",
                              cursor: "pointer",
                              // FIX 1: fondo explícito igual que los demás items
                              backgroundColor: location.pathname === '/Bienvenida'
                                ? "transparent"
                                : darkMode ? '#1c1c1c' : 'white',
                            }}
                            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#F45000")}
                            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor =
                              location.pathname === '/Bienvenida' ? "transparent" : darkMode ? '#1c1c1c' : 'white'
                            )}
                          >
                            Reportes
                            <svg viewBox="0 0 360 360" xmlSpace="preserve">
                              <path
                                fill={darkMode ? "white" : "black"}
                                d="M325.607,79.393c-5.857-5.857-15.355-5.858-21.213,0.001l-139.39,139.393L25.607,79.393
           c-5.857-5.857-15.355-5.858-21.213,0.001c-5.858,5.858-5.858,15.355,0,21.213l150.004,150
           c2.813,2.813,6.628,4.393,10.606,4.393s7.794-1.581,10.606-4.394l149.996-150
           C331.465,94.749,331.465,85.251,325.607,79.393z"
                              />
                            </svg>
                          </span>

                          <div
                            className="submenu"
                            style={{
                              backgroundColor: location.pathname === '/Bienvenida'
                                ? "transparent"
                                : darkMode ? '#1c1c1c' : 'white',
                            }}
                          >
                            <div className="submenu-item">
                              <Link
                                to="/Reportes"
                                className="submenu-link"
                                style={{
                                  color: darkMode ? "white" : "black",
                                  backgroundColor: location.pathname === '/Bienvenida'
                                    ? "transparent"
                                    : darkMode ? '#1c1c1c' : 'white',
                                }}
                                onMouseEnter={(e) => (e.target.style.backgroundColor = "#F45000")}
                                onMouseLeave={(e) => (e.target.style.backgroundColor =
                                  location.pathname === '/Bienvenida' ? "transparent" : darkMode ? '#1c1c1c' : 'white'
                                )}
                              >
                                Objetos
                              </Link>
                            </div>
                            {roles.includes('RRHH') && (
                              <div className="submenu-item">
                                <Link
                                  to="/ReporteAsistencia"
                                  className="submenu-link"
                                  style={{
                                    color: darkMode ? "white" : "black",
                                    backgroundColor: location.pathname === '/Bienvenida'
                                      ? "transparent"
                                      : darkMode ? '#1c1c1c' : 'white',
                                  }}
                                  onMouseEnter={(e) => (e.target.style.backgroundColor = "#F45000")}
                                  onMouseLeave={(e) => (e.target.style.backgroundColor =
                                    location.pathname === '/Bienvenida' ? "transparent" : darkMode ? '#1c1c1c' : 'white'
                                  )}
                                >
                                  Reservas
                                </Link>
                              </div>
                            )}
                          </div>
                        </div>
                      ) : (
                        <Link
                          to={`/${access}`}
                          className="submenu-link"
                          style={{
                            color: darkMode ? "white" : "black",
                            backgroundColor: location.pathname === '/Bienvenida'
                              ? "transparent"
                              : darkMode ? '#1c1c1c' : 'white'
                          }}
                          onMouseEnter={(e) => (e.target.style.backgroundColor = "#F45000")}
                          onMouseLeave={(e) =>
                          (e.target.style.backgroundColor =
                            location.pathname === '/Bienvenida'
                              ? "transparent"
                              : darkMode ? '#1c1c1c' : 'white')
                          }
                        >
                          {access}
                        </Link>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>) : null}
          {location.pathname !== '/' ?
            <li >
              <div className="menu rojo-hover" style={{ color: darkMode ? '#FFFFFF' : '#000000', fill: darkMode ? '#FFFFFF' : '#000000' }}>
                <a className="link" onClick={() => handleOpenModalReport()}>
                  <span>Reportar</span>
                  <ReportIcon sx={{ fill: "inherit !important" }} />
                </a>
              </div>
            </li> : null}
          <li>
            <label className="switch" style={{ display: "flex", margin: 0, padding: 0 }}>
              <input checked={!darkMode} id="checkbox" type="checkbox" onChange={changeMode} />
              <span className="slider">
                <div className="star star_1"></div>
                <div className="star star_2"></div>
                <div className="star star_3"></div>
                <svg viewBox="0 0 16 16" className="cloud_1 cloud">
                  <path
                    transform="matrix(.77976 0 0 .78395-299.99-418.63)"
                    fill="#fff"
                    d="m391.84 540.91c-.421-.329-.949-.524-1.523-.524-1.351 0-2.451 1.084-2.485 2.435-1.395.526-2.388 1.88-2.388 3.466 0 1.874 1.385 3.423 3.182 3.667v.034h12.73v-.006c1.775-.104 3.182-1.584 3.182-3.395 0-1.747-1.309-3.186-2.994-3.379.007-.106.011-.214.011-.322 0-2.707-2.271-4.901-5.072-4.901-2.073 0-3.856 1.202-4.643 2.925"
                  ></path>
                </svg>
              </span>
            </label></li>
          <li >

            {location.pathname === '/' ?
              <Link to="/Login" style={{ margin: 0 }}>
                <Button variant="outline-orange" className="nav-button btn-orange">
                  Iniciar sesión
                </Button>
              </Link>
              :
              !darkMode ? <ButtonUser navDisabled={navDisabled} hiddenWinwdowPopup={hiddenWinwdowPopup} /> : <ButtonUserDarkMode navDisabled={navDisabled} hiddenWinwdowPopup={hiddenWinwdowPopup} />
            }
          </li>
        </ul>
      </div>
      {location.pathname === '/' ? null
        :
        <>
          <ReserveForm isOpen={showModal} setShow={setShowModal} fetchData={fetchData} />
          <ReserveVisitante isOpen={showModalReserve} setShow={setShowModalReserve} darkMode={darkMode} />
          <ReportObjeto isOpen={showModalReporte} setShow={setShowModalReporte} asientoReservado={asientoReservado} />
        </>
      }

    </nav>
  );
};

const NavbarMobile = () => {
  const [loading, setLoading] = useState(true);
  const [asientoReservado, setAsiento] = useState("");
  const [filteredData, setFilteredData] = useState([]);
  const [nombre, setNombre] = useState("");
  const location = useLocation();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false); const [showModal, setShowModal] = useState(false);
  const [showModalReserve, setShowModalReserve] = useState(false);
  const [showModalReporte, setShowModalReporte] = useState(false);
  const roles = [...new Set(dataDecrypt(localStorage.getItem("Rol")) || [])];
  const helpers = dataDecrypt(localStorage.getItem("helpers"));
  const [darkMode, setDarkMode] = useState(localStorage.getItem("darkMode") === "true" ? true : false);
  let empresas = dataDecrypt(localStorage.getItem("corp")) || [];
  let brigadista = dataDecrypt(localStorage.getItem("helpers"));
  const [navDisabled, setNavDisabled] = useState(true);
  const [burger, setBurger] = useState(false)
  const token = dataDecrypt(localStorage.getItem("Token"));


  // Verificar si empresas es una cadena y convertirla en array
  if (typeof empresas === "string") {
    empresas = [empresas]; // Convertir a un array con un solo elemento
  }

  const hiddenWinwdowPopup = () => setNavDisabled(!navDisabled);

  useEffect(() => {
    const id = dataDecrypt(localStorage.getItem("id"));
    const nombreGuardado = dataDecrypt(localStorage.getItem("nombre"));

    if (id) {
      fetchData(id);
    }
    if (nombreGuardado) {
      setNombre(nombreGuardado);
    } else {
      setNombre("Nombre Predeterminado");
    }
  }, []);

  const toggleMenu = () => setIsOpen(!isOpen);

  const logout = async () => {
    await localStorage.removeItem("Token");
    localStorage.removeItem("Login");
    localStorage.removeItem("id");
    localStorage.removeItem("Rol");
    localStorage.setItem("darkMode", darkMode);
    navigate("/", { replace: true });
  };
  const changeMode = () => {
    localStorage.setItem("darkMode", !darkMode);
    setDarkMode(!darkMode);
    window.dispatchEvent(new Event('storage'))
  }
  const fetchData = async (id) => {
    try {
      const response = await oficinaMFSApi.get(`/oficina/reserva/${id}`);
      const responseData = response.data.reservas.map((reserva) => {
        return {
          ...reserva,
          fechaReserva: moment.utc(reserva.fechaReserva).local().format(),
          _fechaOrden: moment.utc(reserva.fechaReserva).local().format("YYYY-MM-DD"),
        };
      });
      responseData.forEach(reserva => {
        if (moment.utc(reserva.fechaReserva).format("YYYY-MM-DD") === moment().tz("America/Bogota").format("YYYY-MM-DD")) {
          setAsiento(reserva.numeroSilla)
        };
      });
      setFilteredData(responseData);
      setLoading(false);
    } catch (error) {
      console.log(error);
      setLoading(false);
    }
  };

  const handleOpenModalNewReserve = () => setShowModal(true);
  const handleOpenModalReserveVisit = () => setShowModalReserve(true);
  const handleOpenModalReport = () => setShowModalReporte(true);

  const dropmenu1 = {
    RRHH: ['Nueva Reserva', ['Mis Reservas', 'reservas'],
      , ['Mis Asistencias', 'asistencias'], 'Reservar Visitante'],
    porteria: ['Nueva Reserva', ['Mis Reservas', 'reservas'],
      , ['Mis Asistencias', 'asistencias'], 'Reservar Visitante'],
    empleado: ['Nueva Reserva', ['Mis Reservas', 'reservas'],
      , ['Mis Asistencias', 'asistencias'], 'Reservar Visitante'],
    TI: ['Nueva Reserva', ['Mis Reservas', 'reservas'],
      , ['Mis Asistencias', 'asistencias'], 'Reservar Visitante'],
    gerente: ['Nueva Reserva', ['Mis Asistencias', 'asistencias'], 'Reservar Visitante', ['Mis Reservas', 'reservas']],
    director: [['Mis Asistencias', 'asistencias'], 'Reservar Visitante'],
  }
  const dropmenu2 = {
    RRHH: ['Empleados', 'Reemplazos', 'Oficina', 'Reportes', 'Visitantes'],
    porteria: ['Porteria', 'Visitantes'],
    TI: ['Reportes'],
  }


  const userAccess1 = Array.from(
    new Map(
      roles
        .filter((rol) => !(["empleado"].includes(rol) && (roles.includes("director") || roles.includes("gerente"))))
        .flatMap((rol) => dropmenu1[rol] || [])
        .map((access) => [Array.isArray(access) ? access[0] : access, access])
    ).values()
  );

  const userAccess2 = [
    ...new Set([
      ...roles.flatMap((rol) => dropmenu2[rol] || []),
      ...(helpers === "Si" ? ["Brigadista"] : [])
    ])
  ];

  return (
    <>
      <div style={{
        display: "flex",
        justifyContent: !burger ? "center" : null,
        flexDirection: burger ? "column" : null,
        alignItems: "stretch",   // 🔑 deja que los hijos ocupen el 100% 
        backgroundColor: burger ? (darkMode ? "#21211E" : "white") : null,
        paddingBottom: "2vh",
        borderBottomLeftRadius: "30px",
        borderBottomRightRadius: "30px",
        boxShadow: burger ? "0 0 20px 10px rgba(0, 0, 0, 0.8)" : null
      }}>
        <a >
          {(() => {
            let imageToShow = !darkMode ? images[0].img : images[3].img; // Imagen predeterminada

            const foundEmpresa = empresas.find((empresa) => empresa === "Mobilize Lease&Co");

            if (foundEmpresa) {
              imageToShow = images[1].img;
            }

            return (
              <>
                <div style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  width: "100%"
                }}>

                  <div style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    width: "100%"
                  }}>
                    {burger ? darkMode ? <IoSunnyOutline onClick={changeMode} style={{ height: "5vh", width: "5vh", cursor: "pointer", marginLeft: "10px" }} /> : <IoSunny onClick={changeMode} style={{ height: "5vh", width: "5vh", cursor: "pointer", marginLeft: "10px" }} /> : null}
                    <img src={imageToShow} alt="Logo" style={{ height: "6vh", marginTop: "10px", cursor: "pointer" }} />
                    {burger ? token ? <MdLogout onClick={logout} style={{ height: "5vh", width: "5vh", cursor: "pointer", marginRight: "10px" }} /> : <div style={{ height: "5vh", width: "5vh" }}></div> : null}
                  </div>
                  {!burger ? <IoIosArrowDown onClick={() => setBurger(!burger)} style={{ marginTop: "25px", height: "6vh", width: "6vh", cursor: "pointer" }} /> : null}
                </div>
              </>
            );
          })()}
          {burger && (
            <div style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "17px",
              marginTop: "15px"
            }}>
              {!token ? (
                <>
                  <div onClick={() => { navigate("/Login"); setBurger(false); }}
                    className={styles.btnHover}
                    style={{ '--btn-bg': darkMode ? '#21211E' : 'white', '--btn-color': darkMode ? 'white' : 'black', cursor: "pointer" }}>
                    Iniciar Sesión
                  </div>
                  <IoIosArrowUp onClick={() => setBurger(false)} style={{ height: "6vh", width: "6vh", cursor: "pointer" }} />
                </>
              ) : (
                <>
                  <div onClick={handleOpenModalNewReserve} className={styles.btnHover}
                    style={{ '--btn-bg': darkMode ? '#21211E' : 'white', '--btn-color': darkMode ? 'white' : 'black', cursor: "pointer" }}>
                    Nueva Reserva
                  </div>
                  <div onClick={() => { navigate("/asistencias"); setBurger(false); }}
                    className={styles.btnHover}
                    style={{ '--btn-bg': darkMode ? '#21211E' : 'white', '--btn-color': darkMode ? 'white' : 'black', cursor: "pointer" }}>
                    Mis Asistencias
                  </div>
                  <div onClick={() => { navigate("/reservas"); setBurger(false); }}
                    className={styles.btnHover}
                    style={{ '--btn-bg': darkMode ? '#21211E' : 'white', '--btn-color': darkMode ? 'white' : 'black', cursor: "pointer" }}>
                    Mis Reservas
                  </div>
                  <IoIosArrowUp onClick={() => setBurger(false)} style={{ height: "6vh", width: "6vh", cursor: "pointer" }} />
                </>
              )}
            </div>
          )}
        </a>
        {location.pathname === '/' ? null
          :
          <>
            <ReserveForm isOpen={showModal} setShow={setShowModal} fetchData={fetchData} />
            <ReserveVisitante isOpen={showModalReserve} setShow={setShowModalReserve} darkMode={darkMode} />
            <ReportObjeto isOpen={showModalReporte} setShow={setShowModalReporte} asientoReservado={asientoReservado} />
          </>
        }
      </div>
    </>
  )
}

export const Navbar = () => {
  const isMobile = useMediaQuery({ maxWidth: 768 })

  return (
    <>
      {isMobile ? <NavbarMobile /> : <NavbarDesktop />}
    </>
  )
} 