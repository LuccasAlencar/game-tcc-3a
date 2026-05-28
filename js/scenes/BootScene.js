// BootScene — primeira cena a rodar. Gera todas as texturas do jogo via Graphics
// (sem assets externos) e pré-carrega arquivos de áudio (falha silenciosamente se não existirem).
export default class BootScene extends Phaser.Scene {
    constructor() { super('BootScene'); }

    // preload é chamado automaticamente pelo Phaser antes de create()
    preload() {
        // Suprime erros de carregamento para que sons faltando não quebrem o jogo
        this.load.on('loaderror', () => {});

        // Tenta carregar cada efeito sonoro da pasta assets/sounds/
        // Se o arquivo não existir, o cache não registra a chave e o som é ignorado
        this.load.audio('sfx_pulo',       'assets/sounds/pulo.mp3');
        this.load.audio('sfx_ataque',     'assets/sounds/ataque.mp3');
        this.load.audio('sfx_dano',       'assets/sounds/dano.mp3');
        this.load.audio('sfx_morte',      'assets/sounds/morte.mp3');
        this.load.audio('sfx_moeda',      'assets/sounds/moeda.mp3');
        this.load.audio('sfx_checkpoint', 'assets/sounds/checkpoint.mp3');
        this.load.audio('sfx_vitoria',    'assets/sounds/vitoria.mp3');
    }

    create() {
        this._gerarTexturas();                        // gera todas as texturas do jogo em memória
        const fase = window.FASE_INICIAL || 1;       // pega a fase definida pela URL (padrão: 1)
        this.scene.start('GameScene', { fase });      // transiciona para a cena principal do jogo
    }

