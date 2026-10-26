-- Criar o banco de dados
CREATE DATABASE IF NOT EXISTS bd_til;
USE bd_til;

-- Tabela de Usuários
CREATE TABLE IF NOT EXISTS usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    telefone VARCHAR(20),
    senha VARCHAR(255) NOT NULL,
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de Anúncios
CREATE TABLE IF NOT EXISTS anuncios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    nome VARCHAR(150) NOT NULL,
    categoria VARCHAR(50),
    descricao TEXT,
    condicao VARCHAR(20),
    preco DECIMAL(10, 2) NOT NULL,
    marca VARCHAR(50),
    modelo VARCHAR(50),
    ano_inicial YEAR,
    ano_final YEAR,
    localizacao VARCHAR(100),
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

-- Tabela de Imagens (Integração Cloudinary)
CREATE TABLE IF NOT EXISTS imagens (
    id INT AUTO_INCREMENT PRIMARY KEY,
    anuncio_id INT NOT NULL,
    url VARCHAR(500) NOT NULL,
    public_id VARCHAR(255) NOT NULL,
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (anuncio_id) REFERENCES anuncios(id) ON DELETE CASCADE
);

-- Tabela de Veículos (Garagem)
CREATE TABLE IF NOT EXISTS veiculos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    marca VARCHAR(50) NOT NULL,
    modelo VARCHAR(50) NOT NULL,
    ano_inicial YEAR,
    ano_final YEAR,
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS interesses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    anuncio_id INT NOT NULL,
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unico_interesse (usuario_id, anuncio_id),
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    FOREIGN KEY (anuncio_id) REFERENCES anuncios(id) ON DELETE CASCADE
);

-- Tabela de avaliaçao de anuncios

CREATE TABLE IF NOT EXISTS avaliacoes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    anuncio_id INT NULL,
    avaliador_id INT NOT NULL,
    vendedor_id INT NOT NULL,
    nota TINYINT NOT NULL,
    comentario VARCHAR(500),
    resposta VARCHAR(500),
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    -- Uma avaliação por comprador em cada anúncio
    UNIQUE KEY avaliacao_unica (avaliador_id, anuncio_id),
    CONSTRAINT chk_nota CHECK (nota BETWEEN 1 AND 5),
    -- Se o anúncio for excluído, a avaliação continua valendo para o vendedor
    FOREIGN KEY (anuncio_id) REFERENCES anuncios(id) ON DELETE SET NULL,
    FOREIGN KEY (avaliador_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    FOREIGN KEY (vendedor_id) REFERENCES usuarios(id) ON DELETE CASCADE
);