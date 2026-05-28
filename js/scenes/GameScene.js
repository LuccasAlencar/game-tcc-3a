import { CAT_PLATFORM, TILE, MUNDO_H, GROUND_TOP, GRAVITY_Y } from '../constants.js';
import FASES  from '../fases.js';
import Player from '../entities/Player.js';
import Enemy  from '../entities/Enemy.js';

const GT = GROUND_TOP; // atalho para a posição Y do topo do chão (536)

export default class GameScene extends Phaser.Scene {
    constructor() { super('GameScene'); }

    // ─── Ciclo de vida ────────────────────────────────────────────

    // init é chamado antes de create — recebe o número da fase via scene.start()
    init(data) {
        this.faseNum = data.fase || window.FASE_INICIAL || 1; // fase atual (padrão: 1)
        this.MUNDO_H = MUNDO_H;                               // altura do mundo acessível por entidades
    }

    create() {
        const fase = FASES[this.faseNum]; // carrega os dados da fase pelo índice
        if (!fase) { this.faseNum = 1; return this.create(); } // volta para fase 1 se índice inválido

        this.faseDados = fase;   // armazena os dados da fase para uso nos métodos privados
        this.inimigos  = [];     // lista de inimigos ativos na cena
        this.moedas    = [];     // lista de moedas (coletáveis) na cena
        this.powerups  = [];     // lista de power-ups dropados por inimigos

        this.matter.world.setGravity(0, GRAVITY_Y); // define a gravidade do mundo Matter.js

        // Cria todos os elementos do mundo na ordem correta
        this._criarFundo();
        this._criarChao();
        this._criarPlataformas();
        this._criarPlataformasMoveis();
        this._criarHazards();
        this._criarMoedas();
        this._criarCheckpoints();
        this._criarMeta();

        const spawnX = 120;       // posição X inicial do jogador
        const spawnY = GT - 28;   // posição Y inicial do jogador (acima do chão)
        this.jogador = new Player(this, spawnX, spawnY); // instancia o jogador

        this._criarInimigos();    // instancia todos os inimigos da fase
        this._configurarCamera(); // configura câmera com follow e deadzone
        this._criarLimitesMundo(); // paredes e piso invisíveis nos limites do mapa

        this.scene.launch('UIScene');                               // inicia o HUD em paralelo
        this.events.emit('faseUpdate', this.faseNum);              // informa o HUD do número da fase
        this.events.emit('hpUpdate', this.jogador.hp, this.jogador.hpMax); // informa o HUD do HP inicial

        this._mostrarTitulo(fase.titulo); // exibe o título da fase por alguns segundos
    }

    update(_, delta) {
        if (!this.jogador || !this.jogador.active) return; // para o update se o jogador foi destruído

        this.jogador.update(delta);                          // atualiza movimento, pulo e ataque do jogador
        this.inimigos.forEach(e => e.update(delta, this.jogador)); // atualiza patrulha e ataque de cada inimigo

        // Verifica interações do jogador com objetos do mundo
        this._verificarMoedas();
        this._verificarHazards();
        this._verificarCheckpoints();
        this._verificarMeta();
        this._verificarPowerups();
        this._atualizarParalax(); // rola as camadas de fundo proporcionalmente à câmera
    }

    // ─── Fim / vitória ────────────────────────────────────────────

    gameOver(venceu) {
        this.scene.pause('GameScene'); // pausa a lógica do jogo (mantém a tela visível)
        const proxFase = this.faseNum + 1; // calcula a próxima fase para o botão "Próxima →"

        // Lança a tela de fim de jogo com os dados do resultado
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

        // Define a cor de fundo do canvas (usada atrás de todas as camadas)
        this.cameras.main.setBackgroundColor(
            '#' + bgColor.toString(16).padStart(6, '0')
        );

        const bgKey = `bg_${tema}`; // chave da textura de fundo correspondente ao tema

        // Camada 1 — fundo distante (scroll lento, scrollFactor 0 = fixo na câmera)
        this.bgCamada1 = this.add.tileSprite(0, 0, mundoW, MUNDO_H, bgKey)
            .setOrigin(0, 0).setScrollFactor(0).setDepth(-10).setAlpha(1);

        // Camada 2 — fundo intermediário (scroll médio, semi-transparente para profundidade)
        this.bgCamada2 = this.add.tileSprite(0, 0, mundoW, MUNDO_H, bgKey)
            .setOrigin(0, 0).setScrollFactor(0.3).setDepth(-9).setAlpha(0.5);
    }

