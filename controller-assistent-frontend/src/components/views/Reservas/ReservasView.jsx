import { useState, useEffect } from "react";
import oficinaMFSApi from "../../../api/oficinaMFSApi";
import { DataGrid, useGridApiRef } from "@mui/x-data-grid";
import { Button } from "@mui/material";
import { Container } from "react-bootstrap";
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from "@mui/icons-material/DeleteOutlined";
import moment from "moment";
import "moment-timezone";
import Swal from "sweetalert2";
import "moment/locale/es";
import { dataDecrypt } from "../../../util";
import Skeleton from "@mui/material/Skeleton";
import { compareAsc } from "date-fns";
import './reservas.css';
import ModificarReserva from "../Modals/ReserveModals/modificarReserva";
import Icon from '@mdi/react';
import { mdiBriefcaseAccountOutline } from '@mdi/js';
import { getENV } from "../../../config/env";
import TodayIcon from "@mui/icons-material/Today";
import SkipNextIcon from "@mui/icons-material/SkipNext";

moment.tz.setDefault("America/Bogota");

export function ReservasView() {
  const [showModal, setShowModal] = useState(false);
  const [nombre, setNombre] = useState("");
  const [asiento, setAsiento] = useState("");
  const [loading, setLoading] = useState(true);
  const [filteredData, setFilteredData] = useState([]);
  const [sortModel, setSortModel] = useState([
    { field: "fechaReserva", sort: "desc" },
  ]);
  const [fechaReserva, setFechaReserva] = useState("");
  const [asientoReservado, setAsientoReservado] = useState("");
  const apiRef = useGridApiRef()

  useEffect(() => {
    const id = dataDecrypt(localStorage.getItem("id"));
    const nombreGuardado = dataDecrypt(localStorage.getItem("nombre"));

    if (id) {
      fetchData(id);
    }
    if (nombreGuardado) {
      setNombre(nombreGuardado);
    } else {
      setNombre("Nombre Predeterminado");
    }
  }, []);

  moment.locale("es");

  const fetchData = async (id) => {
    try {
      const response = await oficinaMFSApi.get(`/oficina/reserva/${id}`);
      const responseData = response.data.reservas.map((reserva) => {
        return {
          id: reserva.id,
          ...reserva,
          fechaReserva: moment.utc(reserva.fechaReserva).local().format(),
          _fechaOrden: moment.utc(reserva.fechaReserva).local().format("YYYY-MM-DD"),
        };
      });
      responseData.forEach(reserva => {
        if (moment.utc(reserva.fechaReserva).format("YYYY-MM-DD") === moment().tz("America/Bogota").format("YYYY-MM-DD")) {
          setAsiento(reserva.numeroSilla)
        };
      });
      setFilteredData(responseData);
      console.log(responseData)
      setLoading(false);
    } catch (error) {
      console.log(error);
      setLoading(false);
    }
  };

  const handleOpenModal = (fecha, silla) => {
    setAsientoReservado(silla);
    setFechaReserva(fecha);
    setShowModal(true);
  };

  const getRowId = (row) => row.id;

  const handleDeleteReserva = async (reservaId, fechaReserva, numeroSilla) => {
    try {
      const formattedFechaReserva = moment(fechaReserva).format("YYYY-MM-DD");

      const confirmResult = await Swal.fire({
        background: localStorage.getItem("darkMode") === "true" ? '#212121' : '#FFFFFF',
        color: localStorage.getItem("darkMode") === "true" ? 'white' : 'black',
        title: "¿Estás seguro?",
        html: `Esta acción eliminará la reserva para el día <b>${moment(formattedFechaReserva).format(
          "DD [de] MMMM [del] YYYY"
        )},</b> el asiento <b>N° ${numeroSilla}</b> quedará disponible para otro usuario. ¿Estás seguro que deseas continuar?`,
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#FF0033",
        cancelButtonColor: "#29b6f6",
        confirmButtonText: "Sí, eliminar",
        cancelButtonText: "Cancelar",
      });

      if (confirmResult.isConfirmed) {
        await oficinaMFSApi.delete(`/oficina/reserva/${reservaId}/${formattedFechaReserva}`);

        fetchData(dataDecrypt(localStorage.getItem("id")));

        Swal.fire({
          background: localStorage.getItem("darkMode") === "true" ? '#212121' : '#FFFFFF',
          color: localStorage.getItem("darkMode") === "true" ? 'white' : 'black',
          icon: "success",
          title: "Reserva eliminada",
          html: `La reserva para el día <b>${moment(formattedFechaReserva).format(
            "DD [de] MMMM [del] YYYY"
          )}</b> se ha eliminado y el asiento <b>N° ${numeroSilla}</b> ha sido liberado exitosamente.`,
        });
      }
    } catch (error) {
      console.log(error);

      Swal.fire({
        background: localStorage.getItem("darkMode") === "true" ? '#212121' : '#FFFFFF',
        color: localStorage.getItem("darkMode") === "true" ? 'white' : 'black',
        icon: "error",
        title: "Error al eliminar reserva",
        text: "Ha ocurrido un error al eliminar la reserva. Por favor, inténtalo nuevamente.",
      });
    }
  };

  const handleDeleteReservaVisitante = async (reservaId, fechaReserva, numeroSilla) => {
    try {
      const formattedFechaReserva = moment(fechaReserva).format("YYYY-MM-DD");

      const confirmResult = await Swal.fire({
        background: localStorage.getItem("darkMode") === "true" ? '#212121' : '#FFFFFF',
        color: localStorage.getItem("darkMode") === "true" ? 'white' : 'black',
        title: "¿Estás seguro?",
        html: `Esta acción eliminará la reserva de visitante para el día <b>${moment(formattedFechaReserva).format(
          "DD [de] MMMM [del] YYYY"
        )},</b> el asiento <b>N° ${numeroSilla}</b> quedará disponible para otro usuario. ¿Estás seguro que deseas continuar?`,
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#FF0033",
        cancelButtonColor: "#29b6f6",
        confirmButtonText: "Sí, eliminar",
        cancelButtonText: "Cancelar",
      });

      if (confirmResult.isConfirmed) {
        await oficinaMFSApi.delete(`/visitantes/${reservaId}/${formattedFechaReserva}`);

        fetchData(dataDecrypt(localStorage.getItem("id")));

        Swal.fire({
          background: localStorage.getItem("darkMode") === "true" ? '#212121' : '#FFFFFF',
          color: localStorage.getItem("darkMode") === "true" ? 'white' : 'black',
          icon: "success",
          title: "Reserva eliminada",
          html: `La reserva de visitante para el día <b>${moment(formattedFechaReserva).format(
            "DD [de] MMMM [del] YYYY"
          )}</b> se ha eliminado y el asiento <b>N° ${numeroSilla}</b> ha sido liberado exitosamente.`,
        });
      }
    } catch (error) {
      console.log(error);

      Swal.fire({
        background: localStorage.getItem("darkMode") === "true" ? '#212121' : '#FFFFFF',
        color: localStorage.getItem("darkMode") === "true" ? 'white' : 'black',
        icon: "error",
        title: "Error al eliminar reserva",
        text: "Ha ocurrido un error al eliminar la reserva. Por favor, inténtalo nuevamente.",
      });
    }
  };

  const handleSortModelChange = (newSortModel) => {
    setSortModel(newSortModel);
    if (newSortModel.length > 0) {
      const sortField = newSortModel[0].field;
      const sortDirection = newSortModel[0].sort;
      if (sortField === "_fechaOrden" && sortDirection) {
        const sortedData = [...filteredData].sort((a, b) => {
          const dateA = new Date(a._fechaOrden);
          const dateB = new Date(b._fechaOrden);
          return sortDirection === "asc"
            ? compareAsc(dateA, dateB)
            : compareAsc(dateB, dateA);
        });
        setFilteredData(sortedData);
      }
    }
  };
  const shouldDisableActions = (fechaReserva) => {
    const now = moment().tz("America/Bogota");
    const fecha = moment.utc(fechaReserva).tz("America/Bogota");

    const limiteHoy = moment.tz(
      moment().format("YYYY-MM-DD") + " " + getENV.HORA_LIMITE_RESERVA,
      "YYYY-MM-DD HH:mm",
      "America/Bogota"
    );

    // Días pasados → siempre deshabilitado
    if (fecha.isBefore(now, "day")) {
      return true;
    }

    // Hoy → depende de la hora
    if (fecha.isSame(now, "day")) {
      return now.isAfter(limiteHoy);
    }

    // Días futuros → permitido
    return false;
  };

  const UsuarioIcon = () => (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      height={20}
      width={20}
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M12 2c2.757 0 5 2.243 5 5.001 0 2.756-2.243 5-5 5s-5-2.244-5-5c0-2.758 2.243-5.001 5-5.001zm0-2c-3.866 0-7 3.134-7 7.001 0 3.865 3.134 7 7 7s7-3.135 7-7c0-3.867-3.134-7.001-7-7.001zm6.369 13.353c-.497.498-1.057.931-1.658 1.302 2.872 1.874 4.378 5.083 4.972 7.346h-19.387c.572-2.29 2.058-5.503 4.973-7.358-.603-.374-1.162-.811-1.658-1.312-4.258 3.072-5.611 8.506-5.611 10.669h24c0-2.142-1.44-7.557-5.631-10.647z" />
    </svg>
  );
  const scrollToRow = (rowId) => {
    apiRef.current.selectRow(rowId, true, true);

    // Usar el API interno del DataGrid para hacer scroll a la fila
    const rowIndex = apiRef.current.getRowIndexRelativeToVisibleRows(rowId);

    apiRef.current.scrollToIndexes({ rowIndex: rowIndex ?? 0 });

    // Después del scroll virtual, aplicar el highlight
    setTimeout(() => {
      const rowElement = document.querySelector(`[data-id="${rowId}"]`);
      if (rowElement) {
        rowElement.scrollIntoView({ behavior: "smooth", block: "center" });
        rowElement.style.outline = "2px solid #F45000";
        setTimeout(() => { rowElement.style.outline = ""; }, 2000);
      }
    }, 200);
  };

  const scrollToToday = () => {
    const today = moment().tz("America/Bogota").format("YYYY-MM-DD");
    const reservaHoy = filteredData.find(
      (r) => moment.utc(r.fechaReserva).tz("America/Bogota").format("YYYY-MM-DD") === today
    );

    if (!reservaHoy) {
      Swal.fire({
        background: localStorage.getItem("darkMode") === "true" ? '#212121' : '#FFFFFF',
        color: localStorage.getItem("darkMode") === "true" ? 'white' : 'black',
        icon: "info",
        title: "Sin reserva hoy",
        text: "No tienes ninguna reserva para el día de hoy.",
      });
      return;
    }

    scrollToRow(reservaHoy.id);
  };

  const scrollToNextReserva = () => {
    const now = moment().tz("America/Bogota");
    const futuras = filteredData
      .filter((r) => moment.utc(r.fechaReserva).tz("America/Bogota").isAfter(now, "day"))
      .sort((a, b) =>
        moment.utc(a.fechaReserva).valueOf() - moment.utc(b.fechaReserva).valueOf()
      );

    if (futuras.length === 0) {
      Swal.fire({
        background: localStorage.getItem("darkMode") === "true" ? '#212121' : '#FFFFFF',
        color: localStorage.getItem("darkMode") === "true" ? 'white' : 'black',
        icon: "info",
        title: "Sin próximas reservas",
        text: "No tienes reservas futuras programadas.",
      });
      return;
    }

    scrollToRow(futuras[0].id);
  };
  const VisitanteIcon = ({ size = 20 }) => (
    <Icon
      path={mdiBriefcaseAccountOutline}
      size={size / 19}
      color="currentColor"
    />
  );

  const columns = [
    {
      field: "tipo",
      headerAlign: 'center',
      align: 'center',
      headerName: "Tipo de Reserva",
      sortable: false,
      minWidth: 270,
      renderCell: (params) => {
        const tipo = params.value;

        if (tipo === "usuario") {
          return (
            <div title="Usuario">
              <UsuarioIcon />
            </div>
          );
        }

        if (tipo === "visitante") {
          return (
            <div title="Visitante">
              <VisitanteIcon />
            </div>
          );
        }

        return tipo;
      },
    },
    {
      field: "fechaReserva",
      headerAlign: 'center',
      align: 'center',
      headerName: "Fecha Reservada",
      sortable: true,
      minWidth: 270,
      valueFormatter: (params) =>
        moment(params.value).format("DD [de] MMMM [del] YYYY"),
    },
    {
      field: "numeroSilla",
      flex: 1,
      headerName: "Número de Silla",
      sortable: true,
      width: 170,
      align: "center",
      headerAlign: "center",
    },
    {
      field: "actions",
      headerName: "Acciones",
      headerAlign: "center",
      align: "center",
      width: 400,
      sortable: false,
      disableColumnMenu: true,
      renderCell: (params) => {
        const disableButtons = shouldDisableActions(params.row.fechaReserva);
        const tipoReserva = params.row.tipo;

        const handleDelete = () => {
          if (tipoReserva === "visitante") {
            handleDeleteReservaVisitante(
              params.row.id,
              params.row.fechaReserva,
              params.row.numeroSilla
            );
          } else {
            handleDeleteReserva(
              params.row.id,
              params.row.fechaReserva,
              params.row.numeroSilla
            );
          }
        };

        return (
          <>
            <Button
              onClick={() =>
                handleOpenModal(
                  params.row.fechaReserva,
                  params.row.numeroSilla
                )
              }
              variant="contained"
              color="primary"
              startIcon={<EditIcon />}
              disabled={disableButtons}
              style={{ margin: "5% 5%" }}
            >
              Modificar
            </Button>

            <Button
              onClick={handleDelete}
              variant="contained"
              color="error"
              startIcon={<DeleteIcon />}
              disabled={disableButtons}
              style={{ margin: "5% 0" }}
            >
              Eliminar
            </Button>
          </>
        );
      },
    },
    {
      field: "estado",
      headerName: "Estado",
      align: "center",
      width: 200,
      sortable: true,
      renderCell: (params) => {
        const estado = params.row.estado;
        switch (estado) {
          case "programado":
            return "Reserva de visitante programada";

          case "activo":
            return "Reserva activa";

          case "inactivo_por_tardanza":
            return "Reserva inactiva por tardanza";

          case "inactivo_por_ausencia":
            return "Reserva inactiva por ausencia";

          case "inactivo_visitante":
            return "Visita finalizada";
          case "finalizado":
            return "Reserva completada";

          default:
            return estado ?? "Sin estado";
        }
      }
    }
  ];
  return (
    <Container>
      <div width="100%" style={{ display: loading ? "block" : "none" }}>
        <Skeleton variant="text" height={80} width={"42%"} />
        <div style={{ display: "flex", gap: "10px" }}>
          <Skeleton variant="text" height={50} width={"10%"} />
        </div>
        <Skeleton variant="rounded" height={450} />
      </div>

      <div
        style={{
          height: 450,
          width: "100%",
          display: loading ? "none" : "block",
          margin: "1%",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h1>Reservas realizadas por {nombre}</h1>
          <div style={{ display: "flex", gap: "10px" }}>
            <Button
              variant="contained"
              onClick={scrollToToday}
              startIcon={<TodayIcon />}
              style={{ backgroundColor: "#05C3DD", color: "white" }}
            >
              Ir a hoy
            </Button>
            <Button
              variant="contained"
              onClick={scrollToNextReserva}
              startIcon={<SkipNextIcon />}
              style={{ backgroundColor: "#F45000", color: "white" }}
            >
              Ir a la proxima reserva
            </Button>
          </div>
        </div>
        <div className="container">
          <div style={{ height: "calc(100vh - 200px)", width: "100%" }}>
            <DataGrid
              apiRef={apiRef}
              rows={filteredData}
              columns={columns}
              getRowId={getRowId}
              pagination
              checkboxSelection
              getRowHeight={() => "auto"}
              getEstimatedRowHeight={() => 150}
              rowsPerPageOptions={[10, 20, 50]}
              disableSelectionOnClick
              sortModel={sortModel}
              onSortModelChange={handleSortModelChange}
              sx={{
                '& .MuiDataGrid-cell': {
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  padding: 0
                },
              }}
            />

            <ModificarReserva
              isOpen={showModal}
              setShow={setShowModal}
              fechaReserva={fechaReserva}
              asientoReservado={asientoReservado}
              fetchData={fetchData}
            />
          </div>
        </div>
      </div>
    </Container>
  );
}