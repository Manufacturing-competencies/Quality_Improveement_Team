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

    const images = qsa(".quality-tools img, #galeri .film-frame img, .mySwiper img");
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

// ===== Batch 9 V2: mobile interaction enhancements =====
(() => {
  "use strict";
  const qs = (s, r=document) => r.querySelector(s);
  const qsa = (s, r=document) => Array.from(r.querySelectorAll(s));

  const classifyCard = (card) => {
    const code = (qs('.card-code', card)?.textContent || '').toLowerCase();
    if (code.includes('mission')) return 'mission';
    if (code.includes('challenge') || code.includes('scoreboard')) return 'challenge';
    if (code.includes('learning')) return 'learning';
    if (code.includes('reference') || code.includes('best practice') || code.includes('toolkit')) return 'reference';
    return 'mission';
  };

  const initMissionFinder = () => {
    const input = qs('#missionSearch');
    const clear = qs('#clearMissionSearch');
    const result = qs('#missionResult');
    const chips = qsa('.filter-chip');
    const cards = qsa('.mission-card');
    if (!input || !cards.length) return;
    cards.forEach(card => card.dataset.category = classifyCard(card));
    let activeFilter = 'all';

    const apply = () => {
      const query = input.value.trim().toLowerCase();
      let visible = 0;
      cards.forEach(card => {
        const matchesText = !query || card.textContent.toLowerCase().includes(query);
        const matchesFilter = activeFilter === 'all' || card.dataset.category === activeFilter;
        const show = matchesText && matchesFilter;
        card.classList.toggle('is-hidden', !show);
        if (show) visible++;
      });
      if (result) result.textContent = `${visible} menu tersedia`;
    };

    input.addEventListener('input', apply);
    clear?.addEventListener('click', () => { input.value=''; input.focus(); apply(); });
    chips.forEach(chip => chip.addEventListener('click', () => {
      chips.forEach(x => x.classList.remove('active'));
      chip.classList.add('active');
      activeFilter = chip.dataset.filter || 'all';
      apply();
    }));
    apply();
  };

  const initRipples = () => {
    qsa('.mission-card,.filter-chip,.mobile-dock button').forEach(el => {
      el.addEventListener('pointerdown', (e) => {
        const rect = el.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height) * .55;
        const ripple = document.createElement('span');
        ripple.className = 'ripple';
        ripple.style.width = ripple.style.height = `${size}px`;
        ripple.style.left = `${e.clientX - rect.left - size/2}px`;
        ripple.style.top = `${e.clientY - rect.top - size/2}px`;
        el.appendChild(ripple);
        ripple.addEventListener('animationend', () => ripple.remove(), {once:true});
      });
    });
  };

  const initScrollProgress = () => {
    const bar = qs('#scrollProgressBar');
    if (!bar) return;
    const update = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const pct = max > 0 ? Math.min(100, Math.max(0, window.scrollY / max * 100)) : 0;
      bar.style.width = `${pct}%`;
    };
    window.addEventListener('scroll', update, {passive:true});
    window.addEventListener('resize', update, {passive:true});
    update();
  };

  const initMobileDockState = () => {
    const buttons = qsa('.mobile-dock [data-scroll-to]');
    if (!buttons.length || !('IntersectionObserver' in window)) return;
    const map = new Map(buttons.map(btn => [btn.dataset.scrollTo, btn]));
    const targets = ['current-mission','batch9-journey','tentang'].map(id => document.getElementById(id)).filter(Boolean);
    const set = (id) => buttons.forEach(btn => btn.classList.toggle('active', btn.dataset.scrollTo === id));
    const obs = new IntersectionObserver(entries => {
      const visible = entries.filter(e=>e.isIntersecting).sort((a,b)=>b.intersectionRatio-a.intersectionRatio)[0];
      if (visible) set(visible.target.id);
      else if (window.scrollY < 400) set('top');
    }, {rootMargin:'-25% 0px -55% 0px', threshold:[.08,.2,.35]});
    targets.forEach(t => obs.observe(t));
    window.addEventListener('scroll', () => { if (window.scrollY < 300) set('top'); }, {passive:true});
  };

  const animateStats = () => {
    const stats = qsa('.stat .number');
    if (!stats.length || !('IntersectionObserver' in window) || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const obs = new IntersectionObserver((entries, observer) => entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      const target = Number((el.textContent || '').replace(/[^0-9]/g,''));
      if (!Number.isFinite(target) || target <= 0) { observer.unobserve(el); return; }
      const start = performance.now(), duration = 850;
      const tick = now => {
        const p = Math.min(1,(now-start)/duration);
        const eased = 1-Math.pow(1-p,3);
        el.textContent = Math.round(target*eased).toLocaleString('id-ID');
        if (p < 1) requestAnimationFrame(tick); else el.textContent = target.toLocaleString('id-ID');
      };
      requestAnimationFrame(tick); observer.unobserve(el);
    }), {threshold:.45});
    stats.forEach(s => obs.observe(s));
  };

  document.addEventListener('DOMContentLoaded', () => {
    initMissionFinder();
    initRipples();
    initScrollProgress();
    initMobileDockState();
    animateStats();
  });
})();

