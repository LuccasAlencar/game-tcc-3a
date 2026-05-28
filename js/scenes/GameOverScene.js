export default class GameOverScene extends Phaser.Scene {
    constructor() { super('GameOverScene'); }

    init(data) {
        this.venceu  = data.venceu  || false;
        this.score   = data.score   || 0;
        this.fase    = data.fase    || 1;
        this.proxFase= data.proxFase|| this.fase;
    }

    create() {
        const W = this.scale.width;
        const H = this.scale.height;

        // Fundo semitransparente
        this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.72);

        if (this.venceu) {
            this._telaVitoria(W, H);
        } else {
            this._telaGameOver(W, H);
        }

        // Score
        this.add.text(W / 2, H / 2 + 10, `Pontuação: ${this.score}`, {
            fontSize: '20px', fill: '#FFD700',
            stroke: '#000', strokeThickness: 4,
        }).setOrigin(0.5);

        // Botões
        this._botao(W / 2 - 90, H / 2 + 70, 'Reiniciar', () => {
            this.scene.stop('UIScene');
            this.scene.stop('GameOverScene');
            this.scene.start('GameScene', { fase: this.fase });
        });

        if (this.venceu && this.proxFase <= 5) {
            this._botao(W / 2 + 90, H / 2 + 70, 'Próxima →', () => {
                this.scene.stop('UIScene');
                this.scene.stop('GameOverScene');
                this.scene.start('GameScene', { fase: this.proxFase });
            });
        }

        this._botao(W / 2, H / 2 + 120, 'Menu Principal', () => {
            this.scene.stop('UIScene');
            this.scene.stop('GameScene');
            this.scene.stop('GameOverScene');
            window.location.href = 'index.html';
        });
    }

    _telaVitoria(W, H) {
        this.add.text(W / 2, H / 2 - 90, '🏆 VOCÊ VENCEU!', {
            fontSize: '36px', fill: '#FFD700',
            stroke: '#000', strokeThickness: 5,
        }).setOrigin(0.5);

        this.add.text(W / 2, H / 2 - 45, `Fase ${this.fase} concluída!`, {
            fontSize: '20px', fill: '#FFFFFF',
            stroke: '#000', strokeThickness: 3,
        }).setOrigin(0.5);

        // Salvar progresso
        const melhor = parseInt(localStorage.getItem('parkourFaseMax') || '0');
        if (this.proxFase > melhor) {
            localStorage.setItem('parkourFaseMax', String(this.proxFase));
        }
        const melhorScore = parseInt(localStorage.getItem('parkourScore') || '0');
        if (this.score > melhorScore) {
            localStorage.setItem('parkourScore', String(this.score));
        }
    }

    _telaGameOver(W, H) {
        this.add.text(W / 2, H / 2 - 90, 'GAME OVER', {
            fontSize: '40px', fill: '#FF3333',
            stroke: '#000', strokeThickness: 5,
        }).setOrigin(0.5);

        this.add.text(W / 2, H / 2 - 45, `Fase ${this.fase}`, {
            fontSize: '18px', fill: '#CCCCCC',
            stroke: '#000', strokeThickness: 3,
        }).setOrigin(0.5);
    }

    _botao(x, y, label, cb) {
        const btn = this.add.text(x, y, label, {
            fontSize:         '18px',
            fill:             '#FFFFFF',
            backgroundColor:  '#333366',
            padding:          { x: 14, y: 8 },
            stroke:           '#000',
            strokeThickness:  2,
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });

        btn.on('pointerover',  () => btn.setStyle({ backgroundColor: '#5555AA' }));
        btn.on('pointerout',   () => btn.setStyle({ backgroundColor: '#333366' }));
        btn.on('pointerdown',  cb);
    }
}
