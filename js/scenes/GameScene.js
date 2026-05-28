import { CAT_PLATFORM, TILE, MUNDO_H, GROUND_TOP, GRAVITY_Y } from '../constants.js';
import FASES  from '../fases.js';
import Player from '../entities/Player.js';
import Enemy  from '../entities/Enemy.js';

const GT = GROUND_TOP; // 536

export default class GameScene extends Phaser.Scene {
    constructor() { super('GameScene'); }

    // ─── Ciclo de vida ────────────────────────────────────────────

    init(data) {
        this.faseNum  = data.fase || window.FASE_INICIAL || 1;
        this.MUNDO_H  = MUNDO_H;
    }

    create() {
        const fase = FASES[this.faseNum];
        if (!fase) { this.faseNum = 1; return this.create(); }

        this.faseDados = fase;
        this.inimigos  = [];
        this.moedas    = [];
        this.powerups  = [];

        // Configurar física
        this.matter.world.setGravity(0, GRAVITY_Y);

        // Elementos do mundo
        this._criarFundo();
        this._criarChao();
        this._criarPlataformas();
        this._criarPlataformasMoveis();
        this._criarHazards();
        this._criarMoedas();
        this._criarCheckpoints();
        this._criarMeta();

        // Jogador (spawna acima do chão)
        const spawnX = 120;
        const spawnY = GT - 28;
        this.jogador = new Player(this, spawnX, spawnY);

        this._criarInimigos();
        this._configurarCamera();

        // Limites invisíveis do mundo
        this._criarLimitesMundo();

        // Iniciar HUD
        this.scene.launch('UIScene');
        this.events.emit('faseUpdate', this.faseNum);
        this.events.emit('hpUpdate', this.jogador.hp, this.jogador.hpMax);

        // Tiltle breve na tela
        this._mostrarTitulo(fase.titulo);
    }

    update(_, delta) {
        if (!this.jogador || !this.jogador.active) return;

        this.jogador.update(delta);
        this.inimigos.forEach(e => e.update(delta, this.jogador));

        this._verificarMoedas();
        this._verificarHazards();
        this._verificarCheckpoints();
        this._verificarMeta();
        this._verificarPowerups();
        this._atualizarParalax();
    }

    // ─── Fim / vitória ────────────────────────────────────────────

    gameOver(venceu) {
        this.scene.pause('GameScene');
        const proxFase = this.faseNum + 1;

        this.scene.launch('GameOverScene', {
            venceu,
            score:    this.jogador ? this.jogador.pontuacao : 0,
            fase:     this.faseNum,
            proxFase,
        });
    }

    // ─── Criação do mundo ─────────────────────────────────────────

    _criarFundo() {
        const { mundoW, tema, bgColor } = this.faseDados;

        // Cor de fundo do mundo
        this.cameras.main.setBackgroundColor(
            '#' + bgColor.toString(16).padStart(6, '0')
        );

        // Camadas de parallax (1 imagem de fundo + 1 camada mais próxima)
        const bgKey = `bg_${tema}`;
        this.bgCamada1 = this.add.tileSprite(0, 0, mundoW, MUNDO_H, bgKey)
            .setOrigin(0, 0).setScrollFactor(0).setDepth(-10).setAlpha(1);
        this.bgCamada2 = this.add.tileSprite(0, 0, mundoW, MUNDO_H, bgKey)
            .setOrigin(0, 0).setScrollFactor(0.3).setDepth(-9).setAlpha(0.5);
    }

    _atualizarParalax() {
        if (this.bgCamada1) {
            this.bgCamada1.tilePositionX = this.cameras.main.scrollX * 0.05;
        }
        if (this.bgCamada2) {
            this.bgCamada2.tilePositionX = this.cameras.main.scrollX * 0.2;
        }
    }

    _criarChao() {
        const { chao, tema, mundoW } = this.faseDados;
        const tileKey = `chao_${tema}`;
        const h       = TILE * 3; // 3 tiles de espessura

        chao.forEach(([x0, x1]) => {
            const w   = x1 - x0;
            const cx  = x0 + w / 2;
            const cy  = GT + h / 2;  // centro do bloco de chão

            // Visual
            this.add.tileSprite(cx, cy, w, h, tileKey).setDepth(1);

            // Corpo físico
            this.matter.add.rectangle(cx, cy, w, h, {
                isStatic: true,
                label:    'ground',
                friction: 0.5,
                collisionFilter: {
                    category: CAT_PLATFORM,
                    mask:     0xFFFF,
                },
            });
        });

        // Borda invisível esquerda
        this.matter.add.rectangle(-16, MUNDO_H / 2, 32, MUNDO_H, {
            isStatic: true, label: 'parede',
            collisionFilter: { category: CAT_PLATFORM, mask: 0xFFFF },
        });
        // Borda direita
        this.matter.add.rectangle(mundoW + 16, MUNDO_H / 2, 32, MUNDO_H, {
            isStatic: true, label: 'parede',
            collisionFilter: { category: CAT_PLATFORM, mask: 0xFFFF },
        });
    }

