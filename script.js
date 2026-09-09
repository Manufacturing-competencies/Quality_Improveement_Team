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
    if(!sessionStorage.getItem('qitPosterSeen')) setTimeout(show,380);
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
