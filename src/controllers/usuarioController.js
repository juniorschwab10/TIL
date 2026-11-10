// Perfil do usuário logado (a página "Meu perfil").
const usuarios = require("../models/usuarios");
const anuncios = require("../models/anuncios");
const veiculos = require("../models/veiculos");

// Dados do usuário + contagens da seção "Minha atividade"
async function meuPerfil(req, res) {
    try {
        const usuario = await usuarios.buscarPorId(req.session.usuarioId);
        if (!usuario) {
            return res.status(404).json({ erro: "Usuário não encontrado." });
        }

        const totalAnuncios = await anuncios.contarPorUsuario(req.session.usuarioId);
        const totalVeiculos = await veiculos.contarPorUsuario(req.session.usuarioId);

        res.json({ ...usuario, totalAnuncios, totalVeiculos });
    } catch (erro) {
        console.error("Erro ao buscar perfil:", erro);
        res.status(500).json({ erro: "Erro no servidor." });
    }
}

async function atualizarMeuPerfil(req, res) {
    const { nome, email, telefone } = req.body;

    if (!nome || !email || !telefone) {
        return res.status(400).json({ erro: "Preencha todos os campos." });
    }

    try {
        // E-mail sempre em minúsculas, igual ao cadastro, senão o login falha
        const emailFormatado = email.trim().toLowerCase();

        await usuarios.atualizar(req.session.usuarioId, nome, emailFormatado, telefone);
        res.json({ mensagem: "Perfil atualizado com sucesso!" });
    } catch (erro) {
        if (erro.code === "ER_DUP_ENTRY") {
            return res.status(409).json({ erro: "Este e-mail já está em uso." });
        }
        console.error("Erro ao atualizar perfil:", erro);
        res.status(500).json({ erro: "Erro ao atualizar os dados." });
    }
}

module.exports = { meuPerfil, atualizarMeuPerfil };
