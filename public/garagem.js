document.addEventListener('DOMContentLoaded', () => {
    const container = document.getElementById('container-veiculos');
    const painelForm = document.getElementById('painel-form-veiculo');
    const tituloForm = document.getElementById('titulo-form-veiculo');
    const form = document.getElementById('form-veiculo');
    const inputId = document.getElementById('veiculo-id');
    const inputMarca = document.getElementById('veiculo-marca');
    const inputModelo = document.getElementById('veiculo-modelo');
    const inputAnoInicial = document.getElementById('veiculo-ano-inicial');
    const inputAnoFinal = document.getElementById('veiculo-ano-final');
    const btnNovo = document.getElementById('btn-novo-veiculo');
    const btnCancelar = document.getElementById('btn-cancelar-veiculo');

    function abrirFormulario(veiculo) {
        if (veiculo) {
            tituloForm.innerText = 'Editar veículo';
            inputId.value = veiculo.id;
            inputMarca.value = veiculo.marca;
            inputModelo.value = veiculo.modelo;
            inputAnoInicial.value = veiculo.ano_inicial;
            inputAnoFinal.value = veiculo.ano_final || '';
        } else {
            tituloForm.innerText = 'Novo veículo';
            form.reset();
            inputId.value = '';
        }
        painelForm.classList.remove('oculto');
        inputMarca.focus();
    }

    function fecharFormulario() {
        painelForm.classList.add('oculto');
        form.reset();
        inputId.value = '';
    }

    async function carregarVeiculos() {
        try {
            const resposta = await fetch('/api/meus-veiculos');

            if (resposta.status === 401 || resposta.redirected) {
                window.location.href = '/login';
                return;
            }

            const listaVeiculos = await resposta.json();
            container.innerHTML = '';

            if (!listaVeiculos || listaVeiculos.length === 0) {
                container.innerHTML = '<p class="muted">Você ainda não cadastrou nenhum veículo.</p>';
                return;
            }

            listaVeiculos.forEach(veiculo => {
                const periodo = veiculo.ano_final
                    ? `${veiculo.ano_inicial} – ${veiculo.ano_final}`
                    : `${veiculo.ano_inicial}`;

                const artigo = document.createElement('article');
                artigo.className = 'vehicle';
                artigo.innerHTML = `
                    <div class="vehiclephoto">${veiculo.marca.toUpperCase()}</div>
                    <div class="info">
                        <span>${periodo}</span>
                        <h2>${veiculo.marca} ${veiculo.modelo}</h2>
                        <div class="row">
                            <button class="button secondary sm btn-editar">Editar</button>
                            <button class="button secondary sm btn-excluir">Excluir</button>
                        </div>
                    </div>
                `;

                artigo.querySelector('.btn-editar').addEventListener('click', () => abrirFormulario(veiculo));
                artigo.querySelector('.btn-excluir').addEventListener('click', () => excluirVeiculo(veiculo.id));

                container.appendChild(artigo);
            });
        } catch (erro) {
            console.error('Erro ao carregar veículos:', erro);
            container.innerHTML = '<p class="muted">Não foi possível carregar seus veículos no momento.</p>';
        }
    }

    async function excluirVeiculo(id) {
        if (!confirm('Tem certeza que deseja excluir este veículo?')) return;

        try {
            const resposta = await fetch(`/api/veiculos/${id}`, { method: 'DELETE' });

            if (!resposta.ok) {
                alert('Erro ao excluir o veículo.');
                return;
            }

            carregarVeiculos();
        } catch (erro) {
            console.error('Erro ao excluir veículo:', erro);
            alert('Erro ao excluir o veículo.');
        }
    }

    btnNovo.addEventListener('click', () => abrirFormulario(null));
    btnCancelar.addEventListener('click', fecharFormulario);

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const dados = {
            marca: inputMarca.value,
            modelo: inputModelo.value,
            ano_inicial: inputAnoInicial.value,
            ano_final: inputAnoFinal.value || null
        };

        const id = inputId.value;
        const url = id ? `/api/veiculos/${id}` : '/api/veiculos';
        const metodo = id ? 'PUT' : 'POST';

        try {
            const resposta = await fetch(url, {
                method: metodo,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(dados)
            });

            if (!resposta.ok) {
                const erro = await resposta.json().catch(() => ({}));
                alert(erro.erro || 'Erro ao salvar o veículo.');
                return;
            }

            fecharFormulario();
            carregarVeiculos();
        } catch (erro) {
            console.error('Erro ao salvar veículo:', erro);
            alert('Erro ao salvar o veículo.');
        }
    });

    carregarVeiculos();
});