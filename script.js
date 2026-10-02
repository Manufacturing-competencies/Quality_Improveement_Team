// QIT Batch 9 FINAL8 — polished production build
(() => {
  "use strict";

  const APP_URL = "https://script.google.com/macros/s/AKfycbz1iKWHZPoQI9vif1Ab-zcX4locQfnaMw8xh-edsP7WnckNqeVpJNgn79cx98PqS1w/exec";
  const LEADERBOARD_CACHE_KEY = "qit9_leaderboard_cache_v3";
  const LEADERBOARD_REFRESH_MS = 3 * 60 * 1000;
  const POPUP_AUTO_MS = 6500;
  const GALLERY_AUTO_MS = 5000;
  const GALLERY_RESUME_MS = 10000;
  const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const qs = (s, r = document) => r.querySelector(s);
  const qsa = (s, r = document) => [...r.querySelectorAll(s)];

  /* ---------- helpers ---------- */
  const jsonp = (url, params = {}, timeout = 9000) => new Promise((resolve, reject) => {
    const cb = `__qit_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    const tag = document.createElement("script");
    let timer;
    const cleanup = () => {
      clearTimeout(timer);
      try { delete window[cb]; } catch (_) { window[cb] = undefined; }
      tag.remove();
    };
    window[cb] = data => { cleanup(); resolve(data); };
    timer = setTimeout(() => { cleanup(); reject(new Error("timeout")); }, timeout);
    const query = new URLSearchParams({ ...params, callback: cb, _: String(Date.now()) });
    tag.src = `${url}${url.includes("?") ? "&" : "?"}${query}`;
    tag.onerror = () => { cleanup(); reject(new Error("network")); };
    document.head.appendChild(tag);
  });

  const jsonpRetry = async (url, params = {}, { attempts = 2, timeout = 15000, delay = 900 } = {}) => {
    let lastError;
    for (let i = 0; i < attempts; i++) {
      try { return await jsonp(url, params, timeout); }
      catch (err) { lastError = err; if (i < attempts - 1) await new Promise(r => setTimeout(r, delay)); }
    }
    throw lastError || new Error("network");
  };

  const openUrl = url => { if (url) window.open(url, "_blank", "noopener,noreferrer"); };
  const escapeHtml = value => String(value ?? "").replace(/[&<>"]/g, ch => ({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;"}[ch]));

  /* ---------- navigation ---------- */
  function initNavigation() {
    const toggle = qs("#menuToggle");
    const nav = qs("#mainNav");
    toggle?.addEventListener("click", () => {
      const on = nav?.classList.toggle("active");
      toggle.setAttribute("aria-expanded", String(!!on));
      const icon = qs("i", toggle);
      if (icon) icon.className = on ? "fa-solid fa-xmark" : "fa-solid fa-bars";
    });
    nav?.addEventListener("click", e => {
      if (e.target.closest("a")) {
        nav.classList.remove("active");
        toggle?.setAttribute("aria-expanded", "false");
      }
    });
    qsa("[data-scroll-to]").forEach(el => el.addEventListener("click", () => {
      const id = el.dataset.scrollTo;
      if (id === "top") window.scrollTo({top:0, behavior: reduceMotion ? "auto" : "smooth"});
      else document.getElementById(id)?.scrollIntoView({behavior: reduceMotion ? "auto" : "smooth", block:"start"});
    }));
    qsa(".quick-card[data-url], .mission-card[data-url], .current-open[data-url]").forEach(el => {
      el.addEventListener("click", () => openUrl(el.dataset.url));
    });

    const links = qsa("#mainNav a[href^='#']");
    const targets = links.map(a => ({a, el: qs(a.getAttribute("href"))})).filter(x => x.el);
    if ("IntersectionObserver" in window) {
      const obs = new IntersectionObserver(entries => {
        const visible = entries.filter(e => e.isIntersecting).sort((a,b)=>b.intersectionRatio-a.intersectionRatio)[0];
        if (!visible) return;
        links.forEach(a => a.classList.toggle("active", a.getAttribute("href") === `#${visible.target.id}`));
      }, {rootMargin:"-25% 0px -60% 0px", threshold:[.08,.2,.4]});
      targets.forEach(x => obs.observe(x.el));
    }
  }

  /* ---------- scroll progress / reveal ---------- */
  function initScrollExperience() {
    const bar = qs("#scrollProgressBar");
    const back = qs(".back-to-top");
    const update = () => {
      const max = document.documentElement.scrollHeight - innerHeight;
      if (bar) bar.style.width = `${max > 0 ? Math.min(100, scrollY / max * 100) : 0}%`;
      back?.classList.toggle("show", scrollY > 650);
    };
    addEventListener("scroll", update, {passive:true});
    addEventListener("resize", update, {passive:true});
    back?.addEventListener("click", () => scrollTo({top:0, behavior:reduceMotion ? "auto" : "smooth"}));
    update();

    const items = qsa(".reveal-on-scroll");
    if (!reduceMotion && "IntersectionObserver" in window) {
      items.forEach(el => el.classList.add("is-ready"));
      const observer = new IntersectionObserver((entries, obs) => entries.forEach(entry => {
        if (entry.isIntersecting) { entry.target.classList.add("visible"); obs.unobserve(entry.target); }
      }), {threshold:.06, rootMargin:"0px 0px -6% 0px"});
      items.forEach(el => observer.observe(el));
    } else items.forEach(el => el.classList.add("visible"));
  }

  /* ---------- current week ---------- */
  function getISOWeekInfo(date = new Date()) {
    const local = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const day = local.getDay() || 7;
    const monday = new Date(local); monday.setDate(local.getDate() - day + 1);
    const thursday = new Date(monday); thursday.setDate(monday.getDate() + 3);
    const yearStart = new Date(thursday.getFullYear(), 0, 1);
    const week = Math.ceil((((thursday - yearStart) / 86400000) + 1) / 7);
    const sunday = new Date(monday); sunday.setDate(monday.getDate() + 6);
    return {week, monday, sunday};
  }
  function formatWeekRange({monday, sunday}) {
    const m = ["JAN","FEB","MAR","APR","MEI","JUN","JUL","AGU","SEP","OCT","NOV","DES"];
    if (monday.getFullYear() === sunday.getFullYear()) {
      return `${monday.getDate()} ${m[monday.getMonth()]} – ${sunday.getDate()} ${m[sunday.getMonth()]} ${sunday.getFullYear()}`;
    }
    return `${monday.getDate()} ${m[monday.getMonth()]} ${monday.getFullYear()} – ${sunday.getDate()} ${m[sunday.getMonth()]} ${sunday.getFullYear()}`;
  }
  function initCurrentWeek() {
    const info = getISOWeekInfo();
    const long = `WEEK ${info.week}`, short = `W${info.week}`;
    if (qs("#currentWeekBadge")) qs("#currentWeekBadge").textContent = long;
    if (qs("#currentWeekTitle")) qs("#currentWeekTitle").textContent = long;
    if (qs("#orbitWeek")) qs("#orbitWeek").textContent = short;
    if (qs("#currentWeekRange")) qs("#currentWeekRange").textContent = formatWeekRange(info);
  }

  /* ---------- leaderboard ---------- */
  let chart = null;
  function normalizeLeaderboard(data) {
    return Array.isArray(data?.top15) ? data.top15.slice(0,15).map(x => ({
      team: x.namaTim || "Tanpa Nama", points: Number(x.totalPoin) || 0, lokasi:x.lokasi || "-", stream:x.stream || "-"
    })) : [];
  }
  function buildPodium(rows) {
    const wrap = qs("#leaderboardPodium"); if (!wrap) return;
    const order = [{i:1,r:2,c:"rank-2",icon:"fa-medal"},{i:0,r:1,c:"rank-1",icon:"fa-crown"},{i:2,r:3,c:"rank-3",icon:"fa-medal"}];
    wrap.innerHTML = order.map(x => {
      const d = rows[x.i];
      return `<article class="podium-card ${x.c}"><span class="podium-rank">${x.r}</span><div class="podium-medal"><i class="fa-solid ${x.icon}"></i></div><b>${escapeHtml(d?.team || "—")}</b><small class="podium-meta">${escapeHtml(d ? `${d.stream} • ${d.lokasi}` : "")}</small><strong>${d ? d.points.toLocaleString("id-ID") : "—"}<small> PTS</small></strong></article>`;
    }).join("");
  }
  function renderMobileLeaderboard(rows) {
    const wrap = qs("#leaderboardMobileList");
    if (!wrap) return;
    wrap.innerHTML = rows.map((d, i) => `
      <article class="mobile-rank-row">
        <span class="mobile-rank-no">${i + 1}</span>
        <div class="mobile-rank-copy"><b>${escapeHtml(d.team)}</b><small>${escapeHtml(d.stream)} • ${escapeHtml(d.lokasi)}</small></div>
        <strong>${d.points.toLocaleString("id-ID")} <small>PTS</small></strong>
      </article>`).join("");
  }

  function renderChart(rows) {
    const canvas = qs("#leaderboardChart");
    if (!canvas || typeof Chart !== "function") return;
    chart?.destroy();
    chart = new Chart(canvas, {
      type:"bar",
      data:{labels:rows.map(x=>x.team),datasets:[{data:rows.map(x=>x.points),borderRadius:10,borderSkipped:false,backgroundColor:ctx=>{
        const area=ctx.chart.chartArea; if(!area) return "#2e83ee";
        const g=ctx.chart.ctx.createLinearGradient(area.left,0,area.right,0);
        if(ctx.dataIndex===0){g.addColorStop(0,"#f4c13f");g.addColorStop(1,"#ffe994");}
        else if(ctx.dataIndex===1){g.addColorStop(0,"#6db0ee");g.addColorStop(1,"#cceaff");}
        else if(ctx.dataIndex===2){g.addColorStop(0,"#bb7d4e");g.addColorStop(1,"#e6b58e");}
        else{g.addColorStop(0,"#1e73e8");g.addColorStop(.55,"#49bde9");g.addColorStop(1,"#7b6df2");}
        return g;
      }}]},
      options:{indexAxis:"y",responsive:true,maintainAspectRatio:false,animation:{duration:reduceMotion?0:700},plugins:{legend:{display:false},tooltip:{displayColors:false,callbacks:{label:i=>`${Number(i.raw).toLocaleString("id-ID")} poin`}}},scales:{x:{beginAtZero:true,grid:{color:"rgba(46,115,180,.10)"},border:{display:false},ticks:{color:"#7990a6",precision:0}},y:{grid:{display:false},border:{display:false},ticks:{color:"#315d87",autoSkip:false,font:{family:"Poppins",size:10,weight:"700"},callback:function(v){const t=this.getLabelForValue(v);return t.length>30?t.slice(0,28)+"…":t;}}}}}
    });
  }
  function renderLeaderboard(data, fromCache=false) {
    const rows = normalizeLeaderboard(data); if (!rows.length) return false;
    buildPodium(rows); renderMobileLeaderboard(rows); renderChart(rows);
    const status = qs("#leaderboardStatus"); if(status) status.hidden = true;
    const up = qs("#leaderboardUpdated");
    if(up) up.innerHTML = `<i class="fa-regular fa-clock"></i> ${fromCache ? "Data terakhir • " : "Update: "}${escapeHtml(data.updatedAt || new Date().toLocaleString("id-ID"))}`;
    return true;
  }
  function readLeaderboardCache(){try{return JSON.parse(localStorage.getItem(LEADERBOARD_CACHE_KEY)||"null")}catch(_){return null}}
  function saveLeaderboardCache(data){try{localStorage.setItem(LEADERBOARD_CACHE_KEY,JSON.stringify(data))}catch(_){}}
  async function loadLeaderboard({silent=false, fresh=false}={}) {
    const refresh=qs("#leaderboardRefresh"), status=qs("#leaderboardStatus");
    refresh?.classList.add("is-loading");
    if(!silent && status){status.hidden=false;status.innerHTML='<i class="fa-solid fa-circle-notch fa-spin"></i> Memperbarui data...';}
    try{
      const data=await jsonpRetry(APP_URL,{api:"leaderboard", ...(fresh?{fresh:"1"}:{})},{attempts:3,timeout:18000,delay:1100});
      if(!data?.success) throw new Error(data?.error||"API error");
      if(renderLeaderboard(data,false)) saveLeaderboardCache(data);
    }catch(err){
      console.warn("Leaderboard:",err);
      const cached=readLeaderboardCache();
      if(cached){
        renderLeaderboard(cached,true);
        if(status) status.hidden=true;
      } else if(status){
        status.hidden=false;
        status.innerHTML='<i class="fa-solid fa-wifi"></i> Koneksi data sedang lambat. Tekan Refresh untuk mencoba lagi.';
      }
    }finally{refresh?.classList.remove("is-loading")}
  }
  function initLeaderboard(){
    const cached=readLeaderboardCache();
    if(cached) renderLeaderboard(cached,true);
    qs("#leaderboardRefresh")?.addEventListener("click",()=>loadLeaderboard({fresh:true}));
    qs(".leaderboard-open")?.addEventListener("click",()=>openUrl(APP_URL));
    loadLeaderboard({silent:!!cached});
    setInterval(()=>loadLeaderboard({silent:true}),LEADERBOARD_REFRESH_MS);

    // FINAL7: bantu mobile ketika tab kembali aktif / koneksi baru pulih.
    addEventListener("online",()=>loadLeaderboard({silent:false}),{passive:true});
    addEventListener("pageshow",()=>loadLeaderboard({silent:true}),{passive:true});
    document.addEventListener("visibilitychange",()=>{
      if(!document.hidden) loadLeaderboard({silent:true});
    });
  }

  /* ---------- GitHub poster popup / A4 ---------- */
  function initPopup() {
    const popup = qs("#githubPopup");
    if (!popup) return;

    const image = qs("#githubPopupImage");
    const caption = qs("#githubPopupCaption");
    const prevBtn = qs("#githubPopupPrev");
    const nextBtn = qs("#githubPopupNext");
    const closeBtn = qs("#githubPopupClose");
    const dotsWrap = qs("#githubPopupDots");
    const previewLeft = qs("#githubPopupPreviewLeft");
    const previewRight = qs("#githubPopupPreviewRight");
    const stage = qs("#githubPopupStage");
    let posters = [];
    let index = 0;
    let timer = null;
    let touchX = 0;

    const close = () => {
      popup.classList.remove("open");
      popup.setAttribute("aria-hidden","true");
      document.body.classList.remove("github-popup-open");
      clearInterval(timer);
      timer = null;
    };

    const open = () => {
      if (!posters.length) return;
      popup.classList.add("open");
      popup.setAttribute("aria-hidden","false");
      document.body.classList.add("github-popup-open");
    };

    const safeUrl = value => {
      if (!value) return "";
      return String(value).replace(/["'()\\]/g,"");
    };

    const render = () => {
      if (!posters.length) return;
      const current = posters[index];
      const prev = posters[(index - 1 + posters.length) % posters.length];
      const next = posters[(index + 1) % posters.length];

      image.src = current.src;
      image.alt = current.alt || current.title || "Poster informasi QIT Batch 9";
      caption.textContent = current.title || "";

      const multi = posters.length > 1;
      prevBtn.hidden = !multi;
      nextBtn.hidden = !multi;
      previewLeft.hidden = !multi;
      previewRight.hidden = !multi;

      if (multi) {
        previewLeft.style.backgroundImage = `url("${safeUrl(prev.src)}")`;
        previewRight.style.backgroundImage = `url("${safeUrl(next.src)}")`;
      }

      dotsWrap.innerHTML = posters.map((_,i) =>
        `<button class="github-popup-dot ${i===index ? "active" : ""}" type="button" data-popup-index="${i}" aria-label="Poster ${i+1}"></button>`
      ).join("");
    };

    const go = dir => {
      if (posters.length < 2) return;
      index = (index + dir + posters.length) % posters.length;
      render();
    };

    const startAuto = () => {
      // FINAL25: manual-only popup. No automatic slide.
      clearInterval(timer);
      timer = null;
    };

    closeBtn?.addEventListener("click", e => {
      e.preventDefault();
      e.stopPropagation();
      close();
    });
    closeBtn?.addEventListener("pointerup", e => {
      e.preventDefault();
      e.stopPropagation();
      close();
    });
    qsa("[data-popup-close]", popup).forEach(el => el.addEventListener("click", close));
    prevBtn?.addEventListener("click", () => go(-1));
    nextBtn?.addEventListener("click", () => go(1));

    dotsWrap?.addEventListener("click", e => {
      const dot = e.target.closest("[data-popup-index]");
      if (!dot) return;
      index = Number(dot.dataset.popupIndex) || 0;
      render();
    });

    // FINAL26 — manual swipe/drag yang stabil di HP, tablet, laptop, desktop.
    let popStartX = 0;
    let popStartY = 0;
    let popCurrentX = 0;
    let popCurrentY = 0;
    let popDragging = false;
    let popHorizontal = false;
    let popMouseDown = false;

    const resetPopupDrag = () => {
      if (!stage) return;
      stage.style.transition = "transform .18s ease";
      stage.style.transform = "translateX(0)";
      setTimeout(() => {
        if (stage) stage.style.transition = "";
      }, 190);
    };

    const commitPopupSwipe = dx => {
      resetPopupDrag();
      if (Math.abs(dx) < 45) return;
      go(dx < 0 ? 1 : -1);
    };

    // Touch swipe
    stage?.addEventListener("touchstart", e => {
      if (!e.touches?.length) return;
      const t = e.touches[0];
      popStartX = popCurrentX = t.clientX;
      popStartY = popCurrentY = t.clientY;
      popDragging = true;
      popHorizontal = false;
      stage.style.transition = "none";
    }, {passive:true});

    stage?.addEventListener("touchmove", e => {
      if (!popDragging || !e.touches?.length) return;
      const t = e.touches[0];
      popCurrentX = t.clientX;
      popCurrentY = t.clientY;
      const dx = popCurrentX - popStartX;
      const dy = popCurrentY - popStartY;

      if (!popHorizontal && Math.abs(dx) > 7) {
        popHorizontal = Math.abs(dx) > Math.abs(dy);
      }

      if (popHorizontal) {
        e.preventDefault();
        const visual = Math.max(-90, Math.min(90, dx * .32));
        stage.style.transform = `translateX(${visual}px)`;
      }
    }, {passive:false});

    stage?.addEventListener("touchend", () => {
      if (!popDragging) return;
      popDragging = false;
      commitPopupSwipe(popHorizontal ? (popCurrentX - popStartX) : 0);
    }, {passive:true});

    stage?.addEventListener("touchcancel", () => {
      popDragging = false;
      resetPopupDrag();
    }, {passive:true});

    // Mouse drag
    stage?.addEventListener("mousedown", e => {
      if (e.button !== 0) return;
      popMouseDown = true;
      popStartX = popCurrentX = e.clientX;
      stage.classList.add("is-swiping");
      stage.style.transition = "none";
      e.preventDefault();
    });

    window.addEventListener("mousemove", e => {
      if (!popMouseDown) return;
      popCurrentX = e.clientX;
      const dx = popCurrentX - popStartX;
      const visual = Math.max(-110, Math.min(110, dx * .32));
      if (stage) stage.style.transform = `translateX(${visual}px)`;
    });

    window.addEventListener("mouseup", () => {
      if (!popMouseDown) return;
      popMouseDown = false;
      stage?.classList.remove("is-swiping");
      commitPopupSwipe(popCurrentX - popStartX);
    });

    document.addEventListener("keydown", e => {
      if (!popup.classList.contains("open")) return;
      if (e.key === "Escape") close();
      if (e.key === "ArrowLeft") go(-1);
      if (e.key === "ArrowRight") go(1);
    });

    // FINAL20: local-safe poster source.
    // Works when index.html is opened directly from C:\ as well as on GitHub Pages.
    // Tambah poster baru di array ini dan upload file-nya ke folder /popup.
    posters = [
      { src: "popup/POP1.png", title: "QIT Batch 9 Update", alt: "Poster QIT Batch 9 Update" },
      { src: "popup/POP2.png", title: "QIT Batch 9 Update 02", alt: "Poster QIT Batch 9 Update 02" },
      { src: "popup/POP3.png", title: "QIT Batch 9 Update 03", alt: "Poster QIT Batch 9 Update 03" }
    ];

    const loadFirstAvailable = (i = 0) => {
      if (i >= posters.length) {
        console.warn("Popup: tidak ada poster yang berhasil dimuat.");
        return;
      }
      const probe = new Image();
      probe.onload = () => {
        index = i;
        render();
        window.setTimeout(open, 350);
      };
      probe.onerror = () => loadFirstAvailable(i + 1);
      probe.src = posters[i].src;
    };

    loadFirstAvailable();
  }

  /* ---------- galleries: manual arrows + touch swipe + mouse drag ---------- */
  function prepGallery(el) {
    const empty = el.closest(".media-showcase")?.querySelector(".media-empty");
    const wrapper = qs(".swiper-wrapper", el);
    const prev = qs(".media-prev", el);
    const next = qs(".media-next", el);
    if (!wrapper) return Promise.resolve();

    const initialSlides = qsa(".swiper-slide", el);

    const tasks = initialSlides.map(slide => new Promise(resolve => {
      const img = qs("img", slide);
      if (!img) {
        slide.remove();
        resolve();
        return;
      }

      const finish = ok => {
        if (!ok) slide.remove();
        resolve();
      };

      if (img.complete) {
        finish(!!img.naturalWidth);
        return;
      }

      img.addEventListener("load", () => finish(true), {once:true});
      img.addEventListener("error", () => finish(false), {once:true});
    }));

    return Promise.all(tasks).then(() => {
      const slides = qsa(".swiper-slide", el);

      if (!slides.length) {
        el.hidden = true;
        if (empty) empty.hidden = false;
        return;
      }

      el.hidden = false;
      if (empty) empty.hidden = true;

      wrapper.setAttribute("tabindex", "0");
      wrapper.setAttribute("role", "region");
      wrapper.setAttribute("aria-label", "Galeri foto, geser kanan atau kiri");

      const getGap = () => {
        const style = getComputedStyle(wrapper);
        return parseFloat(style.columnGap || style.gap || "0") || 16;
      };

      const getStep = () => {
        const first = qs(".swiper-slide", wrapper);
        if (!first) return wrapper.clientWidth * .85;
        return first.getBoundingClientRect().width + getGap();
      };

      const maxScroll = () => Math.max(0, wrapper.scrollWidth - wrapper.clientWidth);

      const nearestIndex = () => {
        const step = Math.max(1, getStep());
        return Math.round(wrapper.scrollLeft / step);
      };

      const goToIndex = i => {
        const last = slides.length - 1;
        let targetIndex = i;
        if (targetIndex < 0) targetIndex = last;
        if (targetIndex > last) targetIndex = 0;

        const left = Math.min(maxScroll(), Math.max(0, targetIndex * getStep()));
        wrapper.scrollTo({
          left,
          behavior: reduceMotion ? "auto" : "smooth"
        });
      };

      const go = dir => goToIndex(nearestIndex() + dir);

      // Arrow buttons — active on ALL platforms.
      prev?.addEventListener("click", e => {
        e.preventDefault();
        e.stopPropagation();
        go(-1);
      });

      next?.addEventListener("click", e => {
        e.preventDefault();
        e.stopPropagation();
        go(1);
      });

      // Keyboard navigation on desktop.
      wrapper.addEventListener("keydown", e => {
        if (e.key === "ArrowLeft") {
          e.preventDefault();
          go(-1);
        }
        if (e.key === "ArrowRight") {
          e.preventDefault();
          go(1);
        }
      });

      // Mobile/tablet: use native horizontal swipe.
      // No pointer-capture here because it can cancel browser touch scrolling.

      // Desktop/laptop: drag with mouse.
      let mouseDown = false;
      let startX = 0;
      let startLeft = 0;
      let moved = false;

      wrapper.addEventListener("mousedown", e => {
        if (e.button !== 0) return;
        mouseDown = true;
        moved = false;
        startX = e.clientX;
        startLeft = wrapper.scrollLeft;
        wrapper.classList.add("is-dragging");
        e.preventDefault();
      });

      window.addEventListener("mousemove", e => {
        if (!mouseDown) return;
        const dx = e.clientX - startX;
        if (Math.abs(dx) > 4) moved = true;
        wrapper.scrollLeft = startLeft - dx;
      });

      window.addEventListener("mouseup", () => {
        if (!mouseDown) return;
        mouseDown = false;
        wrapper.classList.remove("is-dragging");

        // Snap to nearest card after dragging.
        if (moved) {
          setTimeout(() => goToIndex(nearestIndex()), 10);
        }
      });

      wrapper.addEventListener("dragstart", e => e.preventDefault());

      // Prevent fullscreen click when the user just dragged.
      wrapper.addEventListener("click", e => {
        if (!moved) return;
        e.preventDefault();
        e.stopPropagation();
        moved = false;
      }, true);
    });
  }

  function initGalleries() {
    qsa(".gallery-swiper").forEach(prepGallery);
  }

  /* ---------- hero living motion ---------- */
  function initHeroLivingMotion(){
    const dust=qs("#heroDust");
    if(!dust || reduceMotion || dust.children.length)return;
    const frag=document.createDocumentFragment();
    for(let i=0;i<18;i++){
      const dot=document.createElement("i");
      dot.style.left=`${8+Math.random()*84}%`;
      dot.style.top=`${18+Math.random()*70}%`;
      dot.style.setProperty("--delay",`${-Math.random()*8}s`);
      dot.style.setProperty("--dur",`${6+Math.random()*8}s`);
      dot.style.setProperty("--size",`${2+Math.random()*4}px`);
      frag.appendChild(dot);
    }
    dust.appendChild(frag);
  }

  /* ---------- fullscreen media ---------- */
  function initFullscreen() {
    const overlay=qs("#fullscreenOverlay"), full=qs("figure img",overlay), cap=qs("figcaption",overlay); if(!overlay||!full)return;
    let images=[],index=-1;
    const refresh=()=>images=qsa(".quality-tools img,.media-card img").filter(img=>img.naturalWidth>0);
    const render=()=>{const img=images[index];if(!img)return;full.src=img.currentSrc||img.src;full.alt=img.alt||"Preview";if(cap)cap.textContent=img.alt||""};
    const open=img=>{refresh();index=images.indexOf(img);if(index<0)return;render();overlay.classList.add("open");overlay.setAttribute("aria-hidden","false");document.body.style.overflow="hidden"};
    const close=()=>{overlay.classList.remove("open");overlay.setAttribute("aria-hidden","true");document.body.style.overflow=""};
    document.addEventListener("click",e=>{const img=e.target.closest(".quality-tools img,.media-card img");if(img)open(img);if(e.target===overlay)close()});
    qs(".fs-close",overlay)?.addEventListener("click",close);qs(".fs-prev",overlay)?.addEventListener("click",()=>{if(images.length){index=(index-1+images.length)%images.length;render()}});qs(".fs-next",overlay)?.addEventListener("click",()=>{if(images.length){index=(index+1)%images.length;render()}});
    document.addEventListener("keydown",e=>{if(!overlay.classList.contains("open"))return;if(e.key==="Escape")close();if(e.key==="ArrowLeft")qs(".fs-prev",overlay)?.click();if(e.key==="ArrowRight")qs(".fs-next",overlay)?.click()});
  }



  /* ---------- Cinematic Team Reveal QIT Batch 9 ---------- */
  function initTeamSpotlight() {
    const teams = [

      { code: "Q261001", name: "OPTIQ" },
      { code: "Q261002", name: "PHOENIX" },
      { code: "Q261003", name: "SONIC" },
      { code: "Q261004", name: "PATRICK" },
      { code: "Q261005", name: "NAI-LONG" },
      { code: "Q261006", name: "AKAR" },
      { code: "Q261007", name: "TRACE" },
      { code: "Q261008", name: "AKSARASA" },
      { code: "Q261009", name: "KOPDES" },
      { code: "Q261010", name: "TSUBASA" },
      { code: "Q261011", name: "HIGH VIBE" },
      { code: "Q261012", name: "T-REX" },
      { code: "Q261013", name: "BUMI" },
      { code: "Q261014", name: "SEPATU" },
      { code: "Q261015", name: "BARBERSHOP" },
      { code: "Q261016", name: "ZERO TO ONE" },
      { code: "Q261017", name: "POWDERFLASH" },
      { code: "Q261018", name: "FARMASI" },
      { code: "Q261019", name: "WIP" },
      { code: "Q261020", name: "TAM TUM" },
      { code: "Q261021", name: "FIVEvolution" },
      { code: "Q261022", name: "DIGI DAL IGNA" },
      { code: "Q261023", name: "MILSTIC" },
      { code: "Q261024", name: "TRANSMAT" },
      { code: "Q261025", name: "FluxFlow" },
      { code: "Q261026", name: "MAHONI" },
      { code: "Q261027", name: "KONOHA" },
      { code: "Q261028", name: "POWDERISE" },
      { code: "Q261029", name: "ICHI-GO" },
      { code: "Q261030", name: "SLOW" },
      { code: "Q261031", name: "ANTARA" },
      { code: "Q261032", name: "ATRIDE" },
      { code: "Q261033", name: "AMPIFLY" },
      { code: "Q261034", name: "QUESTRA" },
      { code: "Q261035", name: "CEO" },
      { code: "Q261036", name: "PIONIR" },
      { code: "Q261037", name: "CONNECT" },
      { code: "Q261038", name: "CLEANSER AGENT" },
      { code: "Q261039", name: "VISSION" },
      { code: "Q261040", name: "DERMASTARS" },
      { code: "Q261041", name: "KOMPAS" },
      { code: "Q261042", name: "ZYVON" },
      { code: "Q261043", name: "QUINTA SQUAD" },
      { code: "Q261044", name: "BLOCKBUSTER" },
      { code: "Q261045", name: "DADU" },
      { code: "Q261046", name: "PILOT" },
      { code: "Q261047", name: "CHEMISTRY" },
      { code: "Q261048", name: "PROLOG" },
      { code: "Q261049", name: "STANFORD" },
      { code: "Q261050", name: "SAGARAS" },
      { code: "Q261051", name: "P3K" },
      { code: "Q261052", name: "AHLI SULAP" },
      { code: "Q261053", name: "LITTLE SCHOLARS" },
      { code: "Q261054", name: "FIXORA" },
      { code: "Q261055", name: "GAIA" },
      { code: "Q261056", name: "GEAR UP" },
      { code: "Q261057", name: "VENOM" },
      { code: "Q261058", name: "XPLORE" },
      { code: "Q261059", name: "MBG" },
      { code: "Q261060", name: "META" },
      { code: "Q261061", name: "VEGAPUNK" },
      { code: "Q261062", name: "GRYFFINDOR" },
      { code: "Q261063", name: "KECAMBAH" },
      { code: "Q261064", name: "GARUNUSA" },
      { code: "Q261065", name: "KISEKI NO SEDAI" },
      { code: "Q261066", name: "G.T.A" },
      { code: "Q261067", name: "SIGNAL" },
      { code: "Q261068", name: "PROBLEM EXORCIST" },
      { code: "Q261069", name: "TEKKADAN" },
      { code: "Q261070", name: "IMPROVENTURE" },
      { code: "Q261071", name: "ELBAPH" },
      { code: "Q261072", name: "NovoBlast 5" },
      { code: "Q261073", name: "PARAKAGE" },
      { code: "Q261074", name: "KHALISATLESS" },
      { code: "Q261075", name: "GATE VALVE" },
      { code: "Q261076", name: "FBI" },
      { code: "Q261077", name: "KeyTA" },
      { code: "Q261078", name: "WAREHOUSE WARRIOR" },
      { code: "Q261079", name: "BACKLOG SWEEPERS" },
      { code: "Q261080", name: "NGEGAS" },
      { code: "Q261081", name: "SHINOBI" },
      { code: "Q261082", name: "LOGTIME" },
      { code: "Q261083", name: "FORCE LOGIC" },
      { code: "Q261084", name: "INBOND" },
      { code: "Q261085", name: "THE RISE" },
      { code: "Q261086", name: "CAPCUT" },
      { code: "Q261087", name: "ROCKET" },
      { code: "Q261088", name: "FAST-IN TEAM" },
      { code: "Q261089", name: "KOPI" },
      { code: "Q261090", name: "PUZZLE" },
      { code: "Q261091", name: "BIBIT UNGGUL" },
      { code: "Q261092", name: "ZERO GUARD" },
      { code: "Q261093", name: "FALSE9" },
      { code: "Q261094", name: "STELLAR" },
      { code: "Q261095", name: "GO CART" },
      { code: "Q261096", name: "L.E.X TEAM" },
      { code: "Q261097", name: "ENDORPHIN" },
      { code: "Q261098", name: "QUALORA" },
      { code: "Q261099", name: "PARASMA" },
      { code: "Q261100", name: "RAWRR" },
      { code: "Q261101", name: "DIPACT" },
      { code: "Q261102", name: "IMPROVOLUTION" },
      { code: "Q261103", name: "PRIMA" },
      { code: "Q261104", name: "SYLVONIX" },
      { code: "Q261105", name: "UNLOCX" },
      { code: "Q261106", name: "CATALYST" },
      { code: "Q261107", name: "INNOTION" },
      { code: "Q261108", name: "ZENITH" },
      { code: "Q261109", name: "FORTUNA FORGE" },
      { code: "Q261110", name: "MLAMPAH" },
      { code: "Q261111", name: "GAROENG" },
      { code: "Q261112", name: "LEGENDS" },
      { code: "Q261113", name: "PROCUREVATE" },
      { code: "Q261114", name: "BETTER+" },
      { code: "Q261115", name: "LEGO" },
      { code: "Q261116", name: "NOCTURNAL" },
      { code: "Q261117", name: "MAX" }
    ];

    const section = qs("#team-spotlight");
    const card = qs("#teamCinematicCard");
    const codeEl = qs("#teamCinematicCode");
    const nameEl = qs("#teamCinematicName");
    const noEl = qs("#teamCinematicNo");
    const counterEl = qs("#teamCinematicCounter");
    const progressEl = qs("#teamCinematicProgress");
    const sweep = qs("#teamCinematicSweep");
    const message = qs("#teamCinematicMessage");
    if (!section || !card || !codeEl || !nameEl) return;

    const HOLD_MS = 1550;
    const TRANSITION_MS = 560;
    const MESSAGE_EVERY = 20;
    let index = 0;
    let timer = null;
    let running = false;

    const pad = n => String(n).padStart(3, "0");

    const updateTeam = () => {
      const team = teams[index];
      codeEl.textContent = team.code;
      nameEl.textContent = team.name;
      if (noEl) noEl.textContent = pad(index + 1);
      if (counterEl) counterEl.textContent = `${pad(index + 1)} / ${teams.length}`;
      if (progressEl) progressEl.style.width = `${((index + 1) / teams.length) * 100}%`;
    };

    const flashSweep = () => {
      if (!sweep || reduceMotion) return;
      sweep.classList.remove("play");
      void sweep.offsetWidth;
      sweep.classList.add("play");
    };

    const showIntermission = () => {
      if (!message || reduceMotion) return Promise.resolve();
      return new Promise(resolve => {
        message.classList.add("show");
        setTimeout(() => {
          message.classList.remove("show");
          setTimeout(resolve, 420);
        }, 1050);
      });
    };

    const revealNext = async () => {
      if (!running || document.hidden) return;

      card.classList.add("team-out");

      setTimeout(async () => {
        index = (index + 1) % teams.length;
        updateTeam();
        flashSweep();

        card.classList.remove("team-out");
        card.classList.add("team-in");
        requestAnimationFrame(() => requestAnimationFrame(() => card.classList.remove("team-in")));

        if (index > 0 && index % MESSAGE_EVERY === 0) {
          await showIntermission();
        }

        if (running) timer = setTimeout(revealNext, HOLD_MS + TRANSITION_MS);
      }, TRANSITION_MS);
    };

    const start = () => {
      if (running) return;
      running = true;
      clearTimeout(timer);
      timer = setTimeout(revealNext, HOLD_MS);
    };

    const stop = () => {
      running = false;
      clearTimeout(timer);
      timer = null;
    };

    updateTeam();
    flashSweep();

    if ("IntersectionObserver" in window) {
      const observer = new IntersectionObserver(entries => {
        const visible = entries.some(e => e.isIntersecting);
        if (visible) start();
        else stop();
      }, {threshold:.22});
      observer.observe(section);
    } else {
      start();
    }

    document.addEventListener("visibilitychange", () => {
      if (document.hidden) stop();
      else if (section.getBoundingClientRect().bottom > 0 && section.getBoundingClientRect().top < innerHeight) start();
    });
  }

  /* ---------- BGM / autoplay + browser unlock ---------- */
  function initMusic(){
    const audio = qs("#bgMusic");
    const buttons = [qs("#bgmToggle"), qs("#mobileBgmToggle"), qs("#welcomeSound")].filter(Boolean);
    if (!audio) return;

    audio.volume = .38;
    audio.loop = true;
    audio.preload = "auto";

    let userPaused = false;
    let unlocked = false;

    const sync = () => {
      const on = !audio.paused;
      buttons.forEach(btn => {
        btn.classList.toggle("playing", on);
        btn.setAttribute("aria-pressed", String(on));
        const small = qs("small", btn);
        if (small) small.textContent = on ? "ON" : "OFF";
        if (btn.id === "welcomeSound") {
          btn.innerHTML = `<i class="fa-solid ${on ? "fa-volume-high" : "fa-volume-xmark"}"></i> BGM ${on ? "ON" : "OFF"}`;
        }
      });
    };

    const tryPlay = async () => {
      if (userPaused || !audio.paused) {
        sync();
        return true;
      }
      try {
        await audio.play();
        unlocked = true;
        sync();
        return true;
      } catch (_) {
        sync();
        return false;
      }
    };

    // Browser pertama kali: coba autoplay normal.
    tryPlay();

    // Jika browser memblokir autoplay bersuara, interaksi pertama di mana pun
    // (tap/click/swipe/keyboard) langsung mengaktifkan musik tanpa harus klik BGM.
    const unlockMusic = async () => {
      if (unlocked || userPaused) return;
      const ok = await tryPlay();
      if (ok) {
        unlocked = true;
        removeEventListener("pointerdown", unlockMusic, true);
        removeEventListener("touchstart", unlockMusic, true);
        removeEventListener("keydown", unlockMusic, true);
      }
    };

    addEventListener("pointerdown", unlockMusic, true);
    addEventListener("touchstart", unlockMusic, {capture:true, passive:true});
    addEventListener("keydown", unlockMusic, true);

    buttons.forEach(btn => btn.addEventListener("click", async e => {
      e.stopPropagation();

      if (audio.paused) {
        userPaused = false;
        try {
          await audio.play();
          unlocked = true;
        } catch (_) {}
      } else {
        userPaused = true;
        audio.pause();
      }

      sync();
    }));

    audio.addEventListener("play", sync);
    audio.addEventListener("pause", sync);

    // Saat kembali ke tab: lanjutkan hanya bila user tidak pernah mematikan BGM.
    document.addEventListener("visibilitychange", () => {
      if (!document.hidden && !userPaused) tryPlay();
    });

    // pageshow membantu saat halaman kembali dari browser back/forward cache.
    addEventListener("pageshow", () => {
      if (!userPaused) tryPlay();
    }, {passive:true});

    sync();
  }

  /* ---------- about typewriter / stats ---------- */
  function initAbout(){
    const textEl=qs("#qitTypewriter");
    if(textEl){const text=textEl.dataset.text||"";if(reduceMotion)textEl.textContent=text;else{let started=false;const start=()=>{if(started)return;started=true;let i=0;textEl.textContent="";const t=setInterval(()=>{textEl.textContent=text.slice(0,++i);if(i>=text.length)clearInterval(t)},18)};if("IntersectionObserver" in window){const o=new IntersectionObserver(es=>{if(es.some(e=>e.isIntersecting)){start();o.disconnect()}},{threshold:.3});o.observe(textEl)}else start()}}
    const nums=qsa("#tentang .number[data-target]");
    const run=el=>{const target=Number(el.dataset.target||0);if(!target)return;const start=performance.now(),dur=550;const tick=now=>{const p=Math.min(1,(now-start)/dur);el.textContent=Math.round(target*(1-Math.pow(1-p,3))).toLocaleString("id-ID");if(p<1)requestAnimationFrame(tick)};requestAnimationFrame(tick)};
    if(nums.length&&"IntersectionObserver" in window&&!reduceMotion){const o=new IntersectionObserver(es=>{if(es.some(e=>e.isIntersecting)){nums.forEach(run);o.disconnect()}},{threshold:.3});const t=qs("#tentang");if(t)o.observe(t)}
  }

  /* ---------- particles ---------- */
  function initParticles(){const wrap=qs("#particles");if(!wrap||reduceMotion)return;const f=document.createDocumentFragment();for(let i=0;i<Math.min(24,Math.floor(innerWidth/55));i++){const s=document.createElement("span");s.className="particle";s.style.left=`${Math.random()*100}%`;s.style.animationDuration=`${8+Math.random()*10}s`;s.style.animationDelay=`${-Math.random()*12}s`;f.appendChild(s)}wrap.appendChild(f)}

  document.addEventListener("DOMContentLoaded", () => {
    initNavigation();
    initScrollExperience();
    initCurrentWeek();
    initLeaderboard();
    initPopup();
    initGalleries();
    initTeamSpotlight();
    initFullscreen();
    initMusic();
    initAbout();
    initParticles();
    initHeroLivingMotion();
  });
})();
