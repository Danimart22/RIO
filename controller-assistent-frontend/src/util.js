import CryptoJS from "crypto-js";
import { secretKey } from "./secret-keys";


export const dataEncrypt = (value) => {
    return CryptoJS.AES.encrypt(JSON.stringify(value), secretKey).toString()
}


export const dataDecrypt = (value) => {
  try {
    if (!value) {
      return null; // Devuelve null si la cadena es nula o vacía
    }

    const bytes = CryptoJS.AES.decrypt(value, secretKey);
    return JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
  } catch (error) {
    console.error("Error parsing JSON data:", error);
    return null;
  }
};