    _criarPlataformas() {
        const { plataformas, tema } = this.faseDados;
        const tileKey = `plat_${tema}`;

        plataformas.forEach(([x, yTop, w]) => {
            const h  = TILE;
            const cx = x + w / 2;
            const cy = yTop + h / 2;

            this.add.tileSprite(cx, cy, w, h, tileKey).setDepth(2);

            this.matter.add.rectangle(cx, cy, w, h, {
                isStatic: true,
                label:    'platform',
                friction: 0.4,
                collisionFilter: {
                    category: CAT_PLATFORM,
                    mask:     0xFFFF,
                },
            });
        });
    }

    _criarPlataformasMoveis() {
        const { plataformasMoveis } = this.faseDados;
        if (!plataformasMoveis || plataformasMoveis.length === 0) return;

        plataformasMoveis.forEach(([x, yTop, w, eixo, desl, dur]) => {
            const h  = 20;
            const cx = x + w / 2;
            const cy = yTop + h / 2;

            const sprite = this.add.tileSprite(cx, cy, w, h, 'plat_movel').setDepth(2);

            const corpo = this.matter.add.rectangle(cx, cy, w, h, {
                isStatic: true,
                label:    'platform',
                friction: 0.8,
                collisionFilter: {
                    category: CAT_PLATFORM,
                    mask:     0xFFFF,
                },
            });

            const startX = cx, startY = cy;
            const tweenConfig = {
                targets:    corpo.position,
                duration:   dur,
                ease:       'Sine.easeInOut',
                yoyo:       true,
                repeat:     -1,
                onUpdate:   () => {
                    // Mover o corpo e o sprite juntos
                    const nx = eixo === 'x'
                        ? startX + (corpo.position.x - startX)
                        : startX;
                    const ny = eixo === 'y'
                        ? startY + (corpo.position.y - startY)
                        : startY;
                    Phaser.Physics.Matter.Matter.Body.setPosition(corpo, { x: corpo.position.x, y: corpo.position.y });
                    sprite.setPosition(corpo.position.x, corpo.position.y);
                },
            };

            if (eixo === 'x') {
                tweenConfig.x = startX + desl;
            } else {
                tweenConfig.y = startY + desl;
            }

            // Tween direto na posição do corpo Matter
            this.tweens.add({
                targets:  sprite,
                duration: dur,
                ease:     'Sine.easeInOut',
                yoyo:     true,
                repeat:   -1,
                ...(eixo === 'x' ? { x: cx + desl } : { y: cy + desl }),
                onUpdate: () => {
                    Phaser.Physics.Matter.Matter.Body.setPosition(corpo, {
                        x: sprite.x,
                        y: sprite.y,
                    });
                },
            });
        });
    }

    _criarHazards() {
        const { hazards } = this.faseDados;
        if (!hazards || hazards.length === 0) return;

        this.hazardRects = [];

        hazards.forEach(([x0, x1, tipo]) => {
            const w   = x1 - x0;
            const h   = TILE;
            const cx  = x0 + w / 2;
            const cy  = GT + TILE / 2;
            const tex = tipo === 'lava' ? 'lava' : 'agua';

            this.add.tileSprite(cx, cy, w, h, tex).setDepth(1);

            // Retângulo de colisão (sensor — detectado por distância no update)
            this.hazardRects.push({ x0, x1, tipo });
        });
    }

    _criarInimigos() {
        const { inimigos } = this.faseDados;

        inimigos.forEach(([x, y]) => {
            const patrol = 100;
            const e = new Enemy(this, x, y, x - patrol, x + patrol);
            this.inimigos.push(e);
        });
    }

    _criarMoedas() {
        const { moedas } = this.faseDados;
        this.moedas = moedas.map(([x, y]) => {
            const m = this.add.image(x, y, 'moeda').setDepth(3);
            // Animação flutuante
            this.tweens.add({
                targets:  m,
                y:        y - 6,
                duration: 700 + Math.random() * 400,
                ease:     'Sine.easeInOut',
                yoyo:     true,
                repeat:   -1,
            });
            return { sprite: m, coletada: false, x, y };
        });
    }

    _criarCheckpoints() {
        const { checkpoints } = this.faseDados;
        this.checkpoints = checkpoints.map(cpX => {
            const cpY = GT - 24;
            const img = this.add.image(cpX, cpY, 'checkpoint').setDepth(3);
            return { sprite: img, x: cpX, y: cpY - 24, ativo: false };
        });
    }

