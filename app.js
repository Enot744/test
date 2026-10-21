/**
 * ============================================================================
 * ОСНОВНА ЛОГІКА ТА ІНТЕРАКТИВ САЙТУ VERS (vers.com.ua)
 * ============================================================================
 * Включає:
 * 1. Кінематографічне інтро + розкриття елементів
 * 2. Blueprint Spotlight (ефект живого креслення на головному екрані з хвилями)
 * 3. Анімацію чисел (лічильники статистики) та плавний скрол-рев'ю
 * 4. 3D Canvas анімацію трьох етапів виготовлення меблів
 * 5. Динамічний рендер Портфоліо з фільтрацією, лайтбоксом та конструктором додавання
 * 6. Динамічний рендер Відгуків клієнтів із формою додавання нового відгуку
 */

document.addEventListener("DOMContentLoaded", () => {
  initViewportHeight();
  initIntroSequence();
  initMobileNav();
  initHeroBlueprint();
  initStatsAndScrollReveal();
  initThreeStagesCanvas();
  initPortfolioSection();
  initReviewsSection();
  initFloatingEstimate();
  initScrollToTop();
});

/* ==========================================================================
   1. VIEWPORT HEIGHT VARIABLE (--vvh)
   ========================================================================== */
function initViewportHeight() {
  const docEl = document.documentElement;
  function updateVvh() {
    const v = window.visualViewport;
    const h = (v && v.height) || window.innerHeight;
    if (h) docEl.style.setProperty("--vvh", Math.round(h) + "px");
  }
  updateVvh();
  let lastWidth = window.innerWidth;
  window.addEventListener("resize", () => {
    if (window.innerWidth !== lastWidth) {
      lastWidth = window.innerWidth;
      updateVvh();
    }
  });
}

/* ==========================================================================
   2. SMOOTH INITIAL REVEAL (без швидкого слайд-шоу на завантаженні)
   ========================================================================== */
function initIntroSequence() {
  const introEl = document.getElementById("preload-intro");
  if (introEl) introEl.style.display = "none";
  document.documentElement.dataset.intro = "reveal";
  document.documentElement.style.overflow = "";
  setTimeout(() => {
    document.documentElement.removeAttribute("data-intro");
  }, 900);
}

/* ==========================================================================
   3. MOBILE NAVIGATION DRAWER
   ========================================================================== */
function initMobileNav() {
  const toggleBtn = document.getElementById("mobile-menu-toggle");
  const drawer = document.getElementById("mobile-drawer");
  const iconOpen = document.getElementById("menu-icon-open");
  const iconClose = document.getElementById("menu-icon-close");
  if (!toggleBtn || !drawer) return;

  let isOpen = false;
  function setMenu(state) {
    isOpen = state;
    drawer.classList.toggle("is-open", isOpen);
    toggleBtn.setAttribute("aria-expanded", String(isOpen));
    if (iconOpen && iconClose) {
      iconOpen.style.display = isOpen ? "none" : "block";
      iconClose.style.display = isOpen ? "block" : "none";
    }
    document.body.style.overflow = isOpen ? "hidden" : "";
  }

  toggleBtn.addEventListener("click", () => setMenu(!isOpen));

  drawer.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => setMenu(false));
  });
}

/* ==========================================================================
   4. HERO BLUEPRINT SPOTLIGHT & RIPPLES
   ========================================================================== */
