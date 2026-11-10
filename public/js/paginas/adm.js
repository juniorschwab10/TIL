        // Pede confirmação antes de excluir uma conta
        document.querySelectorAll('.form-excluir').forEach(function (formulario) {
            formulario.addEventListener('submit', function (evento) {
                const nome = formulario.dataset.nome;
                if (!confirm('Excluir o usuário "' + nome + '"? Essa ação não pode ser desfeita.')) {
                    evento.preventDefault();
                }
            });
        });

        // Filtra as linhas da tabela conforme o texto digitado na busca
        const campoBusca = document.getElementById('busca-usuario');
        const linhas = document.querySelectorAll('#corpo-tabela tr');

        campoBusca.addEventListener('input', function () {
            const termo = campoBusca.value.trim().toLowerCase();

            linhas.forEach(function (linha) {
                linha.style.display = linha.textContent.toLowerCase().includes(termo) ? '' : 'none';
            });
        });
