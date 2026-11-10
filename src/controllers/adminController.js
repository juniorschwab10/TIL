// Painel administrativo: gerenciamento das contas de usuários.
const bcrypt = require("bcryptjs");
const usuarios = require("../models/usuarios");
const { ADMIN_ID } = require("../middlewares/auth");

async function painel(req, res) {
    try {
        const listaUsuarios = await usuarios.listarTodos();
        res.render("admin/adm", { listaUsuarios, adminId: ADMIN_ID });
    } catch (erro) {
        console.error("Erro ao carregar painel adm:", erro);
        res.status(500).send("Erro ao carregar o painel.");
    }
}

// Mostra id, nome, e-mail e telefone, sem formulário nenhum
async function detalhe(req, res) {
    try {
        const usuario = await usuarios.buscarPorId(req.params.id);

        if (!usuario) {
            return res.status(404).render("admin/usuarioNaoEncontrado", {
                mensagem: `Não existe nenhum usuário com o ID ${req.params.id}.`
            });
        }

        res.render("admin/usuarioDetalhe", { usuario });
    } catch (erro) {
        console.error("Erro ao carregar usuário:", erro);
        res.status(500).send("Erro ao carregar o usuário.");
    }
}

async function formEditar(req, res) {
    try {
        const usuario = await usuarios.buscarPorId(req.params.id);

        if (!usuario) {
            return res.status(404).render("admin/usuarioNaoEncontrado", {
                mensagem: `Não existe nenhum usuário com o ID ${req.params.id} para editar.`
            });
        }

        res.render("admin/usuarioEditar", { usuario });
    } catch (erro) {
        console.error("Erro ao carregar usuário para edição:", erro);
        res.status(500).send("Erro ao carregar o usuário.");
    }
}

async function salvarEdicao(req, res) {
    const { nome, email, telefone, senha } = req.body;

    try {
        const emailFormatado = email.trim().toLowerCase();
        const senhaHash = senha ? await bcrypt.hash(senha, 10) : undefined;

        await usuarios.atualizar(req.params.id, nome, emailFormatado, telefone, senhaHash);

        res.redirect("/adm");
    } catch (erro) {
        console.error("Erro ao editar: ", erro);
        res.redirect(`/usuarios/${req.params.id}/editar`);
    }
}

// O administrador não pode excluir a própria conta por aqui
async function excluir(req, res) {
    if (Number(req.params.id) === ADMIN_ID) {
        return res.status(400).send("A conta do administrador não pode ser excluída.");
    }

    try {
        await usuarios.excluir(req.params.id);
        res.redirect("/adm");
    } catch (erro) {
        console.error("Erro ao excluir usuário:", erro);
        res.status(500).send("Erro ao excluir usuário.");
    }
}

module.exports = { painel, detalhe, formEditar, salvarEdicao, excluir };
