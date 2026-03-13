import { useState, useEffect } from "react";
import { TabContent, TabPane, Nav, NavItem, NavLink } from "reactstrap";
import { VisitantesTable } from "./visitanteTable";
import { AsistenciasVisitantesView } from "./visitanteAsistencia";
import { motion } from "framer-motion";

export function VisitanteView() {
  const [activeTab, setActiveTab] = useState("1");
  const [darkMode, setDarkMode] = useState(localStorage.getItem("darkMode") === "true" ? true : false);

  const cambiarTab = (numeroTab) => {
    if (activeTab !== numeroTab) {
      setActiveTab(numeroTab);
    }
  };
  useEffect(() => {
    const handleStorageChange = () => {

      if (localStorage.getItem("darkMode") === "true") {
        setDarkMode(true);
      } else {
        setDarkMode(false);
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);
  return (
    <div
      className="container"
      style={{
        display: "flex",
        justifyContent: "space-between", // Centrar y separar las pestañas
        alignItems: "center",
        flexDirection: "column",
        height: "85vh"
      }}
    >
      <Nav
        className="flex space-x-4"
        tabs
      >
        {["1", "2"].map((numeroTab) => (
          <NavItem key={numeroTab}>
            <NavLink
              className="baseTab"
              onClick={() => cambiarTab(numeroTab)}
              style={{
                fontWeight: "bold",
                backgroundColor: activeTab === numeroTab ? "#F45000" : "",
                color: activeTab === numeroTab ? "white" : darkMode ? "white" : "black",
                transition: "background-color 0.5s",
                borderRadius: "25px",
                padding: "10px 75px",
              }}
            >
              <motion.span
                layoutId="bubble"
                className={`${activeTab === numeroTab ? "" : "hidden"
                  } absolute inset-0 z-10 bg-white mix-blend-difference`}
                style={{ borderRadius: "9999" }}
                transition={{ type: "tween", bounce: 0.2, duration: 0.6 }}
              />
              {numeroTab === "1" ? "Visitantes" : "Asistencias"}
            </NavLink>
          </NavItem>
        ))}
      </Nav>

      <TabContent style={{ paddingBottom: "10%" }} activeTab={activeTab}>
        <TabPane tabId="1">
          <section>
            <VisitantesTable />
          </section>
        </TabPane>
        <TabPane tabId="2">
          <div className="container">
            {activeTab === "2" && <AsistenciasVisitantesView />}
          </div>
        </TabPane>
      </TabContent>
    </div>
  );
}