// ===== Batch 9 V3: hierarchy + mobile app behavior =====
(() => {
  "use strict";
  const qs=(s,r=document)=>r.querySelector(s);
  const qsa=(s,r=document)=>Array.from(r.querySelectorAll(s));

  const openUrl=(url)=>{ if(url) window.open(url,"_blank","noopener,noreferrer"); };

  const initV3Actions=()=>{
    qsa('.quick-card[data-url], .current-open[data-url]').forEach(el=>{
      el.addEventListener('click',()=>openUrl(el.dataset.url));
    });

    const finderBtn=qs('#toggleMissionFinder');
    const tools=qs('.mission-tools');
    if(finderBtn && tools){
      finderBtn.addEventListener('click',()=>{
        const isOpen=tools.classList.toggle('open');
        finderBtn.classList.toggle('open',isOpen);
        finderBtn.setAttribute('aria-expanded',String(isOpen));
        if(isOpen) setTimeout(()=>qs('#missionSearch')?.focus(),80);
      });
      finderBtn.setAttribute('aria-expanded','false');
    }

    const showBtn=qs('#showAllMissions');
    const mission=qs('#mission-control');
    if(showBtn && mission){
      showBtn.addEventListener('click',()=>{
        const open=mission.classList.toggle('show-all');
        showBtn.classList.toggle('open',open);
        const label=qs('span',showBtn); if(label) label.textContent=open?'Show Less':'Show All Missions';
      });
    }
  };

  const initV3Dock=()=>{
    const buttons=qsa('.mobile-dock [data-scroll-to]');
    const ids=['current-mission','qit-journey','tentang'];
    if(!buttons.length || !('IntersectionObserver' in window)) return;
    const set=(id)=>buttons.forEach(b=>b.classList.toggle('active',b.dataset.scrollTo===id));
    const targets=ids.map(id=>document.getElementById(id)).filter(Boolean);
    const obs=new IntersectionObserver(entries=>{
      const v=entries.filter(e=>e.isIntersecting).sort((a,b)=>b.intersectionRatio-a.intersectionRatio)[0];
      if(v) set(v.target.id); else if(window.scrollY<320) set('top');
    },{rootMargin:'-28% 0px -56% 0px',threshold:[.08,.2,.4]});
    targets.forEach(t=>obs.observe(t));
  };

  document.addEventListener('DOMContentLoaded',()=>{initV3Actions();initV3Dock();});
})();


// =========================================================
// QIT BATCH 9 — CINEMATIC CLEAR V4
// Music engine, game-like motion, typewriter, film controls
// =========================================================
(() => {
  "use strict";
  const qs=(s,r=document)=>r.querySelector(s), qsa=(s,r=document)=>Array.from(r.querySelectorAll(s));
  const reduce=window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Game-like hero shards
  const initHeroShards=()=>{
    const wrap=qs('#heroShards'); if(!wrap||reduce||wrap.children.length) return;
    const count=Math.min(28,Math.max(14,Math.floor(innerWidth/65)));
    const f=document.createDocumentFragment();
    for(let i=0;i<count;i++){
      const s=document.createElement('span');
      s.style.left=`${Math.random()*100}%`;s.style.top=`${25+Math.random()*75}%`;
      s.style.animationDuration=`${4+Math.random()*8}s`;s.style.animationDelay=`${-Math.random()*8}s`;
      s.style.transform=`rotate(${Math.random()*70-35}deg)`;f.appendChild(s);
    }
    wrap.appendChild(f);
  };

  // Typewriter. Runs once when About enters viewport.
  const initTypewriter=()=>{
    const el=qs('#qitTypewriter'); if(!el) return;
    const text=el.dataset.text||'';
    if(reduce){el.textContent=text;return;}
    let started=false,timer=null;
    const start=()=>{
      if(started)return;started=true;let i=0;el.textContent='';
      timer=setInterval(()=>{el.textContent=text.slice(0,++i);if(i>=text.length){clearInterval(timer);timer=null;}},24);
    };
    if('IntersectionObserver' in window){
      const obs=new IntersectionObserver(entries=>{entries.forEach(e=>{if(e.isIntersecting){start();obs.disconnect();}})},{threshold:.35});
      obs.observe(el);
    } else start();
  };

  // Manual BGM file. Put "musik-qit.mp3" beside index.html.
  // Browser rules prevent sound autoplay before user interaction, so the
  // first click/tap anywhere OR Enter/Space starts the music automatically.
  const initBgmLegacyDisabled=()=>{
    const audio=qs('#bgMusic');
    const desktop=qs('#bgmToggle');
    const mobile=qs('#mobileBgmToggle');
    if(!audio)return;

    audio.volume=.5;
    let started=false;
    let userMuted=false;

    const sync=(on)=>{
      [desktop,mobile].filter(Boolean).forEach(btn=>{
        btn.classList.toggle('playing',on);
        btn.setAttribute('aria-pressed',String(on));
        btn.setAttribute('aria-label',on?'Matikan musik latar':'Nyalakan musik latar');
        const small=qs('small',btn);
        if(small)small.textContent=on?'ON':'OFF';
        const icon=qs('i.fa-solid',btn);
        if(icon)icon.className=`fa-solid ${on?'fa-volume-high':'fa-music'}`;
      });
    };

    const removeFirstInteractionListeners=()=>{
      document.removeEventListener('pointerdown',firstPointer,true);
      document.removeEventListener('keydown',firstKey,true);
    };

    const start=async()=>{
      if(userMuted)return false;
      try{
        await audio.play();
        started=true;
        sync(true);
        removeFirstInteractionListeners();
        return true;
      }catch(err){
        // Usually means the MP3 is missing or the browser still needs a gesture.
        sync(false);
        return false;
      }
    };

    const firstPointer=()=>{ if(!started&&!userMuted) start(); };
    const firstKey=(e)=>{
      if((e.key==='Enter'||e.key===' '||e.code==='Space')&&!started&&!userMuted) start();
    };

    // Capture phase lets the first tap on a button/link also unlock audio.
    document.addEventListener('pointerdown',firstPointer,true);
    document.addEventListener('keydown',firstKey,true);

    const toggle=async(e)=>{
      e?.stopPropagation();
      if(audio.paused){
        userMuted=false;
        await start();
      }else{
        userMuted=true;
        audio.pause();
        sync(false);
        removeFirstInteractionListeners();
      }
    };

    desktop?.addEventListener('click',toggle);
    mobile?.addEventListener('click',toggle);
    audio.addEventListener('play',()=>sync(true));
    audio.addEventListener('pause',()=>sync(false));
    audio.addEventListener('error',()=>{
      sync(false);
      console.info('Tambahkan file musik-qit.mp3 di folder yang sama dengan index.html.');
    });
  };

  // Make cinematic film strips keyboard/touch friendly: tap toggles pause.
  const initFilm=()=>{
    qsa('.film-strip').forEach(strip=>{
      strip.tabIndex=0;strip.setAttribute('role','region');strip.setAttribute('aria-label','Hall of Fame film strip. Tap untuk pause atau lanjut.');
      const toggle=()=>{const tracks=qsa('.film-track',strip);const paused=strip.classList.toggle('paused');tracks.forEach(t=>t.style.animationPlayState=paused?'paused':'running')};
      strip.addEventListener('click',toggle);strip.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();toggle()}});
    });
  };

  const initJourneySnap=()=>{
    const steps=qs('.journey-steps');const active=qs('.tl-batch9',steps);if(!steps||!active||innerWidth>760)return;
    setTimeout(()=>active.scrollIntoView({behavior:reduce?'auto':'smooth',block:'nearest',inline:'center'}),450);
  };

  document.addEventListener('DOMContentLoaded',()=>{initHeroShards();initTypewriter();initFilm();initJourneySnap();});
})();


