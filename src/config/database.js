const mysql = require("mysql2/promise");

const banco = mysql.createPool({
    host: "localhost",
    port: 3306,
    user: "root",
    password: "root",
    database: "BD_TIL",

    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

const mysql = require("mysql2/promise");
require("dotenv").config();

// Se houver DATABASE_URL (Aiven / Vercel), usa a URI diretamente.
// Caso contrário, usa as variáveis de ambiente individuais ou padrões locais.
const connectionConfig = process.env.DATABASE_URL
  ? {
      uri: process.env.DATABASE_URL,
      ssl: {
        rejectUnauthorized: false // Necessário para a conexão SSL do Aiven
      }
    }
  : {
      host: process.env.DB_HOST || "localhost",
      user: process.env.DB_USER || "root",
      password: process.env.DB_PASSWORD || "",
      database: process.env.DB_NAME || "defaultdb",
      port: Number(process.env.DB_PORT) || 3306
    };

const pool = mysql.createPool(connectionConfig);

module.exports = pool;

module.exports = banco;