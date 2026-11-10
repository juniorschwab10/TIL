const fs = require("fs/promises");
const anuncios = require("../models/anuncios");
const imagens = require("../models/imagens");
const usuarios = require("../models/usuarios");
const alertasController = require("./alertasController");
const { cloudinary } = require("../config/upload");

const LIMITE_FOTOS = 3;

// Apaga os arquivos temporários que o multer salvou, usado quando algo
// dá errado no meio do caminho e a gente não quer deixar lixo em uploads/.
async function limparTemporarios(arquivos) {
    if (!arquivos) return;
    for (const arquivo of arquivos) {
        await fs.unlink(arquivo.path).catch(() => {});
    }
}

// ------------------------------ CATÁLOGO ----------------------------------

// Lista de anúncios (pública). Aceita busca por palavra-chave, filtros
// combinados e ordenação via query string, por exemplo:
//   /api/anuncios?busca=carburador&categoria=Motor&ordenar=menor-preco
async function listar(req, res) {
    try {
        const { busca, marca, modelo, ano, categoria, condicao, localizacao, ordenar } = req.query;

        // Ano precisa ser um número válido pra entrar no filtro — um
        // "?ano=abc" na URL, por exemplo, é simplesmente ignorado.
        const anoNumero = Number(ano);

        const lista = await anuncios.listarTodos({
            busca: busca?.trim() || undefined,
            marca: marca?.trim() || undefined,
            modelo: modelo?.trim() || undefined,
            ano: ano && Number.isInteger(anoNumero) ? anoNumero : undefined,
            categoria: categoria?.trim() || undefined,
            condicao: condicao?.trim() || undefined,
            localizacao: localizacao?.trim() || undefined,
            ordenar: ordenar?.trim() || undefined
        });

        res.json(lista);
    } catch (erro) {
        console.error("Erro ao listar anúncios:", erro);
        res.status(500).json({ erro: "Erro ao buscar a listagem de anúncios." });
    }
}

