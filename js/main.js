import config from './config.js'; // importa a configuração completa do Phaser

// Lê o parâmetro 'fase' da query string da URL (ex: game.html?fase=3)
const params = new URLSearchParams(window.location.search);

// Salva a fase inicial como variável global para que o BootScene possa acessá-la
// Se nenhum parâmetro for passado, começa na fase 1 por padrão
window.FASE_INICIAL = parseInt(params.get('fase')) || 1;

// Instancia e inicia o jogo Phaser com a configuração definida em config.js
new Phaser.Game(config);
