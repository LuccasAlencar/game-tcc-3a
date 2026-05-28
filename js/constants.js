// ─── Categorias de colisão Matter.js ──────────────────────────────────────────
// Cada categoria é um bit único; combinados em máscara para definir quem colide com quem
export const CAT_PLAYER   = 0x0001; // categoria do jogador
export const CAT_PLATFORM = 0x0002; // categoria de plataformas, chão e paredes
export const CAT_ENEMY    = 0x0004; // categoria dos inimigos
export const CAT_ITEM     = 0x0008; // categoria de itens (reservado para uso futuro)

// ─── Medidas ───────────────────────────────────────────────────────────────────
export const TILE = 32; // tamanho de um tile em pixels (base do grid do mapa)

// ─── Combate e dano ────────────────────────────────────────────────────────────
export const INVINCIBLE_DURATION = 1600; // duração do período de invencibilidade após receber dano (ms)

// ─── Física do jogador ─────────────────────────────────────────────────────────
export const GRAVITY_Y = 1.0;  // força da gravidade vertical no Matter.js
export const VY_PULO   = -14;  // velocidade Y aplicada ao pular (negativo = para cima)
export const VEL_X     = 7;    // velocidade horizontal máxima do jogador em px/frame

// ─── Dimensões do mundo ────────────────────────────────────────────────────────
export const MUNDO_H    = 600; // altura total do mundo em pixels
export const GROUND_TOP = 536; // posição Y do topo do chão (MUNDO_H - espessura do chão)
