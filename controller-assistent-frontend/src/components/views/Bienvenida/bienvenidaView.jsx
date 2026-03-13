import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { fadeIn } from "../../../variants.js";
import { dataDecrypt } from "../../../util.js";
import { TypeAnimation } from "react-type-animation";
import { Container } from "react-bootstrap";
import images from "../../../assets/images/images";
import "./Bienvenida.css";
import { Navbar } from "../Navbar/navbar.jsx";
import NotificationChangesModal from "../Modals/NotificationChangesModal.jsx";

export function Bienvenida() {
  const [showModal, setShowModal] = useState(false);
  const nombre =
    dataDecrypt(localStorage.getItem("nombre")) +
    " " +
    dataDecrypt(localStorage.getItem("apellido"));
  const [darkMode, setDarkMode] = useState(
    localStorage.getItem("darkMode") === "true"
  );
  const sequence = [`¡Hola! \n    ${nombre}`, 2000];

  useEffect(() => {
    const startDay = new Date("2025-09-21");
    startDay.setHours(0, 0, 0, 0);

    const endDate = new Date(startDay);
    endDate.setDate(endDate.getDate() + 5);
    endDate.setHours(23, 59, 59, 999);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (localStorage.getItem("NotiModal") == "NaN") {
      localStorage.setItem("NotiModal", 0);
    }
    if (
      today >= startDay &&
      today <= endDate &&
      parseInt(localStorage.getItem("NotiModal")) < 2
    ) {
      setShowModal(true);
    } else {
      setShowModal(false);
    }
    localStorage.setItem(
      "NotiModal",
      parseInt(localStorage.getItem("NotiModal")) + 1
    );

    const handleStorageChange = () => {
      setDarkMode(localStorage.getItem("darkMode") === "true");
    };
    window.addEventListener("storage", handleStorageChange);
    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  const backgroundImage = !darkMode
    ? `linear-gradient(to bottom, rgb(255, 255, 255), transparent), url(${images?.[6]?.img ?? ""})`
    : `linear-gradient(to bottom, rgb(0, 0, 0), transparent), url(${images?.[6]?.img ?? ""})`;

  return (
    <Container
      className="bienvenida-container"
      style={{
        backgroundColor: darkMode ? "#212121" : "white",
        color: darkMode ? "white" : "black",
      }}
    >
      <div
        className="bienvenida-background"
        style={{ backgroundImage }}
      >
        <Navbar />
        <motion.div
          variants={fadeIn("left", 0.4)}
          initial="hidden"
          whileInView="show"
          viewport={{ once: false, amount: 0.3 }}
          className="bienvenida-motion flex-1"
        >
          <div className="font-secondary font-semibold">
            <TypeAnimation
              sequence={sequence}
              speed={40}
              wrapper="h1"
              repeat={Infinity}
              className="bienvenida-greeting"
            />
          </div>
        </motion.div>
      </div>

      <NotificationChangesModal isOpen={showModal} setShowModal={setShowModal} />
    </Container>
  );
}