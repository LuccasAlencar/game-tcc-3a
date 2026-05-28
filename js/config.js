import BootScene     from './scenes/BootScene.js';    // cena de carregamento e geração de texturas
import GameScene     from './scenes/GameScene.js';    // cena principal com a lógica do jogo
import UIScene       from './scenes/UIScene.js';      // cena do HUD (corações, pontuação)
import GameOverScene from './scenes/GameOverScene.js'; // cena de vitória ou game over

// Objeto de configuração exportado para o new Phaser.Game() em main.js
export default {
    type:        Phaser.AUTO,       // tenta WebGL; cai para Canvas 2D se não suportado
    width:       800,               // largura do canvas em pixels
    height:      450,               // altura do canvas em pixels (proporção 16:9)
    parent:      'game-container',  // ID do elemento HTML que hospeda o canvas
    pixelArt:    true,              // desativa antialiasing — garante visual nítido para pixel art
    roundPixels: true,              // arredonda posições para pixels inteiros — evita blur em subpixel
    physics: {
        default: 'matter',          // usa o motor de física Matter.js (embutido no Phaser 3)
        matter: {
            gravity: { y: 1.0 },   // gravidade descendente (valores maiores = queda mais rápida)
            debug:   false,         // false em produção; true mostra hitboxes para debug de física
        },
    },
    scene: [BootScene, GameScene, UIScene, GameOverScene], // ordem de registro das cenas
};
