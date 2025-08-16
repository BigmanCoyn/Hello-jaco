// Simple particle-based spark system for a "real" lighter feel

(() => {
  const scene = document.getElementById("scene");
  const canvas = document.getElementById("sparkCanvas");
  const ctx = canvas.getContext("2d", { alpha: true });

  // Where sparks come from (SVG coordinates from index.html)
  // SVG viewBox is 220x300; the spark hole at (146, 102)
  const ORIGIN_SVG = { x: 146, y: 102 };
  let origin = { x: 0, y: 0 }; // will be calculated in pixels

  const DPR = Math.max(1, window.devicePixelRatio || 1);
  let width = 0, height = 0;

  function fitCanvas() {
    const rect = scene.getBoundingClientRect();
    width = Math.max(1, Math.floor(rect.width));
    height = Math.max(1, Math.floor(rect.height));

    // Scale canvas for crispness
    canvas.width = Math.floor(width * DPR);
    canvas.height = Math.floor(height * DPR);
    canvas.style.width = width + "px";
    canvas.style.height = height + "px";
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);

    // Convert SVG coords (220x300) to current scene pixels
    origin.x = (ORIGIN_SVG.x / 220) * width;
    origin.y = (ORIGIN_SVG.y / 300) * height;
  }

  // Particles
  const particles = [];
  const MAX_PARTICLES = 200;

  function rand(min, max) {
    return Math.random() * (max - min) + min;
  }

  function emit(count, power = 1) {
    for (let i = 0; i < count; i++) {
      if (particles.length >= MAX_PARTICLES) break;

      // Angle: spray mostly upward, with spread
      const angle = rand(-Math.PI * 0.15, Math.PI * 0.35); // forward/up spread
      const speed = rand(1.2, 3.6) * power;

      particles.push({
        x: origin.x + rand(-1.5, 1.5),
        y: origin.y + rand(-1.5, 1.5),
        vx: Math.cos(angle) * speed,
        vy: -Math.sin(angle) * speed - rand(0.5, 1.2), // initial pop
        life: 0,
        ttl: rand(300, 750), // ms
        size: rand(0.8, 2.0),
        hue: rand(30, 55), // warm range (goldish)
        alpha: 1
      });
    }
  }

  let last = performance.now();
  let nextMicro = last + 90;
  let nextBurst = last + 900;

  function tick(now) {
    const dt = Math.min(50, now - last); // clamp delta for stability
    last = now;

    // Schedule small micro-sparks (flicker)
    if (now >= nextMicro) {
      emit(Math.floor(rand(2, 5)), 0.85);
      nextMicro = now + rand(70, 140);
    }

    // Schedule larger burst (like striking the wheel)
    if (now >= nextBurst) {
      emit(Math.floor(rand(12, 22)), 1.3);
      nextBurst = now + rand(800, 1400);
    }

    // Physics + draw
    ctx.clearRect(0, 0, width, height);

    // Soft glow at origin
    const g = ctx.createRadialGradient(origin.x, origin.y, 0, origin.x, origin.y, 22);
    g.addColorStop(0, "rgba(255,240,150,0.85)");
    g.addColorStop(1, "rgba(255,240,150,0)");
    ctx.fillStyle = g;
    ctx.fillRect(origin.x - 22, origin.y - 22, 44, 44);

    ctx.globalCompositeOperation = "lighter";

    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];

      // Update
      p.life += dt;
      if (p.life > p.ttl) {
        particles.splice(i, 1);
        continue;
      }
      // Gravity + drag
      p.vy += 0.025 * (dt / 16.67);
      p.vx *= 0.996;
      p.vy *= 0.996;

      p.x += p.vx * (dt / 16.67);
      p.y += p.vy * (dt / 16.67);

      // Fade near end of life
      const t = p.life / p.ttl;
      p.alpha = 1 - t * t;

      // Draw
      ctx.beginPath();
      ctx.shadowBlur = 12;
      ctx.shadowColor = `hsla(${p.hue}, 95%, 60%, ${p.alpha})`;
      ctx.fillStyle = `hsla(${p.hue}, 95%, 60%, ${p.alpha})`;
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    }

    ctx.globalCompositeOperation = "source-over";
    requestAnimationFrame(tick);
  }

  // Resize handling
  const ro = new ResizeObserver(() => fitCanvas());
  ro.observe(scene);
  fitCanvas();
  requestAnimationFrame(tick);

  // Manual "strike" on tap/click
  scene.addEventListener("pointerdown", () => emit(24, 1.4));

  // YES/NO buttons
  document.getElementById("yesBtn").addEventListener("click", () => {
    alert("You said YES!");
  });
  document.getElementById("noBtn").addEventListener("click", () => {
    alert("You said NO!");
  });
})();
