async function carregarMeusInteresses() {
    const container = document.getElementById('container-interesses');

    try {
        const resposta = await fetch('/api/meus-interesses');

        if (resposta.status === 401 || resposta.redirected) {
            window.location.href = '/login';
            return;
        }

        const lista = await resposta.json();
        container.innerHTML = '';

        if (!lista || lista.length === 0) {
            container.innerHTML = '<p class="muted">Você ainda não marcou interesse em nenhuma peça.</p>';
            return;
        }

        lista.forEach(anuncio => {
            const precoFormatado = Number(anuncio.preco).toLocaleString('pt-BR', {
                style: 'currency',
                currency: 'BRL'
            });

            const tagCategoria = escapeHtml((anuncio.categoria || 'Peça').toUpperCase());
            const fotoTexto = escapeHtml((anuncio.marca || anuncio.modelo || anuncio.categoria || 'PEÇA').toUpperCase());

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
                        <a href="anuncio.html?id=${encodeURIComponent(anuncio.id)}" class="button secondary sm">Ver detalhes</a>
                        <button class="button secondary sm btn-remover-interesse">Remover</button>
                    </div>
                </div>
            `;

            artigo.querySelector('.btn-remover-interesse').addEventListener('click', () => removerInteresse(anuncio.id));

            container.appendChild(artigo);
        });
    } catch (erro) {
        console.error('Erro ao carregar interesses:', erro);
        container.innerHTML = '<p class="muted">Não foi possível carregar seus interesses no momento.</p>';
    }
}

async function removerInteresse(anuncioId) {
    if (!confirm('Remover esta peça da sua lista de interesses?')) return;

    try {
        const resposta = await fetch(`/api/interesses/${encodeURIComponent(anuncioId)}`, { method: 'DELETE' });

        if (!resposta.ok) {
            const erro = await resposta.json().catch(() => ({}));
            alert(erro.erro || 'Erro ao remover o interesse.');
            return;
        }

        carregarMeusInteresses();
    } catch (erro) {
        console.error('Erro ao remover interesse:', erro);
        alert('Erro ao remover o interesse.');
    }
}

document.addEventListener('DOMContentLoaded', carregarMeusInteresses);