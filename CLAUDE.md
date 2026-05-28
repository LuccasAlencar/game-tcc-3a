# Parkour Hero — Claude Code Context

Jogo de parkour 2D com inimigos, sistema de dano, múltiplas fases e HUD.
Stack: **HTML + CSS + JS puro**, **Phaser 3.60** (via CDN), **Matter.js** (embutido no Phaser).

## Estrutura do Projeto

```
parkour-hero/
├── CLAUDE.md
├── index.html              ← entry point (carrega o Phaser e os scripts)
├── js/
│   ├── config.js           ← configuração global do Phaser (width, physics, scenes)
│   ├── constants.js        ← constantes compartilhadas (CAT_*, TILE, WORLD_*, etc.)
│   ├── scenes/
│   │   ├── BootScene.js    ← gera todas as texturas via Graphics (sem assets externos)
│   │   ├── MenuScene.js    ← tela inicial e seleção de fase
│   │   ├── GameScene.js    ← lógica principal: mapa, jogador, inimigos, câmera
│   │   ├── UIScene.js      ← HUD (corações, pontuação) — roda em paralelo com GameScene
│   │   └── GameOverScene.js← tela de game over e vitória
│   └── entities/
│       ├── Player.js       ← classe Player: movimento, pulo duplo, ataque, dano
│       └── Enemy.js        ← classe Enemy: patrulha, HP, barra de vida, morte
├── assets/
│   ├── sprites/            ← PNGs opcionais (fallback: texturas geradas no BootScene)
│   └── sounds/             ← MP3/OGG para sfx e música
└── css/
    └── style.css           ← estilos mínimos do container do jogo
```

## Comandos Comuns

Não há build step — abrir `index.html` diretamente no navegador.

```bash
# Servidor local simples (necessário para imports ES modules)
npx serve .
# ou
python3 -m http.server 8080
```

## Física — Matter.js via Phaser

- Motor: `physics: { default: 'matter', matter: { gravity: { y: 2.2 }, debug: false } }`
- **Nunca usar** `this.physics` (Arcade) — sempre `this.matter`
- Plataformas são `isStatic: true`
- Jogador usa **corpo composto** (corpo principal + sensor de pé `isSensor: true`)
- `setFixedRotation()` é obrigatório em Player e Enemy para não tombarem
- Detecção de chão via `collisionstart` / `collisionend` no `matter.world`
- Filtros de colisão definidos em `constants.js`: `CAT_PLAYER`, `CAT_PLATFORM`, `CAT_ENEMY`

## Categorias de Colisão (constants.js)

```js
export const CAT_PLAYER   = 0x0001;
export const CAT_PLATFORM = 0x0002;
export const CAT_ENEMY    = 0x0004;
```

- Player colide com: `CAT_PLATFORM`
- Enemy colide com: `CAT_PLATFORM`
- Dano player↔enemy é verificado por distância (`Phaser.Math.Distance.Between`), não por colisão física

## Convenções de Código

- ES Modules com `import/export` — sem CommonJS (`require`)
- Classes para entidades: `Player`, `Enemy` recebem `scene` como primeiro argumento
- Nomes de variáveis e funções em **camelCase** em português (ex: `criarJogador`, `levaDano`)
- Nomes de arquivos em **PascalCase** para classes/scenes, **camelCase** para utils
- Comentários em português
- Sem TypeScript — JS puro com JSDoc quando necessário

## Cenas e Ciclo de Vida

| Cena | Função |
|---|---|
| `BootScene` | Gera texturas com `Graphics.generateTexture()`, depois vai para `MenuScene` |
| `MenuScene` | Tela inicial; `scene.start('GameScene', { fase: 1 })` |
| `GameScene` | Lógica principal; lança `UIScene` com `scene.launch('UIScene')` |
| `UIScene` | HUD fixo; recebe dados via `scene.get('UIScene').atualizarHP(hp, max)` |
| `GameOverScene` | Game over ou vitória; botão para reiniciar |

## Funcionalidades Planejadas

- [x] Movimento com aceleração/desaceleração
- [x] Pulo duplo
- [x] Ataque (soco) com knockback e partículas
- [x] Sistema de vida com período de invencibilidade
- [x] Inimigos com patrulha e barra de HP
- [x] Câmera suave com deadzone e parallax
- [ ] Sons (sfx de pulo, ataque, dano, morte)
- [ ] Animações via spritesheet
- [x] Itens coletáveis (moedas, power-ups)
- [x] Sistema de fases múltiplas com `MenuScene`
- [x] Checkpoints
- [x] Plataformas móveis com tweens
- [x] Save via `localStorage` (pontuação e fase)
- [x] Scoreboard local

## Gotchas e Decisões de Arquitetura

- **Y negativo = para cima.** `setVelocityY(-13)` faz o jogador pular.
- **Texturas geradas no BootScene** — não há arquivos de imagem; se adicionar sprites, carregar no `preload()` do BootScene e manter o fallback gerado.
- **UIScene não segue a câmera** — por rodar em paralelo sem estar vinculada ao `cameras.main` do GameScene.
- **`debug: true`** no matter config mostra todas as hitboxes — ativar para debugar física.
- **`pixelArt: true` e `roundPixels: true`** no config — nunca remover, garante visual nítido.
- **Período de invencibilidade pós-dano:** 1600ms — ajustar em `Player.js` na constante `INVINCIBLE_DURATION`.
- Sons devem ter fallback silencioso se o arquivo não existir (usar `this.sound.add` com `{ loop: false }` dentro de try/catch ou verificar `this.cache.audio.exists`).
- `CLAUDE.local.md` existe para anotações pessoais — não commitar.
