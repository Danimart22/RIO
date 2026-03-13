import { useState, useEffect } from "react";
import { Modal, TextField, Button, Typography, MenuItem, Chip, Paper, Grid, FormControl, FormGroup, FormControlLabel, Checkbox, Select, InputLabel } from "@mui/material";
import Swal from "sweetalert2";
import EditIcon from "@mui/icons-material/Edit";
import CancelIcon from "@mui/icons-material/Cancel";
import LocalHospitalIcon from "@mui/icons-material/LocalHospital";
import CoronavirusIcon from "@mui/icons-material/Coronavirus";
import oficinaMFSApi from "../../../../api/oficinaMFSApi";

export default function UserUpdate({
  isOpen,
  setShow,
  userId,
  handleUpdateUser,
  isAdminView,
  isRRHHView,
}) {
  const darkMode = localStorage.getItem("darkMode") === "true";
  const [editedUser, setEditedUser] = useState({
    roles: [],
    enfermedades: [],
    alergias: [],
  });
  const [loading, setLoading] = useState(true);
  const [selectedRoles, setSelectedRoles] = useState([]);

  // Opciones de áreas y subáreas
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

  const handleRoleChange = (role) => {
    let updatedRoles = [...selectedRoles];
    if (updatedRoles.includes(role)) {
      updatedRoles = updatedRoles.filter((r) => r !== role);
    } else {
      updatedRoles.push(role);
    }
    setSelectedRoles(updatedRoles);
  };

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await oficinaMFSApi.get(`/users/${userId}`);
        const user = response.data;
        setEditedUser({
          ...user,
          subarea: user.subarea || "",
          enfermedades: Array.isArray(user.enfermedades) ? user.enfermedades : [],
          alergias: Array.isArray(user.alergias) ? user.alergias : [],
          inputEnfermedad: "",
          inputAlergia: "",
        });
        setSelectedRoles(user.roles.map((role) => role.nombre));
        setLoading(false);
      } catch (error) {
        console.error("Error fetching user:", error);
        setLoading(false);
      }
    };

    if (isOpen) {
      fetchUser();
    }
  }, [isOpen, userId]);
  const handleFieldChange = (field, value) => {
    if (field === "area") {
      // Si se cambia el área, resetear subárea SOLO si el área nueva no tiene subáreas
      setEditedUser((prevUser) => {
        const nuevaArea = value;
        const tieneSubareas = areasConSubareas[nuevaArea]?.length > 0;

        return {
          ...prevUser,
          [field]: value,
          // Solo resetear si el área anterior era diferente
          subarea: prevUser.area !== nuevaArea && !tieneSubareas ? null : prevUser.subarea
        };
      });
    } else {
      setEditedUser((prevUser) => ({
        ...prevUser,
        [field]: value,
      }));
    }
  };

  const handleSave = async () => {
    const updatedRoles = [];

    // Agregar "empleado" siempre
    updatedRoles.push("empleado");

    // Agregar los demás roles seleccionados
    selectedRoles.forEach((role) => {
      if (role !== "empleado" && !updatedRoles.includes(role)) {
        updatedRoles.push(role);
      }
    });

    // Crear una copia sin el campo password
    const { password, ...userDataWithoutPassword } = editedUser;
    const updatedUser = { ...userDataWithoutPassword, roles: updatedRoles };

    try {
      const response = await oficinaMFSApi.put(`/users/${userId}`, updatedUser);
      handleUpdateUser();
      setShow(false);

      Swal.fire({
        background: localStorage.getItem("darkMode") === "true" ? '#212121' : '#FFFFFF',
        color: localStorage.getItem("darkMode") === "true" ? 'white' : 'black',
        icon: "success",
        title: "Se actualizó al empleado",
        text: response.data.message,
      });
    } catch (error) {
      setShow(false);
      Swal.fire({
        background: localStorage.getItem("darkMode") === "true" ? '#212121' : '#FFFFFF',
        color: localStorage.getItem("darkMode") === "true" ? 'white' : 'black',
        icon: "error",
        title: "Error al actualizar empleado",
        text: "El empleado no se pudo actualizar",
      });
    }
  };

  const handleEnfermedadesChange = (e) => {
    const value = e.target.value;
    if (value.trim() !== "") {
      setEditedUser((prevUser) => ({
        ...prevUser,
        enfermedades: [...prevUser.enfermedades, value],
      }));
      e.target.value = "";
    }
  };

  const removeEnfermedad = (index) => {
    setEditedUser((prevUser) => {
      const newEnfermedades = [...prevUser.enfermedades];
      newEnfermedades.splice(index, 1);
      return {
        ...prevUser,
        enfermedades: newEnfermedades,
      };
    });
  };

  const handleAlergiasChange = (e) => {
    const value = e.target.value;
    if (value.trim() !== "") {
      setEditedUser((prevUser) => ({
        ...prevUser,
        alergias: [...prevUser.alergias, value],
      }));
      e.target.value = "";
    }
  };

  const removeAlergia = (index) => {
    setEditedUser((prevUser) => {
      const newAlergias = [...prevUser.alergias];
      newAlergias.splice(index, 1);
      return {
        ...prevUser,
        alergias: newAlergias,
      };
    });
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

  return (
    <Modal
      open={isOpen}
      onClose={() => setShow(false)}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          backgroundColor: darkMode ? "rgba(0, 0, 0, 1)" : "rgba(255, 255, 255, 1)",
          borderRadius: "5px",
          boxShadow: "none",
          padding: "16px",
          width: "80%",
          maxHeight: "80vh",
          overflowY: "auto",
        }}
      >
        <Typography variant="h6" gutterBottom>
          Editar Usuario
        </Typography>
        {loading ? (
          <Typography>Cargando...</Typography>
        ) : (
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
                value={editedUser.tipo_documento || ""}
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
                value={editedUser.documento || ""}
                onChange={(e) => handleFieldChange("documento", e.target.value)}
              />
              <TextField
                label="Nombres"
                fullWidth
                variant="outlined"
                value={editedUser.nombres || ""}
                onChange={(e) => handleFieldChange("nombres", e.target.value)}
              />
              <TextField
                label="Apellidos"
                fullWidth
                variant="outlined"
                value={editedUser.apellidos || ""}
                onChange={(e) => handleFieldChange("apellidos", e.target.value)}
              />
              <TextField
                label="Correo"
                fullWidth
                variant="outlined"
                value={editedUser.correo || ""}
                onChange={(e) => handleFieldChange("correo", e.target.value)}
              />
              {isRRHHView && (
                <>
                  <TextField
                    label="Tipo de sangre"
                    select
                    fullWidth
                    variant="outlined"
                    value={editedUser.sangre || ""}
                    onChange={(e) =>
                      handleFieldChange("sangre", e.target.value)
                    }
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
                    value={editedUser.telefono || ""}
                    onChange={(e) =>
                      handleFieldChange("telefono", e.target.value)
                    }
                  />

                  <TextField
                    label="Dirección"
                    type="text"
                    fullWidth
                    variant="outlined"
                    value={editedUser.direccion || ""}
                    onChange={(e) =>
                      handleFieldChange("direccion", e.target.value)
                    }
                  />

                  <TextField
                    label="Empresa vinculado"
                    select
                    value={editedUser.empresa || ""}
                    onChange={(e) =>
                      handleFieldChange("empresa", e.target.value)
                    }
                    fullWidth
                    variant="outlined"
                  >
                    <MenuItem value="">Seleccione una empresa</MenuItem>
                    <MenuItem value="Mobilize Lease&Co">
                      Mobilize Lease&Co
                    </MenuItem>
                    <MenuItem value="Mobilize Financial Services">
                      Mobilize Financial Services 'MFS'
                    </MenuItem>
                  </TextField>

                  <TextField
                    label="Área"
                    select
                    fullWidth
                    variant="outlined"
                    value={editedUser.area || ""}
                    onChange={(e) => handleFieldChange("area", e.target.value)}
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
                    value={editedUser.subarea || ""}
                    onChange={(e) => handleFieldChange("subarea", e.target.value)}
                    disabled={!editedUser.area || areasConSubareas[editedUser.area]?.length === 0}
                    helperText={
                      !editedUser.area
                        ? "Seleccione un área primero"
                        : areasConSubareas[editedUser.area]?.length === 0
                          ? "Esta área no tiene subáreas"
                          : ""
                    }
                  >
                    <MenuItem value="">Sin subárea</MenuItem>
                    {editedUser.area && areasConSubareas[editedUser.area]?.map((subareaOption) => (
                      <MenuItem key={subareaOption} value={subareaOption}>
                        {subareaOption}
                      </MenuItem>
                    ))}
                  </TextField>

                  <TextField
                    label="Cargo"
                    type="text"
                    fullWidth
                    variant="outlined"
                    value={editedUser.cargo || ""}
                    onChange={(e) => handleFieldChange("cargo", e.target.value)}
                  />

                  <TextField
                    label="EPS"
                    select
                    value={editedUser.eps || ""}
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
                    value={editedUser.arl || ""}
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

                  <Grid item xs={10} sm={4}>
                    <TextField
                      label="Enfermedades"
                      placeholder="Agrega una enfermedad"
                      onKeyDown={(e) => {
                        if (
                          e.key === "Enter" &&
                          editedUser.inputEnfermedad.length >= 2
                        ) {
                          e.preventDefault();
                          handleEnfermedadesChange(e);
                          e.target.value = "";
                          setEditedUser((prevUser) => ({
                            ...prevUser,
                            inputEnfermedad: "",
                          }));
                        }
                      }}
                      fullWidth
                      variant="outlined"
                      value={editedUser.inputEnfermedad || ""}
                      onChange={(e) => {
                        const inputValue = e.target.value;
                        setEditedUser((prevUser) => ({
                          ...prevUser,
                          inputEnfermedad: inputValue,
                        }));
                      }}
                    />
                    {editedUser.inputEnfermedad &&
                      editedUser.inputEnfermedad.length >= 2 && (
                        <Typography variant="body2" color="textSecondary">
                          Presiona <b>Enter</b> para agregar la enfermedad{" "}
                          <b>{editedUser.inputEnfermedad}</b>
                        </Typography>
                      )}
                    {editedUser.enfermedades &&
                      editedUser.enfermedades.length > 0 && (
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
                          {editedUser.enfermedades.map((enfermedad, index) => (
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
                        if (
                          e.key === "Enter" &&
                          editedUser.inputAlergia.length >= 2
                        ) {
                          e.preventDefault();
                          handleAlergiasChange(e);
                          e.target.value = "";
                          setEditedUser((prevUser) => ({
                            ...prevUser,
                            inputAlergia: "",
                          }));
                        }
                      }}
                      fullWidth
                      variant="outlined"
                      value={editedUser.inputAlergia || ""}
                      onChange={(e) => {
                        const inputValue = e.target.value;
                        setEditedUser((prevUser) => ({
                          ...prevUser,
                          inputAlergia: inputValue,
                        }));
                      }}
                    />
                    {editedUser.inputAlergia &&
                      editedUser.inputAlergia.length >= 2 && (
                        <Typography variant="body2" color="textSecondary">
                          Presiona <b>Enter</b> para agregar la alergia{" "}
                          <b>{editedUser.inputAlergia}</b>
                        </Typography>
                      )}
                    {editedUser.alergias && editedUser.alergias.length > 0 && (
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
                        {editedUser.alergias.map((alergia, index) => (
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
                    label="¿Es brigadista?"
                    select
                    fullWidth
                    variant="outlined"
                    value={editedUser.brigadista || ""}
                    onChange={(e) =>
                      handleFieldChange("brigadista", e.target.value)
                    }
                  >
                    <MenuItem value={"Si"}>Si</MenuItem>
                    <MenuItem value={"No"}>No</MenuItem>
                  </TextField>

                  <FormControl fullWidth variant="outlined">
                    <InputLabel id="asiento-label">
                      Asiento designado
                    </InputLabel>
                    <Select
                      label="Asiento designado"
                      fullWidth
                      value={editedUser.asiento || ""}
                      onChange={(e) =>
                        handleFieldChange("asiento", e.target.value)
                      }
                    >
                      <MenuItem value="">Seleccione un asiento</MenuItem>
                      {Array.from({ length: 10 }, (_, index) => (
                        <MenuItem
                          key={index + (index === 0 ? 43 : 81)}
                          value={index + (index === 0 ? 43 : 81)}
                        >
                          Asiento {index + (index === 0 ? 43 : 81)}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  <TextField
                    label="Contacto de emergencia"
                    type="text"
                    fullWidth
                    variant="outlined"
                    value={editedUser.acudiente || ""}
                    onChange={(e) =>
                      handleFieldChange("acudiente", e.target.value)
                    }
                  />
                  <TextField
                    label="Vinculo con el contacto de emergencia"
                    type="text"
                    fullWidth
                    variant="outlined"
                    value={editedUser.tipo_acudiente || ""}
                    onChange={(e) =>
                      handleFieldChange("tipo_acudiente", e.target.value)
                    }
                  />
                  <TextField
                    label="Numero de contacto emergencia"
                    type="text"
                    fullWidth
                    variant="outlined"
                    value={editedUser.numero_acudiente || ""}
                    onChange={(e) =>
                      handleFieldChange("numero_acudiente", e.target.value)
                    }
                  />
                </>
              )}
              <>
                {isAdminView && (
                  <TextField
                    label="Estado"
                    select
                    fullWidth
                    variant="outlined"
                    value={editedUser.estado || ""}
                    onChange={(e) =>
                      handleFieldChange("estado", e.target.value)
                    }
                  >
                    <MenuItem value="activo">activo</MenuItem>
                    <MenuItem value="inactivo">inactivo</MenuItem>
                  </TextField>
                )}
              </>
            </div>

            <Grid container spacing={1} justifyContent="center">
              <Grid item xs={12} sm={4} />
              <Grid item xs={12} sm={4}>
                <Typography
                  variant="h6"
                  style={{ marginBottom: "5px", fontWeight: "bold" }}
                  align="center"
                >
                  Seleccione los roles del usuario
                </Typography>
                <FormControl fullWidth>
                  <FormGroup
                    style={{
                      display: "flex",
                      flexDirection: "row",
                      flexWrap: "wrap",
                      justifyContent: "center",
                    }}
                  >
                    {isAdminView && (
                      <FormControlLabel
                        key="admin"
                        control={
                          <Checkbox
                            checked={selectedRoles.includes("admin")}
                            onChange={() => handleRoleChange("admin")}
                            disabled={false}
                          />
                        }
                        label="Admin"
                        style={{ flexBasis: "20%", maxWidth: "20%" }}
                      />
                    )}
                    {["RRHH", "porteria", "gerente", "director", "TI"].map(
                      (rol, index) => (
                        <FormControlLabel
                          key={rol}
                          control={
                            <Checkbox
                              checked={selectedRoles.includes(rol)}
                              onChange={() => handleRoleChange(rol)}
                              disabled={rol === "empleado"}
                            />
                          }
                          label={rol.charAt(0).toUpperCase() + rol.slice(1)}
                          style={{ flexBasis: "20%", maxWidth: "20%" }}
                        />
                      )
                    )}
                    <FormControlLabel
                      control={<Checkbox checked disabled />}
                      label="Empleado"
                      style={{ flexBasis: "20%", maxWidth: "20%" }}
                    />
                  </FormGroup>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={3} />
            </Grid>

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
                onClick={handleSave}
                startIcon={<EditIcon />}
                style={{ marginRight: "3px" }}
              >
                Guardar Cambios
              </Button>
              <Button
                variant="contained"
                color="error"
                onClick={() => setShow(false)}
                startIcon={<CancelIcon />}
                style={{ marginLeft: "3px" }}
              >
                Cancelar
              </Button>
            </div>
          </form>
        )}
      </div>
    </Modal>
  );
}