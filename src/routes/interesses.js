// Interesses ("Tenho interesse"), usados como favoritos.
const express = require("express");
const { exigirLogin } = require("../middlewares/auth");
const interesses = require("../controllers/interessesController");

const router = express.Router();

router.get("/api/meus-interesses", exigirLogin, interesses.listarMeus);

// Pública: sem login, responde "interessado: false"
router.get("/api/interesses/:anuncioId", interesses.verificar);
router.post("/api/interesses/:anuncioId", exigirLogin, interesses.adicionar);
router.delete("/api/interesses/:anuncioId", exigirLogin, interesses.remover);

module.exports = router;
