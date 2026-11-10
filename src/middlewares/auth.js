// Middlewares de autenticação e autorização.

// ID do usuário administrador (pode vir do .env; se não tiver, usa o 1)
const ADMIN_ID = Number(process.env.ADMIN_ID) || 1;

// Só deixa passar quem está logado; os demais vão para o login.
function exigirLogin(req, res, next) {
    if (req.session.usuarioId) {
        // no-store: o navegador não guarda a página em cache, então o botão
        // "voltar" (ou a página vista antes do logout) sempre pergunta ao
        // servidor se a pessoa ainda está logada.
        res.set("Cache-Control", "no-store");
        return next();
    }
    return res.redirect("/login");
}

// Só o administrador passa. Quem não está logado vai pro login;
// quem está logado mas não é admin recebe 403.
function exigirAdmin(req, res, next) {
    if (!req.session.usuarioId) {
        return res.redirect("/login");
    }
    if (Number(req.session.usuarioId) === ADMIN_ID) {
        return next();
    }
    return res.status(403).send("Acesso restrito ao administrador.");
}

// Páginas HTML (public/pages) que só podem ser abertas logado.
const PAGINAS_PROTEGIDAS = [
    "/perfil.html",
    "/publicar-anuncio.html",
    "/garagem.html",
    "/meus-anuncios.html",
    "/editar-anuncio.html",
    "/meus-interesses.html",
    "/alertas.html"
];

function protegerPaginas(req, res, next) {
    if (PAGINAS_PROTEGIDAS.includes(req.path)) {
        return exigirLogin(req, res, next);
    }
    next();
}

module.exports = { ADMIN_ID, exigirLogin, exigirAdmin, protegerPaginas };
