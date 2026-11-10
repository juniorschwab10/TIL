const banco = require("../config/database");

// Grava uma notificação. INSERT IGNORE + chave única (usuario_id, anuncio_id):
// se a pessoa tem dois alertas que combinam com o mesmo anúncio, recebe só uma.
async function criar(usuarioId, anuncioId, alertaId) {
    await banco.execute(
        "INSERT IGNORE INTO notificacoes (usuario_id, anuncio_id, alerta_id) VALUES (?, ?, ?)",
        [usuarioId, anuncioId, alertaId]
    );
}

// As notificações mais recentes do usuário, com os dados do anúncio.
async function listarPorUsuario(usuarioId) {
    const sql = `
        SELECT n.id, n.lida, n.data_criacao, n.anuncio_id,
               a.nome AS anuncio_nome, a.preco, a.marca, a.modelo,
               al.termo
        FROM notificacoes n
        JOIN anuncios a ON a.id = n.anuncio_id
        LEFT JOIN alertas al ON al.id = n.alerta_id
        WHERE n.usuario_id = ?
        ORDER BY n.data_criacao DESC, n.id DESC
        LIMIT 50
    `;
    const [linhas] = await banco.execute(sql, [usuarioId]);
    return linhas;
}

async function contarNaoLidas(usuarioId) {
    const [linhas] = await banco.execute(
        "SELECT COUNT(*) AS total FROM notificacoes WHERE usuario_id = ? AND lida = 0",
        [usuarioId]
    );
    return Number(linhas[0].total);
}

// Só marca se a notificação for do próprio usuário. Retorna quantas linhas mudaram.
async function marcarLida(id, usuarioId) {
    const [resultado] = await banco.execute(
        "UPDATE notificacoes SET lida = 1 WHERE id = ? AND usuario_id = ?",
        [id, usuarioId]
    );
    return resultado.affectedRows;
}

async function marcarTodasLidas(usuarioId) {
    await banco.execute(
        "UPDATE notificacoes SET lida = 1 WHERE usuario_id = ? AND lida = 0",
        [usuarioId]
    );
}

module.exports = {
    criar,
    listarPorUsuario,
    contarNaoLidas,
    marcarLida,
    marcarTodasLidas
};