function initHeroBlueprint() {
  const container = document.getElementById("hero-blueprint-container");
  const overlay = document.getElementById("hero-blueprint-overlay");
  const ripplesBox = document.getElementById("hero-blueprint-ripples");
  if (!container || !overlay) return;

  const isMobile = () => window.innerWidth < 880;
  const baseRadius = () => (isMobile() ? 135 : 235);
  const softEdge = () => (isMobile() ? 38 : 65);

  let rect = container.getBoundingClientRect();
  let target = { x: rect.width / 2, y: rect.height * 0.48, lastMoved: 0, seen: false };
  let current = { x: rect.width / 2, y: rect.height * 0.48 };
  let lastRippleTime = 0;
  let autoRippleTime = performance.now();

  overlay.style.opacity = "1";
  overlay.style.setProperty("--mr", baseRadius() + "px");
  overlay.style.setProperty("--ms", softEdge() + "px");
  overlay.style.setProperty("--mx", current.x + "px");
  overlay.style.setProperty("--my", current.y + "px");

  function spawnRipple(x, y) {
    if (!ripplesBox) return;
    const ripple = document.createElement("div");
    ripple.className = "blueprint-ripple";
    ripple.style.left = x + "px";
    ripple.style.top = y + "px";
    ripplesBox.appendChild(ripple);

    const start = performance.now();
    const maxR = baseRadius() * 2;

    function animRipple(now) {
      const t = Math.min(1, (now - start) / 850);
      const ease = 1 - Math.pow(1 - t, 3);
      const size = ease * maxR;
      ripple.style.width = size + "px";
      ripple.style.height = size + "px";
      ripple.style.opacity = String((1 - t) * 0.68);
      if (t < 1) {
        requestAnimationFrame(animRipple);
      } else {
        ripple.remove();
      }
    }
    requestAnimationFrame(animRipple);
  }

  container.addEventListener("mousemove", (e) => {
    rect = container.getBoundingClientRect();
    target.x = e.clientX - rect.left;
    target.y = e.clientY - rect.top;
    target.lastMoved = performance.now();
    target.seen = true;

    const now = performance.now();
    if (now - lastRippleTime > 260) {
      spawnRipple(target.x, target.y);
      lastRippleTime = now;
    }
  });

  container.addEventListener("mouseleave", () => {
    rect = container.getBoundingClientRect();
    target.x = rect.width / 2;
    target.y = rect.height * 0.42;
  });

  function handleTouch(e) {
    const touch = e.touches[0];
    if (!touch) return;
    rect = container.getBoundingClientRect();
    target.x = touch.clientX - rect.left;
    target.y = touch.clientY - rect.top;
    target.lastMoved = performance.now();
    target.seen = true;
    const now = performance.now();
    if (now - lastRippleTime > 260) {
      spawnRipple(target.x, target.y);
      lastRippleTime = now;
    }
  }

  container.addEventListener("touchstart", handleTouch, { passive: true });
  container.addEventListener("touchmove", handleTouch, { passive: true });

  window.addEventListener("resize", () => {
    rect = container.getBoundingClientRect();
    overlay.style.setProperty("--mr", baseRadius() + "px");
    overlay.style.setProperty("--ms", softEdge() + "px");
  });

  function tick(now) {
    // Плавно скануємо креслення по кухні, коли користувач не рухає пальцем/мишкою (особливо ефектно на телефоні)
    if (now - target.lastMoved > 2200) {
      rect = container.getBoundingClientRect();
      const t = now * 0.00075;
      target.x = rect.width * (0.5 + 0.24 * Math.sin(t));
      target.y = rect.height * (0.45 + 0.1 * Math.cos(t * 1.4));
    }

    const dx = target.x - current.x;
    const dy = target.y - current.y;
    if (Math.abs(dx) > 0.3 || Math.abs(dy) > 0.3) {
      current.x += dx * 0.14;
      current.y += dy * 0.14;
      overlay.style.setProperty("--mx", current.x.toFixed(1) + "px");
      overlay.style.setProperty("--my", current.y.toFixed(1) + "px");
    }

    if (now - autoRippleTime > 2800 && now - target.lastMoved > 900) {
      spawnRipple(current.x, current.y);
      autoRippleTime = now;
    }
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}

/* ==========================================================================
   5. STATS COUNTER & SCROLL REVEAL
   ========================================================================== */
function initStatsAndScrollReveal() {
  // Animated numbers
  const statEls = document.querySelectorAll("[data-stat-target]");
  const statObserver = new IntersectionObserver(
    (entries, obs) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const el = entry.target;
        obs.unobserve(el);
        const targetVal = parseInt(el.getAttribute("data-stat-target") || "0", 10);
        const suffix = el.getAttribute("data-stat-suffix") || "";
        const duration = 1700;
        const start = performance.now();

        function updateCounter(now) {
          const p = Math.min(1, (now - start) / duration);
          const ease = p === 1 ? 1 : 1 - Math.pow(2, -10 * p);
          const currentVal = Math.round(ease * targetVal);
          const formatted = currentVal.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
          el.textContent = formatted + suffix;
          if (p < 1) requestAnimationFrame(updateCounter);
        }
        requestAnimationFrame(updateCounter);
      });
    },
    { threshold: 0.35 }
  );

  statEls.forEach((el) => statObserver.observe(el));

  // Reveal elements on scroll
  const revealEls = document.querySelectorAll(".reveal-up");
  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
        }
      });
    },
    { threshold: 0.12 }
  );
  revealEls.forEach((el) => revealObserver.observe(el));
}

