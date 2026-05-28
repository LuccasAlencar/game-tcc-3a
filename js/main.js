import config from './config.js';

const params = new URLSearchParams(window.location.search);
window.FASE_INICIAL = parseInt(params.get('fase')) || 1;

new Phaser.Game(config);
