const banco = require("../config/database");

class Anuncios {
    async listarTodos() {
        const [linhas] = await banco.query(
            "SELECT * FROM anuncios ORDER BY criado_em DESC"
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
            anoFinal = null
        } = dados;

        const [resultado] = await banco.query(
            `INSERT INTO anuncios 
            (usuario_id, nome, categoria, descricao, imagem, condicao, preco, marca, modelo, ano_inicial, ano_final) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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
                anoFinal
            ]
        );

        return resultado.insertId;
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