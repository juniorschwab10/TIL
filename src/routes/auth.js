// Cadastro, login e logout.
const express = require("express");
const auth = require("../controllers/authController");

const router = express.Router();

router.post("/cadastro", auth.cadastrar);
router.post("/login", auth.login);
router.get("/logout", auth.logout);

module.exports = router;
