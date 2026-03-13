import { Modal } from "antd";
import { useState } from "react";

export default function NotificationChangesModal({isOpen,setShowModal}){
    const [darkMode, setDarkMode] = useState(localStorage.getItem("darkMode") === "true");
    
    return (
        <>
        <Modal footer={null} visible={isOpen}  onCancel={() => setShowModal(false)} dialogClassName="Notificacion" contentClassName={darkMode?"darkmode":""}>
                  <div className="">
                    <h1>¡Nuevos Cambios en RIO!</h1>
                    <p>Ya puedes realizar reservas desde tu dispositivo movil</p>
                </div>
        </Modal>
        </>
    )
}