import { useState, useEffect } from "react";
import oficinaMFSApi from "../../../../api/oficinaMFSApi";
import { Button } from "@mui/material";
import { Select, Form, Input, Modal, Typography } from "antd";
import Swal from "sweetalert2";
import { dataDecrypt } from "../../../../util";
import "../modals.css";

const { Option } = Select;

export default function ReportObjeto({ isOpen, setShow, asientoReservado }) {

  //Declaración de variables de estado
  const fecha = new Date();
  const [asientoReportado, setAsientoReportado] = useState("");
  const [observacion, setObservacion] = useState("");
  const [objeto, setObjeto] = useState([]);
  const [tipo, setTipo] = useState([]);
  const [opcionesD, setD] = useState([]);
  const [opcionesF, setF] = useState([]);
  const [usuarioReportante, setUsuarioReportante] = useState("");
  const [dano, setDano] = useState([]);
  const [falta, setFalta] = useState([]);
  const [form] = Form.useForm();
  let estadoBoton = false;

  //Obtención de datos de usuarios almacenados de manera local
  useEffect(() => {
    const nombre = dataDecrypt(localStorage.getItem("nombre")) || "Nombre desconocido";
    const apellido = dataDecrypt(localStorage.getItem("apellido")) || "Apellido desconocido";
    const nombreUsuario = `${nombre} ${apellido}`;
    if (nombreUsuario) {
      setUsuarioReportante(nombreUsuario);
    } else {
      setUsuarioReportante("Usuario Desconocido");
    }
  }, []);

  //Obtención de reportes por puesto
  const checkSeatReport = async (seatNumber) => {
    try {
      const response = await oficinaMFSApi.get(`/observacion/${seatNumber}`);
      return response.data; // Devuelve los reportes encontrados
    } catch (error) {
      console.error("Error al verificar el asiento:", error);
      return null; // Maneja el error como desees
    }
  };

  //Declaración de arreglos de objetos del puesto
  let reportadosD = [];
  let reportadosF = [];
  const objetosOptions = [
    "Pantalla",
    "Teclado",
    "Mouse",
    "Descansa pies",
    "Silla",
    "Hub adaptador USB",
    "Cable de video HDMI",
    "Otros",
  ];

  //Declaración del arreglo de puestos
  const asientoOptions = Array.from({ length: 94 }, (_, index) => (
    <Option key={index + 1} value={index + 1}>
      Asiento {index + 1}
    </Option>
  ));

  // Funcion para que al cambiar el asiento se identifiquen los objetos que ya han sido reportados
  const handleSeatChange = async (seatNumber) => {
    setAsientoReportado(seatNumber);
    form.resetFields(["objetoDañado", "objetoFaltante", "obs"]);
    const reports = await checkSeatReport(seatNumber);
    if (reports && reports.length > 0) {
      reports.map(report =>
        report.objetos.forEach(item => {
          if (item.tipo === "dañado") {
            reportadosD.push(item.objeto);
          }
          else if (item.tipo === "faltante") {
            reportadosF.push(item.objeto);
          }
        }));
    }
    setD(reportadosD.concat(reportadosF));//Se desactivan los objetos tanto reportados como faltantes para el selector de dañados.
    setF(reportadosF);//se desactivan los objetos que ya han sido reportados como faltantes en el selector de faltantes.
  }
  // Función para llenar el campo de asiento automaticamente si existe una reserva para ese día
  useEffect(() => {
    if (asientoReservado !== undefined && asientoReportado === "") {
      form.setFieldValue("asiento", asientoReservado);
      setAsientoReportado(asientoReservado);
      handleSeatChange(asientoReservado);
    }
  }, [asientoReportado, asientoReservado, form]);

  // Función para el cierre de la modal y reinicio de campos
  const handleClose = () => {
    form.setFieldValue("asiento", asientoReservado);
    form.resetFields(["objetoDañado", "objetoFaltante", "obs"]);
    handleSeatChange(asientoReservado);
    setShow(false);
  };

  // Función para almacenar los objetos dañados
  const nuevoObjetoD = (danado) => {
    setDano(danado);
    setObjeto((prevObjetos) => [
      ...prevObjetos.filter((_, index) => tipo[index] !== "dañado"),
      ...danado,
    ]);
    setTipo((prevTipos) => [
      ...prevTipos.filter((t) => t !== "dañado"),
      ...Array(danado.length).fill("dañado"),
    ]);
  };

  // Función para almacenar los objetos faltantes
  const nuevoObjetoF = (faltante) => {
    setFalta(faltante);
    setObjeto((prevObjetos) => [
      ...prevObjetos.filter((_, index) => tipo[index] !== "faltante"),
      ...faltante,
    ]);
    setTipo((prevTipos) => [
      ...prevTipos.filter((t) => t !== "faltante"),
      ...Array(faltante.length).fill("faltante"),
    ]);
  };

  // Función para enviar los datos a la api
  const handleSave = async () => {
    estadoBoton = true;
    const objetosFormateados = objeto.map((obj, index) => ({
      objeto: obj,
      tipo: tipo[index],
      estado: "activo"
    }));
    const newReporte = {
      fecha: fecha,
      asientoReportado,
      observaciones: observacion,
      objetos: objetosFormateados
    };
    //Request a la api
    try {
      const token = dataDecrypt(localStorage.getItem("Token"));
      const config = {
        headers: {
          "x-access-token": token,
        },
      };

      await oficinaMFSApi.post(`observacion/`, newReporte, config);
      handleClose();

      Swal.fire({
        background: localStorage.getItem("darkMode") === "true" ? '#212121' : '#FFFFFF',
        color: localStorage.getItem("darkMode") === "true" ? 'white' : 'black',
        icon: "success",
        title: "Reporte creado",
        text: "El reporte fue enviado correctamente.",
      });
      estadoBoton = false;
    } catch (error) {
      console.error("Error al crear el reporte:", error);
      let errorMessage = "Ha ocurrido un error al crear el reporte. Por favor, intenta nuevamente.";

      // Manejo del mensaje de error específico
      if (error.response && error.response.data && error.response.data.message) {
        errorMessage = error.response.data.message; // Mensaje del backend
      }

      // Si hay un error de duplicado, se mostrará aquí
      if (error.response && error.response.status === 400) {
        Swal.fire({
          background: localStorage.getItem("darkMode") === "true" ? '#212121' : '#FFFFFF',
          color: localStorage.getItem("darkMode") === "true" ? 'white' : 'black',
          icon: "error",
          title: "Error",
          text: error.response.data.message,
        });
      } else {
        Swal.fire({
          background: localStorage.getItem("darkMode") === "true" ? '#212121' : '#FFFFFF',
          color: localStorage.getItem("darkMode") === "true" ? 'white' : 'black',
          icon: "error",
          title: "Error al crear reporte",
          text: errorMessage,
          allowOutsideClick: false,
        });
      }
    } finally {
      handleClose(); //ciere de la modal
      form.setFieldValue("asiento", asientoReservado);//Reinicio del asiento
      form.resetFields(["objetoDañado", "objetoFaltante", "obs"]);//Reinicio de los demás campos
      handleSeatChange(asientoReservado);
      estadoBoton = false;
    }
  };

  //Estructura del formulario das
  return (
    <Modal
      title="Crear Reporte"
      open={isOpen}
      onCancel={handleClose}
      footer={[
        <Button key="cancel" onClick={handleClose}>
          Cancelar
        </Button>,
        <Button
          key="submit"
          type="primary"
          onClick={handleSave}
          disabled={!asientoReportado || !usuarioReportante || (!objeto.length) ||
            ((objeto.includes("Otros")) && !observacion) || estadoBoton}//Se confirma que se hayan diligenciado los campos necesarios
        >
          Guardar
        </Button>,
      ]}
    >
      <Form layout="vertical"
        form={form}>
        <Form.Item
          label="Asiento Reportado"
          name="asiento"
          rules={[{ required: true, message: "Por favor selecciona un número de silla." }]}
        >
          <Select
            placeholder="Selecciona un número de silla"
            onChange={handleSeatChange}
          >
            {asientoOptions}
          </Select>
        </Form.Item>

        <Form.Item
          label="Objeto(s) Dañado(s)"
          name="objetoDañado"
        >
          <Select
            mode="multiple"
            placeholder="Selecciona los objetos dañados"
            onChange={nuevoObjetoD}
            options={
              [...objetosOptions.map((option) => ({
                key: option,
                value: option,
                disabled: ((opcionesD.concat(falta)).includes(option))
              }))]}
          />
        </Form.Item>

        <Form.Item
          label="Objeto(s) Faltantes(s)"
          name="objetoFaltante"
        >
          <Select
            mode="multiple"
            placeholder="Selecciona los objetos faltantes"
            onChange={nuevoObjetoF}
            options={
              [...objetosOptions.map((option) => ({
                key: option,
                value: option,
                disabled: ((opcionesF.concat(dano)).includes(option))
              }))]}
          />
        </Form.Item>

        {
          <Form.Item
            label="Observaciones"
            name="obs"
            rules={[{ required: objeto.includes("Otros"), message: "Por favor ingresa el objeto que no aparece en la lista." }]}
          >
            <Input.TextArea
              rows={2}
              onChange={(e) => setObservacion(e.target.value)}
              placeholder="Ingresa el objeto aquí"
            />
          </Form.Item>
        }
        {(opcionesD.length !== 0 || opcionesF.length !== 0) && (
          <Form.Item>
            <Typography.Text>
              <mark><strong>Los objetos deshabilitados ya han sido reportados.*</strong></mark>
            </Typography.Text>
          </Form.Item>
        )}
      </Form>
    </Modal>
  );
}