// ===== FINAL INTERACTION V6 =====
(() => {
  "use strict";
  const qs=(s,r=document)=>r.querySelector(s);
  const qsa=(s,r=document)=>Array.from(r.querySelectorAll(s));
  const reduce=window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // User-supplied MUSIC.MP3. Try autoplay on open, then fall back to first interaction if blocked by browser.
  const initManualMusic=()=>{
    const audio=qs('#bgMusic');
    const buttons=[qs('#bgmToggle'),qs('#mobileBgmToggle')].filter(Boolean);
    if(!audio) return;
    audio.volume=.48;
    audio.autoplay=true;
    audio.playsInline=true;
    let userMuted=false;
    let unlocked=false;

    const hasSource=()=>Boolean(audio.currentSrc || audio.getAttribute('src') || qs('source[src]',audio)?.getAttribute('src'));
    const sync=(on)=>buttons.forEach(btn=>{
      btn.classList.toggle('playing',on);
      btn.setAttribute('aria-pressed',String(on));
      const small=qs('small',btn); if(small) small.textContent=on?'ON':'OFF';
      const icon=qs('i.fa-solid',btn); if(icon) icon.className=`fa-solid ${on?'fa-volume-high':'fa-volume-xmark'}`;
    });
    const start=async()=>{
      if(userMuted || !hasSource()) return false;
      try{
        await audio.play();
        unlocked=true;
        sync(true);
        return true;
      }catch(err){
        sync(false);
        return false;
      }
    };
    const unlockOnFirstGesture=()=>{ if(audio.paused && !userMuted) start(); };
    const unlockOnKey=e=>{ if((e.key==='Enter'||e.key===' '||e.code==='Space') && audio.paused && !userMuted) start(); };

    document.addEventListener('pointerdown',unlockOnFirstGesture,true);
    document.addEventListener('keydown',unlockOnKey,true);

    buttons.forEach(btn=>btn.addEventListener('click',async e=>{
      e.stopPropagation();
      if(!hasSource()){ sync(false); return; }
      if(audio.paused){ userMuted=false; await start(); }
      else { userMuted=true; audio.pause(); sync(false); }
    }));

    audio.addEventListener('play',()=>sync(true));
    audio.addEventListener('pause',()=>sync(false));
    audio.addEventListener('ended',()=>sync(false));
    sync(false);

    window.addEventListener('load',()=>{
      if(!unlocked) start();
    },{once:true});
  };

  const initImageFallbacks=()=>{
    qsa('.quality-tools img').forEach(img=>{
      const card=img.closest('li');
      const media=img.closest('.qt-media');
      const label=(card?.dataset.title || img.alt || 'Image').trim();
      const applyFallback=()=>{
        if(card) card.classList.add('is-missing');
        if(media && !qs('.qt-placeholder',media)){
          const ph=document.createElement('div');
          ph.className='qt-placeholder';
          ph.innerHTML=`<i class="fa-regular fa-image"></i><span>${label}</span>`;
          media.appendChild(ph);
        }
      };
      if(img.complete && (!img.naturalWidth || !img.naturalHeight)) applyFallback();
      img.addEventListener('error',applyFallback,{once:true});
    });

    qsa('.brand-logos img').forEach(img=>{
      img.addEventListener('error',()=>{
        const holder=img.parentElement;
        if(holder){
          holder.classList.add('logo-fallback');
          holder.setAttribute('data-label',img.alt || 'Logo');
        }
        img.style.display='none';
      },{once:true});
    });
  };

  // Count statistics rapidly from 1 when the About section enters view.
  const initCountFromOne=()=>{
    const nums=qsa('#tentang .stat .number');
    if(!nums.length) return;
    nums.forEach(el=>{
      const raw=(el.textContent||'').replace(/[^0-9]/g,'');
      const target=Number(raw);
      if(!Number.isFinite(target)||target<2) return;
      el.dataset.target=String(target);
      el.textContent='1';
    });
    const run=el=>{
      const target=Number(el.dataset.target); if(!target||el.dataset.counted==='1') return;
      el.dataset.counted='1';
      if(reduce){el.textContent=target.toLocaleString('id-ID');return;}
      const start=performance.now(), duration=Math.min(1050,520+target*.55);
      const tick=now=>{
        const p=Math.min(1,(now-start)/duration);
        const eased=1-Math.pow(1-p,4);
        const value=Math.max(1,Math.round(1+(target-1)*eased));
        el.textContent=value.toLocaleString('id-ID');
        if(p<1) requestAnimationFrame(tick); else el.textContent=target.toLocaleString('id-ID');
      };
      requestAnimationFrame(tick);
    };
    if(!('IntersectionObserver' in window)){nums.forEach(run);return;}
    const obs=new IntersectionObserver(entries=>entries.forEach(e=>{
      if(!e.isIntersecting) return; nums.forEach(run); obs.disconnect();
    }),{threshold:.25});
    const about=qs('#tentang'); if(about) obs.observe(about);
  };

  // Give floating gallery frames a subtle random depth without disturbing layout.
  const initGalleryDepth=()=>{
    if(reduce) return;
    qsa('.film-frame').forEach((frame,i)=>{
      frame.style.setProperty('--float-scale',String(1 + (i%4)*.002));
    });
  };

  document.addEventListener('DOMContentLoaded',()=>{
    initManualMusic();
    initCountFromOne();
    initGalleryDepth();
    initImageFallbacks();
  });
})();

