import { useState, useEffect } from "react";
import oficinaMFSApi from "../../../../api/oficinaMFSApi";
import SaveIcon from "@mui/icons-material/Save";
import CancelIcon from "@mui/icons-material/Close";
import { Modal } from "react-bootstrap";
import { TextField, MenuItem, Chip, Paper, Grid, Button, Typography, FormControlLabel, Checkbox } from "@mui/material";
import CoronavirusIcon from "@mui/icons-material/Coronavirus";
import LocalHospitalIcon from "@mui/icons-material/LocalHospital";
import "../modals.css";
import Swal from "sweetalert2";
import { dataDecrypt } from "../../../../util";

export default function UserForm({ isOpen, setShow, fetchUserData, isAdminView, }) {

  const [username, setUsername] = useState("");
  const [documento, setDocumento] = useState("");
  const [tipo_documento, setTipo_documento] = useState("");
  const [nombres, setNombres] = useState("");
  const [apellidos, setApellidos] = useState("");
  const [correo, setCorreo] = useState("");
  const [sangre, setSangre] = useState("");
  const [cargo, setCargo] = useState("");
  const [area, setArea] = useState("");
  const [subarea, setSubarea] = useState("");
  const [telefono, setTelefono] = useState("");
  const [acudiente, setAcudiente] = useState("");
  const [tipo_acudiente, setTipo_acudiente] = useState("");
  const [numero_acudiente, setNumero_acudiente] = useState("");
  const [direccion, setDireccion] = useState("");
  const [eps, setEps] = useState("");
  const [arl, setArl] = useState("");
  const [enfermedades, setEnfermedades] = useState([]);
  const [alergias, setAlergias] = useState([]);
  const [estado, setEstado] = useState("");
  const [brigadista, setBrigadista] = useState("");
  const [empresa, setEmpresa] = useState("");
  const [inputEnfermedad, setInputEnfermedad] = useState("");
  const [inputAlergia, setInputAlergia] = useState("");
  const [roles, setRoles] = useState({
    admin: false,
    director: false,
    gerente: false,
    RRHH: false,
    porteria: false,
    TI: false,
    empleado: true,
  });

  const areasConSubareas = {
    "Dirección General" : [],
    "Gerencia General MLC": [],
    "Recursos Humanos" : [],
    "Comercial MFS": [],
    "Comercial MLC": [],
    "Tecnología MFS" : ["Proyectos", "Infraestructura", "Seguridad", "Soporte"],
    "Tecnología MLC" : ["Proyectos", "Infraestructura", "Soporte"],
    "Juridica" : ["Cumplimiento", "Asuntos Legales", "Control Interno"],
    "Marketing & Customer": ["Operaciones", "CRM&CXM", "Producto Nuevos Mercados", "Producto Renault"],
    "Financiera MFS" : ["Control de Gestión", "Contabilidad", "Tesorería"],
    "Financiera MLC" : [],
    "Riesgos MFS" : ["Portafolio Retail", "Wholesale", "Admisiones", "Cobranzas"],
    "Riesgos MLC" : [],
    "Marketing MLC" : [],
    "Operaciones MLC" : [],
  };

  const pasteNumber = (e) => {
    e.preventDefault();
    const { name } = e.target;
    const vecNumberCamps = ['telefono', 'documento', 'numero_acudiente'];

    if (vecNumberCamps.includes(name)) {
      const pasted = e.clipboardData.getData('text');
      const cleaned = pasted.replace(/[^0-9]/g, '');

      if (cleaned) {
        const setters = {
          telefono: setTelefono,
          documento: setDocumento,
          numero_acudiente: setNumero_acudiente,
        };

        setters[name](cleaned);
      }
    }
  };

  const validateFields = (e) => {
    const { name, value } = e.target;
    const vecCamposString = ['nombres', 'apellidos', 'cargo', 'acudiente', 'tipo_acudiente',];
    const vecNumberCamps = ['telefono', 'documento', 'numero_acudiente'];

    const validateDoubleSpace = () => {
      const setters = {
        nombres: setNombres,
        apellidos: setApellidos,
        cargo: setCargo,
        acudiente: setAcudiente,
        tipo_acudiente: setTipo_acudiente,
      };

      const formattedValue = value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ ,]/g, '').replace(/^\s+/g, '').replace(/\s{2,}/g, ' ');
      setters[name](formattedValue);
    };

    const validateNumbers = () => {
      const setters = {
        telefono: setTelefono,
        documento: setDocumento,
        numero_acudiente: setNumero_acudiente,
      };

      const formattedValue = value.replace(/[^0-9]/g, '');
      setters[name](formattedValue);
    };

    if (vecCamposString.includes(name)) validateDoubleSpace();
    if (vecNumberCamps.includes(name)) validateNumbers();
  }

  const validateCorreo = () => {
    const regexEmail = /^[^@ \t\r\n]+@[^@ \t\r\n]+\.[^@ \t\r\n]+$/;
    const validCorreo = regexEmail.test(correo);
    return !validCorreo ? false : true;
  }

  const [darkMode, setDarkMode] = useState(localStorage.getItem("darkMode") === "true" ? true : false);

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

  const handleCorreoChange = (event) => {
    const inputValue = event.target.value;
    const formattedValue = inputValue.toLowerCase().replace(/[^a-z.\-@]/g, "");
    setCorreo(formattedValue);
  };

  const handleClose = () => {
    setShow(false);
  };

  const handleRoleChange = (event) => {
    setRoles({ ...roles, [event.target.name]: event.target.checked });
  };

  const handleAreaChange = (value) => {
    setArea(value);
    // Resetear subárea cuando cambia el área
    setSubarea("");
  };

  const handleSave = async () => {
    const selectedRoles = Object.keys(roles).filter((role) => roles[role]);
    const newUser = {
      username,
      documento,
      tipo_documento,
      nombres,
      apellidos,
      correo,
      cargo,
      area,
      subarea: subarea || null, // Enviar null si no hay subárea
      sangre,
      telefono,
      acudiente,
      tipo_acudiente,
      numero_acudiente,
      direccion,
      empresa,
      eps,
      arl,
      enfermedades,
      alergias,
      brigadista,
      roles: selectedRoles,
    };

    try {
      const token = dataDecrypt(localStorage.getItem("Token"));
      const config = {
        headers: {
          "x-access-token": token,
        },
      };

      await oficinaMFSApi.post(`/auth/signup`, newUser, config);

      fetchUserData();
      handleClose();

      Swal.fire({
        background: localStorage.getItem("darkMode") === "true" ? '#212121' : '#FFFFFF',
        color: localStorage.getItem("darkMode") === "true" ? 'white' : 'black',
        icon: "success",
        title: "Empleado creado",
        text: "El empleado fue creado correctamente.",
      });

    } catch (error) {
      console.error("Error al crear empleado:", error);

      let errorMessage = "Ha ocurrido un error al crear al empleado. Por favor, intenta nuevamente.";

      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }

      Swal.fire({
        background: localStorage.getItem("darkMode") === "true" ? '#212121' : '#FFFFFF',
        color: localStorage.getItem("darkMode") === "true" ? 'white' : 'black',
        icon: "error",
        title: "Error al crear empleado",
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
    "FAMISANAR",
    "NUEVA EPS",
    "SALUD TOTAL",
    "SANITAS",
    "SURA",
    "COMPENSAR",
    "COOSALUD",
    "SAVIA SALUD",
    "ALIANSALUD",
    "SANIDAD MILITAR",
  ];

  const arlOptions = [
    "SURA",
    "POSITIVA",
    "COLMENA",
    "AXA COLPATRIA",
    "BOLIVAR",
    "EQUIDAD",
  ];

  const areAllFieldsFilled = () => {
    return (
      documento &&
      tipo_documento &&
      nombres &&
      apellidos &&
      sangre &&
      correo &&
      direccion &&
      telefono &&
      eps &&
      arl &&
      acudiente &&
      tipo_acudiente &&
      numero_acudiente &&
      brigadista &&
      empresa &&
      cargo &&
      area // Área es obligatoria
      // subarea no es obligatoria porque algunas áreas no tienen subáreas
    );
  };

  return (
    <Modal show={isOpen} onHide={handleClose} dialogClassName="modalUserRh" contentClassName={darkMode ? "darkmode" : ""}>
      <Modal.Header closeButton>
        <Modal.Title>Crear empleado</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <form>
          <div className="form-grid-container">
            <TextField
              label="Documento"
              name="documento"
              type="text"
              value={documento}
              onChange={(e) => {
                setDocumento(e.target.value)
                validateFields(e)
              }}
              fullWidth
              variant="outlined"
              onPaste={(e) => pasteNumber(e)}
            />
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
              label="Nombres"
              name="nombres"
              type="text"
              value={nombres}
              onChange={(e) => {
                setNombres(e.target.value)
                validateFields(e)
              }}
              fullWidth
              variant="outlined"
            />

            <TextField
              label="Apellidos"
              type="text"
              value={apellidos}
              onChange={(e) => {
                setApellidos(e.target.value)
                validateFields(e)
              }}
              fullWidth
              variant="outlined"
              name="apellidos"
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
              label="Dirección"
              type="text"
              value={direccion}
              onChange={(e) => setDireccion(e.target.value)}
              fullWidth
              variant="outlined"
            />

            <TextField
              label="Correo"
              type="text"
              value={correo}
              onChange={handleCorreoChange}
              fullWidth
              variant="outlined"
            />

            <TextField
              label="Empresa vinculado"
              select
              value={empresa}
              onChange={(e) => setEmpresa(e.target.value)}
              fullWidth
              variant="outlined"
            >
              <MenuItem value="">Seleccione una empresa</MenuItem>
              <MenuItem value="Mobilize Lease&Co">Mobilize Lease&Co</MenuItem>
              <MenuItem value="Mobilize Financial Services">
                Mobilize Financial Services 'MFS'
              </MenuItem>
            </TextField>

            <TextField
              label="Área *"
              select
              fullWidth
              variant="outlined"
              value={area}
              onChange={(e) => handleAreaChange(e.target.value)}
            >
              <MenuItem value="">Seleccione un área</MenuItem>
              {Object.keys(areasConSubareas).map((areaOption) => (
                <MenuItem key={areaOption} value={areaOption}>
                  {areaOption}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              label="Subárea"
              select
              fullWidth
              variant="outlined"
              value={subarea}
              onChange={(e) => setSubarea(e.target.value)}
              disabled={!area || areasConSubareas[area]?.length === 0}
              helperText={
                !area
                  ? "Seleccione un área primero"
                  : areasConSubareas[area]?.length === 0
                    ? "Esta área no tiene subáreas"
                    : ""
              }
            >
              <MenuItem value="">Sin subárea</MenuItem>
              {area && areasConSubareas[area]?.map((subareaOption) => (
                <MenuItem key={subareaOption} value={subareaOption}>
                  {subareaOption}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              label="Cargo *"
              type="text"
              value={cargo}
              onChange={(e) => {
                setCargo(e.target.value)
                validateFields(e)
              }}
              fullWidth
              variant="outlined"
              name="cargo"
            />

            <TextField
              label="Teléfono"
              type="text"
              value={telefono}
              onChange={(e) => {
                setTelefono(e.target.value)
                validateFields(e)
              }}
              fullWidth
              variant="outlined"
              onPaste={(e) => pasteNumber(e)}
              name="telefono"
            />

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
                value={inputEnfermedad}
                onChange={(e) => {
                  setInputEnfermedad(e.target.value)
                }}
                name="enfermedades"
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
                value={inputAlergia}
                onChange={(e) => {
                  setInputAlergia(e.target.value)
                }}
                name="alergias"
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

            <TextField
              label="Nombre del contacto de emergencia"
              type="text"
              value={acudiente}
              onChange={(e) => {
                setAcudiente(e.target.value);
                setTipo_acudiente("");
                setNumero_acudiente("");
                validateFields(e)
              }}
              fullWidth
              variant="outlined"
              name="acudiente"
            />

            {acudiente && (
              <TextField
                label={`¿Qué relación tiene el empleado con ${acudiente}?`}
                type="text"
                value={tipo_acudiente}
                onChange={(e) => {
                  setTipo_acudiente(e.target.value)
                  validateFields(e)
                }}
                fullWidth
                variant="outlined"
                name="tipo_acudiente"
              />
            )}

            {acudiente && tipo_acudiente && (
              <TextField
                label={`Número del contacto de emergencia de ${acudiente}`}
                type="text"
                value={numero_acudiente}
                onChange={(e) => {
                  setNumero_acudiente(e.target.value)
                  validateFields(e)
                }}
                fullWidth
                variant="outlined"
                name="numero_acudiente"
              />
            )}

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

            <TextField
              label="¿Es brigadista?"
              select
              value={brigadista}
              onChange={(e) => setBrigadista(e.target.value)}
              fullWidth
              variant="outlined"
            >
              <MenuItem value="Si">Sí</MenuItem>
              <MenuItem value="No">No</MenuItem>
            </TextField>
          </div>
          <Grid container spacing={1} justifyContent="center">
            <Grid item xs={12} sm={3} />
            <Grid item xs={1} sm={3.5}>
              <Typography
                variant="h6"
                component="h3"
                align="center"
                style={{ marginTop: "30px", fontWeight: "bold" }}
              >
                Seleccione los roles que tendrá el usuario
              </Typography>
              <Grid container spacing={2} style={{ marginTop: "30px" }}>
                {isAdminView && (
                  <Grid item xs={4}>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={roles.admin}
                          onChange={handleRoleChange}
                          name="admin"
                        />
                      }
                      label="Admin"
                    />
                  </Grid>
                )}
                <Grid item xs={4}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={roles.director}
                        onChange={handleRoleChange}
                        name="director"
                      />
                    }
                    label="Director"
                  />
                </Grid>
                <Grid item xs={4}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={roles.gerente}
                        onChange={handleRoleChange}
                        name="gerente"
                      />
                    }
                    label="Gerente"
                  />
                </Grid>
                <Grid item xs={4}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={roles.RRHH}
                        onChange={handleRoleChange}
                        name="RRHH"
                      />
                    }
                    label="RRHH"
                  />
                </Grid>
                <Grid item xs={4}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={roles.porteria}
                        onChange={handleRoleChange}
                        name="porteria"
                      />
                    }
                    label="Porteria"
                  />
                </Grid>
                <Grid item xs={4}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={roles.TI}
                        onChange={handleRoleChange}
                        name="TI"
                      />
                    }
                    label="TI"
                  />
                </Grid>
                <Grid item xs={4}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={roles.empleado}
                        onChange={handleRoleChange}
                        name="empleado"
                        disabled
                      />
                    }
                    label="Empleado"
                  />
                </Grid>
              </Grid>
            </Grid>
            <Grid item xs={12} sm={3} />
          </Grid>
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
            disabled={!areAllFieldsFilled() || !validateCorreo()}
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