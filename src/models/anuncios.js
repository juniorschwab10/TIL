const banco = require("../config/database");

class Anuncios {
    // Lista os anúncios do catálogo público, com busca por palavra-chave,
    // filtros combinados e ordenação — tudo opcional (chame sem argumento
    // pra ter o comportamento de antes: tudo, do mais recente pro mais antigo).
    //
    // filtros aceitos:
    //   busca       -> procura em nome, descrição, marca, modelo e categoria
    //   marca       -> combina com o início/meio do texto (LIKE)
    //   modelo      -> combina com o início/meio do texto (LIKE)
    //   ano         -> precisa cair entre ano_inicial e ano_final do anúncio
    //   categoria   -> igual exato (ex.: "Motor")
    //   condicao    -> igual exato (ex.: "Usada")
    //   localizacao -> combina com o início/meio do texto (LIKE)
    //   ordenar     -> "relevancia" (padrão, só some se houver "busca"),
    //                  "menor-preco", "maior-preco" ou "recente"
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
            // O anúncio tem uma FAIXA de anos compatíveis (ano_inicial até
            // ano_final). Se não tiver ano_final, o veículo cobre só o
            // ano_inicial — por isso o COALESCE usa o próprio ano_inicial
            // como teto nesse caso.
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

        // ORDER BY e seus próprios parâmetros (a relevância usa "busca"
        // de novo, então esses parâmetros vêm DEPOIS dos do WHERE).
        let orderBy = 'a.criado_em DESC';
        const parametrosOrdem = [];

        if (filtros.ordenar === 'menor-preco') {
            orderBy = 'a.preco ASC';
        } else if (filtros.ordenar === 'maior-preco') {
            orderBy = 'a.preco DESC';
        } else if (filtros.ordenar === 'recente') {
            orderBy = 'a.criado_em DESC';
        } else if (filtros.busca) {
            // "relevancia" (padrão quando há busca): anúncios com o termo
            // no NOME aparecem primeiro, depois marca/modelo, depois
            // categoria/descrição, e por último o resto — empatando por
            // data de publicação mais recente.
            const termo = `%${filtros.busca}%`;
            orderBy = `
                CASE
                    WHEN a.nome LIKE ? THEN 0
                    WHEN a.marca LIKE ? OR a.modelo LIKE ? THEN 1
                    WHEN a.categoria LIKE ? OR a.descricao LIKE ? THEN 2
                    ELSE 3
                END,
                a.criado_em DESC
            `;
            parametrosOrdem.push(termo, termo, termo, termo, termo);
        }

        // LEFT JOIN com uma subconsulta que pega só a imagem de MENOR id
        // (ou seja, a primeira foto cadastrada) de cada anúncio.
        // LEFT JOIN (em vez de JOIN normal) garante que anúncios SEM foto
        // nenhuma continuem aparecendo na lista, só que com imagem = NULL.
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

    // Mesma ideia do listarTodos(), só que filtrando por dono — usada na
    // tela "Meus anúncios" do perfil.
    async listarPorUsuario(usuarioId) {
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
            ORDER BY a.criado_em DESC
        `,
            [usuarioId]
        );
        return linhas;
    }

    async buscarPorId(id) {
        const [linhas] = await banco.query(
            "SELECT * FROM anuncios WHERE id = ?",
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
            imagem = null,
            condicao = null,
            preco,
            marca = null,
            modelo = null,
            anoInicial = null,
            anoFinal = null,
            localizacao = null
        } = dados;

        const [resultado] = await banco.query(
            `INSERT INTO anuncios 
            (usuario_id, nome, categoria, descricao, imagem, condicao, preco, marca, modelo, ano_inicial, ano_final, localizacao) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                usuarioId,
                nome,
                categoria,
                descricao,
                imagem,
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

    // Atualiza os dados de texto de um anúncio já existente.
    // As fotos são tratadas à parte (tabela imagens), não entram aqui.
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

    // Exclui o anúncio. As fotos (linhas da tabela imagens + arquivos no
    // Cloudinary) precisam ser removidas ANTES disso — isso é feito no
    // controller, que tem acesso ao model de imagens e ao Cloudinary.
    async excluir(id) {
        await banco.query("DELETE FROM anuncios WHERE id = ?", [id]);
    }

    // Esta função estava por engano DENTRO do criar(), o que a deixava
    // inacessível de fora. Agora é um método normal da classe.
    async contarPorUsuario(usuarioId) {
        const [linhas] = await banco.query(
            "SELECT COUNT(*) AS total FROM anuncios WHERE usuario_id = ?",
            [usuarioId]
        );
        return linhas[0].total;
    }
}

module.exports = new Anuncios();