    // Gera todas as texturas do jogo usando a API Graphics do Phaser (sem arquivos externos)
    _gerarTexturas() {
        const g = this.make.graphics({ x: 0, y: 0, add: false }); // cria um objeto Graphics fora da cena (não renderizado)

        // ── Player (32×48) ──────────────────────────────────────────────────────────
        g.clear();
        g.fillStyle(0x3366CC); g.fillRect(3, 18, 26, 26);   // corpo azul (camisa)
        g.fillStyle(0xFFD0A0); g.fillRect(5, 2, 22, 18);    // cabeça (tom de pele)
        g.fillStyle(0x222222); g.fillRect(9, 7, 5, 5);      // olho esquerdo
        g.fillStyle(0x222222); g.fillRect(18, 7, 5, 5);     // olho direito
        g.fillStyle(0x1A44AA); g.fillRect(3, 30, 11, 14);   // perna esquerda (calça azul escura)
        g.fillStyle(0x1A44AA); g.fillRect(18, 30, 11, 14);  // perna direita
        g.generateTexture('player', 32, 48);                 // bake da textura com a chave 'player'

        // ── Inimigo (32×40) ─────────────────────────────────────────────────────────
        g.clear();
        g.fillStyle(0xAA2200); g.fillRect(3, 14, 26, 22);   // corpo vermelho escuro
        g.fillStyle(0xFF6644); g.fillRect(5, 2, 22, 14);    // cabeça laranja-avermelhada
        g.fillStyle(0xFF0000); g.fillRect(8, 5, 5, 5);      // olho esquerdo vermelho brilhante
        g.fillStyle(0xFF0000); g.fillRect(19, 5, 5, 5);     // olho direito vermelho brilhante
        g.fillStyle(0x881100); g.fillRect(3, 28, 11, 12);   // perna esquerda vermelho escuro
        g.fillStyle(0x881100); g.fillRect(18, 28, 11, 12);  // perna direita vermelho escuro
        g.generateTexture('inimigo', 32, 40);                // bake da textura do inimigo

        // ── Tiles de plataforma (32×32) — um por tema visual ────────────────────────
        const temas = [
            { key: 'plat_1', top: 0x8BC34A, base: 0x558B2F },  // tema 1 — floresta (verde)
            { key: 'plat_2', top: 0xF0C060, base: 0xC8902A },  // tema 2 — deserto (amarelo/marrom)
            { key: 'plat_3', top: 0x64B5F6, base: 0x1565C0 },  // tema 3 — água (azul)
            { key: 'plat_4', top: 0x9E9E9E, base: 0x424242 },  // tema 4 — castelo (cinza)
            { key: 'plat_5', top: 0xEF6C00, base: 0x7B1F00 },  // tema 5 — lava (laranja/marrom escuro)
        ];

        temas.forEach(({ key, top, base }) => {
            g.clear();
            g.fillStyle(base); g.fillRect(0, 0, 32, 32);        // base da plataforma (cor mais escura)
            g.fillStyle(top);  g.fillRect(0, 0, 32, 6);         // faixa superior (topo mais claro)
            g.fillStyle(base + 0x111111); g.fillRect(0, 6, 16, 1); // linha divisória decorativa
            g.generateTexture(key, 32, 32);
        });

        // ── Tiles de chão (32×32) — um por tema visual ───────────────────────────────
        const choes = [
            { key: 'chao_1', top: 0x4CAF50, base: 0x2E7D32 }, // floresta
            { key: 'chao_2', top: 0xFFD54F, base: 0xBF8600 }, // deserto
            { key: 'chao_3', top: 0x29B6F6, base: 0x0277BD }, // água
            { key: 'chao_4', top: 0x78909C, base: 0x37474F }, // castelo
            { key: 'chao_5', top: 0xFF5722, base: 0x6D1A00 }, // lava
        ];

        choes.forEach(({ key, top, base }) => {
            g.clear();
            g.fillStyle(base); g.fillRect(0, 0, 32, 32); // base do chão (cor mais escura)
            g.fillStyle(top);  g.fillRect(0, 0, 32, 8);  // faixa superior mais larga que nas plataformas
            g.generateTexture(key, 32, 32);
        });

        // ── Moeda (20×20) ─────────────────────────────────────────────────────────────
        g.clear();
        g.fillStyle(0xFFD700); g.fillCircle(10, 10, 9);  // círculo dourado externo
        g.fillStyle(0xFFA000); g.fillCircle(10, 10, 6);  // círculo interno mais escuro (profundidade)
        g.fillStyle(0xFFE57F); g.fillRect(7, 5, 3, 5);   // reflexo de luz no canto superior
        g.generateTexture('moeda', 20, 20);

        // ── Coração cheio (22×20) — indica HP disponível ─────────────────────────────
        g.clear();
        g.fillStyle(0xFF2244);
        g.fillCircle(6, 7, 6);          // metade esquerda do coração
        g.fillCircle(16, 7, 6);         // metade direita do coração
        g.fillTriangle(0, 8, 22, 8, 11, 20); // ponta inferior do coração
        g.generateTexture('coracao', 22, 20);

        // ── Coração vazio (22×20) — indica HP perdido ────────────────────────────────
        g.clear();
        g.fillStyle(0x554455); // cinza-roxo para indicar vazio/gasto
        g.fillCircle(6, 7, 6);
        g.fillCircle(16, 7, 6);
        g.fillTriangle(0, 8, 22, 8, 11, 20);
        g.generateTexture('coracao_vazio', 22, 20);

        // ── Checkpoint inativo (32×48) — mastro cinza com bandeira branca ──────────────
        g.clear();
        g.fillStyle(0xAAAAAA); g.fillRect(4, 0, 6, 48);       // mastro vertical cinza
        g.fillStyle(0xCCCCCC);
        g.fillTriangle(10, 4, 10, 24, 30, 14);                 // bandeira triangular branca
        g.generateTexture('checkpoint', 32, 48);

        // ── Checkpoint ativo (32×48) — mastro cinza com bandeira verde ─────────────────
        g.clear();
        g.fillStyle(0xAAAAAA); g.fillRect(4, 0, 6, 48);        // mesmo mastro
        g.fillStyle(0x00E676);                                   // bandeira verde (progresso salvo)
        g.fillTriangle(10, 4, 10, 24, 30, 14);
        g.generateTexture('checkpoint_ativo', 32, 48);

        // ── Meta / Bandeira de chegada (48×64) ─────────────────────────────────────────
        g.clear();
        g.fillStyle(0x888888); g.fillRect(4, 0, 6, 64);        // mastro longo cinza
        g.fillStyle(0xFFD700);                                   // bandeira dourada (objetivo final)
        g.fillTriangle(10, 4, 10, 36, 42, 20);                 // bandeira triangular maior
        g.generateTexture('bandeira', 48, 64);

        // ── Partícula (8×8) — usada em todos os efeitos de partículas ──────────────────
        g.clear();
        g.fillStyle(0xFFFFFF); g.fillCircle(4, 4, 4); // círculo branco (a cor é aplicada via tint)
        g.generateTexture('particula', 8, 8);

        // ── Plataforma móvel (96×20) ────────────────────────────────────────────────────
        g.clear();
        g.fillStyle(0xC06030); g.fillRect(0, 0, 96, 20); // corpo marrom da plataforma
        g.fillStyle(0xFF8C40); g.fillRect(0, 0, 96, 5);  // faixa superior laranja mais clara
        g.generateTexture('plat_movel', 96, 20);

        // ── Lava (32×32) — usado nos hazards da fase 5 ──────────────────────────────────
        g.clear();
        g.fillStyle(0xFF3300); g.fillRect(0, 0, 32, 32);    // base vermelha da lava
        g.fillStyle(0xFF7700); g.fillRect(0, 0, 32, 10);    // faixa superior laranja (superfície)
        g.fillStyle(0xFFAA00); g.fillRect(4, 2, 6, 6);      // bolha de lava esquerda
        g.fillStyle(0xFFAA00); g.fillRect(18, 4, 6, 5);     // bolha de lava direita
        g.generateTexture('lava', 32, 32);

        // ── Água (32×32) — usado nos hazards da fase 3 ──────────────────────────────────
        g.clear();
        g.fillStyle(0x0055AA); g.fillRect(0, 0, 32, 32);    // base azul escuro da água
        g.fillStyle(0x0088DD); g.fillRect(0, 0, 32, 10);    // faixa superior azul médio (superfície)
        g.fillStyle(0x44BBFF); g.fillRect(4, 2, 6, 5);      // reflexo de luz esquerdo
        g.fillStyle(0x44BBFF); g.fillRect(20, 4, 5, 4);     // reflexo de luz direito
        g.generateTexture('agua', 32, 32);

        // ── Espada do jogador (36×10) ────────────────────────────────────────────────────
        // Layout: [Pomo][Cabo][Guarda][Lâmina→Ponta]  (cabo à esquerda, lâmina aponta para a DIREITA)
        // Com setFlipX(false) a lâmina aponta direita (ataca pra direita).
        // Com setFlipX(true)  a lâmina aponta esquerda (ataca pra esquerda).
        // Origin em (0.2, 0.5) ancora no meio do cabo para rotação natural de empunhadura.
        g.clear();
        g.fillStyle(0x552200); g.fillRect(0,  3, 1,  4);   // pomo (extremidade do cabo, lado esquerdo)
        g.fillStyle(0x774422); g.fillRect(1,  3, 10, 4);   // cabo marrom
        g.fillStyle(0x996644); g.fillRect(2,  4, 7,  2);   // brilho do cabo
        g.fillStyle(0xCCAA22); g.fillRect(11, 0, 4,  10);  // guarda dourada (cross-guard)
        g.fillStyle(0xFFDD44); g.fillRect(12, 2, 2,  6);   // brilho da guarda
        g.fillStyle(0xCCCCCC); g.fillRect(15, 3, 21, 4);   // lâmina cinza (aponta para a direita)
        g.fillStyle(0xEEEEEE); g.fillRect(17, 4, 10, 1);   // reflexo de luz na lâmina
        g.fillStyle(0x999999); g.fillRect(33, 3, 3,  2);   // ponta afilada (extremidade direita)
        g.generateTexture('espada', 36, 10);

        // ── Power-up / coração extra (24×24) ────────────────────────────────────────────
        g.clear();
        g.fillStyle(0xFF66AA); g.fillCircle(12, 12, 11);    // halo rosa externo
        g.fillStyle(0xFF2244);                               // coração interno vermelho
        g.fillCircle(7, 9, 5);                              // metade esquerda do coração
        g.fillCircle(17, 9, 5);                             // metade direita do coração
        g.fillTriangle(2, 10, 22, 10, 12, 22);             // ponta do coração
        g.generateTexture('powerup', 24, 24);

        // ── Backgrounds por tema (800×450) — 3 faixas de gradiente ─────────────────────
        const bgs = [
            { key: 'bg_1', sky: 0x87CEEB, mid: 0x6B8E23, bot: 0x3A5F0B }, // floresta: céu azul/verde
            { key: 'bg_2', sky: 0xDAA520, mid: 0xC8902A, bot: 0x8B6914 }, // deserto: tons de dourado
            { key: 'bg_3', sky: 0x00BFFF, mid: 0x0066AA, bot: 0x003366 }, // água: azul profundo
            { key: 'bg_4', sky: 0x222244, mid: 0x111133, bot: 0x0A0A22 }, // castelo: azul noturno
            { key: 'bg_5', sky: 0x660000, mid: 0x991100, bot: 0xCC2200 }, // lava: tons de vermelho
        ];

        bgs.forEach(({ key, sky, mid, bot }) => {
            g.clear();
            g.fillStyle(sky); g.fillRect(0, 0, 800, 180);   // faixa superior (céu)
            g.fillStyle(mid); g.fillRect(0, 180, 800, 160); // faixa intermediária (horizonte)
            g.fillStyle(bot); g.fillRect(0, 340, 800, 110); // faixa inferior (chão do fundo)
            g.generateTexture(key, 800, 450);
        });

        g.destroy(); // libera o objeto Graphics da memória (texturas já foram copiadas)
    }
}