/* ==========================================================================
   6. THREE STAGES 3D CANVAS ANIMATION
   ========================================================================== */
function initThreeStagesCanvas() {
  const section = document.getElementById("process");
  const canvas = document.getElementById("stages-canvas");
  if (!section || !canvas) return;
  const ctx = canvas.getContext("2d", { alpha: false });
  if (!ctx) return;

  // Build available frame list (we downloaded every 4th frame + final frame of each stage)
  const rawCounts = [97, 121, 121];
  const stageFrames = [[], [], []];

  for (let s = 0; s < 3; s++) {
    const sNum = String(s + 1).padStart(2, "0");
    const maxF = rawCounts[s];
    for (let f = 1; f <= maxF; f += 4) {
      stageFrames[s].push(`animation/three-stages/${sNum}/frame-${String(f).padStart(4, "0")}.webp`);
    }
    const lastPath = `animation/three-stages/${sNum}/frame-${String(maxF).padStart(4, "0")}.webp`;
    if (stageFrames[s][stageFrames[s].length - 1] !== lastPath) {
      stageFrames[s].push(lastPath);
    }
  }

  const imageCache = new Map();
  let activeStage = 0;
  let stageElapsed = 0;
  const stageDurations = [4800, 5400, 5400];
  let lastTick = null;
  let isHovered = false;
  let inView = false;
  let lastDrawnSrc = "";

  function resizeCanvas() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const rect = canvas.getBoundingClientRect();
    const w = Math.max(1, Math.round(rect.width * dpr));
    const h = Math.max(1, Math.round(rect.height * dpr));
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
      lastDrawnSrc = "";
    }
  }

  function preloadStageFrames(sIdx) {
    stageFrames[sIdx].forEach((src) => {
      if (!imageCache.has(src)) {
        const img = new Image();
        img.decoding = "async";
        img.src = src;
        imageCache.set(src, img);
      }
    });
  }

  // Preload first frame of each stage immediately
  [0, 1, 2].forEach((s) => {
    const firstSrc = stageFrames[s][0];
    const img = new Image();
    img.src = firstSrc;
    img.onload = () => {
      if (s === 0 && !lastDrawnSrc) drawFrame(firstSrc);
    };
    imageCache.set(firstSrc, img);
  });

  function drawFrame(src) {
    const img = imageCache.get(src);
    if (!img || !img.complete || img.naturalWidth === 0) return;
    if (src === lastDrawnSrc) return;
    lastDrawnSrc = src;

    const iw = img.naturalWidth;
    const ih = img.naturalHeight;
    const cw = canvas.width;
    const ch = canvas.height;
    const scale = Math.max(cw / iw, ch / ih);
    const dw = iw * scale;
    const dh = ih * scale;
    ctx.drawImage(img, (cw - dw) / 2, (ch - dh) / 2, dw, dh);
  }

  function updateStageUI(stageIdx, progress) {
    // Desktop & Mobile step buttons
    section.querySelectorAll("[data-stage-btn]").forEach((btn) => {
      const idx = parseInt(btn.getAttribute("data-stage-btn"), 10);
      const numSpan = btn.querySelector("[data-stage-num]");
      const labelSpan = btn.querySelector("[data-stage-label]");
      const barWrap = btn.querySelector("[data-stage-bar-wrap]");
      const barFill = btn.querySelector("[data-stage-bar-fill]");

      const isActive = idx === stageIdx;
      const isDone = idx < stageIdx;

      if (numSpan) {
        numSpan.style.color = isActive || isDone ? "var(--color-accent)" : "var(--color-fg-disabled)";
      }
      if (labelSpan) {
        labelSpan.style.color = isActive ? "var(--color-fg-cool)" : "var(--color-fg-disabled)";
      }
      if (barWrap) {
        barWrap.style.opacity = isActive ? "1" : "0.25";
      }
      if (barFill) {
        const w = isDone ? 100 : isActive ? Math.min(100, Math.max(0, progress * 100)) : 0;
        barFill.style.width = w.toFixed(1) + "%";
      }
    });

    // Desktop accordion bodies
    section.querySelectorAll("[data-stage-panel]").forEach((panel) => {
      const idx = parseInt(panel.getAttribute("data-stage-panel"), 10);
      const isOpen = idx === stageIdx;
      panel.style.gridTemplateRows = isOpen ? "1fr" : "0fr";
      const inner = panel.querySelector("[data-stage-panel-inner]");
      if (inner) {
        inner.style.opacity = isOpen ? "1" : "0";
        inner.style.transform = isOpen ? "translateY(0)" : "translateY(10px)";
      }
    });

    // Mobile stage text container
    section.querySelectorAll("[data-mobile-stage-content]").forEach((box) => {
      const idx = parseInt(box.getAttribute("data-mobile-stage-content"), 10);
      box.style.display = idx === stageIdx ? "block" : "none";
    });
  }

  function jumpToStage(idx) {
    activeStage = idx;
    stageElapsed = 0;
    lastTick = null;
    preloadStageFrames(idx);
    drawFrame(stageFrames[idx][0]);
    updateStageUI(activeStage, 0);
  }

  section.querySelectorAll("[data-stage-btn]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const idx = parseInt(btn.getAttribute("data-stage-btn"), 10);
      jumpToStage(idx);
    });
  });

  const replayBtn = document.getElementById("stages-replay-btn");
  if (replayBtn) {
    replayBtn.addEventListener("click", () => jumpToStage(0));
  }

  const interactiveZones = section.querySelectorAll("[data-stage-interactive]");
  interactiveZones.forEach((z) => {
    z.addEventListener("mouseenter", () => (isHovered = true));
    z.addEventListener("mouseleave", () => (isHovered = false));
  });

  const observer = new IntersectionObserver(
    ([entry]) => {
      inView = entry.isIntersecting;
      if (inView) {
        preloadStageFrames(0);
        preloadStageFrames(1);
        preloadStageFrames(2);
      }
    },
    { threshold: 0.25 }
  );
  observer.observe(section);

  resizeCanvas();
  window.addEventListener("resize", () => {
    resizeCanvas();
    const list = stageFrames[activeStage];
    const progress = Math.min(1, stageElapsed / stageDurations[activeStage]);
    const fIdx = Math.min(list.length - 1, Math.floor(progress * list.length));
    drawFrame(list[fIdx]);
  });

  updateStageUI(0, 0);

  function loop(now) {
    if (inView && !isHovered) {
      if (lastTick === null) lastTick = now;
      const dt = Math.min(100, now - lastTick);
      lastTick = now;
      stageElapsed += dt;

      const dur = stageDurations[activeStage];
      const progress = Math.min(1, stageElapsed / dur);
      const list = stageFrames[activeStage];
      const fIdx = Math.min(list.length - 1, Math.floor(progress * list.length));
      drawFrame(list[fIdx]);
      updateStageUI(activeStage, progress);

      if (stageElapsed >= dur) {
        if (activeStage < 2) {
          activeStage++;
          stageElapsed = 0;
        } else {
          activeStage = 0;
          stageElapsed = 0;
        }
      }
    } else {
      lastTick = null;
    }
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
}

