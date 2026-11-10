const alertas = require("../models/alertas");
const notificacoes = require("../models/notificacoes");
const veiculos = require("../models/veiculos");

const MAX_ALERTAS = 20;
const TERMO_MIN = 2;
const TERMO_MAX = 100;

// Tira acentos, espaços das pontas e maiúsculas, pra "Elétrica" casar com "eletrica".
function normalizar(texto) {
    return String(texto ?? "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .trim();
}

// O termo do alerta "consta" no texto do anúncio?
function termoConsta(termo, texto) {
    const t = normalizar(termo);
    return t.length > 0 && normalizar(texto).includes(t);
}

function paraNumeroOuNulo(valor) {
    const n = Number(valor);
    return valor !== "" && valor !== null && valor !== undefined && Number.isInteger(n) ? n : null;
}

// ---------------------------------------------------------------------------
// Chamada pelo server.js logo depois que um anúncio é publicado.
// Cruza o anúncio com os alertas e grava uma notificação (no máximo uma por
// usuário) para cada alerta compatível. Retorna quantos usuários foram avisados.
// Nunca deve derrubar a publicação: quem chama trata o erro.
// ---------------------------------------------------------------------------
async function gerarNotificacoes(anuncio) {
    const marca = (anuncio.marca || "").trim() || null;
    const modelo = (anuncio.modelo || "").trim() || null;
    const anoInicial = paraNumeroOuNulo(anuncio.ano_inicial);
    const anoFinal = paraNumeroOuNulo(anuncio.ano_final) ?? anoInicial;

    const candidatos = await alertas.buscarCandidatos({
        autorId: anuncio.usuario_id,
        marca,
        modelo,
        anoInicial,
        anoFinal
    });

    const texto = `${anuncio.nome || ""} ${anuncio.categoria || ""} ${anuncio.descricao || ""}`;
    const avisados = new Set();

    for (const alerta of candidatos) {
        if (!termoConsta(alerta.termo, texto)) continue;
        if (avisados.has(alerta.usuario_id)) continue;

        await notificacoes.criar(alerta.usuario_id, anuncio.id, alerta.id);
        avisados.add(alerta.usuario_id);
    }

    return avisados.size;
}

// ------------------------------- ALERTAS ----------------------------------

async function listarMeus(req, res) {
    try {
        res.json(await alertas.listarPorUsuario(req.session.usuarioId));
    } catch (erro) {
        console.error("Erro ao listar alertas:", erro);
        res.status(500).json({ erro: "Erro ao carregar seus alertas." });
    }
}

async function criar(req, res) {
    const termo = String(req.body.termo || "").trim();

    if (termo.length < TERMO_MIN || termo.length > TERMO_MAX) {
        return res.status(400).json({
            erro: `Descreva a peça com ${TERMO_MIN} a ${TERMO_MAX} caracteres (ex.: carburador).`
        });
    }

    try {
        const usuarioId = Number(req.session.usuarioId);
        const veiculo = await veiculos.buscarPorId(req.body.veiculo_id);

        // Só dá pra criar alerta para um veículo da própria garagem
        if (!veiculo || Number(veiculo.usuario_id) !== usuarioId) {
            return res.status(404).json({ erro: "Veículo não encontrado na sua garagem." });
        }

        if ((await alertas.contarPorUsuario(usuarioId)) >= MAX_ALERTAS) {
            return res.status(400).json({ erro: `Você já tem ${MAX_ALERTAS} alertas. Remova algum para criar outro.` });
        }

        const id = await alertas.criar(usuarioId, veiculo.id, termo);
        res.status(201).json({ id, mensagem: "Alerta criado. Avisaremos quando surgir uma peça compatível." });
    } catch (erro) {
        console.error("Erro ao criar alerta:", erro);
        res.status(500).json({ erro: "Erro ao salvar o alerta." });
    }
}

async function excluir(req, res) {
    try {
        const alerta = await alertas.buscarPorId(req.params.id);

        if (!alerta || Number(alerta.usuario_id) !== Number(req.session.usuarioId)) {
            return res.status(404).json({ erro: "Alerta não encontrado." });
        }

        await alertas.excluir(alerta.id);
        res.json({ mensagem: "Alerta removido." });
    } catch (erro) {
        console.error("Erro ao excluir alerta:", erro);
        res.status(500).json({ erro: "Erro ao remover o alerta." });
    }
}

// ----------------------------- NOTIFICAÇÕES -------------------------------

async function listarNotificacoes(req, res) {
    try {
        res.json(await notificacoes.listarPorUsuario(req.session.usuarioId));
    } catch (erro) {
        console.error("Erro ao listar notificações:", erro);
        res.status(500).json({ erro: "Erro ao carregar as notificações." });
    }
}

async function contarNaoLidas(req, res) {
    try {
        res.json({ total: await notificacoes.contarNaoLidas(req.session.usuarioId) });
    } catch (erro) {
        console.error("Erro ao contar notificações:", erro);
        res.status(500).json({ erro: "Erro ao contar as notificações." });
    }
}

async function marcarLida(req, res) {
    try {
        const alteradas = await notificacoes.marcarLida(req.params.id, req.session.usuarioId);
        res.json({ mensagem: alteradas ? "Notificação marcada como lida." : "Nada a atualizar." });
    } catch (erro) {
        console.error("Erro ao marcar notificação:", erro);
        res.status(500).json({ erro: "Erro ao atualizar a notificação." });
    }
}

async function marcarTodasLidas(req, res) {
    try {
        await notificacoes.marcarTodasLidas(req.session.usuarioId);
        res.json({ mensagem: "Todas as notificações foram marcadas como lidas." });
    } catch (erro) {
        console.error("Erro ao marcar notificações:", erro);
        res.status(500).json({ erro: "Erro ao atualizar as notificações." });
    }
}

module.exports = {
    gerarNotificacoes,
    termoConsta,
    listarMeus,
    criar,
    excluir,
    listarNotificacoes,
    contarNaoLidas,
    marcarLida,
    marcarTodasLidas
};
