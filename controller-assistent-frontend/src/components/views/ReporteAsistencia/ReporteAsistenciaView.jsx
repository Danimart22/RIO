import React, { useEffect, useState } from "react";
import { Button } from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import DownloadIcon from "@mui/icons-material/Download";
import { DatePicker } from "antd";
import dayjs from "dayjs";
import moment from "moment";
import Swal from "sweetalert2";
import oficinaMFSApi from "../../../api/oficinaMFSApi";
import ReporteAusencia from "../Modals/ReporteAsistenciaModals/reporteAusencia";
import "dayjs/locale/es";
import "moment/locale/es";
import "./ReporteAsistencia.css";

dayjs.locale("es");

export function ReporteAsistenciaView() {
    const [modalType, setModalType] = useState(null);
    const [reservas, setReservas] = useState([]);
    const [selectedDate, setSelectedDate] = useState(dayjs());

    const [loading, setLoading] = useState(true);
    const columns = [
        {
            field: "nombres",
            headerName: "Nombres",
            width: 180,
            valueGetter: (params) => params.row.usuario?.nombres ?? "",
        },
        {
            field: "apellidos",
            headerName: "Apellidos",
            width: 180,
            valueGetter: (params) => params.row.usuario?.apellidos ?? "",
        },
        {
            field: "correo",
            headerName: "Correo",
            width: 220,
            valueGetter: (params) => params.row.usuario?.correo ?? "",
        },
        {
            field: "fechaReserva",
            headerName: "Fecha",
            width: 180,
            valueGetter: (params) =>
                moment(params.value).format("DD [de] MMMM [del] YYYY"),
        },
        {
            field: "horaLlegada",
            headerName: "Hora de Llegada",
            width: 200,
            renderCell: (params) => (
                <ul className="time-list">
                    {(params.row.horaLlegada || []).map((hora, i) => (
                        <li key={i}>{hora}</li>
                    ))}
                </ul>
            ),
        },
        {
            field: "horaSalida",
            headerName: "Hora de Salida",
            width: 200,
            renderCell: (params) => (
                <ul className="time-list">
                    {(params.row.horaSalida || []).map((hora, i) => (
                        <li key={i}>{hora}</li>
                    ))}
                </ul>
            ),
        },
    ];
    const getReservas = async () => {
        try {
            setLoading(true);
            const formattedDate = selectedDate.format("YYYY-MM-DD");

            const response = await oficinaMFSApi.get(
                `/oficina/reservas/${formattedDate}`
            );

            const reservasData =
                response.data?.data?.reservas?.flatMap((oficina) =>
                    oficina.reservas.map((reserva) => ({
                        id: reserva._id,
                        ...reserva,
                        usuario: reserva.usuario || {},
                    }))
                ) || [];

            setReservas(reservasData);
        } catch (error) {
            Swal.fire(
                error.response?.data?.message || "Error al obtener las reservas"
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        getReservas();
    }, [selectedDate]);
const disabledDate = (current) => {
  if (!current) return false;

  // Deshabilita SOLO fechas futuras
  return current.isAfter(dayjs(), "day");
};

    return (
        <>
            {/* BOTONES DE REPORTE */}
            <div className="reporte-asistencia-toolbar">
                <div className="reporte-asistencia-actions">

                    <Button
                        onClick={() => setModalType("ausencia")}
                        startIcon={<DownloadIcon />}
                        variant="contained"
                        color="success"
                    >
                        Ausencias
                    </Button>
                </div>

                {/* SELECTOR DE FECHA */}
                <div className="reporte-asistencia-date">
                    <DatePicker
                        value={selectedDate}
                        onChange={(date) => setSelectedDate(date)}
                        format="YYYY/MM/DD"
                        picker="date"
                        allowClear={false}
                        disabledDate={disabledDate}
                    />
                </div>
            </div>
            {/* TABLA */}
            <div className="table-responsive" style={{ zIndex: 1, margin: "2%", height: "calc(100vh - 200px)", width: "100%" }}>
                <DataGrid
                    style={{ height: 450, width: "100%" }}
                    rows={reservas}
                    columns={columns}
                    loading={loading}
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
                        (row.usuario?._id && `user_${row.usuario._id}`)
                    }
                />

            </div>

            {/* MODALES */}
            <ReporteAusencia
                isOpen={modalType === "ausencia"}
                setShow={() => setModalType(null)}
            />
        </>
    );
}
