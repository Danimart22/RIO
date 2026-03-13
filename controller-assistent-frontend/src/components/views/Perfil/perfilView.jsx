import { useState, useEffect } from "react";
import oficinaMFSApi from "../../../api/oficinaMFSApi";
import Swal from "sweetalert2";
import { dataDecrypt } from "../../../util";
import CoronavirusIcon from "@mui/icons-material/Coronavirus";
import LocalHospitalIcon from "@mui/icons-material/LocalHospital";
import Skeleton from "@mui/material/Skeleton";
import EditIcon from "@mui/icons-material/Edit";
import SaveAltIcon from "@mui/icons-material/SaveAlt";
import CancelIcon from "@mui/icons-material/Cancel";
import { TextField, Grid, Button, MenuItem, Chip, Paper, Typography } from "@mui/material";
import "./perfilView.css";

export function PerfilView() {
  const [personData, setPersonData] = useState({});
  const [formData, setFormData] = useState({});
  const [enfermedades, setEnfermedades] = useState([]);
  const [alergias, setAlergias] = useState([]);
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [inputEnfermedad, setInputEnfermedad] = useState("");
  const [inputAlergia, setInputAlergia] = useState("");

  const swalConfig = {
    background: localStorage.getItem("darkMode") === "true" ? "#212121" : "#FFFFFF",
    color: localStorage.getItem("darkMode") === "true" ? "white" : "black",
  };

  useEffect(() => {
    fetchPersonData();
  }, []);

  useEffect(() => {
    setEnfermedades(personData.enfermedades || []);
    setAlergias(personData.alergias || []);
  }, [personData]);

  const fetchPersonData = async () => {
    try {
      const id = dataDecrypt(localStorage.getItem("id"));
      const response = await oficinaMFSApi.get(`/users/${id}`);
      const data = response.data;
      setPersonData(data);
      setFormData(data);
      setLoading(false);
    } catch (error) {
      console.error("Error al obtener los datos de la persona:", error);
      setLoading(false);
    }
  };

  const handleEnfermedadesChange = (event) => {
    const value = event.target.value.trim();
    if (value !== "") {
      setEnfermedades([...enfermedades, value]);
      event.target.value = "";
      setInputEnfermedad("");
    }
  };

  const removeEnfermedad = (index) => {
    setEnfermedades(enfermedades.filter((_, i) => i !== index));
  };

  const handleAlergiasChange = (event) => {
    const value = event.target.value.trim();
    if (value !== "") {
      setAlergias([...alergias, value]);
      event.target.value = "";
      setInputAlergia("");
    }
  };

  const removeAlergia = (index) => {
    setAlergias(alergias.filter((_, i) => i !== index));
  };

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setFormData({ ...formData, [name]: value });
    setPersonData({ ...personData, [name]: value });
  };

  const handleCancelClick = () => {
    fetchPersonData();
    setEditing(false);
  };

  const handleEditClick = () => setEditing(true);

  const handleUpdateClick = async () => {
    const requiredFields = [
      "tipo_documento", "documento", "nombres", "apellidos",
      "telefono", "direccion", "sangre", "eps", "arl",
      "acudiente", "tipo_acudiente", "numero_acudiente",
    ];
    const isAnyRequiredFieldEmpty = requiredFields.some(
      (field) => !personData[field]
    );

    const updatedEnfermedades = enfermedades.length === 0 ? ["Ninguna"] : enfermedades;
    const updatedAlergias = alergias.length === 0 ? ["Ninguna"] : alergias;

    if (isAnyRequiredFieldEmpty) {
      Swal.fire({
        ...swalConfig,
        icon: "error",
        title: "Campos requeridos vacíos",
        text: "Por favor, completa todos los campos requeridos.",
      });
      return;
    }

    try {
      const id = dataDecrypt(localStorage.getItem("id"));
      const updatedData = {
        username: personData.username,
        tipo_documento: personData.tipo_documento,
        documento: personData.documento,
        nombres: personData.nombres,
        apellidos: personData.apellidos,
        correo: personData.correo,
        sangre: personData.sangre,
        telefono: personData.telefono,
        eps: personData.eps,
        arl: personData.arl,
        acudiente: personData.acudiente,
        tipo_acudiente: personData.tipo_acudiente,
        numero_acudiente: personData.numero_acudiente,
        estado: personData.estado,
        direccion: personData.direccion,
        enfermedades: updatedEnfermedades,
        alergias: updatedAlergias,
      };

      await oficinaMFSApi.put(`/users/${id}`, updatedData);
      setPersonData(updatedData);
      setEditing(false);
      Swal.fire({
        ...swalConfig,
        icon: "success",
        title: "Cambios guardados",
        text: "Los cambios se han guardado correctamente.",
      });
    } catch (error) {
      console.error("Error al actualizar los datos:", error);
      Swal.fire({
        ...swalConfig,
        icon: "error",
        title: "Error al guardar cambios",
        text: "Ha ocurrido un error al guardar los cambios. Por favor, intenta nuevamente.",
      });
    }
  };

  const epsOptions = [
    "FAMISANAR", "NUEVA EPS", "SALUD TOTAL", "SANITAS", "SURA",
    "COMPENSAR", "COOSALUD", "SAVIA SALUD", "ALIANSALUD", "SANIDAD MILITAR",
  ];

  const arlOptions = [
    "SURA", "POSITIVA", "COLMENA", "AXA COLPATRIA", "BOLIVAR", "EQUIDAD",
  ];

  return (
    <div className="container">
      <div
        className="perfil-skeleton-container"
        style={{ display: loading ? "flex" : "none" }}
      >
        <div className="perfil-skeleton-column">
          <Skeleton variant="text" height={75} width={"8400%"} />
          <Skeleton variant="text" height={75} width={"8400%"} />
          <Skeleton variant="text" height={75} width={"8400%"} />
          <Skeleton variant="text" height={75} width={"8400%"} />
          <Skeleton variant="text" height={75} width={"8400%"} />
          <Skeleton variant="text" height={65} width={"2600%"} />
        </div>
        <div className="perfil-skeleton-column">
          <Skeleton variant="text" height={75} width={"8400%"} />
          <Skeleton variant="text" height={75} width={"8400%"} />
          <Skeleton variant="text" height={75} width={"8400%"} />
          <Skeleton variant="text" height={75} width={"8400%"} />
          <Skeleton variant="text" height={75} width={"8400%"} />
        </div>
        <div className="perfil-skeleton-column">
          <Skeleton variant="text" height={75} width={"8400%"} />
          <Skeleton variant="text" height={75} width={"8400%"} />
          <Skeleton variant="text" height={75} width={"8400%"} />
          <Skeleton variant="text" height={75} width={"8400%"} />
          <Skeleton variant="text" height={75} width={"8400%"} />
        </div>
      </div>

      <div style={{ display: loading ? "none" : "block" }}>
        <h2 className="perfil-title">
          Perfil de{" "}
          <strong>
            {personData.nombres} {personData.apellidos}
          </strong>
        </h2>

        <Grid container spacing={4}>
          <Grid item xs={12} sm={4}>
            <TextField
              type="text" name="username" label="Usuario"
              value={personData.username || ""} onChange={handleInputChange}
              fullWidth variant="outlined" disabled={!editing}
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              select name="tipo_documento" label="Tipo de documento"
              value={personData.tipo_documento || ""} onChange={handleInputChange}
              fullWidth variant="outlined" disabled={!editing} required
            >
              <MenuItem value="CC">CC - Cédula de Ciudadanía</MenuItem>
              <MenuItem value="CE">CE - Cédula de Extranjería</MenuItem>
              <MenuItem value="PP">PP - Pasaporte</MenuItem>
              <MenuItem value="TI">TI - Tarjeta de Identidad</MenuItem>
            </TextField>
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              variant="outlined" type="text" name="documento" label="Documento"
              value={personData.documento || ""} onChange={handleInputChange}
              fullWidth disabled={!editing} required
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              variant="outlined" type="text" name="nombres" label="Nombres"
              value={personData.nombres || ""} onChange={handleInputChange}
              fullWidth disabled={!editing} required
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              variant="outlined" type="text" name="apellidos" label="Apellidos"
              value={personData.apellidos || ""} onChange={handleInputChange}
              fullWidth disabled={!editing} required
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              variant="outlined" type="email" name="correo" label="Correo"
              value={personData.correo || ""} onChange={handleInputChange}
              fullWidth disabled required
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              variant="outlined" select name="sangre" label="Tipo de sangre"
              value={personData.sangre || ""} onChange={handleInputChange}
              fullWidth disabled={!editing} required
            >
              {["A+","A-","B+","B-","AB+","AB-","O+","O-"].map((v) => (
                <MenuItem key={v} value={v}>{v}</MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              variant="outlined" type="text" name="telefono" label="Telefono"
              value={personData.telefono || ""} onChange={handleInputChange}
              fullWidth disabled={!editing} required
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              variant="outlined" type="text" name="direccion" label="Direccion de residencia"
              value={personData.direccion || ""} onChange={handleInputChange}
              fullWidth disabled={!editing} required
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              variant="outlined" type="text" name="Empresa vinculada" label="Empresa vinculada"
              value={personData.empresa || ""} onChange={handleInputChange}
              fullWidth disabled required
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              variant="outlined" type="text" name="Cargo" label="Cargo"
              value={personData.cargo || ""} onChange={handleInputChange}
              fullWidth disabled required
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              variant="outlined" select name="eps" label="EPS"
              value={personData.eps || ""} onChange={handleInputChange}
              fullWidth disabled={!editing} required
            >
              <MenuItem value="">Seleccionar EPS</MenuItem>
              {epsOptions.map((option) => (
                <MenuItem key={option} value={option}>{option}</MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              variant="outlined" select name="arl" label="ARL"
              value={personData.arl || ""} onChange={handleInputChange}
              fullWidth disabled={!editing} required
            >
              <MenuItem value="">Seleccionar ARL</MenuItem>
              {arlOptions.map((option) => (
                <MenuItem key={option} value={option}>{option}</MenuItem>
              ))}
            </TextField>
          </Grid>

          <Grid item xs={10} sm={4}>
            <TextField
              variant="outlined" type="text"
              placeholder="Agrega una enfermedad"
              onKeyDown={(e) => {
                if (e.key === "Enter" && inputEnfermedad.length >= 2) {
                  e.preventDefault();
                  handleEnfermedadesChange(e);
                }
              }}
              label="Enfermedades" fullWidth disabled={!editing} required
              value={inputEnfermedad}
              onChange={(e) => setInputEnfermedad(e.target.value)}
            />
            {inputEnfermedad.length >= 2 && (
              <Typography variant="body2" color="textSecondary">
                Presiona <strong>Enter</strong> para agregar la enfermedad{" "}
                <strong>{inputEnfermedad}</strong>
              </Typography>
            )}
            {enfermedades.length > 0 && (
              <Paper
                sx={{ display: "flex", justifyContent: "center", flexWrap: "wrap", listStyle: "none", p: 0.5, m: 0 }}
                component="ul"
              >
                {enfermedades.map((enfermedad, index) => (
                  <li key={index}>
                    <Chip
                      label={enfermedad}
                      onDelete={() => removeEnfermedad(index)}
                      disabled={!editing}
                      icon={<LocalHospitalIcon />}
                      variant={editing ? "outlined" : "default"}
                      color="success"
                    />
                  </li>
                ))}
              </Paper>
            )}
          </Grid>

          <Grid item xs={10} sm={4}>
            <TextField
              variant="outlined" type="text"
              placeholder="Agrega una alergia"
              onKeyDown={(e) => {
                if (e.key === "Enter" && inputAlergia.length >= 2) {
                  e.preventDefault();
                  handleAlergiasChange(e);
                }
              }}
              fullWidth label="Alergias" disabled={!editing} required
              value={inputAlergia}
              onChange={(e) => setInputAlergia(e.target.value)}
            />
            {inputAlergia.length >= 2 && (
              <Typography variant="body2" color="textSecondary">
                Presiona <strong>Enter</strong> para agregar la alergia{" "}
                <strong>{inputAlergia}</strong>
              </Typography>
            )}
            {alergias.length > 0 && (
              <Paper
                sx={{ display: "flex", justifyContent: "center", flexWrap: "wrap", listStyle: "none", p: 0.5, m: 0 }}
                component="ul"
              >
                {alergias.map((alergia, index) => (
                  <li key={index}>
                    <Chip
                      label={alergia}
                      onDelete={() => removeAlergia(index)}
                      disabled={!editing}
                      icon={<CoronavirusIcon />}
                      variant={editing ? "outlined" : "default"}
                      color="warning"
                    />
                  </li>
                ))}
              </Paper>
            )}
          </Grid>

          <Grid item xs={12} sm={4}>
            <TextField
              variant="outlined" type="text" name="acudiente"
              label="Contacto de emergencia"
              value={personData.acudiente || ""} onChange={handleInputChange}
              fullWidth disabled={!editing} required
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              variant="outlined" type="text" name="tipo_acudiente"
              label={`Vínculo con ${personData.acudiente || ""}`}
              value={personData.tipo_acudiente || ""} onChange={handleInputChange}
              fullWidth disabled={!editing} required
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              variant="outlined" type="text" name="numero_acudiente"
              label={`Numero de ${personData.acudiente || ""}`}
              value={personData.numero_acudiente || ""} onChange={handleInputChange}
              fullWidth disabled={!editing} required
            />
          </Grid>
        </Grid>

        {editing ? (
          <>
            <Button
              className="perfil-btn-save"
              variant="contained"
              onClick={handleUpdateClick}
              color="success"
              startIcon={<SaveAltIcon />}
            >
              Guardar cambios
            </Button>
            <Button
              className="perfil-btn-cancel"
              variant="contained"
              onClick={handleCancelClick}
              color="error"
              startIcon={<CancelIcon />}
            >
              Cancelar
            </Button>
          </>
        ) : (
          <Button
            className="perfil-btn-edit"
            variant="contained"
            onClick={handleEditClick}
            startIcon={<EditIcon />}
          >
            Editar
          </Button>
        )}
      </div>
    </div>
  );
}