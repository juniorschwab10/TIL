// Garagem do usuário.
const express = require("express");
const { exigirLogin } = require("../middlewares/auth");
const veiculos = require("../controllers/veiculosController");

const router = express.Router();

router.get("/api/meus-veiculos", exigirLogin, veiculos.listarMeus);
router.post("/api/veiculos", exigirLogin, veiculos.criar);
router.put("/api/veiculos/:id", exigirLogin, veiculos.atualizar);
router.delete("/api/veiculos/:id", exigirLogin, veiculos.excluir);

module.exports = router;
