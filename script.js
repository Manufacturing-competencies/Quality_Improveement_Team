// =======================================================
// 🔧 QIT Dashboard – Script Rapi & Terstruktur
// =======================================================
(() => {
  // Util sederhana
  const qs  = (sel, scope = document) => scope.querySelector(sel);
  const qsa = (sel, scope = document) => Array.from(scope.querySelectorAll(sel));
  const isDesktop = () => window.innerWidth > 1024;

  // Debounce untuk event resize agar hemat performa
  const debounce = (fn, wait = 150) => {
    let t;
    return (...args) => {
      clearTimeout(t);
      t = setTimeout(() => fn.apply(null, args), wait);
    };
  };

  // =====================================================
  // 📌 TOGGLE MENU (RESPONSIVE NAVBAR)
  // =====================================================
  const initNavbar = () => {
    const menuToggle = qs(".menu-toggle");
    const navMenu    = qs(".nav-links");
    const navItems   = qsa(".nav-links a");

    if (!menuToggle || !navMenu) return;

    // Set ARIA untuk aksesibilitas
    menuToggle.setAttribute("aria-controls", "mainNav");
    menuToggle.setAttribute("aria-expanded", "false");

    // Klik hamburger → buka/tutup menu
    menuToggle.addEventListener("click", () => {
      const isActive = navMenu.classList.toggle("active");
      menuToggle.setAttribute("aria-expanded", String(isActive));
    });

    // Klik di luar menu → tutup (hanya di mobile)
    document.addEventListener("click", (e) => {
      if (!navMenu.classList.contains("active")) return;
      const clickedInsideMenu  = navMenu.contains(e.target);
      const clickedToggle      = menuToggle.contains(e.target);
      if (!clickedInsideMenu && !clickedToggle && !isDesktop()) {
        navMenu.classList.remove("active");
        menuToggle.setAttribute("aria-expanded", "false");
      }
    }, { passive: true });

    // ESC → tutup menu (mobile)
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && navMenu.classList.contains("active") && !isDesktop()) {
        navMenu.classList.remove("active");
        menuToggle.setAttribute("aria-expanded", "false");
      }
    });

    // Klik link → tutup menu di HP/Tablet & highlight aktif (event delegation)
    navMenu.addEventListener("click", (e) => {
      const a = e.target.closest("a");
      if (!a) return;

      navItems.forEach((l) => l.classList.remove("active"));
      a.classList.add("active");

      if (!isDesktop()) {
        navMenu.classList.remove("active");
        menuToggle.setAttribute("aria-expanded", "false");
      }
    });

    // Resize → pastikan menu kembali normal di desktop
    window.addEventListener(
      "resize",
      debounce(() => {
        if (isDesktop()) {
          navMenu.classList.remove("active");
          menuToggle.setAttribute("aria-expanded", "false");
        }
      }, 120)
    );
  };

  // =====================================================
  // 📌 FUNGSI BERPINDAH VIEW (opsional sesuai HTML)
  //    Tetap pakai inline display biar kompatibel
  // =====================================================
  const initViews = () => {
    const views = qsa(".view-content");
    if (views.length === 0) return; // kalau tidak pakai .view-content, skip

    const showView = (viewId) => {
      views.forEach((v) => (v.style.display = "none"));
      const view = document.getElementById(viewId);
      if (view) view.style.display = "block";
    };

    // Ekspor global bila dipakai di HTML (onclick)
    window.showView = showView;
    window.backToDashboard = () => showView("dashboard-main");

    // On Load → default tampil dashboard
    showView("dashboard-main");
  };

  // =====================================================
  // 📌 GALLERY SLIDER MANUAL (opsional; hanya aktif bila ada .gallery-track)
  // =====================================================
  const initManualGallery = () => {
    const track   = qs(".gallery-track");
    const prevBtn = qs(".gallery-slider .prev");
    const nextBtn = qs(".gallery-slider .next");
    const slides  = qsa(".gallery-track img");

    if (!track || slides.length === 0) return;

    let index = 0;
    let timerId = null;

    const updateSlider = () => {
      track.style.transform = `translateX(-${index * 100}%)`;
    };

    const next = () => { index = (index + 1) % slides.length; updateSlider(); };
    const prev = () => { index = (index - 1 + slides.length) % slides.length; updateSlider(); };

    nextBtn?.addEventListener("click", next);
    prevBtn?.addEventListener("click", prev);

    // Auto slide (hormati prefers-reduced-motion)
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const startAuto = () => {
      if (prefersReducedMotion || timerId) return;
      timerId = setInterval(next, 4000);
    };
    const stopAuto = () => {
      if (!timerId) return;
      clearInterval(timerId);
      timerId = null;
    };

    // Pause saat hover (dekstop) supaya user bisa baca
    const slider = qs(".gallery-slider");
    slider?.addEventListener("mouseenter", stopAuto);
    slider?.addEventListener("mouseleave", startAuto);

    // Geser pakai swipe (HP/Tablet)
    let startX = 0;
    track.addEventListener("touchstart", (e) => { startX = e.touches[0].clientX; }, { passive: true });
    track.addEventListener("touchend", (e) => {
      const endX = e.changedTouches[0].clientX;
      if (startX - endX > 50) next();
      else if (endX - startX > 50) prev();
    });

    updateSlider();
    startAuto();
  };

  // =====================================================
  // 📌 FULLSCREEN GAMBAR QUALITY TOOLS
  // =====================================================
  const initFullscreenImages = () => {
    const overlay = qs("#fullscreenOverlay");
    if (!overlay) return;

    const overlayImg = qs("img", overlay);
    const imgs = qsa(".quality-tools img");
    if (imgs.length === 0 || !overlayImg) return;

    const open = (src) => {
      overlayImg.src = src;
      overlay.style.display = "flex";
      document.body.style.overflow = "hidden";
    };
    const close = () => {
      overlay.style.display = "none";
      overlayImg.removeAttribute("src");
      document.body.style.overflow = "";
    };

    imgs.forEach((img) => {
      img.style.cursor = "zoom-in";
      img.addEventListener("click", () => open(img.src));
    });

    overlay.addEventListener("click", (e) => {
      // Klik area gelap → tutup; klik gambar → juga tutup (sesuai kode awal)
      if (e.target === overlay || e.target === overlayImg) close();
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && overlay.style.display === "flex") close();
    });
  };

  // =====================================================
  // 🚀 INIT SEMUA SAAT DOM SIAP
  //   (satu kali saja, tidak dobel listener)
// =====================================================
  document.addEventListener("DOMContentLoaded", () => {
    initNavbar();
    initViews();
    initManualGallery();
    initFullscreenImages();
  });

  // =====================================================
  // 📎 Placeholder integrasi Google Sheets (Apps Script)
  //   Contoh pemanggilan:
  //   sendDataToGoogleSheets({ nama: 'Deni', nilai: 95 });
  // =====================================================
  /*
  function sendDataToGoogleSheets(data) {
    return fetch("URL_WEB_APP_SCRIPT", {
      method: "POST",
      body: JSON.stringify(data),
      headers: { "Content-Type": "application/json" }
    })
      .then(res => res.json())
      .then(result => {
        console.log("Data berhasil dikirim:", result);
        return result;
      })
      .catch(err => {
        console.error("Error:", err);
        throw err;
      });
  }
  */
})();
