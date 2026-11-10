// Interesses ("Tenho interesse"), que funcionam como favoritos.
const interesses = require("../models/interesses");
const anuncios = require("../models/anuncios");

async function listarMeus(req, res) {
    try {
        res.json(await interesses.listarPorUsuario(req.session.usuarioId));
    } catch (erro) {
        console.error("Erro ao listar interesses:", erro);
        res.status(500).json({ erro: "Erro ao carregar seus interesses." });
    }
}

// Informa se o usuário logado já marcou interesse neste anúncio.
// Usada pelo botão "Tenho interesse" pra abrir no estado certo.
// Sem login, simplesmente responde "interessado: false".
async function verificar(req, res) {
    try {
        if (!req.session.usuarioId) {
            return res.json({ interessado: false });
        }

        const interessado = await interesses.existe(req.session.usuarioId, req.params.anuncioId);
        res.json({ interessado });
    } catch (erro) {
        console.error("Erro ao verificar interesse:", erro);
        res.status(500).json({ erro: "Erro ao verificar o interesse." });
    }
}

async function adicionar(req, res) {
    try {
        const anuncio = await anuncios.buscarPorId(req.params.anuncioId);

        if (!anuncio) {
            return res.status(404).json({ erro: "Anúncio não encontrado." });
        }

        await interesses.adicionar(req.session.usuarioId, anuncio.id);
        res.status(201).json({ mensagem: "Peça adicionada aos seus interesses." });
    } catch (erro) {
        console.error("Erro ao adicionar interesse:", erro);
        res.status(500).json({ erro: "Erro ao salvar o interesse." });
    }
}

async function remover(req, res) {
    try {
        await interesses.remover(req.session.usuarioId, req.params.anuncioId);
        res.json({ mensagem: "Interesse removido." });
    } catch (erro) {
        console.error("Erro ao remover interesse:", erro);
        res.status(500).json({ erro: "Erro ao remover o interesse." });
    }
}

module.exports = { listarMeus, verificar, adicionar, remover };