/* ==========================================================================
   7. PORTFOLIO SECTION — кожна вкладка = своя папка з фото + сторінки
   ========================================================================== */
function initPortfolioSection() {
  const desktopList = document.getElementById("portfolio-desktop-list");
  const mobileGrid = document.getElementById("portfolio-mobile-grid");
  const shownStatus = document.getElementById("portfolio-shown-status");
  const showMoreBtn = document.getElementById("portfolio-show-more");
  const filterBtns = document.querySelectorAll("[data-portfolio-filter]");
  if (!mobileGrid) return;

  // старі списки проєктів більше не потрібні
  if (desktopList) desktopList.style.display = "none";
  mobileGrid.style.display = "none";
  if (showMoreBtn) showMoreBtn.style.display = "none";

  const FOLDERS = window.VERS_FOLDERS || { all: "mix/" };
  const PAGE_SIZE = window.VERS_PAGE_SIZE || 12;
  const EXTS = ["jpg", "jpeg", "png", "webp", "JPG", "JPEG", "PNG", "WEBP"];
  const isImg = (n) => /\.(jpe?g|png|webp|gif|avif)$/i.test(n);
  const naturalSort = (a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" });

  const gallery = document.createElement("div");
  gallery.id = "mix-gallery";
  gallery.className = "mix-gallery";
  mobileGrid.parentNode.insertBefore(gallery, mobileGrid);
  const pager = document.createElement("nav");
  pager.className = "mix-pager";
  pager.setAttribute("aria-label", "Сторінки галереї");
  gallery.after(pager);

  const cache = {}; // filter -> array | Promise
  const pages = {}; // filter -> current page
  let currentFilter = "all";

  function probe(src) {
    return new Promise((res) => {
      const i = new Image();
      i.onload = () => res(true);
      i.onerror = () => res(false);
      i.src = src;
    });
  }

  async function findPhotos(key) {
    const dir = FOLDERS[key];
    if (!dir) return [];
    const withDir = (arr) => arr.filter(isImg).sort(naturalSort).map((n) => dir + n);

    // 0) dir/list.js (створює update-photos.py; працює і без сервера)
    const fromJs = (window.VERS_PHOTOS || {})[dir.replace(/\/$/, "")];
    if (Array.isArray(fromJs) && fromJs.length) return withDir(fromJs);

    // 1) dir/list.json
    try {
      const r = await fetch(dir + "list.json", { cache: "no-cache" });
      if (r.ok) {
        const arr = await r.json();
        if (Array.isArray(arr) && arr.length) return withDir(arr);
      }
    } catch (e) {}

    // 2) лістинг папки на сервері
    try {
      const r = await fetch(dir, { cache: "no-cache" });
      if (r.ok) {
        const doc = new DOMParser().parseFromString(await r.text(), "text/html");
        const names = [...doc.querySelectorAll("a")]
          .map((x) => decodeURIComponent((x.getAttribute("href") || "").split("?")[0].split("/").pop()))
          .filter(isImg);
        if (names.length) return withDir([...new Set(names)]);
      }
    } catch (e) {}

    // 3) запасний варіант: <папка>1.jpg, <папка>2.jpg ... (mix1.jpg, kitchens1.jpg)
    const base = dir.replace(/\/$/, "");
    const found = [];
    let misses = 0;
    for (let n = 1; n <= 300 && misses < 4; n++) {
      let ok = false;
      for (const ext of EXTS) {
        const src = dir + base + n + "." + ext;
        if (await probe(src)) { found.push(src); ok = true; break; }
      }
      misses = ok ? 0 : misses + 1;
    }
    return found;
  }

  function getPhotos(key) {
    if (!cache[key]) cache[key] = findPhotos(key).then((l) => (cache[key] = l));
    return Promise.resolve(cache[key]);
  }

  /* ---------- Перегляд фото на весь екран ---------- */
  const viewer = document.createElement("div");
  viewer.className = "photo-viewer";
  viewer.innerHTML =
    '<button type="button" class="pv-close" aria-label="Закрити">✕</button>' +
    '<button type="button" class="pv-prev" aria-label="Попереднє">‹</button>' +
    '<img alt="" />' +
    '<button type="button" class="pv-next" aria-label="Наступне">›</button>' +
    '<span class="pv-count"></span>';
  document.body.appendChild(viewer);
  const pvImg = viewer.querySelector("img");
  const pvCount = viewer.querySelector(".pv-count");
  let pvList = [];
  let pvIdx = 0;
  function pvShow(i) {
    pvIdx = (i + pvList.length) % pvList.length;
    pvImg.src = pvList[pvIdx];
    pvCount.textContent = pvIdx + 1 + " / " + pvList.length;
  }
  function pvOpen(list, i) {
    pvList = list;
    pvShow(i);
    viewer.classList.add("is-open");
    document.body.style.overflow = "hidden";
  }
  function pvClose() {
    viewer.classList.remove("is-open");
    document.body.style.overflow = "";
  }
  viewer.querySelector(".pv-close").addEventListener("click", pvClose);
  viewer.querySelector(".pv-prev").addEventListener("click", (e) => { e.stopPropagation(); pvShow(pvIdx - 1); });
  viewer.querySelector(".pv-next").addEventListener("click", (e) => { e.stopPropagation(); pvShow(pvIdx + 1); });
  viewer.addEventListener("click", (e) => { if (e.target === viewer) pvClose(); });
  document.addEventListener("keydown", (e) => {
    if (!viewer.classList.contains("is-open")) return;
    if (e.key === "Escape") pvClose();
    if (e.key === "ArrowLeft") pvShow(pvIdx - 1);
    if (e.key === "ArrowRight") pvShow(pvIdx + 1);
  });

  /* ---------- Рендер галереї зі сторінками ---------- */
  function render() {
    const key = currentFilter;
    gallery.innerHTML = '<p class="mix-empty font-mono">Завантаження робіт…</p>';
    pager.innerHTML = "";
    if (shownStatus) shownStatus.textContent = "";

    getPhotos(key).then((list) => {
      if (key !== currentFilter) return; // користувач вже перейшов на іншу вкладку
      if (!list.length) {
        gallery.innerHTML = `<p class="mix-empty font-mono">Тут поки що немає фото. Додайте їх у папку «${(FOLDERS[key] || "").replace("/", "")}» і запустіть update-photos.py</p>`;
        return;
      }
      const total = Math.max(1, Math.ceil(list.length / PAGE_SIZE));
      const page = Math.min(Math.max(1, pages[key] || 1), total);
      pages[key] = page;
      const from = (page - 1) * PAGE_SIZE;

      gallery.innerHTML = list
        .slice(from, from + PAGE_SIZE)
        .map((src, k) => `<button type="button" class="mix-item" data-idx="${from + k}" aria-label="Фото ${from + k + 1}"><img src="${src}" alt="Робота VERS ${from + k + 1}" loading="lazy" /></button>`)
        .join("");
      gallery.querySelectorAll(".mix-item").forEach((b) =>
        b.addEventListener("click", () => pvOpen(list, Number(b.dataset.idx)))
      );

      if (total > 1) {
        const nums = [];
        for (let n = 1; n <= total; n++) {
          if (n === 1 || n === total || Math.abs(n - page) <= 2) nums.push(n);
          else if (nums[nums.length - 1] !== "…") nums.push("…");
        }
        pager.innerHTML =
          `<button type="button" class="mix-page-btn" data-page="${page - 1}" ${page === 1 ? "disabled" : ""} aria-label="Попередня">←</button>` +
          nums
            .map((n) => n === "…"
              ? '<span class="mix-page-dots">…</span>'
              : `<button type="button" class="mix-page-btn${n === page ? " active" : ""}" data-page="${n}" ${n === page ? 'aria-current="page"' : ""}>${n}</button>`)
            .join("") +
          `<button type="button" class="mix-page-btn" data-page="${page + 1}" ${page === total ? "disabled" : ""} aria-label="Наступна">→</button>`;
        pager.querySelectorAll("[data-page]").forEach((b) =>
          b.addEventListener("click", () => {
            pages[key] = Number(b.dataset.page);
            render();
            document.getElementById("portfolio")?.scrollIntoView({ behavior: "smooth", block: "start" });
          })
        );
      }
      if (shownStatus) shownStatus.textContent = `${list.length} фото · сторінка ${page} з ${total}`;
    });
  }

  filterBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      filterBtns.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      currentFilter = btn.getAttribute("data-portfolio-filter") || "all";
      render();
    });
  });

  render();
}

