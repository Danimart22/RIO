import { Router } from "express";

const router = Router();

router.get("/health", (req, res) => {
    res.json({
        message: "Hola Mundo me llamo RIO backend tungtung sahuuuuuuuuuuuruururururuiasjk312312e1uj3jh12kjnwjbfdjknoij123lk312k 🧑🏿‍🦽‍➡️🧑🏿‍🦯‍➡️🧏🏿🫃🏿",
        status: "ok",
        timestamp: new Date().toISOString()
    });
});

export default router;