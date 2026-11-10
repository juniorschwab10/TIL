        const inputImagens = document.getElementById('input-imagens');
        const wrapper = document.getElementById('previa-imagens-wrapper');
        const LIMITE_FOTOS = 3;

        // Essa lista é a "fonte da verdade" das fotos escolhidas.
        let arquivosSelecionados = [];

        // Sempre que a lista muda, esta função:
        // 1) reconstrói o input.files de verdade (senão o formulário
        //    envia só o que o navegador tem, não o que está na tela)
        // 2) redesenha as prévias com botão de remover em cada uma
        function atualizarSelecao() {
            // DataTransfer é o jeito de montar uma FileList "na mão" —
            // não dá pra simplesmente fazer input.files = [...array].
            const dt = new DataTransfer();
            arquivosSelecionados.forEach(arquivo => dt.items.add(arquivo));
            inputImagens.files = dt.files;

            wrapper.innerHTML = '';

            if (arquivosSelecionados.length === 0) {
                wrapper.hidden = true;
                return;
            }

            arquivosSelecionados.forEach(function (arquivo, indice) {
                const caixa = document.createElement('div');
                caixa.className = 'previa-item';

                const img = document.createElement('img');
                // createObjectURL cria um link temporário pro arquivo que
                // está no computador do usuário, só pra exibir na tela.
                img.src = URL.createObjectURL(arquivo);
                img.alt = 'Prévia da imagem selecionada';
                img.className = 'previa-item__imagem';

                const btnRemover = document.createElement('button');
                btnRemover.type = 'button'; // evita que isso submeta o formulário
                btnRemover.innerText = '✕';
                btnRemover.title = 'Remover esta foto';
                btnRemover.className = 'previa-item__remover';
                btnRemover.addEventListener('click', function () {
                    arquivosSelecionados.splice(indice, 1);
                    atualizarSelecao();
                });

                caixa.appendChild(img);
                caixa.appendChild(btnRemover);
                wrapper.appendChild(caixa);
            });

            wrapper.hidden = false;
        }

        inputImagens.addEventListener('change', function (evento) {
            const novosArquivos = Array.from(evento.target.files);
            const espacoLivre = LIMITE_FOTOS - arquivosSelecionados.length;

            if (novosArquivos.length > espacoLivre) {
                alert(
                    espacoLivre > 0
                        ? `Você já tem ${arquivosSelecionados.length} foto(s). Só cabem mais ${espacoLivre}.`
                        : 'Você já escolheu o máximo de 3 fotos. Remova alguma antes de adicionar outra.'
                );
            }

            // Adiciona só o que couber até o limite, ignora o resto.
            novosArquivos.slice(0, espacoLivre).forEach(function (arquivo) {
                arquivosSelecionados.push(arquivo);
            });

            atualizarSelecao();
        });
