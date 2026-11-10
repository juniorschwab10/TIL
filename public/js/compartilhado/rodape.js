// Rodapé compartilhado: injetado no fim do <body> de todas as páginas.
// Também acrescenta o link "Alertas" (com o contador de notificações não
// lidas) ao menu do topo das páginas da área logada.
document.addEventListener('DOMContentLoaded', () => {
    // Dados de contato vêm de contato.js (único lugar com o número)
    const CONTATO = window.CONTATO;
    const ano = new Date().getFullYear();

    // Os links institucionais apontam para as seções da página inicial
    // ("/" abre Pagina_1 ou Pagina_2, e as duas têm esses mesmos ids).
    // Usar "/#id" (e não só "#id") faz o link funcionar de qualquer página.
    const rodapeHTML = `
        <footer class="rodape-site">
            <div class="wrap rodape-grid">

                <div class="rodape-col rodape-sobre">
                    <a class="logo" href="/">THE IRON <span>LEGACY</span></a>
                    <p>
                        Plataforma para apaixonados por veículos clássicos encontrarem peças,
                        acompanharem seus veículos e negociarem com outros colecionadores.
                    </p>
                    <div class="rodape-redes">
                        <a href="https://instagram.com/" target="_blank" rel="noopener" aria-label="Instagram">Instagram</a>
                        <a href="https://facebook.com/" target="_blank" rel="noopener" aria-label="Facebook">Facebook</a>
                        <a href="https://youtube.com/" target="_blank" rel="noopener" aria-label="YouTube">YouTube</a>
                    </div>
                </div>

                <div class="rodape-col">
                    <h4>Navegação</h4>
                    <ul>
                        <li><a href="/">Início</a></li>
                        <li><a href="/anuncios.html">Peças</a></li>
                        <li><a href="/publicar-anuncio.html">Publicar anúncio</a></li>
                        <li><a href="/garagem">Minha garagem</a></li>
                        <li><a href="/alertas.html">Meus alertas</a></li>
                        <li><a href="/perfil.html">Meu perfil</a></li>
                    </ul>
                </div>

                <div class="rodape-col">
                    <h4>Institucional</h4>
                    <ul>
                        <li><a href="/#sobre-nos">Sobre nós</a></li>
                        <li><a href="/#termos-de-uso">Termos de uso</a></li>
                        <li><a href="/#politica-de-privacidade">Política de privacidade</a></li>
                        <li><a href="/#perguntas-frequentes">Perguntas frequentes</a></li>
                    </ul>
                </div>

                <div class="rodape-col">
                    <h4>Contato</h4>
                    <ul class="rodape-contato">
                        <li>📞 <a href="${CONTATO.telefoneLink()}">${CONTATO.telefoneExibicao}</a></li>
                        <li>💬 <a href="${CONTATO.whatsappLink()}" target="_blank" rel="noopener">WhatsApp</a></li>
                        <li>✉️ <a href="mailto:contato@theironlegacy.com.br">contato@theironlegacy.com.br</a></li>
                        <li>📍 Foz do Iguaçu, PR – Brasil</li>
                        <li>🕘 Seg a Sex, 8h às 18h</li>
                    </ul>
                </div>
            </div>

            <div class="rodape-base">
                <div class="wrap rodape-base-inner">
                    <span>&copy; ${ano} The Iron Legacy. Todos os direitos reservados.</span>
                    <span>Feito com ♥ por apaixonados por clássicos.</span>
                </div>
            </div>
        </footer>
    `;

    document.body.insertAdjacentHTML('beforeend', rodapeHTML);

    // Se a pessoa chegou por um link como /#perguntas-frequentes, o rodapé é
    // injetado depois do carregamento e o navegador pode não rolar até a seção.
    // Aqui forçamos a rolagem quando o alvo existir na página.
    if (window.location.hash) {
        const alvo = document.getElementById(window.location.hash.slice(1));
        if (alvo) alvo.scrollIntoView();
    }

    // ---- Link "Alertas" no menu do topo, com contador de não lidas ----
    // Não aparece no painel administrativo nem nas páginas sem menu
    // (início público, login e cadastro).
    const caminho = window.location.pathname;
    const ehAdmin = caminho.startsWith('/adm') || caminho.startsWith('/usuarios');
    const menu = document.querySelector('header nav');

    if (menu && !ehAdmin && !menu.querySelector('[data-alertas]')) {
        const link = document.createElement('a');
        link.href = '/alertas.html';
        link.dataset.alertas = 'true';
        link.textContent = 'Alertas';
        menu.appendChild(link);

        // Visitante sem login: a API redireciona pro login e o contador não aparece.
        fetch('/api/notificacoes/nao-lidas')
            .then(resposta => (resposta.ok && !resposta.redirected ? resposta.json() : null))
            .then(dados => {
                if (!dados || !(dados.total > 0)) return;

                const selo = document.createElement('span');
                selo.textContent = dados.total > 99 ? '99+' : String(dados.total);
                selo.setAttribute('aria-label', `${dados.total} notificações não lidas`);
                selo.className = 'selo-notificacao';
                link.appendChild(selo);
            })
            .catch(() => {});
    }
});
