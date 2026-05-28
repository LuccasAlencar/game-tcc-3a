// --- LÓGICA DO MENU DE INFORMAÇÕES ---
const btnInfo = document.querySelector('.btn-imagem-info');
const popupInfo = document.getElementById('popup-info');
const btnFecharInfo = document.getElementById('btn-fechar-info');
const overlayParaInfo = document.getElementById('overlay'); 

// Abre popup de Informações
btnInfo.addEventListener('click', () => {
    overlayParaInfo.classList.add('ativo');
    popupInfo.classList.add('ativo');
});

// Botão Iniciar abre o jogo
const btnIniciar = document.querySelector('.btn-imagem-iniciar');
if (btnIniciar) {
    btnIniciar.addEventListener('click', () => {
        window.location.href = 'game.html';
    });
}

// Função para fechar Informações
function fecharPopupInfo() {
    overlayParaInfo.classList.remove('ativo');
    popupInfo.classList.remove('ativo');
}

// Fecha popup de Informações
btnFecharInfo.addEventListener('click', fecharPopupInfo);
overlayParaInfo.addEventListener('click', fecharPopupInfo);