import BootScene    from './scenes/BootScene.js';
import GameScene    from './scenes/GameScene.js';
import UIScene      from './scenes/UIScene.js';
import GameOverScene from './scenes/GameOverScene.js';

export default {
    type:        Phaser.AUTO,
    width:       800,
    height:      450,
    parent:      'game-container',
    pixelArt:    true,
    roundPixels: true,
    physics: {
        default: 'matter',
        matter: {
            gravity: { y: 1.0 },
            debug:   false,
        },
    },
    scene: [BootScene, GameScene, UIScene, GameOverScene],
};