/* ==========================================================================
   PROJECT LIGHTBOX MODAL
   ========================================================================== */
function openProjectModal(proj) {
  const modal = document.getElementById("project-lightbox-modal");
  const content = document.getElementById("project-lightbox-content");
  if (!modal || !content) return;

  const thumbs = proj.thumbnails && proj.thumbnails.length ? proj.thumbnails : [proj.hero];
  const specsHtml = (proj.specs || [])
    .map(
      (s) => `
      <div style="display:flex;justify-content:space-between;gap:16px;padding:12px 0;border-bottom:1px solid var(--color-line);">
        <dt class="font-mono" style="font-size:11px;letter-spacing:1.2px;text-transform:uppercase;color:var(--color-fg-muted);">${s.label}</dt>
        <dd style="font-size:14px;color:var(--color-fg);text-align:right;">${s.value}</dd>
      </div>`
    )
    .join("");

  content.innerHTML = `
    <div style="display:grid;grid-template-columns:1fr;gap:32px;padding:28px;">
      <div style="display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid var(--color-line);padding-bottom:18px;">
        <div style="display:flex;align-items:center;gap:12px;">
          <span class="font-mono" style="font-size:11px;letter-spacing:1.4px;text-transform:uppercase;color:var(--color-accent);">${proj.categoryLabel}</span>
          <span style="color:var(--color-fg-disabled);">·</span>
          <span class="font-mono" style="font-size:11px;color:var(--color-fg-muted);">${proj.city} · ${proj.year}</span>
        </div>
        <button type="button" id="close-project-lightbox" style="width:40px;height:40px;display:flex;align-items:center;justify-content:center;border:1px solid var(--color-line-strong);color:var(--color-fg);font-size:18px;">✕</button>
      </div>

      <div style="display:grid;grid-template-columns:1fr;gap:32px;" class="lightbox-grid">
        <div>
          <div style="position:relative;width:100%;aspect-ratio:16/10;background:var(--color-bg-tile);overflow:hidden;border:1px solid var(--color-line);">
            <img id="lightbox-main-img" src="${proj.hero}" alt="${proj.title}" style="width:100%;height:100%;object-fit:cover;" />
          </div>
          <div style="display:flex;gap:12px;margin-top:14px;overflow-x:auto;padding-bottom:6px;">
            ${thumbs
              .map(
                (t, i) => `
              <button type="button" data-lightbox-thumb="${t}" style="width:96px;height:66px;flex-shrink:0;border:1px solid ${
                  i === 0 ? "var(--color-accent)" : "var(--color-line)"
                };overflow:hidden;background:var(--color-bg-tile);">
                <img src="${t}" alt="" style="width:100%;height:100%;object-fit:cover;" />
              </button>`
              )
              .join("")}
          </div>
        </div>

        <div style="display:flex;flex-direction:column;justify-content:space-between;gap:24px;">
          <div>
            <h2 class="font-serif" style="font-weight:300;font-size:clamp(26px,3vw,38px);line-height:1.15;color:var(--color-fg);margin-bottom:18px;">
              ${proj.title}
            </h2>
            <p style="font-weight:300;font-size:15px;line-height:1.65;color:var(--color-fg-soft);margin-bottom:24px;">
              ${proj.description}
            </p>
            <dl style="border-top:1px solid var(--color-line);">
              <div style="display:flex;justify-content:space-between;gap:16px;padding:12px 0;border-bottom:1px solid var(--color-line);">
                <dt class="font-mono" style="font-size:11px;letter-spacing:1.2px;text-transform:uppercase;color:var(--color-fg-muted);">СТИЛЬ</dt>
                <dd style="font-size:14px;color:var(--color-fg);text-align:right;">${proj.style}</dd>
              </div>
              ${specsHtml}
            </dl>
          </div>

          <div style="display:flex;flex-wrap:wrap;gap:14px;align-items:center;padding-top:12px;">
            <a href="#contact" id="lightbox-order-cta" class="cta-double">
              <span class="cta-double-pad">
                <span class="cta-double-inner">
                  <span class="cta-double-text">Розрахувати подібний проєкт</span>
                  <span>↗</span>
                </span>
              </span>
            </a>
            <a href="tel:+380503641383" class="font-mono" style="padding:14px 20px;border:1px solid var(--color-line-strong);font-size:12px;color:var(--color-accent);">
              +380 50 364 13 83
            </a>
          </div>
        </div>
      </div>
    </div>
  `;

  modal.classList.add("is-open");
  document.body.style.overflow = "hidden";

  const closeModal = () => {
    modal.classList.remove("is-open");
    document.body.style.overflow = "";
  };

  document.getElementById("close-project-lightbox")?.addEventListener("click", closeModal);
  document.getElementById("lightbox-order-cta")?.addEventListener("click", closeModal);
  modal.onclick = (e) => {
    if (e.target === modal) closeModal();
  };

  const mainImg = document.getElementById("lightbox-main-img");
  content.querySelectorAll("[data-lightbox-thumb]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const src = btn.getAttribute("data-lightbox-thumb");
      if (mainImg && src) mainImg.src = src;
      content.querySelectorAll("[data-lightbox-thumb]").forEach((b) => {
        b.style.borderColor = b === btn ? "var(--color-accent)" : "var(--color-line)";
      });
    });
  });
}

