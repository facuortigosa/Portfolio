import { useState, useEffect, useRef, useCallback } from "react";

// ─── FONTS ────────────────────────────────────────────────────────────────────
const FONT_LINK =
  "https://fonts.googleapis.com/css2?family=Orbitron:wght@700;900&family=Share+Tech+Mono&display=swap";

const TICKET_URL = "https://www.passline.com/eventos/4niversario?utm_source=ig&utm_medium=social&utm_content=link_in_bio&fbclid=PAZXh0bgNhZW0CMTEAc3J0YwZhcHBfaWQMMjU2MjgxMDQwNTU4AAGnO1sbfYY13V-BsN8Wy_Y4jAT9Wd4dFMYPmGiZj6kgvm9qvnMsS_NamJjSzDU_aem_27WP8pABx-5zn3_BUrZ8EQ";

// ─── PALETTE ──────────────────────────────────────────────────────────────────
const C = {
  green:    "#00FF88",
  greenDim: "rgba(0,255,136,0.55)",
  greenLo:  "rgba(0,255,136,0.12)",
  error:    "#FF2244",
  bg0:      "#020c05",
  bg1:      "#041209",
  bg2:      "#071a0d",
};

// ─── CONSTANTS ────────────────────────────────────────────────────────────────
const W             = 390;
const H             = 600;
const UFO_W         = 56;
const UFO_H         = 26;
const UFO_X         = 110;
const GRAVITY       = 0.22;
const JUMP          = -5.8;
const PIPE_W        = 46;
const PIPE_INTERVAL = 300;   // space between columns
const PIPE_GAP      = 210;   // vertical opening — fixed across all levels
const PIPE_SPEED    = 2.4;   // fixed speed across all levels
const GAME_DURATION = 60;    // total seconds for the whole game

// Level definitions: how many columns must be passed to clear the level
const LEVELS = [
  { need: 1, label: "SECTOR 1", sublabel: "pasar 1 columna"  },
  { need: 3, label: "SECTOR 2", sublabel: "pasar 3 columnas" },
  { need: 5, label: "SECTOR 3", sublabel: "pasar 5 columnas" },
];

// ─── HELPERS ──────────────────────────────────────────────────────────────────
function randomPipeY() {
  const minTop = 70;
  const maxTop = H - PIPE_GAP - 70;
  return minTop + Math.random() * (maxTop - minTop);
}
function makePipe(x) {
  return { x, topH: randomPipeY(), passed: false };
}
function initPipes() {
  // Only spawn as many pipes as the hardest level needs + 1 buffer
  // We always keep a rolling set; completion is tracked via `columnsPassed`
  return [
    makePipe(W + 80),
    makePipe(W + 80 + PIPE_INTERVAL),
    makePipe(W + 80 + PIPE_INTERVAL * 2),
  ];
}
function makeStars() {
  return Array.from({ length: 60 }, () => ({
    x:       Math.random() * W,
    y:       Math.random() * H,
    r:       Math.random() * 1.5 + 0.3,
    speed:   Math.random() * 0.4 + 0.15,
    opacity: Math.random() * 0.6 + 0.2,
  }));
}

function initState(timeLeft = GAME_DURATION) {
  return {
    ufoY:          H / 2,
    ufoVY:         0,
    pipes:         initPipes(),
    columnsPassed: 0,   // columns cleared in this level
    level:         0,   // 0-indexed
    phase:         "idle",   // idle|playing|levelclear|victory|dead|timesup
    deathShake:    0,
    timeLeft,
    lastTs:        0,
    stars:         makeStars(),
    particles:     [],
    glowPulse:     0,
  };
}

