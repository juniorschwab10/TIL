// Funções de apoio compartilhadas pelas páginas.
// Carregue este arquivo ANTES dos outros scripts da página.

// Troca os caracteres especiais do HTML por versões inofensivas.
// Use sempre que for colocar texto que veio do banco (nome, descrição,
// marca, vendedor...) dentro de um innerHTML. Sem isso, alguém que
// publique um anúncio com <img src=x onerror=...> no nome executaria
// esse código no navegador de todo mundo que abrisse a página.
function escapeHtml(valor) {
    return String(valor ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}