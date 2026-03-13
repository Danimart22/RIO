import { useState, useEffect } from "react";
import { Modal, TextField, Button, Typography, MenuItem, Checkbox, FormControlLabel, Box} from "@mui/material";
import Swal from "sweetalert2";
import EditIcon from "@mui/icons-material/Edit";
import CancelIcon from "@mui/icons-material/Cancel";
import oficinaMFSApi from "../../../../api/oficinaMFSApi";

export default function MassiveUserUpdate({
  isOpen,
  setShow,
  selectedUserIds,
  handleUpdateUsers,
}) {
  const darkMode = localStorage.getItem("darkMode") === "true";
  const [formData, setFormData] = useState({
    eps: "",
    arl: "",
    brigadista: "",
    sangre: "",
    area: "",
    subarea: "",
    dias_presenciales: [],
  });
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [daysDropdownOpen, setDaysDropdownOpen] = useState(false);

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

  const diasDisponibles = [
    { id: 1, nombre: "Lunes", abbr: "L" },
    { id: 2, nombre: "Martes", abbr: "M" },
    { id: 3, nombre: "Miercoles", abbr: "X" },
    { id: 4, nombre: "Jueves", abbr: "J" },
    { id: 5, nombre: "Viernes", abbr: "V" },
  ];

  useEffect(() => {
    const fetchSelectedUsers = async () => {
      if (isOpen && selectedUserIds.length > 0) {
        try {
          setLoading(true);
          const promises = selectedUserIds.map(id => 
            oficinaMFSApi.get(`/users/${id}`)
          );
          const responses = await Promise.all(promises);
          const users = responses.map(res => res.data);
          setSelectedUsers(users);
          setLoading(false);
        } catch (error) {
          console.error("Error fetching selected users:", error);
          setLoading(false);
        }
      }
    };

    if (isOpen) {
      fetchSelectedUsers();
      setFormData({
        eps: "",
        arl: "",
        brigadista: "",
        sangre: "",
        area: "",
        subarea: "",
        dias_presenciales: [],
      });
    }
  }, [isOpen, selectedUserIds]);

  const handleFieldChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    if (field === "area") {
      setFormData((prev) => ({
        ...prev,
        subarea: "",
      }));
    }
  };

  const handleDayToggle = (dayName) => {
    setFormData((prev) => {
      const currentDays = prev.dias_presenciales;
      
      if (currentDays.includes(dayName)) {
        return {
          ...prev,
          dias_presenciales: currentDays.filter(d => d !== dayName)
        };
      } else {
        if (currentDays.length < 3) {
          return {
            ...prev,
            dias_presenciales: [...currentDays, dayName]
          };
        } else {
          Swal.fire({
            background: darkMode ? '#212121' : '#FFFFFF',
            color: darkMode ? 'white' : 'black',
            icon: "warning",
            title: "Máximo 3 días",
            text: "Solo puede seleccionar máximo 3 días presenciales.",
          });
          return prev;
        }
      }
    });
  };

  const renderDaysSummary = () => {
    const selectedDays = formData.dias_presenciales;
    
    if (selectedDays.length === 0) {
      return (
        <span style={{ color: "#999", fontStyle: "italic", fontSize: "14px" }}>
          No modificar
        </span>
      );
    }

    return (
      <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
        {diasDisponibles.map(day => {
          const isSelected = selectedDays.includes(day.nombre);
          return (
            <span
              key={day.id}
              style={{
                display: "inline-block",
                width: "24px",
                height: "24px",
                lineHeight: "24px",
                textAlign: "center",
                borderRadius: "4px",
                fontSize: "12px",
                fontWeight: isSelected ? "bold" : "normal",
                backgroundColor: isSelected ? "#1976d2" : "#e0e0e0",
                color: isSelected ? "white" : "#666",
              }}
            >
              {day.abbr}
            </span>
          );
        })}
        <span style={{ marginLeft: "8px", fontSize: "13px", color: "#666" }}>
          ({selectedDays.length}/3)
        </span>
      </div>
    );
  };

  const handleSave = async () => {
    const dataToUpdate = Object.entries(formData).reduce((acc, [key, value]) => {
      if (key === "dias_presenciales") {
        if (Array.isArray(value) && value.length > 0) {
          acc[key] = value;
        }
      } else if (value !== "" && value !== null && value !== undefined) {
        acc[key] = value;
      }
      return acc;
    }, {});

    if (Object.keys(dataToUpdate).length === 0) {
      Swal.fire({
        background: darkMode ? '#212121' : '#FFFFFF',
        color: darkMode ? 'white' : 'black',
        icon: "warning",
        title: "Sin cambios",
        text: "Debe seleccionar al menos un campo para actualizar.",
      });
      return;
    }

    const userList = selectedUsers.map(user => 
      `<li>${user.nombres} ${user.apellidos}</li>`
    ).join("");

    const fieldNames = {
      eps: "EPS",
      arl: "ARL",
      brigadista: "Brigadista",
      sangre: "Tipo de Sangre",
      area: "Área",
      subarea: "Subárea",
      dias_presenciales: "Días Presenciales",
    };

    const changesList = Object.entries(dataToUpdate).map(([key, value]) => {
      const displayValue = key === "dias_presenciales" 
        ? value.join(", ") 
        : value;
      return `<li><b>${fieldNames[key]}:</b> ${displayValue}</li>`;
    }).join("");

    setShow(false);

    const confirmResult = await Swal.fire({
      background: darkMode ? '#212121' : '#FFFFFF',
      color: darkMode ? 'white' : 'black',
      title: "¿Está seguro de realizar la edición masiva?",
      html: `
        <div style="text-align: left;">
          <p><b>Cambios a realizar:</b></p>
          <ul>${changesList}</ul>
          <br>
          <p><b>Estas son las personas que se verán afectadas por la edición (${selectedUsers.length} usuario${selectedUsers.length > 1 ? 's' : ''}):</b></p>
          <ul>${userList}</ul>
        </div>
      `,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#F45000",
      cancelButtonColor: "#6c757d",
      confirmButtonText: "Sí, realizar cambios",
      cancelButtonText: "Cancelar",
      width: '600px',
    });

    if (!confirmResult.isConfirmed) {
      return;
    }

    try {
      await oficinaMFSApi.put("/users/massive-update", {
        userIds: selectedUserIds,
        updates: dataToUpdate,
      });

      handleUpdateUsers();

      Swal.fire({
        background: darkMode ? '#212121' : '#FFFFFF',
        color: darkMode ? 'white' : 'black',
        icon: "success",
        title: "Actualización exitosa",
        text: `Se han actualizado ${selectedUsers.length} usuario${selectedUsers.length > 1 ? 's' : ''} correctamente.`,
      });
    } catch (error) {
      console.error("Error en actualización masiva:", error);
      Swal.fire({
        background: darkMode ? '#212121' : '#FFFFFF',
        color: darkMode ? 'white' : 'black',
        icon: "error",
        title: "Error al actualizar usuarios",
        text: error.response?.data?.message || "No se pudo realizar la actualización masiva.",
      });
    }
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
          padding: "24px",
          width: "60%",
          maxHeight: "80vh",
          overflowY: "auto",
        }}
      >
        <Typography variant="h5" gutterBottom style={{ fontWeight: "bold", marginBottom: "16px" }}>
          Edición Masiva de Usuarios
        </Typography>
        
        <Typography variant="body1" gutterBottom style={{ marginBottom: "24px", color: darkMode ? "#bdbdbd" : "#666" }}>
          <b>{selectedUserIds.length}</b> usuario{selectedUserIds.length > 1 ? 's' : ''} seleccionado{selectedUserIds.length > 1 ? 's' : ''}
        </Typography>

        {loading ? (
          <Typography>Cargando información de usuarios...</Typography>
        ) : (
          <form>
            <Typography variant="body2" gutterBottom style={{ marginBottom: "16px", fontStyle: "italic" }}>
              Seleccione solo los campos que desea actualizar. Los campos vacíos no se modificarán.
            </Typography>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(2, 1fr)",
                gap: "16px",
                marginBottom: "24px",
              }}
            >
              <TextField
                label="EPS"
                select
                fullWidth
                variant="outlined"
                value={formData.eps}
                onChange={(e) => handleFieldChange("eps", e.target.value)}
              >
                <MenuItem value="">
                  <em>No modificar</em>
                </MenuItem>
                {epsOptions.map((option) => (
                  <MenuItem key={option} value={option}>
                    {option}
                  </MenuItem>
                ))}
              </TextField>

              <TextField
                label="ARL"
                select
                fullWidth
                variant="outlined"
                value={formData.arl}
                onChange={(e) => handleFieldChange("arl", e.target.value)}
              >
                <MenuItem value="">
                  <em>No modificar</em>
                </MenuItem>
                {arlOptions.map((option) => (
                  <MenuItem key={option} value={option}>
                    {option}
                  </MenuItem>
                ))}
              </TextField>

              <TextField
                label="Tipo de sangre"
                select
                fullWidth
                variant="outlined"
                value={formData.sangre}
                onChange={(e) => handleFieldChange("sangre", e.target.value)}
              >
                <MenuItem value="">
                  <em>No modificar</em>
                </MenuItem>
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
                label="¿Es brigadista?"
                select
                fullWidth
                variant="outlined"
                value={formData.brigadista}
                onChange={(e) => handleFieldChange("brigadista", e.target.value)}
              >
                <MenuItem value="">
                  <em>No modificar</em>
                </MenuItem>
                <MenuItem value="Si">Sí</MenuItem>
                <MenuItem value="No">No</MenuItem>
              </TextField>

              <TextField
                label="Área"
                select
                fullWidth
                variant="outlined"
                value={formData.area}
                onChange={(e) => handleFieldChange("area", e.target.value)}
              >
                <MenuItem value="">
                  <em>No modificar</em>
                </MenuItem>
                {Object.keys(areasConSubareas).map((area) => (
                  <MenuItem key={area} value={area}>
                    {area}
                  </MenuItem>
                ))}
              </TextField>

              <TextField
                label="Subárea"
                select
                fullWidth
                variant="outlined"
                value={formData.subarea}
                onChange={(e) => handleFieldChange("subarea", e.target.value)}
                disabled={!formData.area || areasConSubareas[formData.area]?.length === 0}
                helperText={
                  !formData.area 
                    ? "Seleccione un área primero" 
                    : areasConSubareas[formData.area]?.length === 0 
                    ? "Esta área no tiene subáreas" 
                    : ""
                }
              >
                <MenuItem value="">
                  <em>No modificar</em>
                </MenuItem>
                {formData.area && areasConSubareas[formData.area]?.map((subarea) => (
                  <MenuItem key={subarea} value={subarea}>
                    {subarea}
                  </MenuItem>
                ))}
              </TextField>

              <Box sx={{ gridColumn: "1 / -1" }}>
                <TextField
                  label="Días Presenciales"
                  select
                  fullWidth
                  variant="outlined"
                  SelectProps={{
                    open: daysDropdownOpen,
                    onOpen: () => setDaysDropdownOpen(true),
                    onClose: () => setDaysDropdownOpen(false),
                    renderValue: () => renderDaysSummary(),
                    MenuProps: {
                      PaperProps: {
                        style: {
                          maxHeight: 300,
                        },
                      },
                      onClose: () => setDaysDropdownOpen(false),
                    },
                  }}
                  helperText={`Seleccione hasta 3 días presenciales (${formData.dias_presenciales.length}/3)`}
                >
                  <MenuItem value="" disabled>
                    <Typography variant="body2" color="textSecondary">
                      Seleccione los días presenciales
                    </Typography>
                  </MenuItem>
                  {diasDisponibles.map((dia) => (
                    <MenuItem
                      key={dia.id}
                      value={dia.nombre}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDayToggle(dia.nombre);
                      }}
                    >
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={formData.dias_presenciales.includes(dia.nombre)}
                            onChange={() => handleDayToggle(dia.nombre)}
                          />
                        }
                        label={dia.nombre}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </MenuItem>
                  ))}
                </TextField>
              </Box>
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "center",
                gap: "12px",
                marginTop: "24px",
              }}
            >
              <Button
                variant="contained"
                color="success"
                onClick={handleSave}
                startIcon={<EditIcon />}
                style={{ minWidth: "180px" }}
              >
                Guardar Cambios
              </Button>
              <Button
                variant="contained"
                color="error"
                onClick={() => setShow(false)}
                startIcon={<CancelIcon />}
                style={{ minWidth: "180px" }}
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