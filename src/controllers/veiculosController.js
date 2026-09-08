const veiculos = require("../models/veiculos");

async function listar(req, res) {
    try {
        const listaVeiculos = await veiculos.listarPorUsuario(req.session.usuarioId);
        return res.render("veiculos", { veiculos: listaVeiculos });
    } catch (erro) {
        console.error("Erro ao listar veículos:", erro);
        return res.status(500).send("Erro ao carregar veículos.");
    }
}

async function criar(req, res) {
    const { marca, modelo, ano_inicial, ano_final } = req.body;

    if (!marca || !modelo || !ano_inicial) {
        return res.status(400).send("Preencha marca, modelo e ano inicial.");
    }

    try {
        await veiculos.criar(req.session.usuarioId, marca, modelo, ano_inicial, ano_final || null);
        return res.redirect("/veiculos");
    } catch (erro) {
        console.error("Erro ao criar veículo:", erro);
        return res.status(500).send("Erro ao salvar o veículo.");
    }
}

async function atualizar(req, res) {
    const { marca, modelo, ano_inicial, ano_final } = req.body;

    try {
        const veiculo = await veiculos.buscarPorId(req.params.id);
        if (!veiculo || veiculo.usuario_id !== req.session.usuarioId) {
            return res.status(404).send("Veículo não encontrado.");
        }

        await veiculos.atualizar(req.params.id, marca, modelo, ano_inicial, ano_final || null);
        return res.redirect("/veiculos");
    } catch (erro) {
        console.error("Erro ao atualizar veículo:", erro);
        return res.redirect(`/veiculos/${req.params.id}/editar`);
    }
}

async function excluir(req, res) {
    try {
        const veiculo = await veiculos.buscarPorId(req.params.id);
        if (!veiculo || veiculo.usuario_id !== req.session.usuarioId) {
            return res.status(404).send("Veículo não encontrado.");
        }

        await veiculos.excluir(req.params.id);
        return res.redirect("/veiculos");
    } catch (erro) {
        console.error("Erro ao excluir veículo:", erro);
        return res.status(500).send("Erro ao excluir veículo.");
    }
}

module.exports = {
    listar,
    criar,
    atualizar,
    excluir
};