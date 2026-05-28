// GameOverScene — exibida ao vencer ou perder. Mostra pontuação e botões de ação.
export default class GameOverScene extends Phaser.Scene {
    constructor() { super('GameOverScene'); }

    // Recebe os dados passados via scene.launch() pelo GameScene.gameOver()
    init(data) {
        this.venceu   = data.venceu   || false;    // true = vitória, false = derrota
        this.score    = data.score    || 0;        // pontuação final do jogador
        this.fase     = data.fase     || 1;        // fase que estava sendo jogada
        this.proxFase = data.proxFase || this.fase; // próxima fase a desbloquear
    }

    create() {
        const W = this.scale.width;  // largura do canvas (800px)
        const H = this.scale.height; // altura do canvas (450px)

        // Fundo semitransparente preto para escurecer o jogo ao fundo
        this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.72);

        // Exibe a tela correta dependendo do resultado
        if (this.venceu) {
            this._telaVitoria(W, H);   // título dourado + salva progresso no localStorage
        } else {
            this._telaGameOver(W, H);  // título vermelho de game over
        }

        // Pontuação final centralizada abaixo do título
        this.add.text(W / 2, H / 2 + 10, `Pontuação: ${this.score}`, {
            fontSize: '20px', fill: '#FFD700',
            stroke: '#000', strokeThickness: 4,
        }).setOrigin(0.5);

        // ─── Botões de ação ───────────────────────────────────────────────────────────

        // Botão "Reiniciar" — reinicia a mesma fase do zero
        this._botao(W / 2 - 90, H / 2 + 70, 'Reiniciar', () => {
            this.scene.stop('UIScene');       // para o HUD
            this.scene.stop('GameOverScene'); // para esta cena
            this.scene.start('GameScene', { fase: this.fase }); // reinicia a fase atual
        });

        // Botão "Próxima →" — só aparece ao vencer e se ainda há fases disponíveis
        if (this.venceu && this.proxFase <= 5) {
            this._botao(W / 2 + 90, H / 2 + 70, 'Próxima →', () => {
                this.scene.stop('UIScene');
                this.scene.stop('GameOverScene');
                this.scene.start('GameScene', { fase: this.proxFase }); // inicia a fase seguinte
            });
        }

        // Botão "Menu Principal" — volta para a página inicial do jogo
        this._botao(W / 2, H / 2 + 120, 'Menu Principal', () => {
            this.scene.stop('UIScene');
            this.scene.stop('GameScene');
            this.scene.stop('GameOverScene');
            window.location.href = 'index.html'; // navega para o menu HTML
        });
    }

    // Tela de vitória: título dourado e salva o progresso no localStorage
    _telaVitoria(W, H) {
        this.add.text(W / 2, H / 2 - 90, '🏆 VOCÊ VENCEU!', {
            fontSize: '36px', fill: '#FFD700',
            stroke: '#000', strokeThickness: 5,
        }).setOrigin(0.5);

        this.add.text(W / 2, H / 2 - 45, `Fase ${this.fase} concluída!`, {
            fontSize: '20px', fill: '#FFFFFF',
            stroke: '#000', strokeThickness: 3,
        }).setOrigin(0.5);

        // Salva a fase máxima desbloqueada se for maior que a registrada anteriormente
        const melhor = parseInt(localStorage.getItem('parkourFaseMax') || '0');
        if (this.proxFase > melhor) {
            localStorage.setItem('parkourFaseMax', String(this.proxFase));
        }

        // Salva a pontuação máxima global se o jogador bateu o recorde
        const melhorScore = parseInt(localStorage.getItem('parkourScore') || '0');
        if (this.score > melhorScore) {
            localStorage.setItem('parkourScore', String(this.score));
        }
    }

    // Tela de game over: título vermelho
    _telaGameOver(W, H) {
        this.add.text(W / 2, H / 2 - 90, 'GAME OVER', {
            fontSize: '40px', fill: '#FF3333',
            stroke: '#000', strokeThickness: 5,
        }).setOrigin(0.5);

        // Indica em qual fase o jogador morreu
        this.add.text(W / 2, H / 2 - 45, `Fase ${this.fase}`, {
            fontSize: '18px', fill: '#CCCCCC',
            stroke: '#000', strokeThickness: 3,
        }).setOrigin(0.5);
    }

    // Cria um botão de texto interativo com hover colorido
    _botao(x, y, label, cb) {
        const btn = this.add.text(x, y, label, {
            fontSize:        '18px',
            fill:            '#FFFFFF',
            backgroundColor: '#333366',          // fundo azul escuro padrão
            padding:         { x: 14, y: 8 },
            stroke:          '#000',
            strokeThickness: 2,
        }).setOrigin(0.5).setInteractive({ useHandCursor: true }); // mão ao passar o mouse

        btn.on('pointerover',  () => btn.setStyle({ backgroundColor: '#5555AA' })); // ilumina no hover
        btn.on('pointerout',   () => btn.setStyle({ backgroundColor: '#333366' })); // volta ao padrão
        btn.on('pointerdown',  cb); // executa o callback ao clicar
    }
}
