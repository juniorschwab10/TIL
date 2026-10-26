// ÚNICO lugar onde ficam os dados de contato do site.
// Para trocar o número do WhatsApp/telefone, mude só aqui.
// Carregue este arquivo ANTES do rodape.js em todas as páginas.
window.CONTATO = {
    // Só dígitos, com código do país (55) + DDD + número
    whatsapp: '5545998527860',
    // Como o telefone aparece escrito na tela
    telefoneExibicao: '(45) 99852-7860',
    mensagemPadrao: 'Olá! Vim pelo site The Iron Legacy.',

    // Link "tel:" para ligar direto do celular
    telefoneLink() {
        return `tel:+${this.whatsapp}`;
    },

    // Link do WhatsApp com a mensagem inicial já preenchida
    whatsappLink() {
        return `https://api.whatsapp.com/send?phone=${this.whatsapp}&text=${encodeURIComponent(this.mensagemPadrao)}`;
    }
};

// Todo elemento com o atributo data-whatsapp (ex.: o botão flutuante)
// recebe o link do WhatsApp automaticamente.
document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('[data-whatsapp]').forEach((el) => {
        el.href = window.CONTATO.whatsappLink();
    });
});
