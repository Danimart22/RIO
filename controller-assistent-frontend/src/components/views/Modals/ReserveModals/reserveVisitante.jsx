import { useState, useEffect } from "react";
import { Button, TextField, Grid, Typography } from "@mui/material";
import oficinaMFSApi from "../../../../api/oficinaMFSApi";
import Autocomplete from "@mui/material/Autocomplete";
import SaveAltIcon from "@mui/icons-material/SaveAlt";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { DatePicker, TimePicker } from "antd";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore";
import isSameOrAfter from "dayjs/plugin/isSameOrAfter";
import Swal from "sweetalert2";
import "moment/locale/es";
import { Modal, Form, Row, Col } from "antd";
import AddIcon from "@mui/icons-material/Add";
import VisitanteForm from "../VisitanteFormModals/visitanteForm";
import { dataDecrypt } from "../../../../util";
import dayjs from "dayjs";
import { ReactComponent as MapaSVG } from '../../../../assets/images/mapa.svg';
import { ReactComponent as MapaClaroSVG } from '../../../../assets/images/mapaClaro.svg';
import SquareRoundedIcon from "@mui/icons-material/SquareRounded";
import holidaysColombia from 'festivos-colombianos';
import { useNavigate } from "react-router-dom";
import { getENV } from "../../../../config/env";
const id = dataDecrypt(localStorage.getItem("id"));

