const express = require("express");
const path = require("path");
const bcrypt = require("bcryptjs");
const session = require("express-session");
// fs/promises: usado pra apagar o arquivo temporário depois do upload
const fs = require("fs/promises");
const banco = require("./src/config/database");
const { cloudinary, upload } = require("./src/config/upload");
const usuarios = require("./src/models/usuarios");
const anuncios = require("./src/models/anuncios");
const veiculos = require("./src/models/veiculos");
const imagens = require("./src/models/imagens");
const veiculosController = require("./src/controllers/veiculosController");
const anunciosController = require("./src/controllers/anuncioController");

const app = express();
const PORT = 3000;

// Configura o EJS como "view engine": a partir daqui, res.render("nome")
// procura o arquivo em views/nome.ejs automaticamente.
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Permite receber dados de formulários
app.use(express.urlencoded({ extended: true }));

// Permite receber dados em formato JSON
app.use(express.json());

// Configura a sessão
app.use(session({
    secret: "segredo_super_secreto",
    resave: false,
    saveUninitialized: false,
    cookie: { 
        maxAge: 1000 * 60 * 60 * 2 
     } // Tempo de vida do cookie/sessão
}));

// Disponibiliza os arquivos da pasta public
app.use(express.static(path.join(__dirname, "public")));

function exigirLogin(req, res, next) {
    if (req.session.usuarioId){
// next() significa "pode passar, segue pra rota normal".
        return next();
    }
    return res.redirect("/login");
}

//
// ROTAS GET: ABRIR PAGINAS
//

// pagina inicial
app.get("/", (req, res) => {
    if(req.session.usuarioId) {
    // Está logado -> mostra a versão "logada" da página inicial   
        res.sendFile(path.join(__dirname, "public", "Pagina_2.html"));
    }else {
    // Não está logado -> mostra a versão pública
    res.sendFile(path.join(__dirname, "public", "Pagina_1.html"))
    }
});

// login
app.get("/login", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "login.html"));
});

// cadastro
app.get("/cadastro", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "cadastro.html"));
});

// Rota da pagina do administrador
app.get("/adm", exigirLogin, async (req, res) => {
    const listaUsuarios = await usuarios.listarTodos();
    res.render("adm", { listaUsuarios });
});

// Rota de detalhe: mostra id, nome, email e telefone, sem formulário nenhum
// Também protegida: só quem está logado pode ver os dados de um usuário.
app.get("/usuarios/:id", exigirLogin, async (req, res) => {
    const usuario = await usuarios.buscarPorId(req.params.id);

    if (!usuario) {
        return res.status(404).render("usuario-nao-encontrado", {
            mensagem: `Não existe nenhum usuário com o ID ${req.params.id}.`
        });
    }

    res.render("usuario-detalhe", { usuario });
});

// Rota da API para buscar os dados do usuário logado na sessão
app.get("/api/meu-perfil", exigirLogin, async (req, res) => {
    try {
        const usuario = await usuarios.buscarPorId(req.session.usuarioId);
        if (!usuario) {
            return res.status(404).json({ erro: "Usuário não encontrado." });
        }

        // Contagens reais para a seção "Minha atividade" do perfil
        const totalAnuncios = await anuncios.contarPorUsuario(req.session.usuarioId);
        const totalVeiculos = await veiculos.contarPorUsuario(req.session.usuarioId);

        res.json({
            ...usuario,
            totalAnuncios,
            totalVeiculos
        });
    } catch (erro) {
        console.error("Erro ao buscar perfil:", erro);
        res.status(500).json({ erro: "Erro no servidor." });
    }
});

// Rota da API para atualizar o próprio perfil
app.put("/api/meu-perfil", exigirLogin, async (req, res) => {
    const { nome, email, telefone } = req.body;
    try {
        await usuarios.atualizar(req.session.usuarioId, nome, email, telefone);
        res.json({ mensagem: "Perfil atualizado com sucesso!" });
    } catch (erro) {
        console.error("Erro ao atualizar perfil:", erro);
        res.status(500).json({ erro: "Erro ao atualizar os dados." });
    }
});

//
// ROTAS POST: RECEBER DADOS
//

//  Rota para receber o formulario de cadastro
app.post("/cadastro", async (req, res) => {
    const { nome, email, telefone, senha } = req.body;

    if (!nome || !email || !telefone || !senha) {
        return res.status(400).send(
            "Preencha todos os campos."
        );
    }

    if (senha.length < 6) {
        return res.status(400).send(
            "A senha deve ter pelo menos 6 caracteres."
        );
    }

    try {
        const emailFormatado = email.trim().toLowerCase();
        const senhaHash = await bcrypt.hash(senha, 10);

        const usuarioCriado = await usuarios.criar(
            nome,
            emailFormatado,
            telefone,
            senhaHash
        );

        console.log("Usuário cadastrado:", usuarioCriado);

        return res.redirect("/login");
    } catch (erro) {
        if (erro.code === "ER_DUP_ENTRY") {
            return res.status(409).send(
                "Este e-mail já está cadastrado."
            );
        }

        console.error("Erro ao cadastrar usuário:", erro);

        return res.status(500).send(
            "Não foi possível realizar o cadastro."
        );
    }
});

