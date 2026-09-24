const banco = require("../config/database");

// Salva UMA linha na tabela imagens, ligada a um anúncio.
// publicId é o identificador que o Cloudinary usa pra localizar o
// arquivo — precisamos dele pra conseguir apagar a foto de lá depois
// (a url sozinha não é suficiente pra isso).
async function adicionar(anuncioId, url, publicId = null) {
    const sql = `
        INSERT INTO imagens (anuncio_id, url, public_id)
        VALUES (?, ?, ?)
    `;
    const [resultado] = await banco.execute(sql, [anuncioId, url, publicId]);
    return resultado.insertId;
}

// Busca todas as fotos de um anúncio específico, na ordem que foram
// cadastradas (ORDER BY id garante isso).
async function listarPorAnuncio(anuncioId) {
    const sql = `
        SELECT id, anuncio_id, url, public_id
        FROM imagens
        WHERE anuncio_id = ?
        ORDER BY id
    `;
    const [linhas] = await banco.execute(sql, [anuncioId]);
    return linhas;
}

// Busca uma foto específica pelo id — usado antes de excluir, pra saber
// de qual anúncio ela é (e checar se quem está apagando é o dono).
async function buscarPorId(id) {
    const sql = `
        SELECT id, anuncio_id, url, public_id
        FROM imagens
        WHERE id = ?
        LIMIT 1
    `;
    const [linhas] = await banco.execute(sql, [id]);
    return linhas[0] || null;
}

// Conta quantas fotos um anúncio já tem — usado na edição, pra saber
// quantos "espaços" ainda restam até o limite de 3.
async function contarPorAnuncio(anuncioId) {
    const sql = `
        SELECT COUNT(*) AS total
        FROM imagens
        WHERE anuncio_id = ?
    `;
    const [linhas] = await banco.execute(sql, [anuncioId]);
    return linhas[0].total;
}

async function excluir(id) {
    await banco.execute("DELETE FROM imagens WHERE id = ?", [id]);
}

// Apaga todas as fotos (linhas do banco) de um anúncio de uma vez —
// usado quando o anúncio inteiro é excluído.
async function excluirTodasPorAnuncio(anuncioId) {
    await banco.execute("DELETE FROM imagens WHERE anuncio_id = ?", [anuncioId]);
}

module.exports = {
    adicionar,
    listarPorAnuncio,
    buscarPorId,
    contarPorAnuncio,
    excluir,
    excluirTodasPorAnuncio
};