// Rotas que entregam páginas HTML "bonitas" (sem .html na URL).
// As demais páginas são entregues direto pela pasta public/pages.
const express = require("express");
const path = require("path");
const { exigirLogin } = require("../middlewares/auth");

const router = express.Router();
const PAGINAS = path.join(__dirname, "..", "..", "public", "pages");

const enviar = (arquivo) => (req, res) => res.sendFile(path.join(PAGINAS, arquivo));

// Página inicial: versão "logada" ou versão pública
router.get("/", (req, res) => {
    const arquivo = req.session.usuarioId ? "inicio.html" : "inicio-visitante.html";
    enviar(arquivo)(req, res);
});

router.get("/login", enviar("login.html"));
router.get("/cadastro", enviar("cadastro.html"));

// Páginas da área logada
router.get("/garagem", exigirLogin, enviar("garagem.html"));
router.get("/meus-anuncios", exigirLogin, enviar("meus-anuncios.html"));
router.get("/meus-interesses", exigirLogin, enviar("meus-interesses.html"));
router.get("/alertas", exigirLogin, enviar("alertas.html"));

// A checagem de QUEM é o dono do anúncio acontece na API, não aqui:
// esta rota só entrega o HTML, quem busca os dados é o fetch do front-end.
router.get("/anuncios/:id/editar", exigirLogin, enviar("editar-anuncio.html"));

module.exports = router;