// Tela de edição — também protegida por login
app.get("/usuarios/:id/editar", exigirLogin, async (req, res) => {
    const usuario = await usuarios.buscarPorId(req.params.id);

    if (!usuario) {
        return res.status(404).render("usuario-nao-encontrado", {
            mensagem: `Não existe nenhum usuário com o ID ${req.params.id} para editar.`
        });
    }

    res.render("usuario-editar", { usuario });
});

// Salvar edição
app.post("/usuarios/:id/editar", exigirLogin, async (req, res) => {
    const { nome, email, telefone, senha } = req.body;

    try {
        const senhaHash = senha ? await bcrypt.hash(senha, 10) : undefined;

        await usuarios.atualizar(req.params.id, nome, email, telefone, senhaHash);

        res.redirect("/adm");
    } catch (erro) {
        console.error("Erro ao editar: ", erro);
        res.redirect(`/usuarios/${req.params.id}/editar`);
    }
});

// Excluir
app.post("/usuarios/:id/excluir", exigirLogin, async (req, res) => {
    await usuarios.excluir(req.params.id);
    res.redirect("/adm");
});

// Rota para receber o formulario de login
app.post("/login", async (req, res) => {
    const email = req.body.email;
    const senha = req.body.senha;

    try {
        const usuario = await usuarios.buscarPorEmail(email);

        if (!usuario) {
            return res.redirect("/login");
        }

        const senhaCorreta = await bcrypt.compare(
            senha, usuario.senha
        );

        if (!senhaCorreta) {
            return res.redirect("/login");
        }

        req.session.usuarioId = usuario.id;

        res.redirect("/");
    } catch (erro) {
        console.error(
            "erro ao fazer login: ", erro
        );

        res.redirect("/login");
    }
});

// Rota de logout: apaga a sessão, ou seja, "esquece" que essa pessoa estava logada.

app.get("/logout", (req, res) => {
    //req.session.destroy() remove os dados da sessão guardados no
    // servidor e invalida o cookie. O callback roda depois que a
    // destruição termina (é uma operação assíncrona por baixo dos panos).
    req.session.destroy(() =>{
        res.redirect("/");
    });
});

//
// ROTAS DE ANÚNCIOS
//

// API para buscar a lista de anúncios cadastrados (usada via Fetch no HTML).
// Aceita busca por palavra-chave, filtros combinados e ordenação via
// query string, por exemplo:
//   /api/anuncios?busca=carburador&categoria=Motor&ordenar=menor-preco
app.get("/api/anuncios", async (req, res) => {
    try {
        const { busca, marca, modelo, ano, categoria, condicao, localizacao, ordenar } = req.query;

        // Ano precisa ser um número válido pra entrar no filtro — um
        // "?ano=abc" na URL, por exemplo, é simplesmente ignorado.
        const anoNumero = Number(ano);

        const listaAnuncios = await anuncios.listarTodos({
            busca: busca?.trim() || undefined,
            marca: marca?.trim() || undefined,
            modelo: modelo?.trim() || undefined,
            ano: ano && Number.isInteger(anoNumero) ? anoNumero : undefined,
            categoria: categoria?.trim() || undefined,
            condicao: condicao?.trim() || undefined,
            localizacao: localizacao?.trim() || undefined,
            ordenar: ordenar?.trim() || undefined
        });

        res.json(listaAnuncios);
    } catch (erro) {
        console.error("Erro na rota /api/anuncios:", erro);
        res.status(500).json({ erro: "Erro ao buscar a listagem de anúncios." });
    }
});

// Processa o formulário enviado da página "publicar-anuncio.html"
// upload.array("imagens", 3) roda ANTES da função da rota. Ele pega até
// 3 arquivos vindos do campo name="imagens" e salva em uploads/.
// Depois disso, os arquivos ficam disponíveis em req.files (um array,
// mesmo que a pessoa mande só 1 foto).
app.post("/anuncios", exigirLogin, upload.array("imagens", 3), async (req, res) => {
    const { nome, categoria, descricao, condicao, preco, marca, modelo, ano_inicial, ano_final, localizacao } = req.body;

    if (!nome || !preco) {
        return res.status(400).send("O nome e o preço da peça são obrigatórios.");
    }

    try {
        const idAnuncio = await anuncios.criar({
            usuarioId: req.session.usuarioId,
            nome,
            categoria,
            descricao,
            condicao,
            preco: parseFloat(preco),
            marca,
            modelo,
            anoInicial: ano_inicial || null,
            anoFinal: ano_final || null,
            localizacao
        });

        // req.files é um array. Se ninguém escolheu foto, ele vem vazio ([]),
        // então o for simplesmente não roda nenhuma vez — sem erro.
        for (const arquivo of req.files) {
            const resultado = await cloudinary.uploader.upload(arquivo.path, {
                folder: "til-anuncios"
            });

            // Salva uma linha na tabela imagens pra cada foto, ligada
            // ao anúncio que acabou de ser criado. Guardamos o public_id
            // também — é o que permite apagar a foto do Cloudinary depois,
            // se o usuário excluir a foto ou o anúncio inteiro.
            await imagens.adicionar(idAnuncio, resultado.secure_url, resultado.public_id);

            // Apaga o arquivo temporário — já está hospedado no Cloudinary.
            await fs.unlink(arquivo.path);
        }

        res.redirect("/anuncios.html");
    } catch (erro) {
        // Se deu erro no meio do caminho, limpa os temporários que
        // sobraram, pra não acumular lixo na pasta uploads/.
        if (req.files) {
            for (const arquivo of req.files) {
                await fs.unlink(arquivo.path).catch(() => {});
            }
        }

        console.error("Erro detalhado ao publicar anúncio:", erro);
        res.status(500).send("Erro interno ao publicar o anúncio.");
    }
});

