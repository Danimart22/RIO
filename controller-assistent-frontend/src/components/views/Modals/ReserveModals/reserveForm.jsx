import { useState, useEffect } from "react";
import oficinaMFSApi from "../../../../api/oficinaMFSApi";
import { Button } from "@mui/material";
import { DatePicker } from "antd";
import dayjs from "dayjs";
import { useNavigate } from "react-router-dom";
import moment from "moment";
import SaveIcon from "@mui/icons-material/Save";
import CancelIcon from "@mui/icons-material/Close";
import { dataDecrypt } from "../../../../util";
import Swal from "sweetalert2";
import "moment-timezone";
import "moment/locale/es";
import "../modals.css";
import "react-datepicker/dist/react-datepicker.css";
import { Modal, Form, Row, Col } from "antd";
import updateLocale from 'dayjs/plugin/updateLocale';
import { ReactComponent as MapaSVG } from '../../../../assets/images/mapa.svg';
import { ReactComponent as MapaClaroSVG } from '../../../../assets/images/mapaClaro.svg';
import SquareRoundedIcon from "@mui/icons-material/SquareRounded";
import holidaysColombia from 'festivos-colombianos';
import "./reserveForm.css";
import { getENV } from "../../../../config/env";

dayjs.extend(updateLocale);
dayjs.updateLocale("en", {
  weekStart: 1,
});

moment.tz.setDefault("America/Bogota");

