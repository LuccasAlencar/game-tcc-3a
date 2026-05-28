import { CAT_PLAYER, CAT_PLATFORM, INVINCIBLE_DURATION, VY_PULO, VEL_X } from '../constants.js';

// Constantes de combate do jogador
const ATAQUE_ALCANCE  = 75;   // alcance da espada em pixels (> 44px do inimigo = segurança)
const ATAQUE_DANO     = 1;    // dano por golpe de espada
const ATAQUE_COOLDOWN = 500;  // tempo mínimo entre ataques em milissegundos
const ATAQUE_INV_DUR  = 220;  // ms de invencibilidade ao iniciar o golpe (protege o jogador ao atacar)
const HP_MAX          = 5;    // pontos de vida máximos do jogador

export default class Player extends Phaser.Physics.Matter.Sprite {
    constructor(scene, x, y) {
        // Cria o sprite com corpo físico Matter.js na posição (x, y)
        super(scene.matter.world, x, y, 'player', null, {
            frictionAir: 0.04,     // resistência do ar — controla a desaceleração horizontal
            friction:    0.05,     // atrito com superfícies — mantém o jogador escorregando pouco
            restitution: 0,        // sem quique ao colidir com superfícies
            label:       'player', // identificador do corpo para debug e colisões
        });

        scene.add.existing(this);              // adiciona o sprite à cena para que seja renderizado
        this.setFixedRotation();               // impede que o corpo físico gire (personagem sempre ereto)
        this.setCollisionCategory(CAT_PLAYER); // define a categoria de colisão do jogador
        this.setCollidesWith([CAT_PLATFORM]);  // o jogador só colide fisicamente com plataformas
        this.setDepth(5);                      // renderiza acima de moedas (3), checkpoints (3) e inimigos (4)

        // ─── Estado do jogador ─────────────────────────────────────────────────────────
        this.hp            = HP_MAX; // vida atual
        this.hpMax         = HP_MAX; // vida máxima (usada pelo HUD para desenhar corações)
        this.pulosRestantes= 2;      // contador de pulos disponíveis (2 = pulo duplo)
        this.groundCount   = 0;      // número de superfícies sendo tocadas (0 = no ar)
        this.invincivel    = false;  // true durante o período de invencibilidade pós-dano
        this.tInv          = 0;      // tempo restante de invencibilidade pós-dano em ms
        this.tAtaque       = 0;      // timer de invencibilidade durante o swing da espada em ms
        this.cooldownAtaque= 0;      // tempo restante até poder atacar novamente em ms
        this.pontuacao     = 0;      // pontuação acumulada (moedas + inimigos)
        this.cpX           = x;      // posição X do último checkpoint ativado
        this.cpY           = y;      // posição Y do último checkpoint ativado

        // ─── Espada visual ─────────────────────────────────────────────────────────────
        // Sprite puro sem corpo físico — animar ele não afeta o Matter.js nem causa rotação
        this.espada = scene.add.image(x, y, 'espada')
            .setDepth(6)          // acima do jogador (depth 5)
            .setOrigin(0.2, 0.5)  // 20% da largura = meio do cabo → o arco gira naturalmente pela empunhadura
            .setVisible(false);   // escondida até o próximo ataque

        // ─── Mapeamento de teclas ──────────────────────────────────────────────────────
        this.cursors  = scene.input.keyboard.createCursorKeys(); // setas direcionais + shift + espaço
        this.wasd     = scene.input.keyboard.addKeys('W,A,S,D'); // teclas WASD como alternativa
        this.teclaX   = scene.input.keyboard.addKey('X');        // tecla X para atacar
        this.teclaEsp = scene.input.keyboard.addKey('SPACE');    // espaço como alternativa de pulo

        // ─── Detecção de chão via eventos de colisão Matter ───────────────────────────
        scene.matter.world.on('collisionstart', this._colisaoInicio, this);
        scene.matter.world.on('collisionend',   this._colisaoFim,    this);
    }

    // Retorna true se o jogador está tocando pelo menos uma superfície estática
    get noChao() { return this.groundCount > 0; }

    // Disparado quando o corpo do jogador inicia contato com outro corpo
    _colisaoInicio(event) {
        event.pairs.forEach(({ bodyA, bodyB }) => {
            if (bodyA !== this.body && bodyB !== this.body) return; // ignora colisões irrelevantes
            const outro = bodyA === this.body ? bodyB : bodyA;
            // Considera chão apenas superfícies estáticas tocadas com velocidade Y baixa
            if (outro.isStatic && this.body.velocity.y >= -0.5) {
                this.groundCount++;        // mais uma superfície em contato
                this.pulosRestantes = 2;   // reseta o pulo duplo ao tocar o chão
            }
        });
    }

