export default class UIScene extends Phaser.Scene {
    constructor() { super({ key: 'UIScene', active: false }); }

    create() {
        this.hp    = 5;
        this.hpMax = 5;
        this.score = 0;
        this.fase  = 1;

        const G = this.scene.get('GameScene');

        // Evento de HP
        G.events.on('hpUpdate', (hp, max) => {
            this.hp    = hp;
            this.hpMax = max;
            this._desenharCoracoes();
        }, this);

        // Evento de pontuação
        G.events.on('scoreUpdate', (pts) => {
            this.score = pts;
            this.txtScore.setText('Pontos: ' + pts);
        }, this);

        // Evento de fase
        G.events.on('faseUpdate', (f) => {
            this.fase = f;
            this.txtFase.setText('Fase ' + f);
        }, this);

        // ── Layout ─────────────────────────────────────────────
        // Corações (HP)
        this.coracoes = [];
        this._criarCoracoes();

        // Pontuação
        this.txtScore = this.add.text(10, 40, 'Pontos: 0', {
            fontSize: '16px', fill: '#FFFFFF',
            stroke: '#000000', strokeThickness: 3,
        }).setScrollFactor(0).setDepth(20);

        // Fase
        this.txtFase = this.add.text(10, 62, 'Fase 1', {
            fontSize: '14px', fill: '#FFE066',
            stroke: '#000000', strokeThickness: 3,
        }).setScrollFactor(0).setDepth(20);

        // Controles (canto inferior direito)
        this.add.text(this.scale.width - 10, this.scale.height - 10,
            '← → Mover  ↑/W/Space Pular  X Atacar',
            { fontSize: '11px', fill: '#CCCCCC', stroke: '#000', strokeThickness: 2 }
        ).setOrigin(1, 1).setScrollFactor(0).setDepth(20);
    }

    _criarCoracoes() {
        for (let i = 0; i < this.hpMax; i++) {
            const img = this.add.image(14 + i * 26, 14, 'coracao')
                .setScrollFactor(0)
                .setDepth(20)
                .setScale(0.9);
            this.coracoes.push(img);
        }
    }

    _desenharCoracoes() {
        this.coracoes.forEach((img, i) => {
            img.setTexture(i < this.hp ? 'coracao' : 'coracao_vazio');
        });
    }

    atualizarHP(hp, max) {
        this.hp    = hp;
        this.hpMax = max;
        this._desenharCoracoes();
    }

    shutdown() {
        const G = this.scene.get('GameScene');
        if (G) {
            G.events.off('hpUpdate',    null, this);
            G.events.off('scoreUpdate', null, this);
            G.events.off('faseUpdate',  null, this);
        }
    }
}
