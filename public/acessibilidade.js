// Script do Painel de Acessibilidade
document.addEventListener('DOMContentLoaded', () => {
    // Injeta o HTML do Painel de Acessibilidade dinamicamente
    const painelHTML = `
        <div id="painel-acessibilidade" class="painel-acessibilidade">
            <button id="btn-acessibilidade" class="btn-acessibilidade" aria-label="Abrir Painel de Acessibilidade">♿</button>
            <div id="menu-acessibilidade" class="menu-acessibilidade oculto">
                <h4>Acessibilidade</h4>
                <button id="btn-aumentar-fonte">A+ Aumentar Fonte</button>
                <button id="btn-diminuir-fonte">A- Diminuir Fonte</button>
                <button id="btn-resetar-fonte">A Resetar</button>
                <button id="btn-contraste">🌓 Alto Contraste</button>
                <button id="btn-ler-texto">🔊 Ler Seleção</button>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', painelHTML);

    // Seleção de Elementos
    const btnAcessibilidade = document.getElementById('btn-acessibilidade');
    const menuAcessibilidade = document.getElementById('menu-acessibilidade');
    let tamanhoFonte = 100;

    // Toggle do Menu
    btnAcessibilidade.addEventListener('click', () => {
        menuAcessibilidade.classList.toggle('oculto');
    });

    // Aumentar/Diminuir Fonte
    document.getElementById('btn-aumentar-fonte').addEventListener('click', () => {
        if (tamanhoFonte < 140) {
            tamanhoFonte += 10;
            document.documentElement.style.fontSize = `${tamanhoFonte}%`;
        }
    });

    document.getElementById('btn-diminuir-fonte').addEventListener('click', () => {
        if (tamanhoFonte > 80) {
            tamanhoFonte -= 10;
            document.documentElement.style.fontSize = `${tamanhoFonte}%`;
        }
    });

    document.getElementById('btn-resetar-fonte').addEventListener('click', () => {
        tamanhoFonte = 100;
        document.documentElement.style.fontSize = '100%';
    });

    // Alto Contraste
    document.getElementById('btn-contraste').addEventListener('click', () => {
        document.body.classList.toggle('alto-contraste');
    });

    // Leitor de Voz para texto selecionado
    document.getElementById('btn-ler-texto').addEventListener('click', () => {
        const textoSelecionado = window.getSelection().toString();
        if (textoSelecionado) {
            const utterance = new SpeechSynthesisUtterance(textoSelecionado);
            utterance.lang = 'pt-BR';
            window.speechSynthesis.speak(utterance);
        } else {
            alert('Selecione um texto na página para ouvir a leitura.');
        }
    });
});