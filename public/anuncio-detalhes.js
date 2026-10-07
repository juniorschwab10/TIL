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
        const resposta = await fetch(`/api/anuncios/${encodeURIComponent(anuncioId)}`);

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

        // escapeHtml (utils.js): tudo que veio do banco passa por ele antes
        // de entrar no innerHTML, pra evitar XSS.
        const tagCategoria = escapeHtml((anuncio.categoria || 'Motor').toUpperCase());
        const fotoTexto = escapeHtml((anuncio.marca || anuncio.modelo || 'OPALA').toUpperCase());
        const listaFotos = anuncio.imagens || []; // array de URLs, pode vir vazio

        // Monta a foto principal (a div .mainphoto completa): com imagem
        // real se tiver, ou com o bloco de texto de sempre se não tiver.
        const fotoPrincipal = listaFotos.length > 0
            ? `<div class="mainphoto" id="wrapper-foto-principal"><img id="foto-principal" src="${escapeHtml(listaFotos[0])}" alt="${escapeHtml(anuncio.nome)}"></div>`
            : `<div class="mainphoto" id="wrapper-foto-principal">${fotoTexto}</div>`;

        // Miniaturas clicáveis: só aparecem se tiver mais de 1 foto,
        // já que com 1 foto só não faz sentido trocar de imagem.
        // A imagem de fundo de cada miniatura é aplicada logo abaixo, via
        // JavaScript, em vez de montar um style="..." com a URL dentro do HTML.
        const miniaturas = listaFotos.length > 1
            ? listaFotos.map(url => `
                <i class="thumb-clicavel" data-url="${escapeHtml(url)}"></i>
              `).join('')
            : '';

        // Telefone: o cadastro aceita formatos como "(45) 99999-9999", mas o
        // link do WhatsApp só entende dígitos, com o código do país (55).
        const telefoneVendedor = String(anuncio.vendedor?.telefone || '');
        const telefoneDigitos = telefoneVendedor.replace(/\D/g, '');
        const telefoneWhats = telefoneDigitos.length <= 11 ? `55${telefoneDigitos}` : telefoneDigitos;
        const linkConversa = telefoneDigitos
            ? `https://api.whatsapp.com/send?phone=${telefoneWhats}&text=${encodeURIComponent(`Olá, tenho interesse no anúncio ${anuncio.nome}`)}`
            : 'chat.html';

        container.innerHTML = `
            <div>
                ${fotoPrincipal}
                ${miniaturas ? `<div class="thumbs">${miniaturas}</div>` : ''}
            </div>

            <div class="data">
                <span class="tag">${tagCategoria}</span>
                <h1>${escapeHtml(anuncio.nome)}</h1>
                <p class="muted">📍 ${escapeHtml(anuncio.localizacao || 'Localização não informada')}</p>

                <div class="price">${precoFormatado}</div>
                <p class="muted">${escapeHtml(anuncio.descricao || 'Sem descrição informada.')}</p>

                <div class="specs">
                    <div>
                        <small>CONDIÇÃO</small>
                        <b>${escapeHtml(anuncio.condicao || 'Usada')}</b>
                    </div>
                    <div>
                        <small>MARCA</small>
                        <b>${escapeHtml(anuncio.marca || 'Universal')}</b>
                    </div>
                    <div>
                        <small>MODELO</small>
                        <b>${escapeHtml(anuncio.modelo || 'Geral')}</b>
                    </div>
                </div>

                <a class="button primary" href="${linkConversa}" target="_blank" rel="noopener">Tenho interesse</a>
                <a class="button secondary" href="${linkConversa}" target="_blank" rel="noopener">Conversar com vendedor</a>

                <div class="seller">
                    <div class="avatar">${escapeHtml(iniciais)}</div>
                    <div>
                        <small>Vendedor</small>
                        <b>${escapeHtml(vendedorNome)}</b>
                        <span>${telefoneVendedor ? `Tel: ${escapeHtml(telefoneVendedor)}` : 'Contato não informado'}</span>
                    </div>
                </div>
            </div>
        `;

        // Aplica a imagem de fundo de cada miniatura e faz cada uma, ao ser
        // clicada, virar a foto principal. Só existe algo pra fazer aqui se
        // houver miniaturas (mais de 1 foto).
        document.querySelectorAll('.thumb-clicavel').forEach(function (miniatura) {
            // JSON.stringify coloca aspas e escapa qualquer caractere perigoso da URL
            miniatura.style.backgroundImage = `url(${JSON.stringify(miniatura.dataset.url)})`;

            miniatura.addEventListener('click', function () {
                const fotoPrincipalImg = document.getElementById('foto-principal');
                if (fotoPrincipalImg) {
                    fotoPrincipalImg.src = miniatura.dataset.url;
                }
            });
        });
    } catch (erro) {
        console.error("Erro ao carregar os detalhes:", erro);
        container.innerHTML = '<p class="muted">Erro ao carregar as informações do anúncio.</p>';
    }
}

document.addEventListener('DOMContentLoaded', carregarDetalhesAnuncio);