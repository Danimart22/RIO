import { useState, useEffect } from "react";
import Swal from "sweetalert2";
import TextField from "@mui/material/TextField";
import { Button, Box, Grid, InputAdornment, IconButton } from "@mui/material";
import { Visibility, VisibilityOff } from "@mui/icons-material";
import { dataDecrypt } from "../../../util";
import oficinaMFSApi from "../../../api/oficinaMFSApi";
import ChangeCircleIcon from "@mui/icons-material/ChangeCircle";
import { useNavigate } from "react-router-dom";
import "./PrivacidadView.css";

export function PrivacidadView() {
  const navigate = useNavigate();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordsMatchError, setPasswordsMatchError] = useState(false);
  const [darkMode, setDarkMode] = useState(
    localStorage.getItem("darkMode") === "true"
  );

  const swalConfig = {
    background: darkMode ? "#212121" : "#FFFFFF",
    color: darkMode ? "white" : "black",
  };

  useEffect(() => {
    const handleStorageChange = () => {
      setDarkMode(localStorage.getItem("darkMode") === "true");
    };
    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  const handleToggleCurrentPassword = () =>
    setShowCurrentPassword((prev) => !prev);
  const handleToggleNewPassword = () => setShowNewPassword((prev) => !prev);
  const handleToggleConfirmPassword = () =>
    setShowConfirmPassword((prev) => !prev);

  const logout = () => {
    localStorage.removeItem("Token");
    localStorage.removeItem("Login");
    localStorage.removeItem("id");
    localStorage.removeItem("Rol");
    navigate("/Login", { replace: true });
  };

  const handleChangePassword = async () => {
    try {
      if (currentPassword === newPassword) {
        Swal.fire({
          ...swalConfig,
          icon: "error",
          title: "Contraseñas iguales",
          text: "La contraseña actual y la nueva contraseña no pueden ser iguales.",
        });
        return;
      }

      if (newPassword !== confirmPassword) {
        Swal.fire({
          ...swalConfig,
          icon: "error",
          title: "Contraseñas no coinciden",
          text: "La nueva contraseña y la confirmación de contraseña no coinciden.",
        });
        return;
      }

      setSubmitting(true);
      const token = dataDecrypt(localStorage.getItem("Token"));
      const id = dataDecrypt(localStorage.getItem("id"));
      const config = { headers: { "x-access-token": token } };
      const requestData = { currentPassword, newPassword };

      await oficinaMFSApi.put(`/users/restPassword/${id}`, requestData, config);

      setSubmitting(false);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");

      Swal.fire({
        ...swalConfig,
        icon: "success",
        title: "Contraseña actualizada",
        text: "Tu contraseña ha sido actualizada correctamente. Inicia sesión nuevamente",
      });

      logout();
    } catch (error) {
      console.error("Error al cambiar la contraseña:", error);
      setSubmitting(false);
      Swal.fire({
        ...swalConfig,
        icon: "error",
        title: "Error al cambiar la contraseña",
        text:
          error.response?.data?.message ||
          "Ha ocurrido un error al cambiar la contraseña. Por favor, intenta nuevamente.",
      });
    }
  };

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    if (name === "currentPassword") setCurrentPassword(value);
    if (name === "newPassword") setNewPassword(value);
    if (name === "confirmPassword") {
      setConfirmPassword(value);
      setPasswordsMatchError(newPassword !== value);
    }
  };

  const isFormValid =
    currentPassword.trim() !== "" &&
    newPassword.trim() !== "" &&
    confirmPassword.trim() !== "" &&
    newPassword === confirmPassword &&
    !passwordsMatchError &&
    !submitting;

  return (
    <Grid container justifyContent="center" alignItems="center">
      <Box
        width="40%"
        maxWidth="40%"
        maxHeight="60%"
        p={2}
        bgcolor={darkMode ? "#212121" : "rgba(255, 255, 255, 0.8)"}
        borderRadius="8px"
      >
        <Grid container direction="column" spacing={2}>
          <Grid item>
            <TextField
              type={showCurrentPassword ? "text" : "password"}
              name="currentPassword"
              label="Contraseña actual"
              value={currentPassword}
              onChange={handleInputChange}
              fullWidth
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={handleToggleCurrentPassword}>
                      {showCurrentPassword ? <Visibility /> : <VisibilityOff />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid item>
            <TextField
              type={showNewPassword ? "text" : "password"}
              name="newPassword"
              label="Nueva contraseña"
              value={newPassword}
              onChange={handleInputChange}
              fullWidth
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={handleToggleNewPassword}>
                      {showNewPassword ? <Visibility /> : <VisibilityOff />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid item>
            <TextField
              type={showConfirmPassword ? "text" : "password"}
              name="confirmPassword"
              label="Confirmar nueva contraseña"
              value={confirmPassword}
              onChange={handleInputChange}
              fullWidth
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={handleToggleConfirmPassword}>
                      {showConfirmPassword ? <Visibility /> : <VisibilityOff />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
            {passwordsMatchError && (
              <p className="privacidad-error-text">
                Las contraseñas no coinciden.
              </p>
            )}
          </Grid>
          <Grid item>
            <Button
              variant="contained"
              color="primary"
              onClick={handleChangePassword}
              disabled={!isFormValid || submitting}
              startIcon={<ChangeCircleIcon />}
            >
              Cambiar contraseña
            </Button>
          </Grid>
        </Grid>
      </Box>
    </Grid>
  );
}