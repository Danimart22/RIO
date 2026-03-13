import { useState, useEffect } from "react";
import "react-datepicker/dist/react-datepicker.css";
import { DatePicker } from "antd";
import { Button } from "@mui/material";
import DownloadIcon from "@mui/icons-material/Download";
import CancelIcon from "@mui/icons-material/Cancel";
import moment from "moment";
import Swal from "sweetalert2";
import { saveAs } from "file-saver";
import oficinaMFSApi from "../../../../api/oficinaMFSApi";
import * as XLSX from "xlsx";
import CloseIcon from "@mui/icons-material/Close";
import dayjs from "dayjs";


const { RangePicker } = DatePicker;

export default function ReporteTarde({ isOpen, setShow }) {
  const yesterday = dayjs().subtract(1, "day");

  const [selectedDates, setSelectedDates] = useState([
    yesterday.startOf("day"),
    yesterday.endOf("day"),
  ]);

    const [darkMode, setDarkMode] = useState(
        localStorage.getItem("darkMode") === "true"
    );

    useEffect(() => {
        const handleStorageChange = () => {
            setDarkMode(localStorage.getItem("darkMode") === "true");
        };
        window.addEventListener("storage", handleStorageChange);
        return () => window.removeEventListener("storage", handleStorageChange);
    }, []);
    const handleConfirm = async () => {
        try {
            const fechaInicial = selectedDates[0].format("YYYY-MM-DD");
            const fechaFinal = selectedDates[1].format("YYYY-MM-DD");


            const response = await oficinaMFSApi.get(
                "/oficina/reservasTardes",
                {
                    params: {
                        fechaInicial,
                        fechaFinal,
                    },
                }
            );

            const reservas = response.data.data;

            const excelData = reservas.map((r) => ({
                Nombres: r.nombres,
                Apellidos: r.apellidos,
                Documento: r.documento,
                "Fecha de la Reserva": moment(r.fecha_reserva).format(
                    "DD [de] MMMM [del] YYYY"
                ),
                "Silla reservada": r.numero_silla ?? "—",
                "Hora de Llegada": `Llegó tarde (${r.hora_llegada[0]})`,
                "Hora de Salida":
                    r.hora_salida && r.hora_salida.length > 0
                        ? r.hora_salida[r.hora_salida.length - 1]
                        : "",
            }));

            const workbook = XLSX.utils.book_new();
            const worksheet = XLSX.utils.json_to_sheet(excelData);

            worksheet["!cols"] = [
                { wch: 18 },
                { wch: 18 },
                { wch: 15 },
                { wch: 25 },
                { wch: 18 },
                { wch: 40 },
                { wch: 20 },
            ];

            XLSX.utils.book_append_sheet(workbook, worksheet, "Llegadas Tarde");

            const wbout = XLSX.write(workbook, {
                bookType: "xlsx",
                type: "array",
            });

            saveAs(
                new Blob([wbout], { type: "application/octet-stream" }),
                `Reporte-Llegadas-Tarde-${fechaInicial}-${fechaFinal}.xlsx`
            );

            setShow(false);
        } catch (error) {
            console.error("Error al generar reporte:", error);
            Swal.fire(
                error.response?.data?.message || "Error al generar el reporte"
            );
        }
    };

    const handleClose = () => {
        setShow(false);
    };
      const disabledDate = (current) => {
    if (!current) return false;

    // Deshabilita hoy y cualquier fecha futura
    return current.isSame(dayjs(), "day") || current.isAfter(dayjs(), "day");
  };

    return (
        <div
            className={`modal ${isOpen ? "show" : ""} ${darkMode ? "bootstrap-darkmode" : ""
                }`}
            tabIndex="-1"
            role="dialog"
            style={{ display: isOpen ? "block" : "none", zIndex: 1000 }}
        >
            <div className="modal-dialog" role="document">
                <div className="modal-content">
                    <div className="modal-header">
                        <h5 className="modal-title">Reporte de Llegadas Tarde</h5>
                        <button
                            type="button"
                            style={{ backgroundColor: "transparent", border: "none" }}
                            className="close"
                            onClick={handleClose}
                        >
                            <CloseIcon sx={{ color: darkMode ? "white" : "black" }} />
                        </button>
                    </div>

                    <div className="modal-body">
                        <label>Rango de fechas:</label>
                        <RangePicker
                            value={selectedDates}
                            onChange={(dates) => setSelectedDates(dates)}
                            format="YYYY/MM/DD"
                            placeholder={["Fecha de inicio", "Fecha de fin"]}
                            allowClear={false}
                            disabledDate={disabledDate}
                        />
                    </div>

                  <div className="modal-footer" style={{ justifyContent: "center", display: "flex", gap:"16px" }}>
                        <Button
                            variant="contained"
                            color="error"
                            onClick={handleClose}
                            startIcon={<CancelIcon />}
                            style={{ marginRight: "1%" }}
                        >
                            Cerrar
                        </Button>

                        <Button
                            variant="contained"
                            color="success"
                            onClick={handleConfirm}
                            startIcon={<DownloadIcon />}
                            style={{ marginLeft: "1%" }}
                        >
                            Descargar
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
