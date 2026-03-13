import { Fragment, useState, useEffect } from "react";
import { DataGrid } from "@mui/x-data-grid";
import Swal from "sweetalert2";
import { Button } from "@mui/material";
import oficinaMFSApi from "../../../api/oficinaMFSApi";
import moment from "moment";
import { DatePicker } from "antd";
import DownloadIcon from "@mui/icons-material/Download";
import EventSeatIcon from "@mui/icons-material/EventSeat";
import DeleteIcon from "@mui/icons-material/Delete";
import Skeleton from "@mui/material/Skeleton";
import DriveFolderUploadIcon from "@mui/icons-material/DriveFolderUpload";
import "moment/locale/es";
import "./oficina.css";
import ReporteRange from "../Modals/ReporteModals/reporteRange";
import ReserveMasive from "../Modals/ReserveModals/reserveMasive";
import Chip from "@mui/material/Chip";
import Radio from "@mui/material/Radio";
import RadioGroup from "@mui/material/RadioGroup";
import FormControlLabel from "@mui/material/FormControlLabel";
import FormControl from "@mui/material/FormControl";
import SeatsModal from "../Modals/SeatsModals/SeatsModal";
import dayjs from "dayjs";

export function OficinaViews() {
  const [reservas, setReservas] = useState([]);
  const [selectedDate, setSelectedDate] = useState(moment());
  const [asientosDisponibles, setAsientosDisponibles] = useState(80);
  const [showModal, setShowModal] = useState(false);
  const [showReserveModal, setShowReserveModal] = useState(false);
  const [showSeatsModal, setShowSeatsModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [valueRadioButton, setValueRadioButton] = useState("reservas");
  const [datesSilla, setDatesSilla] = useState([]);
  const [puestoSeleccionado, setPuestoSeleccionado] = useState(null);
  const [darkMode, setDarkMode] = useState(
    localStorage.getItem("darkMode") === "true"
  );

  const swalConfig = {
    background: darkMode ? "#212121" : "#FFFFFF",
    color: darkMode ? "white" : "black",
  };

  useEffect(() => {
    console.log("datesSilla cambió:", datesSilla);
  }, [datesSilla]);

  const [puestosGerentes, setPuestosGerente] = useState(13);
  const numGerentes = [19, 20, 23, 30, 33, 42, 45, 48, 53, 56, 61, 66, 78];

  const handleChange = (event) => {
    setValueRadioButton(event.target.value);
    setReservas([]);
  };

  const formatArray = (array) => (
    <div>
      {array.map((item, index) => (
        <Chip key={index} label={item} style={{ margin: "2px" }} />
      ))}
    </div>
  );

  const columns = [
    {
      field: "nombres",
      headerName: "Nombres",
      sortable: true,
      width: 160,
      valueGetter: (params) => params.row.usuario?.nombres ?? "",
    },
    {
      field: "apellidos",
      headerName: "Apellidos",
      sortable: true,
      width: 160,
      valueGetter: (params) => params.row.usuario?.apellidos ?? "",
    },
    {
      field: "correo",
      headerName: "Correo",
      sortable: true,
      width: 220,
      valueGetter: (params) => params.row.usuario?.correo ?? "",
    },
    {
      field: "enfermedades",
      headerName: "Patologías",
      width: 200,
      renderCell: (params) =>
        formatArray(params.row.usuario?.enfermedades ?? []),
    },
    {
      field: "alergias",
      headerName: "Alergias",
      width: 200,
      renderCell: (params) => formatArray(params.row.usuario?.alergias ?? []),
    },
    {
      field: "arl",
      headerName: "ARL",
      sortable: true,
      width: 160,
      valueGetter: (params) => params.row.usuario?.arl ?? "",
    },
    {
      field: "eps",
      headerName: "EPS",
      sortable: true,
      width: 160,
      valueGetter: (params) => params.row.usuario?.eps ?? "",
    },
    {
      field: "direccion",
      headerName: "Dirección",
      sortable: true,
      width: 140,
      valueGetter: (params) => params.row.usuario?.direccion ?? "",
    },
    {
      field: "acudiente",
      headerName: "Contacto de emergencia",
      sortable: true,
      width: 200,
      valueGetter: (params) => params.row.usuario?.acudiente ?? "",
    },
    {
      field: "tipo_acudiente",
      headerName: "Vinculo con el contacto de emergencia",
      sortable: true,
      width: 140,
      valueGetter: (params) => params.row.usuario?.tipo_acudiente ?? "",
    },
    {
      field: "numero_acudiente",
      headerName: "Número de contacto emergencia",
      sortable: true,
      width: 140,
      valueGetter: (params) => params.row.usuario?.numero_acudiente ?? "",
    },
    {
      field: "fechaReserva",
      headerName: "Fecha reservadas",
      sortable: true,
      width: 180,
      valueGetter: (params) =>
        moment(params.value).format("DD [de] MMMM [del] YYYY"),
    },
    {
      field: "numeroSilla",
      headerName: "Silla asignada",
      sortable: true,
      width: 140,
      align: "center",
    },
    {
      field: "horaLlegada",
      headerName: "Horas de Llegada",
      sortable: false,
      width: 180,
      renderCell: (params) => (
        <div className="oficina-cell-scroll">
          <ul className="time-list">
            {params.row.horaLlegada.map((hora, index) => (
              <li key={index}>{hora}</li>
            ))}
          </ul>
        </div>
      ),
    },
    {
      field: "horaSalida",
      headerName: "Horas de Salida",
      sortable: false,
      width: 180,
      renderCell: (params) => (
        <div className="oficina-cell-scroll">
          <ul className="time-list">
            {params.row.horaSalida.map((hora, index) => (
              <li key={index}>{hora}</li>
            ))}
          </ul>
        </div>
      ),
    },
    {
      field: "actions",
      headerName: "Acciones",
      width: 220,
      sortable: false,
      disableColumnMenu: true,
      renderCell: (params) => (
        <Button
          variant="contained"
          startIcon={<DeleteIcon />}
          color="error"
          onClick={() =>
            handleDeleteReserva(
              params.row.id,
              params.row.fechaReserva,
              params.row.usuario?.nombres,
              params.row.usuario?.apellidos
            )
          }
        >
          Eliminar
        </Button>
      ),
    },
  ];

  const columns2 = [
    {
      field: "nombres",
      headerAlign: "center",
      align: "center",
      headerName: "Nombres",
      sortable: true,
      width: 300,
      valueGetter: (params) => params.row?.nombres ?? "",
    },
    {
      field: "apellido",
      headerAlign: "center",
      align: "center",
      headerName: "Apellidos",
      sortable: true,
      width: 300,
      valueGetter: (params) => params.row?.apellido ?? "",
    },
    {
      field: "fechaReserva",
      headerAlign: "center",
      align: "center",
      headerName: "Fecha",
      sortable: true,
      width: 300,
      valueGetter: (params) =>
        params.row?.fechaReserva
          ? moment(params.row.fechaReserva).isValid()
            ? moment(params.row.fechaReserva).format("YYYY-MM-DD")
            : ""
          : "",
    },
    {
      field: "horaLlegada",
      headerName: "Horas de Llegada",
      sortable: false,
      headerAlign: "center",
      align: "center",
      width: 300,
      renderCell: (params) => (
        <div className="oficina-cell-scroll">
          <ul className="time-list">
            {params.row.horaLlegada.map((hora, index) => (
              <li key={index}>{hora}</li>
            ))}
          </ul>
        </div>
      ),
    },
    {
      headerAlign: "center",
      align: "center",
      field: "horaSalida",
      headerName: "Horas de Salida",
      sortable: false,
      width: 300,
      renderCell: (params) => (
        <div className="oficina-cell-scroll">
          <ul className="time-list">
            {params.row.horaSalida.map((hora, index) => (
              <li key={index}>{hora}</li>
            ))}
          </ul>
        </div>
      ),
    },
    {
      field: "actions",
      headerName: "Acciones",
      width: 220,
      sortable: false,
      disableColumnMenu: true,
      renderCell: (params) => {
        const puedeEliminar = moment(params.row.fechaReserva).isSameOrAfter(
          moment(),
          "day"
        );
        return puedeEliminar ? (
          <Button
            variant="contained"
            startIcon={<DeleteIcon />}
            color="error"
            onClick={() =>
              handleDeleteReserva(
                params.row.id,
                params.row.fechaReserva,
                params.row.usuario?.nombres,
                params.row.usuario?.apellidos
              )
            }
          >
            Eliminar
          </Button>
        ) : null;
      },
    },
  ];

  const handleOpenModal = () => setShowModal(true);
  const handleOpenReserveModal = () => setShowReserveModal(true);
  const handleOpenSeatsModal = () => setShowSeatsModal(true);

  const getReservas = async () => {
    try {
      setPuestosGerente(13);
      const formattedDate = selectedDate.format("YYYY-MM-DD");
      const response = await oficinaMFSApi.get(
        `/oficina/reservas/${formattedDate}`
      );
      const result = response.data;

      if (result?.data?.reservas && Array.isArray(result.data.reservas)) {
        const reservasData = result.data.reservas.flatMap((oficina) =>
          oficina.reservas.map((reserva) => ({
            id: reserva.id,
            ...reserva,
            usuario: reserva.usuario ?? {},
            enfermedades: reserva.enfermedades || [],
            alergias: reserva.alergias || [],
          }))
        );

        let puestosDisponibles = 81;
        reservasData.forEach((reserva) => {
          if (reserva.numeroSilla) puestosDisponibles--;
          if (numGerentes.includes(reserva.numeroSilla)) {
            setPuestosGerente((prev) => prev - 1);
          }
        });

        setReservas(reservasData);
        setAsientosDisponibles(puestosDisponibles);
        setLoading(false);
      } else {
        setReservas([]);
        setAsientosDisponibles(0);
        setLoading(false);
      }
    } catch (error) {
      Swal.fire(
        error.response?.data?.message || "Error al obtener las reservas"
      );
      setLoading(false);
    }
  };

  const getHistorialAsiento = async () => {
    try {
      const response = await oficinaMFSApi.get(
        `/oficina/reservasPuesto?fechaInicial=${datesSilla[0]}&fechaFinal=${datesSilla[1]}&numeroSilla=${puestoSeleccionado}`
      );
      setReservas(response.data);
    } catch (error) {
      Swal.fire(
        error.response?.data?.message || "Error al obtener las reservas"
      );
      setLoading(false);
    }
  };

  useEffect(() => {
    getReservas();
  }, [selectedDate]);

  const handleDeleteReserva = (reservaId, fechaReserva, nombres, apellidos) => {
    const fechaSinHora = fechaReserva.split("T")[0];
    Swal.fire({
      ...swalConfig,
      title: "¿Estás seguro?",
      html: `Se eliminará la reserva de <b>${nombres} ${apellidos}</b> del día <b>${moment(fechaReserva).format("DD [de] MMMM [del] YYYY")}</b>`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#FF0033",
      cancelButtonColor: "#29b6f6",
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar",
    }).then((result) => {
      if (result.isConfirmed) {
        oficinaMFSApi
          .delete(`/oficina/reserva/${reservaId}/${fechaSinHora}`)
          .then((response) => {
            if (response.status === 200) {
              setReservas((prev) =>
                prev.filter((reserva) => reserva.id !== reservaId)
              );
              Swal.fire({
                ...swalConfig,
                title: "Eliminado",
                html: `Se ha eliminado la reserva de <b>${nombres} ${apellidos}</b> del día <b>${moment(fechaReserva).format("DD [de] MMMM [del] YYYY")}</b>`,
                icon: "success",
              });
            }
          })
          .catch((error) => {
            Swal.fire({
              ...swalConfig,
              icon: "error",
              title: "Error al eliminar la reserva",
              text: error.response?.data?.message || "Error desconocido",
            });
          });
      }
    });
  };

  const toolbarRightClass = `oficina-toolbar-right ${
    valueRadioButton === "asientos"
      ? "oficina-toolbar-right--end"
      : "oficina-toolbar-right--between"
  }`;

  return (
    <Fragment>
      <div className="container">
        <div
          className="oficina-skeleton-container"
          style={{ display: loading ? "block" : "none" }}
        >
          <Skeleton variant="text" height={80} width={"35%"} />
          <div className="oficina-skeleton-buttons">
            <Skeleton
              variant="text"
              height={50}
              width={"27%"}
              className="oficina-skeleton-btn"
            />
            <Skeleton
              variant="text"
              height={50}
              width={"15%"}
              className="oficina-skeleton-btn"
            />
          </div>
          <Skeleton variant="rounded" height={450} />
        </div>

        <div style={{ display: loading ? "none" : "block" }}>
          <div>
            {valueRadioButton === "reservas" ? (
              <h1>
                Asientos Disponibles: {asientosDisponibles} (Asientos de
                Gerentes: {puestosGerentes})
              </h1>
            ) : valueRadioButton === "asientos" ? (
              puestoSeleccionado && (datesSilla || []).length > 0 ? (
                <>
                  <h2>Historial del puesto {puestoSeleccionado}</h2>
                  <h2>
                    {dayjs(datesSilla[0]).format("DD/MM/YYYY")} -{" "}
                    {dayjs(datesSilla[1]).format("DD/MM/YYYY")}
                  </h2>
                </>
              ) : (
                <h1>Selecciona un puesto para ver su historial</h1>
              )
            ) : null}
          </div>

          <div className="oficina-table-wrapper table-responsive">
            <div className="oficina-toolbar">
              <div className="oficina-toolbar-left">
                {valueRadioButton === "reservas" && (
                  <DatePicker
                    selected={selectedDate}
                    onChange={(date) => setSelectedDate(date)}
                    format="YYYY/MM/DD"
                    placeholder="Selecciona una fecha"
                    className="oficina-datepicker"
                  />
                )}
                <FormControl>
                  <RadioGroup
                    row
                    aria-labelledby="demo-row-radio-buttons-group-label"
                    name="row-radio-buttons-group"
                    defaultValue="reservas"
                  >
                    <FormControlLabel
                      onChange={handleChange}
                      value="reservas"
                      control={<Radio />}
                      label="Reservas"
                    />
                    <FormControlLabel
                      value="asientos"
                      onChange={handleChange}
                      control={<Radio />}
                      label="Asientos"
                    />
                  </RadioGroup>
                </FormControl>
              </div>

              <div className={toolbarRightClass}>
                {valueRadioButton === "reservas" ? (
                  <>
                    <Button
                      className="oficina-btn-import"
                      onClick={handleOpenReserveModal}
                      variant="contained"
                      startIcon={<DriveFolderUploadIcon />}
                    >
                      Importar asistencias
                    </Button>
                    <Button
                      onClick={handleOpenModal}
                      startIcon={<DownloadIcon />}
                      variant="contained"
                      color="success"
                    >
                      Generar Reporte
                    </Button>
                  </>
                ) : (
                  <Button
                    onClick={handleOpenSeatsModal}
                    startIcon={<EventSeatIcon />}
                    variant="contained"
                    className="oficina-btn-seats"
                  >
                    Seleccionar Asiento
                  </Button>
                )}
              </div>
            </div>

            <ReporteRange isOpen={showModal} setShow={setShowModal} />
            <div style={{ height: "calc(100vh - 200px)", width: "100%" }}>
            <DataGrid
              className="oficina-datagrid"
              rows={reservas}
              columns={
                valueRadioButton === "reservas"
                  ? columns
                  : valueRadioButton === "asientos"
                  ? columns2
                  : null
              }
              pageSize={5}
              rowsPerPageOptions={[5, 10, 20]}
              checkboxSelection
              getRowHeight={() => "auto"}
              getEstimatedRowHeight={() => 150}
              disableRowSelectionOnClick
              columnResizing
              minColumnWidth={100}
              maxColumnWidth={500}
              getRowId={(row) =>
                row.id ||
                row._id ||
                (row.usuario?._id && `user_${row.usuario._id}`) ||
                `${row.nombres}_${row.apellido}_${Math.random()
                  .toString(36)
                  .substr(2, 5)}`
              }
            />
            </div>
            <ReserveMasive isOpen={showReserveModal} setShow={setShowReserveModal} />
            <SeatsModal
              isOpen={showSeatsModal}
              setShow={setShowSeatsModal}
              darkMode={darkMode}
              setPuestoSeleccionado={setPuestoSeleccionado}
              puestoSeleccionado={puestoSeleccionado}
              setDatesSilla={setDatesSilla}
              datesSilla={datesSilla}
              getHistorialAsiento={getHistorialAsiento}
            />
          </div>
        </div>
      </div>
    </Fragment>
  );
}