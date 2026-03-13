import { useState, useEffect } from "react";
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

export default function ReporteAusencia({ isOpen, setShow }) {
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
        "/oficina/reservasAusencias",
        {
          params: { fechaInicial, fechaFinal },
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
        "Hora de Llegada": "Reservaron PERO no vinieron",
        "Hora de Salida": "",
      }));

      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.json_to_sheet(excelData);

      worksheet["!cols"] = [
        { wch: 18 }, // Nombres
        { wch: 18 }, // Apellidos
        { wch: 15 }, // Documento
        { wch: 25 }, // Fecha
        { wch: 18 }, // Silla
        { wch: 45 }, // Hora de llegada
        { wch: 20 }, // Hora de salida
      ];

      XLSX.utils.book_append_sheet(workbook, worksheet, "Ausencias");

      const wbout = XLSX.write(workbook, {
        bookType: "xlsx",
        type: "array",
      });

      saveAs(
        new Blob([wbout], { type: "application/octet-stream" }),
        `Reporte-Ausencias-${fechaInicial}-${fechaFinal}.xlsx`
      );

      setShow(false);
    } catch (error) {
      console.error("Error al generar reporte:", error);
      Swal.fire(
        error.response?.data?.message || "Error al generar el reporte"
      );
    }
  };

  const isToday = (date) => {
    if (!date) return false;
    return date.isSame(dayjs(), "day");
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
      style={{ display: isOpen ? "block" : "none", zIndex: 1000 }}
    >
      <div className="modal-dialog">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">Reporte de Ausencias</h5>
            <button
              style={{ background: "transparent", border: "none" }}
              onClick={() => setShow(false)}
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
              allowClear={false}
              disabledDate={disabledDate}
            />
          </div>

          <div className="modal-footer" style={{ justifyContent: "center", display: "flex", gap:"16px" }}>
            <Button
              variant="contained"
              color="error"
              startIcon={<CancelIcon />}
              onClick={() => setShow(false)}
            >
              Cerrar
            </Button>

            <Button
              variant="contained"
              color="success"
              startIcon={<DownloadIcon />}
              onClick={handleConfirm}
            >
              Descargar
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
