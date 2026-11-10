// Alertas de compatibilidade e notificações.
const express = require("express");
const { exigirLogin } = require("../middlewares/auth");
const alertas = require("../controllers/alertasController");

const router = express.Router();

router.get("/api/meus-alertas", exigirLogin, alertas.listarMeus);
router.post("/api/alertas", exigirLogin, alertas.criar);
router.delete("/api/alertas/:id", exigirLogin, alertas.excluir);

router.get("/api/notificacoes", exigirLogin, alertas.listarNotificacoes);
router.get("/api/notificacoes/nao-lidas", exigirLogin, alertas.contarNaoLidas);
router.put("/api/notificacoes/lidas", exigirLogin, alertas.marcarTodasLidas);
router.put("/api/notificacoes/:id/lida", exigirLogin, alertas.marcarLida);

module.exports = router;
