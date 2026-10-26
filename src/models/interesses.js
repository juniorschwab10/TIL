const banco = require("../config/database");

// Registra o interesse de um usuário em um anúncio.
// INSERT IGNORE: se o par (usuario, anuncio) já existe, não dá erro
// nem duplica — simplesmente não faz nada.
async function adicionar(usuarioId, anuncioId) {
    await banco.execute(
        "INSERT IGNORE INTO interesses (usuario_id, anuncio_id) VALUES (?, ?)",
        [usuarioId, anuncioId]
    );
}

// Remove o interesse de um usuário em um anúncio.
async function remover(usuarioId, anuncioId) {
    await banco.execute(
        "DELETE FROM interesses WHERE usuario_id = ? AND anuncio_id = ?",
        [usuarioId, anuncioId]
    );
}

// Informa se o usuário já marcou interesse nesse anúncio.
// Usado pelas avaliações: só quem demonstrou interesse pode avaliar o vendedor.
async function existe(usuarioId, anuncioId) {
    const [linhas] = await banco.execute(
        "SELECT 1 FROM interesses WHERE usuario_id = ? AND anuncio_id = ? LIMIT 1",
        [usuarioId, anuncioId]
    );
    return linhas.length > 0;
}

// Lista os anúncios em que o usuário clicou "Tenho interesse",
// do mais recente pro mais antigo, já com a primeira foto de cada um.
async function listarPorUsuario(usuarioId) {
    const [linhas] = await banco.query(
        `
        SELECT a.*, primeira_imagem.url AS imagem, i.data_criacao AS interesse_em
        FROM interesses i
        JOIN anuncios a ON a.id = i.anuncio_id
        LEFT JOIN (
            SELECT anuncio_id, MIN(id) AS primeiro_id
            FROM imagens
            GROUP BY anuncio_id
        ) AS agrupado ON agrupado.anuncio_id = a.id
        LEFT JOIN imagens primeira_imagem ON primeira_imagem.id = agrupado.primeiro_id
        WHERE i.usuario_id = ?
        ORDER BY i.data_criacao DESC
        `,
        [usuarioId]
    );
    return linhas;
}

module.exports = {
    adicionar,
    remover,
    existe,
    listarPorUsuario
};