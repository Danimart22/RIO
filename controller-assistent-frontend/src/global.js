import { dataDecrypt } from "./util";
import { getENV } from "./config/env";

const globalObject = {};

// Usar función para obtener valor en runtime
globalObject.url = getENV().RIO_BACKEND_URL;
globalObject.token = dataDecrypt(localStorage.getItem("Token"));

export const url = globalObject.url;
export default globalObject;