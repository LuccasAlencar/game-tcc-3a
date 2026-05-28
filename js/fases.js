// Definição das 5 fases do jogo — indexado de 1 a 5 (índice 0 é null)
//
// Formato de cada array:
//   plataformas:      [x_esquerda, y_topo, largura]          (altura sempre 32px = 1 TILE)
//   chao:             [x_inicio, x_fim]                       (y_topo = GROUND_TOP = 536)
//   inimigos:         [x_centro, y_centro]                    (patrulha ±100px automática)
//   moedas:           [x, y]                                  (valor: 5 pontos cada)
//   checkpoints:      [x]                                     (y calculado = GROUND_TOP - 24)
//   plataformasMoveis:[x, y_topo, largura, eixo, desl, dur]   (eixo='x'|'y', dur em ms)
//   hazards:          [x_inicio, x_fim, tipo]                 ('lava' | 'agua')
//   meta:             [x, y]                                  (centro da bandeira de chegada)

const GT = 536; // atalho para GROUND_TOP — Y do topo do chão

export default [
    null, // índice 0 reservado — fases usam índices 1 a 5

    // ──────────────────────────────── FASE 1 — Floresta ────────────────────────────────
    // Fase introdutória: sem hazards, sem plataformas móveis, chão contínuo.
    // Ensina ao jogador movimento, pulo duplo e ataque contra 6 inimigos.
    {
        tema:    1,                  // define o conjunto de texturas (plat_1, chao_1, bg_1)
        titulo:  'Fase 1 — Floresta',
        bgColor: 0x87CEEB,           // azul céu para o fundo do canvas
        mundoW:  4200,               // largura total do mundo em pixels

        chao: [
            [0, 4200], // chão contínuo do início ao fim (sem buracos)
        ],

        plataformas: [
            // Sequência de plataformas alternando altura para criar ritmo de parkour
            [280,  456, 128], [480,  376, 96],  [660,  456, 128],
            [860,  376, 128], [1060, 296, 128], [1260, 456, 128],
            [1440, 376, 96],  [1600, 456, 160], [1820, 376, 128],
            [2020, 296, 128], [2220, 376, 128], [2420, 456, 128],
            [2620, 376, 96],  [2800, 296, 128], [3000, 376, 128],
            [3200, 456, 128], [3400, 376, 128], [3600, 296, 128],
            [3800, 376, 128],
        ],

        inimigos: [
            // Distribuídos ao longo do percurso no nível do chão
            [560, GT - 20], [1160, GT - 20], [1720, GT - 20],
            [2320, GT - 20], [2920, GT - 20],
            [3300, 376 - 20], // inimigo em cima de uma plataforma
        ],

        moedas: [
            // Colocadas perto de plataformas para incentivar o jogador a explorar
            [340, 420], [530, 340], [720, 420],
            [920, 340], [1120, 260], [1300, 420],
            [1500, 340], [1660, 420], [1880, 340],
            [2080, 260], [2280, 340], [2480, 420],
            [2680, 340], [2860, 260], [3060, 340],
        ],

        checkpoints: [2000], // 1 checkpoint no meio da fase

        plataformasMoveis: [], // nenhuma plataforma móvel na fase 1

        hazards: [], // nenhum hazard na fase 1

        meta: [4000, GT - 48], // bandeira de chegada próximo ao fim do mapa
    },

    // ──────────────────────────────── FASE 2 — Deserto ─────────────────────────────────
    // Introduz buracos no chão que exigem pular sobre eles.
    // 3 plataformas móveis horizontais cobrem os gaps — é possível esperar ou pular.
    {
        tema:    2,
        titulo:  'Fase 2 — Deserto',
        bgColor: 0xDAA520, // dourado para o fundo do deserto
        mundoW:  4600,

        chao: [
            [0, 1100],    // trecho inicial
            [1200, 2200], // após o primeiro buraco
            [2400, 3400], // após o segundo buraco
            [3600, 4600], // trecho final
        ],

        plataformas: [
            // Plataformas de beira de buraco para facilitar a travessia
            [1100, 456, 96], [1000, 376, 96],
            [2200, 456, 96], [2100, 376, 96],
            [3400, 456, 96], [3300, 376, 96],

            // Plataformas distribuídas para parkour
            [300, 456, 128], [500, 376, 128],
            [700, 296, 128], [900, 376, 128],
            [1300, 456, 128], [1500, 376, 128],
            [1700, 296, 128], [1900, 376, 128],
            [2500, 456, 128], [2700, 376, 128],
            [2900, 296, 128],
            [3700, 456, 128], [3900, 376, 128],
            [4100, 296, 128],
        ],

        inimigos: [
            [600, GT - 20], [1400, GT - 20],
            [1800, GT - 20], [2600, GT - 20],
            [3000, 296 - 20], // inimigo em plataforma elevada
            [3800, GT - 20], [4200, 376 - 20],
        ],

        moedas: [
            [360, 420], [560, 340], [760, 260],
            [1360, 420], [1560, 340], [1760, 260],
            [2560, 420], [2760, 340], [2960, 260],
            [3760, 420], [3960, 340], [4160, 260],
        ],

        checkpoints: [2300], // checkpoint no meio do mapa

        // 3 plataformas móveis horizontais — cobrem os buracos no chão
        plataformasMoveis: [
            [1100, 456, 96, 'x', 90, 2000], // oscila 90px para a direita em 2s
            [2200, 456, 96, 'x', 90, 2000],
            [3400, 456, 96, 'x', 90, 2000],
        ],

        hazards: [], // sem zonas de perigo no deserto

        meta: [4350, GT - 48],
    },

    // ──────────────────────────────── FASE 3 — Água ─────────────────────────────────────
    // Introduz hazards de água: cair nos buracos causa dano.
    // 4 plataformas móveis cobrem as 4 zonas de água — exige timing preciso.
    {
        tema:    3,
        titulo:  'Fase 3 — Água',
        bgColor: 0x00BFFF, // azul celeste para o fundo aquático
        mundoW:  4800,

        chao: [
            [0, 700],     // trecho inicial
            [900, 1500],  // entre zonas de água
            [1700, 2400],
            [2700, 3400],
            [3700, 4800], // trecho final
        ],

        plataformas: [
            // Plataformas nas bordas das zonas de água
            [700, 456, 96], [800, 376, 96],
            [1500, 456, 96], [1600, 376, 96],
            [2400, 456, 96], [2500, 376, 96],
            [3400, 456, 96], [3500, 376, 96],

            // Plataformas de travessia no interior dos trechos de chão
            [300, 456, 128], [500, 376, 128],
            [1000, 376, 128], [1200, 296, 128],
            [1800, 376, 128], [2000, 296, 128],
            [2800, 376, 128], [3000, 296, 128],
            [3800, 376, 128], [4000, 296, 128],
            [4200, 376, 128],
        ],

        inimigos: [
            [400, GT - 20], [1100, 376 - 20],
            [1900, GT - 20], [2100, 296 - 20],
            [2900, GT - 20], [3100, 296 - 20],
            [4000, GT - 20], [4300, 376 - 20],
        ],

        moedas: [
            [360, 420], [550, 340],
            [1050, 340], [1250, 260],
            [1850, 340], [2050, 260],
            [2850, 340], [3050, 260],
            [3850, 340], [4050, 260],
        ],

        checkpoints: [2500],

        // 4 plataformas móveis — uma por zona de água
        plataformasMoveis: [
            [700,  456, 96, 'x', 120, 1800], // oscila 120px em 1.8s
            [1500, 456, 96, 'x', 120, 1800],
            [2400, 456, 96, 'x', 120, 1800],
            [3400, 456, 96, 'x', 120, 1800],
        ],

        // Zonas de água nos 4 buracos — contato causa dano e empurra para cima
        hazards: [
            [700,  900,  'agua'],
            [1500, 1700, 'agua'],
            [2400, 2700, 'agua'],
            [3400, 3700, 'agua'],
        ],

        meta: [4550, GT - 48],
    },

    // ──────────────────────────────── FASE 4 — Castelo ──────────────────────────────────
    // Layout de "torre de blocos": o jogador precisa escalar seções de 3 plataformas
    // em escada antes de cruzar para o próximo trecho de chão.
    // 3 plataformas móveis: 2 horizontais e 1 vertical para variar o desafio.
    {
        tema:    4,
        titulo:  'Fase 4 — Castelo',
        bgColor: 0x222244, // azul muito escuro para ambientação de masmorra
        mundoW:  5000,

        chao: [
            [0, 500],
            [700, 1300],
            [1600, 2200],
            [2500, 3200],
            [3500, 4200],
            [4500, 5000],
        ],

        plataformas: [
            // Escadas de 3 degraus sobre cada buraco (baixo → médio → alto)
            [500, 456, 96], [400, 376, 96], [300, 296, 96],
            [1300, 456, 96], [1200, 376, 96], [1100, 296, 96],
            [2200, 456, 96], [2100, 376, 96], [2000, 296, 96],
            [3200, 456, 96], [3100, 376, 96], [3000, 296, 96],
            [4200, 456, 96], [4100, 376, 96], [4000, 296, 96],

            // Plataformas de travessia dentro dos trechos de chão
            [200, 456, 128], [800, 456, 128], [900, 376, 128],
            [1700, 456, 128], [1800, 376, 128],
            [2600, 456, 128], [2700, 376, 128],
            [3600, 456, 128], [3700, 376, 128],
            [4600, 456, 128], [4700, 376, 128], [4800, 296, 128],
        ],

        inimigos: [
            [350, GT - 20], [900, GT - 20],
            [1400, 376 - 20], [1900, GT - 20],
            [2300, 296 - 20], [2700, GT - 20],
            [3300, 296 - 20], [3700, GT - 20],
            [4300, 376 - 20], [4800, 296 - 20],
        ],

        moedas: [
            [250, 420], [850, 420], [950, 340],
            [1750, 420], [1850, 340],
            [2650, 420], [2750, 340],
            [3650, 420], [3750, 340],
            [4650, 420], [4750, 340], [4850, 260],
        ],

        checkpoints: [2500],

        plataformasMoveis: [
            [500,  456, 96, 'x', 80, 1600], // horizontal: oscila 80px em 1.6s
            [1600, 456, 96, 'y', 60, 1800], // vertical: oscila 60px em 1.8s (único eixo Y)
            [3500, 456, 96, 'x', 80, 1600],
        ],

        hazards: [], // sem zonas de perigo no castelo

        meta: [4850, GT - 48],
    },

    // ──────────────────────────────── FASE 5 — Lava ──────────────────────────────────────
    // Fase final: 6 zonas de lava com plataformas menores (64px) e mais rápidas.
    // Exige precisão máxima nos saltos — a maioria das plataformas de borda também se move.
    {
        tema:    5,
        titulo:  'Fase 5 — Lava',
        bgColor: 0x330000, // vermelho muito escuro para ambientação vulcânica
        mundoW:  5500,

        chao: [
            [0, 500],
            [700, 1100],
            [1400, 1800],
            [2100, 2600],
            [2900, 3400],
            [3700, 4200],
            [4600, 5500], // trecho final com chegada
        ],

        plataformas: [
            // Plataformas pequenas (64px) nas bordas das zonas de lava
            [500,  456, 64], [600,  376, 64],
            [1100, 456, 64], [1200, 376, 64],
            [1800, 456, 64], [1900, 376, 64],
            [2600, 456, 64], [2700, 376, 64],
            [3400, 456, 64], [3500, 376, 64],
            [4200, 456, 64], [4300, 376, 64],

            // Plataformas flutuantes para respiro entre as zonas de lava
            [300,  376, 96], [900,  296, 96],
            [1600, 376, 96], [2200, 296, 96],
            [3000, 376, 96], [3600, 296, 96],
            [4700, 376, 96], [4900, 296, 96], [5100, 376, 96],
        ],

        inimigos: [
            [400,  GT - 20],  [950,  296 - 20],
            [1500, GT - 20],  [2000, GT - 20],
            [2250, 296 - 20], [3050, GT - 20],
            [3650, 296 - 20], [4250, GT - 20],
            [4800, 376 - 20], [5200, 376 - 20],
        ],

        moedas: [
            [350, 340], [950,  260],
            [1650, 340], [2250, 260],
            [3050, 340], [3650, 260],
            [4300, 420], [4800, 340],
            [5000, 260], [5200, 340],
        ],

        checkpoints: [2800], // checkpoint após a metade das zonas de lava

        // 6 plataformas móveis — uma por zona de lava (a maioria horizontal, 1 vertical)
        plataformasMoveis: [
            [500,  456, 64, 'x', 70, 1500], // oscila 70px em 1.5s
            [1100, 456, 64, 'x', 70, 1500],
            [1800, 456, 64, 'x', 70, 1500],
            [2600, 456, 64, 'x', 70, 1500],
            [3400, 456, 64, 'y', 60, 1400], // única plataforma vertical da fase
            [4200, 456, 64, 'x', 70, 1500],
        ],

        // 6 zonas de lava correspondendo a cada buraco no chão
        hazards: [
            [500,  700,  'lava'],
            [1100, 1400, 'lava'],
            [1800, 2100, 'lava'],
            [2600, 2900, 'lava'],
            [3400, 3700, 'lava'],
            [4200, 4600, 'lava'],
        ],

        meta: [5250, GT - 48], // bandeira de chegada antes do fim do mapa
    },
];
