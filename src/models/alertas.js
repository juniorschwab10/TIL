const banco = require("../config/database");

// Cria um alerta: "quero a peça <termo> para o veículo <veiculoId>".
async function criar(usuarioId, veiculoId, termo) {
    const [resultado] = await banco.execute(
        "INSERT INTO alertas (usuario_id, veiculo_id, termo) VALUES (?, ?, ?)",
        [usuarioId, veiculoId, termo]
    );
    return resultado.insertId;
}

// Alertas de um usuário, já com os dados do veículo ao qual cada um se refere.
async function listarPorUsuario(usuarioId) {
    const sql = `
        SELECT al.id, al.termo, al.data_criacao, al.veiculo_id,
               v.marca, v.modelo, v.ano_inicial, v.ano_final
        FROM alertas al
        JOIN veiculos v ON v.id = al.veiculo_id
        WHERE al.usuario_id = ?
        ORDER BY al.id DESC
    `;
    const [linhas] = await banco.execute(sql, [usuarioId]);
    return linhas;
}

async function buscarPorId(id) {
    const [linhas] = await banco.execute(
        "SELECT id, usuario_id, veiculo_id, termo FROM alertas WHERE id = ? LIMIT 1",
        [id]
    );
    return linhas[0] || null;
}

async function contarPorUsuario(usuarioId) {
    const [linhas] = await banco.execute(
        "SELECT COUNT(*) AS total FROM alertas WHERE usuario_id = ?",
        [usuarioId]
    );
    return Number(linhas[0].total);
}

async function excluir(id) {
    await banco.execute("DELETE FROM alertas WHERE id = ?", [id]);
}

// Alertas "candidatos" para um anúncio recém-publicado: mesmo veículo
// (marca e modelo) e anos que se cruzam. A conferência do termo da peça
// é feita no controller (em JavaScript, ignorando acentos e maiúsculas).
//
// Regras:
//  - o autor do anúncio nunca é notificado pelo próprio anúncio;
//  - anúncio sem marca (ou sem modelo) serve em qualquer veículo;
//  - anúncio sem ano dispensa a conferência de ano;
//  - veículo sem ano cadastrado dispensa a conferência de ano.
async function buscarCandidatos({ autorId, marca, modelo, anoInicial, anoFinal }) {
    const sql = `
        SELECT al.id, al.usuario_id, al.termo
        FROM alertas al
        JOIN veiculos v ON v.id = al.veiculo_id
        WHERE al.usuario_id <> ?
          AND (? IS NULL OR TRIM(v.marca) = TRIM(?))
          AND (? IS NULL OR TRIM(v.modelo) = TRIM(?))
          AND (
                ? IS NULL
                OR v.ano_inicial IS NULL
                OR (v.ano_inicial <= ? AND COALESCE(v.ano_final, v.ano_inicial) >= ?)
              )
        ORDER BY al.id
    `;
    const [linhas] = await banco.query(sql, [
        autorId,
        marca, marca,
        modelo, modelo,
        anoInicial, anoFinal, anoInicial
    ]);
    return linhas;
}

module.exports = {
    criar,
    listarPorUsuario,
    buscarPorId,
    contarPorUsuario,
    excluir,
    buscarCandidatos
};