// Detalhes de um anúncio: dados + fotos + vendedor
async function detalhar(req, res) {
    try {
        const anuncio = await anuncios.buscarPorId(req.params.id);

        if (!anuncio) {
            return res.status(404).json({ erro: "Anúncio não encontrado." });
        }

        const vendedor = await usuarios.buscarPorId(anuncio.usuario_id);
        const fotos = await imagens.listarPorAnuncio(anuncio.id);

        res.json({
            ...anuncio,
            imagens: fotos.map((f) => f.url),
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
}

// ------------------------------ PUBLICAR ----------------------------------

// Processa o formulário de "publicar-anuncio.html". Antes desta função,
// o multer (upload.array) já salvou até 3 fotos em uploads/ e as colocou
// em req.files (um array, vazio se a pessoa não escolheu foto).
async function publicar(req, res) {
    const { nome, categoria, descricao, condicao, preco, marca, modelo, ano_inicial, ano_final, localizacao } = req.body;

    if (!nome || !preco) {
        await limparTemporarios(req.files);
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

        for (const arquivo of req.files) {
            const resultado = await cloudinary.uploader.upload(arquivo.path, {
                folder: "til-anuncios"
            });

            // Guardamos o public_id também: é o que permite apagar a foto
            // do Cloudinary depois, se o usuário excluir a foto ou o anúncio.
            await imagens.adicionar(idAnuncio, resultado.secure_url, resultado.public_id);

            // Apaga o arquivo temporário — já está hospedado no Cloudinary.
            await fs.unlink(arquivo.path);
        }

        // Cruza o anúncio com os alertas de compatibilidade e notifica quem
        // procurava essa peça. Se der erro aqui, o anúncio já foi publicado:
        // só registramos no console e seguimos.
        try {
            await alertasController.gerarNotificacoes({
                id: idAnuncio,
                usuario_id: req.session.usuarioId,
                nome,
                categoria,
                descricao,
                marca,
                modelo,
                ano_inicial,
                ano_final
            });
        } catch (erroAlerta) {
            console.error("Erro ao gerar notificações de alertas:", erroAlerta);
        }

        res.redirect("/anuncios.html");
    } catch (erro) {
        await limparTemporarios(req.files);
        console.error("Erro detalhado ao publicar anúncio:", erro);
        res.status(500).send("Erro interno ao publicar o anúncio.");
    }
}

// ------------------------------ MEUS ANÚNCIOS -----------------------------

// Lista os anúncios do usuário logado — usado na tela "Meus anúncios".
async function listarMeus(req, res) {
    try {
        const lista = await anuncios.listarPorUsuario(req.session.usuarioId);
        res.json(lista);
    } catch (erro) {
        console.error("Erro ao listar meus anúncios:", erro);
        res.status(500).json({ erro: "Erro ao carregar seus anúncios." });
    }
}

// Busca um anúncio (com todas as fotos) pra pré-preencher o formulário
// de edição. Só o dono pode ver isso — por isso o 403.
async function buscarParaEditar(req, res) {
    try {
        const anuncio = await anuncios.buscarPorId(req.params.id);

        if (!anuncio) {
            return res.status(404).json({ erro: "Anúncio não encontrado." });
        }

        if (anuncio.usuario_id !== req.session.usuarioId) {
            return res.status(403).json({ erro: "Você não tem permissão para editar este anúncio." });
        }

        const fotos = await imagens.listarPorAnuncio(anuncio.id);

        res.json({
            ...anuncio,
            imagens: fotos.map((f) => ({ id: f.id, url: f.url }))
        });
    } catch (erro) {
        console.error("Erro ao buscar anúncio para editar:", erro);
        res.status(500).json({ erro: "Erro ao carregar o anúncio." });
    }
}

// Atualiza os dados de texto do anúncio e, se vierem arquivos novos
// (campo "novasImagens"), sobe eles pro Cloudinary e adiciona na tabela
// imagens — sempre respeitando o limite de 3 fotos no total.
async function atualizar(req, res) {
    const { nome, categoria, descricao, condicao, preco, marca, modelo, ano_inicial, ano_final, localizacao } = req.body;

    if (!nome || !preco) {
        await limparTemporarios(req.files);
        return res.status(400).json({ erro: "O nome e o preço da peça são obrigatórios." });
    }

    try {
        const anuncio = await anuncios.buscarPorId(req.params.id);

        if (!anuncio) {
            await limparTemporarios(req.files);
            return res.status(404).json({ erro: "Anúncio não encontrado." });
        }

        if (anuncio.usuario_id !== req.session.usuarioId) {
            await limparTemporarios(req.files);
            return res.status(403).json({ erro: "Você não tem permissão para editar este anúncio." });
        }

        const novosArquivos = req.files || [];
        const totalAtual = await imagens.contarPorAnuncio(anuncio.id);

        if (totalAtual + novosArquivos.length > LIMITE_FOTOS) {
            await limparTemporarios(novosArquivos);
            const espacoLivre = Math.max(0, LIMITE_FOTOS - totalAtual);
            return res.status(400).json({
                erro: `Esse anúncio já tem ${totalAtual} foto(s). Só cabem mais ${espacoLivre}.`
            });
        }

        await anuncios.atualizar(req.params.id, {
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

        for (const arquivo of novosArquivos) {
            const resultado = await cloudinary.uploader.upload(arquivo.path, {
                folder: "til-anuncios"
            });

            await imagens.adicionar(anuncio.id, resultado.secure_url, resultado.public_id);

            await fs.unlink(arquivo.path);
        }

        res.json({ mensagem: "Anúncio atualizado com sucesso!" });
    } catch (erro) {
        await limparTemporarios(req.files);
        console.error("Erro ao atualizar anúncio:", erro);
        res.status(500).json({ erro: "Erro ao atualizar o anúncio." });
    }
}

// Remove UMA foto específica de um anúncio (botão "✕" na tela de edição).
async function excluirImagem(req, res) {
    try {
        const imagem = await imagens.buscarPorId(req.params.imagemId);

        if (!imagem) {
            return res.status(404).json({ erro: "Imagem não encontrada." });
        }

        const anuncio = await anuncios.buscarPorId(imagem.anuncio_id);

        if (!anuncio || anuncio.usuario_id !== req.session.usuarioId) {
            return res.status(403).json({ erro: "Você não tem permissão para remover essa imagem." });
        }

        if (imagem.public_id) {
            // .catch aqui de propósito: se a foto já não existir mais no
            // Cloudinary por algum motivo, a exclusão no banco continua.
            await cloudinary.uploader.destroy(imagem.public_id).catch(() => {});
        }

        await imagens.excluir(imagem.id);

        res.json({ mensagem: "Imagem removida." });
    } catch (erro) {
        console.error("Erro ao excluir imagem:", erro);
        res.status(500).json({ erro: "Erro ao remover a imagem." });
    }
}

// Exclui o anúncio inteiro, junto com todas as suas fotos — tanto no
// banco quanto no Cloudinary.
async function excluir(req, res) {
    try {
        const anuncio = await anuncios.buscarPorId(req.params.id);

        if (!anuncio) {
            return res.status(404).json({ erro: "Anúncio não encontrado." });
        }

        if (anuncio.usuario_id !== req.session.usuarioId) {
            return res.status(403).json({ erro: "Você não tem permissão para excluir este anúncio." });
        }

        const fotos = await imagens.listarPorAnuncio(anuncio.id);

        for (const foto of fotos) {
            if (foto.public_id) {
                await cloudinary.uploader.destroy(foto.public_id).catch(() => {});
            }
        }

        await imagens.excluirTodasPorAnuncio(anuncio.id);
        await anuncios.excluir(anuncio.id);

        res.json({ mensagem: "Anúncio excluído com sucesso." });
    } catch (erro) {
        console.error("Erro ao excluir anúncio:", erro);
        res.status(500).json({ erro: "Erro ao excluir o anúncio." });
    }
}

module.exports = {
    listar,
    detalhar,
    publicar,
    listarMeus,
    buscarParaEditar,
    atualizar,
    excluirImagem,
    excluir
};
