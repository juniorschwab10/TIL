// Monta o aplicativo Express: leitura de dados, sessão, arquivos
// estáticos, rotas e tratamento de erros. Não liga o servidor (isso é
// feito no server.js), o que facilita testar o app separadamente.
const express = require("express");
const path = require("path");
const session = require("express-session");
const { protegerPaginas } = require("./middlewares/auth");
const rotas = require("./routes");

const app = express();
const PUBLIC = path.join(__dirname, "..", "public");

// EJS: res.render("admin/adm") procura views/admin/adm.ejs
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "..", "views"));

// Leitura de formulários e de JSON
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Sessão (guarda quem está logado)
app.use(session({
    secret: process.env.SESSION_SECRET || "segredo_super_secreto",
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 1000 * 60 * 60 * 2 } // 2 horas
}));

// Páginas HTML que exigem login. Precisa vir ANTES dos arquivos estáticos,
// senão o express.static entregaria o arquivo sem checar o login.
app.use(protegerPaginas);

// Arquivos estáticos: cada pasta de public/ tem um papel.
//   css/    folhas de estilo
//   js/     scripts do navegador
//   img/    imagens do site
//   pages/  páginas HTML (entregues na raiz: /login.html, /anuncios.html ...)
app.use("/css", express.static(path.join(PUBLIC, "css")));
app.use("/js", express.static(path.join(PUBLIC, "js")));
app.use("/img", express.static(path.join(PUBLIC, "img")));
app.use(express.static(path.join(PUBLIC, "pages"), { index: false }));

// Rotas da aplicação (páginas e API)
app.use(rotas);

// Tratamento de erros vindos do Multer (arquivo grande demais, tipo
// inválido, etc.) — sem isso o usuário veria uma tela de erro genérica.
app.use((erro, req, res, next) => {
    if (erro) {
        console.error("Erro no upload:", erro.message);
        return res.status(400).send(erro.message);
    }
    next();
});

module.exports = app;
