// Reputação do vendedor.
const express = require("express");
const { exigirLogin } = require("../middlewares/auth");
const avaliacoes = require("../controllers/avaliacoesController");

const router = express.Router();

// Pública: avaliações do vendedor do anúncio + se o usuário logado pode avaliar
router.get("/api/anuncios/:id/avaliacoes", avaliacoes.listarPorAnuncio);
router.post("/api/anuncios/:id/avaliacoes", exigirLogin, avaliacoes.criar);
router.put("/api/avaliacoes/:id/resposta", exigirLogin, avaliacoes.responder);

module.exports = router;
