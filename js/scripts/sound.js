// --- LÓGICA DO MENU DE SOM ---
const musica = document.getElementById('musica');
const btnMute = document.getElementById('btn-mute');
const sliderVolume = document.getElementById('volume');
const btnOpcoes = document.querySelector('.btn-imagem-opcoes');
const popupOpcoes = document.getElementById('popup-opcoes');
const btnFecharOpcoes = document.getElementById('btn-fechar-opcoes');
const overlayParaOpcoes = document.getElementById('overlay'); 

// Abre popup de Opções
btnOpcoes.addEventListener('click', () => {
    overlayParaOpcoes.classList.add('ativo');
    popupOpcoes.classList.add('ativo');
});

// Função para fechar Opções
function fecharPopupOpcoes() {
    overlayParaOpcoes.classList.remove('ativo');
    popupOpcoes.classList.remove('ativo');
}

// Fecha popup de Opções
btnFecharOpcoes.addEventListener('click', fecharPopupOpcoes);
overlayParaOpcoes.addEventListener('click', fecharPopupOpcoes);

// inicia música no primeiro clique
document.addEventListener('click', () => {
    if (musica.paused) musica.play();
}, { once: true });

// volume
sliderVolume.addEventListener('input', () => {
    musica.volume = sliderVolume.value;
    if (musica.muted) {
        musica.muted = false;
        atualizarBtnMute();
    }
});

// mute
btnMute.addEventListener('click', () => {
    musica.muted = !musica.muted;
    atualizarBtnMute();
});

function atualizarBtnMute() {
    btnMute.textContent = musica.muted ? '🔇 Mutado: Sim' : '🔊 Mutado: Não';
} 