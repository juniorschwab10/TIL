// Anúncios de peças: catálogo, publicação, "meus anúncios" e edição.
const express = require("express");
const { upload } = require("../config/upload");
const { exigirLogin } = require("../middlewares/auth");
const anuncios = require("../controllers/anuncioController");

const router = express.Router();

// Catálogo público (aceita busca, filtros e ordenação pela query string)
router.get("/api/anuncios", anuncios.listar);
router.get("/api/anuncios/:id", anuncios.detalhar);

// Publicar: upload.array("imagens", 3) recebe até 3 fotos do campo "imagens"
router.post("/anuncios", exigirLogin, upload.array("imagens", 3), anuncios.publicar);

// Área do dono do anúncio
router.get("/api/meus-anuncios", exigirLogin, anuncios.listarMeus);
router.get("/api/anuncios/:id/editar", exigirLogin, anuncios.buscarParaEditar);
router.put("/api/anuncios/:id", exigirLogin, upload.array("novasImagens", 3), anuncios.atualizar);
router.delete("/api/anuncios/:id/imagens/:imagemId", exigirLogin, anuncios.excluirImagem);
router.delete("/api/anuncios/:id", exigirLogin, anuncios.excluir);

module.exports = router;
