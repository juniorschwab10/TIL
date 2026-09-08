const banco = require("../config/database");

// Cria um veículo vinculado a um usuário (dono da garagem)
async function criar(usuarioId, marca, modelo, anoInicial, anoFinal) {
    const sql = `
        INSERT INTO veiculos (usuario_id, marca, modelo, ano_inicial, ano_final)
        VALUES (?, ?, ?, ?, ?)
    `;

    const [resultado] = await banco.execute(sql, [
        usuarioId,
        marca,
        modelo,
        anoInicial,
        anoFinal
    ]);

    return {
        id: resultado.insertId,
        usuarioId,
        marca,
        modelo,
        anoInicial,
        anoFinal
    };
}

// Lista todos os veículos de um usuário específico
async function listarPorUsuario(usuarioId) {
    const sql = `
        SELECT id, usuario_id, marca, modelo, ano_inicial, ano_final
        FROM veiculos
        WHERE usuario_id = ?
        ORDER BY id DESC
    `;

    const [linhas] = await banco.execute(sql, [usuarioId]);

    return linhas;
}

// Busca um veículo pelo id
async function buscarPorId(id) {
    const sql = `
        SELECT id, usuario_id, marca, modelo, ano_inicial, ano_final
        FROM veiculos
        WHERE id = ? 
        LIMIT 1
    `;

    const [linhas] = await banco.execute(sql, [id]);

    return linhas[0] || null;
}

// Atualiza os dados de um veículo
async function atualizar(id, marca, modelo, anoInicial, anoFinal) {
    const sql = `
        UPDATE veiculos
        SET marca = ?, modelo = ?, ano_inicial = ?, ano_final = ?
        WHERE id = ?
    `;

    await banco.execute(sql, [marca, modelo, anoInicial, anoFinal, id]);

    return {
        id,
        marca,
        modelo,
        anoInicial,
        anoFinal
    };
}

// Exclui um veículo 
async function excluir(id) {
    const sql = `
        DELETE FROM veiculos 
        WHERE id = ?
    `;

    await banco.execute(sql, [id]);
}

// Conta quantos veículos um usuário específico cadastrou.
// Usado, por exemplo, no card "Veículos: X" da tela de perfil.
async function contarPorUsuario(usuarioId) {
    const sql = `
        SELECT COUNT(*) AS total
        FROM veiculos
        WHERE usuario_id = ?
    `;
    const [linhas] = await banco.execute(sql, [usuarioId]);
    return linhas[0].total;
}

module.exports = {
    criar,
    listarPorUsuario,
    buscarPorId,
    atualizar,
    excluir,
    contarPorUsuario
};