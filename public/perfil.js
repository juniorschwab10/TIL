document.addEventListener('DOMContentLoaded', async () => {
    const nomeHeader = document.getElementById('nome-perfil');
    const avatarHeader = document.getElementById('avatar-perfil');
    const inputNome = document.getElementById('input-nome');
    const inputEmail = document.getElementById('input-email');
    const inputTelefone = document.getElementById('input-telefone');
    const formPerfil = document.getElementById('form-perfil');

    try {
        // Busca os dados do usuário conectado na sessão
        const resposta = await fetch('/api/meu-perfil');

        if (resposta.status === 401 || resposta.redirected) {
            window.location.href = '/login';
            return;
        }

        const usuario = await resposta.json();

        // Gera as iniciais do nome para o avatar
        const iniciais = usuario.nome
            ? usuario.nome.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
            : 'US';

        // Atualiza a tela
        if (avatarHeader) avatarHeader.innerText = iniciais;
        if (nomeHeader) nomeHeader.innerText = usuario.nome;
        if (inputNome) inputNome.value = usuario.nome || '';
        if (inputEmail) inputEmail.value = usuario.email || '';
        if (inputTelefone) inputTelefone.value = usuario.telefone || '';

    } catch (erro) {
        console.error('Erro ao carregar dados do perfil:', erro);
    }

    // Salva as edições do formulário
    if (formPerfil) {
        formPerfil.addEventListener('submit', async (e) => {
            e.preventDefault();

            const dados = {
                nome: inputNome.value,
                email: inputEmail.value,
                telefone: inputTelefone.value
            };

            try {
                const resposta = await fetch('/api/meu-perfil', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(dados)
                });

                if (resposta.ok) {
                    alert('Perfil atualizado com sucesso!');
                    location.reload();
                } else {
                    alert('Erro ao atualizar perfil.');
                }
            } catch (erro) {
                console.error('Erro ao salvar alterações:', erro);
            }
        });
    }
});