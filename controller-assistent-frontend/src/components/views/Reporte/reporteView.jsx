import { useState, useEffect } from "react";
import oficinaMFSApi from "../../../api/oficinaMFSApi";
import Swal from "sweetalert2";
import { Container } from "react-bootstrap";
import { DataGrid } from "@mui/x-data-grid";
import { dataDecrypt } from "../../../util";
import DoneIcon from "@mui/icons-material/Done";
import { Button, Skeleton } from "@mui/material";
import Chip from "@mui/material/Chip";
import HistoryIcon from "@mui/icons-material/History";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import DownloadIcon from "@mui/icons-material/Download";
import moment from "moment";
import ReporteObjetos from "../Modals/ReporteModals/reporteObjetosHistorico";
import MenuItem from "@mui/material/MenuItem";
import FormControl from "@mui/material/FormControl";
import Select from "@mui/material/Select";
import InputLabel from "@mui/material/InputLabel";
import "./ReporteView.css";

export function ReporteView() {
  const [userData, setUserData] = useState([]);
  const [historyData, setHistoryData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(new Set());
  const [data, setData] = useState([]);
  const [reportes, setReportes] = useState([]);
  const [estadoHistorico, setHistorico] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [seleccion, setSeleccion] = useState(1);
  const [oldSelected, setOldSelected] = useState([]);

  let filtro = [];
  let filtrados = [];

  const swalConfig = {
    background: localStorage.getItem("darkMode") === "true" ? "#212121" : "#FFFFFF",
    color: localStorage.getItem("darkMode") === "true" ? "white" : "black",
  };

  const handleFiltro = (value) => {
    setReportes([]);
    setData([]);
    setSelected(new Set());
    setSeleccion(value);
    switch (value) {
      case 1:
        filtro = [];
        fetchReporteData();
        break;
      case 2:
        filtro = ["Pantalla", "Teclado", "Mouse", "Hub adaptador USB", "Cable de video HDMI"];
        fetchReporteData();
        break;
      case 3:
        filtro = ["Descansa pies", "Silla", "Otros"];
        fetchReporteData();
        break;
      default:
        break;
    }
  };

  const handleHistory = () => {
    setHistorico(!estadoHistorico);
    if (estadoHistorico) {
      fetchReporteData();
    } else {
      fetchHistoryData();
    }
  };

  const formatArray = (array, index) => {
    const objetos = array.objetos || [];
    if (!estadoHistorico) {
      const reporte = [...reportes];
      if (!reporte.some((r) => r.index === index)) {
        reporte.push({ index, array });
        setReportes(reporte);
      }
      return (
        <div>
          {objetos.map((item, subindex) => (
            <Chip
              key={index + subindex}
              label={`${item.objeto} (${item.tipo}) `}
              variant={selected.has((index + subindex).toString()) ? "filled" : "outlined"}
              color={selected.has((index + subindex).toString()) ? "success" : "default"}
              className="reporte-chip"
              onClick={() => handleSelect((index + subindex).toString(), item, array)}
              onDelete={() => handleDeleteReport(item, array)}
              deleteIcon={<DoneIcon />}
            />
          ))}
        </div>
      );
    } else {
      return (
        <div>
          {objetos.map((item, subindex) => (
            <Chip
              key={subindex}
              label={`${item.objeto} (${item.tipo}) ( ${item.estado} )`}
              variant="outlined"
              className="reporte-chip"
            />
          ))}
        </div>
      );
    }
  };

  const filtrarData = (dataObjetos) =>
    dataObjetos.map((item) => ({
      ...item,
      objetos: item.objetos.filter((obj) => filtro.includes(obj.objeto)),
    }));

  const fetchReporteData = async () => {
    setLoading(true);
    try {
      const token = dataDecrypt(localStorage.getItem("Token"));
      const config = { headers: { "x-access-token": token } };
      const response = await oficinaMFSApi.get(`/observacion`, config);
      if (response.status === 200 && response.data.data) {
        const formattedData = response.data.data.map((row) => ({
          ...row,
          id: row.id,
          usuarioReportante: row.nombre_reportante || "Desconocido",
        }));
        if (filtro.length !== 0) {
          filtrados = filtrarData(formattedData).filter(
            (row) => row.objetos.length > 0
          );
        } else {
          filtrados = formattedData;
        }
        setUserData(filtrados);
      } else if (response.status === 404) {
        Swal.fire({
          ...swalConfig,
          icon: "info",
          title: "No se encontraron reportes activos",
          text: "No hay reportes activos disponibles en este momento.",
        });
      }
    } catch (error) {
      console.error("Error al obtener los datos de los Reportes:", error);
      Swal.fire({
        ...swalConfig,
        icon: "error",
        title: "Error al obtener los datos",
        text: "Ha ocurrido un error. Por favor, intenta nuevamente.",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchHistoryData = async () => {
    setLoading(true);
    try {
      const token = dataDecrypt(localStorage.getItem("Token"));
      const config = { headers: { "x-access-token": token } };
      const response = await oficinaMFSApi.get(`/observacion/all`, config);
      if (response.status === 200 && response.data.data) {
        const formattedData = response.data.data.map((row) => ({
          ...row,
          id: row.id,
          nombre_reportante: row.nombre_reportante || "Desconocido",
        }));
        setHistoryData(formattedData);
      } else if (response.status === 404) {
        Swal.fire({
          ...swalConfig,
          icon: "info",
          title: "No se encontraron reportes activos",
          text: "No hay reportes activos disponibles en este momento.",
        });
      }
    } catch (error) {
      console.error("Error al obtener los datos de los Reportes:", error);
      Swal.fire({
        ...swalConfig,
        icon: "error",
        title: "Error al obtener los datos",
        text: "Ha ocurrido un error. Por favor, intenta nuevamente.",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReporteData();
    fetchHistoryData();
  }, []);

  const columns = [
    { field: "asiento_reportado", headerName: "Silla reportada", width: 140 },
    {
      field: "objetos",
      headerName: "Objetos Reportados",
      width: 240,
      renderCell: (params) => formatArray(params.row, params.row.id),
    },
    { field: "observaciones", headerName: "Observaciones", width: 240 },
    {
      field: "fecha",
      headerName: "Fecha Reportada",
      width: 190,
      valueGetter: (params) =>
        moment(params.value).format("DD [de] MMMM [del] YYYY"),
    },
    {
      field: "nombre_reportante",
      headerName: "Usuario Reportante",
      width: 250,
    },
  ];

  function handleSelect(id, item, array) {
    const newSet = new Set(selected);
    let newData = [...data];
    if (newSet.has(id)) {
      newSet.delete(id);
      newData = newData.filter((n) => n.itemData !== item);
    } else {
      newSet.add(id);
      newData.push({ itemData: item, reportData: array });
    }
    setData(newData);
    setSelected(newSet);
  }

  const handleGridSelect = (selectedIndex) => {
    const newSelectedSet = new Set(selected);
    let newData = [...data];

    selectedIndex.forEach((index) => {
      reportes.forEach((r) => {
        if (r.index.toString() === index.toString()) {
          r.array.objetos.forEach((item, subindex) => {
            const combinedIndex = (index + subindex).toString();
            if (!newSelectedSet.has(combinedIndex)) {
              newSelectedSet.add(combinedIndex);
              newData.push({ itemData: item, reportData: r.array });
            }
          });
        }
      });
      setData(newData);
      setSelected(newSelectedSet);
    });

    const unselectedRows = [...oldSelected].filter(
      (idx) => ![...selectedIndex].includes(idx)
    );
    reportes.forEach((r) => {
      if (r.index === unselectedRows[0]) {
        r.array.objetos.forEach((item, subindex) => {
          const combinedIndex = (unselectedRows[0] + subindex).toString();
          if (newSelectedSet.has(combinedIndex)) {
            newSelectedSet.delete(combinedIndex);
            newData = newData.filter((n) => n.itemData !== item);
          }
        });
      }
      setData(newData);
      setSelected(newSelectedSet);
    });

    setOldSelected([...selectedIndex]);
  };

  const handleDeleteReport = async (item, row) => {
    const result = await Swal.fire({
      ...swalConfig,
      title: "¿Estás seguro?",
      html: `¿Quieres marcar el reporte del siguiente objeto <strong>${item.objeto}</strong> en la silla <strong>${row.asientoReportado}</strong> como resuelto?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Sí, marcar como resuelto",
    });

    if (result.isConfirmed) {
      try {
        const token = dataDecrypt(localStorage.getItem("Token"));
        const config = { headers: { "x-access-token": token } };
        const response = await oficinaMFSApi.put(
          `/observacion/${row.id}/${item.objeto}`,
          { "item.estado": "resuelto" },
          config
        );
        if (response.status === 200) {
          Swal.fire("¡Hecho!", "El reporte ha sido marcado como resuelto.", "success");
          fetchReporteData();
        } else {
          Swal.fire("Error", "No se pudo marcar el reporte como resuelto. Intenta nuevamente.", "error");
        }
      } catch (error) {
        console.error("Error al actualizar el estado del reporte:", error);
        Swal.fire("Error", "Hubo un error al actualizar el estado del reporte.", "error");
      }
    }
  };

  const handleDeleteMultipleReports = async () => {
    const result = await Swal.fire({
      ...swalConfig,
      title: "¿Estás seguro?",
      html: `¿Quieres marcar (${data.length}) objetos como resueltos?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Sí, marcar como resuelto",
    });

    if (result.isConfirmed) {
      data.forEach(async (element) => {
        try {
          const token = dataDecrypt(localStorage.getItem("Token"));
          const config = { headers: { "x-access-token": token } };
          const response = await oficinaMFSApi.put(
            `/observacion/${element.reportData.id}/${element.itemData.objeto}`,
            { "item.estado": "resuelto" },
            config
          );
          if (response.status === 200) {
            Swal.fire("¡Hecho!", "El reporte ha sido marcado como resuelto.", "success");
            fetchReporteData();
            const newSet = new Set(selected);
            newSet.clear();
            setSelected(newSet);
            setData([]);
          } else {
            Swal.fire("Error", "No se pudo marcar el reporte como resuelto. Intenta nuevamente.", "error");
          }
        } catch (error) {
          console.error("Error al actualizar el estado del reporte:", error);
          Swal.fire("Error", "Hubo un error al actualizar el estado del reporte.", "error");
        }
      });
    }
  };

  const handleOpenModal = () => setShowModal(true);

  return (
    <Container>
      {loading ? (
        <Skeleton variant="rounded" height={450} />
      ) : (
        <div>
          <div>
            <h1 className="reporte-title">Datos de los Reportes Activos</h1>
          </div>
          <div className="reporte-toolbar">
            <div className="reporte-filter-wrapper">
              {!estadoHistorico && (
                <FormControl fullWidth>
                  <InputLabel id="area">Filtrar por área</InputLabel>
                  <Select
                    labelId="area"
                    id="area"
                    label="area"
                    value={seleccion}
                    onChange={(event) => handleFiltro(event.target.value)}
                  >
                    <MenuItem value={1}>Mostrar Todo</MenuItem>
                    <MenuItem value={2}>TI</MenuItem>
                    <MenuItem value={3}>RRHH</MenuItem>
                  </Select>
                </FormControl>
              )}
            </div>

            {!!selected.size && (
              <Button
                className="reporte-btn"
                startIcon={<DoneIcon />}
                onClick={handleDeleteMultipleReports}
                variant="contained"
                color="success"
              >
                Resolver reportes seleccionados
              </Button>
            )}

            {estadoHistorico && (
              <Button
                className="reporte-btn"
                startIcon={<DownloadIcon />}
                onClick={handleOpenModal}
                variant="contained"
                color="info"
              >
                Descargar Reporte
              </Button>
            )}

            <Button
              className="reporte-btn"
              startIcon={estadoHistorico ? <ArrowBackIcon /> : <HistoryIcon />}
              onClick={handleHistory}
              variant="contained"
              color="info"
            >
              {estadoHistorico ? "Reportes activos" : "Historico de reportes"}
            </Button>
          </div>

          <ReporteObjetos isOpen={showModal} setShow={setShowModal} />

          <div className="reporte-datagrid-container" style={{ height: "calc(100vh - 200px)", width: "100%" }}>
            <DataGrid
              rows={estadoHistorico ? historyData : userData}
              getRowHeight={() => "auto"}
              columns={columns}
              checkboxSelection={!estadoHistorico}
              disableRowSelectionOnClick
              onRowSelectionModelChange={(params) => handleGridSelect(params)}
            />
          </div>
        </div>
      )}
    </Container>
  );
}