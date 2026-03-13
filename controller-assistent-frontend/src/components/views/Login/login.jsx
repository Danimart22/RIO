import { useState, useEffect } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import { Container, Row, Col, Card } from "react-bootstrap";
import { FormControl, IconButton, TextField, Button, InputAdornment, Grid, Link } from "@mui/material";
import { Visibility, VisibilityOff } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import images from "../../../assets/images/images";
import { url } from "../../../global";
import { dataEncrypt } from "../../../util";
import "./login.css";

export function Login() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ correo: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [inactivityTimeout, setInactivityTimeout] = useState(null);
  const [expirationTimeout, setExpirationTimeout] = useState(null);
  const [expirationWarningTimeout, setExpirationWarningTimeout] = useState(null);
  const darkMode = localStorage.getItem("darkMode") === "true";

  const swalConfig = {
    background: darkMode ? '#212121' : '#FFFFFF',
    color: darkMode ? 'white' : 'black',
  };

  const handleExpiration = () => {
    Swal.fire({
      ...swalConfig,
      icon: "info",
      text: "Por favor vuelve a iniciar sesión, ha pasado un día.",
    }).then(() => {
      logout();
    });
  };

  const handleExpirationWarning = () => {
    Swal.fire({
      ...swalConfig,
      icon: "warning",
      text: "Tu sesión está a punto de expirar. Por favor, realiza alguna actividad para mantenerla activa.",
    });
  };

  const handleLogout = () => {
    clearTimeout(inactivityTimeout);
    clearTimeout(expirationTimeout);
    clearTimeout(expirationWarningTimeout);
    localStorage.removeItem("Token");
    localStorage.removeItem("Login");
    localStorage.removeItem("id");
    localStorage.removeItem("Rol");
    navigate("/Login", { replace: true });
  };

  const resetInactivityTimeout = () => {
    clearTimeout(inactivityTimeout);
    setInactivityTimeout(setTimeout(handleLogout, 60 * 60 * 1000));
  };

  const resetExpirationTimeout = () => {
    clearTimeout(expirationTimeout);
    setExpirationTimeout(setTimeout(handleExpiration, 24 * 60 * 60 * 1000));
    setExpirationWarningTimeout(
      setTimeout(handleExpirationWarning, 60 * 60 * 1000 - 30000)
    );
  };

  const logout = () => {
    clearTimeout(inactivityTimeout);
    clearTimeout(expirationTimeout);
    clearTimeout(expirationWarningTimeout);
    localStorage.removeItem("Token");
    localStorage.removeItem("Login");
    localStorage.removeItem("id");
    localStorage.removeItem("Rol");
    navigate("/Login", { replace: true });
  };

  const handleChangeForm = (e) => {
    const { name, value } = e.target;

    if (value === "") {
      setForm((prev) => ({ ...prev, [name]: value }));
      return;
    }

    if (name === "correo") {
      const formattedValue = value.toLowerCase();
      const regex = /^[a-zA-Z0-9.\-_@!#$%^&*()+=?]+$/;
      if (!regex.test(formattedValue)) return;
      setForm((prev) => ({ ...prev, [name]: formattedValue }));
    } else {
      setForm((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(`${url}/auth/signin`, form);
      const result = response.data;

      if (result.token) {
        localStorage.setItem("username", dataEncrypt(result.username));
        localStorage.setItem("nombre", dataEncrypt(result.nombres));
        localStorage.setItem("apellido", dataEncrypt(result.apellidos));
        Swal.fire({
          ...swalConfig,
          icon: "success",
          text: `Inicio de sesión exitoso, bienvenido ${response.data.username}`,
        }).then((res) => {
          if (res.isConfirmed) window.location.reload();
        });
        localStorage.setItem("Token", dataEncrypt(result.token));
        localStorage.setItem("Rol", dataEncrypt(result.role));
        localStorage.setItem("id", dataEncrypt(result.id));
        localStorage.setItem("helpers", dataEncrypt(result.helpers));
        localStorage.setItem("seatPass", dataEncrypt(result.seatPass));
        localStorage.setItem("corp", dataEncrypt(result.empresa));

        navigate("/Bienvenida", { replace: true });
        clearTimeout(inactivityTimeout);
        clearTimeout(expirationTimeout);
        clearTimeout(expirationWarningTimeout);
        setInactivityTimeout(setTimeout(handleLogout, 60 * 60 * 1000));
        setExpirationTimeout(setTimeout(handleExpiration, 24 * 60 * 60 * 1000));
        setExpirationWarningTimeout(setTimeout(handleExpirationWarning, 60 * 60 * 1000 - 30000));
      } else {
        Swal.fire({ ...swalConfig, icon: "error", text: "Usuario y/o contraseña incorrectos" });
      }
    } catch (error) {
      const errorMessage =
        error.response?.data?.message || "Error en el inicio de sesión";
      Swal.fire({ ...swalConfig, icon: "error", text: errorMessage });
    }
  };

  const togglePasswordVisibility = () => setShowPassword(!showPassword);

  useEffect(() => {
    const token = localStorage.getItem("Token");
    if (token) {
      resetInactivityTimeout();
      resetExpirationTimeout();
      navigate("/Bienvenida", { replace: true });
      window.addEventListener("mousemove", resetInactivityTimeout);
      window.addEventListener("keypress", resetInactivityTimeout);
    }
    return () => {
      clearTimeout(inactivityTimeout);
      clearTimeout(expirationTimeout);
      clearTimeout(expirationWarningTimeout);
      window.removeEventListener("mousemove", resetInactivityTimeout);
      window.removeEventListener("keypress", resetInactivityTimeout);
    };
  }, [navigate, inactivityTimeout, expirationTimeout, expirationWarningTimeout]);

  return (
    <section className="vh-100 gradient-custom">
      <Container className="py-5 h-100">
        <Row className="h-100 d-flex justify-content-center align-items-center flex-column">
          <Col xs={12} md={8} lg={6} xl={5}>
            <Card
              className="login-card bg-opacity-0.5 text-white"
              style={{ backgroundColor: darkMode ? "#1c1c1c" : "white" }}
            >
              <img
                src={darkMode ? images[3].img : images[0].img}
                alt="Background Image"
                className="login-logo"
              />
              <Card.Body className="login-card-body pt-4 text-center">
                <div className="mb-md-1 mt-md-4">
                  <form onSubmit={handleLogin}>
                    <Grid container spacing={4}>
                      <Grid item xs={20}>
                        <FormControl fullWidth>
                          <TextField
                            id="correo"
                            type="email"
                            name="correo"
                            label="Email"
                            variant="outlined"
                            value={form.correo}
                            onChange={handleChangeForm}
                            required
                          />
                        </FormControl>
                      </Grid>
                      <Grid item xs={20} className="login-password-field">
                        <FormControl fullWidth>
                          <TextField
                            id="password"
                            type={showPassword ? "text" : "password"}
                            name="password"
                            label="Contraseña"
                            value={form.password}
                            variant="outlined"
                            onChange={handleChangeForm}
                            required
                            InputProps={{
                              endAdornment: (
                                <InputAdornment position="end">
                                  <IconButton onClick={togglePasswordVisibility}>
                                    {showPassword ? <VisibilityOff /> : <Visibility />}
                                  </IconButton>
                                </InputAdornment>
                              ),
                            }}
                          />
                        </FormControl>
                      </Grid>
                    </Grid>

                    <Link href="/ForgetPass" color="#F45000">
                      ¿Olvidaste tu contraseña?
                    </Link>
                    <br />
                    <Button
                      variant="outlined"
                      type="submit"
                      className="login-submit-button"
                    >
                      Iniciar Sesión
                    </Button>
                  </form>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </section>
  );
}