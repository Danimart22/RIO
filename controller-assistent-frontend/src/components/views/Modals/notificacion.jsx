import React, { useState } from "react";
import { List, ListItem, ListItemText } from "@mui/material";

const NotificationCenter = ({ onClose }) => {
  const [notifications, setNotifications] = useState([]);

  // useEffect(() => {
  //   const socket = io("http://localhost:4000");

  //   socket.on("newUserNotification", (notification) => {
  //     setNotifications((prevNotifications) => [notification, ...prevNotifications]);
  //   });

  //   return () => {
  //     socket.disconnect();
  //   };
  // }, []);

  return (
    <div style={{ padding: "10px" }}>
      <h3>Notificaciones</h3>
      <List>
        {notifications.map((notification, index) => (
          <ListItem key={index}>
            <ListItemText primary={notification.message} />
          </ListItem>
        ))}
      </List>
      {/* Puedes agregar un botón para marcar todas las notificaciones como leídas */}
      <button onClick={onClose}>Cerrar</button>
    </div>
  );
};

export default NotificationCenter;
