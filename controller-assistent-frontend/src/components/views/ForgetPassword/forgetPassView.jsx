import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import TextField from '@mui/material/TextField';
import { InputAdornment, IconButton, Button, Container, Box, Grid } from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import Swal from 'sweetalert2';
import oficinaMFSApi from "../../../api/oficinaMFSApi";
import './ForgetPassView.css';

export function ForgetPassView() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [correo, setCorreo] = useState('');
  const [codigo, setCodigo] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const darkMode = localStorage.getItem("darkMode") === "true";

  const swalConfig = {
    background: darkMode ? '#212121' : '#FFFFFF',
    color: darkMode ? 'white' : 'black',
  };

  const sendEmail = async () => {
    try {
      const response = await oficinaMFSApi.post('/users/sendNumbers', { correo });
      if (response.status === 200) {
        setStep(2);
        Swal.fire({
          ...swalConfig,
          icon: 'success',
          title: 'Codigo enviado correctamente',
          text: 'Se ha enviado un codigo de seguridad al correo ingresado.',
        });
      } else {
        Swal.fire({
          ...swalConfig,
          icon: 'error',
          title: 'Error',
          text: 'El correo ingresado no está registrado en la base de datos.',
        });
      }
    } catch (error) {
      console.error(error);
      Swal.fire({
        ...swalConfig,
        icon: 'error',
        title: 'Error',
        text: 'El correo ingresado no está registrado en la base de datos.',
      });
    }
  };

  const verifyCode = async () => {
    try {
      const response = await oficinaMFSApi.post('/users/verifyCode', {
        correo,
        randomNumbers: codigo.split('').map(Number),
      });
      if (response.status === 200) {
        setStep(3);
        Swal.fire({
          ...swalConfig,
          icon: 'success',
          title: 'Codigo verificado exitosamente',
          text: 'Verificacion de correo exitosamente.',
        });
      } else {
        Swal.fire({
          ...swalConfig,
          icon: 'error',
          title: 'Error',
          text: 'El código de seguridad ingresado es incorrecto o ha expirado. Por favor, solicite un nuevo código.',
        });
      }
    } catch (error) {
      console.error(error);
      Swal.fire({
        ...swalConfig,
        icon: 'error',
        title: 'Error',
        text: 'Error al verificar el código de seguridad. Por favor, inténtelo nuevamente.',
      });
    }
  };

  const changePassword = async () => {
    try {
      if (newPassword !== confirmPassword) {
        Swal.fire({
          ...swalConfig,
          icon: 'error',
          title: 'Error',
          text: 'Las contraseñas no coinciden. Por favor, verifique su nueva contraseña.',
        });
        return;
      }
      const response = await oficinaMFSApi.post('/users/changePassword', {
        correo,
        newPassword,
      });
      if (response.status === 200) {
        Swal.fire({
          ...swalConfig,
          icon: 'success',
          title: 'Contraseña cambiada',
          text: 'Contraseña cambiada exitosamente. Inicie sesión con su nueva contraseña.',
        });
        navigate('/', { replace: true });
      } else {
        Swal.fire({
          ...swalConfig,
          icon: 'error',
          title: 'Error',
          text: 'Ha ocurrido un error al cambiar la contraseña. Por favor, inténtelo nuevamente.',
        });
      }
    } catch (error) {
      console.error(error);
      Swal.fire({
        ...swalConfig,
        icon: 'error',
        title: 'Error',
        text: 'Error al cambiar la contraseña. Por favor, inténtelo nuevamente.',
      });
    }
  };

  const handleToggleNewPasswordVisibility = () => setShowNewPassword((prev) => !prev);
  const handleToggleConfirmPasswordVisibility = () => setShowConfirmPassword((prev) => !prev);

  return (
    <Container>
      <Grid className="forget-pass-grid">
        <Box
          className="forget-pass-box"
          bgcolor={darkMode ? "#302F2F" : "rgba(255, 255, 255, 0.8)"}
        >
          <div>
            {step === 1 && (
              <div className="forget-pass-step">
                <h2>Paso 1: Ingrese su correo electrónico</h2>
                <TextField
                  type="email"
                  value={correo}
                  onChange={(e) => setCorreo(e.target.value)}
                  label="Correo electrónico"
                  variant="outlined"
                />
                <Button
                  onClick={sendEmail}
                  variant="contained"
                  color="primary"
                  className="forget-pass-button-top"
                >
                  Enviar Código de Seguridad
                </Button>
              </div>
            )}

            {step === 2 && (
              <div className="forget-pass-step">
                <h2>Paso 2: Ingrese el Código de Seguridad</h2>
                <TextField
                  type="text"
                  value={codigo}
                  onChange={(e) => setCodigo(e.target.value)}
                  label="Código"
                  variant="outlined"
                />
                <Button onClick={verifyCode} variant="contained" color="primary">
                  Verificar Código
                </Button>
              </div>
            )}

            {step === 3 && (
              <div className="forget-pass-step">
                <h2>Paso 3: Ingrese su Nueva Contraseña</h2>
                <TextField
                  type={showNewPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  label="Nueva Contraseña"
                  variant="outlined"
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton onClick={handleToggleNewPasswordVisibility}>
                          {showNewPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
                <TextField
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  label="Confirme su Nueva Contraseña"
                  variant="outlined"
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton onClick={handleToggleConfirmPasswordVisibility}>
                          {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
                <Button onClick={changePassword} variant="contained" color="primary">
                  Cambiar Contraseña
                </Button>
              </div>
            )}
          </div>
        </Box>
      </Grid>
    </Container>
  );
}