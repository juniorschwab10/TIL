const banco = require("../config/database");

// Registra a avaliação de um comprador sobre o vendedor de um anúncio.
async function criar(anuncioId, avaliadorId, vendedorId, nota, comentario) {
    const sql = `
        INSERT INTO avaliacoes (anuncio_id, avaliador_id, vendedor_id, nota, comentario)
        VALUES (?, ?, ?, ?, ?)
    `;
    const [resultado] = await banco.execute(sql, [
        anuncioId,
        avaliadorId,
        vendedorId,
        nota,
        comentario || null
    ]);
    return resultado.insertId;
}

async function buscarPorId(id) {
    const [linhas] = await banco.execute(
        "SELECT * FROM avaliacoes WHERE id = ? LIMIT 1",
        [id]
    );
    return linhas[0] || null;
}

// Usado pra impedir que a mesma pessoa avalie o mesmo anúncio duas vezes.
async function buscarDoAvaliador(avaliadorId, anuncioId) {
    const [linhas] = await banco.execute(
        "SELECT id FROM avaliacoes WHERE avaliador_id = ? AND anuncio_id = ? LIMIT 1",
        [avaliadorId, anuncioId]
    );
    return linhas[0] || null;
}

// Todas as avaliações recebidas por um vendedor (de qualquer anúncio dele),
// da mais recente pra mais antiga. Só o NOME do avaliador é exposto.
async function listarPorVendedor(vendedorId) {
    const sql = `
        SELECT av.id, av.nota, av.comentario, av.resposta, av.data_criacao,
               u.nome AS avaliador_nome,
               a.nome AS anuncio_nome
        FROM avaliacoes av
        JOIN usuarios u ON u.id = av.avaliador_id
        LEFT JOIN anuncios a ON a.id = av.anuncio_id
        WHERE av.vendedor_id = ?
        ORDER BY av.data_criacao DESC, av.id DESC
    `;
    const [linhas] = await banco.execute(sql, [vendedorId]);
    return linhas;
}

// Média e quantidade de avaliações do vendedor.
// O AVG do MySQL volta como texto, por isso a conversão pra número.
async function resumoDoVendedor(vendedorId) {
    const [linhas] = await banco.execute(
        "SELECT COUNT(*) AS total, AVG(nota) AS media FROM avaliacoes WHERE vendedor_id = ?",
        [vendedorId]
    );
    const total = Number(linhas[0].total);
    const media = linhas[0].media === null ? 0 : Number(Number(linhas[0].media).toFixed(1));
    return { total, media };
}

// Resposta pública do vendedor. Não existe função de excluir de propósito:
// o vendedor responde, mas não apaga a avaliação.
async function responder(id, resposta) {
    await banco.execute("UPDATE avaliacoes SET resposta = ? WHERE id = ?", [resposta, id]);
}

module.exports = {
    criar,
    buscarPorId,
    buscarDoAvaliador,
    listarPorVendedor,
    resumoDoVendedor,
    responder
};