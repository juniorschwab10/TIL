const fs = require("fs/promises");
const anuncios = require("../models/anuncios");
const imagens = require("../models/imagens");
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
    listarMeus,
    buscarParaEditar,
    atualizar,
    excluirImagem,
    excluir
};