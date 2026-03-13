import { useState, useEffect } from "react";
import oficinaMFSApi from "../../../api/oficinaMFSApi";
import Swal from "sweetalert2";
import { Container } from "react-bootstrap";
import { Button } from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import ReserveReemplazo from "../Modals/ReserveModals/reserveReemplazo";
import ReemplazoForm from "../Modals/UserFormModals/reemplazoForm";
import Chip from "@mui/material/Chip";
import { dataDecrypt } from "../../../util";
import AddIcon from "@mui/icons-material/Add";
import DownloadIcon from "@mui/icons-material/Download";
import Skeleton from "@mui/material/Skeleton";
import DeleteIcon from "@mui/icons-material/DeleteOutlined";
import * as XLSX from "xlsx";

export function ReemplazoViews() {
  const [userData, setUserData] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showAsignarModal, setShowAsignarModal] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const response = await oficinaMFSApi.get("/reemplazo/");
      setUserData(response.data);
      setLoading(false);
    } catch (error) {
      console.error("Error al obtener los datos de los Empleados:", error);
      Swal.fire({
          background: localStorage.getItem("darkMode")==="true"?'#212121':'#FFFFFF',
          color: localStorage.getItem("darkMode")==="true"?'white':'black',
        icon: "error",
        title: "Error al obtener los datos",
        text: "Ha ocurrido un error al obtener los datos de los Reemplazos. Por favor, intenta nuevamente.",
      });
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenModalNewReemplazo = () => {
    setShowModal(true);
  };

  const handleOpenModalAsignarReemplazo = () => {
    setShowAsignarModal(true);
  };

  const formatArrayForExcel = (array) => {
    return Array.isArray(array) ? array.join(", ") : array;
  };

  const formatArrayForGrid = (array) => {
    return (
      <div>
        {array.map((item, index) => (
          <Chip key={index} label={item} style={{ margin: "2px" }} />
        ))}
      </div>
    );
  };

  const handleExport = () => {
    if (!userData || userData.length === 0) {
      Swal.fire({
          background: localStorage.getItem("darkMode")==="true"?'#212121':'#FFFFFF',
          color: localStorage.getItem("darkMode")==="true"?'white':'black',
        icon: "info",
        title: "No hay datos para exportar",
        text: "No hay datos de Reemplazos para exportar a Excel.",
      });
      return;
    }

    const headers = [
      "Tipo de documento",
      "Documento",
      "Nombres",
      "Apellidos",
      "Sangre",
      "Teléfono",
      "Cargo",
      "Acudiente",
      "Tipo de acudiente",
      "Número de acudiente",
      "Dirección",
      "EPS",
      "ARL",
      "Enfermedades",
      "Alergias",
    ];

    const formattedData = userData.map((row) => {
      // Formatear los arrays "enfermedades" y "alergias" como cadenas separadas por coma y espacio
      const formattedEnfermedades = formatArrayForExcel(row.enfermedades);
      const formattedAlergias = formatArrayForExcel(row.alergias);

      return {
        "Tipo de documento": row.tipo_documento,
        Documento: row.documento,
        Nombres: row.nombres,
        Apellidos: row.apellidos,
        Sangre: row.sangre,
        Teléfono: row.telefono,
        Cargo: row.cargo,
        Acudiente: row.acudiente,
        "Tipo de acudiente": row.tipo_acudiente,
        "Número de acudiente": row.numero_acudiente,
        Dirección: row.direccion,
        EPS: row.eps,
        ARL: row.arl,
        Enfermedades: formattedEnfermedades,
        Alergias: formattedAlergias,
      };
    });

    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(formattedData, {
      header: headers,
    });

    // Establecer el estilo de las celdas del encabezado (fila 1) en negrita
    const headerCellStyle = { font: { bold: true } };
    headers.forEach((header, index) => {
      const cellRef = XLSX.utils.encode_cell({ r: 0, c: index });
      worksheet[cellRef].s = headerCellStyle;
    });

    // Ajustar el ancho de las columnas automáticamente según el contenido más largo de cada columna
    const columnWidths = headers.map((header) => ({
      wch: Math.max(
        header.length + 5,
        ...formattedData.map((row) => String(row[header]).length + 5)
      ),
    }));
    worksheet["!cols"] = columnWidths;

    // Obtener la fecha actual y formatearla como "dd-mm-yyyy"
    const currentDate = new Date();
    const formattedDate = currentDate.toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });

    const fileName = `datos_reemplazos_${formattedDate}.xlsx`;
    XLSX.utils.book_append_sheet(workbook, worksheet, "Datos de reemplazos");
    XLSX.writeFile(workbook, fileName);

    Swal.fire({
          background: localStorage.getItem("darkMode")==="true"?'#212121':'#FFFFFF',
          color: localStorage.getItem("darkMode")==="true"?'white':'black',
      icon: "success",
      title: "Exportación exitosa",
      text: "Los datos de los reemplazos han sido exportados correctamente.",
    });
  };

  const handleDeleteReemplazo = async (reemplazo) => {
    try {
      const token = dataDecrypt(localStorage.getItem("Token"));
      const config = {
        headers: {
          "x-access-token": token,
        },
      };
      const confirmResult = await Swal.fire({
          background: localStorage.getItem("darkMode")==="true"?'#212121':'#FFFFFF',
          color: localStorage.getItem("darkMode")==="true"?'white':'black',
        title: "¿Estás seguro?",
        html: `Esta acción eliminará el reemplazante <b>${reemplazo.nombres} ${reemplazo.apellidos}</b>. ¿Estás seguro que deseas continuar?`,
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#FF0033",
        cancelButtonColor: "#29b6f6",
        confirmButtonText: "Sí, eliminar",
        cancelButtonText: "Cancelar",
      });

      if (confirmResult.isConfirmed) {
        // Hacer la petición DELETE a la API para eliminar el reemplazo
        await oficinaMFSApi.delete(`/reemplazo/${reemplazo.id}`);

        fetchData(); // Suponiendo que tienes una función fetchReemplazoData() para cargar los datos de los reemplazos

        // Mostrar mensaje Swal de éxito
        Swal.fire({
          background: localStorage.getItem("darkMode")==="true"?'#212121':'#FFFFFF',
          color: localStorage.getItem("darkMode")==="true"?'white':'black',
          icon: "success",
          title: "Reemplazo eliminado",
          html: `El reemplazo de <b>${reemplazo.nombres} ${reemplazo.apellidos}</b> ha sido eliminado correctamente.`,
        });
      }
    } catch (error) {
      console.error("Error al eliminar el reemplazo:", error);

      // Mostrar mensaje Swal de error
      Swal.fire({
          background: localStorage.getItem("darkMode")==="true"?'#212121':'#FFFFFF',
          color: localStorage.getItem("darkMode")==="true"?'white':'black',
        icon: "error",
        title: "Error al eliminar el reemplazo",
        text: "Ha ocurrido un error al eliminar el reemplazo. Por favor, intenta nuevamente.",
      });
    }
  };

  const columns = [
    { field: "tipo_documento", headerName: "Tipo Documento", width: 150 },
    { field: "documento", headerName: "Documento", width: 150 },
    { field: "nombres", headerName: "Nombres", width: 200 },
    { field: "apellidos", headerName: "Apellidos", width: 200 },
    { field: "sangre", headerName: "Tipo de Sangre", width: 150 },
    { field: "telefono", headerName: "Teléfono", width: 150 },
    { field: "cargo", headerName: "Cargo", width: 150 },
    { field: "acudiente", headerName: "Acudiente", width: 200 },
    { field: "tipo_acudiente", headerName: "Tipo de Acudiente", width: 200 },
    {
      field: "numero_acudiente",
      headerName: "Número de Acudiente",
      width: 200,
    },
    { field: "direccion", headerName: "Dirección", width: 200 },
    { field: "eps", headerName: "EPS", width: 150 },
    { field: "arl", headerName: "ARL", width: 150 },
    {
      field: "enfermedades",
      headerName: "Patologías",
      width: 200,
      renderCell: (params) => formatArrayForGrid(params.value),
    },

    {
      field: "alergias",
      headerName: "Alergias",
      width: 200,
      renderCell: (params) => formatArrayForGrid(params.value),
    },

    {
      field: "actions",
      headerName: "Acciones",
      width: 220,
      sortable: false,
      disableColumnMenu: true,
      renderCell: (params) => (
        <>
          {/*<Button
            onClick={() => handleOpenUpdateUser(params.row)}
            style={{ marginRight: "10px" }}
            variant="contained"
            color="primary"
            startIcon={<EditIcon />}
          >
            Editar
      </Button>*/}
          <Button
            variant="contained"
            color="error"
            onClick={() =>
              handleDeleteReemplazo(
                params.row,
                params.row.nombres,
                params.row.apellidos
              )
            }
            startIcon={<DeleteIcon />}
          >
            Eliminar
          </Button>
        </>
      ),
    },
  ];

  return (
    <Container>
      <div width="100%" style={{ display: loading ? "block" : "none" }}>
        <Skeleton variant="text" height={80} width={"31%"} />
        <div style={{ display: "flex", gap: "10px" }}>
          <Skeleton variant="text" height={40} width={"15%"} />
          <Skeleton variant="text" height={40} width={"15%"} />
        </div>
        <Skeleton variant="rounded" height={450} />
      </div>

      <div style={{ display: loading ? "none" : "block" }}>
        <h1 style={{ fontWeight: "bold" }}>Reemplazos</h1>
        <Button
          style={{
            margin: "1%",
            backgroundColor: "#F45000", // Establece el color de fondo
            color: "white", // Establece el color del texto (opcional)
          }}
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={handleOpenModalNewReemplazo}
        >
          Agregar Reemplazo
        </Button>
        <Button
          variant="contained"
          color="success"
          style={{ margin: "1%" }}
          startIcon={<DownloadIcon />}
          onClick={() => handleExport(userData)}
        >
          Exportar a Excel
        </Button>
        <Button
          style={{
            margin: "1%",
            backgroundColor: "#3c3c3c", // Establece el color de fondo
            color: "white", // Establece el color del texto (opcional)
          }}
          onClick={handleOpenModalAsignarReemplazo}
          startIcon={<CalendarMonthIcon />}
          variant="contained"
          color="info"
        >
          Asignar Reemplazo
        </Button>
      </div>

      <div
        style={{
          height: "calc(100vh - 200px)",
          width: "100%",
          display: loading ? "none" : "block",
        }}
      >
        <DataGrid
          rows={userData}
          columns={columns}
          pageSize={10}
          rowsPerPageOptions={[10, 20, 50]}
          columnResizing
          checkboxSelection
          disableRowSelectionOnClick
          getRowId={(row) => row.id}
          minColumnWidth={100}
          maxColumnWidth={500}
        />
      </div>

      <ReemplazoForm
        isOpen={showModal}
        setShow={setShowModal}
        fetchData={fetchData}
        userData={userData}
      />
      <ReserveReemplazo
        isOpen={showAsignarModal}
        setShow={setShowAsignarModal}
      />
    </Container>
  );
}
