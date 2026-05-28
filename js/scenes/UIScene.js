// UIScene — HUD do jogo (corações, pontuação, número da fase, controles)
// Roda em paralelo com GameScene via scene.launch(); não segue a câmera principal.
export default class UIScene extends Phaser.Scene {
    constructor() { super({ key: 'UIScene', active: false }); } // começa inativa — GameScene a lança

    create() {
        // Estado inicial do HUD (será atualizado pelos eventos do GameScene)
        this.hp    = 5; // vida atual exibida pelos corações
        this.hpMax = 5; // vida máxima (define quantos corações existem)
        this.score = 0; // pontuação atual
        this.fase  = 1; // número da fase atual

        const G = this.scene.get('GameScene'); // referência à cena principal para ouvir seus eventos

        // ─── Inscrição nos eventos emitidos pelo GameScene ────────────────────────────
        // Atualiza os corações toda vez que o HP do jogador muda
        G.events.on('hpUpdate', (hp, max) => {
            this.hp    = hp;
            this.hpMax = max;
            this._desenharCoracoes(); // redesenha os corações com o novo valor
        }, this);

        // Atualiza o texto de pontuação toda vez que o jogador ganha pontos
        G.events.on('scoreUpdate', (pts) => {
            this.score = pts;
            this.txtScore.setText('Pontos: ' + pts); // atualiza o texto diretamente
        }, this);

        // Atualiza o número da fase exibido no HUD
        G.events.on('faseUpdate', (f) => {
            this.fase = f;
            this.txtFase.setText('Fase ' + f);
        }, this);

        // ─── Criação dos elementos visuais do HUD ─────────────────────────────────────
        this.coracoes = []; // array de sprites de coração (cheio ou vazio)
        this._criarCoracoes(); // cria os sprites de acordo com hpMax

        // Texto de pontuação (canto superior esquerdo, abaixo dos corações)
        this.txtScore = this.add.text(10, 40, 'Pontos: 0', {
            fontSize: '16px', fill: '#FFFFFF',
            stroke: '#000000', strokeThickness: 3,
        }).setScrollFactor(0).setDepth(20); // scrollFactor 0 = fixo na tela (não segue câmera)

        // Texto do número da fase (abaixo da pontuação)
        this.txtFase = this.add.text(10, 62, 'Fase 1', {
            fontSize: '14px', fill: '#FFE066', // amarelo para destacar
            stroke: '#000000', strokeThickness: 3,
        }).setScrollFactor(0).setDepth(20);

        // Dica de controles no canto inferior direito da tela
        this.add.text(this.scale.width - 10, this.scale.height - 10,
            '← → Mover  ↑/W/Space Pular  X Espada',
            { fontSize: '11px', fill: '#CCCCCC', stroke: '#000', strokeThickness: 2 }
        ).setOrigin(1, 1).setScrollFactor(0).setDepth(20); // alinha pelo canto inferior direito
    }

    // Cria os sprites de coração alinhados horizontalmente no canto superior esquerdo
    _criarCoracoes() {
        for (let i = 0; i < this.hpMax; i++) {
            const img = this.add.image(14 + i * 26, 14, 'coracao') // espaçamento de 26px entre corações
                .setScrollFactor(0) // fixo na tela
                .setDepth(20)       // na frente dos elementos do jogo
                .setScale(0.9);     // ligeiramente menor que o tamanho original da textura
            this.coracoes.push(img); // adiciona ao array para atualização posterior
        }
    }

    // Atualiza a textura de cada coração conforme o HP atual
    _desenharCoracoes() {
        this.coracoes.forEach((img, i) => {
            // Corações com índice menor que hp = cheios; demais = vazios
            img.setTexture(i < this.hp ? 'coracao' : 'coracao_vazio');
        });
    }

    // Método público que pode ser chamado diretamente (alternativa aos eventos)
    atualizarHP(hp, max) {
        this.hp    = hp;
        this.hpMax = max;
        this._desenharCoracoes();
    }

    // Chamado automaticamente pelo Phaser quando a cena é parada (scene.stop)
    shutdown() {
        const G = this.scene.get('GameScene');
        if (G) {
            // Remove todos os listeners para evitar vazamento de memória ao reiniciar
            G.events.off('hpUpdate',    null, this);
            G.events.off('scoreUpdate', null, this);
            G.events.off('faseUpdate',  null, this);
        }
    }
}
