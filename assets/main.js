/* =========================================================
   Lim — portfolio
   Партиклы на canvas, появление блоков, горизонтальная лента
   ========================================================= */

(() => {
  "use strict";

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const rand = (min, max) => min + Math.random() * (max - min);
  const clamp = (v, min, max) => Math.min(max, Math.max(min, v));

  /* ─────────────── партиклы ─────────────── */

  const canvas = document.getElementById("particles");
  const ctx = canvas ? canvas.getContext("2d") : null;

  const scene = {
    w: 0,
    h: 0,
    dpr: 1,
    particles: [],
    energy: 0,
    lastY: window.scrollY,
    pointer: { x: -9e3, y: -9e3 },
    raf: 0,
    running: false,
    lastT: 0,
  };

  function sizeCanvas() {
    scene.dpr = Math.min(window.devicePixelRatio || 1, 2);
    scene.w = window.innerWidth;
    scene.h = window.innerHeight;
    canvas.width = Math.round(scene.w * scene.dpr);
    canvas.height = Math.round(scene.h * scene.dpr);
    ctx.setTransform(scene.dpr, 0, 0, scene.dpr, 0, 0);
  }

  function spawn(initial) {
    const blue = Math.random() < 0.26;
    return {
      x: rand(0, scene.w),
      y: initial ? rand(0, scene.h) : scene.h + rand(0, 80),
      r: blue ? rand(0.7, 2.1) : rand(0.45, 1.7),
      vx: rand(-0.16, 0.16),
      vy: rand(-0.52, -0.16),
      a: blue ? rand(0.3, 0.8) : rand(0.16, 0.55),
      blue,
      tw: rand(0, Math.PI * 2),
      tws: rand(0.012, 0.03),
    };
  }

  function buildParticles() {
    const count = clamp(Math.round((scene.w * scene.h) / 15000), 26, 130);
    scene.particles = Array.from({ length: count }, () => spawn(true));
  }

  function paintParticle(p, alpha, twinkle) {
    const a = alpha * twinkle;
    ctx.fillStyle = p.blue ? `rgba(126,163,255,${a})` : `rgba(255,255,255,${a})`;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
    ctx.fill();
  }

  function renderStatic() {
    ctx.clearRect(0, 0, scene.w, scene.h);
    for (const p of scene.particles) {
      paintParticle(p, p.a, 1);
    }
    drawLinks(0);
  }

  function drawLinks(energy) {
    const limit = Math.min(scene.particles.length, 70);
    const maxDist = 110;
    const maxDist2 = maxDist * maxDist;
    ctx.lineWidth = 0.6;
    for (let i = 0; i < limit; i++) {
      const a = scene.particles[i];
      for (let j = i + 1; j < limit; j++) {
        const b = scene.particles[j];
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        const d2 = dx * dx + dy * dy;
        if (d2 > maxDist2) continue;
        const o = (1 - d2 / maxDist2) * 0.13 * (1 - Math.min(1, energy));
        if (o < 0.012) continue;
        ctx.strokeStyle = `rgba(140,172,255,${o})`;
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
      }
    }
  }

  function frame(now) {
    if (!scene.running) return;

    const dt = scene.lastT ? clamp((now - scene.lastT) / 16.667, 0.2, 2.4) : 1;
    scene.lastT = now;
    scene.energy *= Math.pow(0.92, dt);

    const boost = 1 + scene.energy * 15;
    const showTails = scene.energy > 0.06;

    ctx.clearRect(0, 0, scene.w, scene.h);

    for (const p of scene.particles) {
      p.x += p.vx * dt * boost;
      p.y += p.vy * dt * boost;

      // мягкое отталкивание от курсора
      const dx = p.x - scene.pointer.x;
      const dy = p.y - scene.pointer.y;
      const d2 = dx * dx + dy * dy;
      if (d2 < 17000 && d2 > 1) {
        const force = (1 - d2 / 17000) * 1.1 * dt;
        const d = Math.sqrt(d2);
        p.x += (dx / d) * force;
        p.y += (dy / d) * force;
      }

      if (p.y < -40) {
        p.y = scene.h + rand(10, 60);
        p.x = rand(0, scene.w);
      }
      if (p.x < -40) p.x = scene.w + 30;
      if (p.x > scene.w + 40) p.x = -30;

      p.tw += p.tws * dt;
      const twinkle = 0.72 + Math.sin(p.tw) * 0.28;

      if (showTails) {
        const len = Math.min(70, scene.energy * 72);
        ctx.globalAlpha = 0.3;
        ctx.strokeStyle = p.blue ? "rgba(126,163,255,0.85)" : "rgba(255,255,255,0.75)";
        ctx.lineWidth = Math.max(0.5, p.r * 0.75);
        ctx.beginPath();
        ctx.moveTo(p.x - p.vx * boost * len * 0.55, p.y - p.vy * boost * len * 0.55);
        ctx.lineTo(p.x, p.y);
        ctx.stroke();
        ctx.globalAlpha = 1;
      }

      paintParticle(p, p.a, twinkle);
    }

    drawLinks(scene.energy);

    scene.raf = requestAnimationFrame(frame);
  }

  function startParticles() {
    if (!ctx || scene.running) return;
    scene.running = true;
    scene.lastT = 0;
    scene.raf = requestAnimationFrame(frame);
  }

  function stopParticles() {
    scene.running = false;
    if (scene.raf) cancelAnimationFrame(scene.raf);
    scene.raf = 0;
  }

  function resetScene() {
    if (!ctx) return;
    sizeCanvas();
    buildParticles();
    stopParticles();
    if (reduceMotion.matches) {
      renderStatic();
    } else {
      startParticles();
    }
  }

  if (ctx) {
    resetScene();

    let resizeTimer = 0;
    window.addEventListener(
      "resize",
      () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(resetScene, 180);
      },
      { passive: true }
    );

    window.addEventListener(
      "scroll",
      () => {
        const y = window.scrollY;
        const delta = Math.abs(y - scene.lastY);
        scene.lastY = y;
        if (!reduceMotion.matches) {
          scene.energy = Math.min(1, scene.energy + Math.min(delta, 180) / 340);
        }
      },
      { passive: true }
    );

    window.addEventListener(
      "pointermove",
      (e) => {
        scene.pointer.x = e.clientX;
        scene.pointer.y = e.clientY;
      },
      { passive: true }
    );

    window.addEventListener("pointerleave", () => {
      scene.pointer.x = -9e3;
      scene.pointer.y = -9e3;
    });

    document.addEventListener("visibilitychange", () => {
      if (document.hidden) {
        stopParticles();
      } else if (!reduceMotion.matches) {
        startParticles();
      }
    });

    const onMotionChange = () => resetScene();
    if (typeof reduceMotion.addEventListener === "function") {
      reduceMotion.addEventListener("change", onMotionChange);
    }
  }

  /* ─────────────── появление блоков ─────────────── */

  const revealEls = document.querySelectorAll(".reveal");

  if (reduceMotion.matches || !("IntersectionObserver" in window)) {
    revealEls.forEach((el) => el.classList.add("is-in"));
  } else {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-in");
          io.unobserve(entry.target);
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -6% 0px" }
    );
    revealEls.forEach((el) => io.observe(el));
  }

  /* ─────────────── горизонтальная лента ─────────────── */

  const track = document.getElementById("works-track");
  const bar = document.getElementById("works-progress-bar");
  const prevBtn = document.querySelector('[data-scroll="prev"]');
  const nextBtn = document.querySelector('[data-scroll="next"]');

  if (track) {
    const smooth = () => (reduceMotion.matches ? "auto" : "smooth");
    const maxScroll = () => Math.max(0, track.scrollWidth - track.clientWidth);

    const stepSize = () => {
      const first = track.querySelector(".work");
      if (!first) return 340;
      const gap = parseFloat(getComputedStyle(track).columnGap) || 20;
      return first.getBoundingClientRect().width + gap;
    };

    let ticking = false;
    const syncUI = () => {
      ticking = false;
      const max = maxScroll();
      const progress = max > 0 ? clamp(track.scrollLeft / max, 0, 1) : 0;

      if (bar) bar.style.transform = `scaleX(${0.12 + progress * 0.88})`;
      if (prevBtn) prevBtn.disabled = track.scrollLeft <= 4;
      if (nextBtn) nextBtn.disabled = track.scrollLeft >= max - 4;
      track.classList.toggle("is-scrollable", max > 4);
    };

    const requestSync = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(syncUI);
    };

    const nudge = (dir) => {
      track.scrollBy({ left: dir * stepSize(), behavior: smooth() });
    };

    if (nextBtn) nextBtn.addEventListener("click", () => nudge(1));
    if (prevBtn) prevBtn.addEventListener("click", () => nudge(-1));

    track.addEventListener("scroll", requestSync, { passive: true });
    window.addEventListener("resize", requestSync, { passive: true });
    requestSync();

    track.addEventListener("keydown", (e) => {
      if (e.key === "ArrowRight") {
        e.preventDefault();
        nudge(1);
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        nudge(-1);
      } else if (e.key === "Home") {
        e.preventDefault();
        track.scrollTo({ left: 0, behavior: smooth() });
      } else if (e.key === "End") {
        e.preventDefault();
        track.scrollTo({ left: maxScroll(), behavior: smooth() });
      }
    });

    /* перетаскивание мышью (для тач-устройств работает нативный скролл) */
    let drag = null;
    let suppressClick = false;

    track.addEventListener(
      "click",
      (e) => {
        if (!suppressClick) return;
        e.preventDefault();
        e.stopPropagation();
        suppressClick = false;
      },
      true
    );

    track.addEventListener("pointerdown", (e) => {
      if (e.pointerType === "mouse" && e.button !== 0) return;
      drag = {
        id: e.pointerId,
        startX: e.clientX,
        startLeft: track.scrollLeft,
        moved: 0,
        active: false,
      };
    });

    track.addEventListener("pointermove", (e) => {
      if (!drag || e.pointerId !== drag.id) return;
      const dx = e.clientX - drag.startX;

      if (!drag.active) {
        if (Math.abs(dx) < 8) return;
        drag.active = true;
        track.classList.add("is-dragging");
        track.setPointerCapture(e.pointerId);
      }

      drag.moved = dx;
      track.scrollLeft = drag.startLeft - dx;
    });

    const endDrag = (e) => {
      if (!drag || (e.pointerId !== undefined && e.pointerId !== drag.id)) return;
      const moved = drag.moved;
      const wasActive = drag.active;
      drag = null;
      track.classList.remove("is-dragging");

      if (wasActive && Math.abs(moved) > 8) {
        suppressClick = true;
        setTimeout(() => {
          suppressClick = false;
        }, 400);
      }

      if (wasActive && Math.abs(moved) > 36 && !reduceMotion.matches) {
        track.scrollBy({ left: -moved * 0.3, behavior: "smooth" });
      }
    };

    track.addEventListener("pointerup", endDrag);
    track.addEventListener("pointercancel", endDrag);
    track.addEventListener("pointerleave", endDrag);

    /* колесо: вертикальный скролл листает ленту, на краях — отдаём странице */
    track.addEventListener(
      "wheel",
      (e) => {
        if (reduceMotion.matches || e.ctrlKey) return;
        if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;

        const max = maxScroll();
        if (max <= 0) return;

        const atStart = track.scrollLeft <= 0;
        const atEnd = track.scrollLeft >= max - 1;
        const goingDown = e.deltaY > 0;

        if ((goingDown && atEnd) || (!goingDown && atStart)) return;

        e.preventDefault();
        const unit = e.deltaMode === 1 ? 24 : 1;
        track.scrollLeft += e.deltaY * unit;
        scene.energy = Math.min(1, scene.energy + Math.min(Math.abs(e.deltaY), 120) / 800);
      },
      { passive: false }
    );
  }

  /* ─────────────── шапка и год ─────────────── */

  const topbar = document.querySelector(".topbar");
  if (topbar) {
    const syncTopbar = () => {
      topbar.classList.toggle("is-scrolled", window.scrollY > 12);
    };
    syncTopbar();
    window.addEventListener("scroll", syncTopbar, { passive: true });
  }

  const year = document.getElementById("year");
  if (year) year.textContent = String(new Date().getFullYear());
})();
