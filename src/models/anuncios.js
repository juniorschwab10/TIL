const banco = require("../config/database");

class Anuncios {
    // Lista os anúncios do catálogo público, com busca por palavra-chave,
    // filtros combinados e ordenação
    async listarTodos(filtros = {}) {
        const condicoes = [];
        const parametrosWhere = [];

        if (filtros.busca) {
            const termo = `%${filtros.busca}%`;
            condicoes.push(`(
                a.nome LIKE ? OR a.descricao LIKE ? OR a.marca LIKE ? OR
                a.modelo LIKE ? OR a.categoria LIKE ?
            )`);
            parametrosWhere.push(termo, termo, termo, termo, termo);
        }

        if (filtros.marca) {
            condicoes.push('a.marca LIKE ?');
            parametrosWhere.push(`%${filtros.marca}%`);
        }

        if (filtros.modelo) {
            condicoes.push('a.modelo LIKE ?');
            parametrosWhere.push(`%${filtros.modelo}%`);
        }

        if (filtros.ano) {
            condicoes.push(`
                a.ano_inicial IS NOT NULL
                AND ? BETWEEN a.ano_inicial AND COALESCE(a.ano_final, a.ano_inicial)
            `);
            parametrosWhere.push(filtros.ano);
        }

        if (filtros.categoria) {
            condicoes.push('a.categoria = ?');
            parametrosWhere.push(filtros.categoria);
        }

        if (filtros.condicao) {
            condicoes.push('a.condicao = ?');
            parametrosWhere.push(filtros.condicao);
        }

        if (filtros.localizacao) {
            condicoes.push('a.localizacao LIKE ?');
            parametrosWhere.push(`%${filtros.localizacao}%`);
        }

        const where = condicoes.length > 0 ? `WHERE ${condicoes.join(' AND ')}` : '';

        // CORREÇÃO: Alterado de "a.criado_em" para "a.data_criacao"
        let orderBy = 'a.data_criacao DESC';
        const parametrosOrdem = [];

        if (filtros.ordenar === 'menor-preco') {
            orderBy = 'a.preco ASC';
        } else if (filtros.ordenar === 'maior-preco') {
            orderBy = 'a.preco DESC';
        } else if (filtros.ordenar === 'recente') {
            orderBy = 'a.data_criacao DESC';
        } else if (filtros.busca) {
            const termo = `%${filtros.busca}%`;
            orderBy = `
                CASE
                    WHEN a.nome LIKE ? THEN 0
                    WHEN a.marca LIKE ? OR a.modelo LIKE ? THEN 1
                    WHEN a.categoria LIKE ? OR a.descricao LIKE ? THEN 2
                    ELSE 3
                END,
                a.data_criacao DESC
            `;
            parametrosOrdem.push(termo, termo, termo, termo, termo);
        }

        // LEFT JOIN para obter a primeira imagem cadastrada da tabela "imagens"
        const [linhas] = await banco.query(
            `
            SELECT a.*, primeira_imagem.url AS imagem
            FROM anuncios a
            LEFT JOIN (
                SELECT anuncio_id, MIN(id) AS primeiro_id
                FROM imagens
                GROUP BY anuncio_id
            ) AS agrupado ON agrupado.anuncio_id = a.id
            LEFT JOIN imagens primeira_imagem ON primeira_imagem.id = agrupado.primeiro_id
            ${where}
            ORDER BY ${orderBy}
            `,
            [...parametrosWhere, ...parametrosOrdem]
        );
        return linhas;
    }

    // Listagem por utilizador para a área "Meus anúncios"
    async listarPorUsuario(usuarioId) {
        // CORREÇÃO: Alterado de "a.criado_em" para "a.data_criacao"
        const [linhas] = await banco.query(
            `
            SELECT a.*, primeira_imagem.url AS imagem
            FROM anuncios a
            LEFT JOIN (
                SELECT anuncio_id, MIN(id) AS primeiro_id
                FROM imagens
                GROUP BY anuncio_id
            ) AS agrupado ON agrupado.anuncio_id = a.id
            LEFT JOIN imagens primeira_imagem ON primeira_imagem.id = agrupado.primeiro_id
            WHERE a.usuario_id = ?
            ORDER BY a.data_criacao DESC
        `,
            [usuarioId]
        );
        return linhas;
    }

    async buscarPorId(id) {
        const [linhas] = await banco.query(
            `
            SELECT a.*, primeira_imagem.url AS imagem
            FROM anuncios a
            LEFT JOIN (
                SELECT anuncio_id, MIN(id) AS primeiro_id
                FROM imagens
                GROUP BY anuncio_id
            ) AS agrupado ON agrupado.anuncio_id = a.id
            LEFT JOIN imagens primeira_imagem ON primeira_imagem.id = agrupado.primeiro_id
            WHERE a.id = ?
            `,
            [id]
        );
        return linhas.length > 0 ? linhas[0] : null;
    }

    async criar(dados) {
        const {
            usuarioId,
            nome,
            categoria = null,
            descricao = null,
            condicao = null,
            preco,
            marca = null,
            modelo = null,
            anoInicial = null,
            anoFinal = null,
            localizacao = null
        } = dados;

        // CORREÇÃO: Removido o campo "imagem" da tabela anuncios (fotos são guardadas na tabela "imagens")
        const [resultado] = await banco.query(
            `INSERT INTO anuncios 
            (usuario_id, nome, categoria, descricao, condicao, preco, marca, modelo, ano_inicial, ano_final, localizacao) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                usuarioId,
                nome,
                categoria,
                descricao,
                condicao,
                preco,
                marca,
                modelo,
                anoInicial,
                anoFinal,
                localizacao
            ]
        );

        return resultado.insertId;
    }

    async atualizar(id, dados) {
        const {
            nome,
            categoria = null,
            descricao = null,
            condicao = null,
            preco,
            marca = null,
            modelo = null,
            anoInicial = null,
            anoFinal = null,
            localizacao = null
        } = dados;

        await banco.query(
            `UPDATE anuncios
             SET nome = ?, categoria = ?, descricao = ?, condicao = ?, preco = ?, marca = ?, modelo = ?, ano_inicial = ?, ano_final = ?, localizacao = ?
             WHERE id = ?`,
            [nome, categoria, descricao, condicao, preco, marca, modelo, anoInicial, anoFinal, localizacao, id]
        );
    }

    async excluir(id) {
        await banco.query("DELETE FROM anuncios WHERE id = ?", [id]);
    }

    async contarPorUsuario(usuarioId) {
        const [linhas] = await banco.query(
            "SELECT COUNT(*) AS total FROM anuncios WHERE usuario_id = ?",
            [usuarioId]
        );
        return linhas[0].total;
    }
}

module.exports = new Anuncios();