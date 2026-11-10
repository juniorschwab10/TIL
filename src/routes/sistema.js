// Rotas de diagnóstico.
const express = require("express");
const banco = require("../config/database");

const router = express.Router();

router.get("/teste-banco", async (req, res) => {
    try {
        const [resultado] = await banco.query("SELECT 1 AS conexao");

        return res.json({
            mensagem: "Conexão com o banco realizada com sucesso!",
            resultado
        });
    } catch (erro) {
        console.error("Erro na rota /teste-banco:", erro);

        return res.status(500).json({
            mensagem: "Não foi possível conectar ao banco.",
            codigo: erro.code,
            erro: erro.message
        });
    }
});

module.exports = router;