// ===== FINAL POSTER POPUP + SPARKLE EXPERIENCE =====
(() => {
  "use strict";
  const qs=(s,r=document)=>r.querySelector(s);
  const qsa=(s,r=document)=>Array.from(r.querySelectorAll(s));
  const reduce=window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const initSparkles=()=>{
    const wrap=qs('#sparkleField');
    if(!wrap || reduce || wrap.children.length) return;
    const total=Math.min(36,Math.max(18,Math.floor(innerWidth/52)));
    const frag=document.createDocumentFragment();
    for(let i=0;i<total;i++){
      const s=document.createElement('span');
      s.className='sparkle';
      s.style.left=`${Math.random()*100}%`;
      s.style.top=`${Math.random()*100}%`;
      s.style.animationDuration=`${5+Math.random()*9}s`;
      s.style.animationDelay=`${-Math.random()*11}s`;
      const size=2+Math.random()*4;
      s.style.width=s.style.height=`${size}px`;
      frag.appendChild(s);
    }
    wrap.appendChild(frag);
  };

  const initPosterPopup=()=>{
    const pop=qs('#welcomePop');
    const close=qs('#welcomeClose');
    const sound=qs('#welcomeSound');
    const poster=qs('#campaignPoster');
    const fallback=qs('#posterFallback');
    const audio=qs('#bgMusic');
    if(!pop) return;

    const syncSound=()=>{
      if(!sound || !audio) return;
      const on=!audio.paused;
      sound.innerHTML=`<i class="fa-solid ${on?'fa-volume-high':'fa-volume-xmark'}"></i> ${on?'BGM ON':'BGM OFF'}`;
      sound.classList.toggle('is-on',on);
    };

    const tryPlay=async()=>{
      if(!audio) return false;
      try{
        audio.volume=.42;
        await audio.play();
        syncSound();
        return true;
      }catch(e){
        syncSound();
        return false;
      }
    };

    const hide=()=>{
      pop.classList.remove('show');
      pop.setAttribute('aria-hidden','true');
      document.body.classList.remove('welcome-open');
      sessionStorage.setItem('qitPosterSeen','1');
    };

    const show=()=>{
      pop.classList.add('show');
      pop.setAttribute('aria-hidden','false');
      document.body.classList.add('welcome-open');
      setTimeout(()=>close?.focus(),220);
    };

    poster?.addEventListener('error',()=>{
      poster.hidden=true;
      if(fallback) fallback.hidden=false;
    },{once:true});

    close?.addEventListener('click',hide);
    sound?.addEventListener('click',async(e)=>{
      e.stopPropagation();
      if(!audio) return;
      if(audio.paused) await tryPlay();
      else audio.pause();
      syncSound();
    });
    audio?.addEventListener('play',syncSound);
    audio?.addEventListener('pause',syncSound);
    pop.addEventListener('click',e=>{if(e.target===pop) hide();});
    document.addEventListener('keydown',e=>{
      if(e.key==='Escape' && pop.classList.contains('show')) hide();
    });

    // Try autoplay on page load. Browser may block it; first pointer/keyboard interaction will retry.
    setTimeout(tryPlay,150);
    const unlock=()=>{ if(audio?.paused) tryPlay(); };
    document.addEventListener('pointerdown',unlock,{once:true,capture:true});
    document.addEventListener('keydown',unlock,{once:true,capture:true});

    // Show once per tab/session. Remove the condition below if you want it every refresh.
    setTimeout(show,380);
    syncSound();
  };

  const initFastCurrentStats=()=>{
    const nums=qsa('#tentang .stat .number[data-target]');
    if(!nums.length) return;
    const run=(el)=>{
      if(el.dataset.finalCounted==='1') return;
      el.dataset.finalCounted='1';
      const target=Number(el.dataset.target || el.textContent.replace(/[^0-9]/g,''));
      if(!Number.isFinite(target)||target<1) return;
      if(reduce){el.textContent=target.toLocaleString('id-ID');return;}
      const start=performance.now();
      const duration=480;
      const tick=(now)=>{
        const p=Math.min(1,(now-start)/duration);
        const eased=1-Math.pow(1-p,4);
        el.textContent=Math.max(1,Math.round(1+(target-1)*eased)).toLocaleString('id-ID');
        if(p<1) requestAnimationFrame(tick);
        else el.textContent=target.toLocaleString('id-ID');
      };
      requestAnimationFrame(tick);
    };
    nums.forEach(el=>el.textContent='1');
    if(!('IntersectionObserver' in window)){nums.forEach(run);return;}
    const about=qs('#tentang');
    const obs=new IntersectionObserver(entries=>{
      if(entries.some(e=>e.isIntersecting)){
        nums.forEach(run);
        obs.disconnect();
      }
    },{threshold:.35});
    if(about) obs.observe(about);
  };

  document.addEventListener('DOMContentLoaded',()=>{
    initSparkles();
    initPosterPopup();
    initFastCurrentStats();
  });
})();


