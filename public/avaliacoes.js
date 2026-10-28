// Seção de avaliações do vendedor, na página anuncio.html.
// Precisa de utils.js carregado ANTES (usa escapeHtml).
document.addEventListener('DOMContentLoaded', () => {
    const secao = document.getElementById('secao-avaliacoes');
    const anuncioId = new URLSearchParams(window.location.search).get('id');

    if (!secao || !anuncioId) return;

    const MENSAGENS = {
        login: 'Entre na sua conta para avaliar este vendedor.',
        'sem-interesse': 'Clique em "Tenho interesse" neste anúncio para poder avaliar o vendedor.',
        'ja-avaliou': 'Você já avaliou este vendedor por este anúncio.',
        vendedor: ''
    };

    function estrelas(nota) {
        const n = Math.round(nota);
        return '★'.repeat(n) + '☆'.repeat(5 - n);
    }

    function formatarData(texto) {
        return new Date(texto).toLocaleDateString('pt-BR');
    }

    // Se a sessão expirou, o servidor redireciona pro login.
    function sessaoExpirou(resposta) {
        if (resposta.redirected || resposta.status === 401) {
            window.location.href = '/login';
            return true;
        }
        return false;
    }

    function montarFormulario(dados) {
        if (dados.podeAvaliar) {
            return `
                <form id="form-avaliacao" class="panel" style="margin-top:20px;">
                    <h3>Avaliar vendedor</h3>
                    <div class="input-container" style="margin-top:12px;">
                        <label for="nota-avaliacao">Nota</label>
                        <select id="nota-avaliacao" required>
                            <option value="">Selecione</option>
                            <option value="5">★★★★★ (5) Excelente</option>
                            <option value="4">★★★★☆ (4) Bom</option>
                            <option value="3">★★★☆☆ (3) Regular</option>
                            <option value="2">★★☆☆☆ (2) Ruim</option>
                            <option value="1">★☆☆☆☆ (1) Péssimo</option>
                        </select>
                    </div>
                    <div class="input-container" style="margin-top:12px;">
                        <label for="comentario-avaliacao">Comentário (opcional)</label>
                        <textarea id="comentario-avaliacao" rows="3" maxlength="500" placeholder="Como foi a negociação?"></textarea>
                    </div>
                    <button type="submit" class="button primary" style="margin-top:14px;">Enviar avaliação</button>
                </form>
            `;
        }

        const mensagem = MENSAGENS[dados.motivo];
        return mensagem ? `<p class="muted" style="margin-top:16px;">${escapeHtml(mensagem)}</p>` : '';
    }

    function montarItem(avaliacao, souVendedor) {
        const resposta = avaliacao.resposta
            ? `<p class="muted" style="margin-top:8px; padding-left:12px; border-left:3px solid #c99a55;">
                   <b>Resposta do vendedor:</b> ${escapeHtml(avaliacao.resposta)}
               </p>`
            : (souVendedor
                ? `<div class="area-resposta" style="margin-top:8px;">
                       <button type="button" class="button secondary sm btn-abrir-resposta">Responder</button>
                       <div class="form-resposta" style="display:none; margin-top:8px;">
                           <textarea rows="2" maxlength="500" placeholder="Escreva sua resposta pública..." style="width:100%;"></textarea>
                           <button type="button" class="button primary sm btn-enviar-resposta" data-id="${escapeHtml(avaliacao.id)}" style="margin-top:6px;">Publicar resposta</button>
                       </div>
                   </div>`
                : '');

        return `
            <div class="panel" style="margin-top:12px;">
                <div style="color:#c99a55; font-size:18px;">${estrelas(avaliacao.nota)}</div>
                <small class="muted">
                    ${escapeHtml(avaliacao.avaliador_nome)} · ${escapeHtml(formatarData(avaliacao.data_criacao))}
                    ${avaliacao.anuncio_nome ? ` · sobre "${escapeHtml(avaliacao.anuncio_nome)}"` : ''}
                </small>
                ${avaliacao.comentario ? `<p style="margin-top:8px;">${escapeHtml(avaliacao.comentario)}</p>` : ''}
                ${resposta}
            </div>
        `;
    }

    function renderizar(dados) {
        const resumo = dados.total > 0
            ? `<p><span style="color:#c99a55; font-size:22px;">${estrelas(dados.media)}</span>
               <b>${escapeHtml(String(dados.media).replace('.', ','))}</b>
               <span class="muted">(${dados.total} ${dados.total === 1 ? 'avaliação' : 'avaliações'})</span></p>`
            : '<p class="muted">Este vendedor ainda não recebeu avaliações.</p>';

        secao.innerHTML = `
            <p class="eyebrow">REPUTAÇÃO</p>
            <h2>Avaliações do vendedor</h2>
            ${resumo}
            ${montarFormulario(dados)}
            <div>${dados.avaliacoes.map(a => montarItem(a, dados.souVendedor)).join('')}</div>
        `;

        ligarEventos(dados);
    }

    function ligarEventos() {
        const form = document.getElementById('form-avaliacao');

        if (form) {
            form.addEventListener('submit', async (evento) => {
                evento.preventDefault();

                const nota = document.getElementById('nota-avaliacao').value;
                const comentario = document.getElementById('comentario-avaliacao').value;

                try {
                    const resposta = await fetch(`/api/anuncios/${encodeURIComponent(anuncioId)}/avaliacoes`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ nota, comentario })
                    });

                    if (sessaoExpirou(resposta)) return;

                    if (!resposta.ok) {
                        const erro = await resposta.json().catch(() => ({}));
                        alert(erro.erro || 'Erro ao enviar a avaliação.');
                        return;
                    }

                    carregarAvaliacoes();
                } catch (erro) {
                    console.error('Erro ao enviar avaliação:', erro);
                    alert('Erro ao enviar a avaliação.');
                }
            });
        }

        // Botão "Responder" abre/fecha a caixa de texto
        secao.querySelectorAll('.btn-abrir-resposta').forEach(botao => {
            botao.addEventListener('click', () => {
                const caixa = botao.parentElement.querySelector('.form-resposta');
                caixa.style.display = caixa.style.display === 'none' ? 'block' : 'none';
            });
        });

        secao.querySelectorAll('.btn-enviar-resposta').forEach(botao => {
            botao.addEventListener('click', async () => {
                const texto = botao.parentElement.querySelector('textarea').value;

                try {
                    const resposta = await fetch(`/api/avaliacoes/${encodeURIComponent(botao.dataset.id)}/resposta`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ resposta: texto })
                    });

                    if (sessaoExpirou(resposta)) return;

                    if (!resposta.ok) {
                        const erro = await resposta.json().catch(() => ({}));
                        alert(erro.erro || 'Erro ao publicar a resposta.');
                        return;
                    }

                    carregarAvaliacoes();
                } catch (erro) {
                    console.error('Erro ao responder avaliação:', erro);
                    alert('Erro ao publicar a resposta.');
                }
            });
        });
    }

    async function carregarAvaliacoes() {
        try {
            const resposta = await fetch(`/api/anuncios/${encodeURIComponent(anuncioId)}/avaliacoes`);

            if (!resposta.ok) {
                secao.innerHTML = '';
                return;
            }

            renderizar(await resposta.json());
        } catch (erro) {
            console.error('Erro ao carregar avaliações:', erro);
            secao.innerHTML = '<p class="muted">Não foi possível carregar as avaliações no momento.</p>';
        }
    }

    // Deixa o anuncio-detalhes.js recarregar as avaliações quando o
    // usuário marcar/desmarcar interesse (isso libera o formulário).
    window.recarregarAvaliacoes = carregarAvaliacoes;

    carregarAvaliacoes();
});