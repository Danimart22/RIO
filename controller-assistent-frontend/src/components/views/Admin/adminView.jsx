import { useState, useEffect } from "react";
import oficinaMFSApi from "../../../api/oficinaMFSApi";
import Swal from "sweetalert2";
import { Container } from "react-bootstrap";
import { Button } from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import UserUpdate from "../Modals/UpdateModals/userUpdate";
import { dataDecrypt } from "../../../util";
import Chip from "@mui/material/Chip";
import DownloadIcon from "@mui/icons-material/Download";
import Skeleton from "@mui/material/Skeleton";
import EditIcon from "@mui/icons-material/Edit";
import * as XLSX from "xlsx";
import "./AdminView.css";

export function AdminView() {
  const [userData, setUserData] = useState([]);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchUserData = async () => {
    try {
      const token = dataDecrypt(localStorage.getItem("Token"));
      const config = {
        headers: {
          "x-access-token": token,
        },
      };

      const response = await oficinaMFSApi.get(`/users/all`, config);
      const data = response.data;
      const formattedData = data.map((row) => ({
        ...row,
        id: row._id,
      }));
      setUserData(formattedData);
      setLoading(false);
    } catch (error) {
      console.error("Error al obtener los datos de los Empleados:", error);
      Swal.fire({
        background: localStorage.getItem("darkMode") === "true" ? "#212121" : "#FFFFFF",
        color: localStorage.getItem("darkMode") === "true" ? "white" : "black",
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

  const handleOpenUpdateUser = async (user) => {
    setSelectedUser(user);
    setShowUpdateModal(true);
    if (!user.enfermedades || !user.alergias) {
      try {
        const response = await oficinaMFSApi.get(`/users/${user._id}`);
        const userData = response.data;
        setSelectedUser(userData);
      } catch (error) {
        console.error("Error al obtener los datos del usuario:", error);
      }
    }
  };

  const handleExport = () => {
    if (!userData || userData.length === 0) {
      Swal.fire({
        background: localStorage.getItem("darkMode") === "true" ? "#212121" : "#FFFFFF",
        color: localStorage.getItem("darkMode") === "true" ? "white" : "black",
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
      "Estado del usuario",
      "Roles",
    ];

    const formattedData = userData.map((row) => {
      const roleNames = row.roles.map((role) => role.nombre);
      const formattedRoles = formatArrayForExcel(roleNames.join(", "));

      return {
        "Tipo de documento": row.tipo_documento,
        Documento: row.documento,
        Nombres: row.nombres,
        Apellidos: row.apellidos,
        Correo: row.correo,
        "Estado del usuario": row.estado,
        Roles: formattedRoles,
      };
    });

    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(formattedData, { header: headers });

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

    const fileName = `datos_usuarios_${formattedDate}.xlsx`;
    XLSX.utils.book_append_sheet(workbook, worksheet, "Datos de usuarios");
    XLSX.writeFile(workbook, fileName);

    Swal.fire({
      background: localStorage.getItem("darkMode") === "true" ? "#212121" : "#FFFFFF",
      color: localStorage.getItem("darkMode") === "true" ? "white" : "black",
      icon: "success",
      title: "Exportación exitosa",
      text: "Los datos de los usuarios han sido exportados correctamente.",
    });
  };

  const formatArrayForExcel = (array) => {
    return Array.isArray(array) ? array.join(", ") : array;
  };

  const capitalize = (str) => {
    if (str === str.toUpperCase()) return str;
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  };

  const formatArray = (array) => {
    return (
      <div>
        {array.map((item) => (
          <Chip
            key={item._id}
            label={capitalize(item.nombre)}
            className="admin-chip"
          />
        ))}
      </div>
    );
  };

  const columns = [
    { field: "tipo_documento", headerName: "Tipo de documento", width: 140 },
    { field: "documento", headerName: "Documento", width: 120 },
    { field: "nombres", headerName: "Nombres", width: 140 },
    { field: "apellidos", headerName: "Apellidos", width: 140 },
    { field: "correo", headerName: "Correo", width: 240 },
    { field: "estado", headerName: "Estado", width: 100 },
    {
      field: "roles",
      headerName: "Roles",
      width: 300,
      renderCell: (params) => formatArray(params.value),
    },
    {
      field: "actions",
      headerName: "Acciones",
      width: 170,
      sortable: false,
      disableColumnMenu: true,
      renderCell: (params) => (
        <>
          <Button
            onClick={() => handleOpenUpdateUser(params.row)}
            className="admin-edit-button"
            variant="contained"
            color="primary"
            startIcon={<EditIcon />}
          >
            Editar
          </Button>
        </>
      ),
    },
  ];

  return (
    <Container>
      <div className="admin-skeleton-container" style={{ display: loading ? "block" : "none" }}>
        <Skeleton variant="text" height={80} width={"31%"} />
        <div className="admin-skeleton-buttons">
          <Skeleton variant="text" height={40} width={"15%"} />
          <Skeleton variant="text" height={40} width={"15%"} />
        </div>
        <Skeleton variant="rounded" height={450} />
      </div>
      <div className="admin-content" style={{ display: loading ? "none" : "block" }}>
        <h1>Datos de los Usuarios</h1>
        <Button
          className="admin-export-button"
          onClick={handleExport}
          startIcon={<DownloadIcon />}
          variant="contained"
          color="success"
        >
          Exportar a Excel
        </Button>
        <div className="admin-datagrid-container" style={{ height: "calc(100vh - 200px)", width: "100%"}}>
          <DataGrid
            rows={userData}
            getRowHeight={() => "auto"}
            columns={columns}
            checkboxSelection
            disableRowSelectionOnClick
          />
        </div>
      </div>
      <UserUpdate
        isOpen={showUpdateModal}
        setShow={setShowUpdateModal}
        userId={selectedUser ? selectedUser._id : null}
        handleUpdateUser={fetchUserData}
        isAdminView
      />
    </Container>
  );
}