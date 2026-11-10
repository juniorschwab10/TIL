# Estrutura do projeto T.I.L

Cada pasta tem **uma** função. Se você não sabe onde mexer, olhe esta lista.

```
T.I.L/
├── server.js                 Liga o servidor (só isso).
├── .env                      Senhas e chaves (nunca vai para o GitHub).
├── package.json
│
├── database/
│   ├── banco.sql             Script COMPLETO do banco (tabelas).
│   └── migracoes/            Scripts avulsos para bancos que já existiam.
│
├── docs/                     Anotações do projeto (estrutura, git...).
│
├── src/                      Tudo que roda no SERVIDOR.
│   ├── app.js                Monta o Express: sessão, arquivos, rotas, erros.
│   ├── config/               Conexão com o banco e upload (Cloudinary/multer).
│   ├── middlewares/          Regras que rodam ANTES das rotas (login, admin).
│   ├── routes/               Qual URL chama qual função (um arquivo por assunto).
│   ├── controllers/          A lógica de cada ação (validar, decidir, responder).
│   └── models/               Único lugar com SQL (conversa com o banco).
│
├── views/admin/              Telas do painel administrativo (EJS).
│
└── public/                   Tudo que vai para o NAVEGADOR.
    ├── pages/                Páginas HTML (só estrutura, sem estilo e sem script).
    ├── css/                  Estilos. estilo.css importa todos os outros.
    ├── js/
    │   ├── compartilhado/    Scripts usados em várias páginas (utils, rodapé...).
    │   └── paginas/          Um script por página.
    └── img/                  Imagens do site.
```

## Como o pedido percorre o projeto

```
navegador → routes/ → (middlewares/) → controllers/ → models/ → banco
```

Exemplo, "publicar anúncio":
`routes/anuncios.js` → `anuncioController.publicar` → `models/anuncios.js` (grava)
→ `alertasController.gerarNotificacoes` (avisa quem tinha alerta).

## Regras da casa

1. **HTML não tem estilo.** Nada de `style="..."` nem `<style>`. Use uma classe;
   se ela não existir, crie em `public/css/componentes.css`.
2. **HTML não tem lógica.** Nada de `<script>` grande dentro da página: o código
   vai para `public/js/paginas/<nome-da-pagina>.js`.
3. **SQL só nos `models/`.** Controller não escreve SQL.
4. **Rota não tem lógica.** Rota só liga uma URL a uma função do controller.
5. **Arquivos em kebab-case** (`meus-anuncios.html`), controllers em camelCase
   (`anuncioController.js`).

## Receitas

**Página nova** (ex.: "favoritos"):
1. `public/pages/favoritos.html` (copie uma página parecida);
2. `public/js/paginas/favoritos.js`;
3. se precisa de login, acrescente `"/favoritos.html"` em `PAGINAS_PROTEGIDAS`
   (`src/middlewares/auth.js`).

**Rota de API nova:** função no controller → uma linha no arquivo de `routes/`
do assunto → (se precisar de SQL) função no model.

**Estilo novo:** classe pequena em `css/componentes.css`; estilo de uma página
inteira, um arquivo novo em `css/` e um `@import` em `css/estilo.css`.