// ─── COLLISION (forgiving hitbox) ─────────────────────────────────────────────
function checkCollision(ufoY, pipes) {
  const pad = 12;
  const ux1 = UFO_X - UFO_W / 2 + pad, ux2 = UFO_X + UFO_W / 2 - pad;
  const uy1 = ufoY - UFO_H / 2 + pad,  uy2 = ufoY + UFO_H / 2 - pad;
  if (uy1 < 0 || uy2 > H) return true;
  for (const p of pipes)
    if (ux2 > p.x && ux1 < p.x + PIPE_W)
      if (uy1 < p.topH || uy2 > p.topH + PIPE_GAP) return true;
  return false;
}

// ─── PARTICLE HELPERS ─────────────────────────────────────────────────────────
function spawnParticles(s, x, y, color, count) {
  for (let i = 0; i < count; i++)
    s.particles.push({
      x, y,
      vx: (Math.random() - 0.5) * 6,
      vy: (Math.random() - 0.5) * 6 - 1,
      r:  Math.random() * 3.5 + 1,
      life: 50, maxLife: 50, color,
    });
}
function tickParticles(s) {
  s.particles.forEach(p => {
    p.x += p.vx; p.y += p.vy;
    p.vx *= 0.93; p.vy *= 0.93; p.vy += 0.1; p.life--;
  });
  s.particles = s.particles.filter(p => p.life > 0);
}

