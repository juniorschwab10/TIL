// Página "Alertas": criar/remover alertas e ver as notificações recebidas.
// Precisa de utils.js carregado ANTES (usa escapeHtml).
document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('form-alerta');
    const selectVeiculo = document.getElementById('alerta-veiculo');
    const inputTermo = document.getElementById('alerta-termo');
    const btnCriar = document.getElementById('btn-criar-alerta');
    const avisoSemVeiculo = document.getElementById('aviso-sem-veiculo');
    const listaAlertas = document.getElementById('lista-alertas');
    const listaNotificacoes = document.getElementById('lista-notificacoes');
    const contador = document.getElementById('contador-notificacoes');
    const btnTodas = document.getElementById('btn-marcar-todas');

    // Chama a API; se a sessão expirou, manda pro login.
    async function chamar(url, opcoes) {
        const resposta = await fetch(url, opcoes);
        if (resposta.status === 401 || resposta.redirected) {
            window.location.href = '/login';
            return null;
        }
        return resposta;
    }

    function formatarData(texto) {
        return new Date(texto).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
    }

    function descreverVeiculo(v) {
        const anos = v.ano_inicial
            ? ` (${v.ano_inicial}${v.ano_final ? '–' + v.ano_final : ''})`
            : '';
        return `${v.marca} ${v.modelo}${anos}`;
    }

    // ---------------------------------------------------------------- veículos
    async function carregarVeiculos() {
        try {
            const resposta = await chamar('/api/meus-veiculos');
            if (!resposta) return;

            const veiculos = await resposta.json();

            if (!veiculos.length) {
                selectVeiculo.innerHTML = '<option value="">Nenhum veículo cadastrado</option>';
                selectVeiculo.disabled = true;
                inputTermo.disabled = true;
                btnCriar.disabled = true;
                avisoSemVeiculo.style.display = 'block';
                return;
            }

            selectVeiculo.innerHTML = '<option value="">Selecione</option>' + veiculos
                .map(v => `<option value="${escapeHtml(v.id)}">${escapeHtml(descreverVeiculo(v))}</option>`)
                .join('');
        } catch (erro) {
            console.error('Erro ao carregar veículos:', erro);
            selectVeiculo.innerHTML = '<option value="">Erro ao carregar</option>';
        }
    }

    // ----------------------------------------------------------------- alertas
    async function carregarAlertas() {
        try {
            const resposta = await chamar('/api/meus-alertas');
            if (!resposta) return;

            const alertas = await resposta.json();

            if (!alertas.length) {
                listaAlertas.innerHTML = '<p class="muted">Você ainda não criou nenhum alerta.</p>';
                return;
            }

            listaAlertas.innerHTML = alertas.map(a => `
                <div class="flex-between" style="padding:12px 0; border-bottom:1px solid #eee; gap:12px;">
                    <div>
                        <b>${escapeHtml(a.termo)}</b><br>
                        <small class="muted">${escapeHtml(descreverVeiculo(a))}</small>
                    </div>
                    <button type="button" class="button secondary sm btn-excluir-alerta" data-id="${escapeHtml(a.id)}">Remover</button>
                </div>
            `).join('');

            listaAlertas.querySelectorAll('.btn-excluir-alerta').forEach(botao => {
                botao.addEventListener('click', () => excluirAlerta(botao.dataset.id));
            });
        } catch (erro) {
            console.error('Erro ao carregar alertas:', erro);
            listaAlertas.innerHTML = '<p class="muted">Não foi possível carregar seus alertas no momento.</p>';
        }
    }

    async function excluirAlerta(id) {
        if (!confirm('Remover este alerta?')) return;

        try {
            const resposta = await chamar(`/api/alertas/${encodeURIComponent(id)}`, { method: 'DELETE' });
            if (!resposta) return;

            if (!resposta.ok) {
                const erro = await resposta.json().catch(() => ({}));
                alert(erro.erro || 'Erro ao remover o alerta.');
                return;
            }

            carregarAlertas();
        } catch (erro) {
            console.error('Erro ao remover alerta:', erro);
            alert('Erro ao remover o alerta.');
        }
    }

    form.addEventListener('submit', async (evento) => {
        evento.preventDefault();

        try {
            const resposta = await chamar('/api/alertas', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    veiculo_id: selectVeiculo.value,
                    termo: inputTermo.value
                })
            });
            if (!resposta) return;

            if (!resposta.ok) {
                const erro = await resposta.json().catch(() => ({}));
                alert(erro.erro || 'Erro ao criar o alerta.');
                return;
            }

            inputTermo.value = '';
            carregarAlertas();
        } catch (erro) {
            console.error('Erro ao criar alerta:', erro);
            alert('Erro ao criar o alerta.');
        }
    });

    // ------------------------------------------------------------ notificações
    // Marca como lida sem esperar a resposta (keepalive deixa a requisição
    // terminar mesmo se a página mudar logo em seguida, ao abrir o anúncio).
    function marcarLidaEmSegundoPlano(id) {
        fetch(`/api/notificacoes/${encodeURIComponent(id)}/lida`, { method: 'PUT', keepalive: true }).catch(() => {});
    }

    async function carregarNotificacoes() {
        try {
            const resposta = await chamar('/api/notificacoes');
            if (!resposta) return;

            const lista = await resposta.json();
            const naoLidas = lista.filter(n => !n.lida).length;

            contador.textContent = naoLidas > 0 ? `(${naoLidas} não lida${naoLidas === 1 ? '' : 's'})` : '';
            btnTodas.style.display = naoLidas > 0 ? 'inline-flex' : 'none';

            if (!lista.length) {
                listaNotificacoes.innerHTML = '<p class="muted">Nenhuma notificação por enquanto. Quando alguém publicar uma peça compatível com um dos seus alertas, ela aparece aqui.</p>';
                return;
            }

            listaNotificacoes.innerHTML = lista.map(n => {
                const preco = Number(n.preco).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
                const destaque = n.lida ? '' : 'border-left:4px solid #c99a55; background:#faf6ef;';
                const veiculo = [n.marca, n.modelo].filter(Boolean).join(' ');

                return `
                    <div class="flex-between" style="padding:12px 14px; margin-bottom:8px; border:1px solid #eee; border-radius:8px; gap:12px; ${destaque}">
                        <div>
                            <a href="anuncio.html?id=${encodeURIComponent(n.anuncio_id)}" class="link-notificacao" data-id="${escapeHtml(n.id)}" data-lida="${n.lida ? '1' : '0'}">
                                <b>${n.lida ? '' : '● '}${escapeHtml(n.anuncio_nome)}</b>
                            </a>
                            <span class="muted"> · ${escapeHtml(preco)}</span><br>
                            <small class="muted">
                                Compatível com seu alerta${n.termo ? ` “${escapeHtml(n.termo)}”` : ''}${veiculo ? ` · ${escapeHtml(veiculo)}` : ''}
                                · ${escapeHtml(formatarData(n.data_criacao))}
                            </small>
                        </div>
                        ${n.lida ? '' : `<button type="button" class="button secondary sm btn-lida" data-id="${escapeHtml(n.id)}">Marcar como lida</button>`}
                    </div>
                `;
            }).join('');

            // Abrir o anúncio já conta como "lida"
            listaNotificacoes.querySelectorAll('.link-notificacao').forEach(link => {
                link.addEventListener('click', () => {
                    if (link.dataset.lida === '0') marcarLidaEmSegundoPlano(link.dataset.id);
                });
            });

            listaNotificacoes.querySelectorAll('.btn-lida').forEach(botao => {
                botao.addEventListener('click', async () => {
                    await chamar(`/api/notificacoes/${encodeURIComponent(botao.dataset.id)}/lida`, { method: 'PUT' });
                    carregarNotificacoes();
                });
            });
        } catch (erro) {
            console.error('Erro ao carregar notificações:', erro);
            listaNotificacoes.innerHTML = '<p class="muted">Não foi possível carregar as notificações no momento.</p>';
        }
    }

    btnTodas.addEventListener('click', async () => {
        await chamar('/api/notificacoes/lidas', { method: 'PUT' });
        carregarNotificacoes();
    });

    // Vindo da busca sem resultado (anuncios.js): ?termo=carburador já preenche o campo
    const termoDaUrl = new URLSearchParams(window.location.search).get('termo');
    if (termoDaUrl) inputTermo.value = termoDaUrl.slice(0, 100);

    carregarVeiculos();
    carregarAlertas();
    carregarNotificacoes();
});