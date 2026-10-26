const avaliacoes = require("../models/avaliacoes");
const anuncios = require("../models/anuncios");
const interesses = require("../models/interesses");

const MAX_COMENTARIO = 500;

// Descobre se (e por que não) o usuário pode avaliar o vendedor deste anúncio.
// Retorna null quando pode avaliar; senão, um código com o motivo.
// Regra: só quem clicou em "Tenho interesse" no anúncio avalia, nunca o
// próprio vendedor, e só uma vez por anúncio.
async function motivoDeNaoPoderAvaliar(usuarioId, anuncio) {
    if (!usuarioId) return "login";
    if (usuarioId === Number(anuncio.usuario_id)) return "vendedor";
    if (!(await interesses.existe(usuarioId, anuncio.id))) return "sem-interesse";
    if (await avaliacoes.buscarDoAvaliador(usuarioId, anuncio.id)) return "ja-avaliou";
    return null;
}

// Rota pública: mostra as avaliações do vendedor do anúncio. Se houver
// alguém logado, também informa se essa pessoa pode avaliar agora.
async function listarPorAnuncio(req, res) {
    try {
        const anuncio = await anuncios.buscarPorId(req.params.id);

        if (!anuncio) {
            return res.status(404).json({ erro: "Anúncio não encontrado." });
        }

        const usuarioId = req.session.usuarioId ? Number(req.session.usuarioId) : null;
        const vendedorId = Number(anuncio.usuario_id);

        const [resumo, lista, motivo] = await Promise.all([
            avaliacoes.resumoDoVendedor(vendedorId),
            avaliacoes.listarPorVendedor(vendedorId),
            motivoDeNaoPoderAvaliar(usuarioId, anuncio)
        ]);

        res.json({
            souVendedor: usuarioId === vendedorId,
            podeAvaliar: motivo === null,
            motivo,
            media: resumo.media,
            total: resumo.total,
            avaliacoes: lista
        });
    } catch (erro) {
        console.error("Erro ao listar avaliações:", erro);
        res.status(500).json({ erro: "Erro ao carregar as avaliações." });
    }
}

// Cria uma avaliação (nota de 1 a 5 + comentário opcional).
async function criar(req, res) {
    const nota = Number(req.body.nota);
    const comentario = (req.body.comentario || "").trim();

    if (!Number.isInteger(nota) || nota < 1 || nota > 5) {
        return res.status(400).json({ erro: "A nota deve ser um número de 1 a 5." });
    }

    if (comentario.length > MAX_COMENTARIO) {
        return res.status(400).json({ erro: `O comentário pode ter no máximo ${MAX_COMENTARIO} caracteres.` });
    }

    try {
        const anuncio = await anuncios.buscarPorId(req.params.id);

        if (!anuncio) {
            return res.status(404).json({ erro: "Anúncio não encontrado." });
        }

        const usuarioId = Number(req.session.usuarioId);
        const motivo = await motivoDeNaoPoderAvaliar(usuarioId, anuncio);

        if (motivo === "vendedor") {
            return res.status(403).json({ erro: "Você não pode avaliar o seu próprio anúncio." });
        }
        if (motivo === "sem-interesse") {
            return res.status(403).json({ erro: 'Clique em "Tenho interesse" neste anúncio antes de avaliar.' });
        }
        if (motivo === "ja-avaliou") {
            return res.status(409).json({ erro: "Você já avaliou este vendedor por este anúncio." });
        }

        await avaliacoes.criar(anuncio.id, usuarioId, anuncio.usuario_id, nota, comentario);
        res.status(201).json({ mensagem: "Avaliação enviada. Obrigado!" });
    } catch (erro) {
        // A chave UNIQUE do banco também barra duplicata (duplo clique, por exemplo)
        if (erro.code === "ER_DUP_ENTRY") {
            return res.status(409).json({ erro: "Você já avaliou este vendedor por este anúncio." });
        }
        console.error("Erro ao criar avaliação:", erro);
        res.status(500).json({ erro: "Erro ao salvar a avaliação." });
    }
}

// O vendedor responde publicamente a uma avaliação recebida (uma vez só).
async function responder(req, res) {
    const resposta = (req.body.resposta || "").trim();

    if (!resposta) {
        return res.status(400).json({ erro: "Escreva a resposta antes de enviar." });
    }

    if (resposta.length > MAX_COMENTARIO) {
        return res.status(400).json({ erro: `A resposta pode ter no máximo ${MAX_COMENTARIO} caracteres.` });
    }

    try {
        const avaliacao = await avaliacoes.buscarPorId(req.params.id);

        if (!avaliacao) {
            return res.status(404).json({ erro: "Avaliação não encontrada." });
        }

        if (Number(avaliacao.vendedor_id) !== Number(req.session.usuarioId)) {
            return res.status(403).json({ erro: "Só o vendedor avaliado pode responder." });
        }

        if (avaliacao.resposta) {
            return res.status(409).json({ erro: "Esta avaliação já foi respondida." });
        }

        await avaliacoes.responder(avaliacao.id, resposta);
        res.json({ mensagem: "Resposta publicada." });
    } catch (erro) {
        console.error("Erro ao responder avaliação:", erro);
        res.status(500).json({ erro: "Erro ao salvar a resposta." });
    }
}

module.exports = {
    listarPorAnuncio,
    criar,
    responder
};