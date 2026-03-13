import { Fragment, useState, useEffect } from "react";
import { DataGrid } from "@mui/x-data-grid";
import Swal from "sweetalert2";
import { Button } from "@mui/material";
import oficinaMFSApi from "../../../api/oficinaMFSApi";
import moment from "moment";
import { DatePicker } from "antd";
import DeleteIcon from "@mui/icons-material/Delete";
import Skeleton from "@mui/material/Skeleton";
import Tooltip from "@mui/material/Tooltip";
import "moment/locale/es";
import ReporteRange from "../Modals/ReporteModals/reporteRange";
import Chip from "@mui/material/Chip";

export function AsistenciasVisitantesView() {
  const [reservas, setReservas] = useState([]);
  const [selectedDate, setSelectedDate] = useState(moment());
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);



  const formatArray = (array) => {
    return (
      <div>
        {array.map((item, index) => (
          <Chip key={index} label={item} style={{ margin: "2px" }} />
        ))}
      </div>
    );
  };

  const columns = [
    {
      field: "nombres",
      headerName: "Nombres",
      sortable: true,
      width: 160,
      valueGetter: (params) => params.row.nombres ?? "",
    },
    {
      field: "apellidos",
      headerName: "Apellidos",
      sortable: true,
      width: 160,
      valueGetter: (params) => params.row.apellidos ?? "",
    },
    {
      field: "sangre",
      headerName: "Tipo de sangre",
      width: 150,
      valueGetter: (params) => params.row.sangre ?? "",
    },
    {
      field: "enfermedades",
      headerName: "Enfermedades",
      width: 200,
      renderCell: (params) => (
        <div style={{ maxHeight: "100px", overflowY: "auto" }}>
          {formatArray(params.row.enfermedades)}
        </div>
      ),
    },
    {
      field: "alergias",
      headerName: "Alergias",
      width: 200,
      renderCell: (params) => (
        <Tooltip title={formatArray(params.row.alergias)} arrow>
          <div>{formatArray(params.row.alergias)}</div>
        </Tooltip>
      ),
    },
    {
      field: "arl",
      headerName: "ARL",
      sortable: true,
      width: 180,
      valueGetter: (params) => params.row.arl ?? "",
    },
    {
      field: "eps",
      headerName: "EPS",
      sortable: true,
      width: 180,
      valueGetter: (params) => params.row.eps ?? "",
    },
    {
      field: "responsable_mobilize",
      headerName: "Responsable",
      sortable: true,
      width: 200,
      valueGetter: (params) =>
        params.row.fechas_reserva[0]?.responsable_mobilize ?? "",
    },
    {
      field: "motivo",
      headerName: "Motivo",
      sortable: true,
      width: 160,
      renderCell: (params) => (
        <Tooltip title={params.row.fechas_reserva[0]?.motivo} arrow>
          <div>{params.row.fechas_reserva[0]?.motivo}</div>
        </Tooltip>
      ),
    },
    {
      field: "acudiente_reserva",
      headerName: "Acudiente",
      sortable: true,
      width: 160,
      valueGetter: (params) => params.row.fechas_reserva[0]?.acudiente ?? "",
    },
    {
      field: "tipo_acudiente_reserva",
      headerName: "Tipo de Acudiente",
      sortable: true,
      width: 140,
      valueGetter: (params) =>
        params.row.fechas_reserva[0]?.tipo_acudiente ?? "",
    },
    {
      field: "numero_acudiente_reserva",
      headerName: "Número de Acudiente",
      sortable: true,
      width: 150,
      valueGetter: (params) =>
        params.row.fechas_reserva[0]?.numero_acudiente ?? "",
    },
    {
      field: "fechaReserva",
      headerName: "Fecha Reserva",
      sortable: true,
      width: 180,
      valueGetter: (params) => {
        const fechaReserva = params.row.fechas_reserva[0]?.fechaReserva || "";
        return moment.utc(fechaReserva).format("DD [de] MMMM [del] YYYY");
      },
    },
    {
      field: "actions",
      headerName: "Acciones",
      width: 220,
      sortable: false,
      disableColumnMenu: true,
      renderCell: (params) => (
        <>
          {/* <Button
            variant="contained"
            startIcon={<EditIcon />}
            color="primary"
            style={{ marginRight: "10px" }}
          >
            Editar
          </Button> */}
          <Button
            variant="contained"
            startIcon={<DeleteIcon />}
            color="error"
            onClick={() => handleDeleteReserva(
              params.row.visitante_id,
              params.row.fechas_reserva[0]?.fechaReserva,
              params.row.nombres,
              params.row.apellidos
            )}
          >
            Eliminar
          </Button>
        </>
      ),
    },
  ];

  // const handleOpenModal = () => {
  //   setShowModal(true);
  // };

  //

  const handleDeleteReserva = async (visitanteId, fechaReserva, nombres, apellidos) => {
    try {
      const confirmResult = await Swal.fire({
        background: localStorage.getItem("darkMode") === "true" ? "#212121" : "#FFFFFF",
        color: localStorage.getItem("darkMode") === "true" ? "white" : "black",
        title: "¿Estás seguro?",
        html: `Esta acción eliminará la reserva del visitante <b>${nombres} ${apellidos}</b> para el día <b>${moment(fechaReserva).format(
          "DD [de] MMMM [del] YYYY"
        )}</b>.`,
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#FF0033",
        cancelButtonColor: "#29b6f6",
        confirmButtonText: "Sí, eliminar",
        cancelButtonText: "Cancelar",
      });

      if (!confirmResult.isConfirmed) return;

      await oficinaMFSApi.delete(
        `/visitantes/borrar/${visitanteId}/${moment(fechaReserva).format("YYYY-MM-DD")}`
      );
      const updatedReservas = reservas.filter(
        (reserva) =>
          !(
            reserva.visitante_id === visitanteId &&
            moment(reserva.fechas_reserva[0]?.fechaReserva).isSame(fechaReserva, "day")
          )
      );

      setReservas(updatedReservas);

      Swal.fire({
        icon: "success",
        title: "Reserva eliminada",
        html: `La reserva del visitante <b>${nombres} ${apellidos}</b> ha sido eliminada.`,
      });
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Error al eliminar reserva",
        text: error.response?.data?.message || "Error inesperado",
      });
    }
  };



  useEffect(() => {
    const getReservas = async () => {
      try {
        const formattedDate = selectedDate.format("YYYY-MM-DD");
        const response = await oficinaMFSApi.get(
          `/oficina/reservasVisitantes/${formattedDate}`
        );
        const result = response.data;

        if (
          result &&
          result.data &&
          result.data.reservas &&
          Array.isArray(result.data.reservas)
        ) {
          const reservasData = result.data.reservas.map((reserva) => ({
            id: reserva.id,
            visitante_id: reserva.visitante_id,
            ...reserva,
            fechas_reserva: [reserva.fechas_reserva[0]],
          }));
          setReservas(reservasData);
          // setAsientosDisponibles(
          //   result.data.asientosDisponibles.asientosDisponibles
          // );
          setLoading(false);
        } else {
          setReservas([]);
          // setAsientosDisponibles(0);
          setLoading(false);
        }
      } catch (error) {
        Swal.fire(
          error.response?.data?.message || "Error al obtener las reservas"
        );
        setLoading(false);
      }
    };
    getReservas();
  }, [selectedDate]);


  return (
    <Fragment>
      <div className="container">
        <div
          style={{ display: loading ? "block" : "none", marginTop: "20px" }}
        >
          <Skeleton variant="text" height={80} width={"35%"} />
          <div style={{ display: "flex", gap: "55%" }}>
            <Skeleton
              variant="text"
              height={50}
              width={"27%"}
              style={{ marginLeft: "2%" }}
            />
            <Skeleton
              variant="text"
              height={50}
              width={"15%"}
              style={{ marginLeft: "2%" }}
            />
          </div>
          <Skeleton variant="rounded" height={450} />
        </div>

        <div style={{ display: loading ? "none" : "block" }}>
          {/* <div>
            <h1>Asientos Disponibles: {asientosDisponibles}</h1>
          </div> */}
          <div className="table-responsive" style={{ zIndex: 1, margin: "2%" }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: "1%",
              }}
            >
              <DatePicker
                selected={selectedDate}
                onChange={(date) => setSelectedDate(date)}
                format="YYYY/MM/DD"
                placeholder="Selecciona una fecha"
                style={{ width: 300, margin: "2%" }}
              />

              {/* <Button
                style={{ marginTop: "2%", marginBottom: "2%" }}
                onClick={handleOpenModal}
                startIcon={<DownloadIcon />}
                variant="contained"
                color="success"
              >
                Generar Reporte
              </Button> */}
            </div>
            <ReporteRange isOpen={showModal} setShow={setShowModal} />
            <div style={{ height: "calc(100vh - 200px)", width: "100%" }}>
            <DataGrid
              rows={reservas}
              columns={columns}
              pageSize={5}
              rowsPerPageOptions={[5, 10, 20]}
              checkboxSelection
              getRowHeight={() => "auto"}
              disableRowSelectionOnClick
              columnResizing
              minColumnWidth={100}
              maxColumnWidth={500}
            />
            </div>
          </div>
        </div>
      </div>
    </Fragment>
  );
}
