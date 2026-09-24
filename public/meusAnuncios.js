async function carregarMeusAnuncios() {
    const container = document.getElementById('container-meus-anuncios');

    try {
        const resposta = await fetch('/api/meus-anuncios');

        if (resposta.status === 401 || resposta.redirected) {
            window.location.href = '/login';
            return;
        }

        const listaAnuncios = await resposta.json();
        container.innerHTML = '';

        if (!listaAnuncios || listaAnuncios.length === 0) {
            container.innerHTML = '<p class="muted">Você ainda não publicou nenhum anúncio.</p>';
            return;
        }

        listaAnuncios.forEach(anuncio => {
            const precoFormatado = Number(anuncio.preco).toLocaleString('pt-BR', {
                style: 'currency',
                currency: 'BRL'
            });

            const tagCategoria = escapeHtml((anuncio.categoria || 'Peça').toUpperCase());
            const fotoTexto = escapeHtml((anuncio.marca || anuncio.modelo || anuncio.categoria || 'PEÇA').toUpperCase());

            // Mesma lógica de sempre: mostra a foto real se tiver, senão o placeholder de texto
            const fotoHtml = anuncio.imagem
                ? `<img class="vehiclephoto" src="${escapeHtml(anuncio.imagem)}" alt="${escapeHtml(anuncio.nome)}" style="object-fit:cover;">`
                : `<div class="vehiclephoto">${fotoTexto}</div>`;

            const artigo = document.createElement('article');
            artigo.className = 'vehicle';
            artigo.innerHTML = `
                ${fotoHtml}
                <div class="info">
                    <span>${tagCategoria}</span>
                    <h2>${escapeHtml(anuncio.nome)}</h2>
                    <p class="muted">${precoFormatado}</p>
                    <div class="row">
                        <a href="/anuncios/${encodeURIComponent(anuncio.id)}/editar" class="button secondary sm">Editar</a>
                        <button class="button secondary sm btn-excluir-anuncio">Excluir</button>
                    </div>
                </div>
            `;

            artigo.querySelector('.btn-excluir-anuncio').addEventListener('click', () => excluirAnuncio(anuncio.id));

            container.appendChild(artigo);
        });
    } catch (erro) {
        console.error('Erro ao carregar meus anúncios:', erro);
        container.innerHTML = '<p class="muted">Não foi possível carregar seus anúncios no momento.</p>';
    }
}

async function excluirAnuncio(id) {
    if (!confirm('Tem certeza que deseja excluir este anúncio? Isso também apaga as fotos dele.')) return;

    try {
        const resposta = await fetch(`/api/anuncios/${id}`, { method: 'DELETE' });

        if (!resposta.ok) {
            const erro = await resposta.json().catch(() => ({}));
            alert(erro.erro || 'Erro ao excluir o anúncio.');
            return;
        }

        carregarMeusAnuncios();
    } catch (erro) {
        console.error('Erro ao excluir anúncio:', erro);
        alert('Erro ao excluir o anúncio.');
    }
}

document.addEventListener('DOMContentLoaded', carregarMeusAnuncios);