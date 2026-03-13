//Este jsx es muy importante, sin esto se cae RIO, no lo borren
export default function Doom() {
  const controls = [
    { key: "↑ / W", action: "Avanzar" },
    { key: "↓ / S", action: "Retroceder" },
    { key: "← / →", action: "Girar" },
    { key: "Alt + ← →", action: "Desplazarse lateral" },
    { key: "Ctrl", action: "Disparar" },
    { key: "Space", action: "Abrir puertas" },
    { key: "Shift", action: "Correr" },
    { key: "1 - 7", action: "Cambiar arma" },
    { key: "Tab", action: "Mapa" },
    { key: "F1", action: "Ayuda" },
    { key: "Esc", action: "Menú" },
  ];

  return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh", backgroundColor: "#000", gap: "24px" }}>
      
      {/* Juego */}
      <div style={{ position: "relative", width: "800px", height: "620px", flexShrink: 0 }}>
        <iframe
          src="https://diekmann.github.io/wasm-fizzbuzz/doom/"
          style={{ width: "100%", height: "100%", border: "none" }}
          allowFullScreen
          title="DOOM"
        />
        <div style={{ position: "absolute", bottom: 0, left: 0, width: "100%", height: "40px", backgroundColor: "#000" }} />
      </div>

      {/* Panel de controles */}
      <div style={{
        color: "#fff",
        fontFamily: "monospace",
        backgroundColor: "#1a1a1a",
        border: "1px solid #b22222",
        borderRadius: "8px",
        padding: "20px",
        width: "220px",
        flexShrink: 0
      }}>
        <h3 style={{ color: "#b22222", textAlign: "center", marginBottom: "16px", letterSpacing: "2px", fontSize: "14px" }}>
          ☠ CONTROLES ☠
        </h3>
        {controls.map(({ key, action }) => (
          <div key={key} style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px", fontSize: "12px", borderBottom: "1px solid #333", paddingBottom: "6px" }}>
            <span style={{ color: "#b22222", fontWeight: "bold", marginRight: "8px" }}>{key}</span>
            <span style={{ color: "#ccc", textAlign: "right" }}>{action}</span>
          </div>
        ))}
      </div>

    </div>
  );
}