// Rodapé compartilhado: injetado no fim do <body> de todas as páginas.
document.addEventListener('DOMContentLoaded', () => {
    const ano = new Date().getFullYear();

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
                        <li><a href="/perfil.html">Meu perfil</a></li>
                    </ul>
                </div>

                <div class="rodape-col">
                    <h4>Institucional</h4>
                    <ul>
                        <li><a href="#">Sobre nós</a></li>
                        <li><a href="#">Termos de uso</a></li>
                        <li><a href="#">Política de privacidade</a></li>
                        <li><a href="#">Perguntas frequentes</a></li>
                    </ul>
                </div>

                <div class="rodape-col">
                    <h4>Contato</h4>
                    <ul class="rodape-contato">
                        <li>📞 <a href="tel:+5545999999999">(45) 99999-9999</a></li>
                        <li>💬 <a href="https://api.whatsapp.com/send?phone=5545999999999&text=Olá!%20Vim%20pelo%20site%20The%20Iron%20Legacy." target="_blank" rel="noopener">WhatsApp</a></li>
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
});