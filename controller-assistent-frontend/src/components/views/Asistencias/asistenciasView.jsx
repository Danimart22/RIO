import { useState, useEffect } from "react";
import oficinaMFSApi from "../../../api/oficinaMFSApi";
import { DataGrid } from "@mui/x-data-grid";
import { Container } from "react-bootstrap";
import moment from "moment";
import "moment-timezone";
import "moment/locale/es";
import { dataDecrypt } from "../../../util";
import Skeleton from "@mui/material/Skeleton";
import { compareAsc } from "date-fns";
import "./AsistenciasViews.css";

moment.tz.setDefault("America/Bogota");

export function AsistenciasViews() {
  const [nombre, setNombre] = useState("");
  const [loading, setLoading] = useState(true);
  const [asientoReservado, setAsiento] = useState("");
  const [filteredData, setFilteredData] = useState([]);
  const [sortModel, setSortModel] = useState([
    { field: "fechaReserva", sort: "desc" },
  ]);

  useEffect(() => {
    const id = dataDecrypt(localStorage.getItem("id"));
    const nombreGuardado = dataDecrypt(localStorage.getItem("nombre"));

    if (id) {
      fetchData(id);
    }
    if (nombreGuardado) {
      setNombre(nombreGuardado);
    } else {
      setNombre("Nombre Predeterminado");
    }
  }, []);

  moment.locale("es");

  const fetchData = async (id) => {
    try {
      const response = await oficinaMFSApi.get(`/oficina/asistencia/${id}`);
      const responseData = response.data.reservas.map((reserva) => ({
        ...reserva,
        fechaReserva: moment.utc(reserva.fechaReserva).local().format(),
        _fechaOrden: moment.utc(reserva.fechaReserva).local().format("YYYY-MM-DD"),
      }));
      responseData.forEach((reserva) => {
        if (
          moment.utc(reserva.fechaReserva).format("YYYY-MM-DD") ===
          moment().tz("America/Bogota").format("YYYY-MM-DD")
        ) {
          setAsiento(reserva.numeroSilla);
        }
      });
      setFilteredData(responseData);
      setLoading(false);
    } catch (error) {
      console.log(error);
      setLoading(false);
    }
  };

  const getRowId = (row) => row.id;

  const handleSortModelChange = (newSortModel) => {
    setSortModel(newSortModel);
    if (newSortModel.length > 0) {
      const sortField = newSortModel[0].field;
      const sortDirection = newSortModel[0].sort;
      if (sortField === "_fechaOrden" && sortDirection) {
        const sortedData = [...filteredData].sort((a, b) => {
          const dateA = new Date(a._fechaOrden);
          const dateB = new Date(b._fechaOrden);
          return sortDirection === "asc"
            ? compareAsc(dateA, dateB)
            : compareAsc(dateB, dateA);
        });
        setFilteredData(sortedData);
      }
    }
  };

  const columns = [
    {
      field: "fechaReserva",
      headerName: "Fecha reservadas",
      sortable: true,
      flex: 1,
      minWidth: 200,
      headerAlign: "center",
      align: "center",
      valueFormatter: (params) =>
        moment(params.value).format("DD [de] MMMM [del] YYYY"),
    },
    {
      field: "numeroSilla",
      headerName: "Número de Silla",
      sortable: true,
      width: 150,
      align: "center",
      headerAlign: "center",
    },
    {
      field: "horaLlegada",
      headerName: "Horas de Llegada",
      sortable: false,
      flex: 1,
      minWidth: 200,
      headerAlign: "center",
      align: "center",
      renderCell: (params) => {
        const list = [...params.row.horaLlegada].sort();
        return (
          <div className="asistencias-cell-scroll">
            <ul className="time-list">
              {list.map((hora, index) => (
                <li key={index}>{hora}</li>
              ))}
            </ul>
          </div>
        );
      },
    },
    {
      field: "horaSalida",
      headerName: "Horas de Salida",
      headerAlign: "center",
      align: "center",
      flex: 1,
      minWidth: 200,
      sortable: false,
      disableColumnMenu: true,
      renderCell: (params) => {
        const list = [...params.row.horaSalida].sort();
        return (
          <div className="asistencias-cell-scroll">
            <ul className="time-list">
              {list.map((hora, index) => (
                <li key={index}>{hora}</li>
              ))}
            </ul>
          </div>
        );
      },
    },
  ];

  return (
    <Container>
      <div className="asistencias-skeleton-container" style={{ display: loading ? "block" : "none" }}>
        <Skeleton variant="text" height={80} width={"42%"} />
        <div className="asistencias-skeleton-buttons">
          <Skeleton variant="text" height={50} width={"10%"} />
        </div>
        <Skeleton variant="rounded" height={450} />
      </div>

      <div className="asistencias-content" style={{ display: loading ? "none" : "block" }}>
        <h1>Asistencias de {nombre}</h1>
        <div className="container">
          <div className="asistencias-datagrid-wrapper" style={{ height: "calc(100vh - 200px)", width: "100%"}}>
            <DataGrid
              rows={filteredData}
              columns={columns}
              getRowId={getRowId}
              pagination
              checkboxSelection
              getRowHeight={() => "auto"}
              getEstimatedRowHeight={() => 150}
              rowsPerPageOptions={[10, 20, 50]}
              disableSelectionOnClick
              sortModel={sortModel}
              onSortModelChange={handleSortModelChange}
              sx={{
                "& .MuiDataGrid-virtualScroller": { overflowX: "hidden" },
                "& .MuiDataGrid-cell": {
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  padding: 0,
                },
              }}
              autoWidth
            />
          </div>
        </div>
      </div>
    </Container>
  );
}