// Buscar detalhes de um anúncio específico pelo ID
app.get("/api/anuncios/:id", async (req, res) => {
    try {
        const anuncio = await anuncios.buscarPorId(req.params.id);

        if (!anuncio) {
            return res.status(404).json({ erro: "Anúncio não encontrado." });
        }

        // Busca os dados do vendedor (usuário) para exibir nome/telefone no anúncio
        const vendedor = await usuarios.buscarPorId(anuncio.usuario_id);

        // Busca todas as fotos desse anúncio (0, 1, 2 ou 3)
        const fotos = await imagens.listarPorAnuncio(anuncio.id);

        res.json({
            ...anuncio,
            imagens: fotos.map(f => f.url),
            vendedor: vendedor ? {
                nome: vendedor.nome,
                email: vendedor.email,
                telefone: vendedor.telefone
            } : null
        });
    } catch (erro) {
        console.error("Erro ao buscar detalhes do anúncio:", erro);
        res.status(500).json({ erro: "Erro ao carregar os detalhes do anúncio." });
    }
});

//
// ROTAS DE "MEUS ANÚNCIOS" (listar / editar / excluir os próprios anúncios)
//

// Página "Meus anúncios" — protegida por login
app.get("/meus-anuncios", exigirLogin, (req, res) => {
    res.sendFile(path.join(__dirname, "public", "meusAnuncios.html"));
});

// Página de edição de um anúncio específico — protegida por login.
// A checagem de QUEM é o dono acontece na API (abaixo), não aqui:
// esta rota só entrega o HTML, quem busca os dados é o fetch do front-end.
app.get("/anuncios/:id/editar", exigirLogin, (req, res) => {
    res.sendFile(path.join(__dirname, "public", "editarAnuncio.html"));
});

// API: lista os anúncios do usuário logado
app.get("/api/meus-anuncios", exigirLogin, anunciosController.listarMeus);

// API: busca um anúncio (com fotos) pra pré-preencher a edição — só o dono pode
app.get("/api/anuncios/:id/editar", exigirLogin, anunciosController.buscarParaEditar);

// API: atualiza texto + adiciona novas fotos (até o limite de 3 no total)
app.put("/api/anuncios/:id", exigirLogin, upload.array("novasImagens", 3), anunciosController.atualizar);

// API: remove uma foto específica de um anúncio
app.delete("/api/anuncios/:id/imagens/:imagemId", exigirLogin, anunciosController.excluirImagem);

// API: exclui o anúncio inteiro (e todas as suas fotos, banco + Cloudinary)
app.delete("/api/anuncios/:id", exigirLogin, anunciosController.excluir);

//
// ROTAS DE VEÍCULOS (garagem do usuário)
//

// Página "Minha garagem" — protegida por login
app.get("/garagem", exigirLogin, (req, res) => {
    res.sendFile(path.join(__dirname, "public", "garagem.html"));
});

// API: lista os veículos do usuário logado
app.get("/api/meus-veiculos", exigirLogin, veiculosController.listarMeus);

// API: cria um veículo para o usuário logado
app.post("/api/veiculos", exigirLogin, veiculosController.criar);

// API: atualiza um veículo (só se for do usuário logado)
app.put("/api/veiculos/:id", exigirLogin, veiculosController.atualizar);

// API: exclui um veículo (só se for do usuário logado)
app.delete("/api/veiculos/:id", exigirLogin, veiculosController.excluir);

//
// TESTE DO BANCO
//

app.get("/teste-banco", async (req, res) => {
    try {
        const [resultado] = await banco.query("SELECT 1 AS conexao");

        return res.json({
            mensagem: "Conexão com o banco realizada com sucesso!",
            resultado
        });
    } catch (erro) {
        console.error("Erro na rota /teste-banco:", erro);

        return res.status(500).json({
            mensagem: "Não foi possível conectar ao banco.",
            codigo: erro.code,
            erro: erro.message
        });
    }
});

// Tratamento de erros vindos do Multer (arquivo grande demais, tipo
// inválido, etc.) — sem isso o usuário veria uma tela de erro genérica.
app.use((erro, req, res, next) => {
    if (erro) {
        console.error("Erro no upload:", erro.message);
        return res.status(400).send(erro.message);
    }
    next();
});

// ==========================
// INICIALIZAÇÃO DO SERVIDOR
// ==========================

app.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
});