// ===== FINAL POPUP + LOGO/BGM PATCH =====
(() => {
  "use strict";

  const qs = (s, r=document) => r.querySelector(s);

  const popup = qs("#welcomePop");
  const closeBtn = qs("#welcomeClose");
  const poster = qs("#campaignPoster");
  const fallback = qs("#posterFallback");
  const soundBtn = qs("#welcomeSound");
  const audio = qs("#bgMusic");
  const desktopBgm = qs("#bgmToggle");
  const mobileBgm = qs("#mobileBgmToggle");

  // Popup must appear again on every page refresh.
  const showPopup = () => {
    if (!popup) return;
    popup.classList.add("is-open");
    popup.setAttribute("aria-hidden", "false");
    document.body.classList.add("popup-open");
  };

  const closePopup = () => {
    if (!popup) return;
    popup.classList.remove("is-open");
    popup.setAttribute("aria-hidden", "true");
    document.body.classList.remove("popup-open");
  };

  if (poster) {
    poster.addEventListener("error", () => {
      poster.style.display = "none";
      if (fallback) fallback.hidden = false;
    }, { once:true });
  }

  const syncSound = () => {
    const on = !!audio && !audio.paused;
    if (soundBtn) {
      soundBtn.innerHTML = `<i class="fa-solid ${on ? "fa-volume-high" : "fa-volume-xmark"}"></i> BGM ${on ? "ON" : "OFF"}`;
    }
    [desktopBgm, mobileBgm].filter(Boolean).forEach(btn => {
      btn.classList.toggle("playing", on);
      btn.setAttribute("aria-pressed", String(on));
      const small = btn.querySelector("small");
      if (small) small.textContent = on ? "ON" : "OFF";
      const icon = btn.querySelector("i.fa-solid");
      if (icon) icon.className = `fa-solid ${on ? "fa-volume-high" : "fa-volume-xmark"}`;
    });
  };

  const tryPlay = async () => {
    if (!audio) return false;
    audio.volume = 0.42;
    try {
      await audio.play();
      syncSound();
      return true;
    } catch (_) {
      syncSound();
      return false;
    }
  };

  const toggleSound = async (e) => {
    e?.stopPropagation?.();
    if (!audio) return;
    if (audio.paused) await tryPlay();
    else {
      audio.pause();
      syncSound();
    }
  };

  closeBtn?.addEventListener("click", closePopup);
  popup?.addEventListener("click", (e) => {
    if (e.target === popup) closePopup();
  });
  soundBtn?.addEventListener("click", toggleSound);

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && popup?.classList.contains("is-open")) closePopup();
  });

  audio?.addEventListener("play", syncSound);
  audio?.addEventListener("pause", syncSound);

  // Autoplay try; if browser blocks, first user gesture unlocks it.
  window.addEventListener("load", () => {
    showPopup();
    tryPlay();
  }, { once:true });

  const unlock = () => {
    if (audio?.paused) tryPlay();
    document.removeEventListener("pointerdown", unlock, true);
    document.removeEventListener("keydown", unlockKey, true);
  };
  const unlockKey = (e) => {
    if (e.key === "Enter" || e.key === " " || e.code === "Space") unlock();
  };
  document.addEventListener("pointerdown", unlock, true);
  document.addEventListener("keydown", unlockKey, true);

  syncSound();
})();


