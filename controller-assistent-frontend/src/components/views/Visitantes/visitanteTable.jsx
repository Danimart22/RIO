import { useEffect, useState } from "react";
import Swal from "sweetalert2";
import { Container } from "react-bootstrap";
import { Button } from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import DownloadIcon from "@mui/icons-material/Download";
import oficinaMFSApi from "../../../api/oficinaMFSApi";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/DeleteOutlined";
import Chip from "@mui/material/Chip";
import VisitanteForm from "../Modals/VisitanteFormModals/visitanteForm";
import ReserveVisitante from "../Modals/ReserveModals/reserveVisitante";
import VisitanteUpdate from "../Modals/UpdateModals/visitanteUpdate";
import Skeleton from "@mui/material/Skeleton";
import * as XLSX from "xlsx";

export function VisitantesTable() {
  const [visitantes, setVisitantes] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showModalReserve, setShowModalReserve] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedVisitante, setSelectedVisitante] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);

  const fetchVisitantesData = async () => {
    try {
      const response = await oficinaMFSApi.get(`/visitantes`);
      const data = response.data;
      const formattedData = data.map((visitante) => ({
        ...visitante,
        direccionCompleta: `${visitante.direccion.calle}, ${visitante.direccion.ciudad}, ${visitante.direccion.pais}`,
        id: visitante.id, // Aseguramos que haya un id único
      }));
      setVisitantes(formattedData);
      setLoading(false);
    } catch (error) {
      console.error("Error al obtener los datos de los visitantes:", error);
      Swal.fire({
          background: localStorage.getItem("darkMode")==="true"?'#212121':'#FFFFFF',
          color: localStorage.getItem("darkMode")==="true"?'white':'black',
        icon: "error",
        title: "Error al obtener los datos",
        text: "Ha ocurrido un error al obtener los datos de los visitantes. Por favor, intenta nuevamente.",
      });
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVisitantesData();
  }, []);

  const handleOpenEditModal = (visitante) => {
    setSelectedVisitante(visitante);
    setShowEditModal(true);
  };

  const handleOpenModalNewVisitante = () => {
    setShowModal(true);
  };
  const handleOpenModalReserveVisit = () => {
    setShowModalReserve(true);
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

  const formatArrayForExcel = (array) => {
    return Array.isArray(array) ? array.join(", ") : array;
  };

  const formatDireccionForExcel = (direccion) => {
    const { calle, ciudad, pais } = direccion;
    return `${calle}, ${ciudad}, ${pais}`;
  };

  const handleExport = () => {
    if (!visitantes || visitantes.length === 0) {
      Swal.fire({
          background: localStorage.getItem("darkMode")==="true"?'#212121':'#FFFFFF',
          color: localStorage.getItem("darkMode")==="true"?'white':'black',
        icon: "info",
        title: "No hay datos para exportar",
        text: "No hay datos de visitantes para exportar a Excel.",
      });
      return;
    }

    const headers = [
      "Tipo de documento",
      "Documento",
      "Nombres",
      "Apellidos",
      "Tipo de sangre",
      "Teléfono",
      "Patologias",
      "Alergias",
      "Dirección",
      "EPS",
      "ARL",
    ];
    // Convertir los datos de visitantes al formato requerido por la librería xlsx
    const exportData = visitantes.map((row) => {
      // Formatear los arrays "enfermedades" y "alergias" como cadenas separadas por coma y espacio
      const formattedEnfermedades = formatArrayForExcel(row.enfermedades);
      const formattedAlergias = formatArrayForExcel(row.alergias);

      return {
        "Tipo de documento": row.tipo_documento,
        Documento: row.documento,
        Nombres: row.nombres,
        Apellidos: row.apellidos,
        "Tipo de sangre": row.sangre,
        Teléfono: row.telefono,
        Patologias: formattedEnfermedades,
        Alergias: formattedAlergias,
        Dirección: formatDireccionForExcel(row.direccion),
        EPS: row.eps,
        ARL: row.arl,
      };
    });

    // Crear un nuevo workbook y worksheet
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(exportData, {
      header: headers,
    });

    // Ajustar el ancho de las columnas automáticamente según el contenido más largo de cada columna
    const headerCellStyle = { font: { bold: true } };
    headers.forEach((header, index) => {
      const cellRef = XLSX.utils.encode_cell({ r: 0, c: index });
      worksheet[cellRef].s = headerCellStyle;
    });

    const columnWidths = headers.map((header) => ({
      wch: Math.max(
        header.length + 5,
        ...exportData.map((row) => String(row[header]).length + 5)
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

    const fileName = `datos_visitantes_${formattedDate}.xlsx`;
    XLSX.utils.book_append_sheet(workbook, worksheet, "Datos de empleados");
    XLSX.writeFile(workbook, fileName);

    Swal.fire({
          background: localStorage.getItem("darkMode")==="true"?'#212121':'#FFFFFF',
          color: localStorage.getItem("darkMode")==="true"?'white':'black',
      icon: "success",
      title: "Exportación exitosa",
      text: "Los datos de los visitantes han sido exportados correctamente.",
    });
  };
  const getRowId = (row) => row.id;

  const handleDeleteVisitante = async (visitante, nombres, apellidos) => {
    try {
      // Mostrar una ventana de confirmación antes de eliminar el visitante
      const confirmResult = await Swal.fire({
          background: localStorage.getItem("darkMode")==="true"?'#212121':'#FFFFFF',
          color: localStorage.getItem("darkMode")==="true"?'white':'black',
        title: "¿Estás seguro?",
        html: `Esta acción eliminará al visitante <b>${nombres} ${apellidos}</b>. ¿Estás seguro que deseas continuar?`,
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#FF0033",
        cancelButtonColor: "#29b6f6",
        confirmButtonText: "Sí, eliminar",
        cancelButtonText: "Cancelar",
      });
  
      if (confirmResult.isConfirmed) {
        // Hacemos la solicitud DELETE a la API para eliminar el visitante
        await oficinaMFSApi.delete(`/visitantes/${visitante.id}`);
  
        // Después de eliminar el visitante, actualizamos los datos
        fetchVisitantesData();
  
        // Mostrar mensaje Swal de éxito
        Swal.fire({
          background: localStorage.getItem("darkMode")==="true"?'#212121':'#FFFFFF',
          color: localStorage.getItem("darkMode")==="true"?'white':'black',
          icon: "success",
          title: "Visitante eliminado",
          html: `El visitante ${nombres} ${apellidos} ha sido eliminado correctamente.`,
        });
      }
    } catch (error) {
      console.error("Error al eliminar el visitante:", error);
  
      // Mostrar mensaje Swal de error
      Swal.fire({
          background: localStorage.getItem("darkMode")==="true"?'#212121':'#FFFFFF',
          color: localStorage.getItem("darkMode")==="true"?'white':'black',
        icon: "error",
        title: "Error al eliminar el visitante",
        text: "Ha ocurrido un error al eliminar el visitante. Por favor, intenta nuevamente.",
      });
    }
  };
  

  const columns = [
    { field: "tipo_documento", headerName: "Tipos de documento", width: 150 },
    { field: "documento", headerName: "Documento", width: 150 },
    { field: "nombres", headerName: "Nombres", width: 200 },
    { field: "apellidos", headerName: "Apellidos", width: 200 },
    { field: "sangre", headerName: "Tipo de sangre", width: 120 },
    { field: "telefono", headerName: "Teléfono", width: 150 },
    { field: "direccionCompleta", headerName: "Dirección", width: 250 },
    { field: "eps", headerName: "EPS", width: 180 },
    { field: "arl", headerName: "ARL", width: 180 },
    {
      field: "enfermedades",
      headerName: "Enfermedades",
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
          <Button
            onClick={() => handleOpenEditModal(params.row)}
            style={{ marginRight: "10px" }}
            variant="contained"
            color="primary"
            startIcon={<EditIcon />}
          >
            Editar
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={() => handleDeleteVisitante(
              params.row,
              params.row.nombres,
              params.row.apellidos
              )}
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
        <Skeleton variant="text" height={80} width={"30%"} />
        <div style={{ display: "flex", gap: "10px" }}>
          <Skeleton variant="text" height={50} width={"15%"} />
          <Skeleton variant="text" height={50} width={"15%"} />
          <Skeleton variant="text" height={50} width={"15%"} />
        </div>
        <Skeleton variant="rounded" height={450} />
      </div>

      <div style={{ display: loading ? "none" : "block" }}>
        <h1>Datos de los Visitantes</h1>

        <Button
          style={{
            margin: "1%",
            backgroundColor: "#05C3DD", // Establece el color de fondo
            color: "white", // Establece el color del texto (opcional)
          }}
          onClick={handleOpenModalReserveVisit}
          startIcon={<CalendarMonthIcon />}
          variant="contained"
          color="info"
        >
          Reservar visita
        </Button>
        <Button
          style={{ margin: "1%" }}
          onClick={handleExport}
          startIcon={<DownloadIcon />}
          variant="contained"
          color="success"
        >
          Exportar Visitantes
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
          rows={visitantes}
          columns={columns}
          getRowId={getRowId}
          pageSize={5}
          rowsPerPageOptions={[5, 10, 20]}
          checkboxSelection
          disableSelectionOnClick
          getRowHeight={() => "auto"}
          columnResizing
          minColumnWidth={100}
          maxColumnWidth={500}
        />
      </div>

      <VisitanteForm
        isOpen={showModal}
        setShow={setShowModal}
        fetchVisitantesData={fetchVisitantesData}
        visitantes={visitantes}
      />
      <ReserveVisitante
        isOpen={showModalReserve}
        setShow={setShowModalReserve}
      />

      <VisitanteUpdate
        isOpen={showEditModal}
        setShowEditModal={setShowEditModal}
        handleClose={() => setShowEditModal(false)}
        visitanteId={selectedVisitante ? selectedVisitante.id : null}
        handleUpdateVisitante={fetchVisitantesData}
      />
    </Container>
  );
}
