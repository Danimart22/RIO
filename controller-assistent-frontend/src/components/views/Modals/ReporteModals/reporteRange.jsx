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
import { getENV } from "../../../../config/env";

const { RangePicker } = DatePicker;

export default function ReporteRange({ isOpen, setShow }) {
  const today = moment();
  const initialStartDate = moment(today).startOf("day");
  const initialEndDate = moment(today).endOf("day");

  const [selectedDates, setSelectedDates] = useState([
    initialStartDate,
    initialEndDate,
  ]);
  const [darkMode, setDarkMode] = useState(
    localStorage.getItem("darkMode") === "true"
  );

  // Leer variable de entorno y construir hora límite con moment (consistente con el resto del archivo)
  const HORA_LIMITE_STR = getENV().HORA_LIMITE_RESERVA; // "09:30:0"
  const HORA_LIMITE = moment(HORA_LIMITE_STR, "HH:mm:ss");

  useEffect(() => {
    const handleStorageChange = () => {
      setDarkMode(localStorage.getItem("darkMode") === "true");
    };
    window.addEventListener("storage", handleStorageChange);
    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  const getHoraLlegadaExcel = (oficina) => {
    const llegadas = oficina.horaLlegada;
    if (!llegadas || llegadas.length === 0) {
      return "Reservó pero NO asistió";
    }
    const horaLlegada = moment(llegadas[0], "HH:mm:ss");
    if (horaLlegada.isAfter(HORA_LIMITE)) {
      return `No llegó a tiempo (${horaLlegada.format("HH:mm")})`;
    }
    return horaLlegada.format("HH:mm");
  };

  const handleConfirm = async () => {
    try {
      const formattedStartDate = selectedDates[0].format("YYYY-MM-DD");
      const formattedEndDate = selectedDates[1].format("YYYY-MM-DD");

      const response = await oficinaMFSApi.get(
        `/oficina/reservasRango?fechaInicial=${formattedStartDate}&fechaFinal=${formattedEndDate}`
      );

      const data = response.data;

      const excelData = data.map((oficina) => ({
        Nombres: oficina.usuario.nombres,
        Apellidos: oficina.usuario.apellidos,
        Documento: oficina.usuario.documento,
        "Fecha de la Reserva": moment
          .utc(oficina.fechaReserva)
          .format("DD [de] MMMM [del] YYYY"),
        "Hora de Llegada": getHoraLlegadaExcel(oficina),
        "Hora de Salida":
          oficina.horaSalida && oficina.horaSalida.length > 0
            ? oficina.horaSalida.join(", ")
            : "",
      }));

      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.json_to_sheet(excelData);

      const columnWidths = [
        { columnName: "Nombres", width: 18 },
        { columnName: "Apellidos", width: 18 },
        { columnName: "Documento", width: 15 },
        { columnName: "FechaReserva", width: 20 },
        { columnName: "Hora de Llegada", width: 60 },
        { columnName: "Hora de Salida", width: 60 },
      ];

      worksheet["!cols"] = columnWidths.map((column) => ({
        wch: column.width,
      }));

      const range = XLSX.utils.decode_range(worksheet["!ref"]);
      for (let col = range.s.c; col <= range.e.c; col++) {
        for (let row = range.s.r + 1; row <= range.e.r; row++) {
          const cellAddress = { r: row, c: col };
          const cellRef = XLSX.utils.encode_cell(cellAddress);
          const cell = worksheet[cellRef];
          if (cell && cell.t === "s") {
            cell.s = { alignment: { horizontal: "center" } };
          }
        }
      }

      XLSX.utils.book_append_sheet(workbook, worksheet, "Reservas");

      const wbout = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
      const blob = new Blob([wbout], { type: "application/octet-stream" });
      saveAs(
        blob,
        `Reporte-reservas-${formattedStartDate}-${formattedEndDate}.xlsx`
      );

      setShow(false);
    } catch (error) {
      console.error("Error al obtener las reservas:", error);
      Swal.fire({
        background: localStorage.getItem("darkMode") === "true" ? "#212121" : "#FFFFFF",
        color: localStorage.getItem("darkMode") === "true" ? "white" : "black",
        icon: "error",
        title: "Error",
        text: error.response?.data?.message || "Error al obtener las reservas",
      });
    }
  };

  const handleClose = () => {
    setShow(false);
  };

  return (
    <div
      className={`modal ${isOpen ? "show" : ""} ${darkMode ? "bootstrap-darkmode" : ""}`}
      tabIndex="-1"
      role="dialog"
      style={{
        display: isOpen ? "block" : "none",
        zIndex: 1000,
      }}
    >
      <div className="modal-dialog" role="document">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">
              Reporte de Reservas en Rango de Fechas
            </h5>
            <button
              type="button"
              style={{ backgroundColor: "transparent", border: "none" }}
              className="close"
              data-dismiss="modal"
              aria-label="Close"
              onClick={handleClose}
            >
              <span aria-hidden="true">
                <CloseIcon sx={{ color: darkMode ? "white" : "black" }} />
              </span>
            </button>
          </div>
          <div className="modal-body">
            <div>
              <label>Rango de fechas:</label>
              <RangePicker
                value={selectedDates}
                onChange={(dates) => setSelectedDates(dates)}
                format="YYYY/MM/DD"
                placeholder={["Fecha de inicio", "Fecha de fin"]}
              />
            </div>
          </div>
          <div
            className="modal-footer"
            style={{ margin: "2%", display: "flex", justifyContent: "center" }}
          >
            <Button
              variant="contained"
              color="error"
              onClick={handleClose}
              style={{ marginRight: "1%" }}
              startIcon={<CancelIcon />}
            >
              Cerrar
            </Button>
            <Button
              onClick={handleConfirm}
              startIcon={<DownloadIcon />}
              variant="contained"
              color="success"
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