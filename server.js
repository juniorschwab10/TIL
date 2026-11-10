// Ponto de entrada: carrega o .env e liga o servidor.
// Toda a configuração do Express (sessão, rotas, arquivos estáticos)
// fica em src/app.js.
require("dotenv").config();

const app = require("./src/app");

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
});