// =========================================================
// QIT BATCH 9 — WEEKLY CONTROL CENTER + LIVE LEADERBOARD
// Update 28 Sep 2026
// =========================================================
(() => {
  "use strict";

  const POINT_CHALLENGE_URL = "https://script.google.com/macros/s/AKfycbz1iKWHZPoQI9vif1Ab-zcX4locQfnaMw8xh-edsP7WnckNqeVpJNgn79cx98PqS1w/exec";
  const LEADERBOARD_REFRESH_MS = 3 * 60 * 1000;

  const qs = (s, r = document) => r.querySelector(s);
  const qsa = (s, r = document) => Array.from(r.querySelectorAll(s));

  // ---------- Current Week ----------
  const getISOWeekInfo = (input = new Date()) => {
    const local = new Date(input.getFullYear(), input.getMonth(), input.getDate());
    const day = local.getDay() || 7;
    const monday = new Date(local);
    monday.setDate(local.getDate() - day + 1);

    const thursday = new Date(monday);
    thursday.setDate(monday.getDate() + 3);

    const yearStart = new Date(thursday.getFullYear(), 0, 1);
    const week = Math.ceil((((thursday - yearStart) / 86400000) + 1) / 7);

    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);

    return { week, monday, sunday };
  };

  const formatWeekRange = ({ monday, sunday }) => {
    const months = ["JAN", "FEB", "MAR", "APR", "MEI", "JUN", "JUL", "AGU", "SEP", "OCT", "NOV", "DES"];
    const sameMonth = monday.getMonth() === sunday.getMonth();
    const sameYear = monday.getFullYear() === sunday.getFullYear();

    if (sameMonth && sameYear) {
      return `${monday.getDate()}–${sunday.getDate()} ${months[monday.getMonth()]} ${sunday.getFullYear()}`;
    }
    if (sameYear) {
      return `${monday.getDate()} ${months[monday.getMonth()]} – ${sunday.getDate()} ${months[sunday.getMonth()]} ${sunday.getFullYear()}`;
    }
    return `${monday.getDate()} ${months[monday.getMonth()]} ${monday.getFullYear()} – ${sunday.getDate()} ${months[sunday.getMonth()]} ${sunday.getFullYear()}`;
  };

  const initCurrentWeek = () => {
    const info = getISOWeekInfo(new Date());
    const title = `WEEK ${info.week}`;
    const short = `W${info.week}`;

    const badge = qs("#currentWeekBadge");
    const heading = qs("#currentWeekTitle");
    const orbit = qs("#orbitWeek");
    const range = qs("#currentWeekRange");

    if (badge) badge.textContent = title;
    if (heading) heading.textContent = title;
    if (orbit) orbit.textContent = short;
    if (range) range.textContent = formatWeekRange(info);
  };

  // ---------- JSONP helper (works reliably from GitHub Pages -> Apps Script) ----------
  const jsonp = (url, params = {}, timeout = 12000) => new Promise((resolve, reject) => {
    const cb = `__qitCb_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    const script = document.createElement("script");
    const timer = setTimeout(() => {
      cleanup();
      reject(new Error("Timeout saat mengambil data."));
    }, timeout);

    const cleanup = () => {
      clearTimeout(timer);
      try { delete window[cb]; } catch (_) { window[cb] = undefined; }
      script.remove();
    };

    window[cb] = (payload) => {
      cleanup();
      resolve(payload);
    };

    const query = new URLSearchParams({ ...params, callback: cb, _: Date.now().toString() });
    script.src = `${url}${url.includes("?") ? "&" : "?"}${query.toString()}`;
    script.onerror = () => {
      cleanup();
      reject(new Error("Gagal terhubung ke sumber data."));
    };
    document.head.appendChild(script);
  });

  // ---------- Remote popup media from Google Drive / Apps Script ----------
  const initRemotePopupMedia = async () => {
    const poster = qs("#campaignPoster");
    const video = qs("#campaignVideo");
    const fallback = qs("#posterFallback");
    const loading = qs("#posterLoading");
    if (!poster || !video) return;

    if (loading) loading.hidden = false;

    try {
      const data = await jsonp(POINT_CHALLENGE_URL, { action: "popup" });
      if (!data || data.ok === false || !data.file) throw new Error(data?.message || "Media belum tersedia.");

      const file = data.file;
      const mime = String(file.mimeType || "").toLowerCase();

      if (mime.startsWith("video/")) {
        poster.hidden = true;
        poster.style.display = "none";
        video.hidden = false;
        video.src = file.previewUrl || `https://drive.google.com/file/d/${file.id}/preview`;
      } else {
        video.hidden = true;
        video.removeAttribute("src");
        poster.hidden = false;
        poster.style.display = "block";
        poster.src = file.imageUrl || `https://drive.google.com/uc?export=view&id=${encodeURIComponent(file.id)}`;
      }

      if (fallback) fallback.hidden = true;
    } catch (err) {
      // Fallback stays POPUP.png when the remote bridge has not been deployed yet.
      if (!poster.getAttribute("src")) poster.src = "POPUP.png";
    } finally {
      if (loading) loading.hidden = true;
    }
  };

  // ---------- Leaderboard ----------
  let leaderboardChart = null;

  const compactTeamName = (name) => String(name || "")
    .replace(/\s+/g, " ")
    .trim();

  const buildPodium = (rows) => {
    const wrap = qs("#leaderboardPodium");
    if (!wrap) return;

    const order = [
      { idx: 1, rank: 2, cls: "rank-2", icon: "fa-medal" },
      { idx: 0, rank: 1, cls: "rank-1", icon: "fa-crown" },
      { idx: 2, rank: 3, cls: "rank-3", icon: "fa-medal" }
    ];

    wrap.innerHTML = order.map(item => {
      const row = rows[item.idx];
      const team = row ? compactTeamName(row.team) : "—";
      const points = row ? Number(row.points || 0).toLocaleString("id-ID") : "—";
      return `<article class="podium-card ${item.cls}">
        <span class="podium-rank">${item.rank}</span>
        <div class="podium-medal"><i class="fa-solid ${item.icon}"></i></div>
        <b title="${team.replace(/"/g, "&quot;")}">${team}</b>
        <strong>${points}<small> PTS</small></strong>
      </article>`;
    }).join("");
  };

  const createBarGradient = (ctx, chartArea, rank) => {
    if (!chartArea) return rank === 0 ? "#0da7ee" : "#3177ea";
    const g = ctx.createLinearGradient(chartArea.left, 0, chartArea.right, 0);
    if (rank === 0) {
      g.addColorStop(0, "#ffd454");
      g.addColorStop(.45, "#ffae35");
      g.addColorStop(1, "#fff0a1");
    } else if (rank === 1) {
      g.addColorStop(0, "#9ed8ff");
      g.addColorStop(.55, "#5aa9ea");
      g.addColorStop(1, "#dff3ff");
    } else if (rank === 2) {
      g.addColorStop(0, "#e5a96b");
      g.addColorStop(.55, "#bd7642");
      g.addColorStop(1, "#ffd0a4");
    } else {
      g.addColorStop(0, "#0569d8");
      g.addColorStop(.48, "#11b9e7");
      g.addColorStop(1, "#6978ee");
    }
    return g;
  };

  const renderLeaderboardChart = (rows) => {
    const canvas = qs("#leaderboardChart");
    if (!canvas || typeof window.Chart !== "function") return;

    const labels = rows.map(r => compactTeamName(r.team));
    const values = rows.map(r => Number(r.points || 0));

    if (leaderboardChart) leaderboardChart.destroy();

    leaderboardChart = new Chart(canvas, {
      type: "bar",
      data: {
        labels,
        datasets: [{
          label: "Point",
          data: values,
          borderWidth: 1,
          borderColor: "rgba(255,255,255,.75)",
          borderRadius: 10,
          borderSkipped: false,
          backgroundColor: (context) => {
            const { ctx, chartArea } = context.chart;
            return createBarGradient(ctx, chartArea, context.dataIndex);
          },
          hoverBorderWidth: 2,
          hoverBorderColor: "#ffffff"
        }]
      },
      options: {
        indexAxis: "y",
        responsive: true,
        maintainAspectRatio: false,
        animation: {
          duration: 900,
          easing: "easeOutQuart"
        },
        interaction: {
          intersect: false,
          mode: "nearest",
          axis: "y"
        },
        plugins: {
          legend: { display: false },
          tooltip: {
            displayColors: false,
            backgroundColor: "rgba(5,31,66,.96)",
            titleColor: "#fff",
            bodyColor: "#dff7ff",
            padding: 12,
            cornerRadius: 10,
            callbacks: {
              title: items => items[0]?.label || "",
              label: item => ` ${Number(item.raw || 0).toLocaleString("id-ID")} poin`
            }
          }
        },
        scales: {
          x: {
            beginAtZero: true,
            grid: { color: "rgba(66,142,203,.12)", drawBorder: false },
            border: { display: false },
            ticks: {
              color: "#6f8fac",
              font: { family: "Poppins", size: 11, weight: "600" },
              precision: 0
            }
          },
          y: {
            grid: { display: false },
            border: { display: false },
            ticks: {
              color: "#17416d",
              autoSkip: false,
              font: { family: "Poppins", size: 11, weight: "700" },
              callback: function(value) {
                const text = this.getLabelForValue(value);
                return text.length > 28 ? text.slice(0, 26) + "…" : text;
              }
            }
          }
        }
      },
      plugins: [{
        id: "gloss",
        afterDatasetsDraw(chart) {
          const meta = chart.getDatasetMeta(0);
          const ctx = chart.ctx;
          ctx.save();
          meta.data.forEach(bar => {
            const p = bar.getProps(["x", "y", "base", "height"], true);
            const left = Math.min(p.base, p.x);
            const width = Math.abs(p.x - p.base);
            if (width < 8) return;
            const shine = ctx.createLinearGradient(left, 0, left + width, 0);
            shine.addColorStop(0, "rgba(255,255,255,.02)");
            shine.addColorStop(.45, "rgba(255,255,255,.18)");
            shine.addColorStop(.58, "rgba(255,255,255,.04)");
            shine.addColorStop(1, "rgba(255,255,255,0)");
            ctx.fillStyle = shine;
            ctx.fillRect(left, p.y - p.height / 2 + 2, width, Math.max(3, p.height * .36));
          });
          ctx.restore();
        }
      }]
    });
  };

  const setLeaderboardState = (text, error = false) => {
    const status = qs("#leaderboardStatus");
    if (!status) return;
    status.classList.toggle("is-error", error);
    status.innerHTML = error
      ? `<i class="fa-solid fa-triangle-exclamation"></i> ${text}`
      : `<i class="fa-solid fa-circle-notch fa-spin"></i> ${text}`;
    status.hidden = false;
  };

  const loadLeaderboard = async () => {
    const refresh = qs("#leaderboardRefresh");
    const updated = qs("#leaderboardUpdated");
    refresh?.classList.add("is-loading");
    setLeaderboardState("Mengambil data leaderboard...");

    try {
      const data = await jsonp(POINT_CHALLENGE_URL, { api: "leaderboard" });
      if (!data || data.success === false) throw new Error(data?.error || "Data tidak tersedia.");

      const rows = Array.isArray(data.top15)
        ? data.top15.slice(0, 15).map(team => ({
            team: team.namaTim || "Tanpa Nama",
            points: Number(team.totalPoin) || 0,
            lokasi: team.lokasi || "-",
            stream: team.stream || "-"
          }))
        : [];

      if (!rows.length) throw new Error("Data leaderboard kosong.");
      buildPodium(rows);
      renderLeaderboardChart(rows);

      const status = qs("#leaderboardStatus");
      if (status) status.hidden = true;
      if (updated) updated.innerHTML = `<i class="fa-regular fa-clock"></i> Update: ${data.updatedAt || new Date().toLocaleString("id-ID")}`;
    } catch (err) {
      console.error("QIT Leaderboard Error:", err);
      setLeaderboardState(`Gagal mengambil live leaderboard. (${err.message})`, true);
    } finally {
      refresh?.classList.remove("is-loading");
    }
  };

  const initLeaderboard = () => {
    qs("#leaderboardRefresh")?.addEventListener("click", loadLeaderboard);
    qs(".leaderboard-open")?.addEventListener("click", () => {
      window.open(POINT_CHALLENGE_URL, "_blank", "noopener,noreferrer");
    });
    loadLeaderboard();
    window.setInterval(loadLeaderboard, LEADERBOARD_REFRESH_MS);
  };

  document.addEventListener("DOMContentLoaded", () => {
    initCurrentWeek();
    initRemotePopupMedia();
    initLeaderboard();
  });
})();

