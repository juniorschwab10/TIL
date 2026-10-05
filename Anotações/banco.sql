-- Criar o banco de dados
CREATE DATABASE IF NOT EXISTS iron_legacy
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

USE iron_legacy;

-- 1. Tabela de Usuários
CREATE TABLE IF NOT EXISTS usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    senha VARCHAR(255) NOT NULL,
    telefone VARCHAR(20),
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Tabela de Veículos (Garagem do Usuário)
CREATE TABLE IF NOT EXISTS veiculos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    marca VARCHAR(50) NOT NULL,
    modelo VARCHAR(50) NOT NULL,
    ano INT NOT NULL,
    cor VARCHAR(30),
    imagem VARCHAR(255),
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

-- 3. Tabela de Anúncios de Peças
CREATE TABLE IF NOT EXISTS anuncios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    nome VARCHAR(150) NOT NULL,
    categoria ENUM('Motor', 'Carroceria', 'Eletrica') NOT NULL,
    marca VARCHAR(50),
    modelo VARCHAR(50),
    ano_inicial INT,
    ano_final INT,
    localizacao VARCHAR(100),
    descricao TEXT,
    condicao ENUM('Usada', 'Nova') NOT NULL DEFAULT 'Usada',
    preco DECIMAL(10, 2) NOT NULL,
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

-- 4. Tabela de Imagens dos Anúncios (Até 3 fotos por anúncio)
CREATE TABLE IF NOT EXISTS imagens_anuncio (
    id INT AUTO_INCREMENT PRIMARY KEY,
    anuncio_id INT NOT NULL,
    caminho_imagem VARCHAR(255) NOT NULL,
    FOREIGN KEY (anuncio_id) REFERENCES anuncios(id) ON DELETE CASCADE
);