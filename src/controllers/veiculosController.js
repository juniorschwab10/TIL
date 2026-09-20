const veiculos = require("../models/veiculos");

// Lista os veículos do usuário logado (usado na tela "Minha garagem")
async function listarMeus(req, res) {
    try {
        const listaVeiculos = await veiculos.listarPorUsuario(req.session.usuarioId);
        return res.json(listaVeiculos);
    } catch (erro) {
        console.error("Erro ao listar veículos:", erro);
        return res.status(500).json({ erro: "Erro ao carregar veículos." });
    }
}

// Cria um veículo vinculado ao usuário logado
async function criar(req, res) {
    const { marca, modelo, ano_inicial, ano_final } = req.body;

    if (!marca || !modelo || !ano_inicial) {
        return res.status(400).json({ erro: "Preencha marca, modelo e ano inicial." });
    }

    try {
        const veiculo = await veiculos.criar(
            req.session.usuarioId,
            marca,
            modelo,
            ano_inicial,
            ano_final || null
        );
        return res.status(201).json(veiculo);
    } catch (erro) {
        console.error("Erro ao criar veículo:", erro);
        return res.status(500).json({ erro: "Erro ao salvar o veículo." });
    }
}

// Atualiza um veículo, garantindo que ele pertence ao usuário logado
async function atualizar(req, res) {
    const { marca, modelo, ano_inicial, ano_final } = req.body;

    try {
        const veiculo = await veiculos.buscarPorId(req.params.id);

        if (!veiculo || veiculo.usuario_id !== req.session.usuarioId) {
            return res.status(404).json({ erro: "Veículo não encontrado." });
        }

        const atualizado = await veiculos.atualizar(
            req.params.id,
            marca,
            modelo,
            ano_inicial,
            ano_final || null
        );

        return res.json(atualizado);
    } catch (erro) {
        console.error("Erro ao atualizar veículo:", erro);
        return res.status(500).json({ erro: "Erro ao atualizar o veículo." });
    }
}

// Exclui um veículo, garantindo que ele pertence ao usuário logado
async function excluir(req, res) {
    try {
        const veiculo = await veiculos.buscarPorId(req.params.id);

        if (!veiculo || veiculo.usuario_id !== req.session.usuarioId) {
            return res.status(404).json({ erro: "Veículo não encontrado." });
        }

        await veiculos.excluir(req.params.id);
        return res.json({ mensagem: "Veículo excluído com sucesso." });
    } catch (erro) {
        console.error("Erro ao excluir veículo:", erro);
        return res.status(500).json({ erro: "Erro ao excluir veículo." });
    }
}

module.exports = {
    listarMeus,
    criar,
    atualizar,
    excluir
};