async function carregarAnuncios() {
    const container = document.getElementById('container-anuncios');

    try {
        const resposta = await fetch('/api/anuncios');
        
        if (!resposta.ok) {
            throw new Error('Falha ao buscar os dados da API');
        }

        const anuncios = await resposta.json();
        container.innerHTML = '';

        if (!anuncios || anuncios.length === 0) {
            container.innerHTML = '<p class="muted">Nenhum anúncio cadastrado até o momento.</p>';
            return;
        }

        anuncios.forEach(anuncio => {
            const precoFormatado = Number(anuncio.preco).toLocaleString('pt-BR', {
                style: 'currency',
                currency: 'BRL'
            });

            const tagCategoria = (anuncio.categoria || 'Peça').toUpperCase();
            const fotoTexto = (anuncio.marca || anuncio.modelo || anuncio.categoria || 'PEÇA').toUpperCase();

            const artigo = document.createElement('article');
            artigo.className = 'vehicle';
            artigo.innerHTML = `
                <div class="vehiclephoto">${fotoTexto}</div>
                <div class="info">
                    <span>${tagCategoria}</span>
                    <h2>${anuncio.nome}</h2>
                    <p class="muted">${precoFormatado}</p>
                    <a href="anuncio.html?id=${anuncio.id}">Ver detalhes &rarr;</a>
                </div>
            `;
            container.appendChild(artigo);
        });
    } catch (erro) {
        console.error("Erro ao carregar anúncios:", erro);
        container.innerHTML = '<p class="muted">Não foi possível carregar os anúncios no momento.</p>';
    }
}

document.addEventListener('DOMContentLoaded', carregarAnuncios);