export default function ReserveForm({ isOpen, setShow, fetchData }) {
  const HORA_LIMITE = getENV().HORA_LIMITE_RESERVA;
  const [form] = Form.useForm();
  const [sillasReservadas, setSillasReservadas] = useState([]);
  const [fechaReserva, setFechaReserva] = useState();
  const [reservedDays, setReservedDays] = useState({ reservas: [] });
  const [darkMode, setDarkMode] = useState(localStorage.getItem("darkMode") === "true");
  const [puestoSeleccionado, setPuestoSeleccionado] = useState(null);
  const [diasAsignados, setDiasAsignados] = useState([]); // Nuevo estado para días asignados
  const seatPass = dataDecrypt(localStorage.getItem("seatPass"));
  const rol = dataDecrypt(localStorage.getItem("Rol"));
  const navigate = useNavigate();

  const setHoliday = () => {
    const holidayFormatted = holidaysColombia(new Date().getFullYear());
    return holidayFormatted.map((z) => `${String(z.holiday).split("-")[2]}/${z.holiday.split("-")[1]}`);
  };
  const holidays = setHoliday();

  // Mapeo de nombres de días en español a números (0=Domingo, 1=Lunes, ...)
  const diasMap = {
    "Lunes": 1,
    "Martes": 2,
    "Miércoles": 3,
    "Miercoles": 3, // Por si viene sin acento
    "Jueves": 4,
    "Viernes": 5,
    "Sábado": 6,
    "Sabado": 6, // Por si viene sin acento
    "Domingo": 0
  };

  //useEffect 1: Cargar reservas del usuario al abrir modal
  useEffect(() => {
    const fetchReservedDays = async () => {
      const id = dataDecrypt(localStorage.getItem("id"));
      if (!id) return;

      try {
        const response = await oficinaMFSApi.get(`/oficina/reserva/${id}`);
        console.log("=== RESERVAS DEL USUARIO ===", response.data);
        setReservedDays(response.data);
      } catch (error) {
        console.error("Error fetching reserved days:", error);
        setReservedDays({ reservas: [] });
      }
    };

    if (isOpen) {
      fetchReservedDays();
    }
  }, [isOpen]);

  //useEffect NUEVO: Cargar días asignados al usuario  ese parcerito disque tin
  useEffect(() => {
    const fetchUserDays = async () => {
      const userId = dataDecrypt(localStorage.getItem("id"));
      if (!userId) return;

      try {
        // Llamar al endpoint que obtiene los días asignados
        const response = await oficinaMFSApi.get(`/users/${userId}/dias`);
        console.log("=== DÍAS ASIGNADOS AL USUARIO ===", response.data.dias);
        setDiasAsignados(response.data.dias || []);
      } catch (error) {
        console.error("Error fetching user days:", error);
        setDiasAsignados([]);
      }
    };

    if (isOpen) {
      fetchUserDays();
    }
  }, [isOpen]);

  //  useEffect 2: Cargar sillas reservadas cuando cambia la fecha, ese parcerito disque tin 2 más tin que nunca
  useEffect(() => {
    const loadSillasReservadas = async () => {
      if (!fechaReserva || !fechaReserva.isValid || !fechaReserva.isValid()) {
        setSillasReservadas([]);
        setPuestoSeleccionado(null);
        return;
      }

      try {
        const formattedDate = fechaReserva.format("YYYY-MM-DD");
        console.log("Cargando sillas para fecha:", formattedDate);
        const response = await oficinaMFSApi.get(`/oficina/sillasReservadas/${formattedDate}`);
        setSillasReservadas(response.data);
      } catch (error) {
        console.error("Error al cargar las sillas reservadas", error);
        setSillasReservadas([]);
      }
    };

    if (fechaReserva) {
      loadSillasReservadas();
    }
  }, [fechaReserva]);

  //  useEffect 3: Reiniciar fecha al abrir modal disque tin pero tan
  useEffect(() => {
    if (isOpen) {
      setFechaReserva(null);
      setPuestoSeleccionado(null);
    }
  }, [isOpen]);

  // useEffect 4: Manejar cambios de darkMode tan tin
  useEffect(() => {
    const handleStorageChange = () => {
      setDarkMode(localStorage.getItem("darkMode") === "true");
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // useEffect 5: Aplicar estilos a los puestos sadasdasdasdasdas
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

    if (puestoSeleccionado) {
      const rect = document.getElementById(`p-${puestoSeleccionado}`);
      if (rect) {
        rect.classList.add("puesto-seleccionado");
      }
    }
  }, [sillasReservadas, puestoSeleccionado, rol]);

  const checkSeatReport = async (seatNumber) => {
    try {
      const response = await oficinaMFSApi.get(`/observacion/${seatNumber}`);
      return response.data;
    } catch (error) {
      console.error("Error al verificar el asiento:", error);
      return null;
    }
  };

  const handleSave = async () => {
    try {
      const newReserva = {
        fechaReserva: fechaReserva.toISOString(),
        numeroSilla: rol.includes("director") ? seatPass : puestoSeleccionado,
        tipo: "usuario",
      };

      const token = dataDecrypt(localStorage.getItem("Token"));
      const id = dataDecrypt(localStorage.getItem("id"));

      const config = {
        headers: {
          "x-access-token": token,
        },
      };

      await oficinaMFSApi.post(`/oficina/reserva/${id}`, newReserva, config);

      const fechaReservaFormateada = moment(fechaReserva.toISOString()).format("YYYY-MM-DD");

      Swal.fire({
        background: localStorage.getItem("darkMode") === "true" ? '#212121' : '#FFFFFF',
        color: localStorage.getItem("darkMode") === "true" ? 'white' : 'black',
        icon: "success",
        title: "Reserva creada",
        html: `La reserva para el día <b>${moment(fechaReservaFormateada).format("DD [de] MMMM [del] YYYY")}</b> con el número de silla <b>N° ${rol.includes("director") ? seatPass : puestoSeleccionado}</b> fue creada correctamente.`,
      }).then(() => {
        if (fetchData) {
          fetchData();
        }
        navigate('/reservas');
      });
    } catch (error) {
      let errorMessage = "Ha ocurrido un error al crear la reserva. Por favor, intenta nuevamente.";

      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }

      Swal.fire({
        background: localStorage.getItem("darkMode") === "true" ? '#212121' : '#FFFFFF',
        color: localStorage.getItem("darkMode") === "true" ? 'white' : 'black',
        icon: "error",
        title: "Error al crear reserva",
        text: errorMessage,
        allowOutsideClick: false,
      });
      console.error("Error completo:", error);
    } finally {
      form.resetFields();
      setShow(false);
    }
    navigate("/reservas")
    window.location.reload();
  };

  //  disabledDates, bloque los días no permitidos para reservar en el momento esternocleidomastoideo
  const disabledDates = (current) => {
    if (!current) return false;

    const currentDay = current.startOf("day");
    const today = dayjs().startOf("day");
    const now = dayjs();

    const LIMITE_HOY = dayjs().hour(parseInt(HORA_LIMITE.split(":")[0])).minute(parseInt(HORA_LIMITE.split(":")[1])).second(parseInt(HORA_LIMITE.split(":")[2]));

    const day = current.date();
    const month = current.month() + 1;
    const formattedDate = `${day < 10 ? "0" : ""}${day}/${month < 10 ? "0" : ""}${month}`;

    const isHoliday = holidays.includes(formattedDate);
    const isSunday = current.day() === 0;
    const isBeforeToday = currentDay.isBefore(today);
    const isAfterOneMonth = currentDay.isAfter(dayjs().add(1, "month").endOf("day"));
    const isToday = currentDay.isSame(today, "day");

    const reservaHoy = reservedDays?.reservas?.find((r) => {
      if (r.tipo !== "usuario") return false;
      return dayjs(r.fechaReserva).isSame(today, "day");
    });

    const disableTodayByStatus = isToday && now.isAfter(LIMITE_HOY);
    const yaReservada = reservedDays?.reservas?.some((r) => {
      if (r.tipo !== "usuario") return false;
      return dayjs(r.fechaReserva).isSame(current, "day");
    });

    const dayOfWeek = current.day();
    const diasAsignadosNumeros = diasAsignados
      .map((dia) => diasMap[dia])
      .filter((num) => num !== undefined);
    const isDayNotAssigned =
      diasAsignados.length > 0 && !diasAsignadosNumeros.includes(dayOfWeek);

    return (
      isHoliday ||
      isSunday ||
      isBeforeToday ||
      isAfterOneMonth ||
      disableTodayByStatus ||
      isDayNotAssigned ||
      yaReservada
    );
  };

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

  return (
    <Modal
      centered
      title="Nueva Reserva"
      open={isOpen}
      onCancel={() => {
        form.resetFields();
        setShow(false);
      }}
      footer={[
        <Button
          key="save"
          variant="contained"
          color="success"
          onClick={handleSave}
          startIcon={<SaveIcon />}
          style={{ marginRight: "2%" }}
          disabled={!fechaReserva || (!rol?.includes("director") && !puestoSeleccionado)}
        >
          Guardar
        </Button>,
        <Button
          key="cancel"
          variant="contained"
          color="error"
          onClick={() => {
            form.resetFields();
            setShow(false);
          }}
          startIcon={<CancelIcon />}
          style={{ marginLeft: "2%" }}
        >
          Cerrar
        </Button>
      ]}
      width={950}
      footerStyle={{ justifyContent: 'center' }}
      bodyStyle={{ paddingBottom: '24px', minHeight: '400px' }}
    >
      <Form form={form} onFinish={handleSave}>
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              label={<span style={{ fontWeight: 'bold' }}>¿Qué fecha deseas reservar?</span>}
              name="fechaReserva"
              rules={[{ required: true, message: "Por favor, selecciona una fecha." }]}
            >
              <DatePicker
                value={fechaReserva}
                onChange={(date) => setFechaReserva(date)}
                format="YYYY/MM/DD"
                allowClear={false}
                disabledDate={disabledDates}
                placeholder="Selecciona una fecha"
                style={{ width: "100%" }}
                dateRender={dateRender}
                popupStyle={{ zIndex: 2000 }}
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            {rol?.includes("director") && (
              <Form.Item>
                <p style={{ fontWeight: 'bold' }}>
                  Se te ha asignado el asiento N° {seatPass} por defecto.
                </p>
              </Form.Item>
            )}
            {/* Mostrar días asignados al usuario */}
            {diasAsignados.length > 0 && (
              <Form.Item>
                <p style={{ fontWeight: 'bold', color: '#1890ff' }}>
                  Días presenciales asignados: {diasAsignados.join(", ")}
                </p>
              </Form.Item>
            )}
          </Col>
        </Row>
      </Form>

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
    </Modal>
  );
}