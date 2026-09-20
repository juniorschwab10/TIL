// Carrega as variáveis do arquivo .env para dentro de process.env.
// Precisa ser chamado antes de qualquer coisa que use essas variáveis.
require("dotenv").config();

const cloudinary = require("cloudinary").v2;
const multer = require("multer");

// Configuração explícita, uma variável por vez. Isso é mais fácil de
// depurar do que usar uma única CLOUDINARY_URL: se faltar alguma, o aviso
// abaixo diz exatamente qual.
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true
});

// Checagem amigável: se esquecer de preencher o .env, avisa direto no
// terminal em vez de deixar o erro genérico do Cloudinary aparecer só
// quando alguém tentar publicar um anúncio com foto.
const faltando = ["CLOUDINARY_CLOUD_NAME", "CLOUDINARY_API_KEY", "CLOUDINARY_API_SECRET"]
    .filter((chave) => !process.env[chave]);

if (faltando.length > 0) {
    console.warn(
        `⚠️  Faltam variáveis do Cloudinary no .env: ${faltando.join(", ")}. ` +
        `O upload de imagens não vai funcionar até isso ser preenchido.`
    );
}

// O multer intercepta o arquivo enviado pelo formulário e salva
// temporariamente na pasta "uploads/". Depois do upload pro Cloudinary,
// a gente apaga esse arquivo temporário (veja o server.js).
const upload = multer({
    dest: "uploads/",
    limits: {
        // Limite de 5MB por imagem, pra evitar upload de arquivos gigantes
        fileSize: 5 * 1024 * 1024
    },
    fileFilter: (req, file, cb) => {
        // Aceita só imagens — bloqueia PDF, .exe, etc.
        if (file.mimetype.startsWith("image/")) {
            cb(null, true);
        } else {
            cb(new Error("Apenas arquivos de imagem são permitidos."));
        }
    }
});

module.exports = { cloudinary, upload };