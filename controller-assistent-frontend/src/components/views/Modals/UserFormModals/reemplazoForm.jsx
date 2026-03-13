import React, { useState, useEffect } from "react";
import oficinaMFSApi from "../../../../api/oficinaMFSApi";
import SaveIcon from "@mui/icons-material/Save";
import CancelIcon from "@mui/icons-material/Close";
import { Modal } from "react-bootstrap";
import {
  TextField,
  MenuItem,
  Chip,
  Paper,
  Grid,
  Button,
  Typography,
} from "@mui/material";
import CoronavirusIcon from "@mui/icons-material/Coronavirus";
import LocalHospitalIcon from "@mui/icons-material/LocalHospital";
import "../modals.css";
import Swal from "sweetalert2";
import { dataDecrypt } from "../../../../util";

export default function ReemplazoForm({ isOpen, setShow, fetchData }) {
  const [tipo_documento, setTipo_documento] = useState("");
  const [documento, setDocumento] = useState("");
  const [nombres, setNombres] = useState("");
  const [apellidos, setApellidos] = useState("");
  const [sangre, setSangre] = useState("");
  const [cargo, setCargo] = useState("");
  const [telefono, setTelefono] = useState("");
  const [acudiente, setAcudiente] = useState("");
  const [tipo_acudiente, setTipo_acudiente] = useState("");
  const [numero_acudiente, setNumero_acudiente] = useState("");
  const [direccion, setDireccion] = useState("");
  const [eps, setEps] = useState("");
  const [arl, setArl] = useState("");
  const [enfermedades, setEnfermedades] = useState([]);
  const [alergias, setAlergias] = useState([]);
  const [inputEnfermedad, setInputEnfermedad] = useState("");
  const [inputAlergia, setInputAlergia] = useState("");
  const [darkMode, setDarkMode] = useState(localStorage.getItem("darkMode") === "true" ? true : false);
      
  useEffect(() => {
      const handleStorageChange = () => {
  
        if (localStorage.getItem("darkMode") ==="true") {
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

  const handleClose = () => {
    setShow(false);
  };

  const handleSave = async () => {
    const newReemplazo = {
      documento,
      tipo_documento,
      nombres,
      apellidos,
      cargo,
      sangre,
      telefono,
      acudiente,
      tipo_acudiente: tipo_acudiente,
      numero_acudiente: numero_acudiente,
      direccion,
      eps,
      arl,
      enfermedades,
      alergias,
    };

    try {
      const token = dataDecrypt(localStorage.getItem("Token"));
      const config = {
        headers: {
          "x-access-token": token,
        },
      };

      await oficinaMFSApi.post(`/reemplazo/`, newReemplazo, config);
      // Procesar la respuesta en caso de éxito
      fetchData();
      handleClose();

      Swal.fire({
          background: localStorage.getItem("darkMode")==="true"?'#212121':'#FFFFFF',
          color: localStorage.getItem("darkMode")==="true"?'white':'black',
        icon: "success",
        title: "Reemplazante creado",
        text: "El Reemplazo fue creado correctamente.",
      });
      resetForm();
    } catch (error) {
      console.error("Error al crear reemplazo:", error);

      let errorMessage =
        "Ha ocurrido un error al crear al reemplazo. Por favor, intenta nuevamente.";

      if (
        error.response &&
        error.response.data &&
        error.response.data.message
      ) {
        errorMessage = error.response.data.message;
      }

      Swal.fire({
          background: localStorage.getItem("darkMode")==="true"?'#212121':'#FFFFFF',
          color: localStorage.getItem("darkMode")==="true"?'white':'black',
        icon: "error",
        title: "Error al crear reemplazante",
        text: errorMessage,
        allowOutsideClick: false,
      });
    } finally {
      handleClose();
    }
  };

  const handleEnfermedadesChange = (event) => {
    const value = event.target.value.trim();
    if (value !== "") {
      setEnfermedades([...enfermedades, value]);
      setInputEnfermedad("");
    }
  };

  const removeEnfermedad = (index) => {
    setEnfermedades(enfermedades.filter((_, i) => i !== index));
  };

  const handleAlergiasChange = (event) => {
    const value = event.target.value.trim();
    if (value !== "") {
      setAlergias([...alergias, value]);
      setInputAlergia("");
    }
  };

  const removeAlergia = (index) => {
    setAlergias(alergias.filter((_, i) => i !== index));
  };

  const epsOptions = [
    "SURA",
    "NUEVA EPS",
    "FAMISANAR",
    "SALUD TOTAL",
    "SANITAS",
    "COOSALUD",
    "SAVIA SALUD",
    // Agregar el resto de las opciones para EPS
  ];

  // Opciones para la lista desplegable de ARL
  const arlOptions = [
    "SURA",
    "POSITIVA",
    "COLMENA",
    "AXA COLPATRIA",
    "BOLIVAR",
    "EQUIDAD",
    // Agregar el resto de las opciones para ARL
  ];

  const areAllFieldsFilled = () => {
    return (
      documento &&
      tipo_documento &&
      nombres &&
      apellidos &&
      sangre &&
      enfermedades.length > 0 &&
      alergias.length > 0 &&
      direccion &&
      sangre &&
      telefono &&
      eps &&
      arl &&
      acudiente &&
      tipo_acudiente &&
      numero_acudiente
    );
  };

  const resetForm = () => {
    setTipo_documento("");
    setDocumento("");
    setNombres("");
    setApellidos("");
    setSangre("");
    setTelefono("");
    setDireccion("");
    setEps("");
    setArl("");
    setEnfermedades([]);
    setAlergias([]);
    setAcudiente("");
    setTipo_acudiente("");
    setNumero_acudiente("");
  };

  return (
    <Modal show={isOpen} onHide={handleClose} dialogClassName="modalUserRh" contentClassName={darkMode ? "darkmode" : ""}>
      <Modal.Header>
        <Modal.Title>Crear Reemplazante</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <form>
          <div className="form-grid-container">
            <TextField
              label="Tipo de documento"
              select
              value={tipo_documento}
              onChange={(e) => setTipo_documento(e.target.value)}
              fullWidth
              variant="outlined"
            >
              <MenuItem value="">Seleccione un tipo de documento</MenuItem>
              <MenuItem value="CC">CC - Cédula de Ciudadanía</MenuItem>
              <MenuItem value="CE">CE - Cédula de Extranjería</MenuItem>
              <MenuItem value="PP">PP - Pasaporte</MenuItem>
              <MenuItem value="TI">TI - Tarjeta de Identidad</MenuItem>
            </TextField>

            <TextField
              label="Documento"
              type="number"
              value={documento}
              onChange={(e) => setDocumento(e.target.value)}
              fullWidth
              variant="outlined"
            />

            <TextField
              label="Nombres"
              type="text"
              value={nombres}
              onChange={(e) => setNombres(e.target.value)}
              fullWidth
              variant="outlined"
            />

            <TextField
              label="Apellidos"
              type="text"
              value={apellidos}
              onChange={(e) => setApellidos(e.target.value)}
              fullWidth
              variant="outlined"
            />

            <TextField
              label="Tipo de sangre"
              select
              value={sangre}
              onChange={(e) => setSangre(e.target.value)}
              fullWidth
              variant="outlined"
            >
              <MenuItem value="">Seleccione un tipo de sangre</MenuItem>
              <MenuItem value="A+">A+</MenuItem>
              <MenuItem value="A-">A-</MenuItem>
              <MenuItem value="B+">B+</MenuItem>
              <MenuItem value="B-">B-</MenuItem>
              <MenuItem value="AB+">AB+</MenuItem>
              <MenuItem value="AB-">AB-</MenuItem>
              <MenuItem value="O+">O+</MenuItem>
              <MenuItem value="O-">O-</MenuItem>
            </TextField>

            <TextField
              label="Cargo"
              type="text"
              value={cargo}
              onChange={(e) => setCargo(e.target.value)}
              fullWidth
              variant="outlined"
            />

            <TextField
              label="Nombre del contacto de emergencia"
              type="text"
              value={acudiente}
              onChange={(e) => {
                setAcudiente(e.target.value);
                setTipo_acudiente("");
                setNumero_acudiente("");
              }}
              fullWidth
              variant="outlined"
            />

            {acudiente && (
              <TextField
                label={`¿Qué relación tiene el empleado con ${acudiente}?`}
                type="text"
                value={tipo_acudiente}
                onChange={(e) => setTipo_acudiente(e.target.value)}
                fullWidth
                variant="outlined"
              />
            )}

            {acudiente && tipo_acudiente && (
              <TextField
                label={`Número del contacto de emergencia de ${acudiente}`}
                type="text"
                value={numero_acudiente}
                onChange={(e) => setNumero_acudiente(e.target.value)}
                fullWidth
                variant="outlined"
              />
            )}

            <TextField
              label="Teléfono"
              type="number"
              value={telefono}
              onChange={(e) => setTelefono(e.target.value)}
              fullWidth
              variant="outlined"
            />

            <TextField
              label="Dirección"
              type="text"
              value={direccion}
              onChange={(e) => setDireccion(e.target.value)}
              fullWidth
              variant="outlined"
            />

            <TextField
              label="EPS"
              select
              value={eps}
              onChange={(e) => setEps(e.target.value)}
              fullWidth
              variant="outlined"
            >
              <MenuItem value="">Seleccionar EPS</MenuItem>
              {epsOptions.map((option) => (
                <MenuItem key={option} value={option}>
                  {option}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              label="ARL"
              select
              value={arl}
              onChange={(e) => setArl(e.target.value)}
              fullWidth
              variant="outlined"
            >
              <MenuItem value="">Seleccionar ARL</MenuItem>
              {arlOptions.map((option) => (
                <MenuItem key={option} value={option}>
                  {option}
                </MenuItem>
              ))}
            </TextField>

            <Grid item xs={10} sm={4}>
              <TextField
                label="Enfermedades"
                placeholder="Agrega una enfermedad"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleEnfermedadesChange(e);
                  }
                }}
                fullWidth
                variant="outlined"
                value={inputEnfermedad} // Agrega el valor del TextField
                onChange={(e) => setInputEnfermedad(e.target.value)}
              />
              {inputEnfermedad.length >= 2 && (
                <Typography variant="body2" color="textSecondary">
                  Presiona <b>Enter</b> para agregar la enfermedad{" "}
                  <b>{inputEnfermedad}</b>
                </Typography>
              )}
              {enfermedades.length > 0 && (
                <Paper
                  sx={{
                    display: "flex",
                    justifyContent: "center",
                    flexWrap: "wrap",
                    listStyle: "none",
                    p: 0.5,
                    m: 0,
                  }}
                  component="ul"
                  className="mt-2"
                >
                  {enfermedades.map((enfermedad, index) => (
                    <li key={index}>
                      <Chip
                        label={enfermedad}
                        icon={<LocalHospitalIcon />}
                        onDelete={() => removeEnfermedad(index)}
                        color="primary"
                      />
                    </li>
                  ))}
                </Paper>
              )}
            </Grid>

            <Grid item xs={10} sm={4}>
              <TextField
                label="Alergias"
                placeholder="Agrega una alergia"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAlergiasChange(e);
                  }
                }}
                fullWidth
                variant="outlined"
                value={inputAlergia} // Agrega el valor del TextField
                onChange={(e) => setInputAlergia(e.target.value)}
              />
              {inputAlergia.length >= 2 && (
                <Typography variant="body2" color="textSecondary">
                  Presiona <b>Enter</b> para agregar la alergia{" "}
                  <b>{inputAlergia}</b>
                </Typography>
              )}
              {alergias.length > 0 && (
                <Paper
                  sx={{
                    display: "flex",
                    justifyContent: "center",
                    flexWrap: "wrap",
                    listStyle: "none",
                    p: 0.5,
                    m: 0,
                  }}
                  component="ul"
                  className="mt-2"
                >
                  {alergias.map((alergia, index) => (
                    <li key={index}>
                      <Chip
                        label={alergia}
                        icon={<CoronavirusIcon />}
                        onDelete={() => removeAlergia(index)}
                        color="secondary"
                      />
                    </li>
                  ))}
                </Paper>
              )}
            </Grid>
          </div>
        </form>
      </Modal.Body>
      <Modal.Footer>
        <div
          style={{ margin: "2%", display: "flex", justifyContent: "center" }}
        >
          <Button
            variant="contained"
            color="success"
            onClick={handleSave}
            disabled={!areAllFieldsFilled()}
            startIcon={<SaveIcon />}
            style={{ marginRight: "1%" }}
          >
            Guardar
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleClose}
            startIcon={<CancelIcon />}
            style={{ marginLeft: "1%" }}
          >
            Cerrar
          </Button>
        </div>
      </Modal.Footer>
    </Modal>
  );
}