// =========================================================
// QIT BATCH 9 — MULTI PNG POPUP CAROUSEL (GOOGLE DRIVE)
// Final 28 Sep 2026
// =========================================================
(() => {
  "use strict";

  const POINT_CHALLENGE_URL = "https://script.google.com/macros/s/AKfycbz1iKWHZPoQI9vif1Ab-zcX4locQfnaMw8xh-edsP7WnckNqeVpJNgn79cx98PqS1w/exec";
  const AUTO_MS = 6500;
  const qs = (s, r = document) => r.querySelector(s);

  const jsonp = (url, params = {}, timeout = 12000) => new Promise((resolve, reject) => {
    const cb = `__qitPopup_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    const script = document.createElement("script");
    let timer;
    const cleanup = () => {
      clearTimeout(timer);
      try { delete window[cb]; } catch (_) { window[cb] = undefined; }
      script.remove();
    };
    window[cb] = payload => { cleanup(); resolve(payload); };
    timer = setTimeout(() => { cleanup(); reject(new Error("Timeout popup")); }, timeout);
    const query = new URLSearchParams({ ...params, callback: cb, _: String(Date.now()) });
    script.src = `${url}${url.includes("?") ? "&" : "?"}${query.toString()}`;
    script.onerror = () => { cleanup(); reject(new Error("Popup source unavailable")); };
    document.head.appendChild(script);
  });

  const initPopupCarousel = async () => {
    const image = qs("#campaignPoster");
    const dots = qs("#popupDots");
    const prev = qs("#popupPrev");
    const next = qs("#popupNext");
    const loading = qs("#posterLoading");
    const fallback = qs("#posterFallback");
    const carousel = qs("#popupCarousel");
    if (!image || !dots || !carousel) return;

    let items = [];
    let index = 0;
    let timer = null;
    let touchStartX = 0;

    const renderDots = () => {
      dots.innerHTML = items.map((_, i) => `<button type="button" class="popup-dot${i === index ? " active" : ""}" data-popup-index="${i}" aria-label="Poster ${i + 1}"></button>`).join("");
      dots.hidden = items.length <= 1;
      prev?.classList.toggle("is-hidden", items.length <= 1);
      next?.classList.toggle("is-hidden", items.length <= 1);
    };

    const show = (i) => {
      if (!items.length) return;
      index = (i + items.length) % items.length;
      const item = items[index];
      image.classList.remove("is-loaded");
      image.alt = item.name ? `Poster QIT - ${item.name}` : `Poster QIT ${index + 1}`;
      image.src = `${item.imageUrl}${item.imageUrl.includes("?") ? "&" : "?"}v=${encodeURIComponent(item.updated || Date.now())}`;
      requestAnimationFrame(() => image.classList.add("is-loaded"));
      renderDots();
    };

    const restart = () => {
      clearInterval(timer);
      if (items.length > 1) timer = setInterval(() => show(index + 1), AUTO_MS);
    };

    prev?.addEventListener("click", () => { show(index - 1); restart(); });
    next?.addEventListener("click", () => { show(index + 1); restart(); });
    dots.addEventListener("click", e => {
      const btn = e.target.closest("[data-popup-index]");
      if (!btn) return;
      show(Number(btn.dataset.popupIndex));
      restart();
    });
    carousel.addEventListener("mouseenter", () => clearInterval(timer));
    carousel.addEventListener("mouseleave", restart);
    carousel.addEventListener("touchstart", e => { touchStartX = e.changedTouches[0]?.clientX || 0; }, { passive: true });
    carousel.addEventListener("touchend", e => {
      const endX = e.changedTouches[0]?.clientX || 0;
      const delta = endX - touchStartX;
      if (Math.abs(delta) > 45) show(index + (delta < 0 ? 1 : -1));
      restart();
    }, { passive: true });

    if (loading) loading.hidden = false;
    try {
      const data = await jsonp(POINT_CHALLENGE_URL, { action: "popup-list" });
      if (!data || data.ok === false || !Array.isArray(data.files)) throw new Error(data?.message || "No popup files");
      items = data.files.filter(x => String(x.mimeType || "").toLowerCase() === "image/png" && x.imageUrl);
      if (!items.length) throw new Error("Belum ada PNG di folder popup");
      if (fallback) fallback.hidden = true;
      show(0);
      restart();
    } catch (_) {
      items = [{ name: "POPUP.png", mimeType: "image/png", imageUrl: "POPUP.png", updated: "local" }];
      show(0);
    } finally {
      if (loading) loading.hidden = true;
    }
  };

  document.addEventListener("DOMContentLoaded", initPopupCarousel);
})();


// =========================================================
// FINAL UI PATCH — MEMORY + POPUP EVERY REFRESH
// =========================================================
(() => {
  "use strict";

  const initMemorySwiperFinal = () => {
    if (typeof window.Swiper !== "function") return;
    const el = document.querySelector(".memorySwiper");
    if (!el || el.swiper) return;
    new Swiper(el, {
      slidesPerView: 1.15,
      spaceBetween: 18,
      centeredSlides: false,
      grabCursor: true,
      speed: 650,
      loop: true,
      autoplay: { delay: 3200, disableOnInteraction: false, pauseOnMouseEnter: true },
      navigation: { nextEl: ".memory-next", prevEl: ".memory-prev" },
      pagination: { el: ".memory-pagination", clickable: true },
      breakpoints: {
        640: { slidesPerView: 2.15, spaceBetween: 20 },
        980: { slidesPerView: 3.2, spaceBetween: 24 },
        1280: { slidesPerView: 4, spaceBetween: 26 }
      }
    });
  };

  const forcePopupEveryRefresh = () => {
    const pop = document.querySelector("#welcomePop");
    if (!pop) return;
    try { sessionStorage.removeItem("qitPosterSeen"); } catch (_) {}
    const open = () => {
      pop.classList.add("show", "is-open");
      pop.setAttribute("aria-hidden", "false");
      document.body.classList.add("welcome-open", "popup-open");
    };
    window.addEventListener("load", () => setTimeout(open, 220), { once: true });
  };

  document.addEventListener("DOMContentLoaded", () => {
    initMemorySwiperFinal();
    forcePopupEveryRefresh();
  });
})();
