export default class BootScene extends Phaser.Scene {
    constructor() { super('BootScene'); }

    create() {
        this._gerarTexturas();
        const fase = window.FASE_INICIAL || 1;
        this.scene.start('GameScene', { fase });
    }

    _gerarTexturas() {
        const g = this.make.graphics({ x: 0, y: 0, add: false });

        // ── Player (32×48) ──────────────────────────────────────
        g.clear();
        g.fillStyle(0x3366CC); g.fillRect(3, 18, 26, 26);    // corpo
        g.fillStyle(0xFFD0A0); g.fillRect(5, 2, 22, 18);     // cabeça
        g.fillStyle(0x222222); g.fillRect(9, 7, 5, 5);       // olho esq
        g.fillStyle(0x222222); g.fillRect(18, 7, 5, 5);      // olho dir
        g.fillStyle(0x1A44AA); g.fillRect(3, 30, 11, 14);    // perna esq
        g.fillStyle(0x1A44AA); g.fillRect(18, 30, 11, 14);   // perna dir
        g.generateTexture('player', 32, 48);

        // ── Inimigo (32×40) ─────────────────────────────────────
        g.clear();
        g.fillStyle(0xAA2200); g.fillRect(3, 14, 26, 22);
        g.fillStyle(0xFF6644); g.fillRect(5, 2, 22, 14);
        g.fillStyle(0xFF0000); g.fillRect(8, 5, 5, 5);
        g.fillStyle(0xFF0000); g.fillRect(19, 5, 5, 5);
        g.fillStyle(0x881100); g.fillRect(3, 28, 11, 12);
        g.fillStyle(0x881100); g.fillRect(18, 28, 11, 12);
        g.generateTexture('inimigo', 32, 40);

        // ── Tiles de plataforma (32×32) por tema ────────────────
        const temas = [
            { key: 'plat_1', top: 0x8BC34A, base: 0x558B2F },  // floresta
            { key: 'plat_2', top: 0xF0C060, base: 0xC8902A },  // deserto
            { key: 'plat_3', top: 0x64B5F6, base: 0x1565C0 },  // água
            { key: 'plat_4', top: 0x9E9E9E, base: 0x424242 },  // castelo
            { key: 'plat_5', top: 0xEF6C00, base: 0x7B1F00 },  // lava
        ];

        temas.forEach(({ key, top, base }) => {
            g.clear();
            g.fillStyle(base); g.fillRect(0, 0, 32, 32);
            g.fillStyle(top);  g.fillRect(0, 0, 32, 6);
            // pequenos blocos decorativos
            g.fillStyle(base + 0x111111); g.fillRect(0, 6, 16, 1);
            g.generateTexture(key, 32, 32);
        });

        // ── Tiles de chão (32×32) por tema ──────────────────────
        const choes = [
            { key: 'chao_1', top: 0x4CAF50, base: 0x2E7D32 },
            { key: 'chao_2', top: 0xFFD54F, base: 0xBF8600 },
            { key: 'chao_3', top: 0x29B6F6, base: 0x0277BD },
            { key: 'chao_4', top: 0x78909C, base: 0x37474F },
            { key: 'chao_5', top: 0xFF5722, base: 0x6D1A00 },
        ];

        choes.forEach(({ key, top, base }) => {
            g.clear();
            g.fillStyle(base); g.fillRect(0, 0, 32, 32);
            g.fillStyle(top);  g.fillRect(0, 0, 32, 8);
            g.generateTexture(key, 32, 32);
        });

        // ── Moeda (20×20) ────────────────────────────────────────
        g.clear();
        g.fillStyle(0xFFD700); g.fillCircle(10, 10, 9);
        g.fillStyle(0xFFA000); g.fillCircle(10, 10, 6);
        g.fillStyle(0xFFE57F); g.fillRect(7, 5, 3, 5);
        g.generateTexture('moeda', 20, 20);

        // ── Coração cheio (22×20) ─────────────────────────────────
        g.clear();
        g.fillStyle(0xFF2244);
        g.fillCircle(6, 7, 6); g.fillCircle(16, 7, 6);
        g.fillTriangle(0, 8, 22, 8, 11, 20);
        g.generateTexture('coracao', 22, 20);

        // ── Coração vazio (22×20) ────────────────────────────────
        g.clear();
        g.fillStyle(0x554455);
        g.fillCircle(6, 7, 6); g.fillCircle(16, 7, 6);
        g.fillTriangle(0, 8, 22, 8, 11, 20);
        g.generateTexture('coracao_vazio', 22, 20);

        // ── Checkpoint (mastro 8×48 + bandeira 24×20) ─────────────
        g.clear();
        g.fillStyle(0xAAAAAA); g.fillRect(4, 0, 6, 48);
        g.fillStyle(0xCCCCCC);
        g.fillTriangle(10, 4, 10, 24, 30, 14);
        g.generateTexture('checkpoint', 32, 48);

        g.clear();
        g.fillStyle(0xAAAAAA); g.fillRect(4, 0, 6, 48);
        g.fillStyle(0x00E676);
        g.fillTriangle(10, 4, 10, 24, 30, 14);
        g.generateTexture('checkpoint_ativo', 32, 48);

        // ── Meta / Bandeira de chegada (32×64) ────────────────────
        g.clear();
        g.fillStyle(0x888888); g.fillRect(4, 0, 6, 64);
        g.fillStyle(0xFFD700);
        g.fillTriangle(10, 4, 10, 36, 42, 20);
        g.generateTexture('bandeira', 48, 64);

        // ── Partícula (8×8) ──────────────────────────────────────
        g.clear();
        g.fillStyle(0xFFFFFF); g.fillCircle(4, 4, 4);
        g.generateTexture('particula', 8, 8);

        // ── Plataforma móvel (96×20) ─────────────────────────────
        g.clear();
        g.fillStyle(0xC06030); g.fillRect(0, 0, 96, 20);
        g.fillStyle(0xFF8C40); g.fillRect(0, 0, 96, 5);
        g.generateTexture('plat_movel', 96, 20);

        // ── Lava (32×32) ──────────────────────────────────────────
        g.clear();
        g.fillStyle(0xFF3300); g.fillRect(0, 0, 32, 32);
        g.fillStyle(0xFF7700); g.fillRect(0, 0, 32, 10);
        g.fillStyle(0xFFAA00); g.fillRect(4, 2, 6, 6);
        g.fillStyle(0xFFAA00); g.fillRect(18, 4, 6, 5);
        g.generateTexture('lava', 32, 32);

        // ── Água (32×32) ──────────────────────────────────────────
        g.clear();
        g.fillStyle(0x0055AA); g.fillRect(0, 0, 32, 32);
        g.fillStyle(0x0088DD); g.fillRect(0, 0, 32, 10);
        g.fillStyle(0x44BBFF); g.fillRect(4, 2, 6, 5);
        g.fillStyle(0x44BBFF); g.fillRect(20, 4, 5, 4);
        g.generateTexture('agua', 32, 32);

        // ── Power-up / coração extra (24×24) ─────────────────────
        g.clear();
        g.fillStyle(0xFF66AA); g.fillCircle(12, 12, 11);
        g.fillStyle(0xFF2244);
        g.fillCircle(7, 9, 5); g.fillCircle(17, 9, 5);
        g.fillTriangle(2, 10, 22, 10, 12, 22);
        g.generateTexture('powerup', 24, 24);

        // ── Backgrounds por tema (800×450) ───────────────────────
        const bgs = [
            { key: 'bg_1', sky: 0x87CEEB, mid: 0x6B8E23, bot: 0x3A5F0B },
            { key: 'bg_2', sky: 0xDAA520, mid: 0xC8902A, bot: 0x8B6914 },
            { key: 'bg_3', sky: 0x00BFFF, mid: 0x0066AA, bot: 0x003366 },
            { key: 'bg_4', sky: 0x222244, mid: 0x111133, bot: 0x0A0A22 },
            { key: 'bg_5', sky: 0x660000, mid: 0x991100, bot: 0xCC2200 },
        ];

        bgs.forEach(({ key, sky, mid, bot }) => {
            g.clear();
            g.fillStyle(sky); g.fillRect(0, 0, 800, 180);
            g.fillStyle(mid); g.fillRect(0, 180, 800, 160);
            g.fillStyle(bot); g.fillRect(0, 340, 800, 110);
            g.generateTexture(key, 800, 450);
        });

        // ── Tile de fundo (decorativo) 800×450 ───────────────────
        // Usados como camadas de parallax (mesmas texturas, opacidade diferente)

        g.destroy();
    }
}