/* ==========================================================================
   8. REVIEWS SECTION
   ========================================================================== */
function initReviewsSection() {
  const grid = document.getElementById("reviews-grid");
  if (!grid) return;

  const allReviews = window.VERS_REVIEWS || [];
  const defaultGoogleUrl = (window.VERS_CONFIG && window.VERS_CONFIG.googleMapsReviewsUrl) ||
    "https://www.google.com/maps/place/Vers+-+%D0%9C%D0%B5%D0%B1%D0%B5%D0%BB%D1%8C+%D0%BD%D0%B0+%D0%B7%D0%B0%D0%BA%D0%B0%D0%B7+%D0%9A%D1%83%D1%85%D0%BD%D0%B8+%7C+%D0%A8%D0%BA%D0%B0%D1%84%D1%8B+%D0%BA%D1%83%D0%BF%D0%B5+%7C+%D0%9A%D0%BE%D1%80%D0%BF%D1%83%D1%81%D0%BD%D0%B0%D1%8F+%D0%BC%D0%B5%D0%B1%D0%B5%D0%BB%D1%8C/data=!4m7!3m6!1s0x4127a142c72c5045:0x7adb38b79162d021!8m2!3d49.9978826!4d36.2276099!16s%2Fg%2F11nh9bfpyf!19sChIJRVAsx0KhJ0ERIdBikbc423o?authuser=0&hl=ru";

  grid.innerHTML = allReviews
    .map((r) => {
      const stars = "★".repeat(Math.min(5, Math.max(1, r.rating || 5)));
      const targetUrl = r.url || defaultGoogleUrl;
      const formattedText = (r.text || "").replace(/\n/g, "<br/>");
      const continueLink = r.hasContinuation
        ? `<span class="review-continue-link">Читати продовження в Google ↗</span>`
        : "";
      return `
        <a href="${targetUrl}" target="_blank" rel="noopener noreferrer" class="review-card" aria-label="Читати відгук від ${r.author}">
          <div style="display:flex;flex-direction:column;gap:18px;">
            <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;">
              <div class="review-stars" aria-label="Рейтинг 5 з 5">${stars}</div>
              <span class="font-mono" style="font-size:10px;letter-spacing:1.2px;text-transform:uppercase;color:var(--color-fg-muted);">${r.date || ""}</span>
            </div>
            <p class="font-mono" style="font-size:11px;letter-spacing:0.8px;color:var(--color-accent);text-transform:uppercase;">
              ${r.service || "Меблі на замовлення"}
            </p>
            <blockquote class="review-quote">
              «${formattedText}»
              ${continueLink}
            </blockquote>
          </div>
          <div class="review-meta">
            <div>
              <p class="font-serif" style="font-size:18px;color:var(--color-fg);font-weight:300;">${r.author}</p>
              <p style="font-size:12px;color:var(--color-fg-muted);margin-top:2px;">${r.city || "м. Харків"}</p>
            </div>
            <span class="font-mono review-source-badge" style="font-size:10px;letter-spacing:0.8px;color:var(--color-accent-light);border:1px solid rgba(215,177,136,0.3);padding:5px 9px;display:inline-flex;align-items:center;gap:4px;white-space:nowrap;transition:all 0.25s ease;">
              ${r.source || "Google Відгуки"} ↗
            </span>
          </div>
        </a>`;
    })
    .join("");
}

