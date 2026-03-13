import 'dotenv/config'
import app from "./app.js";
import './database.js'
import "./libs/initialSetup.js";
// import { backupMongoDB, autodelete } from "./backup.js";

const PORT = app.get("port");

app.listen(PORT, () => {
  console.log("Servidor corriendo en el puerto", PORT);
  console.log(`URL: http://localhost:${PORT}`);
});

//Programación de ejecucion
// cron.schedule('1 14 * * * ', () => {backupMongoDB()
// });
// cron.schedule('1 19 * * * ', () => {backupMongoDB();
//   autodelete();
// });