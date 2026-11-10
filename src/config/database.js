// Conexão com o MySQL. Os valores podem ser trocados no arquivo .env
// (DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME); se não existirem,
// valem os padrões abaixo.
const mysql = require("mysql2/promise");

const banco = mysql.createPool({
    host: process.env.DB_HOST || "localhost",
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "root",
    database: process.env.DB_NAME || "BD_TIL",

    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

module.exports = banco;
