import { useState, useEffect } from "react";
import { Modal, TextField, Button, Typography, MenuItem, Grid, Chip, Paper} from "@mui/material";
import Swal from "sweetalert2";
import EditIcon from "@mui/icons-material/Edit";
import CancelIcon from "@mui/icons-material/Cancel";
import LocalHospitalIcon from "@mui/icons-material/LocalHospital";
import CoronavirusIcon from "@mui/icons-material/Coronavirus";
import oficinaMFSApi from "../../../../api/oficinaMFSApi";

export default function VisitanteUpdate({
  isOpen,
  handleClose,
  visitanteId,
  handleUpdateVisitante,
  setShowEditModal,
}) {
  const [loading, setLoading] = useState(true);
  const [editedVisitante, setEditedVisitante] = useState({});

  useEffect(() => {
    const fetchVisitante = async () => {
      try {
        const response = await oficinaMFSApi.get(`/visitantes/${visitanteId}`);
        const visitante = response.data;
        setEditedVisitante(visitante);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching visitantes:", error);
        setLoading(false);
      }
    };

    if (isOpen) {
      fetchVisitante();
    }
  }, [isOpen, visitanteId]);

  const handleFieldChange = (field, value) => {
    setEditedVisitante((prevVisitante) => ({
      ...prevVisitante,
      [field]: value,
    }));
  };

  const handleAddressFieldChange = (field, value) => {
    setEditedVisitante((prevVisitante) => ({
      ...prevVisitante,
      direccion: {
        ...prevVisitante.direccion,
        [field]: value,
      },
    }));
  };

  const handleUpdate = async () => {
    try {
      // Realiza la solicitud PUT a la API para editar el visitante
      const response = await oficinaMFSApi.put(
        `/visitantes/${visitanteId}`,
        editedVisitante
      );

      handleUpdateVisitante();
      setShowEditModal(false);

      Swal.fire({
          background: localStorage.getItem("darkMode")==="true"?'#212121':'#FFFFFF',
          color: localStorage.getItem("darkMode")==="true"?'white':'black',
        icon: "success",
        title: "Visitante actualizado",
        text: response.data.message,
      });
    } catch (error) {
      setShowEditModal(false);
      Swal.fire({
          background: localStorage.getItem("darkMode")==="true"?'#212121':'#FFFFFF',
          color: localStorage.getItem("darkMode")==="true"?'white':'black',
        icon: "error",
        title: "Error al editar el visitante",
        text: "Ha ocurrido un error al editar el visitante. Por favor, intenta nuevamente.",
      });
    }
  };

  const handleEnfermedadesChange = (e) => {
    const value = e.target.value;
    if (value.trim() !== "") {
      setEditedVisitante((prevVisitante) => ({
        ...prevVisitante,
        enfermedades: [...prevVisitante.enfermedades, value],
      }));
      e.target.value = ""; // Limpiar el campo después de agregar una enfermedad
    }
  };

  const removeEnfermedad = (index) => {
    setEditedVisitante((prevVisitante) => {
      const newEnfermedades = [...prevVisitante.enfermedades];
      newEnfermedades.splice(index, 1);
      return {
        ...prevVisitante,
        enfermedades: newEnfermedades,
      };
    });
  };

  const handleAlergiasChange = (e) => {
    const value = e.target.value;
    if (value.trim() !== "") {
      setEditedVisitante((prevVisitante) => ({
        ...prevVisitante,
        alergias: [...prevVisitante.alergias, value],
      }));
      e.target.value = "";
    }
  };

  // Función para eliminar una alergia de la lista
  const removeAlergia = (index) => {
    setEditedVisitante((prevVisitante) => {
      const newAlergias = [...prevVisitante.alergias];
      newAlergias.splice(index, 1);
      return {
        ...prevVisitante,
        alergias: newAlergias,
      };
    });
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

  const arlOptions = [
    "SURA",
    "POSITIVA",
    "COLMENA",
    "AXA COLPATRIA",
    "BOLIVAR",
    "EQUIDAD",
    // Agregar el resto de las opciones para ARL
  ];

  return (
    <Modal
      open={isOpen}
      onClose={handleClose}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          backgroundColor: "#fff",
          borderRadius: "5px",
          boxShadow: "none",
          padding: "16px",
          width: "80%",
          maxHeight: "80vh",
          overflowY: "auto",
        }}
      >
        <Typography variant="h6" gutterBottom>
          Editar Visitante
        </Typography>
        <form>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: "12px",
            }}
          >
            <TextField
              label="Tipo de documento"
              select
              fullWidth
              variant="outlined"
              value={editedVisitante.tipo_documento || ""}
              onChange={(e) =>
                handleFieldChange("tipo_documento", e.target.value)
              }
            >
              <MenuItem value="CC">CC - Cédula de Ciudadanía</MenuItem>
              <MenuItem value="CE">CE - Cédula de Extranjería</MenuItem>
              <MenuItem value="PP">PP - Pasaporte</MenuItem>
              <MenuItem value="TI">TI - Tarjeta de Identidad</MenuItem>
            </TextField>
            <TextField
              label="Documento"
              fullWidth
              variant="outlined"
              value={editedVisitante.documento || ""}
              onChange={(e) => handleFieldChange("documento", e.target.value)}
            />
            <TextField
              label="Nombres"
              fullWidth
              variant="outlined"
              value={editedVisitante.nombres || ""}
              onChange={(e) => handleFieldChange("nombres", e.target.value)}
            />
            <TextField
              label="Apellidos"
              fullWidth
              variant="outlined"
              value={editedVisitante.apellidos || ""}
              onChange={(e) => handleFieldChange("apellidos", e.target.value)}
            />
            <TextField
              label="Tipo de sangre"
              select
              fullWidth
              variant="outlined"
              value={editedVisitante.sangre || ""}
              onChange={(e) => handleFieldChange("sangre", e.target.value)}
            >
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
              label="Numero de telefono"
              type="number"
              fullWidth
              variant="outlined"
              value={editedVisitante.telefono || ""}
              onChange={(e) => handleFieldChange("telefono", e.target.value)}
            />
            <TextField
              label="Calle"
              fullWidth
              variant="outlined"
              value={editedVisitante.direccion?.calle || ""}
              onChange={(e) =>
                handleAddressFieldChange("calle", e.target.value)
              }
            />
            <TextField
              label="Ciudad"
              fullWidth
              variant="outlined"
              value={editedVisitante.direccion?.ciudad || ""}
              onChange={(e) =>
                handleAddressFieldChange("ciudad", e.target.value)
              }
            />
            <TextField
              label="País"
              fullWidth
              variant="outlined"
              value={editedVisitante.direccion?.pais || ""}
              onChange={(e) => handleAddressFieldChange("pais", e.target.value)}
            />

            <Grid item xs={10} sm={4}>
              <TextField
                label="Enfermedades"
                placeholder="Agrega una enfermedad"
                onKeyDown={(e) => {
                  if (
                    e.key === "Enter" &&
                    editedVisitante.inputEnfermedad.length >= 2
                  ) {
                    e.preventDefault();
                    handleEnfermedadesChange(e);
                    e.target.value = ""; // Vaciar el TextField después de agregar la enfermedad
                    setEditedVisitante((prevVisitante) => ({
                      ...prevVisitante,
                      inputEnfermedad: "", // Vaciar también el valor en el estado
                    }));
                  }
                }}
                fullWidth
                variant="outlined"
                value={editedVisitante.inputEnfermedad || ""}
                onChange={(e) => {
                  const inputValue = e.target.value;
                  setEditedVisitante((prevVisitante) => ({
                    ...prevVisitante,
                    inputEnfermedad: inputValue, // Actualiza el valor de inputEnfermedad
                  }));
                }}
              />
              {editedVisitante.inputEnfermedad &&
                editedVisitante.inputEnfermedad.length >= 2 && (
                  <Typography variant="body2" color="textSecondary">
                    Presiona <b>Enter</b> para agregar la enfermedad <b>{editedVisitante.inputEnfermedad}</b>
                  </Typography>
                )}
              {editedVisitante.enfermedades &&
                editedVisitante.enfermedades.length > 0 && (
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
                    {editedVisitante.enfermedades.map((enfermedad, index) => (
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

            <Grid item xs={12} sm={4}>
              <TextField
                label="Alergias"
                placeholder="Agrega una alergia"
                onKeyDown={(e) => {
                  if (
                    e.key === "Enter" &&
                    editedVisitante.inputAlergia.length >= 2
                  ) {
                    e.preventDefault();
                    handleAlergiasChange(e);
                    e.target.value = ""; // Vaciar el TextField después de agregar la alergia
                    setEditedVisitante((prevVisitante) => ({
                      ...prevVisitante,
                      inputAlergia: "", // Vaciar también el valor en el estado
                    }));
                  }
                }}
                fullWidth
                variant="outlined"
                value={editedVisitante.inputAlergia || ""}
                onChange={(e) => {
                  const inputValue = e.target.value;
                  setEditedVisitante((prevVisitante) => ({
                    ...prevVisitante,
                    inputAlergia: inputValue, // Actualiza el valor de inputAlergia
                  }));
                }}
              />
              {editedVisitante.inputAlergia &&
                editedVisitante.inputAlergia.length >= 2 && (
                  <Typography variant="body2" color="textSecondary">
                    Presiona <b>Enter</b> para agregar la alergia <b>{editedVisitante.inputAlergia}</b>
                  </Typography>
                )}
              {editedVisitante.alergias &&
                editedVisitante.alergias.length > 0 && (
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
                    {editedVisitante.alergias.map((alergia, index) => (
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
              label="EPS"
              select
              value={editedVisitante.eps || ""}
              onChange={(e) => handleFieldChange("eps", e.target.value)}
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
              value={editedVisitante.arl || ""}
              onChange={(e) => handleFieldChange("arl", e.target.value)}
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
          </div>
        </form>
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            marginTop: "16px",
          }}
        >
          <Button
            variant="contained"
            color="success"
            onClick={handleUpdate}
            startIcon={<EditIcon />}
          >
            Guardar Cambios
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleClose}
            startIcon={<CancelIcon />}
            style={{ marginLeft: "10px" }}
          >
            Cancelar
          </Button>
        </div>
      </div>
    </Modal>
  );
}
