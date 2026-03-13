import { useState } from "react";
import { Container } from "react-bootstrap";
import { motion } from "framer-motion";
import { TypeAnimation } from "react-type-animation";
import images from "../../../assets/images/images";
import { fadeIn } from "../../../variants";
import "../Navbar/navbar.css";
import "./HomeView.css";
import { Navbar } from "../Navbar/navbar";

export function HomeView() {
  const [isNavOpen, setIsNavOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(
    localStorage.getItem("darkMode") === "true"
  );

  if (localStorage.getItem("darkMode") === null) {
    localStorage.setItem("darkMode", true);
    window.dispatchEvent(new Event("storage"));
    window.location.reload();
  }

  const changeMode = () => {
    localStorage.setItem("darkMode", (!darkMode).toString());
    setDarkMode(!darkMode);
    window.dispatchEvent(new Event("storage"));
  };

  const toggleNav = () => {
    setIsNavOpen(!isNavOpen);
  };

  const backgroundImage = !darkMode
    ? `linear-gradient(to bottom, rgb(255, 255, 255), transparent), url(${images?.[6]?.img ?? ""})`
    : `linear-gradient(to bottom, rgb(0, 0, 0), transparent), url(${images?.[6]?.img ?? ""})`;

  return (
    <>
      <Container className="home-container">
        <div
          className={`home-background ${darkMode ? "background-dark" : "background-light"}`}
          style={{ backgroundImage }}
        >
          <Navbar />
          <motion.div
            variants={fadeIn("down", 0.4)}
            initial="hidden"
            whileInView="show"
            viewport={{ once: false, amount: 0.3 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="home-motion"
          >
            <h1>
              <TypeAnimation
                sequence={[
                  "Bienvenido a \n     MOBILIZE FINANCIAL SERVICES!",
                  2000,
                ]}
                speed={40}
                className="text-accent home-type-animation"
                wrapper="span"
                repeat={Infinity}
              />
            </h1>
          </motion.div>
        </div>
      </Container>
    </>
  );
}