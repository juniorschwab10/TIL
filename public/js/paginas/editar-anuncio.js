        // ID do anúncio vem da URL: /anuncios/:id/editar
        const partesUrl = window.location.pathname.split('/'); // ["", "anuncios", "12", "editar"]
        const anuncioId = partesUrl[2];

        const LIMITE_FOTOS = 3;
        let fotosExistentes = [];   // [{id, url}] — já salvas no banco
        let novosArquivos = [];     // File[] — escolhidos agora, ainda não enviados

        const wrapperExistentes = document.getElementById('fotos-existentes-wrapper');
        const wrapperNovas = document.getElementById('previa-novas-imagens-wrapper');
        const inputNovasImagens = document.getElementById('input-novas-imagens');
        const avisoLimite = document.getElementById('aviso-limite-fotos');

        function espacoLivre() {
            return LIMITE_FOTOS - fotosExistentes.length - novosArquivos.length;
        }

        function atualizarAvisoLimite() {
            const livre = espacoLivre();
            avisoLimite.innerText = livre > 0
                ? `Você pode adicionar mais ${livre} foto(s). Formatos aceitos: JPG, PNG, WEBP (cada uma até 5MB).`
                : 'Limite de 3 fotos atingido. Remova alguma antes de adicionar outra.';
            inputNovasImagens.disabled = livre <= 0;
        }

        // Redesenha as fotos JÁ SALVAS, cada uma com um botão "✕" que
        // chama a API na hora (DELETE) — diferente das novas, que só
        // são enviadas quando o formulário inteiro é salvo.
        function renderizarFotosExistentes() {
            wrapperExistentes.innerHTML = '';

            if (fotosExistentes.length === 0) {
                wrapperExistentes.hidden = true;
                atualizarAvisoLimite();
                return;
            }

            fotosExistentes.forEach(function (foto) {
                const caixa = document.createElement('div');
                caixa.className = 'previa-item';

                const img = document.createElement('img');
                img.src = foto.url;
                img.alt = 'Foto do anúncio';
                img.className = 'previa-item__imagem';

                const btnRemover = document.createElement('button');
                btnRemover.type = 'button';
                btnRemover.innerText = '✕';
                btnRemover.title = 'Remover esta foto';
                btnRemover.className = 'previa-item__remover';
                btnRemover.addEventListener('click', () => removerFotoExistente(foto.id));

                caixa.appendChild(img);
                caixa.appendChild(btnRemover);
                wrapperExistentes.appendChild(caixa);
            });

            wrapperExistentes.hidden = false;
            atualizarAvisoLimite();
        }

        // Foto já salva: remove na hora (não espera o "Salvar alterações"),
        // porque a exclusão de foto individual é uma ação independente.
        async function removerFotoExistente(imagemId) {
            if (!confirm('Remover esta foto do anúncio?')) return;

            try {
                const resposta = await fetch(`/api/anuncios/${anuncioId}/imagens/${imagemId}`, {
                    method: 'DELETE'
                });

                if (!resposta.ok) {
                    const erro = await resposta.json().catch(() => ({}));
                    alert(erro.erro || 'Erro ao remover a foto.');
                    return;
                }

                fotosExistentes = fotosExistentes.filter(f => f.id !== imagemId);
                renderizarFotosExistentes();
            } catch (erro) {
                console.error('Erro ao remover foto:', erro);
                alert('Erro ao remover a foto.');
            }
        }

        // Redesenha as NOVAS fotos escolhidas (ainda não enviadas) e
        // reconstrói o input.files a partir da lista própria — mesma
        // técnica usada em publicar-anuncio.html, pra não perder a
        // seleção anterior ao reabrir o seletor de arquivos.
        function atualizarNovasImagens() {
            const dt = new DataTransfer();
            novosArquivos.forEach(arquivo => dt.items.add(arquivo));
            inputNovasImagens.files = dt.files;

            wrapperNovas.innerHTML = '';

            if (novosArquivos.length === 0) {
                wrapperNovas.hidden = true;
                atualizarAvisoLimite();
                return;
            }

            novosArquivos.forEach(function (arquivo, indice) {
                const caixa = document.createElement('div');
                caixa.className = 'previa-item';

                const img = document.createElement('img');
                img.src = URL.createObjectURL(arquivo);
                img.alt = 'Prévia da nova foto';
                img.className = 'previa-item__imagem';

                const btnRemover = document.createElement('button');
                btnRemover.type = 'button';
                btnRemover.innerText = '✕';
                btnRemover.title = 'Remover esta foto';
                btnRemover.className = 'previa-item__remover';
                btnRemover.addEventListener('click', function () {
                    novosArquivos.splice(indice, 1);
                    atualizarNovasImagens();
                });

                caixa.appendChild(img);
                caixa.appendChild(btnRemover);
                wrapperNovas.appendChild(caixa);
            });

            wrapperNovas.hidden = false;
            atualizarAvisoLimite();
        }

        inputNovasImagens.addEventListener('change', function (evento) {
            const escolhidos = Array.from(evento.target.files);
            const livre = espacoLivre();

            if (escolhidos.length > livre) {
                alert(
                    livre > 0
                        ? `Só cabem mais ${livre} foto(s) nesse anúncio.`
                        : 'Limite de 3 fotos atingido. Remova alguma antes de adicionar outra.'
                );
            }

            escolhidos.slice(0, livre).forEach(arquivo => novosArquivos.push(arquivo));
            atualizarNovasImagens();
        });

        // Carrega os dados atuais do anúncio e pré-preenche o formulário
        async function carregarAnuncio() {
            try {
                const resposta = await fetch(`/api/anuncios/${anuncioId}/editar`);

                if (resposta.status === 403) {
                    alert('Você não tem permissão para editar este anúncio.');
                    window.location.href = '/meus-anuncios';
                    return;
                }

                if (!resposta.ok) {
                    alert('Anúncio não encontrado.');
                    window.location.href = '/meus-anuncios';
                    return;
                }

                const anuncio = await resposta.json();

                document.getElementById('campo-nome').value = anuncio.nome || '';
                document.getElementById('campo-categoria').value = anuncio.categoria || '';
                document.getElementById('campo-marca').value = anuncio.marca || '';
                document.getElementById('campo-modelo').value = anuncio.modelo || '';
                document.getElementById('campo-ano-inicial').value = anuncio.ano_inicial || '';
                document.getElementById('campo-ano-final').value = anuncio.ano_final || '';
                document.getElementById('campo-localizacao').value = anuncio.localizacao || '';
                document.getElementById('campo-descricao').value = anuncio.descricao || '';
                document.getElementById('campo-condicao').value = anuncio.condicao || 'Usada';
                document.getElementById('campo-preco').value = anuncio.preco || '';

                fotosExistentes = anuncio.imagens || [];
                renderizarFotosExistentes();

                document.getElementById('carregando-aviso').style.display = 'none';
            } catch (erro) {
                console.error('Erro ao carregar anúncio:', erro);
                alert('Erro ao carregar os dados do anúncio.');
            }
        }

        // Salva as alterações: texto + fotos novas (se houver), via PUT
        document.getElementById('form-editar-anuncio').addEventListener('submit', async function (evento) {
            evento.preventDefault();

            const formData = new FormData();
            formData.append('nome', document.getElementById('campo-nome').value);
            formData.append('categoria', document.getElementById('campo-categoria').value);
            formData.append('marca', document.getElementById('campo-marca').value);
            formData.append('modelo', document.getElementById('campo-modelo').value);
            formData.append('ano_inicial', document.getElementById('campo-ano-inicial').value);
            formData.append('ano_final', document.getElementById('campo-ano-final').value);
            formData.append('localizacao', document.getElementById('campo-localizacao').value);
            formData.append('descricao', document.getElementById('campo-descricao').value);
            formData.append('condicao', document.getElementById('campo-condicao').value);
            formData.append('preco', document.getElementById('campo-preco').value);

            novosArquivos.forEach(arquivo => formData.append('novasImagens', arquivo));

            try {
                const resposta = await fetch(`/api/anuncios/${anuncioId}`, {
                    method: 'PUT',
                    body: formData
                });

                if (!resposta.ok) {
                    const erro = await resposta.json().catch(() => ({}));
                    alert(erro.erro || 'Erro ao salvar as alterações.');
                    return;
                }

                window.location.href = '/meus-anuncios';
            } catch (erro) {
                console.error('Erro ao salvar anúncio:', erro);
                alert('Erro ao salvar as alterações.');
            }
        });

        carregarAnuncio();
