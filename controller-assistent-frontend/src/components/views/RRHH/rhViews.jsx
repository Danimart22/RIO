import { useState, useEffect, useCallback } from "react";
import oficinaMFSApi from "../../../api/oficinaMFSApi";
import Swal from "sweetalert2";
import { Container } from "react-bootstrap";
import { Button, TextField, InputAdornment, IconButton, Chip, Skeleton, Tooltip } from "@mui/material";
import UserForm from "../Modals/UserFormModals/userFormRh";
import { DataGrid } from "@mui/x-data-grid";
import UserUpdate from "../Modals/UpdateModals/userUpdate";
import { dataDecrypt } from "../../../util";
import AddIcon from "@mui/icons-material/Add";
import DownloadIcon from "@mui/icons-material/Download";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/DeleteOutlined";
import SearchIcon from "@mui/icons-material/Search";
import ClearIcon from "@mui/icons-material/Clear";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";
import * as XLSX from "xlsx";
import MassiveUserUpdate from "../Modals/RRHHModals/EdicionMasivaModal";
import AssignDaysModal from "../Modals/JornadaModals/AssignDaysModal";
import AssignmentIcon from "@mui/icons-material/Assignment";

export function RHViews() {
  const [userData, setUserData] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedRows, setSelectedRows] = useState([]);
  const [showMassiveUpdateModal, setShowMassiveUpdateModal] = useState(false);

  // Estados para búsqueda
  const [searchText, setSearchText] = useState("");
  const [filteredData, setFilteredData] = useState([]);
  const [matchingRows, setMatchingRows] = useState([]);
  const [currentMatchIndex, setCurrentMatchIndex] = useState(0);
  const [highlightedRowId, setHighlightedRowId] = useState(null);

  const fetchUserData = async () => {
    try {
      setLoading(true);

      // Obtener todos los usuarios
      const usersResponse = await oficinaMFSApi.get(`/users`);

      // Obtener todos los días en una sola llamada
      const daysResponse = await oficinaMFSApi.get(`/users/all-users-days`);
      const userDaysMap = daysResponse.data;

      // Combinar los datos
      const formattedData = usersResponse.data.map((user) => ({
        ...user,
        id: user.id,
        dias_presenciales: userDaysMap[user.id] || []
      }));

      setUserData(formattedData);
      setFilteredData(formattedData);
      setLoading(false);
    } catch (error) {
      console.error("Error al obtener los datos de los Empleados:", error);
      Swal.fire({
        background: localStorage.getItem("darkMode") === "true" ? '#212121' : '#FFFFFF',
        color: localStorage.getItem("darkMode") === "true" ? 'white' : 'black',
        icon: "error",
        title: "Error al obtener los datos",
        text: "Ha ocurrido un error al obtener los datos de los Empleados. Por favor, intenta nuevamente.",
      });
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserData();
  }, []);

  // Función de búsqueda actualizada
  const handleSearch = useCallback((value, dataSource = null) => {
    const sourceData = dataSource || userData;
    setSearchText(value);

    if (!value.trim()) {
      setFilteredData(sourceData);
      setMatchingRows([]);
      setCurrentMatchIndex(0);
      setHighlightedRowId(null);
      return;
    }

    // Detectar si la búsqueda tiene comillas
    const hasQuotes = /^["'](.*)["']$/.test(value.trim());
    const searchTerm = hasQuotes
      ? value.trim().slice(1, -1) // Remover comillas
      : value.toLowerCase();

    // Filtrar datos que coincidan con la búsqueda
    const filtered = sourceData.filter((row) => {
      return Object.values(row).some((val) => {
        if (val === null || val === undefined) return false;

        // Manejar arrays (enfermedades, alergias, dias_presenciales)
        if (Array.isArray(val)) {
          return val.some(item => {
            const itemStr = String(item);
            if (hasQuotes) {
              // Búsqueda exacta (case-sensitive con comillas)
              return itemStr === searchTerm;
            } else {
              // Búsqueda parcial (case-insensitive sin comillas)
              return itemStr.toLowerCase().includes(searchTerm);
            }
          });
        }

        const valStr = String(val);

        if (hasQuotes) {
          // Búsqueda exacta (case-sensitive con comillas)
          return valStr === searchTerm;
        } else {
          // Búsqueda parcial (case-insensitive sin comillas)
          return valStr.toLowerCase().includes(searchTerm);
        }
      });
    });

    setFilteredData(filtered);
    setMatchingRows(filtered.map(row => row.id));
    setCurrentMatchIndex(0);

    if (filtered.length > 0) {
      setHighlightedRowId(filtered[0].id);
    } else {
      setHighlightedRowId(null);
    }
  }, [userData]);

  // Navegar al siguiente resultado
  const handleNextMatch = useCallback(() => {
    if (matchingRows.length === 0) return;

    const nextIndex = (currentMatchIndex + 1) % matchingRows.length;
    setCurrentMatchIndex(nextIndex);
    setHighlightedRowId(matchingRows[nextIndex]);
  }, [matchingRows, currentMatchIndex]);

  // Navegar al resultado anterior
  const handlePreviousMatch = useCallback(() => {
    if (matchingRows.length === 0) return;

    const prevIndex = currentMatchIndex === 0
      ? matchingRows.length - 1
      : currentMatchIndex - 1;
    setCurrentMatchIndex(prevIndex);
    setHighlightedRowId(matchingRows[prevIndex]);
  }, [matchingRows, currentMatchIndex]);

  // Limpiar búsqueda
  const handleClearSearch = useCallback(() => {
    setSearchText("");
    setFilteredData(userData);
    setMatchingRows([]);
    setCurrentMatchIndex(0);
    setHighlightedRowId(null);
  }, [userData]);

  // Atajos de teclado
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ctrl/Cmd + F para enfocar búsqueda
      if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
        e.preventDefault();
        document.getElementById('search-input')?.focus();
      }

      // Enter para siguiente resultado (cuando el input de búsqueda está enfocado)
      if (e.key === 'Enter' && document.activeElement?.id === 'search-input') {
        e.preventDefault();
        if (e.shiftKey) {
          handlePreviousMatch();
        } else {
          handleNextMatch();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleNextMatch, handlePreviousMatch]);

  const handleOpenModalNewUser = () => {
    setShowModal(true);
  };

  const handleOpenUpdateUser = (user) => {
    setSelectedUser(user);
    setShowUpdateModal(true);
  };

  const handleMassiveEdit = () => {
    if (selectedRows.length > 1) {
      setShowMassiveUpdateModal(true);
    }
  };

  const formatArrayForGrid = (array) => {
    if (!Array.isArray(array)) return null;
    return (
      <div>
        {array.map((item, index) => (
          <Chip key={index} label={item} style={{ margin: "2px" }} />
        ))}
      </div>
    );
  };

  // Formato minimalista para días presenciales
  const formatDaysMinimalist = (days) => {
    if (!Array.isArray(days) || days.length === 0) {
      return (
        <span style={{ color: "#999", fontSize: "12px", fontStyle: "italic" }}>
          Sin asignar
        </span>
      );
    }

    const dayMap = {
      "Lunes": "L",
      "Martes": "M",
      "Miercoles": "X",
      "Jueves": "J",
      "Viernes": "V"
    };

    const abbreviatedDays = days.map(day => dayMap[day] || day.charAt(0)).join("/");
    const fullDays = days.join(", ");

    return (
      <Tooltip title={fullDays} arrow>
        <span style={{
          fontWeight: "600",
          fontSize: "13px",
          color: "#1976d2",
          cursor: "help",
          letterSpacing: "0.5px"
        }}>
          {abbreviatedDays}
        </span>
      </Tooltip>
    );
  };

  const formatArrayForExcel = (array) => {
    return Array.isArray(array) ? array.join(", ") : array;
  };

  const handleDeleteUser = async (user, nombres, apellidos) => {
    try {
      const token = dataDecrypt(localStorage.getItem("Token"));
      const config = {
        headers: {
          "x-access-token": token,
        },
      };

      const confirmResult = await Swal.fire({
        background: localStorage.getItem("darkMode") === "true" ? '#212121' : '#FFFFFF',
        color: localStorage.getItem("darkMode") === "true" ? 'white' : 'black',
        title: "¿Estás seguro?",
        html: `Esta acción desactivará y betará el acceso al usuari@ <b>${nombres} ${apellidos}</b>. ¿Estás seguro que deseas continuar?`,
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#FF0033",
        cancelButtonColor: "#29b6f6",
        confirmButtonText: "Sí, eliminar",
        cancelButtonText: "Cancelar",
      });

      if (confirmResult.isConfirmed) {
        await oficinaMFSApi.put(`/users/delete/${user.id}`, config);

        // Remover el usuario eliminado de la selección si estaba seleccionado
        setSelectedRows(prev => prev.filter(id => id !== user.id));

        fetchUserData();

        Swal.fire({
          background: localStorage.getItem("darkMode") === "true" ? '#212121' : '#FFFFFF',
          color: localStorage.getItem("darkMode") === "true" ? 'white' : 'black',
          icon: "success",
          title: "Usuario eliminado",
          html: `El usuari@ <b>${nombres} ${apellidos}</b> ha sido eliminado correctamente.`,
        });
      }
    } catch (error) {
      console.error("Error al eliminar el usuario:", error);

      Swal.fire({
        background: localStorage.getItem("darkMode") === "true" ? '#212121' : '#FFFFFF',
        color: localStorage.getItem("darkMode") === "true" ? 'white' : 'black',
        icon: "error",
        title: "Error al eliminar el usuario",
        text: "Ha ocurrido un error al eliminar el usuario. Por favor, intenta nuevamente.",
      });
    }
  };

  const handleExport = () => {
    if (!userData || userData.length === 0) {
      Swal.fire({
        background: localStorage.getItem("darkMode") === "true" ? '#212121' : '#FFFFFF',
        color: localStorage.getItem("darkMode") === "true" ? 'white' : 'black',
        icon: "info",
        title: "No hay datos para exportar",
        text: "No hay datos de Empleados para exportar a Excel.",
      });
      return;
    }

    const headers = [
      "Tipo de documento",
      "Documento",
      "Nombres",
      "Apellidos",
      "Correo",
      "Área",
      "Subárea",
      "Cargo",
      "Sangre",
      "Teléfono",
      "Patologias",
      "Alergias",
      "Contacto de emergencia",
      "Vinculo con el contacto de emergencia",
      "Número de contacto de emergancia",
      "Dirección",
      "Empresa",
      "EPS",
      "ARL",
      "Días Presenciales",
    ];

    const formattedData = userData.map((row) => {
      const formattedEnfermedades = formatArrayForExcel(row.enfermedades);
      const formattedAlergias = formatArrayForExcel(row.alergias);
      const formattedDias = formatArrayForExcel(row.dias_presenciales);

      return {
        "Tipo de documento": row.tipo_documento,
        Documento: row.documento,
        Nombres: row.nombres,
        Apellidos: row.apellidos,
        Correo: row.correo,
        Área: row.area,
        Subárea: row.subarea,
        Cargo: row.cargo,
        Sangre: row.sangre,
        Teléfono: row.telefono,
        Patologias: formattedEnfermedades,
        Alergias: formattedAlergias,
        "Contacto de emergencia": row.acudiente,
        "Vinculo con el contacto de emergencia": row.tipo_acudiente,
        "Número de contacto de emergancia": row.numero_acudiente,
        Dirección: row.direccion,
        Empresa: row.empresa,
        EPS: row.eps,
        ARL: row.arl,
        "Días Presenciales": formattedDias,
      };
    });

    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(formattedData, {
      header: headers,
    });

    const headerCellStyle = { font: { bold: true } };
    headers.forEach((header, index) => {
      const cellRef = XLSX.utils.encode_cell({ r: 0, c: index });
      worksheet[cellRef].s = headerCellStyle;
    });

    const columnWidths = headers.map((header) => ({
      wch: Math.max(
        header.length + 5,
        ...formattedData.map((row) => String(row[header]).length + 5)
      ),
    }));
    worksheet["!cols"] = columnWidths;

    const currentDate = new Date();
    const formattedDate = currentDate.toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });

    const fileName = `datos_empleados_${formattedDate}.xlsx`;
    XLSX.utils.book_append_sheet(workbook, worksheet, "Datos de empleados");
    XLSX.writeFile(workbook, fileName);

    Swal.fire({
      background: localStorage.getItem("darkMode") === "true" ? '#212121' : '#FFFFFF',
      color: localStorage.getItem("darkMode") === "true" ? 'white' : 'black',
      icon: "success",
      title: "Exportación exitosa",
      text: "Los datos de los empleados han sido exportados correctamente.",
    });
  };

  const columns = [
    { field: "tipo_documento", headerName: "Tipo de documento", width: 150 },
    { field: "documento", headerName: "Documento", width: 150 },
    { field: "nombres", headerName: "Nombres", width: 150 },
    { field: "apellidos", headerName: "Apellidos", width: 150 },
    { field: "correo", headerName: "Correo", width: 250 },
    { field: "empresa", headerName: "Empresa", width: 180 },
    { field: "area", headerName: "Área", width: 150 },
    { field: "subarea", headerName: "Subárea", width: 150 },
    { field: "cargo", headerName: "Cargo", width: 150 },
    { field: "brigadista", headerName: "Brigadista", width: 100 },
    {
      field: "dias_presenciales",
      headerName: "Días presenciales",
      width: 150,
      align: "center",
      headerAlign: "center",
      renderCell: (params) => formatDaysMinimalist(params.value),
    },
    { field: "sangre", headerName: "Sangre", width: 80 },
    { field: "telefono", headerName: "Teléfono", width: 150 },
    { field: "asiento", headerName: "Asiento designado", width: 150 },
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
      field: "acudiente",
      headerName: "Contacto de emergencia",
      width: 200,
    },
    {
      field: "tipo_acudiente",
      headerName: "Vinculo con el contacto de emergencia",
      width: 200,
    },
    {
      field: "numero_acudiente",
      headerName: "Número de contacto de emergencia",
      width: 150,
    },
    { field: "direccion", headerName: "Dirección", width: 200 },
    { field: "eps", headerName: "EPS", width: 150 },
    { field: "arl", headerName: "ARL", width: 120 },
    {
      field: "actions",
      headerName: "Acciones",
      width: 220,
      sortable: false,
      disableColumnMenu: true,
      renderCell: (params) => (
        <>
          <Button
            onClick={() => handleOpenUpdateUser(params.row)}
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
            onClick={() => handleDeleteUser(
              params.row,
              params.row.nombres,
              params.row.apellidos,
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
        <Skeleton variant="text" height={80} width={"31%"} />
        <div style={{ display: "flex", gap: "10px" }}>
          <Skeleton variant="text" height={40} width={"15%"} />
          <Skeleton variant="text" height={40} width={"15%"} />
        </div>
        <Skeleton variant="rounded" height={450} />
      </div>

      <div style={{ display: loading ? "none" : "block" }}>
        <h1 style={{ fontWeight: "bold" }}>Datos de los Empleados</h1>

        {/* Barra de búsqueda */}
        <div style={{ marginBottom: "16px", display: "flex", gap: "8px", alignItems: "center" }}>
          <TextField
            id="search-input"
            placeholder="Buscar en todas las columnas..."
            variant="outlined"
            size="small"
            value={searchText}
            onChange={(e) => handleSearch(e.target.value)}
            style={{ flex: 1, maxWidth: "500px" }}
            helperText={searchText.match(/^["'].*["']$/) ? "Búsqueda exacta activa" : ""}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
              endAdornment: searchText && (
                <InputAdornment position="end">
                  <IconButton size="small" onClick={handleClearSearch}>
                    <ClearIcon />
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />

          {matchingRows.length > 0 && (
            <>
              <span style={{ fontSize: "14px", color: "#666", whiteSpace: "nowrap" }}>
                {currentMatchIndex + 1} de {matchingRows.length}
              </span>
              <IconButton
                size="small"
                onClick={handlePreviousMatch}
                title="Anterior (Shift+Enter)"
              >
                <ArrowUpwardIcon />
              </IconButton>
              <IconButton
                size="small"
                onClick={handleNextMatch}
                title="Siguiente (Enter)"
              >
                <ArrowDownwardIcon />
              </IconButton>
            </>
          )}
        </div>

        <div style={{ marginBottom: "16px" }}>
          <Button
            style={{
              margin: "1%",
              backgroundColor: "#F45000",
              color: "white",
            }}
            startIcon={<AddIcon />}
            onClick={handleOpenModalNewUser}
            variant="contained"
            color="primary"
          >
            Crear empleado
          </Button>
          <Button
            style={{ margin: "1%" }}
            onClick={handleExport}
            startIcon={<DownloadIcon />}
            variant="contained"
            color="success"
          >
            Exportar a Excel
          </Button>
          <Button
            style={{ margin: "1%" }}
            onClick={handleMassiveEdit}
            startIcon={<EditIcon />}
            variant="contained"
            color="primary"
            disabled={selectedRows.length <= 1}
          >
            Edición masiva ({selectedRows.length})
          </Button>
          <Button
            style={{ margin: "1%" }}
            startIcon={<AssignmentIcon />}
            onClick={() => setShowAssignModal(true)}
            variant="contained"
            color="primary"
          >
            Asignar Días Presenciales
          </Button>
        </div>
      </div>
      <div style={{ height: "calc(100vh - 200px)", width: "100%", display: loading ? "none" : "block" }}>
        <DataGrid
          rows={filteredData}
          columns={columns}
          initialState={{
            pagination: {
              paginationModel: { pageSize: 100 }
            }
          }}
          pageSizeOptions={[5, 10, 20, 50, 100]}
          checkboxSelection
          disableRowSelectionOnClick
          keepNonExistentRowsSelected
          getRowHeight={() => "auto"}
          rowSelectionModel={selectedRows}
          onRowSelectionModelChange={(newSelection) => {
            setSelectedRows(newSelection);
          }}
          getRowClassName={(params) =>
            params.id === highlightedRowId ? 'highlighted-row' : ''
          }
          sx={{
            '& .highlighted-row': {
              backgroundColor: '#5d5332 !important',
              '&:hover': {
                backgroundColor: '#c69707 !important',
              },
            },
          }}
        />
      </div>

      <UserForm
        isOpen={showModal}
        setShow={setShowModal}
        fetchUserData={fetchUserData}
        userData={userData}
      />
      <UserUpdate
        isOpen={showUpdateModal}
        setShow={setShowUpdateModal}
        userId={selectedUser ? selectedUser.id : null}
        handleUpdateUser={fetchUserData}
        isRRHHView
      />
      <MassiveUserUpdate
        isOpen={showMassiveUpdateModal}
        setShow={setShowMassiveUpdateModal}
        selectedUserIds={selectedRows}
        handleUpdateUsers={fetchUserData}
      />
      <AssignDaysModal
        isOpen={showAssignModal}
        setShow={setShowAssignModal}
        userData={userData}
        onAssignmentComplete={fetchUserData}
      />
    </Container>
  );
}