    // Disparado quando o corpo do jogador encerra contato com outro corpo
    _colisaoFim(event) {
        event.pairs.forEach(({ bodyA, bodyB }) => {
            if (bodyA !== this.body && bodyB !== this.body) return;
            const outro = bodyA === this.body ? bodyB : bodyA;
            if (outro.isStatic) {
                this.groundCount = Math.max(0, this.groundCount - 1); // nunca fica negativo
            }
        });
    }

    // Chamado a cada frame pelo GameScene.update() com o delta de tempo em ms
    update(delta) {
        if (!this.active) return; // interrompe se o jogador foi desativado (morreu)

        const vel = this.body.velocity; // velocidade atual do corpo físico
        const c   = this.cursors;
        const w   = this.wasd;

        const esq = c.left.isDown  || w.A.isDown;
        const dir = c.right.isDown || w.D.isDown;

        // ─── Movimento horizontal com aceleração/desaceleração ─────────────────────────
        if (esq) {
            this.setVelocityX(Phaser.Math.Linear(vel.x, -VEL_X, 0.22));
            this.setFlipX(true);
        } else if (dir) {
            this.setVelocityX(Phaser.Math.Linear(vel.x, VEL_X, 0.22));
            this.setFlipX(false);
        } else {
            this.setVelocityX(Phaser.Math.Linear(vel.x, 0, 0.30));
        }

        // ─── Pulo ─────────────────────────────────────────────────────────────────────
        const pulo = Phaser.Input.Keyboard.JustDown(c.up) ||
                     Phaser.Input.Keyboard.JustDown(w.W)  ||
                     Phaser.Input.Keyboard.JustDown(this.teclaEsp);

        if (pulo && this.pulosRestantes > 0) {
            this.setVelocityY(VY_PULO);
            this.pulosRestantes--;
            this._explodirParticulas(0xCCEEFF, this.x, this.y + 20, 6);
            this._tocarSom('sfx_pulo');
        }

        // ─── Ataque ────────────────────────────────────────────────────────────────────
        this.cooldownAtaque = Math.max(0, this.cooldownAtaque - delta);

        if (Phaser.Input.Keyboard.JustDown(this.teclaX) && this.cooldownAtaque <= 0) {
            this._atacar();
        }

        // ─── Timers de invencibilidade ─────────────────────────────────────────────────
        // Invencibilidade pós-dano: pisca o sprite
        if (this.invincivel) {
            this.tInv -= delta;
            this.setAlpha(Math.floor(this.tInv / 80) % 2 === 0 ? 0.35 : 1);
            if (this.tInv <= 0) { this.invincivel = false; this.setAlpha(1); }
        }

        // Invencibilidade durante o swing da espada (sem piscar — invisível ao jogador)
        if (this.tAtaque > 0) this.tAtaque -= delta;

        // ─── Posição da espada segue o jogador durante a animação ─────────────────────
        if (this.espada && this.espada.visible) {
            const atkDir = this.flipX ? -1 : 1;
            // Origin fica na mão do jogador: 12px para o lado do ataque a partir do centro
            this.espada.setPosition(this.x + atkDir * 12, this.y - 8);
        }

        // ─── Morte por queda fora do mundo ─────────────────────────────────────────────
        if (this.y > this.scene.MUNDO_H + 120) {
            this._morrer(); // morte instantânea ao sair do mundo (ignora invencibilidade)
        }
    }

