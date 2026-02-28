import React, { useRef, useEffect } from 'react';

const SpyralTech = ({ 
  width = 900, 
  height = 600, 
  animated = false,         // set to true for dynamic rotation/scroll
  text = 'SPYRAL_TECH',     // glitch text (uppercase works best)
  speed = 0.002              // rotation speed when animated
}) => {
  const canvasRef = useRef(null);
  const animationRef = useRef();
  const timeRef = useRef(0);

  // Helper: rounded rectangle
  const roundRect = (ctx, x, y, w, h, r) => {
    if (w < 2 * r) r = w / 2;
    if (h < 2 * r) r = h / 2;
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
  };

  // Deterministic pseudo-random generator for consistent binary patterns
  const seededRandom = (seed) => {
    let x = Math.sin(seed) * 10000;
    return x - Math.floor(x);
  };

  // Main drawing function
  const draw = (timestamp) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const w = width;
    const h = height;

    // Clear with background #1A1A1A
    ctx.fillStyle = '#1A1A1A';
    ctx.fillRect(0, 0, w, h);

    // --- Grid texture (#6B6B6B) ---
    ctx.strokeStyle = '#6B6B6B';
    ctx.lineWidth = 0.6;
    ctx.globalAlpha = 0.12;
    const gridStep = 35;
    // Vertical lines
    for (let x = 0; x < w; x += gridStep) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    // Horizontal lines
    for (let y = 0; y < h; y += gridStep) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }
    ctx.globalAlpha = 1.0;

    // --- Binary code columns (fading into darkness) ---
    ctx.font = '14px "Courier New", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const binaryCols = 18;
    const binaryRows = 28;
    const colWidth = w / (binaryCols + 2);
    const rowHeight = h / (binaryRows + 4);
    const baseX = colWidth * 1.5;
    const baseY = rowHeight * 2;

    // Create a fixed binary pattern based on row/col indices
    for (let col = 0; col < binaryCols; col++) {
      const x = baseX + col * colWidth;
      for (let row = 0; row < binaryRows; row++) {
        const y = baseY + row * rowHeight;
        // Use seeded random for consistency, but offset by time if animated
        let seed = col * 100 + row;
        if (animated) {
          seed += timestamp * 0.5; // slow scrolling effect
        }
        const rand = seededRandom(seed);
        const digit = rand > 0.5 ? '1' : '0';

        // Fade based on distance from center and random factor
        const distFromCenter = Math.abs(x - w/2) / (w/2) + Math.abs(y - h/2) / (h/2);
        const opacity = Math.max(0, 0.25 - distFromCenter * 0.15 + (rand * 0.1 - 0.05));
        ctx.fillStyle = '#00ffaa';
        ctx.globalAlpha = Math.min(0.3, opacity);
        ctx.fillText(digit, x, y);
      }
    }
    ctx.globalAlpha = 1.0;

    // --- Spiral of rounded blocks ---
    const centerX = w / 2;
    const centerY = h / 2;
    const maxRadius = Math.min(w, h) * 0.38;
    const blockSize = 16; // larger blocks for better visibility
    const blockRadius = 4; // rounding
    const totalBlocks = 240; // more blocks for smoother transition

    // Animated rotation offset
    const rotationOffset = animated ? timestamp * speed : 0;

    for (let i = 0; i < totalBlocks; i++) {
      const t = i / totalBlocks; // 0..1
      const angle = t * 12 * Math.PI + rotationOffset; // multiple turns plus animation
      const radius = t * maxRadius;

      const x = centerX + radius * Math.cos(angle);
      const y = centerY + radius * Math.sin(angle);

      // Color transition: red/orange (0°) to blue/purple (270°)
      const hue = t * 270; // 0 to 270
      ctx.fillStyle = `hsl(${hue}, 95%, 65%)`;

      // Draw rounded block
      ctx.beginPath();
      roundRect(ctx, x - blockSize/2, y - blockSize/2, blockSize, blockSize, blockRadius);
      ctx.fill();

      // Optional subtle glow
      ctx.shadowColor = `hsl(${hue}, 100%, 70%)`;
      ctx.shadowBlur = 8;
      ctx.fill();
      ctx.shadowBlur = 0; // reset for next items
    }

    // --- Glitch text below spiral ---
    const textY = h - 70;
    ctx.font = 'bold 44px "Courier New", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Main glitch layers
    for (let layer = 0; layer < 5; layer++) {
      const offsetX = (Math.random() - 0.5) * 8;
      const offsetY = (Math.random() - 0.5) * 6;
      const alpha = 0.2 + Math.random() * 0.2;
      const color = layer % 2 === 0 ? '#ff6060' : '#6060ff'; // red or blue shift
      ctx.fillStyle = color;
      ctx.globalAlpha = alpha;
      ctx.fillText(text, centerX + offsetX, textY + offsetY);
    }

    // Base text in pale cyan
    ctx.fillStyle = '#a0f0ff';
    ctx.globalAlpha = 0.9;
    ctx.fillText(text, centerX, textY);

    // Random small blocks (glitch artifacts)
    ctx.globalAlpha = 0.15;
    ctx.fillStyle = '#ffffff';
    for (let g = 0; g < 30; g++) {
      const gx = centerX - 150 + Math.random() * 300;
      const gy = textY - 30 + Math.random() * 60;
      ctx.fillRect(gx, gy, 2 + Math.random() * 6, 2 + Math.random() * 10);
    }

    // Thin horizontal scanlines
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 0.5;
    ctx.globalAlpha = 0.08;
    for (let s = 0; s < h; s += 8) {
      ctx.beginPath();
      ctx.moveTo(0, s);
      ctx.lineTo(w, s);
      ctx.stroke();
    }

    ctx.globalAlpha = 1.0;
    ctx.shadowBlur = 0; // final reset
  };

  // Animation loop
  const animate = (time) => {
    if (!animated) return;
    timeRef.current = time * speed; // scale time for rotation
    draw(timeRef.current);
    animationRef.current = requestAnimationFrame(animate);
  };

  useEffect(() => {
    // Initial draw (static or with time=0)
    draw(0);

    if (animated) {
      animationRef.current = requestAnimationFrame(animate);
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [width, height, animated, text, speed]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      style={{
        display: 'block',
        margin: '0 auto',
        boxShadow: '0 0 30px rgba(0,255,200,0.2)',
        borderRadius: '8px'
      }}
    />
  );
};

export default SpyralTech;