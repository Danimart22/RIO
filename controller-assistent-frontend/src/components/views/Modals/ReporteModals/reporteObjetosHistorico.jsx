import { useState, useEffect } from "react";
import { DatePicker } from "antd";
import { Button } from "@mui/material";
import DownloadIcon from "@mui/icons-material/Download";
import CancelIcon from "@mui/icons-material/Cancel";
import CloseIcon from '@mui/icons-material/Close';
import moment from "moment";
import Swal from "sweetalert2";
import { saveAs } from "file-saver";
import oficinaMFSApi from "../../../../api/oficinaMFSApi";
import * as XLSX from "xlsx";

const { RangePicker } = DatePicker;

export default function ReporteObjetos({ isOpen, setShow }) {
  const [selectedDates, setSelectedDates] = useState(null);
  const [darkMode, setDarkMode] = useState(localStorage.getItem("darkMode") === "true");

  useEffect(() => {
    const handleStorageChange = () => {
      setDarkMode(localStorage.getItem("darkMode") === "true");
    };
    window.addEventListener("storage", handleStorageChange);
    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  const handleConfirm = async () => {
    try {
      if (!selectedDates || !selectedDates[0] || !selectedDates[1]) {
        Swal.fire({
          background: darkMode ? '#212121' : '#FFFFFF',
          color: darkMode ? 'white' : 'black',
          icon: "warning",
          title: "Fechas requeridas",
          text: "Por favor selecciona un rango de fechas válido"
        });
        return;
      }

      // Formato YYYY-MM-DD sin timestamp
      const startStr = selectedDates[0].$d 
        ? moment(selectedDates[0].$d).format("YYYY-MM-DD")
        : selectedDates[0].format 
          ? selectedDates[0].format("YYYY-MM-DD")
          : moment(selectedDates[0]).format("YYYY-MM-DD");

      const endStr = selectedDates[1].$d
        ? moment(selectedDates[1].$d).format("YYYY-MM-DD")
        : selectedDates[1].format
          ? selectedDates[1].format("YYYY-MM-DD")
          : moment(selectedDates[1]).format("YYYY-MM-DD");

      console.log("Fechas enviadas:", startStr, endStr);

      const response = await oficinaMFSApi.get(
        `/observacion/rango/${startStr}/${endStr}`
      );

      console.log("Response:", response.data);

      // Acceder a response.data.data según el backend
      const data = response.data.data;

      if (!data || !Array.isArray(data) || data.length === 0) {
        Swal.fire({
          background: darkMode ? '#212121' : '#FFFFFF',
          color: darkMode ? 'white' : 'black',
          icon: "info",
          title: "Sin datos",
          text: "No hay reportes en ese rango de fechas"
        });
        return;
      }

      // Mapear según la estructura REAL de el backend
      const excelData = data.map((row) => ({
        "Fecha del reporte": moment(row.fecha).format("DD [de] MMMM [del] YYYY"),
        "Asiento reportado": row.asiento_reportado || "N/A",
        "Usuario reportante": row.nombre_reportante || "Desconocido",
        "Objetos reportados": Array.isArray(row.objetos) && row.objetos.length > 0
          ? row.objetos.map(obj => `${obj.objeto} (${obj.tipo})`).join(", ")
          : "Sin objetos",
        "Reportes activos": Array.isArray(row.objetos) && row.objetos.length > 0
          ? row.objetos
              .filter(obj => obj.estado === "activo")
              .map(obj => `${obj.objeto} (${obj.tipo})`)
              .join(", ")
          : "Ninguno",
        "Observaciones": row.observaciones || ""
      }));

      console.log("🔍 Excel Data:", excelData);

      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.json_to_sheet(excelData);

      // Ajustar anchos de columnas
      worksheet["!cols"] = [
        { wch: 30 }, // Fecha del reporte
        { wch: 20 }, // Asiento reportado
        { wch: 25 }, // Usuario reportante
        { wch: 50 }, // Objetos reportados
        { wch: 50 }, // Reportes activos
        { wch: 35 }  // Observaciones
      ];

      XLSX.utils.book_append_sheet(workbook, worksheet, "Observaciones");

      const wbout = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
      const blob = new Blob([wbout], { type: "application/octet-stream" });
      
      saveAs(
        blob,
        `Reporte-objetos-${startStr}-${endStr}.xlsx`
      );

      Swal.fire({
        background: darkMode ? '#212121' : '#FFFFFF',
        color: darkMode ? 'white' : 'black',
        icon: "success",
        title: "Reporte descargado",
        text: "El reporte se ha descargado correctamente"
      });

      setShow(false);

    } catch (error) {
      console.error("Error:", error);
      console.error("Response:", error.response);
      
      Swal.fire({
        background: darkMode ? '#212121' : '#FFFFFF',
        color: darkMode ? 'white' : 'black',
        icon: "error",
        title: "Error",
        text: error.response?.data?.message || "Error al obtener las observaciones"
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
              Reporte de Observaciones en Rango de Fechas
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
              <label style={{ display: "block", marginBottom: "8px" }}>
                Rango de fechas:
              </label>
              {/* Selección de fechas */}
              <RangePicker
                value={selectedDates}
                onChange={(dates) => setSelectedDates(dates)}
                format="YYYY-MM-DD"
                placeholder={["Fecha de inicio", "Fecha de fin"]}
                style={{ width: "100%" }}
              />
            </div>
          </div>
          
          <div
            className="modal-footer"
            style={{ margin: "2%", display: "flex", justifyContent: "center", gap: "10px" }}
          >
            <Button
              variant="contained"
              color="error"
              onClick={handleClose}
              startIcon={<CancelIcon />}
            >
              Cerrar
            </Button>
            <Button
              onClick={handleConfirm}
              startIcon={<DownloadIcon />}
              variant="contained"
              color="success"
            >
              Descargar
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}