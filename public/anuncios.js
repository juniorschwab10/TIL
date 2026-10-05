// Lista de peças (catálogo público), com busca por palavra-chave, filtros
// combinados (marca, modelo, ano, categoria, condição, localização) e
// ordenação — tudo é repassado pra API via query string, então quem faz o
// filtro de verdade é o servidor (função listarTodos em models/anuncios.js).
document.addEventListener('DOMContentLoaded', () => {
    const container = document.getElementById('container-anuncios');
    const contagem = document.getElementById('contagem-resultados');

    const formBusca = document.getElementById('form-busca');
    const campoBusca = document.getElementById('campo-busca');
    const filtroCategoria = document.getElementById('filtro-categoria');
    const filtroCondicao = document.getElementById('filtro-condicao');
    const filtroMarca = document.getElementById('filtro-marca');
    const filtroModelo = document.getElementById('filtro-modelo');
    const filtroAno = document.getElementById('filtro-ano');
    const filtroLocalizacao = document.getElementById('filtro-localizacao');
    const selectOrdenar = document.getElementById('select-ordenar');
    const btnLimparFiltros = document.getElementById('btn-limpar-filtros');

    // Nem toda página que carrega este arquivo tem a barra de busca (por
    // enquanto só anuncios.html tem). Se não tiver, cai pro comportamento
    // simples de antes: lista tudo, sem filtro nenhum.
    if (!formBusca) {
        carregarAnuncios({});
        return;
    }

    // Espera a pessoa parar de digitar antes de buscar de novo, pra não
    // disparar uma requisição a cada letra digitada.
    let temporizadorDigitacao = null;
    function comAtraso(funcao, atrasoMs = 450) {
        return (...args) => {
            clearTimeout(temporizadorDigitacao);
            temporizadorDigitacao = setTimeout(() => funcao(...args), atrasoMs);
        };
    }

    // Lê o estado atual dos campos de busca/filtro/ordenação.
    function lerFiltros() {
        return {
            busca: campoBusca.value.trim(),
            categoria: filtroCategoria.value,
            condicao: filtroCondicao.value,
            marca: filtroMarca.value.trim(),
            modelo: filtroModelo.value.trim(),
            ano: filtroAno.value.trim(),
            localizacao: filtroLocalizacao.value.trim(),
            ordenar: selectOrdenar.value
        };
    }

    // Preenche os campos a partir da URL (?busca=...&marca=...), pra um
    // link com filtro aplicado poder ser compartilhado/recarregado.
    function aplicarFiltrosDaUrl() {
        const parametros = new URLSearchParams(window.location.search);
        campoBusca.value = parametros.get('busca') || '';
        filtroCategoria.value = parametros.get('categoria') || '';
        filtroCondicao.value = parametros.get('condicao') || '';
        filtroMarca.value = parametros.get('marca') || '';
        filtroModelo.value = parametros.get('modelo') || '';
        filtroAno.value = parametros.get('ano') || '';
        filtroLocalizacao.value = parametros.get('localizacao') || '';
        selectOrdenar.value = parametros.get('ordenar') || 'relevancia';
    }

    // Monta a query string só com os filtros preenchidos e atualiza a URL
    // (sem recarregar a página), pra dar pra copiar o link com o filtro.
    function montarQueryString(filtros) {
        const parametros = new URLSearchParams();
        Object.entries(filtros).forEach(([chave, valor]) => {
            if (valor) parametros.set(chave, valor);
        });
        return parametros;
    }

    function haFiltroAtivo(filtros) {
        return Boolean(
            filtros.busca || filtros.categoria || filtros.condicao ||
            filtros.marca || filtros.modelo || filtros.ano || filtros.localizacao
        );
    }

    async function carregarAnuncios(filtros) {
        const parametros = montarQueryString(filtros);
        const novaUrl = parametros.toString()
            ? `${window.location.pathname}?${parametros.toString()}`
            : window.location.pathname;
        window.history.replaceState(null, '', novaUrl);

        container.innerHTML = '<p class="muted">Carregando anúncios...</p>';
        if (contagem) contagem.textContent = '';

        try {
            const resposta = await fetch(`/api/anuncios?${parametros.toString()}`);

            if (!resposta.ok) {
                throw new Error('Falha ao buscar os dados da API');
            }

            const anuncios = await resposta.json();
            container.innerHTML = '';

            if (!anuncios || anuncios.length === 0) {
                container.innerHTML = haFiltroAtivo(filtros)
                    ? `
                        <p class="muted">
                            Nenhum anúncio encontrado com esses filtros. Tente mudar a busca ou
                            <button type="button" class="link-accent" id="link-limpar-resultado" style="background:none; border:none; cursor:pointer; padding:0;">limpar os filtros</button>.
                        </p>
                      `
                    : '<p class="muted">Nenhum anúncio cadastrado até o momento.</p>';

                document.getElementById('link-limpar-resultado')?.addEventListener('click', limparFiltros);
                if (contagem) contagem.textContent = '';
                return;
            }

            if (contagem) {
                contagem.textContent = anuncios.length === 1
                    ? '1 anúncio encontrado'
                    : `${anuncios.length} anúncios encontrados`;
            }

            anuncios.forEach(anuncio => {
                const precoFormatado = Number(anuncio.preco).toLocaleString('pt-BR', {
                    style: 'currency',
                    currency: 'BRL'
                });

                // escapeHtml (utils.js): tudo que veio do banco passa por ele
                // antes de entrar no innerHTML, pra evitar XSS.
                const tagCategoria = escapeHtml((anuncio.categoria || 'Peça').toUpperCase());
                const fotoTexto = escapeHtml((anuncio.marca || anuncio.modelo || anuncio.categoria || 'PEÇA').toUpperCase());

                // RENDERIZAÇÃO DA IMAGEM: verifica se existe a propriedade de imagem da base de dados
                const fotoHtml = anuncio.imagem
                    ? `<img class="vehiclephoto" src="${escapeHtml(anuncio.imagem)}" alt="${escapeHtml(anuncio.nome)}" style="object-fit: cover;">`
                    : `<div class="vehiclephoto">${fotoTexto}</div>`;

                const artigo = document.createElement('article');
                artigo.className = 'vehicle';
                artigo.innerHTML = `
                    ${fotoHtml}
                    <div class="info">
                        <span>${tagCategoria}</span>
                        <h2>${escapeHtml(anuncio.nome)}</h2>
                        <p class="muted">${precoFormatado}</p>
                        <a href="anuncio.html?id=${encodeURIComponent(anuncio.id)}">Ver detalhes &rarr;</a>
                    </div>
                `;
                container.appendChild(artigo);
            });
        } catch (erro) {
            console.error("Erro ao carregar anúncios:", erro);
            container.innerHTML = '<p class="muted">Não foi possível carregar os anúncios no momento.</p>';
            if (contagem) contagem.textContent = '';
        }
    }

    function buscarComFiltrosAtuais() {
        carregarAnuncios(lerFiltros());
    }

    function limparFiltros() {
        formBusca.reset();
        selectOrdenar.value = 'relevancia';
        buscarComFiltrosAtuais();
    }

    const buscarComAtraso = comAtraso(buscarComFiltrosAtuais);

    // O botão "Buscar" e a tecla Enter no campo de texto já disparam o
    // evento submit do form — sem esperar o atraso de digitação.
    formBusca.addEventListener('submit', (evento) => {
        evento.preventDefault();
        clearTimeout(temporizadorDigitacao);
        buscarComFiltrosAtuais();
    });

    // Campos de texto: busca com atraso, pra não recarregar a cada tecla
    [campoBusca, filtroMarca, filtroModelo, filtroAno, filtroLocalizacao].forEach(campo => {
        campo.addEventListener('input', buscarComAtraso);
    });

    // Selects: aplicam o filtro assim que a pessoa escolhe uma opção
    [filtroCategoria, filtroCondicao, selectOrdenar].forEach(campo => {
        campo.addEventListener('change', buscarComFiltrosAtuais);
    });

    btnLimparFiltros.addEventListener('click', limparFiltros);

    aplicarFiltrosDaUrl();
    buscarComFiltrosAtuais();
});