    _atualizarParalax() {
        // Desloca o tile da camada 1 suavemente (5% da velocidade da câmera)
        if (this.bgCamada1) {
            this.bgCamada1.tilePositionX = this.cameras.main.scrollX * 0.05;
        }
        // Desloca o tile da camada 2 mais rápido (20% da velocidade da câmera)
        if (this.bgCamada2) {
            this.bgCamada2.tilePositionX = this.cameras.main.scrollX * 0.2;
        }
    }

    _criarChao() {
        const { chao, tema, mundoW } = this.faseDados;
        const tileKey = `chao_${tema}`; // textura do chão do tema atual
        const h       = TILE * 3;       // espessura visual do chão (3 tiles = 96px)

        chao.forEach(([x0, x1]) => {
            const w  = x1 - x0;         // largura do segmento de chão
            const cx = x0 + w / 2;      // centro X do retângulo
            const cy = GT + h / 2;      // centro Y do retângulo (começa em GROUND_TOP)

            this.add.tileSprite(cx, cy, w, h, tileKey).setDepth(1); // sprite visual do chão

            // Corpo físico estático do chão (colide com tudo)
            this.matter.add.rectangle(cx, cy, w, h, {
                isStatic: true,
                label:    'ground',
                friction: 0.5,
                collisionFilter: {
                    category: CAT_PLATFORM,
                    mask:     0xFFFF, // colide com todas as categorias
                },
            });
        });

        // Parede invisível no lado esquerdo para impedir que o jogador saia do mapa
        this.matter.add.rectangle(-16, MUNDO_H / 2, 32, MUNDO_H, {
            isStatic: true, label: 'parede',
            collisionFilter: { category: CAT_PLATFORM, mask: 0xFFFF },
        });

        // Parede invisível no lado direito do mapa
        this.matter.add.rectangle(mundoW + 16, MUNDO_H / 2, 32, MUNDO_H, {
            isStatic: true, label: 'parede',
            collisionFilter: { category: CAT_PLATFORM, mask: 0xFFFF },
        });
    }

