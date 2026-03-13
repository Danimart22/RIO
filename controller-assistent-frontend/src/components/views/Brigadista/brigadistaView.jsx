import { Fragment, useState, useEffect } from "react";
import { DataGrid } from "@mui/x-data-grid";
import Swal from "sweetalert2";
import { Button } from "@mui/material";
import oficinaMFSApi from "../../../api/oficinaMFSApi";
import DownloadIcon from "@mui/icons-material/Download";
import moment from "moment";
import { DatePicker } from "antd";
import { saveAs } from "file-saver";
import Skeleton from "@mui/material/Skeleton";
import * as XLSX from "xlsx";
import "moment/locale/es";
import "./BrigadistaView.css";

export function BrigadistaView() {
  const [reservas, setReservas] = useState([]);
  const [selectedDate, setSelectedDate] = useState(moment());
  const [asientosDisponibles, setAsientosDisponibles] = useState(80);
  const [loading, setLoading] = useState(true);

  const columns = [
    {
      field: "tipo_documento",
      headerName: "Tipo de documento",
      sortable: true,
      width: 140,
      valueGetter: (params) => params.row.usuario?.tipo_documento ?? "",
    },
    {
      field: "documento",
      headerName: "Documento",
      sortable: true,
      width: 140,
      valueGetter: (params) => params.row.usuario?.documento ?? "",
    },
    {
      field: "nombres",
      headerName: "Nombres",
      sortable: true,
      width: 140,
      valueGetter: (params) => params.row.usuario?.nombres ?? "",
    },
    {
      field: "apellidos",
      headerName: "Apellidos",
      sortable: true,
      width: 140,
      valueGetter: (params) => params.row.usuario?.apellidos ?? "",
    },
    {
      field: "telefono",
      headerName: "Telefono",
      sortable: true,
      width: 140,
      valueGetter: (params) => params.row.usuario?.telefono ?? "",
    },
    {
      field: "correo",
      headerName: "Correo",
      sortable: true,
      width: 230,
      valueGetter: (params) => params.row.usuario?.correo ?? "",
    },
    {
      field: "brigadista",
      headerName: "Brigadista",
      sortable: true,
      width: 95,
      valueGetter: (params) => params.row.usuario?.brigadista ?? "",
    },
    {
      field: "arl",
      headerName: "ARL",
      sortable: true,
      width: 170,
      valueGetter: (params) => params.row.usuario?.arl ?? "",
    },
    {
      field: "eps",
      headerName: "EPS",
      sortable: true,
      width: 170,
      valueGetter: (params) => params.row.usuario?.eps ?? "",
    },
    {
      field: "acudiente",
      headerName: "Contacto de emergencia",
      sortable: true,
      width: 140,
      valueGetter: (params) => params.row.usuario?.acudiente ?? "",
    },
    {
      field: "tipo_acudiente",
      headerName: "Vinculo con el contacto de emergencia",
      sortable: true,
      width: 160,
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
        <div className="brigadista-cell-scroll">
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
        <div className="brigadista-cell-scroll">
          <ul className="time-list">
            {params.row.horaSalida.map((hora, index) => (
              <li key={index}>{hora}</li>
            ))}
          </ul>
        </div>
      ),
    },
  ];

  const handleExport = async () => {
    try {
      const formattedDate = selectedDate.format("YYYY-MM-DD");
      const response = await oficinaMFSApi.get(
        `/oficina/reservasPorteria/${formattedDate}`
      );
      const data = response.data;

      const excelData = data.data.reservas.flatMap((oficina) =>
        oficina.reservas.map((reserva) => ({
          "Tipo de Documento": reserva.usuario.tipo_documento,
          Documento: reserva.usuario.documento,
          Nombres: reserva.usuario.nombres,
          Apellidos: reserva.usuario.apellidos,
          Telefono: reserva.usuario.telefono,
          Brigadista: reserva.usuario.brigadista,
          ARL: reserva.usuario.arl,
          EPS: reserva.usuario.eps,
          "Contacto de emergencia": reserva.usuario.acudiente,
          "Relacion contacto de emergencia": reserva.usuario.tipo_acudiente,
          "Número de contacto emergencia": reserva.usuario.numero_acudiente,
          "Fecha de Reserva": moment.utc(reserva.fechaReserva).format("DD [de] MMMM [del] YYYY"),
          "Hora de Llegada":
            reserva.horaLlegada.length > 0
              ? reserva.horaLlegada.join(", ")
              : reserva.horaSalida.length > 0
              ? ""
              : "Reservó pero NO asistió",
          "Hora de Salida":
            reserva.horaSalida.length > 0
              ? reserva.horaSalida.join(", ")
              : reserva.horaLlegada.length > 0
              ? ""
              : "Reservó pero NO asistió",
        }))
      );

      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.json_to_sheet(excelData);

      const columnWidths = [
        { width: 18 }, { width: 15 }, { width: 18 }, { width: 18 },
        { width: 18 }, { width: 15 }, { width: 20 }, { width: 20 },
        { width: 25 }, { width: 25 }, { width: 25 }, { width: 20 },
        { width: 60 }, { width: 60 },
      ];
      worksheet["!cols"] = columnWidths.map((col) => ({ wch: col.width }));

      const range = XLSX.utils.decode_range(worksheet["!ref"]);
      for (let col = range.s.c; col <= range.e.c; col++) {
        for (let row = range.s.r + 1; row <= range.e.r; row++) {
          const cellRef = XLSX.utils.encode_cell({ r: row, c: col });
          const cell = worksheet[cellRef];
          if (cell && cell.t === "s") {
            cell.s = { alignment: { horizontal: "center" } };
          }
        }
      }

      XLSX.utils.book_append_sheet(workbook, worksheet, "Reservas");

      const wbout = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
      const blob = new Blob([wbout], { type: "application/octet-stream" });
      saveAs(blob, `Reporte_reserva_${formattedDate}.xlsx`);
    } catch (error) {
      console.error("Error al exportar a Excel:", error);
      Swal.fire("Error al exportar a Excel");
    }
  };

  useEffect(() => {
    const getReservas = async () => {
      try {
        const formattedDate = selectedDate.format("YYYY-MM-DD");
        const response = await oficinaMFSApi.get(
          `/oficina/reservasBrigadista/${formattedDate}`
        );
        const result = response.data;

        if (
          result?.data?.reservas &&
          Array.isArray(result.data.reservas)
        ) {
          const reservasData = result.data.reservas.flatMap((oficina) =>
            oficina.reservas.map((reserva) => ({
              id: reserva._id,
              ...reserva,
              usuario: reserva.usuario ?? {},
            }))
          );
          setReservas(reservasData);
          setAsientosDisponibles(
            result.data.asientosDisponibles.asientosDisponibles
          );
          setLoading(false);
        } else {
          setReservas([]);
          setAsientosDisponibles(0);
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
        <div className="brigadista-skeleton-container" style={{ display: loading ? "block" : "none" }}>
          <Skeleton variant="text" height={80} width={"35%"} />
          <div className="brigadista-skeleton-buttons">
            <Skeleton variant="text" height={50} width={"27%"} className="brigadista-skeleton-btn-left" />
            <Skeleton variant="text" height={50} width={"15%"} className="brigadista-skeleton-btn-left" />
          </div>
          <Skeleton variant="rounded" height={450} />
        </div>

        <div style={{ display: loading ? "none" : "block" }}>
          <div>
            <h1>Asientos Disponibles: {asientosDisponibles}</h1>
          </div>
          <div className="brigadista-table-wrapper table-responsive">
            <div className="brigadista-toolbar">
              <DatePicker
                selected={selectedDate}
                onChange={(date) => setSelectedDate(date)}
                dateFormat="YYYY/MM/DD"
                placeholder="Selecciona una fecha"
                className="brigadista-datepicker"
              />
              <Button
                className="brigadista-export-button"
                startIcon={<DownloadIcon />}
                variant="contained"
                color="success"
                onClick={handleExport}
              >
                descargar
              </Button>
            </div>
            <div style={{ height: "calc(100vh - 200px)", width: "100%" }}>
            <DataGrid
              className="brigadista-datagrid"
              rows={reservas}
              columns={columns}
              pageSize={5}
              rowsPerPageOptions={[5, 10, 20]}
              checkboxSelection
              disableRowSelectionOnClick
              getRowHeight={() => "auto"}
              getEstimatedRowHeight={() => 150}
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