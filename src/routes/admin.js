// Painel administrativo (só o administrador acessa).
const express = require("express");
const { exigirAdmin } = require("../middlewares/auth");
const admin = require("../controllers/adminController");

const router = express.Router();

router.get("/adm", exigirAdmin, admin.painel);
router.get("/usuarios/:id", exigirAdmin, admin.detalhe);
router.get("/usuarios/:id/editar", exigirAdmin, admin.formEditar);
router.post("/usuarios/:id/editar", exigirAdmin, admin.salvarEdicao);
router.post("/usuarios/:id/excluir", exigirAdmin, admin.excluir);

module.exports = router;