    // Executa o ataque de espada — anima apenas o sprite da espada, não o corpo físico
    _atacar() {
        this.cooldownAtaque = ATAQUE_COOLDOWN; // reinicia o cooldown de ataque
        this.tAtaque        = ATAQUE_INV_DUR;  // ativa imunidade breve durante o swing

        const dir = this.flipX ? -1 : 1; // 1 = ataca para a direita, -1 = para a esquerda
        const ex  = this.x + dir * 12;   // posição X inicial: origin (cabo) na mão do jogador
        const ey  = this.y - 8;           // posição Y: altura do torso/ombro

        // Posiciona e orienta a espada
        this.espada.setPosition(ex, ey);
        // setFlipX espelha a textura: sem flip → lâmina para a direita; com flip → lâmina para a esquerda
        this.espada.setFlipX(this.flipX);
        // Ângulo inicial sempre -30° (ponta acima do horizontal)
        // O flipX já cuida de espelhar a direção — não precisa negar o ângulo
        this.espada.setAngle(-30);
        this.espada.setAlpha(1);
        this.espada.setVisible(true);

        // Animação de golpe: arco de -30° (acima) → +28° (abaixo) = downward slash
        // Funciona igual para ambos os lados porque o flipX já espelhou a textura
        this.scene.tweens.add({
            targets:  this.espada,
            angle:    28,
            duration: 180,
            ease:     'Quad.easeOut',
            onComplete: () => {
                // Fade-out suave após o impacto
                this.scene.tweens.add({
                    targets:  this.espada,
                    alpha:    0,
                    duration: 100,
                    onComplete: () => {
                        this.espada.setVisible(false);
                        this.espada.setAngle(0); // reseta para o próximo ataque
                    },
                });
            },
        });

        // Partículas de impacto na ponta da lâmina
        this._explodirParticulas(0xFFEE88, this.x + dir * 52, this.y - 8, 6);
        this._tocarSom('sfx_ataque');

        // Verifica cada inimigo no alcance da espada
        (this.scene.inimigos || []).forEach(inimigo => {
            if (!inimigo.vivo) return;

            const dist  = Phaser.Math.Distance.Between(this.x, this.y, inimigo.x, inimigo.y);
            const certo = dir > 0 ? inimigo.x > this.x - 10 : inimigo.x < this.x + 10;

            if (dist <= ATAQUE_ALCANCE && certo) {
                inimigo.levaDano(ATAQUE_DANO, dir);
                this.pontuacao += 10;
                this.scene.events.emit('scoreUpdate', this.pontuacao);
            }
        });
    }

    // Aplica dano ao jogador — imune durante invencibilidade pós-dano E durante swing da espada
    levaDano(qtd, origemX) {
        if (this.invincivel || this.tAtaque > 0) return; // dois escudos de imunidade

        this.hp = Math.max(0, this.hp - qtd);
        this.invincivel = true;
        this.tInv       = INVINCIBLE_DURATION;

        const dir = this.x > origemX ? 1 : -1;
        this.setVelocity(dir * 5, -7); // knockback diagonal

        this.scene.cameras.main.shake(200, 0.012);
        this.scene.events.emit('hpUpdate', this.hp, this.hpMax);
        this._tocarSom('sfx_dano');

        if (this.hp <= 0) this._morrer();
    }

    // Recupera HP (usado por power-ups)
    curar(qtd) {
        this.hp = Math.min(this.hp + qtd, this.hpMax);
        this.scene.events.emit('hpUpdate', this.hp, this.hpMax);
    }

    // Sequência de morte: desativa o jogador, explode partículas e vai para game over
    _morrer() {
        if (!this.active) return;                    // guard contra chamadas duplas
        this.setActive(false).setVisible(false);
        if (this.espada) this.espada.setVisible(false); // esconde a espada junto com o jogador
        this._explodirParticulas(0xFF2222, this.x, this.y, 20);
        this._tocarSom('sfx_morte');
        this.scene.time.delayedCall(700, () => this.scene.gameOver(false));
    }

    // Salva a posição do checkpoint mais recente ativado pelo jogador
    salvarCheckpoint(x, y) { this.cpX = x; this.cpY = y; }

    // Remove os listeners de colisão, a espada e destrói o sprite com segurança
    destruir() {
        if (this.espada) this.espada.destroy(); // remove a espada da cena
        if (this.scene && this.scene.matter && this.scene.matter.world) {
            this.scene.matter.world.off('collisionstart', this._colisaoInicio, this);
            this.scene.matter.world.off('collisionend',   this._colisaoFim,    this);
        }
        this.destroy();
    }

    // Toca um som se o arquivo de áudio foi carregado com sucesso (fallback silencioso)
    _tocarSom(key) {
        if (this.scene.cache.audio.exists(key)) {
            this.scene.sound.play(key, { volume: 0.6 });
        }
    }

    // Cria um emissor de partículas que explode uma vez e se auto-destrói
    _explodirParticulas(cor, x, y, quantidade) {
        const particulas = this.scene.add.particles('particula', {
            x,
            y,
            tint:     cor,
            speed:    { min: 40, max: 130 },
            lifespan: 380,
            scale:    { start: 0.9, end: 0 },
            on:       false,
            quantity: quantidade,
        }).setDepth(6);

        if (typeof particulas.explode === 'function') {
            particulas.explode(quantidade, x, y);
        }

        this.scene.time.delayedCall(500, () => particulas.destroy());
    }
}
