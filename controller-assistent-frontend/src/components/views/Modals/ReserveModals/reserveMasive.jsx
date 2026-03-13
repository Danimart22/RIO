import { useState } from "react";
import Modal from "@mui/material/Modal";
import Button from "@mui/material/Button";
import { DataGrid } from "@mui/x-data-grid";
import TextField from "@mui/material/TextField";
import oficinaMFSApi from "../../../../api/oficinaMFSApi";
import Swal from "sweetalert2";

export default function ReserveMasive({ isOpen, setShow }) {
  const [csvData, setCsvData] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);

  const handleCsvFile = (data) => {
    const headers = data[0];
    const rows = data.slice(1);

    const parsedData = rows.map((row, index) => {
      const rowData = { id: index + 1 };
      headers.forEach((header, index) => {
        const cellValue = row[index];
        if (header === "Evento") {
          const cleanedEvento = cellValue ? cleanCellValue(cellValue) : "";
          if (
            cleanedEvento === "1:1 authentication succeeded (Card)" ||
            cleanedEvento === "1:N authentication succeeded (Face)" ||
            cleanedEvento === "1:N authentication succeeded (Fingerprint)"
          ) {
            rowData[header] = cleanedEvento;
          } else {
            rowData[header] = ""; // No agregamos el evento no válido
          }
        } else {
          const cleanedHeader = cleanString(header);
          rowData[cleanedHeader] = cellValue ? cleanCellValue(cellValue) : "";
        }
      });

      return rowData;
    });

    // Filtrar solo los datos con valores válidos en la columna "Evento"
    const filteredData = parsedData.filter(
      (item) =>
        item.Evento &&
        (item.Evento === "1:1 authentication succeeded (Card)" ||
          item.Evento === "1:N authentication succeeded (Face)" ||
          item.Evento === "1:N authentication succeeded (Fingerprint)")
    );

    setCsvData(filteredData);
  };

  // Función para limpiar el valor de una celda
  const cleanCellValue = (cellValue) => {
    return cellValue.replace(/\r?\n|\r/g, "").trim();
  };

  // Función para limpiar una cadena de texto
  const cleanString = (str) => {
    return str.trim();
  };

  const handleImportClick = async () => {
    try {
      const filteredData = csvData.filter(
        (item) => item.Fecha && item.Dispositivos && item.Usuarios
      );

      console.log("JSON data before sending:", filteredData);

      // Handle the import logic here (e.g., sending data to a server)
      const response = await oficinaMFSApi.post(`/oficina/reservaMasiva`, {
        jsonData: filteredData,
      });

      setTimeout(() => {
        if (response.status === 200) {
          Swal.fire({
          background: localStorage.getItem("darkMode")==="true"?'#212121':'#FFFFFF',
          color: localStorage.getItem("darkMode")==="true"?'white':'black',
            icon: "success",
            title: "Asistencias importadas",
            text: "Las asistencias fueron importadas correctamente.",
          }).then(() => {
            setCsvData([]);
          });
        }
      }, 3000)
    } catch (error) {
      Swal.fire({
          background: localStorage.getItem("darkMode")==="true"?'#212121':'#FFFFFF',
          color: localStorage.getItem("darkMode")==="true"?'white':'black',
        icon: "error",
        title: "Error al importar",
        text: "Error al importar asistencias",
        allowOutsideClick: false,
      });
    } finally {
      handleClose();
    }
  };

  const handleClose = () => {
    setShow(false);
    setCsvData([]);
    setSelectedFile(null);
  };

  return (
    <Modal
      open={isOpen}
      onClose={handleClose}
      sx={{
        display: "flex",
        alignItems: "center",
        bgcolor: 'background.paper',
        justifyContent: "center",
        width: "90%",
        height: "80vh"
      }}
    >
      <div
        style={{
          width: "90%",
          height: "90%",
          padding: 16,
          display: "flex",
          flexDirection: "column",
        }}
      >
        <TextField
          type="file"
          accept=".csv"
          variant="outlined"
          onChange={(e) => {
            const file = e.target.files[0];
            const maxSizeInBytes = 5 * 1024 * 1024; // 5 MB

            if (file && file.size <= maxSizeInBytes) {
              const reader = new FileReader();
              reader.onload = (event) => {
                const content = event.target.result;
                const data = content.split("\n").map((row) => row.split(","));
                handleCsvFile(data);
              };
              reader.readAsText(file);
              setSelectedFile(file);
            } else {
              console.log("El archivo seleccionado es demasiado grande");
            }
          }}
        />


        {csvData.length > 0 && (
          <div
            style={{
              marginTop: 16,
              height: "calc(100% - 80px)",
              overflow: "auto",
            }}
          >
            <DataGrid
              rows={csvData}
              getRowHeight={() => "auto"}
              columns={Object.keys(csvData[0]).map((header) => ({
                field: header,
                headerName: header,
                flex: 1,
              }))}
            />
          </div>
        )}
        <div
          style={{
            marginTop: "auto",
            display: "flex",
            justifyContent: "flex-end",
          }}
        >
          <Button
            variant="contained"
            onClick={handleImportClick}
            disabled={csvData.length === 0}
            style={{ marginRight: 10 }}
          >
            Importar
          </Button>
          <Button variant="contained" onClick={handleClose}>
            Cerrar
          </Button>
        </div>
      </div>
    </Modal>
  );
}
