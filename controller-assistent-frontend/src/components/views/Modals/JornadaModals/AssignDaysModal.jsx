import { useState, useEffect } from "react";
import {
Dialog,  DialogTitle,DialogContent,DialogActions,FormControl,InputLabel,Select,MenuItem,Checkbox,FormControlLabel,FormGroup,Typography,Radio,RadioGroup,FormLabel,Box,Button} from "@mui/material";
import Swal from "sweetalert2";
import oficinaMFSApi from "../../../../api/oficinaMFSApi";

const AssignDaysModal = ({ isOpen, setShow, userData, onAssignmentComplete }) => {
  // Estados para el modal de asignación
  const [assignmentType, setAssignmentType] = useState("area");
  const [selectedArea, setSelectedArea] = useState("");
  const [selectedSubarea, setSelectedSubarea] = useState("");
  const [selectedUser, setSelectedUser] = useState("");
  const [selectedDays, setSelectedDays] = useState([]);
  const [usersInArea, setUsersInArea] = useState([]);

  // Lista de áreas y subáreas
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

  // Días disponibles (solo días laborales)
  const diasDisponibles = [
    { id: 1, nombre: "Lunes" },
    { id: 2, nombre: "Martes" },
    { id: 3, nombre: "Miercoles" },
    { id: 4, nombre: "Jueves" },
    { id: 5, nombre: "Viernes" },
  ];

  // Resetear valores cuando se cierra el modal
  useEffect(() => {
    if (!isOpen) {
      handleResetModal();
    }
  }, [isOpen]);

  // Resetear modal
  const handleResetModal = () => {
    setAssignmentType("area");
    setSelectedArea("");
    setSelectedSubarea("");
    setSelectedUser("");
    setSelectedDays([]);
    setUsersInArea([]);
  };

  // Cerrar modal
  const handleClose = () => {
    setShow(false);
  };

  // Cuando se selecciona un área, obtener usuarios de esa área
  const handleAreaChange = (area) => {
    setSelectedArea(area);
    setSelectedSubarea("");
    setSelectedUser("");

    // Filtrar usuarios del área seleccionada
    const usersInSelectedArea = userData.filter(user => user.area === area);
    setUsersInArea(usersInSelectedArea);
  };

  // Cuando se selecciona una subárea
  const handleSubareaChange = (subarea) => {
    setSelectedSubarea(subarea);
    setSelectedUser("");

    // Filtrar usuarios de la subárea seleccionada
    const usersInSelectedSubarea = userData.filter(
      user => user.area === selectedArea && user.subarea === subarea
    );
    setUsersInArea(usersInSelectedSubarea);
  };

  // Manejar selección de días (máximo 3)
  const handleDayToggle = (day) => {
    setSelectedDays(prev => {
      if (prev.includes(day)) {
        // Si ya está seleccionado, quitarlo
        return prev.filter(d => d !== day);
      } else {
        // Si no está seleccionado, agregarlo solo si hay menos de 3
        if (prev.length < 3) {
          return [...prev, day];
        } else {
          Swal.fire({
            background: localStorage.getItem("darkMode") === "true" ? '#212121' : '#FFFFFF',
            color: localStorage.getItem("darkMode") === "true" ? 'white' : 'black',
            icon: "warning",
            title: "Máximo 3 días",
            text: "Solo puede seleccionar máximo 3 días presenciales.",
          });
          return prev;
        }
      }
    });
  };

  // Guardar asignación de días
  const handleSaveAssignment = async () => {
    // Validar que se hayan seleccionado días
    if (selectedDays.length === 0) {
      Swal.fire({
        background: localStorage.getItem("darkMode") === "true" ? '#212121' : '#FFFFFF',
        color: localStorage.getItem("darkMode") === "true" ? 'white' : 'black',
        icon: "warning",
        title: "Sin días seleccionados",
        text: "Debe seleccionar al menos un día.",
      });
      return;
    }

    try {
      let endpoint = "";
      let requestData = {};
      let successMessage = "";

      // Determinar endpoint según el tipo de asignación
      if (assignmentType === "individual") {
        // Asignación individual
        if (!selectedUser) {
          Swal.fire({
            background: localStorage.getItem("darkMode") === "true" ? '#212121' : '#FFFFFF',
            color: localStorage.getItem("darkMode") === "true" ? 'white' : 'black',
            icon: "warning",
            title: "Usuario no seleccionado",
            text: "Debe seleccionar un usuario.",
          });
          return;
        }

        endpoint = "/users/assign-days-by-user";
        requestData = {
          userId: selectedUser,
          dias: selectedDays
        };

        const selectedUserData = usersInArea.find(u => u.id === selectedUser);
        successMessage = `Días asignados exitosamente a ${selectedUserData.nombres} ${selectedUserData.apellidos}`;

      } else if (assignmentType === "subarea") {
        // Asignación por subárea
        if (!selectedArea || !selectedSubarea) {
          Swal.fire({
            background: localStorage.getItem("darkMode") === "true" ? '#212121' : '#FFFFFF',
            color: localStorage.getItem("darkMode") === "true" ? 'white' : 'black',
            icon: "warning",
            title: "Área/Subárea no seleccionada",
            text: "Debe seleccionar un área y una subárea.",
          });
          return;
        }

        endpoint = "/users/assign-days-by-area";
        requestData = {
          area: selectedArea,
          subarea: selectedSubarea,
          dias: selectedDays
        };
        successMessage = `Días asignados exitosamente a todos los usuarios de ${selectedArea} - ${selectedSubarea}`;

      } else {
        // Asignación por área completa
        if (!selectedArea) {
          Swal.fire({
            background: localStorage.getItem("darkMode") === "true" ? '#212121' : '#FFFFFF',
            color: localStorage.getItem("darkMode") === "true" ? 'white' : 'black',
            icon: "warning",
            title: "Área no seleccionada",
            text: "Debe seleccionar un área.",
          });
          return;
        }

        endpoint = "/users/assign-days-by-area";
        requestData = {
          area: selectedArea,
          dias: selectedDays
        };
        successMessage = `Días asignados exitosamente a todos los usuarios de ${selectedArea}`;
      }

      // Realizar la petición
      await oficinaMFSApi.post(endpoint, requestData);

      // Cerrar modal
      handleClose();

      // Notificar al componente padre para refrescar datos
      if (onAssignmentComplete) {
        onAssignmentComplete();
      }

      Swal.fire({
        background: localStorage.getItem("darkMode") === "true" ? '#212121' : '#FFFFFF',
        color: localStorage.getItem("darkMode") === "true" ? 'white' : 'black',
        icon: "success",
        title: "Asignación exitosa",
        text: successMessage,
      });

    } catch (error) {
      console.error("Error al asignar días:", error);
      Swal.fire({
        background: localStorage.getItem("darkMode") === "true" ? '#212121' : '#FFFFFF',
        color: localStorage.getItem("darkMode") === "true" ? 'white' : 'black',
        icon: "error",
        title: "Error al asignar días",
        text: error.response?.data?.message || "Ha ocurrido un error al asignar los días.",
      });
    }
  };

  return (
    <Dialog
      open={isOpen}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle>Asignar Días Presenciales</DialogTitle>
      <DialogContent>
        <Box sx={{ mt: 2 }}>
          {/* Tipo de asignación */}
          <FormControl component="fieldset" sx={{ mb: 3 }}>
            <FormLabel component="legend">Tipo de asignación</FormLabel>
            <RadioGroup
              value={assignmentType}
              onChange={(e) => {
                setAssignmentType(e.target.value);
                setSelectedArea("");
                setSelectedSubarea("");
                setSelectedUser("");
                setUsersInArea([]);
              }}
            >
              <FormControlLabel
                value="area"
                control={<Radio />}
                label="Por área completa"
              />
              <FormControlLabel
                value="subarea"
                control={<Radio />}
                label="Por subárea"
              />
              <FormControlLabel
                value="individual"
                control={<Radio />}
                label="Por usuario individual"
              />
            </RadioGroup>
          </FormControl>

          {/* Selección de área */}
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Área</InputLabel>
            <Select
              value={selectedArea}
              onChange={(e) => handleAreaChange(e.target.value)}
              label="Área"
            >
              <MenuItem value="">Seleccione un área</MenuItem>
              {Object.keys(areasConSubareas).map((area) => (
                <MenuItem key={area} value={area}>
                  {area}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Selección de subárea (solo si el tipo es 'subarea' o 'individual') */}
          {(assignmentType === "subarea" || assignmentType === "individual") &&
            selectedArea &&
            areasConSubareas[selectedArea]?.length > 0 && (
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Subárea</InputLabel>
                <Select
                  value={selectedSubarea}
                  onChange={(e) => handleSubareaChange(e.target.value)}
                  label="Subárea"
                  disabled={!selectedArea}
                >
                  <MenuItem value="">
                    {assignmentType === "individual" ? "Todas las subáreas" : "Seleccione una subárea"}
                  </MenuItem>
                  {areasConSubareas[selectedArea]?.map((subarea) => (
                    <MenuItem key={subarea} value={subarea}>
                      {subarea}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}

          {/* Selección de usuario individual */}
          {assignmentType === "individual" && selectedArea && (
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Usuario</InputLabel>
              <Select
                value={selectedUser}
                onChange={(e) => setSelectedUser(e.target.value)}
                label="Usuario"
                disabled={!selectedArea}
              >
                <MenuItem value="">Seleccione un usuario</MenuItem>
                {usersInArea
                  .filter(user => !selectedSubarea || user.subarea === selectedSubarea)
                  .map((user) => (
                    <MenuItem key={user.id} value={user.id}>
                      {user.nombres} {user.apellidos} - {user.documento}
                    </MenuItem>
                  ))}
              </Select>
            </FormControl>
          )}

          {/* Selección de días (máximo 3) */}
          <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: "bold" }}>
            Seleccione los días presenciales (máximo 3):
          </Typography>
          <FormGroup sx={{ mb: 2 }}>
            {diasDisponibles.map((dia) => (
              <FormControlLabel
                key={dia.id}
                control={
                  <Checkbox
                    checked={selectedDays.includes(dia.nombre)}
                    onChange={() => handleDayToggle(dia.nombre)}
                  />
                }
                label={dia.nombre}
              />
            ))}
          </FormGroup>

          {/* Contador de días seleccionados */}
          <Typography variant="body2" color="textSecondary">
            Días seleccionados: {selectedDays.length}/3
          </Typography>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} color="error">
          Cancelar
        </Button>
        <Button
          onClick={handleSaveAssignment}
          variant="contained"
          color="success"
          disabled={selectedDays.length === 0}
        >
          Asignar Días
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AssignDaysModal;