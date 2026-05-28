import { CAT_PLAYER, CAT_PLATFORM, INVINCIBLE_DURATION, VY_PULO, VEL_X } from '../constants.js';

const ATAQUE_ALCANCE  = 65;
const ATAQUE_DANO     = 1;
const ATAQUE_COOLDOWN = 500;
const HP_MAX          = 5;

export default class Player extends Phaser.Physics.Matter.Sprite {
    constructor(scene, x, y) {
        super(scene.matter.world, x, y, 'player', null, {
            frictionAir: 0.04,
            friction:    0.05,
            restitution: 0,
            label:       'player',
        });

        scene.add.existing(this);
        this.setFixedRotation();
        this.setCollisionCategory(CAT_PLAYER);
        this.setCollidesWith([CAT_PLATFORM]);
        this.setDepth(5);

        // Estado
        this.hp            = HP_MAX;
        this.hpMax         = HP_MAX;
        this.pulosRestantes= 2;
        this.groundCount   = 0;
        this.invincivel    = false;
        this.tInv          = 0;
        this.cooldownAtaque= 0;
        this.pontuacao     = 0;
        this.cpX           = x;
        this.cpY           = y;

        // Controles
        this.cursors  = scene.input.keyboard.createCursorKeys();
        this.wasd     = scene.input.keyboard.addKeys('W,A,S,D');
        this.teclaX   = scene.input.keyboard.addKey('X');
        this.teclaEsp = scene.input.keyboard.addKey('SPACE');

        // Detecção de chão via colisão
        scene.matter.world.on('collisionstart', this._colisaoInicio, this);
        scene.matter.world.on('collisionend',   this._colisaoFim,    this);
    }

    get noChao() { return this.groundCount > 0; }

    _colisaoInicio(event) {
        event.pairs.forEach(({ bodyA, bodyB }) => {
            if (bodyA !== this.body && bodyB !== this.body) return;
            const outro = bodyA === this.body ? bodyB : bodyA;
            if (outro.isStatic && this.body.velocity.y >= -0.5) {
                this.groundCount++;
                this.pulosRestantes = 2;
            }
        });
    }

    _colisaoFim(event) {
        event.pairs.forEach(({ bodyA, bodyB }) => {
            if (bodyA !== this.body && bodyB !== this.body) return;
            const outro = bodyA === this.body ? bodyB : bodyA;
            if (outro.isStatic) {
                this.groundCount = Math.max(0, this.groundCount - 1);
            }
        });
    }

    update(delta) {
        if (!this.active) return;
        const vel = this.body.velocity;
        const c = this.cursors;
        const w = this.wasd;

        const esq = c.left.isDown  || w.A.isDown;
        const dir = c.right.isDown || w.D.isDown;

        // Horizontal com aceleração/desaceleração
        if (esq) {
            this.setVelocityX(Phaser.Math.Linear(vel.x, -VEL_X, 0.22));
            this.setFlipX(true);
        } else if (dir) {
            this.setVelocityX(Phaser.Math.Linear(vel.x, VEL_X, 0.22));
            this.setFlipX(false);
        } else {
            this.setVelocityX(Phaser.Math.Linear(vel.x, 0, 0.30));
        }

        // Pulo (cursor up / W / Space)
        const pulo = Phaser.Input.Keyboard.JustDown(c.up) ||
                     Phaser.Input.Keyboard.JustDown(w.W)  ||
                     Phaser.Input.Keyboard.JustDown(this.teclaEsp);

        if (pulo && this.pulosRestantes > 0) {
            this.setVelocityY(VY_PULO);
            this.pulosRestantes--;
            this._explodirParticulas(0xCCEEFF, this.x, this.y + 20, 6);
        }

        // Ataque (tecla X)
        this.cooldownAtaque = Math.max(0, this.cooldownAtaque - delta);
        if (Phaser.Input.Keyboard.JustDown(this.teclaX) && this.cooldownAtaque <= 0) {
            this._atacar();
        }

        // Invencibilidade pós-dano
        if (this.invincivel) {
            this.tInv -= delta;
            this.setAlpha(Math.floor(this.tInv / 80) % 2 === 0 ? 0.35 : 1);
            if (this.tInv <= 0) { this.invincivel = false; this.setAlpha(1); }
        }

        // Morte por queda fora do mundo
        if (this.y > this.scene.MUNDO_H + 120) {
            this.levaDano(1, this.x);
        }
    }

    _atacar() {
        this.cooldownAtaque = ATAQUE_COOLDOWN;
        const dir = this.flipX ? -1 : 1;

        this.scene.tweens.add({
            targets:  this,
            scaleX:   1.15,
            scaleY:   0.9,
            duration: 80,
            yoyo:     true,
            ease:     'Quad.easeOut',
        });

        this._explodirParticulas(0xFFDD00, this.x + dir * 36, this.y - 4, 12);

        (this.scene.inimigos || []).forEach(inimigo => {
            if (!inimigo.vivo) return;
            const dist   = Phaser.Math.Distance.Between(this.x, this.y, inimigo.x, inimigo.y);
            const certo  = dir > 0 ? inimigo.x > this.x - 10 : inimigo.x < this.x + 10;
            if (dist <= ATAQUE_ALCANCE && certo) {
                inimigo.levaDano(ATAQUE_DANO, dir);
                this.pontuacao += 10;
                this.scene.events.emit('scoreUpdate', this.pontuacao);
            }
        });
    }

    levaDano(qtd, origemX) {
        if (this.invincivel) return;
        this.hp = Math.max(0, this.hp - qtd);
        this.invincivel = true;
        this.tInv       = INVINCIBLE_DURATION;

        const dir = this.x > origemX ? 1 : -1;
        this.setVelocity(dir * 5, -7);

        this.scene.cameras.main.shake(200, 0.012);
        this.scene.events.emit('hpUpdate', this.hp, this.hpMax);

        if (this.hp <= 0) this._morrer();
    }

    curar(qtd) {
        this.hp = Math.min(this.hp + qtd, this.hpMax);
        this.scene.events.emit('hpUpdate', this.hp, this.hpMax);
    }

    _morrer() {
        this.setActive(false).setVisible(false);
        this._explodirParticulas(0xFF2222, this.x, this.y, 20);
        this.scene.time.delayedCall(700, () => this.scene.gameOver(false));
    }

    salvarCheckpoint(x, y) { this.cpX = x; this.cpY = y; }

    destruir() {
        if (this.scene && this.scene.matter && this.scene.matter.world) {
            this.scene.matter.world.off('collisionstart', this._colisaoInicio, this);
            this.scene.matter.world.off('collisionend',   this._colisaoFim,    this);
        }
        this.destroy();
    }

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