export default function ReserveVisitante({ isOpen, setShow, darkMode, fetchData }) {
  const { HORA_LIMITE_RESERVA } = getENV();
  const [HoraEntrada, setHoraEntrada] = useState(null);
  const [horaSalida, setHoraSalida] = useState(null);
  const [selectedVisitante, setSelectedVisitante] = useState();
  const [visitantesData, setVisitantesData] = useState([]);
  const [fechaReserva, setFechaReserva] = useState();
  const [responsables, setResponsables] = useState([]);
  const [selectedResponsable, setSelectedResponsable] = useState(null);
  const [motivo, setMotivo] = useState("");
  const [acudiente, setAcudiente] = useState("");
  const [tipoAcudiente, setTipoAcudiente] = useState("");
  const [numeroAcudiente, setNumeroAcudiente] = useState("");
  const [showModalVisitante, setShowModalVisitante] = useState(false);
  const [form] = Form.useForm();
  const [sillasReservadas, setSillasReservadas] = useState([]);
  const [reservedDays, setReservedDays] = useState({ reservas: [] });
  const [puestoSeleccionado, setPuestoSeleccionado] = useState(null);
  const rol = dataDecrypt(localStorage.getItem("Rol"));
  const seatPass = dataDecrypt(localStorage.getItem("seatPass"));
  const [step, setStep] = useState(1);
  const navigate = useNavigate();
  dayjs.extend(isSameOrBefore);
  dayjs.extend(isSameOrAfter);
  const setHoliday = () => {
    const holidayFormatted = holidaysColombia(new Date().getFullYear());
    return holidayFormatted.map((z) => `${String(z.holiday).split("-")[2]}/${z.holiday.split("-")[1]}`);
  };
  const holidays = setHoliday();

  const handleOpenModalNewVisitante = () => setShowModalVisitante(true);

  // ============= useEffect 1: Cargar visitantes y responsables =============
  useEffect(() => {
    const fetchVisitantes = async () => {
      try {
        const response = await oficinaMFSApi.get("/visitantes/");
        setVisitantesData(response.data);
      } catch (error) {
        console.error("Error buscando visitantes:", error);
      }
    };

    const fetchResponsables = async () => {
      try {
        const response = await oficinaMFSApi.get("/users/responsables");
        setResponsables(response.data);
      } catch (error) {
        console.error("Error fetching responsables:", error);
      }
    };

    if (isOpen) {
      fetchVisitantes();
      fetchResponsables();
    }
  }, [isOpen]);

  // ============= useEffect 2: Cargar reservas del visitante =============
  useEffect(() => {
    const fetchReservedDays = async () => {
      if (!selectedVisitante || !selectedVisitante.id) {
        setReservedDays({ reservas: [] });
        return;
      }

      try {
        const response = await oficinaMFSApi.get(`/oficina/reserva/${id}`);
        console.log("=== RESERVAS DEL VISITANTE ===", response.data);
        setReservedDays(response.data);
      } catch (error) {
        console.error("Error fetching reserved days:", error);
        setReservedDays({ reservas: [] });
      }
    };

    if (isOpen && selectedVisitante) {
      fetchReservedDays();
    } else if (isOpen && !selectedVisitante) {
      setReservedDays({ reservas: [] });
    }
  }, [isOpen, selectedVisitante]);

  // ============= useEffect 3: Cargar sillas reservadas cuando cambia fecha =============
  useEffect(() => {
    const loadSillasReservadas = async () => {
      if (!fechaReserva || !fechaReserva.isValid || !fechaReserva.isValid()) {
        setSillasReservadas([]);
        return;
      }

      try {
        const formattedDate = fechaReserva.format("YYYY-MM-DD");
        console.log("Cargando sillas para fecha:", formattedDate);
        const response = await oficinaMFSApi.get(`/oficina/sillasReservadas/${formattedDate}`);
        setSillasReservadas(response.data);
      } catch (error) {
        console.error("Error al cargar sillas reservadas:", error);
        setSillasReservadas([]);
      }
    };

    if (fechaReserva) {
      loadSillasReservadas();
    }
  }, [fechaReserva]);

  // ============= useEffect 4: Aplicar estilos al mapa de sillas =============
  useEffect(() => {
    const puestosGerente = [19, 20, 23, 30, 33, 42, 45, 48, 53, 56, 61, 66, 78];

    if (rol !== null) {
      if (rol.includes("gerente")) {
        for (let i = 1; i <= 81; i++) {
          const id = `p-${i}`;
          const rect = document.getElementById(id);
          if (puestosGerente.includes(i) && rect) {
            rect.classList.add("btn-puesto");
          }
        }
      } else if (rol.includes("empleado")) {
        puestosGerente.forEach((seatNumber) => {
          const rect = document.getElementById(`p-${seatNumber}`);
          if (rect) {
            rect.id = "";
          }
        });
      }

      // Aplicar estilos de ocupado/disponible
      for (let i = 1; i <= 81; i++) {
        const id = `p-${i}`;
        const rect = document.getElementById(id);
        if (rect) {
          if (sillasReservadas.includes(i)) {
            rect.classList.add("puesto-ocupado");
          } else {
            rect.classList.remove("puesto-ocupado");
          }
          rect.classList.remove("puesto-seleccionado");
        }
      }
    }

    // Marcar puesto seleccionado
    if (puestoSeleccionado) {
      const rect = document.getElementById(`p-${puestoSeleccionado}`);
      if (rect) {
        rect.classList.add("puesto-seleccionado");
      }
    }
  }, [sillasReservadas, puestoSeleccionado, rol]);

  const handleSaveVisitante = async () => {
    if (!fechaReserva || !HoraEntrada || !horaSalida) {
      Swal.fire({
        background: localStorage.getItem("darkMode") === "true" ? "#212121" : "#FFFFFF",
        color: localStorage.getItem("darkMode") === "true" ? "white" : "black",
        icon: "error",
        title: "Datos incompletos",
        text: "Debe seleccionar la fecha, la hora de entrada y la hora de salida del visitante.",
      });
      return;
    }

    if (horaSalida.isSameOrBefore(HoraEntrada)) {
      Swal.fire({
        icon: "error",
        title: "Horario inválido",
        text: "La hora de salida debe ser mayor que la hora de entrada.",
      });
      return;
    }


    try {
      const reservaData = {
        fechaReserva: fechaReserva.format("YYYY-MM-DD"),
        responsable_mobilize: `${selectedResponsable.nombres} ${selectedResponsable.apellidos}`,
        motivo,
        acudiente,
        tipo_acudiente: tipoAcudiente,
        numero_acudiente: numeroAcudiente,
      };

      setStep(3);
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Ha ocurrido un error al guardar la visita.",
      });
    }
  };

  const handleSave = async () => {
    if (!fechaReserva || !HoraEntrada || !horaSalida) {
      Swal.fire({
        icon: "error",
        title: "Datos incompletos",
        text: "Debe seleccionar fecha, hora de entrada y hora de salida.",
      });
      return;
    }
    if (!selectedVisitante) {
      Swal.fire({
        background: localStorage.getItem("darkMode") === "true" ? '#212121' : '#FFFFFF',
        color: localStorage.getItem("darkMode") === "true" ? 'white' : 'black',
        icon: "error",
        title: "Error",
        text: "Debe seleccionar un visitante antes de continuar.",
      });
      return;
    }

    const reservaData = {
      fechaReserva: fechaReserva.format("YYYY-MM-DD"),
      hora_llegada: HoraEntrada.format("HH:mm"),
      hora_salida: horaSalida.format("HH:mm"),
      responsable_mobilize: `${selectedResponsable.nombres} ${selectedResponsable.apellidos}`,
      motivo,
      acudiente,
      tipo_acudiente: tipoAcudiente,
      numero_acudiente: numeroAcudiente,
      numeroSilla: puestoSeleccionado,
    };

    try {
      const response = await oficinaMFSApi.post(
        `/visitantes/${selectedVisitante.id}`,
        reservaData
      );

      if (response.status === 201) {
        Swal.fire({
          background: localStorage.getItem("darkMode") === "true" ? '#212121' : '#FFFFFF',
          color: localStorage.getItem("darkMode") === "true" ? 'white' : 'black',
          icon: "success",
          title: "Reserva creada",
          html: `La reserva para el visitante <b>${selectedVisitante.nombres} ${selectedVisitante.apellidos}</b> fue creada correctamente.`,
        }).then(() => {
          if (fetchData) fetchData();
          navigate("/reservas");
        });

        setSelectedVisitante(null);
        setSelectedResponsable("");
        setMotivo("");
        setAcudiente("");
        setTipoAcudiente("");
        setNumeroAcudiente("");
      }
    } catch (error) {
      Swal.fire({
        background: localStorage.getItem("darkMode") === "true" ? '#212121' : '#FFFFFF',
        color: localStorage.getItem("darkMode") === "true" ? 'white' : 'black',
        icon: "error",
        title: "Error",
        text: error.response?.data?.message || "Ha ocurrido un error al guardar la reserva.",
      });
    } finally {
      form.resetFields();
      setShow(false);
    }
    navigate("/reservas")
    window.location.reload();
  };

  const handleForm1Submit = (event) => {
    if (!selectedVisitante) {
      event.preventDefault();
      Swal.fire({
        background: localStorage.getItem("darkMode") === "true" ? '#212121' : '#FFFFFF',
        color: localStorage.getItem("darkMode") === "true" ? 'white' : 'black',
        icon: "error",
        title: "Error",
        text: "Debe seleccionar un visitante antes de continuar.",
      });
    } else {
      setStep(2);
    }
  };

  const handleClose = () => {
    setShow(false);
  };

  // ============= dateRender: Mostrar indicador de fechas reservadas =============
  const dateRender = (current) => {
    return (
      <div className="ant-picker-cell-inner">
        {current.date()}
        {reservedDays?.reservas?.some((day) => {
          const today = dayjs().startOf("day");
          const reservationDate = dayjs(day.fechaReserva).startOf('day');
          return reservationDate.isSame(current, "day") &&
            (reservationDate.isSame(today, 'day') || reservationDate.isAfter(today, 'day'));
        }) && (
            <div className="circulo-indicador-calendario" />
          )}
      </div>
    );
  };

  const handleClick = (e) => {
    const id = e.target.id;
    if (sillasReservadas.includes(parseInt(id.substring(2)))) {
      return;
    }

    try {
      if (id.startsWith("p-")) {
        if (puestoSeleccionado === id.substring(2)) {
          setPuestoSeleccionado(null);
        } else {
          handleSeatChange(id.substring(2));
        }
      }
    } catch (error) {
      console.error("Error en handleClick:", error);
    }
  };

  const handleSeatChange = async (seatNumber) => {
    const reports = await checkSeatReport(seatNumber);

    if (reports && reports.length > 0) {
      const reportDetails = reports.map(report =>
        `-(Objetos: ${report.objetos.map(item => item.objeto + " (" + item.tipo + ") ").join(", ")}`
      ).join("<br><br>");

      const result = await Swal.fire({
        background: localStorage.getItem("darkMode") === "true" ? '#212121' : '#FFFFFF',
        color: localStorage.getItem("darkMode") === "true" ? 'white' : 'black',
        title: 'Atención',
        html: `El asiento N° <strong>${seatNumber}</strong> tiene un reporte con los siguientes Objetos:<br><strong>${reportDetails}</strong>. <br><br><mark>Si aceptas reservarlo considera utilizar tus propios elementos mientras el área encargada resuelve el problema.</mark>`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Aceptar',
        cancelButtonText: 'Cancelar',
      });

      if (result.isConfirmed) {
        setPuestoSeleccionado(seatNumber);
      } else {
        setPuestoSeleccionado(null);
      }
    } else {
      setPuestoSeleccionado(seatNumber);
    }
  };

  const checkSeatReport = async (seatNumber) => {
    try {
      const response = await oficinaMFSApi.get(`/observacion/${seatNumber}`);
      return response.data;
    } catch (error) {
      console.error("Error al verificar el asiento:", error);
      return null;
    }
  };

  // ============= disabledDates: Deshabilitar fechas =============
  const disabledDates = (current) => {
    if (!current) return false;

    const currentDay = current.startOf("day");
    const today = dayjs().startOf("day");
    const now = dayjs();

    const [hora, minuto] = (HORA_LIMITE_RESERVA || "07:00").split(":").map(Number);

    const LIMITE_HOY = dayjs()
      .hour(hora)
      .minute(minuto)
      .second(0);

    const day = current.date();
    const month = current.month() + 1;
    const formattedDate = `${day < 10 ? "0" : ""}${day}/${month < 10 ? "0" : ""}${month}`;

    const isHoliday = holidays.includes(formattedDate);
    const isSunday = current.day() === 0;
    const isBeforeToday = currentDay.isBefore(today);
    const isAfterOneMonth = currentDay.isAfter(
      dayjs().add(1, "month").endOf("day")
    );

    const isToday = currentDay.isSame(today, "day");

    // Reserva de HOY (solo visitante)
    const reservaHoy = reservedDays?.reservas?.find((r) => {
      if (r.tipo !== "visitante") return false;
      return dayjs(r.fechaReserva).isSame(today, "day");
    });

    // Deshabilitar HOY solo si:
    // - hay reserva hoy
    // - el estado NO es activo
    // - pasó la hora límite
    const disableTodayByStatus = isToday && now.isAfter(LIMITE_HOY);

    return (
      isHoliday ||
      isSunday ||
      isBeforeToday ||
      isAfterOneMonth ||
      disableTodayByStatus
    );
  };

  const getDisabledStartTime = () => {
    if (!fechaReserva || !fechaReserva.isSame(dayjs(), "day")) {
      return {};
    }

    const currentHour = dayjs().hour();
    const currentMinute = dayjs().minute();

    return {
      disabledHours: () => [...Array(currentHour).keys()],
      disabledMinutes: (selectedHour) =>
        selectedHour === currentHour
          ? [...Array(currentMinute).keys()]
          : [],
    };
  };
  const getDisabledEndTime = () => {
    if (!HoraEntrada) return {};

    const startHour = HoraEntrada.hour();
    const startMinute = HoraEntrada.minute();

    return {
      disabledHours: () => [...Array(startHour).keys()],
      disabledMinutes: (selectedHour) =>
        selectedHour === startHour
          ? [...Array(startMinute + 1).keys()]
          : [],
    };
  };

  return (
    <Modal
      open={isOpen}
      onCancel={handleClose}
      footer={null}
      title={
        step === 1
          ? "Seleccionar Visitante"
          : step === 2
            ? "Reservar Visita"
            : "Reservar Puesto"
      }
      width={950}
    >
      {/* ===================== FORM 1 – VISITANTE ===================== */}
      {step === 1 && (
        <form>
          <Autocomplete
            options={visitantesData}
            getOptionLabel={(option) => `${option.nombres} ${option.apellidos}`}
            value={selectedVisitante}
            onChange={(event, newValue) => setSelectedVisitante(newValue)}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Seleccione un visitante"
                fullWidth
                margin="normal"
              />
            )}
          />

          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <Button
              variant="contained"
              color="primary"
              startIcon={<ArrowForwardIcon />}
              onClick={handleForm1Submit}
            >
              Continuar
            </Button>

            <Button
              variant="contained"
              color="secondary"
              startIcon={<AddIcon />}
              onClick={handleOpenModalNewVisitante}
              style={{
                margin: "1%",
                backgroundColor: "#F45000",
                color: "white",
              }}
            >
              Nuevo visitante
            </Button>
          </div>
        </form>
      )}

      {/* ===================== FORM 2 – RESERVA VISITA ===================== */}
      {step === 2 && (
        <form>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <DatePicker
                value={fechaReserva}
                onChange={(date) => setFechaReserva(date)}
                placeholder="Selecciona una fecha"
                disabledDate={disabledDates}
                dateRender={dateRender}
                allowClear={false}
                format="YYYY/MM/DD"
                style={{ width: "100%" }}
              />
            </Grid>
            <Grid item xs={12}>
              <TimePicker
                value={HoraEntrada}
                onChange={(time) => setHoraEntrada(time)}
                placeholder="Seleccione la hora de entrada del visitante"
                format="HH:mm"
                minuteStep={5}
                style={{ width: "100%" }}
                status={!HoraEntrada ? "error" : ""}
                disabledTime={getDisabledStartTime}
              />
            </Grid>
            <Grid item xs={12}>
              <TimePicker
                value={horaSalida}
                onChange={(time) => setHoraSalida(time)}
                placeholder="Seleccione la hora de salida del visitante"
                format="HH:mm"
                minuteStep={5}
                style={{ width: "100%" }}
                status={!horaSalida ? "error" : ""}
                disabledTime={getDisabledEndTime}
              />
            </Grid>

            <Grid item xs={12}>
              <Autocomplete
                options={responsables}
                getOptionLabel={(option) => `${option.nombres} ${option.apellidos}`}
                value={selectedResponsable}
                onChange={(event, newValue) => setSelectedResponsable(newValue)}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label={`¿A quién visita ${selectedVisitante
                      ? `${selectedVisitante.nombres} ${selectedVisitante.apellidos}`
                      : ""
                      }`}
                    fullWidth
                    margin="normal"
                  />
                )}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                label="Motivo de la visita"
                value={motivo}
                onChange={(e) => setMotivo(e.target.value)}
                fullWidth
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                label="Contacto de emergencia"
                value={acudiente}
                onChange={(e) => setAcudiente(e.target.value)}
                fullWidth
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                label="Vínculo"
                value={tipoAcudiente}
                onChange={(e) => setTipoAcudiente(e.target.value)}
                fullWidth
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                label="Número de contacto"
                value={numeroAcudiente}
                onChange={(e) => setNumeroAcudiente(e.target.value)}
                fullWidth
              />
            </Grid>
          </Grid>

          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 20 }}>
            <Button startIcon={<ArrowBackIcon />} onClick={() => setStep(1)}>
              Volver
            </Button>

            <Button
              startIcon={<SaveAltIcon />}
              color="success"
              onClick={handleSaveVisitante}
            >
              Guardar visita
            </Button>
          </div>
        </form>
      )}

      {/* ===================== STEP 3 – RESERVA PUESTO ===================== */}
      {step === 3 && (
        <>
          <Form form={form} layout="vertical">
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item label="Fecha de reserva" required>
                  <DatePicker
                    style={{ width: "100%" }}
                    value={fechaReserva}
                    onChange={(date) => setFechaReserva(date)}
                    disabledDate={disabledDates}
                    dateRender={dateRender}
                    allowClear={false}
                    format="YYYY/MM/DD"
                  />
                </Form.Item>
              </Col>

              <Col span={12}>
                {rol?.includes("director") && (
                  <Typography>
                    Asiento asignado automáticamente: <b>{seatPass}</b>
                  </Typography>
                )}
              </Col>
            </Row>
          </Form>

          {/* ===== MAPA DE ASIENTOS ===== */}
          {!rol?.includes("director") && fechaReserva && (
            <div>
              <div>
                {!darkMode ? (
                  <MapaSVG style={{ width: "100%" }} onClick={handleClick} />
                ) : (
                  <MapaClaroSVG style={{ width: "100%" }} onClick={handleClick} />
                )}
              </div>

              <div style={{ width: "100%" }}>
                <div>
                  <SquareRoundedIcon style={{ color: "#F45000" }} />
                  <span style={{ fontWeight: "bold", marginRight: "5%" }}>Gerente</span>
                  <SquareRoundedIcon style={{ color: "gray" }} />
                  <span style={{ fontWeight: "bold", marginRight: "5%" }}>Ocupado</span>
                  {puestoSeleccionado && (
                    <>
                      <SquareRoundedIcon style={{ color: "05C3DD" }} />
                      <span style={{ fontWeight: "bold", marginRight: "5%" }}>Tu selección</span>
                    </>
                  )}
                </div>
                <div style={{ display: "flex", justifyContent: "right" }}>
                  {puestoSeleccionado && (
                    <span style={{ fontWeight: 'bold', marginRight: "3%" }}>
                      {`Has seleccionado el puesto: ${puestoSeleccionado}`}
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ===== BOTONES ===== */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginTop: 20,
            }}
          >
            <Button
              variant="contained"
              color="primary"
              startIcon={<ArrowBackIcon />}
              onClick={() => {
                setPuestoSeleccionado(null);
                setStep(2);
              }}
            >
              Volver
            </Button>

            <Button
              variant="contained"
              color="success"
              startIcon={<SaveAltIcon />}
              onClick={handleSave}
              disabled={!fechaReserva || (!rol?.includes("director") && !puestoSeleccionado)}
            >
              Guardar reserva
            </Button>
          </div>
        </>
      )}

      {/* ===================== MODAL NUEVO VISITANTE ===================== */}
      <VisitanteForm
        isOpen={showModalVisitante}
        setShow={setShowModalVisitante}
      />
    </Modal>
  );
}