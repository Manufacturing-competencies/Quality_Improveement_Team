(() => {
  "use strict";

  const qs = (sel, scope = document) => scope.querySelector(sel);
  const qsa = (sel, scope = document) => Array.from(scope.querySelectorAll(sel));
  const isDesktop = () => window.innerWidth > 1100;
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const debounce = (fn, wait = 120) => {
    let timer;
    return (...args) => {
      clearTimeout(timer);
      timer = setTimeout(() => fn(...args), wait);
    };
  };

  const smoothScrollTo = (target) => {
    const el = typeof target === "string" ? document.getElementById(target) : target;
    if (!el) return;
    el.scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth", block: "start" });
  };

  const initNavbar = () => {
    const menuToggle = qs("#menuToggle");
    const navMenu = qs("#mainNav");
    if (!menuToggle || !navMenu) return;

    const closeMenu = () => {
      navMenu.classList.remove("active");
      menuToggle.setAttribute("aria-expanded", "false");
      const icon = qs("i", menuToggle);
      if (icon) icon.className = "fa-solid fa-bars";
    };

    menuToggle.addEventListener("click", (e) => {
      e.stopPropagation();
      const active = navMenu.classList.toggle("active");
      menuToggle.setAttribute("aria-expanded", String(active));
      const icon = qs("i", menuToggle);
      if (icon) icon.className = active ? "fa-solid fa-xmark" : "fa-solid fa-bars";
    });

    navMenu.addEventListener("click", (e) => {
      const link = e.target.closest("a[href^='#']");
      if (!link) return;
      if (!isDesktop()) closeMenu();
    });

    document.addEventListener("click", (e) => {
      if (!navMenu.classList.contains("active") || isDesktop()) return;
      if (!navMenu.contains(e.target) && !menuToggle.contains(e.target)) closeMenu();
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") closeMenu();
    });

    window.addEventListener("resize", debounce(() => {
      if (isDesktop()) closeMenu();
    }));
  };

  const initScrollSpy = () => {
    const links = qsa("#mainNav a[href^='#']");
    const pairs = links
      .map((link) => ({ link, section: qs(link.getAttribute("href")) }))
      .filter((x) => x.section);
    if (!pairs.length || !("IntersectionObserver" in window)) return;

    const setActive = (id) => {
      links.forEach((l) => l.classList.toggle("active", l.getAttribute("href") === `#${id}`));
    };

    const observer = new IntersectionObserver((entries) => {
      const visible = entries
        .filter((e) => e.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (visible) setActive(visible.target.id);
    }, { rootMargin: "-25% 0px -60% 0px", threshold: [0.08, 0.2, 0.4] });

    pairs.forEach(({ section }) => observer.observe(section));
  };

  const initMissionCards = () => {
    qsa(".mission-card[data-url]").forEach((card) => {
      card.addEventListener("click", () => {
        const url = card.dataset.url;
        if (url) window.open(url, "_blank", "noopener,noreferrer");
      });
    });

    qsa("[data-scroll-to]").forEach((el) => {
      el.addEventListener("click", () => {
        const target = el.dataset.scrollTo;
        if (target === "top") window.scrollTo({ top: 0, behavior: reducedMotion ? "auto" : "smooth" });
        else smoothScrollTo(target);
      });
    });
  };

  const initSwiper = () => {
    if (typeof window.Swiper !== "function") return;
    qsa(".mySwiper").forEach((el) => {
      const nextBtn = qs(".swiper-button-next", el);
      const prevBtn = qs(".swiper-button-prev", el);
      const pagination = qs(".swiper-pagination", el);

      new Swiper(el, {
        slidesPerView: 1,
        spaceBetween: 14,
        loop: qsa(".swiper-slide", el).length > 1,
        speed: reducedMotion ? 0 : 650,
        grabCursor: true,
        autoplay: reducedMotion ? false : { delay: 3600, disableOnInteraction: false, pauseOnMouseEnter: true },
        pagination: pagination ? { el: pagination, clickable: true } : false,
        navigation: nextBtn && prevBtn ? { nextEl: nextBtn, prevEl: prevBtn } : false,
        keyboard: { enabled: true },
        a11y: { enabled: true }
      });
    });
  };

  const initFullscreenGallery = () => {
    const overlay = qs("#fullscreenOverlay");
    const overlayImg = qs("figure img", overlay);
    const caption = qs("figcaption", overlay);
    if (!overlay || !overlayImg) return;

    const images = qsa(".quality-tools img, .mySwiper img");
    let index = -1;

    const render = () => {
      if (index < 0 || !images[index]) return;
      const img = images[index];
      overlayImg.src = img.currentSrc || img.src;
      overlayImg.alt = img.alt || "Pratinjau gambar";
      if (caption) caption.textContent = img.alt || "";
    };

    const open = (img) => {
      index = images.indexOf(img);
      render();
      overlay.classList.add("open");
      overlay.setAttribute("aria-hidden", "false");
      document.body.style.overflow = "hidden";
      qs(".fs-close", overlay)?.focus();
    };

    const close = () => {
      overlay.classList.remove("open");
      overlay.setAttribute("aria-hidden", "true");
      overlayImg.removeAttribute("src");
      document.body.style.overflow = "";
    };

    const move = (dir) => {
      if (!images.length) return;
      index = (index + dir + images.length) % images.length;
      render();
    };

    images.forEach((img) => img.addEventListener("click", () => open(img)));
    qs(".fs-close", overlay)?.addEventListener("click", close);
    qs(".fs-prev", overlay)?.addEventListener("click", () => move(-1));
    qs(".fs-next", overlay)?.addEventListener("click", () => move(1));
    overlay.addEventListener("click", (e) => { if (e.target === overlay) close(); });
    document.addEventListener("keydown", (e) => {
      if (!overlay.classList.contains("open")) return;
      if (e.key === "Escape") close();
      if (e.key === "ArrowLeft") move(-1);
      if (e.key === "ArrowRight") move(1);
    });
  };

  const initParticles = () => {
    const wrap = qs("#particles");
    if (!wrap || reducedMotion) return;
    const count = Math.min(36, Math.max(18, Math.floor(window.innerWidth / 48)));
    const fragment = document.createDocumentFragment();
    for (let i = 0; i < count; i++) {
      const p = document.createElement("span");
      p.className = "particle";
      p.style.left = `${Math.random() * 100}%`;
      p.style.animationDuration = `${7 + Math.random() * 10}s`;
      p.style.animationDelay = `${-Math.random() * 14}s`;
      p.style.opacity = `${0.2 + Math.random() * 0.65}`;
      fragment.appendChild(p);
    }
    wrap.appendChild(fragment);
  };

  const initReveal = () => {
    const items = qsa(".reveal-on-scroll");
    if (!items.length) return;
    if (reducedMotion || !("IntersectionObserver" in window)) {
      items.forEach((el) => el.classList.add("visible"));
      return;
    }
    const observer = new IntersectionObserver((entries, obs) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          obs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.08, rootMargin: "0px 0px -8% 0px" });
    items.forEach((el) => observer.observe(el));
  };

  const initBackToTop = () => {
    const btn = qs(".back-to-top");
    if (!btn) return;
    const update = () => btn.classList.toggle("show", window.scrollY > 700);
    window.addEventListener("scroll", update, { passive: true });
    btn.addEventListener("click", () => window.scrollTo({ top: 0, behavior: reducedMotion ? "auto" : "smooth" }));
    update();
  };

  document.addEventListener("DOMContentLoaded", () => {
    initNavbar();
    initScrollSpy();
    initMissionCards();
    initSwiper();
    initFullscreenGallery();
    initParticles();
    initReveal();
    initBackToTop();
  });
})();
