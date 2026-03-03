/**
 * BacanGame.jsx  —  Bacan Jungle Run  🍔
 * 
 */
import Phaser from 'phaser';
import { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import jaggySheet from '../assets/jaggy_sheet.png';
import alienSheet from '../assets/alien_sheet.png';
import burgerSheet from '../assets/burger_sheet.png';

// ─── Resolución interna ───────────────────────────────────────────────────────
// 480×270 = 16:9, suficiente espacio para que todo se vea proporcional
const GW = 480;
const GH = 270;

// ─── Spritesheets ─────────────────────────────────────────────────────────────
// 
const JAGGY_FW    = 290;   // 
const JAGGY_FH    = 360;
const JAGGY_SCALE = 0.09;  // ajustado para tamaño cómodo en mobile

// Alien: 160×192 por frame → se muestra a ~24px de alto
const ALIEN_FW    = 160;
const ALIEN_FH    = 192;
const ALIEN_SCALE = 0.135;   // algo más grande para que se vean mejor

// Burger: 128×112 por frame → se muestra a ~11–12px de alto
const BURGER_FW    = 128;
const BURGER_FH    = 112;
const BURGER_SCALE = 0.11;   // acompaña el nuevo tamaño general

// ─── Física ──────────────────────────────────────────────────────────────────
const GRAVITY    = 900;
const JUMP_VEL   = -390;
const FALL_BOOST = 400;
const WALK_SPD   = 140;

// ─── Escala horizontal de nivel ─────────────────────────────────────────────
// Factor >1 separa más plataformas, aliens y burgers sin cambiar el tamaño de la cámara.
const X_SCALE = 1;
// ─── Niveles ─────────────────────────────────────────────────────────────────
const LEVELS = [
  { num:1, label:'JUNGLA',       time:60, aliens:2, alienSpd:45, burgerGoal:3, bgTop:0x0a1f0a, bgBot:0x1a3d0f },
  { num:2, label:'OSCURIDAD', time:40, aliens:4, alienSpd:65, burgerGoal:5, bgTop:0x050f18, bgBot:0x0a2035 },
  { num:3, label:'INFIERNO',    time:30, aliens:6, alienSpd:88, burgerGoal:9, bgTop:0x1a0500, bgBot:0x3d0f00 },
];

const DISCOUNT_CODE = 'JAGGY20';

// ════════════════════════════════════════════════════════════════════════════
// BOOT SCENE
// ════════════════════════════════════════════════════════════════════════════
class BootScene extends Phaser.Scene {
  constructor() { super({ key:'BootScene' }); }

  preload() {
    // Jaggy: spritesheet con 10 frames (0–9)
    this.load.spritesheet('jaggy', jaggySheet, {
      frameWidth: JAGGY_FW,
      frameHeight: JAGGY_FH,
    });

    // Alien
    this.load.spritesheet('alien', alienSheet, {
      frameWidth: ALIEN_FW,
      frameHeight: ALIEN_FH,
    });

    // Burger
    this.load.spritesheet('burger', burgerSheet, {
      frameWidth: BURGER_FW,
      frameHeight: BURGER_FH,
    });
  }

   create() {
  this._genEnvAssets();
  this._registerAnims();
  console.log('¿Existe jaggy_idle?', this.anims.exists('jaggy_idle'));
  console.log([...this.anims.anims.keys()]);
  this.scene.start('GameScene', { levelIndex:0, totalScore:0 });
   }

  // Solo genera texturas de entorno (tiles, árboles, nubes, portal)
  // alien y burger vienen de sus spritesheets — NO se tocan acá
  _genEnvAssets() {
    const g = this.make.graphics({ add:false });
    const P = 2;
    const px = (x,y,c) => { g.fillStyle(c); g.fillRect(x*P, y*P, P, P); };

    // Tile suelo jungla 8×8 → 16×16
    g.clear();
    for (let x=0;x<8;x++) for (let y=0;y<8;y++)
      px(x, y, (x+y)%2===0 ? 0x3d8a20 : 0x2d6b15);
    for (let x=0;x<8;x++) px(x, 0, 0x5aaa30);
    g.generateTexture('ground_tile', 16, 16);

    // Tile plataforma madera 8×4 → 16×8
    g.clear();
    for (let x=0;x<8;x++) for (let y=0;y<4;y++) {
      const c = y===0 ? 0x6aaa30 : y===3 ? 0x3d2000 : (x%3===0 ? 0x5c3010 : 0x7a4520);
      px(x, y, c);
    }
    g.generateTexture('plat_tile', 16, 8);

    // Portal / bandera 12×20 → 24×40
    g.clear();
    for (let y=0;y<=19;y++) px(5,y,0xf5c518);
    px(4,19,0xf5c518); px(6,19,0xf5c518); px(3,19,0xd4780a); px(7,19,0xd4780a);
    for (let x=6;x<=11;x++) for (let y=0;y<=7;y++) px(x, y, y<4?0xf97316:0xffffff);
    px(8,2,0xf5c518); px(9,1,0xf5c518); px(9,3,0xf5c518);
    g.generateTexture('portal', 24, 40);

    // Árbol 24×32 → 48×64
    g.clear();
    for (let y=18;y<=31;y++) { px(10,y,0x5c3010); px(11,y,0x7a4520); px(12,y,0x5c3010); }
    for (let x=6;x<=17;x++) for (let y=6;y<=18;y++) px(x,y,0x1a6b0a);
    for (let x=4;x<=19;x++) for (let y=10;y<=18;y++) px(x,y,0x2a8a15);
    for (let x=8;x<=15;x++) for (let y=2;y<=10;y++) px(x,y,0x3aa520);
    for (let x=6;x<=17;x++) px(x,18,0x0d3a05);
    g.generateTexture('tree', 48, 64);

    // Nube 10×5 → 20×10
    g.clear();
    for (let x=3;x<=7;x++) px(x,0,0xffffff);
    for (let x=1;x<=9;x++) { px(x,1,0xffffff); px(x,2,0xffffff); }
    for (let x=0;x<=9;x++) px(x,3,0xddddff);
    g.generateTexture('cloud', 20, 10);

    g.destroy();
  }

  _registerAnims() {
    // ── Jaggy ── (spritesheet 0–9)
    if (!this.anims.exists('jaggy_idle'))
      this.anims.create({
        key: 'jaggy_idle',
        frames: [{ key:'jaggy', frame:0 }],
        frameRate: 2,
        repeat: -1,
      });
    if (!this.anims.exists('jaggy_walk'))
      this.anims.create({
        key: 'jaggy_walk',
        frames: this.anims.generateFrameNumbers('jaggy', { frames:[1,2,3,4,5,6] }),
        frameRate: 10,
        repeat: -1,
      });
    if (!this.anims.exists('jaggy_jump'))
      this.anims.create({
        key: 'jaggy_jump',
        frames: this.anims.generateFrameNumbers('jaggy', { frames:[7,8] }),
        frameRate: 6,
        repeat: 0,
      });
    if (!this.anims.exists('jaggy_win'))
      this.anims.create({
        key: 'jaggy_win',
        frames: [{ key:'jaggy', frame:9 }],
        frameRate: 1,
        repeat: 0,
      });

    // ── Alien ── (key: 'alien', 0=idle 1=walk_a 2=walk_b 3=hurt)
    if (!this.anims.exists('alien_idle'))
      this.anims.create({ key:'alien_idle', frames:this.anims.generateFrameNumbers('alien',{start:0,end:0}), frameRate:2, repeat:-1 });
    if (!this.anims.exists('alien_walk'))
      this.anims.create({ key:'alien_walk', frames:this.anims.generateFrameNumbers('alien',{frames:[1,2,1,2]}), frameRate:8, repeat:-1 });
    if (!this.anims.exists('alien_hurt'))
      this.anims.create({ key:'alien_hurt', frames:this.anims.generateFrameNumbers('alien',{start:3,end:3}), frameRate:1, repeat:0 });

    // ── Burger ── (key: 'burger', 0=normal 1=float_up 2=collected)
    if (!this.anims.exists('burger_float'))
      this.anims.create({ key:'burger_float', frames:this.anims.generateFrameNumbers('burger',{frames:[0,1,0]}), frameRate:3, repeat:-1 });
    if (!this.anims.exists('burger_collect'))
      this.anims.create({ key:'burger_collect', frames:this.anims.generateFrameNumbers('burger',{start:2,end:2}), frameRate:1, repeat:0 });
  }
}

// ════════════════════════════════════════════════════════════════════════════
// GAME SCENE
// ════════════════════════════════════════════════════════════════════════════
class GameScene extends Phaser.Scene {
  constructor() { super({ key:'GameScene' }); }

  init(data) {
    this.levelIndex  = data.levelIndex  ?? 0;
    this.totalScore  = data.totalScore  ?? 0;
    this.lvl         = LEVELS[this.levelIndex];
    this.timeLeft    = this.lvl.time;
    this.burgerCount = 0;
    this._jumped     = false;
    this._dead       = false;
    this._win        = false;
    // _tk vive en la instancia del juego — persiste entre escenas
    if (!this.game._tk) this.game._tk = { left:false, right:false, jump:false };
    this.tk = this.game._tk;
  }

create() {
  this.cameras.main.setRoundPixels(true);
  const WW = GW * 2; // ejemplo: mundo más chico

  this._buildBG(WW);
  this._buildLevel(WW);
  this._buildPlayer();
  this._buildAliens();
  this._buildBurgers();

  // Portal creado antes de las colisiones para que el overlap se registre
  this._buildPortal(WW);

  // Camera y physics bounds
  this._setupCamera(WW);

  // Colisiones (ahora sí la overlap con this.portal funcionará)
  this._setupCollisions();

  this._setupInput();
  this._buildHUD();

  this.cameras.main.fadeIn(300,0,0,0);
  this._timerEv = this.time.addEvent({ delay:1000, callback:this._tick, callbackScope:this, loop:true });
}
  update() {
    if (this._dead || this._win) return;
    this._handleMove();
    this._patrolAliens();
    this._updateHUD();
  }

  // ── FONDO ─────────────────────────────────────────────────────────────────
  _buildBG(WW) {
    const { bgTop, bgBot } = this.lvl;
    const sky = this.add.graphics().setScrollFactor(0).setDepth(0);
    for (let i=0; i<14; i++) {
      const t = i/14;
      const lerp = (a,b) => Math.round(a+(b-a)*t);
      const r=lerp((bgTop>>16)&0xff,(bgBot>>16)&0xff);
      const gv=lerp((bgTop>>8)&0xff,(bgBot>>8)&0xff);
      const b=lerp(bgTop&0xff,bgBot&0xff);
      sky.fillStyle((r<<16)|(gv<<8)|b);
      sky.fillRect(0,(GH/14)*i,GW,(GH/14)+1);
    }

    // Nubes
    for (let i=0;i<12;i++)
      this.add.image(Phaser.Math.Between(0,WW), Phaser.Math.Between(10,GH*0.4),'cloud')
        .setDepth(1).setScrollFactor(0.2).setAlpha(0.75);

    // Árboles de fondo (parallax)
    for (let x=40; x<WW; x+=Phaser.Math.Between(90,150))
      this.add.image(x, GH-16,'tree').setOrigin(0.5,1).setDepth(2)
        .setScrollFactor(0.45).setAlpha(0.55)
        .setScale(Phaser.Math.FloatBetween(0.6,1.1));

    // Partículas
    for (let i=0;i<20;i++) {
      const dot = this.add.rectangle(
        Phaser.Math.Between(0,WW), Phaser.Math.Between(10,GH-30),
        2,2, this.levelIndex===2?0xff6600:0x88ff88, 0.8
      ).setDepth(2);
      this.tweens.add({ targets:dot, y:dot.y-Phaser.Math.Between(15,40),
        alpha:0, duration:Phaser.Math.Between(1500,4000),
        repeat:-1, yoyo:true, delay:Phaser.Math.Between(0,3000) });
    }

    // Suelo visual
    const tc = Math.ceil(WW/16)+1;
    for (let i=0;i<tc;i++) {
      this.add.image(i*16+8, GH-8,  'ground_tile').setDepth(3);
      this.add.image(i*16+8, GH+8,  'ground_tile').setDepth(3).setAlpha(0.5);
    }
  }

  // ── NIVEL (tiles + física) ────────────────────────────────────────────────
_buildLevel(WW) {
  this.platforms = this.physics.add.staticGroup();

  // Suelo físico invisible
  const gnd = this.add.rectangle(WW/2, GH-4, WW+64, 16, 0,0);
  this.physics.add.existing(gnd, true);
  this.platforms.add(gnd);

  const defs = [
    [30,  GH-52, 4],  [110, GH-78, 4], [195, GH-54, 4],
    [280, GH-86, 4],  [365, GH-60, 4], [450, GH-92, 4],
    [535, GH-62, 4], 
  ];

  this.platformDefs = defs;

  // Variables para la última plataforma en coordenadas del mundo (borde superior)
  let lastWorldLeft = 0, lastWorldY = GH - 16, lastWorldWidth = 0;

  defs.forEach(([xs, y, tc], defIndex) => {
    const baseX = xs * X_SCALE;
    for (let i = 0; i < tc; i++) {
      // calculo del centro del tile (coincide con cómo lo creabas antes)
      const tileCenterX = baseX + i * 16 * X_SCALE + 8;
      const t = this.add.image(tileCenterX, y, 'plat_tile').setDepth(3);
      this.physics.add.existing(t, true);
      this.platforms.add(t);

      // si es la última tile de la última definición, guardamos el borde superior real
      if (defIndex === defs.length - 1 && i === tc - 1) {
        lastWorldLeft = tileCenterX - (16 * X_SCALE) / 2; // borde izquierdo de la última tile
        // y es el centro de la plataforma (8px de alto), así que el borde superior es y - 4
        lastWorldY = y - 4;
        lastWorldWidth = tc * 16 * X_SCALE;
      }
    }
  });

  this.lastPlatformWorld = { x: lastWorldLeft, y: lastWorldY, width: lastWorldWidth };
}

  // ── PLAYER ────────────────────────────────────────────────────────────────
  _buildPlayer() {
    this.player = this.physics.add.sprite(32, GH-60, 'jaggy', 0);
    this.player.setDepth(5).setOrigin(0.5,1).setScale(JAGGY_SCALE);
    this.player.setCollideWorldBounds(false);
    // Hitbox: cuerpo visible ≈ 40% del ancho del frame, 60% del alto
    this.player.setBodySize(JAGGY_FW*0.40, JAGGY_FH*0.58);
    this.player.setOffset(JAGGY_FW*0.30, JAGGY_FH*0.32);
    this.player.anims.play('jaggy_idle');
  }

  // ── ALIENS ────────────────────────────────────────────────────────────────
  _buildAliens() {
    this.aliens = this.physics.add.group();

    const slots = [
      {x:125, y:GH-40, l:108, r:185},
      {x:290, y:GH-40, l:272, r:350},
      {x:378, y:GH-40, l:360, r:440},
      {x:548, y:GH-40, l:525, r:608},
      {x:718, y:GH-40, l:700, r:775},
      {x:878, y:GH-40, l:860, r:940},
    ];

    // Aplicamos X_SCALE para que las patrullas queden más separadas
    slots.slice(0, this.lvl.aliens).forEach(({x,y,l,r}) => {
      const sx = x * X_SCALE;
      const sl = l * X_SCALE;
      const sr = r * X_SCALE;
      const a = this.aliens.create(sx, y, 'alien', 0);
      a.setDepth(4).setOrigin(0.5,1).setScale(ALIEN_SCALE);
      // Hitbox: cuerpo visible del alien
      a.setBodySize(ALIEN_FW*0.55, ALIEN_FH*0.70);
      a.setOffset(ALIEN_FW*0.225, ALIEN_FH*0.22);
      a.setCollideWorldBounds(false);
      a.setVelocityX(this.lvl.alienSpd);
      a.patrolLeft=sl; a.patrolRight=sr;
      a.anims.play('alien_walk');
    });
  }

  // ── BURGERS ───────────────────────────────────────────────────────────────
  _buildBurgers() {
    this.burgers = this.physics.add.staticGroup();

    // Burgers: mezcla de plataformas y suelo para que siempre haya algo que recoger
    const platformPos = (this.platformDefs || []).map(([xs,y,tc]) => {
      const centerX = xs + (tc*16)/2;
      const offsetY = y - 22;
      return [centerX, offsetY];
    });

    // seleccionamos algunas plataformas concretas para no sobrecargar
    const sampledPlat = [
      platformPos[0],
      platformPos[2],
      platformPos[4],
      platformPos[6],
      platformPos[8],
    ].filter(Boolean);

    // Burgers en el suelo, alineadas con huecos entre plataformas
    const groundPos = [
      [80,  GH-24],
      [220, GH-24],
      [360, GH-24],
      [500, GH-24],
      [640, GH-24],
      [780, GH-24],
      [920, GH-24],
    ];

    const pos = [...sampledPlat, ...groundPos];

    // Usamos X_SCALE también aquí para alinear con las plataformas
    pos.forEach(([x,y]) => {
      const sx = x * X_SCALE;
      const b = this.burgers.create(sx, y, 'burger', 0);
      b.setDepth(4).setScale(BURGER_SCALE);
      // Hitbox más pequeño y centrado para que no se recojan "a distancia"
      b.setBodySize(BURGER_FW*0.45, BURGER_FH*0.40);
      b.setOffset(BURGER_FW*0.275, BURGER_FH*0.30);
      b.anims.play('burger_float');
    });
  }

  // ── PORTAL ────────────────────────────────────────────────────────────────
  _buildPortal(WW) {
    // Queremos que el portal apoye VISUALMENTE sobre el suelo del juego,
    // no flotando con respecto a la última plataforma.
    // El suelo visual (tiles `ground_tile`) se dibuja con centro en GH-8 y alto 16px,
    // por lo que su borde superior está en GH-16.
    const groundTopY = GH - 16;

    // Usamos la última plataforma solo para decidir la X aproximada (un poco después),
    // pero el Y siempre será el del suelo.
    if (this.lastPlatformWorld && this.lastPlatformWorld.width > 0) {
      const px = this.lastPlatformWorld.x + this.lastPlatformWorld.width + 256;
      const py = groundTopY;
      this._createPortalAt(px, py);
    } else {
      // fallback: al borde del mundo sobre el suelo
      const px = WW - 36;
      const py = groundTopY;
      this._createPortalAt(px, py);
    }
  }

_createPortalAt(px, py) {
  if (this.portal) {
    this.portal.destroy();
  }

  // Origin 0.5,1 para que "apoye" sobre la plataforma/suelo
  this.portal = this.physics.add.staticSprite(px, py, 'portal')
    .setDepth(1)
    .setOrigin(0.5, 1);

  // Ajustar el cuerpo de colisión para mayor fiabilidad
  const w = Math.round(this.portal.displayWidth * 0.8);
  const h = Math.round(this.portal.displayHeight * 0.9);
  this.portal.body.setSize(w, h);
  this.portal.refreshBody();

  this.tweens.add({
    targets: this.portal,
    alpha: 0.5,
    duration: 600,
    yoyo: true,
    repeat: -1
  });

  // Texto indicador (centro sobre el portal)
  this.add.text(px, py - 48, 'META', {
    fontSize: '8px',
    fontFamily: '"Press Start 2P", monospace',
    color: '#FAB910',
    stroke: '#000',
    strokeThickness: 2,
  }).setOrigin(0.5).setDepth(1);
}

  // ── CÁMARA ────────────────────────────────────────────────────────────────
_setupCamera(WW) {
  this.cameras.main.setBounds(0, 0, WW, GH);
  this.physics.world.setBounds(0, 0, WW, GH);
  this.cameras.main.startFollow(this.player, true, 0.08, 0.08);
}

  // ── COLISIONES ────────────────────────────────────────────────────────────
  _setupCollisions() {
    this.physics.add.collider(this.player, this.platforms);
    this.physics.add.collider(this.aliens,  this.platforms);
    this.physics.add.overlap(this.player, this.burgers, this._onBurger, null, this);
    this.physics.add.overlap(this.player, this.aliens,  this._onAlien,  null, this);
    this.physics.add.overlap(this.player, this.portal,  this._onPortal, null, this);
  }

  // ── INPUT ─────────────────────────────────────────────────────────────────
  _setupInput() {
    this.cursors = this.input.keyboard.createCursorKeys();
    this.wasd = this.input.keyboard.addKeys({
      left:  Phaser.Input.Keyboard.KeyCodes.A,
      right: Phaser.Input.Keyboard.KeyCodes.D,
      up:    Phaser.Input.Keyboard.KeyCodes.W,
      space: Phaser.Input.Keyboard.KeyCodes.SPACE,
    });
  }

  // ── HUD ───────────────────────────────────────────────────────────────────
  _buildHUD() {
    const st = (sz,col='#FAB910') => ({
      fontSize:`${sz}px`, fontFamily:'"Press Start 2P",monospace',
      color:col, stroke:'#000000', strokeThickness:3,
    });
    this.hudBurger = this.add.text(6,4,`🍔 0/${this.lvl.burgerGoal}`,st(7))
      .setScrollFactor(0).setDepth(20);
    this.hudTime = this.add.text(GW-6,4,`⏱${this.timeLeft}`,st(7))
      .setScrollFactor(0).setDepth(20).setOrigin(1,0);
    this.hudLevel = this.add.text(GW/2,4,`NV${this.lvl.num} ${this.lvl.label}`,st(6,'#aaffaa'))
      .setScrollFactor(0).setDepth(20).setOrigin(0.5,0);
    this.add.rectangle(GW/2,18,GW-8,5,0x222222).setScrollFactor(0).setDepth(19).setOrigin(0.5,0);
    this.timerBar = this.add.rectangle(4,18,GW-8,5,0x22cc44).setScrollFactor(0).setDepth(20).setOrigin(0,0);
    this.needTxt = this.add.text(GW/2,GH-18,'',st(7,'#ff6666'))
      .setScrollFactor(0).setDepth(20).setOrigin(0.5,0).setAlpha(0);
  }

  _updateHUD() {
    const r = Math.max(0,this.timeLeft/this.lvl.time);
    this.timerBar.setSize((GW-8)*r,5);
    this.timerBar.setFillStyle(r>0.5?0x22cc44:r>0.25?0xffaa00:0xff3333);
  }

  // ── CALLBACKS ─────────────────────────────────────────────────────────────
  _tick() {
    this.timeLeft--;
    this.hudTime.setText(`⏱${this.timeLeft}`);
    if (this.timeLeft<=0) this._respawn();
  }

  _onBurger(player, burger) {
    // Evita contar múltiples veces la misma burger si el overlap se dispara repetido
    if (!burger.active) return;
    burger.setActive(false);
    if (burger.body) burger.body.enable = false;

    burger.anims.play('burger_collect');
    this.time.delayedCall(180, ()=>{ burger.destroy(); });
    this.burgerCount++;
    this.totalScore += 1;
    this.hudBurger.setText(`🍔 ${this.burgerCount}/${this.lvl.burgerGoal}`);
    this.game.events.emit('scoreUpdate', this.totalScore);
    const pop = this.add.text(player.x, player.y-14, '+1', {
      fontSize:'7px', fontFamily:'"Press Start 2P",monospace',
      color:'#FAB910', stroke:'#000', strokeThickness:2,
    }).setDepth(30).setOrigin(0.5);
    this.tweens.add({ targets:pop, y:pop.y-22, alpha:0, duration:700, onComplete:()=>pop.destroy() });

    // Efecto sutil: halo alrededor del jugador en vez de pantallazo
    const halo = this.add.circle(player.x, player.y-18, 10, 0xFAB910, 0.4)
      .setDepth(29);
    this.tweens.add({
      targets: halo,
      scale: 1.8,
      alpha: 0,
      duration: 220,
      onComplete: () => halo.destroy(),
    });
  }

  _onAlien(player, alien) {
    if (this._dead) return;
    alien.anims.play('alien_hurt');
    this.time.delayedCall(280,()=>{ if(alien?.active) alien.anims.play('alien_walk'); });
    this._respawn();
  }

  _onPortal() {
    if (this._win) return;
    if (this.burgerCount < this.lvl.burgerGoal) {
      const need = this.lvl.burgerGoal - this.burgerCount;
      this.needTxt.setText(`¡FALTAN 🍔 ×${need}!`);
      this.needTxt.setAlpha(1);
      this.tweens.killTweensOf(this.needTxt);
      this.tweens.add({ targets:this.needTxt, alpha:0, delay:1800, duration:400 });
      this.player.setVelocityX(-90);
      return;
    }
    this._win = true;
    this._timerEv?.remove();
    this.player.anims.play('jaggy_win');
    this.cameras.main.flash(400,255,220,100);
    this.cameras.main.fadeOut(700,0,0,0);
    this.time.delayedCall(750,()=>{
      this.game.events.emit('levelComplete',{level:this.levelIndex+1,score:this.totalScore});
      const next = this.levelIndex+1;
      if (next<LEVELS.length) this.scene.start('GameScene',{levelIndex:next,totalScore:this.totalScore});
      else this.scene.start('WinScene',{score:this.totalScore});
    });
  }

  _respawn() {
    if (this._dead) return;
    this._dead = true;
    this.cameras.main.shake(180,0.014);
    this.cameras.main.flash(100,220,30,30);
    this.time.delayedCall(320,()=>{
      this.game.events.emit('restartGame');
      this.scene.start('BootScene');
    });
  }

  // ── MOVIMIENTO ────────────────────────────────────────────────────────────
  _handleMove() {
    const c=this.cursors, w=this.wasd, tk=this.tk;
    const goL  = c.left.isDown  || w.left.isDown  || tk.left;
    const goR  = c.right.isDown || w.right.isDown || tk.right;
    const goJ  = c.up.isDown    || w.up.isDown    || w.space.isDown || tk.jump;
    const grnd = this.player.body.blocked.down;

    if (goL) {
      this.player.setVelocityX(-WALK_SPD);
      this.player.setFlipX(false);
      if (grnd) this.player.anims.play('jaggy_walk',true);
    } else if (goR) {
      this.player.setVelocityX(WALK_SPD);
      this.player.setFlipX(true);
      if (grnd) this.player.anims.play('jaggy_walk',true);
    } else {
      this.player.setVelocityX(0);
      if (grnd) this.player.anims.play('jaggy_idle',true);
    }

    if (goJ && grnd && !this._jumped) {
      this.player.setVelocityY(JUMP_VEL);
      this.player.anims.play('jaggy_jump',true);
      this._jumped = true;
    }
    if (!goJ) this._jumped = false;

    if (!grnd && this.player.body.velocity.y>0)
      this.player.body.setGravityY(FALL_BOOST);
    else
      this.player.body.setGravityY(0);

    if (this.player.y > GH+80) this._respawn();
  }

  _patrolAliens() {
    const spd = this.lvl.alienSpd;
    this.aliens.getChildren().forEach(a=>{
      if (!a.body) return;

      // Si por alguna razón quedó parado, volvemos a darle velocidad
      if (a.body.velocity.x === 0) {
        a.setVelocityX(spd);
      }

      if      (a.x>=a.patrolRight) { a.setVelocityX(-spd); a.setFlipX(true);  }
      else if (a.x<=a.patrolLeft)  { a.setVelocityX( spd); a.setFlipX(false); }
    });
  }
}

// ════════════════════════════════════════════════════════════════════════════
// WIN SCENE
// ════════════════════════════════════════════════════════════════════════════
class WinScene extends Phaser.Scene {
  constructor() {
    super({ key: 'WinScene' });
  }

  init(data = {}) {
    // Prefer passing these via data for testability and reuse
    this.finalScore = data.score ?? 0;
    this.GW = data.gw ?? GW;
    this.GH = data.gh ?? GH;
    this.DISCOUNT_CODE = data.discountCode ?? DISCOUNT_CODE;
    this.JAGGY_SCALE = data.jaggyScale ?? JAGGY_SCALE;
  }

  create() {
    const { GW, GH } = this;
    this.cameras.main.fadeIn(500, 0, 0, 0);

    // Background + particles (draw first so UI sits above)
    this.bgGraphics = this.add.graphics().setDepth(0);
    this.bgGraphics.fillStyle(0x050a05);
    this.bgGraphics.fillRect(0, 0, GW, GH);

    const cols = [0xFAB910, 0x562373, 0xf97316, 0x22c55e, 0xff4488, 0x00aaff];
    const dotSize = 3;
    for (let i = 0; i < 120; i++) {
      this.bgGraphics.fillStyle(Phaser.Math.RND.pick(cols));
      const x = Phaser.Math.Between(0, GW - dotSize);
      const y = Phaser.Math.Between(0, GH - dotSize);
      this.bgGraphics.fillRect(x, y, dotSize, dotSize);
    }

    // Optional portal builder (keep if implemented elsewhere)
    if (typeof this._buildPortal === 'function') {
      this._buildPortal();
    }

    const cx = GW / 2;
    const makeText = (y, txt, sz, col = '#FAB910') => {
      return this.add.text(cx, y, txt, {
        fontSize: `${sz}px`,
        fontFamily: '"Press Start 2P",monospace',
        color: col,
        stroke: '#000000',
        strokeThickness: 3,
        align: 'center',
        wordWrap: { width: GW - 20 }
      }).setOrigin(0.5).setDepth(5);
    };

    makeText(14, '★ COMPLETADO ★', 9, '#FAB910');
    makeText(30, '¡JAGGY GANA!', 7, '#aaffaa');

    // Jaggy sprite with breathing tween
    const jag = this.add.sprite(cx, 105, 'jaggy', 9).setDepth(5)
      .setScale(this.JAGGY_SCALE * 1.3);
    this.tweens.add({
      targets: jag,
      scaleX: this.JAGGY_SCALE * 1.4,
      scaleY: this.JAGGY_SCALE * 1.4,
      duration: 700,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    makeText(152, `SCORE: ${this.finalScore}`, 8);

    // Coupon box (use separate graphics so we can clear/destroy easily)
    this.uiGraphics = this.add.graphics().setDepth(2);
    const boxX = 14, boxY = 165, boxW = GW - 28, boxH = 80;
    this.uiGraphics.lineStyle(2, 0xFAB910);
    this.uiGraphics.strokeRect(boxX, boxY, boxW, boxH);
    this.uiGraphics.fillStyle(0xFAB910, 0.07);
    this.uiGraphics.fillRect(boxX, boxY, boxW, boxH);

    makeText(172, '🍔 TU DESCUENTO', 6, '#aaffaa');

    // Discount code text (animated)
    const codeText = makeText(192, this.DISCOUNT_CODE, 16, '#FAB910');
    this.tweens.add({
      targets: codeText,
      scaleX: 1.06,
      scaleY: 1.06,
      duration: 500,
      yoyo: true,
      repeat: -1
    });

    makeText(215, '20% OFF en Bacan', 6, '#ffffff');
    makeText(228, 'Mostrá esta pantalla 🔥', 5, '#f97316');

    // Button (drawn with graphics for hover effect)
    const btnY = 252;
    this.btnGraphics = this.add.graphics().setDepth(5);
    const btnW = 136, btnH = 22;
    const btnX = cx - btnW / 2;
    const drawBtn = (hover = false) => {
      this.btnGraphics.clear();
      this.btnGraphics.fillStyle(hover ? 0x7c3aed : 0x562373);
      this.btnGraphics.fillRect(btnX, btnY - 9, btnW, btnH);
      this.btnGraphics.lineStyle(2, 0xFAB910);
      this.btnGraphics.strokeRect(btnX, btnY - 9, btnW, btnH);
    };
    drawBtn(false);
    makeText(btnY + 2, '▶ JUGAR DE NUEVO', 6, '#FAB910');

    // Use a rectangle game object for accurate hit area and depth
    const btnRect = this.add.rectangle(cx, btnY + 2, btnW, btnH, 0x000000, 0)
      .setOrigin(0.5).setInteractive({ useHandCursor: true }).setDepth(6);

    btnRect.on('pointerover', () => drawBtn(true));
    btnRect.on('pointerout', () => drawBtn(false));

    // Use pointerup to avoid accidental triggers on pointerdown drag
    btnRect.on('pointerup', () => {
      // Emit restart and go to BootScene (keep your flow)
      this.game.events.emit('restartGame');
      this.scene.start('BootScene');
    });

    // Keyboard accessibility: Enter / Space to restart
    this.input.keyboard.on('keydown-ENTER', this._onRestartKey, this);
    this.input.keyboard.on('keydown-SPACE', this._onRestartKey, this);

    // Optional: copy discount code on click of the code text (if browser supports clipboard)
    codeText.setInteractive({ useHandCursor: true }).on('pointerup', () => {
      if (navigator && navigator.clipboard && this.DISCOUNT_CODE) {
        navigator.clipboard.writeText(this.DISCOUNT_CODE).catch(() => {});
      }
    });

    // Emit gameWon event
    this.game.events.emit('gameWon', { code: this.DISCOUNT_CODE, score: this.finalScore });

    // Keep references for cleanup
    this._refs = { jag, codeText, btnRect };
  }

  _onRestartKey() {
    this.game.events.emit('restartGame');
    this.scene.start('BootScene');
  }

  // Clean up to avoid leaks if scene is restarted or removed
  shutdown() {
    this._destroyRefs();
  }

  destroy() {
    this._destroyRefs();
    super.destroy && super.destroy();
  }

  _destroyRefs() {
    if (this._refs) {
      // remove keyboard listeners
      this.input.keyboard.off('keydown-ENTER', this._onRestartKey, this);
      this.input.keyboard.off('keydown-SPACE', this._onRestartKey, this);

      // destroy graphics and objects
      this.bgGraphics && this.bgGraphics.destroy();
      this.uiGraphics && this.uiGraphics.destroy();
      this.btnGraphics && this.btnGraphics.destroy();
      this._refs.jag && this._refs.jag.destroy();
      this._refs.codeText && this._refs.codeText.destroy();
      this._refs.btnRect && this._refs.btnRect.destroy();

      this._refs = null;
    }
  }
}
// ════════════════════════════════════════════════════════════════════════════
// COMPONENTE REACT
// ════════════════════════════════════════════════════════════════════════════
export default function BacanGame() {
  const containerRef = useRef(null);
  const gameRef      = useRef(null);
  const navigate     = useNavigate();

  const [ui,setUi]          = useState({ level:1, score:0, won:false, code:'' });
  const [loaded,setLoaded]  = useState(false);

  useEffect(()=>{
    const ctr  = containerRef.current;
    if (!ctr) return;

    // _tk se inicializa ACÁ en el objeto game — disponible antes de cualquier escena
    const tkState = { left:false, right:false, jump:false };

    const game = new Phaser.Game({
      type:   Phaser.AUTO,
      width:  GW,
      height: GH,
      parent: ctr,
      backgroundColor: '#0a1f0a',
      audio:  { noAudio: true },
      render: { pixelArt:true, antialias:false, roundPixels:true },
      physics:{ default:'arcade', arcade:{ gravity:{y:GRAVITY}, debug:false } },
      scene:  [BootScene, GameScene, WinScene],
      scale:{
        mode:       Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
      },
    });
    game._tk = tkState;   // ← asignado ANTES de que cualquier escena corra init()
    gameRef.current = game;

    game.events.on('scoreUpdate',   s               => setUi(u=>({...u,score:s})));
    game.events.on('levelComplete', ({level})       => setUi(u=>({...u,level:level+1})));
    game.events.on('gameWon',       ({code,score})  => setUi(u=>({...u,won:true,code,score})));
    game.events.on('restartGame',   ()              => setUi({level:1,score:0,won:false,code:''}));

    setTimeout(()=>setLoaded(true), 700);

    return ()=>{ gameRef.current?.destroy(true); gameRef.current=null; };
  },[]);

  // ── Botones táctiles ─────────────────────────────────────────────────────
  // Botones táctiles — escriben en tkState que vive en game._tk
  const press   = useCallback(k=>{ if(gameRef.current?._tk) gameRef.current._tk[k]=true;  },[]);
  const release = useCallback(k=>{ if(gameRef.current?._tk) gameRef.current._tk[k]=false; },[]);

  const mkBtn = key=>({
    onPointerDown:   e=>{ e.preventDefault(); press(key);   },
    onPointerUp:     e=>{ e.preventDefault(); release(key); },
    onPointerLeave:  e=>{ e.preventDefault(); release(key); },
    onPointerCancel: e=>{ e.preventDefault(); release(key); },
    onTouchStart:    e=>{ e.preventDefault(); press(key);   },
    onTouchEnd:      e=>{ e.preventDefault(); release(key); },
    onTouchCancel:   e=>{ e.preventDefault(); release(key); },
  });

  const lvlCfg = LEVELS[Math.min(ui.level-1,2)];

  return (
    <div style={S.page}>

      <header style={S.header}>
        <button onClick={()=>navigate('/')} style={S.back}>← portfolio</button>
        <div style={S.title}>
          <span style={S.brand}>BACAN</span>
          <span style={S.sub}>JUNGLE RUN</span>
        </div>
        <div style={S.scoreBox}>
          <span style={S.scoreLbl}>SCORE</span>
          <span style={S.scoreVal}>{ui.score}</span>
        </div>
      </header>

      <div style={S.lvlBar}>
        {LEVELS.map((l,i)=>(
          <div key={i} style={{...S.lvlDot,...(i+1<=ui.level?S.lvlDotOn:{})}}>
            {i+1}
          </div>
        ))}
        <span style={S.lvlName}>{lvlCfg?.label}</span>
        <span style={S.lvlGoal}>🍔×{lvlCfg?.burgerGoal}</span>
      </div>

      <div style={S.canvas}>
        {!loaded && (
          <div style={S.loader}>
            <span style={S.loaderBar}>▓▓▒▒░░</span>
            <span style={S.loaderTxt}>CARGANDO...</span>
          </div>
        )}
        <div ref={containerRef} style={{width:'100%',display:'block'}} />
      </div>

      <div style={S.controls}>
        <div style={S.dpad}>
          <button style={{...S.btn,...S.btnMove}} {...mkBtn('left')}>◀</button>
          <button style={{...S.btn,...S.btnMove}} {...mkBtn('right')}>▶</button>
        </div>
        <span style={S.ctrlLabel}>NV {ui.level}/3</span>
        <button style={{...S.btn,...S.btnJump}} {...mkBtn('jump')}>
          <span style={S.jIcon}>▲</span>
          <span style={S.jLbl}>JUMP</span>
        </button>
      </div>

      <p style={S.hint}>
        <kbd style={S.kbd}>A</kbd><kbd style={S.kbd}>D</kbd> mover ·{' '}
        <kbd style={S.kbd}>W</kbd>/<kbd style={S.kbd}>↑</kbd>/<kbd style={S.kbd}>SPACE</kbd> saltar
      </p>

      {ui.won && (
        <div style={S.coupon}>
          <span>🍔</span>
          <span style={S.couponTxt}>¡GANASTE! Código: </span>
          <strong style={S.couponCode}>{ui.code}</strong>
          <span style={S.couponTxt}> — 20% OFF</span>
        </div>
      )}

    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// ESTILOS
// ════════════════════════════════════════════════════════════════════════════
const S = {
  page:{
    display:'flex',flexDirection:'column',alignItems:'stretch',
    minHeight:'100dvh',background:'#050a05',
    fontFamily:'"Press Start 2P","Courier New",monospace',
    userSelect:'none',WebkitUserSelect:'none',overscrollBehavior:'none',
  },
  header:{
    display:'flex',alignItems:'center',justifyContent:'space-between',
    width:'100%',maxWidth:'520px',
    padding:'8px 12px',boxSizing:'border-box',
    background:'#030703',borderBottom:'2px solid #562373',
  },
  back:{
    background:'transparent',border:'1px solid #562373',
    borderRadius:'3px',color:'#FAB910',
    fontSize:'6px',fontFamily:'"Press Start 2P","Courier New",monospace',
    padding:'5px 7px',cursor:'pointer',touchAction:'manipulation',
  },
  title:{display:'flex',flexDirection:'column',alignItems:'center',gap:'2px'},
  brand:{fontSize:'13px',color:'#562373',letterSpacing:'3px',textShadow:'0 0 10px #56237366',fontFamily:'"Press Start 2P","Courier New",monospace'},
  sub:  {fontSize:'6px',color:'#FAB910',letterSpacing:'2px',fontFamily:'"Press Start 2P","Courier New",monospace'},
  scoreBox:{display:'flex',flexDirection:'column',alignItems:'flex-end',gap:'1px'},
  scoreLbl:{fontSize:'5px',color:'#562373',letterSpacing:'2px',fontFamily:'"Press Start 2P","Courier New",monospace'},
  scoreVal:{fontSize:'18px',color:'#FAB910',textShadow:'0 0 6px #FAB91066',lineHeight:1,fontFamily:'"Press Start 2P","Courier New",monospace'},

  lvlBar:{
    display:'flex',alignItems:'center',gap:'8px',
    width:'100%',maxWidth:'520px',
    padding:'4px 12px',boxSizing:'border-box',
    background:'#030703',borderBottom:'1px solid #1a1a2e',
  },
  lvlDot:{
    width:'16px',height:'16px',display:'flex',alignItems:'center',justifyContent:'center',
    background:'#1a0a2e',border:'1px solid #562373',
    borderRadius:'2px',fontSize:'6px',color:'#562373',
  },
  lvlDotOn:{background:'#562373',color:'#FAB910',border:'1px solid #FAB910'},
  lvlName:{fontSize:'6px',color:'#FAB910',letterSpacing:'1px',flex:1},
  lvlGoal:{fontSize:'6px',color:'#FAB910'},

  canvas:{
    position:'relative',
    width:'100%',
    maxWidth:'100%',
    flex:1,
    background:'#050a05',
    overflow:'hidden',
    aspectRatio:`${GW}/${GH}`,
    imageRendering:'pixelated',
  },
  loader:{
    position:'absolute',inset:0,display:'flex',flexDirection:'column',
    alignItems:'center',justifyContent:'center',gap:'10px',
    background:'#020602',zIndex:10,
  },
  loaderBar:{color:'#562373',fontSize:'14px',letterSpacing:'4px'},
  loaderTxt:{color:'#FAB910',fontSize:'7px',letterSpacing:'3px'},

  controls:{
    display:'flex',justifyContent:'space-between',alignItems:'center',
    width:'100%',maxWidth:'520px',
    padding:'10px 14px',boxSizing:'border-box',
    background:'#030703',borderTop:'2px solid #562373',
  },
  dpad:{display:'flex',gap:'10px'},
  ctrlLabel:{fontSize:'6px',color:'#562373',letterSpacing:'1px'},

  btn:{
    display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',
    border:'none',borderRadius:'6px',cursor:'pointer',fontFamily:'inherit',
    WebkitTapHighlightColor:'transparent',touchAction:'none',
    boxShadow:'0 5px 0 rgba(0,0,0,0.7)',lineHeight:1.1,
  },
  btnMove:{
    width:'72px',height:'72px',fontSize:'26px',
    background:'#1a0a2e',color:'#FAB910',border:'2px solid #562373',
  },
  btnJump:{
    width:'84px',height:'84px',fontSize:'24px',
    background:'#562373',color:'#FAB910',border:'2px solid #FAB910',
  },
  jIcon:{fontSize:'24px'},
  jLbl:{fontSize:'6px',color:'#FAB910',letterSpacing:'1px',marginTop:'3px'},

  hint:{color:'#2a0a3a',fontSize:'6px',padding:'5px 0 6px',margin:0,textAlign:'center'},
  kbd:{
    background:'#1a0a2e',border:'1px solid #562373',
    borderRadius:'2px',color:'#FAB910',
    fontSize:'6px',fontFamily:'"Press Start 2P","Courier New",monospace',padding:'1px 3px',margin:'0 1px',
  },
  coupon:{
    display:'flex',alignItems:'center',flexWrap:'wrap',justifyContent:'center',gap:'5px',
    width:'100%',maxWidth:'520px',
    padding:'8px 12px',boxSizing:'border-box',
    background:'#1a0a00',borderTop:'2px solid #FAB910',marginTop:'4px',
  },
  couponTxt:{fontSize:'7px',color:'#562373',fontFamily:'"Press Start 2P","Courier New",monospace'},
  couponCode:{fontSize:'14px',color:'#FAB910',fontFamily:'"Press Start 2P","Courier New",monospace',letterSpacing:'2px',textShadow:'0 0 8px #FAB91088'},
};

// Breakpoints recomendados
const BREAKS = {
  notebook: '(min-width: 900px) and (max-width: 1365px)',
  desktop: '(min-width: 1366px)'
};

// Valores de override para desktop/notebook
const OVERRIDES = {
  notebook: {
    page: { maxWidth: '920px', padding: '0 16px' },
    canvas: { maxWidth: '880px' },
    brand: { fontSize: '15px' },
    scoreVal: { fontSize: '20px' },
    btnMove: { width: '84px', height: '84px' },
    btnJump: { width: '96px', height: '96px' }
  },
  desktop: {
    page: { maxWidth: '1200px', padding: '0 24px' },
    canvas: { maxWidth: '1100px' },
    brand: { fontSize: '18px' },
    scoreVal: { fontSize: '22px' },
    btnMove: { width: '96px', height: '96px' },
    btnJump: { width: '110px', height: '110px' }
  }
};

// Aplica overrides sobre S (no muta referencias profundas innecesarias)
function applyOverrides(base, overrides) {
  const result = { ...base };
  for (const key in overrides) {
    result[key] = { ...(base[key] || {}), ...(overrides[key] || {}) };
  }
  return result;
}

// Inicializa matchMedia y listeners
function initResponsiveStyles(S, onUpdate) {
  const mqNotebook = window.matchMedia(BREAKS.notebook);
  const mqDesktop = window.matchMedia(BREAKS.desktop);

  // Debounce simple
  let timer = null;
  function scheduleUpdate() {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      timer = null;
      updateStyles();
    }, 80);
  }

  function updateStyles() {
    // Empieza con la base
    let newS = { ...S };

    // Aplica notebook si coincide
    if (mqNotebook.matches) {
      newS = applyOverrides(newS, OVERRIDES.notebook);
    }

    // Aplica desktop si coincide (desktop tiene prioridad sobre notebook)
    if (mqDesktop.matches) {
      newS = applyOverrides(newS, OVERRIDES.desktop);
    }

    // Llamada de retorno para que la app reaplique estilos (React setState, o re-render manual)
    if (typeof onUpdate === 'function') onUpdate(newS);
  }

  // Escuchar cambios
  mqNotebook.addEventListener ? mqNotebook.addEventListener('change', scheduleUpdate) : mqNotebook.addListener(scheduleUpdate);
  mqDesktop.addEventListener ? mqDesktop.addEventListener('change', scheduleUpdate) : mqDesktop.addListener(scheduleUpdate);

  // Primera aplicación
  updateStyles();

  // Devuelve función para limpiar listeners si es necesario
  return () => {
    mqNotebook.removeEventListener ? mqNotebook.removeEventListener('change', scheduleUpdate) : mqNotebook.removeListener(scheduleUpdate);
    mqDesktop.removeEventListener ? mqDesktop.removeEventListener('change', scheduleUpdate) : mqDesktop.removeListener(scheduleUpdate);
  };
}