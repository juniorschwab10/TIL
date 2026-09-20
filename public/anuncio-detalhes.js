async function carregarDetalhesAnuncio() {
    // Pega o ID passado no parâmetro da URL (?id=X)
    const urlParams = new URLSearchParams(window.location.search);
    const anuncioId = urlParams.get('id');
    const container = document.getElementById('conteudo-anuncio');

    if (!anuncioId) {
        container.innerHTML = '<p class="muted">Nenhum anúncio foi selecionado.</p>';
        return;
    }

    try {
        const resposta = await fetch(`/api/anuncios/${anuncioId}`);

        if (!resposta.ok) {
            container.innerHTML = '<p class="muted">Anúncio não encontrado.</p>';
            return;
        }

        const anuncio = await resposta.json();

        // Formatação do preço em Reais (R$)
        const precoFormatado = Number(anuncio.preco).toLocaleString('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        });

        // Nome e iniciais do vendedor
        const vendedorNome = anuncio.vendedor ? anuncio.vendedor.nome : 'Vendedor';
        const iniciais = vendedorNome
            .split(' ')
            .map(nome => nome[0])
            .join('')
            .substring(0, 2)
            .toUpperCase();

        const tagCategoria = (anuncio.categoria || 'Motor').toUpperCase();
        const fotoTexto = (anuncio.marca || anuncio.modelo || 'OPALA').toUpperCase();
        const telefoneVendedor = anuncio.vendedor?.telefone || '';

        container.innerHTML = `
            <div>
                ${anuncio.imagem
                    ? `<div class="mainphoto"><img src="${anuncio.imagem}" alt="${anuncio.nome}"></div>`
                    : `<div class="mainphoto">${fotoTexto}</div>`}
            </div>

            <div class="data">
                <span class="tag">${tagCategoria}</span>
                <h1>${anuncio.nome}</h1>
                <p class="muted">📍 Paraná, Brasil</p>

                <div class="price">${precoFormatado}</div>
                <p class="muted">${anuncio.descricao || 'Sem descrição informada.'}</p>

                <div class="specs">
                    <div>
                        <small>CONDIÇÃO</small>
                        <b>${anuncio.condicao || 'Usada'}</b>
                    </div>
                    <div>
                        <small>MARCA</small>
                        <b>${anuncio.marca || 'Universal'}</b>
                    </div>
                    <div>
                        <small>MODELO</small>
                        <b>${anuncio.modelo || 'Geral'}</b>
                    </div>
                </div>

                <button class="button primary">Tenho interesse</button>
                <a class="button secondary" href="${telefoneVendedor ? `https://api.whatsapp.com/send?phone=${telefoneVendedor}&text=Olá,%20tenho%20interesse%20no%20anúncio%20${encodeURIComponent(anuncio.nome)}` : 'chat.html'}" target="_blank">Conversar com vendedor</a>

                <div class="seller">
                    <div class="avatar">${iniciais}</div>
                    <div>
                        <small>Vendedor</small>
                        <b>${vendedorNome}</b>
                        <span>${telefoneVendedor ? `Tel: ${telefoneVendedor}` : 'Contato não informado'}</span>
                    </div>
                </div>
            </div>
        `;
    } catch (erro) {
        console.error("Erro ao carregar os detalhes:", erro);
        container.innerHTML = '<p class="muted">Erro ao carregar as informações do anúncio.</p>';
    }
}

document.addEventListener('DOMContentLoaded', carregarDetalhesAnuncio);