    _criarMeta() {
        const [mx, my] = this.faseDados.meta;
        this.meta = this.add.image(mx, my, 'bandeira').setDepth(3);

        // Animação de balanço da bandeira
        this.tweens.add({
            targets:  this.meta,
            angle:    8,
            duration: 600,
            ease:     'Sine.easeInOut',
            yoyo:     true,
            repeat:   -1,
        });
    }

    _criarLimitesMundo() {
        // Piso invisível para impedir queda infinita
        this.matter.add.rectangle(
            this.faseDados.mundoW / 2, MUNDO_H + 40,
            this.faseDados.mundoW, 80,
            { isStatic: true, label: 'void',
              collisionFilter: { category: CAT_PLATFORM, mask: 0xFFFF } }
        );
    }

    _configurarCamera() {
        const { mundoW } = this.faseDados;
        this.cameras.main.setBounds(0, 0, mundoW, MUNDO_H);
        this.cameras.main.startFollow(this.jogador, false, 0.1, 0.1);
        this.cameras.main.setDeadzone(80, 60);
    }

    // ─── Verificações no update ───────────────────────────────────

    _verificarMoedas() {
        if (!this.moedas) return;
        this.moedas.forEach(m => {
            if (m.coletada) return;
            const dist = Phaser.Math.Distance.Between(
                this.jogador.x, this.jogador.y, m.x, m.y
            );
            if (dist < 28) {
                m.coletada = true;
                m.sprite.destroy();
                this.jogador.pontuacao += 5;
                this.events.emit('scoreUpdate', this.jogador.pontuacao);
                // Efeito de coleta
                this._efeito(m.x, m.y, 0xFFD700);
            }
        });
    }

    _verificarHazards() {
        if (!this.hazardRects || !this.jogador.active) return;
        const px = this.jogador.x;
        const py = this.jogador.y;

        this.hazardRects.forEach(({ x0, x1, tipo }) => {
            const naZona = px > x0 && px < x1 && py > GT - 16;
            if (naZona) {
                this.jogador.levaDano(1, px - 1);
                // Empurrar para fora do hazard
                this.jogador.setVelocityY(-10);
            }
        });
    }

    _verificarCheckpoints() {
        if (!this.checkpoints) return;
        this.checkpoints.forEach(cp => {
            if (cp.ativo) return;
            const dist = Phaser.Math.Distance.Between(
                this.jogador.x, this.jogador.y, cp.x, cp.y
            );
            if (dist < 40) {
                cp.ativo = true;
                cp.sprite.setTexture('checkpoint_ativo');
                this.jogador.salvarCheckpoint(cp.x, cp.y);
                this._efeito(cp.x, cp.y, 0x00E676);
            }
        });
    }

    _verificarMeta() {
        if (!this.meta || !this.jogador.active) return;
        const [mx, my] = this.faseDados.meta;
        const dist = Phaser.Math.Distance.Between(
            this.jogador.x, this.jogador.y, mx, my
        );
        if (dist < 48) {
            this.meta = null;
            this.gameOver(true);
        }
    }

    _verificarPowerups() {
        if (!this.powerups) return;
        this.powerups = this.powerups.filter(pu => {
            if (!pu.active) return false;
            const dist = Phaser.Math.Distance.Between(
                this.jogador.x, this.jogador.y, pu.x, pu.y
            );
            if (dist < 28) {
                pu.destroy();
                this.jogador.curar(1);
                this._efeito(pu.x, pu.y, 0xFF66AA);
                return false;
            }
            return true;
        });
    }

    // ─── Auxiliares ───────────────────────────────────────────────

    criarPowerup(x, y) {
        const pu = this.add.image(x, y, 'powerup').setDepth(3);
        this.tweens.add({
            targets: pu, y: y - 8,
            duration: 600, ease: 'Sine.easeInOut',
            yoyo: true, repeat: -1,
        });
        this.time.delayedCall(8000, () => { if (pu.active) pu.destroy(); });
        this.powerups.push(pu);
    }

    _efeito(x, y, cor) {
        const ptk = this.add.particles(x, y, 'particula', {
            speed:    { min: 50, max: 160 },
            lifespan: 400,
            scale:    { start: 0.8, end: 0 },
            tint:     cor,
            emitting: false,
        });
        ptk.explode(10);
        this.time.delayedCall(500, () => ptk.destroy());
    }

    _mostrarTitulo(titulo) {
        const txt = this.add.text(
            this.scale.width / 2, 60, titulo, {
                fontSize: '22px', fill: '#FFFFFF',
                stroke: '#000', strokeThickness: 4,
            }
        ).setScrollFactor(0).setDepth(30).setOrigin(0.5);

        this.tweens.add({
            targets:  txt,
            alpha:    0,
            delay:    1800,
            duration: 800,
            onComplete: () => txt.destroy(),
        });
    }
}
