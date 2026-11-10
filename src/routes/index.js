// Junta todos os arquivos de rotas. Cada arquivo cuida de um assunto.
const express = require("express");
const router = express.Router();

router.use(require("./paginas"));
router.use(require("./auth"));
router.use(require("./usuarios"));
router.use(require("./admin"));
router.use(require("./anuncios"));
router.use(require("./avaliacoes"));
router.use(require("./alertas"));
router.use(require("./veiculos"));
router.use(require("./interesses"));
router.use(require("./sistema"));

module.exports = router;
