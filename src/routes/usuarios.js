// Perfil do próprio usuário logado.
const express = require("express");
const { exigirLogin } = require("../middlewares/auth");
const usuario = require("../controllers/usuarioController");

const router = express.Router();

router.get("/api/meu-perfil", exigirLogin, usuario.meuPerfil);
router.put("/api/meu-perfil", exigirLogin, usuario.atualizarMeuPerfil);

module.exports = router;