/* ==========================================================================
   ПЛАВАЮЧА КНОПКА «ПРОРАХУВАТИ ПРОЄКТ» (ховається біля форми розрахунку)
   ========================================================================== */
function initFloatingEstimate() {
  const btn = document.getElementById("floating-estimate-btn");
  const target = document.getElementById("estimate");
  const hero = document.getElementById("hero");
  if (!btn) return;
  const state = { hero: true, target: false };
  const update = () => btn.classList.toggle("is-hidden", state.hero || state.target);
  if ("IntersectionObserver" in window) {
    if (hero) new IntersectionObserver(([e]) => { state.hero = e.intersectionRatio > 0.55; update(); }, { threshold: [0, 0.55, 1] }).observe(hero);
    if (target) new IntersectionObserver(([e]) => { state.target = e.isIntersecting; update(); }).observe(target);
  }
  update();
}


/* ==========================================================================
   9. SCROLL TO TOP BUTTON
   ========================================================================== */
function initScrollToTop() {
  const btn = document.getElementById("scroll-to-top-btn");
  if (!btn) return;

  window.addEventListener(
    "scroll",
    () => {
      const show = window.scrollY > 600;
      btn.style.opacity = show ? "1" : "0";
      btn.style.pointerEvents = show ? "auto" : "none";
      btn.style.transform = show ? "translateY(0)" : "translateY(8px)";
    },
    { passive: true }
  );

  btn.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
}
