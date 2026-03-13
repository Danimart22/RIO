import { Router } from "express";

const router = Router();

router.get("/health", (req, res) => {
    res.json({
        message: "Hola Mundo me llamo BYOSTAR-RIO-SYNC  y estoy corriendo 🏃🏿💨",
        status: "ok",
        timestamp: new Date().toISOString()
    });
});

export default router;