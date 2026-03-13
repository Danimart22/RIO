import { useState, useEffect, useRef } from "react";
import oficinaMFSApi from "../../../../api/oficinaMFSApi";
import { Button } from "@mui/material";
import dayjs from "dayjs";
import moment from "moment";
import SaveIcon from "@mui/icons-material/Save";
import CancelIcon from "@mui/icons-material/Close";
import { dataDecrypt } from "../../../../util";
import Swal from "sweetalert2";
import "moment-timezone";
import "moment/locale/es";
import "../modals.css";
import "react-datepicker/dist/react-datepicker.css";
import { Modal } from "antd";
import updateLocale from 'dayjs/plugin/updateLocale';
import { ReactComponent as MapaSVG } from '../../../../assets/images/mapa.svg';
import { ReactComponent as MapaClaroSVG } from '../../../../assets/images/mapaClaro.svg'
import SquareRoundedIcon from "@mui/icons-material/SquareRounded";

dayjs.extend(updateLocale)
dayjs.updateLocale("en", {
  weekStart: 1,
})

moment.tz.setDefault("America/Bogota");

export default function ModificarReserva({ isOpen, setShow, fetchData, fechaReserva, asientoReservado }) {
  const [sillasReservadas, setSillasReservadas] = useState([]);
  const [reservedDays, setReservedDays] = useState([]);
  const [darkMode, setDarkMode] = useState(localStorage.getItem("darkMode") === "true" ? true : false);
  const [puestoSeleccionado, setPuestoSeleccionado] = useState();
  const seatPass = dataDecrypt(localStorage.getItem("seatPass"));
  const rol = dataDecrypt(localStorage.getItem("Rol"));
  const first = useRef(true);
  let availableSeats = [];

  useEffect(() => {
    first.current = true;
    setSillasReservadas([]);
    const handleStorageChange = () => {
      if (localStorage.getItem("darkMode") === "true") {
        setDarkMode(true);
      } else {
        setDarkMode(false);
      }
    };
    window.addEventListener('storage', handleStorageChange);
    async function loadSillasReservadas() {
      try {
        const formattedDate = dayjs(fechaReserva).format("YYYY-MM-DD");
        const response = await oficinaMFSApi.get(
          `/oficina/sillasReservadas/${formattedDate}`
        );
        setSillasReservadas(response.data.map((silla) => silla === asientoReservado ? null : silla));
      } catch (error) {
        console.error("Error al cargar las sillas reservadas", error);
      }
    }
    loadSillasReservadas();
    const fetchReservedDays = async () => {
      const id = dataDecrypt(localStorage.getItem("id"));
      try {
        const response = await oficinaMFSApi.get(`oficina/reserva/${id}`);
        setReservedDays(response.data);
      } catch (error) {
        console.error("Error fetching reserved days:", error);
      }
    };
    setPuestoSeleccionado(asientoReservado);
    fetchReservedDays();
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [isOpen]);


  let totalSeats = 90;

  const puestosGerente = [19, 20, 23, 30, 33, 42, 45, 48, 53, 56, 61, 66, 78];
  if (rol && rol.includes("gerente")) {
    for (let i = 1; i <= 81; i++) {
      const id = `p-${i}`;
      const rect = document.getElementById(id);
      if (puestosGerente.includes(i)) {
        if (rect) {
          rect.classList.add("btn-puesto");
        }
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
    if (sillasReservadas.includes(i)) {
      if (rect) {
        rect.classList.add("puesto-ocupado");
      }
    } else {
      if (rect) {
        rect.classList.remove("puesto-ocupado");
      }
    }
    if (rect) {
      rect.classList.remove("puesto-seleccionado");
    }
  }

  availableSeats = Array.from(
    { length: totalSeats },
    (_, index) => index + 1
  ).filter((seat) => !sillasReservadas.includes(seat));

  const checkSeatReport = async (seatNumber) => {
    try {
      const response = await oficinaMFSApi.get(`/observacion/${seatNumber}`);
      return response.data; // Devuelve los reportes encontrados
    } catch (error) {
      console.error("Error al verificar el asiento:", error);
      return null; // Maneja el error como desees
    }
  };

  const handleSave = async () => {
    try {
      const newReserva = {
        fechaReserva: dayjs(fechaReserva).toISOString(),
        numeroSilla: rol.includes("director") ? seatPass : puestoSeleccionado,
      };

      const token = dataDecrypt(localStorage.getItem("Token"));
      const id = dataDecrypt(localStorage.getItem("id"));

      const config = {
        headers: {
          "x-access-token": token,
        },
      };

      await oficinaMFSApi.post(`/oficina/updatereserva/${id}`, newReserva, config);
      fetchData(dataDecrypt(localStorage.getItem("id")));

      const fechaReservaFormateada = dayjs(fechaReserva).format(
        "YYYY-MM-DD"
      );

      Swal.fire({
          background: localStorage.getItem("darkMode")==="true"?'#212121':'#FFFFFF',
          color: localStorage.getItem("darkMode")==="true"?'white':'black',
        icon: "success",
        title: "Reserva modificada",
        html: `La reserva para el día <b>${moment(
          fechaReservaFormateada
        ).format("DD [de] MMMM [del] YYYY")}</b> con el número de silla <b>N° ${rol.includes("director") ? seatPass : puestoSeleccionado
          }</b> fue modificada correctamente.`,
      }).then(() => {
        fetchData();
      });
    } catch (error) {
      let errorMessage =
        "Ha ocurrido un error al modificar la reserva. Por favor, intenta nuevamente.";

      if (
        error.response &&
        error.response.data &&
        error.response.data.message
      ) {
        errorMessage = error.response.data.message;
      }

      Swal.fire({
          background: localStorage.getItem("darkMode")==="true"?'#212121':'#FFFFFF',
          color: localStorage.getItem("darkMode")==="true"?'white':'black',
        icon: "error",
        title: "Error al crear reserva",
        text: errorMessage,
        allowOutsideClick: false,
      });
      console.log(error)
    } finally {
      setPuestoSeleccionado();
      setShow(false);
      window.location.reload();
    }
  };

  useEffect(() => {
    setTimeout(() => {
      for (let i = 1; i <= 81; i++) {
        const id = `p-${i}`;
        const rect = document.getElementById(id);
        if (rect) {
          rect.classList.remove("puesto-seleccionado");
        }
      }

      const rectSeleccionado = document.getElementById("p-" + puestoSeleccionado);
      if (rectSeleccionado) {
        console.log(puestoSeleccionado)
        rectSeleccionado.classList.add("puesto-seleccionado");
      }
    }, first.current ? 1000 : 0);
    first.current = false;
  }, [puestoSeleccionado]);

  const handleSeatChange = async (seatNumber) => {
    const reports = await checkSeatReport(seatNumber);

    if (reports && reports.length > 0) {
      const reportDetails = reports.map(report =>
        `-(Objetos: ${report.objetos.map(item => item.objeto + " (" + item.tipo + ") ").join(", ")}`
      ).join("<br><br>");

      const result = await Swal.fire({
          background: localStorage.getItem("darkMode")==="true"?'#212121':'#FFFFFF',
          color: localStorage.getItem("darkMode")==="true"?'white':'black',
        title: 'Atención',
        html: `El asiento N° <strong>${seatNumber}</strong> tiene un reporte con los siguientes Objetos:<br><strong>${reportDetails}</strong>. <br><br><mark>Si aceptas reservarlo considera utilizar tus propios elementos mientras el área encargada resuelve el problema.</mark>`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Aceptar',
        cancelButtonText: 'Cancelar',
      });

      if (result.isConfirmed) {
        // Mantener la selección
        setPuestoSeleccionado(seatNumber);
      } else {
        // Reiniciar la selección
        setPuestoSeleccionado();
      }
    } else {
      // Si no hay reportes, simplemente establecer la silla seleccionada
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
          setPuestoSeleccionado();
        } else {
          handleSeatChange(id.substring(2));
        }
      }
    } catch (error) {
    }
  };

  return (
    <Modal
      centered
      title="Modificar Reserva"
      dialogClassName="modalUserRh"
      visible={isOpen}
      onCancel={() => {
        setPuestoSeleccionado();
        setShow(false);
        window.location.reload();
      }}
      footer={[
        <Button
          key="save"
          variant="contained"
          color="success"
          onClick={handleSave}
          startIcon={<SaveIcon />}
          style={{ marginRight: "2%" }}
          disabled={!puestoSeleccionado}
        >
          Guardar
        </Button>,
        <Button
          key="cancel"
          variant="contained"
          color="error"
          onClick={() => {
            setPuestoSeleccionado();
            setShow(false);
            window.location.reload();
          }}
          startIcon={<CancelIcon />}
          style={{ marginLeft: "2%" }}
        >
          Cerrar
        </Button>
      ]}
      width={950}
      footerStyle={{ justifyContent: 'center' }}
    >
      {rol.includes("director") || !fechaReserva ? null : (
        <div>
          <div>
            {!darkMode && <MapaSVG style={{ width: "100%" }} onClick={handleClick}>
            </MapaSVG>}
            {darkMode && <MapaClaroSVG style={{ width: "100%" }} onClick={handleClick}>
            </MapaClaroSVG>}
          </div>
          <div style={{ widht: "100%" }}>
            <div>
              <SquareRoundedIcon
                style={{
                  color: "#F45000"
                }} />
              <span style={{
                fontWeight: "bold",
                marginRight: "5%",
              }}>Gerente</span>
              <SquareRoundedIcon
                style={{
                  color: "gray"
                }} />
              <span style={{
                fontWeight: "bold",
                marginRight: "5%",
              }}>Ocupado</span>
              {puestoSeleccionado && <SquareRoundedIcon
                style={{
                  color: "05C3DD"
                }} />}
              {puestoSeleccionado && <span style={{
                fontWeight: "bold",
                marginRight: "5%",
              }}>Tu selección</span>}
            </div>
            <div style={{ display: "flex", justifyContent: "right" }}>
              {(!rol.includes("director") && puestoSeleccionado) &&
                <span style={{ fontWeight: 'bold', marginRight: "3%" }}>{`Haz seleccionado el puesto: ${puestoSeleccionado}`}</span>
              }
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
}
