import { useState } from "react";
import { DatePicker } from "antd";
import "moment/locale/es";
import { Modal } from "antd";
import dayjs from "dayjs";
import { TextField,FormLabel } from "@mui/material";
import { Button } from "@mui/material";
import imageItems from "../../../../assets/images/images";


export default function SeatsModal({ isOpen, setShow,darkMode,setPuestoSeleccionado,puestoSeleccionado,setDatesSilla,datesSilla,getHistorialAsiento }) {
  
  // useEffect(() => {
  //   for (let i = 1; i <= 81; i++) {
  //       const id = `p-${i}`;
  //       const rect = document.getElementById(id);
  //       if (rect) {
  //       rect.classList.remove("puesto-seleccionado");
  //       }
  //   }

  //   if (puestoSeleccionado !== null && puestoSeleccionado !== undefined) {
  //       const rect = document.getElementById("p-" + puestoSeleccionado);
  //       if (rect) {
  //       rect.classList.add("puesto-seleccionado");
  //       }
  //   }
  // }, [puestoSeleccionado]);

  const { RangePicker } = DatePicker;
  const [isPressed, setIsPressed] = useState(false);

  const disabledDate = (current) => {
    const today = dayjs().startOf("day");
    const twoYearsAgo = today.subtract(2, "year");
    const oneMonthLater = today.add(1, "month");
    return current && (current < twoYearsAgo || current > oneMonthLater);
  };
     
  const handleClick = (e) => {
        const id = e.target.id;
        console.log(id);
        try {
            if (id.startsWith("p-")) {
                if (puestoSeleccionado === id.substring(2)) {
                    setPuestoSeleccionado(null); 
                } else {
                    setPuestoSeleccionado(id.substring(2));
                }
                
            }
        } catch (error) {
        }
  };
  const handleChange = (e) => {
    if (/^\d{0,2}$/.test(e.target.value) && (Number(e.target.value) <= 81) && Number(e.target.value) >= 1 || e.target.value === "") {
      setPuestoSeleccionado(e.target.value);
    }
  };
  const handleChangeRangePicker = (values) =>{
    if (values) {
    const formattedValues = [
        values[0]?.format("YYYY-MM-DD"),
        values[1]?.format("YYYY-MM-DD"),
    ];
    setDatesSilla(formattedValues);
    }
}

//   const formatToHumanDate = (dateString) => {
//   const months = [
//     "enero", "febrero", "marzo", "abril", "mayo", "junio",
//     "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"
//   ];
//   const [year, month, day] = dateString.split("-");
//   return `${parseInt(day)} de ${months[parseInt(month) - 1]} de ${year}`;
// };    

  const handleClose = () => {
    setDatesSilla([]);
    setPuestoSeleccionado(null);
    setShow(false);
  }  
  const handleClear = () => setDatesSilla([]);
  const handleOk = async () => {
    await getHistorialAsiento()
    setShow(false)
  }
  return (
    <Modal
      open={isOpen}
      onCancel={handleClose}
      title="Seleccionar siento"
      width={800}
      onOk={handleOk}
      onClose={handleOk}
      maskClosable={false}
>
        <div style={{display:"flex",flexDirection:"row",justifyContent:"space-between", alignItems:"center"}}>
        <RangePicker 
          // value={datesSilla.length > 0 ? [dayjs(datesSilla[0]), dayjs(datesSilla[1])] : []}
          onClear={handleClear}
          onChange={handleChangeRangePicker} 
          style={{ width: "300px", height: "50px"}}
          placeholder={["Fecha de Inicio", "Fecha de Fin"]}
            // startDate="Fecha de Inicio"
            // onEnded="Fecha de Inicio"
            sx={{ width: "300px",
            "& .MuiInputBase-root": {
            height: "60px"} 
            }} 
            disabledDate={disabledDate}/>
       <div style={{display:"flex",flexDirection:"row", gap:10, width:"20vw",alingItems:"center", justifyContent:"end"}}>
        <FormLabel component="legend" style={{ width: "40%" }}>
        Número de Asiento: 
        </FormLabel>
      <TextField
        label="Número"
        variant="outlined"
        value={puestoSeleccionado || ""}
        onChange={handleChange}
        sx={{ width: "100px",
            "& .MuiInputBase-root": {
            height: "50px" 
        } }} 
      />
        </div>     
        </div>
      <div style={{marginTop:20,display:"flex",flexDirection:"column"}}>
        <Button
          onClick={()=>setIsPressed(!isPressed)}
          variant="contained"
          style={{
          backgroundColor: "#F45000", 
          color: "white",
          width:isPressed?138:103,
          height:28,
          marginBottom:10
          }}
          >{isPressed? "Ocultar Mapa" : "Ver Mapa"}</Button> 
          {!isPressed? null : <img src={darkMode? imageItems[4].img : imageItems[5].img} alt="" style={{width:"100%", height:"auto"}}/>}
      </div>
          { puestoSeleccionado>1 ?
          //  && (datesSilla || []).length 
          <>
          <h6>Has Seleccionado el Puesto: {puestoSeleccionado}</h6>
          <h6>Desde el {datesSilla[0]} hasta el {datesSilla[1]}</h6>
          </>
          : null
          }
    </Modal>
  );
}
