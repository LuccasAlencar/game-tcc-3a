import { CAT_ENEMY, CAT_PLATFORM } from '../constants.js';

const HP_PADRAO     = 3;
const VEL_PATROL    = 1.8;
const ALCANCE_ATAQ  = 44;
const DANO_PLAYER   = 1;
const CD_ATAQUE     = 1200;

export default class Enemy extends Phaser.Physics.Matter.Sprite {
    constructor(scene, x, y, patrulhaMin, patrulhaMax) {
        super(scene.matter.world, x, y, 'inimigo', null, {
            frictionAir: 0.05,
            friction:    0.5,
            restitution: 0,
            label:       'inimigo',
        });

        scene.add.existing(this);
        this.setFixedRotation();
        this.setCollisionCategory(CAT_ENEMY);
        this.setCollidesWith([CAT_PLATFORM]);
        this.setDepth(4);

        this.hp           = HP_PADRAO;
        this.hpMax        = HP_PADRAO;
        this.vivo         = true;
        this.direcao      = 1;
        this.patrulhaMin  = patrulhaMin;
        this.patrulhaMax  = patrulhaMax;
        this.cdAtaque     = 0;
        this.score        = 50;

        // Barra de HP (acima do inimigo)
        this.barraFundo = scene.add.rectangle(x, y - 30, 32, 5, 0x440000).setDepth(10);
        this.barraHP    = scene.add.rectangle(x - 0, y - 30, 32, 5, 0xFF2244).setDepth(11);
        this.barraFundo.setOrigin(0.5, 0.5);
        this.barraHP.setOrigin(0.5, 0.5);
    }

    update(delta, player) {
        if (!this.vivo || !this.active) return;

        // Patrulha
        this.setVelocityX(VEL_PATROL * this.direcao);
        if (this.x <= this.patrulhaMin) this.direcao = 1;
        if (this.x >= this.patrulhaMax) this.direcao = -1;
        this.setFlipX(this.direcao < 0);

        // Ataque ao jogador próximo
        if (player && player.active) {
            const dist = Phaser.Math.Distance.Between(this.x, this.y, player.x, player.y);
            this.cdAtaque = Math.max(0, this.cdAtaque - delta);

            if (dist <= ALCANCE_ATAQ && this.cdAtaque <= 0) {
                player.levaDano(DANO_PLAYER, this.x);
                this.cdAtaque = CD_ATAQUE;
            }
        }

        // Atualizar barra de HP
        const pct = this.hp / this.hpMax;
        this.barraFundo.setPosition(this.x, this.y - 30);
        this.barraHP.setPosition(this.x - (32 * (1 - pct)) / 2, this.y - 30);
        this.barraHP.setDisplaySize(32 * pct, 5);
    }

    levaDano(qtd, dir) {
        if (!this.vivo) return;
        this.hp -= qtd;

        // Knockback
        this.setVelocity(dir * 4, -4);

        // Flash vermelho
        this.setTint(0xFF6666);
        this.scene.time.delayedCall(120, () => { if (this.vivo) this.clearTint(); });

        if (this.hp <= 0) this._morrer();
    }

    _morrer() {
        this.vivo = false;

        // Partículas de morte
        const ptk = this.scene.add.particles(this.x, this.y, 'particula', {
            speed:    { min: 60, max: 200 },
            lifespan: 500,
            scale:    { start: 1, end: 0 },
            tint:     0xFF2244,
            emitting: false,
        });
        ptk.explode(18);
        this.scene.time.delayedCall(600, () => ptk.destroy());

        // Pontuação
        if (this.scene.jogador) {
            this.scene.jogador.pontuacao += this.score;
            this.scene.events.emit('scoreUpdate', this.scene.jogador.pontuacao);
        }

        // Chance de drop de power-up (30%)
        if (Math.random() < 0.3) {
            this.scene.criarPowerup(this.x, this.y - 16);
        }

        this.barraFundo.destroy();
        this.barraHP.destroy();
        this.destroy();
    }

    destruir() {
        if (this.barraFundo && this.barraFundo.scene) this.barraFundo.destroy();
        if (this.barraHP    && this.barraHP.scene)    this.barraHP.destroy();
        this.destroy();
    }
}
