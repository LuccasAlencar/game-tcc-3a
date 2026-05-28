import { CAT_ENEMY, CAT_PLATFORM } from '../constants.js';

// Constantes de comportamento do inimigo
const HP_PADRAO    = 3;    // pontos de vida padrão de cada inimigo
const VEL_PATROL   = 1.8; // velocidade de patrulha em pixels por frame
const ALCANCE_ATAQ = 44;  // distância máxima em pixels para atacar o jogador
const DANO_PLAYER  = 1;   // dano causado ao jogador por cada ataque
const CD_ATAQUE    = 1200; // tempo mínimo entre ataques do inimigo em milissegundos

export default class Enemy extends Phaser.Physics.Matter.Sprite {
    constructor(scene, x, y, patrulhaMin, patrulhaMax) {
        // Cria o sprite com corpo físico Matter.js na posição (x, y)
        super(scene.matter.world, x, y, 'inimigo', null, {
            frictionAir: 0.05,   // resistência do ar — desacelera o inimigo ao parar
            friction:    0.5,    // atrito com o chão — impede deslizamento excessivo
            restitution: 0,      // sem quique ao colidir
            label:       'inimigo', // identificador para debug de física
        });

        scene.add.existing(this);              // adiciona o sprite à cena para renderização
        this.setFixedRotation();               // impede que o corpo físico gire (inimigo sempre ereto)
        this.setCollisionCategory(CAT_ENEMY);  // define a categoria de colisão do inimigo
        this.setCollidesWith([CAT_PLATFORM]);  // o inimigo só colide fisicamente com plataformas
        this.setDepth(4);                      // renderiza abaixo do jogador (depth 5) mas acima do chão (1-2)

        // ─── Estado do inimigo ─────────────────────────────────────────────────────────
        this.hp          = HP_PADRAO;    // vida atual
        this.hpMax       = HP_PADRAO;    // vida máxima (usada para calcular a barra de HP)
        this.vivo        = true;         // false quando morto (para parar update e evitar double-kill)
        this.direcao     = 1;            // direção atual de patrulha: 1 = direita, -1 = esquerda
        this.patrulhaMin = patrulhaMin;  // limite esquerdo do território de patrulha
        this.patrulhaMax = patrulhaMax;  // limite direito do território de patrulha
        this.cdAtaque    = 0;            // tempo restante até o próximo ataque em ms
        this.score       = 50;           // pontos concedidos ao jogador ao matar este inimigo

        // ─── Barra de HP visual (acima do inimigo) ────────────────────────────────────
        // Fundo escuro da barra (sempre exibe o tamanho máximo)
        this.barraFundo = scene.add.rectangle(x, y - 30, 32, 5, 0x440000).setDepth(10);
        // Preenchimento vermelho da barra (reduz conforme o HP diminui)
        this.barraHP    = scene.add.rectangle(x, y - 30, 32, 5, 0xFF2244).setDepth(11);
        this.barraFundo.setOrigin(0.5, 0.5); // centraliza a origem para posicionamento correto
        this.barraHP.setOrigin(0.5, 0.5);
    }

    // Chamado a cada frame pelo GameScene.update() com delta de tempo e referência ao jogador
    update(delta, player) {
        if (!this.vivo || !this.active) return; // interrompe se o inimigo está morto ou destruído

        // ─── Patrulha automática ───────────────────────────────────────────────────────
        this.setVelocityX(VEL_PATROL * this.direcao);     // move na direção atual
        if (this.x <= this.patrulhaMin) this.direcao = 1;  // chegou no limite esquerdo: vira para direita
        if (this.x >= this.patrulhaMax) this.direcao = -1; // chegou no limite direito: vira para esquerda
        this.setFlipX(this.direcao < 0);                   // espelha o sprite conforme a direção

        // ─── Ataque ao jogador próximo ─────────────────────────────────────────────────
        if (player && player.active) {
            const dist = Phaser.Math.Distance.Between(this.x, this.y, player.x, player.y);
            this.cdAtaque = Math.max(0, this.cdAtaque - delta); // decrementa o cooldown

            if (dist <= ALCANCE_ATAQ && this.cdAtaque <= 0) {
                player.levaDano(DANO_PLAYER, this.x); // aplica dano ao jogador com knockback
                this.cdAtaque = CD_ATAQUE;            // reinicia o cooldown de ataque
            }
        }

        // ─── Sincroniza a barra de HP com a posição do inimigo ────────────────────────
        const pct = this.hp / this.hpMax; // percentual de HP restante (0.0 a 1.0)
        this.barraFundo.setPosition(this.x, this.y - 30); // move o fundo junto com o inimigo
        // Move o preenchimento para a esquerda conforme o HP diminui (barra esvazia da direita)
        this.barraHP.setPosition(this.x - (32 * (1 - pct)) / 2, this.y - 30);
        this.barraHP.setDisplaySize(32 * pct, 5); // reduz a largura proporcionalmente ao HP
    }

    // Aplica dano ao inimigo com knockback e flash vermelho
    levaDano(qtd, dir) {
        if (!this.vivo) return; // ignora dano se já está morto

        this.hp -= qtd; // reduz o HP (sem mínimo — _morrer() checa hp <= 0)

        // Knockback: empurra o inimigo na direção do ataque e levemente para cima
        this.setVelocity(dir * 4, -4);

        // Flash vermelho por 120ms para indicar que foi atingido
        this.setTint(0xFF6666);
        this.scene.time.delayedCall(120, () => { if (this.vivo) this.clearTint(); });

        if (this.hp <= 0) this._morrer(); // inicia a sequência de morte se HP zerou
    }

    // Sequência de morte: partículas, pontuação, drop de power-up e remoção da cena
    _morrer() {
        this.vivo = false; // marca como morto para parar o update imediatamente

        // Cria um emissor de partículas que explode uma vez (18 partículas vermelhas)
        const ptk = this.scene.add.particles(this.x, this.y, 'particula', {
            speed:    { min: 60, max: 200 },
            lifespan: 500,
            scale:    { start: 1, end: 0 },
            tint:     0xFF2244, // vermelho
            emitting: false,    // não emite continuamente
        });
        ptk.explode(18); // dispara todas as partículas de uma vez
        this.scene.time.delayedCall(600, () => ptk.destroy()); // limpa após a animação

        // Adiciona a pontuação do inimigo ao jogador
        if (this.scene.jogador) {
            this.scene.jogador.pontuacao += this.score;                      // +50 pontos
            this.scene.events.emit('scoreUpdate', this.scene.jogador.pontuacao); // atualiza o HUD
        }

        // 30% de chance de dropar um power-up de cura no ponto de morte
        if (Math.random() < 0.3) {
            this.scene.criarPowerup(this.x, this.y - 16); // spawna acima do chão
        }

        // Remove os elementos visuais da barra de HP
        this.barraFundo.destroy();
        this.barraHP.destroy();

        this.destroy(); // destrói o sprite e o corpo físico do Matter.js
    }

    // Remove o inimigo e sua barra de HP com verificação de segurança (usado no shutdown)
    destruir() {
        if (this.barraFundo && this.barraFundo.scene) this.barraFundo.destroy();
        if (this.barraHP    && this.barraHP.scene)    this.barraHP.destroy();
        this.destroy(); // destrói o sprite
    }
}