// ─── COMPONENT ────────────────────────────────────────────────────────────────
export default function proyectoq() {
  const canvasRef  = useRef(null);
  const stateRef   = useRef(initState());
  const rafRef     = useRef(null);
  const [ui, setUI] = useState({ phase: "idle", level: 0, columnsPassed: 0, timeLeft: GAME_DURATION });

  // inject fonts once
  useEffect(() => {
    if (!document.getElementById("pq-fonts")) {
      const link = document.createElement("link");
      link.id = "pq-fonts"; link.rel = "stylesheet"; link.href = FONT_LINK;
      document.head.appendChild(link);
    }
  }, []);

  // ── DRAW ────────────────────────────────────────────────────────────────────
  const draw = useCallback((ctx, s, t) => {
    const lvlCfg = LEVELS[Math.min(s.level, LEVELS.length - 1)];

    // shake
    const sx = s.deathShake > 0 ? (Math.random() - 0.5) * s.deathShake * 5 : 0;
    const sy = s.deathShake > 0 ? (Math.random() - 0.5) * s.deathShake * 5 : 0;
    ctx.save();
    ctx.translate(sx, sy);

    // BG
    const bg = ctx.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, C.bg0); bg.addColorStop(0.6, C.bg1); bg.addColorStop(1, C.bg2);
    ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);

    // grid
    ctx.strokeStyle = "rgba(0,255,136,0.028)"; ctx.lineWidth = 1;
    for (let x = 0; x < W; x += 40) { ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,H); ctx.stroke(); }
    for (let y = 0; y < H; y += 40) { ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(W,y); ctx.stroke(); }

    // stars
    s.stars.forEach(st => {
      ctx.beginPath(); ctx.arc(st.x, st.y, st.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(200,255,220,${st.opacity})`; ctx.fill();
    });

    // nebula
    const neb = ctx.createRadialGradient(W * 0.7, H * 0.3, 0, W * 0.7, H * 0.3, 160);
    neb.addColorStop(0, "rgba(0,180,70,0.06)"); neb.addColorStop(1, "transparent");
    ctx.fillStyle = neb; ctx.fillRect(0, 0, W, H);

    // pipes
    s.pipes.forEach(p => {
      drawMonolith(ctx, p.x, 0, PIPE_W, p.topH, false);
      drawMonolith(ctx, p.x, p.topH + PIPE_GAP, PIPE_W, H - (p.topH + PIPE_GAP), true);
    });

    // UFO
    if (s.phase !== "dead" || s.deathShake > 0)
      drawUFO(ctx, UFO_X, s.ufoY, s.ufoVY, s.glowPulse, t);

    // particles
    s.particles.forEach(p => {
      ctx.globalAlpha = p.life / p.maxLife;
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = p.color; ctx.fill(); ctx.globalAlpha = 1;
    });

    // HUD (always visible during play)
    if (s.phase === "playing" || s.phase === "levelclear")
      drawHUD(ctx, s, lvlCfg);

    // overlays
    if (s.phase === "idle")       drawIdle(ctx, t);
    if (s.phase === "dead")       drawDead(ctx, t);
    if (s.phase === "timesup")    drawTimesUp(ctx, t);
    if (s.phase === "levelclear") drawLevelClear(ctx, s, t);
    if (s.phase === "victory")    drawVictory(ctx, t, s.victoryTs);

    ctx.restore();
  }, []);

  // ── GAME LOOP ────────────────────────────────────────────────────────────────
  const loop = useCallback((timestamp) => {
    const s   = stateRef.current;
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) { rafRef.current = requestAnimationFrame(loop); return; }

    if (s.phase === "playing") {
      // ── timer ──
      if (s.lastTs === 0) s.lastTs = timestamp;
      const secElapsed = Math.floor((timestamp - s.lastTs) / 1000);
      if (secElapsed >= 1) {
        s.timeLeft = Math.max(0, s.timeLeft - secElapsed);
        s.lastTs   = timestamp - ((timestamp - s.lastTs) % 1000);
      }
      if (s.timeLeft <= 0) {
        s.phase = "timesup";
        draw(ctx, s, timestamp);
        setUI({ phase: "timesup", level: s.level, columnsPassed: s.columnsPassed, timeLeft: 0 });
        rafRef.current = requestAnimationFrame(loop);
        return;
      }

      // ── physics ──
      s.ufoVY += GRAVITY; s.ufoY += s.ufoVY;
      s.glowPulse = (Math.sin(timestamp * 0.003) + 1) / 2;

      // ── stars parallax ──
      s.stars.forEach(st => { st.x -= st.speed; if (st.x < 0) { st.x = W; st.y = Math.random() * H; } });

      // ── pipes ──
      s.pipes.forEach(p => { p.x -= PIPE_SPEED; });
      const last = s.pipes[s.pipes.length - 1];
      if (last.x < W - PIPE_INTERVAL) s.pipes.push(makePipe(last.x + PIPE_INTERVAL));
      s.pipes = s.pipes.filter(p => p.x > -PIPE_W - 10);

      // ── column pass detection ──
      s.pipes.forEach(p => {
        if (!p.passed && p.x + PIPE_W < UFO_X) {
          p.passed = true;
          s.columnsPassed++;
          spawnParticles(s, UFO_X, s.ufoY, C.green, 10);

          const lvlCfg = LEVELS[s.level];
          if (s.columnsPassed >= lvlCfg.need) {
            // level cleared!
            if (s.level >= LEVELS.length - 1) {
              s.phase = "victory";
            } else {
              s.phase = "levelclear";
            }
          }
        }
      });

      tickParticles(s);

      // ── collision ──
      if (s.phase === "playing" && checkCollision(s.ufoY, s.pipes)) {
        s.phase      = "dead";
        s.deathShake = 9;
        spawnParticles(s, UFO_X, s.ufoY, C.error, 24);
      }
    }

    if (s.phase === "dead" || s.phase === "timesup" || s.phase === "levelclear" || s.phase === "victory") {
      s.deathShake = Math.max(0, s.deathShake - 0.25);
      tickParticles(s);
      s.glowPulse = (Math.sin(timestamp * 0.004) + 1) / 2;
      s.stars.forEach(st => { st.x -= 0.5; if (st.x < 0) st.x = W; });
      // mark when victory started
      if (s.phase === "victory" && !s.victoryTs) s.victoryTs = timestamp;
    }

    draw(ctx, s, timestamp);
    setUI({ phase: s.phase, level: s.level, columnsPassed: s.columnsPassed, timeLeft: s.timeLeft });
    rafRef.current = requestAnimationFrame(loop);
  }, [draw]);

  // ── INPUT ────────────────────────────────────────────────────────────────────
  const handleInput = useCallback(() => {
    const s = stateRef.current;

    if (s.phase === "idle" || s.phase === "dead" || s.phase === "timesup") {
      // full reset
      stateRef.current = { ...initState(), phase: "playing", lastTs: 0 };

    } else if (s.phase === "playing") {
      s.ufoVY = JUMP;

    } else if (s.phase === "levelclear") {
      // advance to next level, preserve timer
      const nextLevel = s.level + 1;
      stateRef.current = {
        ...initState(s.timeLeft),
        phase:  "playing",
        level:  nextLevel,
        lastTs: 0,
      };

    } else if (s.phase === "victory") {
      // must wait 9 seconds before restarting
      const elapsed = s.victoryTs ? (performance.now() - s.victoryTs) / 1000 : 0;
      if (elapsed >= 9) {
        stateRef.current = { ...initState(), phase: "idle" };
      }
    }
  }, []);

  // ── EFFECTS ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, [loop]);

  useEffect(() => {
    const onKey = e => {
      if (e.code === "Space" || e.code === "ArrowUp") { e.preventDefault(); handleInput(); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [handleInput]);

  // ── RENDER ───────────────────────────────────────────────────────────────────
  return (
    <div style={{
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      minHeight: "100dvh", background: C.bg0,
      padding: "12px 0", touchAction: "none",
    }}>
      <div style={{ width: "100%", maxWidth: "430px", padding: "0 8px" }}>
        <div
          style={{
            position: "relative", width: "100%",
            paddingTop: `${(H / W) * 100}%`,
            borderRadius: "10px", overflow: "hidden",
            border: "1px solid rgba(0,255,136,0.18)",
            boxShadow: "0 0 40px rgba(0,255,136,0.07)",
          }}
          onClick={handleInput}
        >
          <canvas
            ref={canvasRef} width={W} height={H}
            style={{
              position: "absolute", top: 0, left: 0,
              width: "100%", height: "100%",
              display: "block", cursor: "pointer",
            }}
          />
          {/* Victory link — rendered as real HTML so it's actually clickable */}
          {ui.phase === "victory" && (
            <a
              href={TICKET_URL}
              target="_blank"
              rel="noopener noreferrer"
              onClick={e => e.stopPropagation()}
              style={{
                position:       "absolute",
                left:           "6.2%",
                width:          "87.6%",
                top:            "63%",
                height:         "7%",
                borderRadius:   "6px",
                display:        "flex",
                flexDirection:  "column",
                alignItems:     "center",
                justifyContent: "center",
                textDecoration: "none",
                background:     "transparent",
                cursor:         "pointer",
                zIndex:         10,
              }}
            />
          )}
        </div>
        <div style={{
          display: "flex", justifyContent: "space-between",
          marginTop: "10px", padding: "0 4px",
        }}>
          <span style={{ color: "rgba(0,255,136,0.4)", fontSize: "10px", fontFamily: "'Orbitron',monospace", letterSpacing: "0.2em" }}>
            PROYECTO Q
          </span>
          <span style={{ color: "rgba(0,255,136,0.22)", fontSize: "9px", fontFamily: "'Share Tech Mono',monospace", letterSpacing: "0.15em" }}>
            TAP / SPACE to flap
          </span>
        </div>
      </div>
    </div>
  );
}

// ─── DRAW: MONOLITH ───────────────────────────────────────────────────────────
function drawMonolith(ctx, x, y, w, h, isBottom) {
  if (h <= 0) return;
  const g = ctx.createLinearGradient(x, y, x + w, y);
  g.addColorStop(0, "#071a0d"); g.addColorStop(0.5, "#0d2e14"); g.addColorStop(1, "#050f07");
  ctx.fillStyle = g; ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = "rgba(0,255,136,0.18)"; ctx.lineWidth = 1; ctx.strokeRect(x, y, w, h);

  // cap glow
  const capG = ctx.createLinearGradient(x, isBottom ? y - 5 : y + h - 5, x, isBottom ? y + 5 : y + h + 5);
  capG.addColorStop(0, isBottom ? "rgba(0,255,136,0.5)" : "transparent");
  capG.addColorStop(1, isBottom ? "transparent" : "rgba(0,255,136,0.5)");
  ctx.fillStyle = capG; ctx.fillRect(x - 3, isBottom ? y : y + h - 5, w + 6, 10);

  // windows
  ctx.fillStyle = "rgba(0,255,136,0.09)";
  const s0 = isBottom ? y + 16 : y + 10, e0 = isBottom ? y + h - 10 : y + h - 6;
  for (let wy = s0; wy < e0 - 8; wy += 20) {
    ctx.fillRect(x + 7, wy, 7, 4); ctx.fillRect(x + 20, wy + 3, 7, 4); ctx.fillRect(x + 33, wy, 7, 4);
  }
}

// ─── DRAW: UFO ────────────────────────────────────────────────────────────────
function drawUFO(ctx, x, y, vy, glow, t) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(Math.max(-0.3, Math.min(0.3, vy * 0.04)));

  // ambient glow
  const og = ctx.createRadialGradient(0, 6, 0, 0, 6, 44 + glow * 12);
  og.addColorStop(0, `rgba(0,255,136,${0.1 + glow * 0.07})`); og.addColorStop(1, "transparent");
  ctx.fillStyle = og; ctx.fillRect(-56, -50, 112, 100);

  // tractor beam
  const bh = 20 + glow * 8;
  const bG = ctx.createLinearGradient(0, 14, 0, 14 + bh);
  bG.addColorStop(0, `rgba(0,255,136,${0.2 + glow * 0.12})`); bG.addColorStop(1, "transparent");
  ctx.beginPath();
  ctx.moveTo(-12, 14); ctx.lineTo(12, 14); ctx.lineTo(24, 14 + bh); ctx.lineTo(-24, 14 + bh);
  ctx.closePath(); ctx.fillStyle = bG; ctx.fill();

  // body
  const bodyG = ctx.createLinearGradient(-UFO_W / 2, 2, UFO_W / 2, 14);
  bodyG.addColorStop(0, "#0a2e14"); bodyG.addColorStop(0.5, "#155e28"); bodyG.addColorStop(1, "#071a0d");
  ctx.beginPath(); ctx.ellipse(0, 8, UFO_W / 2, 10, 0, 0, Math.PI * 2);
  ctx.fillStyle = bodyG; ctx.fill();
  ctx.strokeStyle = `rgba(0,255,136,${0.45 + glow * 0.3})`; ctx.lineWidth = 1.5; ctx.stroke();

  // dome
  const dG = ctx.createRadialGradient(-6, -5, 2, 0, 0, 20);
  dG.addColorStop(0, "rgba(180,255,220,0.55)");
  dG.addColorStop(0.5, "rgba(0,200,100,0.25)");
  dG.addColorStop(1, "rgba(0,60,20,0.1)");
  ctx.beginPath(); ctx.ellipse(0, 0, 19, 12, 0, Math.PI, 0);
  ctx.fillStyle = dG; ctx.fill();
  ctx.strokeStyle = `rgba(0,255,136,${0.55 + glow * 0.3})`; ctx.lineWidth = 1; ctx.stroke();

  // dome shine
  ctx.beginPath(); ctx.ellipse(-5, -5, 7, 3.5, -0.3, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(255,255,255,0.18)"; ctx.fill();

  // lights
  [-18, -9, 0, 9, 18].forEach((lx, i) => {
    const on = Math.sin(t * 0.006 + i * 1.2) > 0.15;
    ctx.beginPath(); ctx.arc(lx, 10, 2.8, 0, Math.PI * 2);
    if (on) { ctx.shadowColor = C.green; ctx.shadowBlur = 7; ctx.fillStyle = C.green; }
    else ctx.fillStyle = "rgba(0,255,136,0.08)";
    ctx.fill(); ctx.shadowBlur = 0;
  });

  ctx.restore();
}

// ─── DRAW: HUD ────────────────────────────────────────────────────────────────
function drawHUD(ctx, s, lvlCfg) {
  const isLow = s.timeLeft <= 10;

  // ── timer (top right) ──
  ctx.font = `900 17px 'Orbitron', monospace`;
  ctx.fillStyle = isLow ? C.error : C.green;
  ctx.textAlign = "right";
  ctx.fillText(`${String(s.timeLeft).padStart(2, "0")}s`, W - 14, 30);
  ctx.textAlign = "left";

  // ── level label (top left) ──
  ctx.font = `900 13px 'Orbitron', monospace`;
  ctx.fillStyle = C.green;
  ctx.fillText(lvlCfg.label, 14, 30);

  // ── column counter (below level) ──
  const passed = Math.min(s.columnsPassed, lvlCfg.need);
  ctx.font = `12px 'Share Tech Mono', monospace`;
  ctx.fillStyle = C.greenDim;
  ctx.fillText(`columnas: ${passed} / ${lvlCfg.need}`, 14, 50);

  // ── column pip indicators ──
  const pipR = 7, pipGap = 20, startX = 14;
  for (let i = 0; i < lvlCfg.need; i++) {
    const px = startX + i * pipGap;
    const done = i < passed;
    ctx.beginPath(); ctx.arc(px + pipR, 64, pipR, 0, Math.PI * 2);
    ctx.fillStyle   = done ? C.green : "rgba(0,255,136,0.12)";
    ctx.strokeStyle = done ? C.green : "rgba(0,255,136,0.3)";
    ctx.lineWidth = 1.5;
    ctx.fill(); ctx.stroke();
    if (done) {
      ctx.font = `bold 8px 'Share Tech Mono', monospace`;
      ctx.fillStyle = C.bg0;
      ctx.textAlign = "center";
      ctx.fillText("✓", px + pipR, 68);
      ctx.textAlign = "left";
    }
  }

  // ── bottom timer bar ──
  const bw = W - 28, bx = 14, by = H - 20;
  const pct = s.timeLeft / GAME_DURATION;
  ctx.fillStyle = "rgba(0,255,136,0.07)"; ctx.fillRect(bx, by, bw, 5);
  const barG = ctx.createLinearGradient(bx, 0, bx + bw * pct, 0);
  barG.addColorStop(0, isLow ? C.error : C.green);
  barG.addColorStop(1, isLow ? "#ff6677" : "#00cc66");
  ctx.fillStyle = barG; ctx.fillRect(bx, by, bw * pct, 5);
  ctx.strokeStyle = "rgba(0,255,136,0.15)"; ctx.lineWidth = 1; ctx.strokeRect(bx, by, bw, 5);
}

// ─── DRAW: IDLE SCREEN ────────────────────────────────────────────────────────
function drawIdle(ctx, t) {
  ctx.fillStyle = "rgba(2,12,5,0.8)"; ctx.fillRect(0, 0, W, H);
  const p = (Math.sin(t * 0.003) + 1) / 2;
  ctx.textAlign = "center";

  ctx.font = `900 30px 'Orbitron', monospace`;
  ctx.fillStyle = `rgba(0,255,136,${0.7 + p * 0.3})`;
  ctx.fillText("PROYECTO Q", W / 2, H / 2 - 100);

  // level preview
  LEVELS.forEach((lvl, i) => {
    const yy = H / 2 - 52 + i * 30;
    ctx.font = `11px 'Share Tech Mono', monospace`;
    ctx.fillStyle = `rgba(0,255,136,${0.45 + p * 0.2})`;
    ctx.fillText(`NIVEL ${i + 1}  —  ${lvl.sublabel}`, W / 2, yy);
  });

  ctx.font = `10px 'Share Tech Mono', monospace`;
  ctx.fillStyle = "rgba(200,255,220,0.35)";
  ctx.fillText(`⏱  ${GAME_DURATION}s totales · si morís volvés al inicio`, W / 2, H / 2 + 30);

  ctx.font = `bold 12px 'Orbitron', monospace`;
  ctx.fillStyle = `rgba(0,255,136,${0.5 + p * 0.5})`;
  ctx.fillText("[ TAP / ESPACIO para empezar ]", W / 2, H / 2 + 72);

  ctx.textAlign = "left";
}

// ─── DRAW: DEAD SCREEN ────────────────────────────────────────────────────────
function drawDead(ctx, t) {
  ctx.fillStyle = "rgba(2,12,5,0.84)"; ctx.fillRect(0, 0, W, H);
  const p = (Math.sin(t * 0.004) + 1) / 2;
  ctx.textAlign = "center";

  ctx.font = `900 26px 'Orbitron', monospace`;
  ctx.fillStyle = C.error;
  ctx.fillText("✕  SEÑAL PERDIDA", W / 2, H / 2 - 55);

  ctx.font = `11px 'Share Tech Mono', monospace`;
  ctx.fillStyle = "rgba(255,34,68,0.55)";
  ctx.fillText("el juego se reinicia desde el nivel 1", W / 2, H / 2 - 20);

  ctx.font = `bold 12px 'Orbitron', monospace`;
  ctx.fillStyle = `rgba(0,255,136,${0.5 + p * 0.5})`;
  ctx.fillText("[ TAP / ESPACIO para reintentar ]", W / 2, H / 2 + 30);

  ctx.textAlign = "left";
}

// ─── DRAW: TIMES UP ───────────────────────────────────────────────────────────
function drawTimesUp(ctx, t) {
  ctx.fillStyle = "rgba(2,12,5,0.86)"; ctx.fillRect(0, 0, W, H);
  const p = (Math.sin(t * 0.004) + 1) / 2;
  ctx.textAlign = "center";

  ctx.font = `900 22px 'Orbitron', monospace`;
  ctx.fillStyle = C.error;
  ctx.fillText("TIEMPO AGOTADO", W / 2, H / 2 - 55);

  ctx.font = `11px 'Share Tech Mono', monospace`;
  ctx.fillStyle = "rgba(255,34,68,0.55)";
  ctx.fillText("no llegaste a completar los 3 sectores", W / 2, H / 2 - 20);

  ctx.font = `bold 12px 'Orbitron', monospace`;
  ctx.fillStyle = `rgba(0,255,136,${0.5 + p * 0.5})`;
  ctx.fillText("[ TAP / ESPACIO para reintentar ]", W / 2, H / 2 + 30);

  ctx.textAlign = "left";
}

// ─── DRAW: LEVEL CLEAR ───────────────────────────────────────────────────────
function drawLevelClear(ctx, s, t) {
  ctx.fillStyle = "rgba(0,20,8,0.82)"; ctx.fillRect(0, 0, W, H);
  const p = (Math.sin(t * 0.005) + 1) / 2;
  const nextCfg = LEVELS[Math.min(s.level + 1, LEVELS.length - 1)];
  ctx.textAlign = "center";

  ctx.font = `900 ${22 + p * 3}px 'Orbitron', monospace`;
  ctx.fillStyle = `rgba(0,255,136,${0.8 + p * 0.2})`;
  ctx.fillText(`✦  SECTOR ${s.level + 1} COMPLETADO  ✦`, W / 2, H / 2 - 64);

  ctx.font = `12px 'Share Tech Mono', monospace`;
  ctx.fillStyle = C.greenDim;
  ctx.fillText(`siguiente: ${nextCfg.label}  —  ${nextCfg.sublabel}`, W / 2, H / 2 - 24);

  // time remaining
  ctx.font = `bold 14px 'Orbitron', monospace`;
  ctx.fillStyle = s.timeLeft <= 10 ? C.error : C.green;
  ctx.fillText(`${s.timeLeft}s restantes`, W / 2, H / 2 + 12);

  ctx.font = `bold 11px 'Orbitron', monospace`;
  ctx.fillStyle = `rgba(0,255,136,${0.45 + p * 0.45})`;
  ctx.fillText("[ TAP / ESPACIO para continuar ]", W / 2, H / 2 + 55);

  ctx.textAlign = "left";
}

// ─── DRAW: VICTORY ────────────────────────────────────────────────────────────
function drawVictory(ctx, t, victoryTs) {
  const p = (Math.sin(t * 0.004) + 1) / 2;
  const elapsed  = victoryTs ? (performance.now() - victoryTs) / 1000 : 0;
  const remaining = Math.max(0, Math.ceil(9 - elapsed));
  const unlocked  = elapsed >= 9;

  ctx.fillStyle = "rgba(0,15,6,0.88)"; ctx.fillRect(0, 0, W, H);

  // radial glow
  const gl = ctx.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, W * 0.7);
  gl.addColorStop(0, `rgba(0,255,136,${0.12 + p * 0.08})`); gl.addColorStop(1, "transparent");
  ctx.fillStyle = gl; ctx.fillRect(0, 0, W, H);

  // rays
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2 + t * 0.0005;
    ctx.beginPath(); ctx.moveTo(W / 2, H / 2);
    ctx.lineTo(W / 2 + Math.cos(a) * W, H / 2 + Math.sin(a) * H);
    ctx.strokeStyle = `rgba(0,255,136,${0.06 + p * 0.04})`; ctx.lineWidth = 1.5; ctx.stroke();
  }

  ctx.textAlign = "center";

  ctx.font = `900 ${22 + p * 3}px 'Orbitron', monospace`;
  ctx.fillStyle = `rgba(0,255,136,${0.85 + p * 0.15})`;
  ctx.fillText("✦ MISIÓN CUMPLIDA ✦", W / 2, H / 2 - 110);

  ctx.font = `bold 11px 'Share Tech Mono', monospace`;
  ctx.fillStyle = `rgba(0,255,136,${0.7 + p * 0.2})`;
  ctx.fillText("// TRANSMISIÓN 001", W / 2, H / 2 - 72);

  ctx.font = `13px 'Share Tech Mono', monospace`;
  ctx.fillStyle = "rgba(255,255,255,0.88)";
  ctx.fillText("La señal está activa.", W / 2, H / 2 - 50);

  ctx.font = `44px serif`;
  ctx.fillText("🛸", W / 2, H / 2 + 4);

  // CTA link box
  const boxX = 24, boxW = W - 48, boxH = 42, boxY = H / 2 + 30;
  ctx.fillStyle = `rgba(0,255,136,${0.07 + p * 0.05})`;
  ctx.strokeStyle = `rgba(0,255,136,${0.35 + p * 0.25})`;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.roundRect(boxX, boxY, boxW, boxH, 6);
  ctx.fill(); ctx.stroke();

  ctx.font = `bold 10px 'Orbitron', monospace`;
  ctx.fillStyle = `rgba(0,255,136,${0.85 + p * 0.15})`;
  ctx.fillText("▸  CONSEGUIR ENTRADA", W / 2, boxY + 16);

  ctx.font = `9px 'Share Tech Mono', monospace`;
  ctx.fillStyle = `rgba(0,255,136,0.45)`;
  ctx.fillText("passline.com / 4NIVERSARIQ 💚", W / 2, boxY + 30);

  ctx.font = `bold 10px 'Orbitron', monospace`;
  ctx.fillStyle = unlocked
    ? `rgba(0,255,136,${0.5 + p * 0.45})`
    : `rgba(0,255,136,0.3)`;
  ctx.fillText(
    unlocked
      ? "[ TAP / ESPACIO para jugar de nuevo ]"
      : `[ disponible en ${remaining}s ]`,
    W / 2, H / 2 + 96
  );

  ctx.textAlign = "left";
}
