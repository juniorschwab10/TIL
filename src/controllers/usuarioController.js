const bcrypt = require("bcryptjs");
const usuarios = require("../models/usuarios");

async function cadastrar(req, res) {
    const { nome, email, telefone, senha } = req.body;

    if (!nome || !email || !telefone || !senha) {
        return res.status(400).send("Preencha todos os campos.");
    }

    if (senha.length < 6) {
        return res.status(400).send("A senha deve ter pelo menos 6 caracteres.");
    }

    try {
        const emailFormatado = email.trim().toLowerCase();
        const senhaHash = await bcrypt.hash(senha, 10);

        await usuarios.criar(nome, emailFormatado, telefone, senhaHash);
        return res.redirect("/login");
    } catch (erro) {
        if (erro.code === "ER_DUP_ENTRY") {
            return res.status(409).send("Este e-mail já está cadastrado.");
        }
        console.error("Erro ao cadastrar usuário:", erro);
        return res.status(500).send("Não foi possível realizar o cadastro.");
    }
}

async function login(req, res) {
    const { email, senha } = req.body;

    try {
        const usuario = await usuarios.buscarPorEmail(email);
        if (!usuario) return res.redirect("/login");

        const senhaCorreta = await bcrypt.compare(senha, usuario.senha);
        if (!senhaCorreta) return res.redirect("/login");

        req.session.usuarioId = usuario.id;
        return res.redirect("/");
    } catch (erro) {
        console.error("Erro ao fazer login:", erro);
        return res.redirect("/login");
    }
}

function logout(req, res) {
    req.session.destroy(() => {
        res.redirect("/");
    });
}

async function listarPainelAdm(req, res) {
    try {
        const listaUsuarios = await usuarios.listarTodos();
        return res.render("adm", { usuarios: listaUsuarios }); 
    } catch (erro) {
        console.error("Erro ao carregar painel adm:", erro);
        return res.status(500).send("Erro ao carregar o painel.");
    }
}

async function atualizar(req, res) {
    const { nome, email, telefone, senha } = req.body;
    try {
        const senhaHash = senha ? await bcrypt.hash(senha, 10) : undefined;
        await usuarios.atualizar(req.params.id, nome, email, telefone, senhaHash);
        return res.redirect("/adm");
    } catch (erro) {
        console.error("Erro ao editar usuário:", erro);
        return res.redirect("/adm");
    }
}

async function excluir(req, res) {
    try {
        await usuarios.excluir(req.params.id);
        return res.redirect("/adm");
    } catch (erro) {
        console.error("Erro ao excluir usuário:", erro);
        return res.status(500).send("Erro ao excluir usuário.");
    }
}

module.exports = {
    cadastrar,
    login,
    logout,
    listarPainelAdm,
    atualizar,
    excluir
};