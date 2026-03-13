import { useState, useEffect } from "react";
import { Button, TextField, Grid, MenuItem } from "@mui/material";
import oficinaMFSApi from "../../../../api/oficinaMFSApi";
import SaveAltIcon from "@mui/icons-material/SaveAlt";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import Swal from "sweetalert2";
import { Modal } from "antd";
import { DatePicker } from "antd";
const { RangePicker } = DatePicker;

export default function ReserveReemplazo({ isOpen, setShow }) {
  const [selectedReemplazante, setSelectedReemplazante] = useState();
  const [reemplazanteData, setReemplazanteData] = useState([]);
  const [selectedUsuario, setSelectedUsuario] = useState();
  const [responsables, setResponsables] = useState([]);
  const [showForm1, setShowForm1] = useState(true);

  // Estado para almacenar el rango de fechas seleccionado
  const [dateRange, setDateRange] = useState([]);

  useEffect(() => {
    const fetchReemplazos = async () => {
      try {
        const response = await oficinaMFSApi.get("/reemplazo/");
        const data = response.data;
        setReemplazanteData(data);
      } catch (error) {
        console.error("Error buscando reemplazos:", error);
      }
    };

    const fetchResponsables = async () => {
      try {
        const response = await oficinaMFSApi.get("/users/responsables");
        const data = response.data;
        setResponsables(data);
      } catch (error) {
        console.error("Error fetching responsables:", error);
      }
    };

    if (isOpen) {
      fetchReemplazos();
      fetchResponsables();
    }
  }, [isOpen]);

  const handleSave = async () => {
    if (!selectedUsuario || !selectedReemplazante || !dateRange || dateRange.length !== 2) {
      Swal.fire({
          background: localStorage.getItem("darkMode")==="true"?'#212121':'#FFFFFF',
          color: localStorage.getItem("darkMode")==="true"?'white':'black',
        icon: "error",
        title: "Error",
        text: "Debe seleccionar un usuario, un reemplazo y un rango de fechas antes de continuar.",
      });
      return;
    }

    const desde = dateRange[0].format("YYYY-MM-DD");
    const hasta = dateRange[1].format("YYYY-MM-DD");

    const data = {
      usuarioId: selectedUsuario.id,
      reemplazoId: selectedReemplazante.id,
      desde: desde,
      hasta: hasta,
    };

    try {
      const response = await oficinaMFSApi.post(
        "/reemplazo/asignarReemplazo",
        data
      );

      if (response.status === 200) {
        Swal.fire({
          background: localStorage.getItem("darkMode")==="true"?'#212121':'#FFFFFF',
          color: localStorage.getItem("darkMode")==="true"?'white':'black',
          icon: "success",
          title: "¡Reemplazo asignado!",
          text: "El reemplazo ha sido asignado correctamente.",
        });
        setShow(false);
        setSelectedUsuario(null);
        setSelectedReemplazante(null);
        setDateRange([]);
        setShowForm1(true);
      } else {
        Swal.fire({
          background: localStorage.getItem("darkMode")==="true"?'#212121':'#FFFFFF',
          color: localStorage.getItem("darkMode")==="true"?'white':'black',
          icon: "error",
          title: "Error",
          text: "Ha ocurrido un error al asignar el reemplazo. Por favor, inténtelo de nuevo.",
        });
      }
    } catch (error) {
      console.error("Error al asignar reemplazo:", error);
      Swal.fire({
          background: localStorage.getItem("darkMode")==="true"?'#212121':'#FFFFFF',
          color: localStorage.getItem("darkMode")==="true"?'white':'black',
        icon: "error",
        title: "Error",
        text:
          error.response?.data?.message ||
          "Ha ocurrido un error al asignar el reemplazo. Por favor, inténtelo de nuevo.",
      });
    }
  };

  const handleForm1Submit = (event) => {
    if (!selectedReemplazante) {
      event.preventDefault();
      Swal.fire({
          background: localStorage.getItem("darkMode")==="true"?'#212121':'#FFFFFF',
          color: localStorage.getItem("darkMode")==="true"?'white':'black',
        icon: "error",
        title: "Error",
        text: "Debe seleccionar un reemplazo antes de continuar.",
      });
    } else {
      setShowForm1(false);
    }
  };

  const handleForm2Submit = (event) => {
    event.preventDefault();
    handleSave();
  };

  const handleClose = () => {
    setShow(false);
  };

  return (
    <Modal
      visible={isOpen}
      onCancel={handleClose}
      footer={null}
      title={showForm1 ? "Seleccionar Reemplazo" : "Asignar Reemplazo"}
      style={{ width: 600, maxHeight: "80vh" }}
    >
      <form>
        {showForm1 ? (
          <>
            <TextField
              label="Seleccione un Empleado para reemplazar"
              select
              value={selectedUsuario ? selectedUsuario.id : ""}
              onChange={(e) => {
                const selectedResponsable = responsables.find(
                  (responsable) => responsable.id === e.target.value
                );
                setSelectedUsuario(selectedResponsable);
              }}
              fullWidth
              variant="outlined"
              margin="normal"
            >
              {responsables.map((responsable) => (
                <MenuItem key={responsable.id} value={responsable.id}>
                  {`${responsable.nombres} ${responsable.apellidos}`}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              label="Seleccione un reemplazo"
              select
              value={selectedReemplazante ? selectedReemplazante.id : ""}
              onChange={(e) => {
                const selectedReemplazo = reemplazanteData.find(
                  (reemplazo) => reemplazo.id === e.target.value
                );
                setSelectedReemplazante(selectedReemplazo);
              }}
              fullWidth
              variant="outlined"
              margin="normal"
            >
              {reemplazanteData.map((reemplazo) => (
                <MenuItem key={reemplazo.id} value={reemplazo.id}>
                  {`${reemplazo.nombres} ${reemplazo.apellidos}`}
                </MenuItem>
              ))}
            </TextField>
            <Button
              onClick={handleForm1Submit}
              startIcon={<ArrowForwardIcon />}
              variant="contained"
              color="primary"
            >
              Continuar
            </Button>
          </>
        ) : (
          <>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <RangePicker
                  value={dateRange}
                  onChange={(dates) => setDateRange
                    (dates)}
                    format="YYYY-MM-DD"
                    style={{ width: "100%", marginBottom: "16px" }}
                    placeholder={["Desde", "Hasta"]}
                  />
                </Grid>
              </Grid>
              <div
                style={{
                  margin: "2%",
                  display: "flex",
                  justifyContent: "center",
                }}
              >
                <Button
                  onClick={() => setShowForm1(true)}
                  startIcon={<ArrowBackIcon />}
                  variant="contained"
                  color="primary"
                  style={{ marginRight: "2%" }}
                >
                  Volver atrás
                </Button>
  
                <Button
                  onClick={handleForm2Submit}
                  startIcon={<SaveAltIcon />}
                  variant="contained"
                  color="success"
                  style={{ marginLeft: "2%" }}
                >
                  Guardar reserva
                </Button>
              </div>
            </>
          )}
        </form>
      </Modal>
    );
  }
  