    _criarPlataformas() {
        const { plataformas, tema } = this.faseDados;
        const tileKey = `plat_${tema}`; // textura da plataforma do tema atual

        plataformas.forEach(([x, yTop, w]) => {
            const h  = TILE;            // altura de uma plataforma (1 tile = 32px)
            const cx = x + w / 2;      // centro X da plataforma
            const cy = yTop + h / 2;   // centro Y da plataforma

            this.add.tileSprite(cx, cy, w, h, tileKey).setDepth(2); // sprite visual

            // Corpo físico estático da plataforma
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
        if (!plataformasMoveis || plataformasMoveis.length === 0) return; // sem plataformas móveis nessa fase

        plataformasMoveis.forEach(([x, yTop, w, eixo, desl, dur]) => {
            const h  = 20;           // altura da plataforma móvel em pixels
            const cx = x + w / 2;   // centro X inicial
            const cy = yTop + h / 2; // centro Y inicial

            // Cria o sprite visual da plataforma móvel
            const sprite = this.add.tileSprite(cx, cy, w, h, 'plat_movel').setDepth(2);

            // Cria o corpo físico estático (a posição será atualizada pelo tween)
            const corpo = this.matter.add.rectangle(cx, cy, w, h, {
                isStatic: true,
                label:    'platform',
                friction: 0.8, // mais atrito para o jogador não escorregar
                collisionFilter: {
                    category: CAT_PLATFORM,
                    mask:     0xFFFF,
                },
            });

            // Anima o sprite e atualiza o corpo físico Matter a cada frame do tween
            this.tweens.add({
                targets:  sprite,                                     // tween aplicado ao sprite
                duration: dur,                                        // duração de cada ciclo em ms
                ease:     'Sine.easeInOut',                          // movimento suave
                yoyo:     true,                                       // vai e volta
                repeat:   -1,                                         // repete infinitamente
                ...(eixo === 'x' ? { x: cx + desl } : { y: cy + desl }), // eixo de movimento
                onUpdate: () => {
                    // Sincroniza o corpo Matter com a posição atual do sprite
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
        if (!hazards || hazards.length === 0) return; // sem zonas de perigo nessa fase

        this.hazardRects = []; // lista de zonas de perigo para verificação por distância no update

        hazards.forEach(([x0, x1, tipo]) => {
            const w   = x1 - x0;                       // largura da zona de perigo
            const h   = TILE;                           // altura de 1 tile
            const cx  = x0 + w / 2;                    // centro X
            const cy  = GT + TILE / 2;                 // centro Y (no nível do chão)
            const tex = tipo === 'lava' ? 'lava' : 'agua'; // textura conforme o tipo

            this.add.tileSprite(cx, cy, w, h, tex).setDepth(1); // sprite visual do hazard

            // Armazena as coordenadas para verificação por distância no update()
            this.hazardRects.push({ x0, x1, tipo });
        });
    }

    _criarInimigos() {
        const { inimigos } = this.faseDados;

        inimigos.forEach(([x, y]) => {
            const patrol = 100; // raio de patrulha em pixels para cada lado do spawn
            // Cria o inimigo com limites de patrulha baseados na posição inicial
            const e = new Enemy(this, x, y, x - patrol, x + patrol);
            this.inimigos.push(e); // adiciona à lista de inimigos da cena
        });
    }

    _criarMoedas() {
        const { moedas } = this.faseDados;

        // Converte cada posição [x, y] em um objeto com sprite e estado de coleta
        this.moedas = moedas.map(([x, y]) => {
            const m = this.add.image(x, y, 'moeda').setDepth(3); // sprite da moeda

            // Animação de flutuar suavemente para cima e para baixo
            this.tweens.add({
                targets:  m,
                y:        y - 6,                           // sobe 6 pixels
                duration: 700 + Math.random() * 400,       // duração aleatória para variar
                ease:     'Sine.easeInOut',
                yoyo:     true,                            // vai e volta
                repeat:   -1,
            });

            return { sprite: m, coletada: false, x, y }; // objeto com estado de coleta
        });
    }

    _criarCheckpoints() {
        const { checkpoints } = this.faseDados;

        // Cria um sprite de checkpoint para cada posição X definida na fase
        this.checkpoints = checkpoints.map(cpX => {
            const cpY = GT - 24;                                // posição Y do checkpoint (acima do chão)
            const img = this.add.image(cpX, cpY, 'checkpoint').setDepth(3);
            return { sprite: img, x: cpX, y: cpY - 24, ativo: false }; // ativo = false até o jogador passar
        });
    }

    _criarMeta() {
        const [mx, my] = this.faseDados.meta; // posição da bandeira de chegada
        this.meta = this.add.image(mx, my, 'bandeira').setDepth(3); // sprite da bandeira

        // Animação de balanço suave da bandeira
        this.tweens.add({
            targets:  this.meta,
            angle:    8,          // gira 8 graus para um lado
            duration: 600,
            ease:     'Sine.easeInOut',
            yoyo:     true,       // volta para o ângulo original
            repeat:   -1,
        });
    }

    _criarLimitesMundo() {
        // Piso invisível bem abaixo do chão — impede corpos físicos de cair para o infinito
        this.matter.add.rectangle(
            this.faseDados.mundoW / 2, MUNDO_H + 40, // posição centralizada no eixo X
            this.faseDados.mundoW, 80,                // tão largo quanto o mundo
            { isStatic: true, label: 'void',
              collisionFilter: { category: CAT_PLATFORM, mask: 0xFFFF } }
        );
    }

    _configurarCamera() {
        const { mundoW } = this.faseDados;
        this.cameras.main.setBounds(0, 0, mundoW, MUNDO_H); // limita o scroll aos limites do mapa
        this.cameras.main.startFollow(this.jogador, false, 0.1, 0.1); // segue o jogador com lerp suave
        this.cameras.main.setDeadzone(80, 60); // área central onde o jogador pode mover sem rolar a câmera
    }

    // ─── Verificações no update ───────────────────────────────────

    _verificarMoedas() {
        if (!this.moedas) return;

        this.moedas.forEach(m => {
            if (m.coletada) return; // ignora moedas já coletadas

            // Verifica distância entre o jogador e a moeda
            const dist = Phaser.Math.Distance.Between(
                this.jogador.x, this.jogador.y, m.x, m.y
            );

            if (dist < 28) { // raio de coleta: 28 pixels
                m.coletada = true;    // marca como coletada para não processar novamente
                m.sprite.destroy();   // remove o sprite da cena
                this.jogador.pontuacao += 5;                        // adiciona 5 pontos
                this.events.emit('scoreUpdate', this.jogador.pontuacao); // atualiza o HUD
                this._efeito(m.x, m.y, 0xFFD700);                  // partículas douradas
                this._tocarSom('sfx_moeda');                        // som de coleta
            }
        });
    }

    _verificarHazards() {
        if (!this.hazardRects || !this.jogador.active) return;

        const px = this.jogador.x; // posição X do jogador
        const py = this.jogador.y; // posição Y do jogador

        this.hazardRects.forEach(({ x0, x1 }) => {
            // Verifica se o jogador está dentro da zona de perigo (X e Y)
            const naZona = px > x0 && px < x1 && py > GT - 16;
            if (naZona) {
                this.jogador.levaDano(1, px - 1); // aplica dano (respeita invencibilidade)
                this.jogador.setVelocityY(-10);   // empurra o jogador para cima ao entrar no hazard
            }
        });
    }

    _verificarCheckpoints() {
        if (!this.checkpoints) return;

        this.checkpoints.forEach(cp => {
            if (cp.ativo) return; // checkpoint já ativado — ignora

            const dist = Phaser.Math.Distance.Between(
                this.jogador.x, this.jogador.y, cp.x, cp.y
            );

            if (dist < 40) { // raio de ativação: 40 pixels
                cp.ativo = true;                                   // marca o checkpoint como ativado
                cp.sprite.setTexture('checkpoint_ativo');          // muda para textura verde
                this.jogador.salvarCheckpoint(cp.x, cp.y);        // salva a posição no jogador
                this._efeito(cp.x, cp.y, 0x00E676);               // partículas verdes
                this._tocarSom('sfx_checkpoint');                  // som de checkpoint ativado
            }
        });
    }

    _verificarMeta() {
        if (!this.meta || !this.jogador.active) return;

        const [mx, my] = this.faseDados.meta; // posição da bandeira
        const dist = Phaser.Math.Distance.Between(
            this.jogador.x, this.jogador.y, mx, my
        );

        if (dist < 48) { // raio de chegada: 48 pixels
            this.meta = null;       // remove a referência para evitar dupla detecção
            this._tocarSom('sfx_vitoria'); // toca som de vitória
            this.gameOver(true);    // transição para tela de vitória
        }
    }

    _verificarPowerups() {
        if (!this.powerups) return;

        // Filtra os power-ups removendo os coletados (retorna false para destruir)
        this.powerups = this.powerups.filter(pu => {
            if (!pu.active) return false; // já foi destruído por tempo ou coleta

            const dist = Phaser.Math.Distance.Between(
                this.jogador.x, this.jogador.y, pu.x, pu.y
            );

            if (dist < 28) { // raio de coleta: 28 pixels
                pu.destroy();                          // remove o sprite
                this.jogador.curar(1);                 // recupera 1 de HP
                this._efeito(pu.x, pu.y, 0xFF66AA);   // partículas rosa
                return false;                          // remove da lista
            }
            return true; // mantém na lista se ainda não coletado
        });
    }

    // ─── Auxiliares ───────────────────────────────────────────────

    // Cria um power-up de cura no ponto onde um inimigo morreu
    criarPowerup(x, y) {
        const pu = this.add.image(x, y, 'powerup').setDepth(3); // sprite do power-up

        // Animação de flutuar para cima e para baixo
        this.tweens.add({
            targets: pu, y: y - 8,
            duration: 600, ease: 'Sine.easeInOut',
            yoyo: true, repeat: -1,
        });

        // Destrói o power-up automaticamente após 8 segundos se não coletado
        this.time.delayedCall(8000, () => { if (pu.active) pu.destroy(); });
        this.powerups.push(pu); // adiciona à lista de power-ups ativos
    }

    // Toca um efeito sonoro se o arquivo de áudio foi carregado com sucesso
    _tocarSom(key) {
        if (this.cache.audio.exists(key)) {
            this.sound.play(key, { volume: 0.5 }); // volume médio para efeitos de cena
        }
    }

    // Emite um burst de partículas na posição indicada com a cor especificada
    _efeito(x, y, cor) {
        const ptk = this.add.particles(x, y, 'particula', {
            speed:    { min: 50, max: 160 },
            lifespan: 400,
            scale:    { start: 0.8, end: 0 },
            tint:     cor,
            emitting: false, // não emite continuamente — usa explode()
        });
        ptk.explode(10);                                   // dispara 10 partículas de uma vez
        this.time.delayedCall(500, () => ptk.destroy());   // destrói o emissor após a animação
    }

    // Exibe o título da fase no centro da tela e faz um fade-out suave
    _mostrarTitulo(titulo) {
        const txt = this.add.text(
            this.scale.width / 2, 60, titulo, {
                fontSize: '22px', fill: '#FFFFFF',
                stroke: '#000', strokeThickness: 4,
            }
        ).setScrollFactor(0).setDepth(30).setOrigin(0.5); // fixo na câmera, na frente de tudo

        // Aguarda 1.8s e então faz o fade-out em 800ms
        this.tweens.add({
            targets:  txt,
            alpha:    0,
            delay:    1800,
            duration: 800,
            onComplete: () => txt.destroy(), // remove o texto ao terminar o fade
        });
    }
}
