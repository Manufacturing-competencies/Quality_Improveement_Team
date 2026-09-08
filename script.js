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
    const ids=['current-mission','batch9-journey','tentang'];
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

  // Upbeat procedural BGM. WebAudio starts only after explicit user tap/click.
  const createMusicEngine=()=>{
    let ctx=null,master=null,noiseBuffer=null,scheduler=null,nextBeat=0,step=0,playing=false;
    const bpm=116, beat=60/bpm/2; // eighth notes
    const ensure=()=>{
      if(ctx)return;
      const AC=window.AudioContext||window.webkitAudioContext;if(!AC)return;
      ctx=new AC();master=ctx.createGain();master.gain.value=.16;master.connect(ctx.destination);
      noiseBuffer=ctx.createBuffer(1,ctx.sampleRate*.12,ctx.sampleRate);
      const d=noiseBuffer.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1;
    };
    const tone=(freq,time,dur=.12,type='sine',gain=.05)=>{
      if(!ctx)return;const o=ctx.createOscillator(),g=ctx.createGain();o.type=type;o.frequency.setValueAtTime(freq,time);g.gain.setValueAtTime(gain,time);g.gain.exponentialRampToValueAtTime(.0001,time+dur);o.connect(g);g.connect(master);o.start(time);o.stop(time+dur+.02);
    };
    const kick=(time)=>{if(!ctx)return;const o=ctx.createOscillator(),g=ctx.createGain();o.type='sine';o.frequency.setValueAtTime(120,time);o.frequency.exponentialRampToValueAtTime(46,time+.13);g.gain.setValueAtTime(.55,time);g.gain.exponentialRampToValueAtTime(.001,time+.16);o.connect(g);g.connect(master);o.start(time);o.stop(time+.18)};
    const hat=(time,open=false)=>{if(!ctx||!noiseBuffer)return;const s=ctx.createBufferSource(),hp=ctx.createBiquadFilter(),g=ctx.createGain();s.buffer=noiseBuffer;hp.type='highpass';hp.frequency.value=6500;g.gain.setValueAtTime(open?.10:.055,time);g.gain.exponentialRampToValueAtTime(.001,time+(open?.10:.045));s.connect(hp);hp.connect(g);g.connect(master);s.start(time);s.stop(time+.11)};
    const snare=(time)=>{if(!ctx||!noiseBuffer)return;const s=ctx.createBufferSource(),bp=ctx.createBiquadFilter(),g=ctx.createGain();s.buffer=noiseBuffer;bp.type='bandpass';bp.frequency.value=1800;g.gain.setValueAtTime(.16,time);g.gain.exponentialRampToValueAtTime(.001,time+.12);s.connect(bp);bp.connect(g);g.connect(master);s.start(time);s.stop(time+.13);tone(180,time,.09,'triangle',.04)};
    const bass=[55,55,65.41,55,73.42,65.41,49,55];
    const lead=[220,0,261.63,0,293.66,0,261.63,329.63];
    const scheduleStep=(n,t)=>{if(n%4===0)kick(t);if(n%8===4)kick(t);if(n%4===2)snare(t);hat(t,n%4===3);tone(bass[n%8],t,.16,'sawtooth',.026);if(lead[n%8])tone(lead[n%8],t+.015,.10,'square',.012)};
    const tick=()=>{if(!ctx||!playing)return;while(nextBeat<ctx.currentTime+.12){scheduleStep(step,nextBeat);nextBeat+=beat;step=(step+1)%16;}};
    const start=async()=>{ensure();if(!ctx)return false;await ctx.resume();playing=true;step=0;nextBeat=ctx.currentTime+.05;scheduler=setInterval(tick,25);return true};
    const stop=()=>{playing=false;if(scheduler){clearInterval(scheduler);scheduler=null}if(master&&ctx){master.gain.cancelScheduledValues(ctx.currentTime);master.gain.setTargetAtTime(.0001,ctx.currentTime,.04)}};
    const resumeVolume=()=>{if(master&&ctx){master.gain.cancelScheduledValues(ctx.currentTime);master.gain.setTargetAtTime(.16,ctx.currentTime,.03)}};
    return {async toggle(){if(!playing){resumeVolume();return await start()}stop();return false},get playing(){return playing}};
  };

  const initBgm=()=>{
    const desktop=qs('#bgmToggle'),mobile=qs('#mobileBgmToggle');if(!desktop&&!mobile)return;
    const engine=createMusicEngine();
    const sync=(on)=>{
      [desktop,mobile].filter(Boolean).forEach(btn=>{btn.classList.toggle('playing',on);btn.setAttribute('aria-pressed',String(on));const small=qs('small',btn);if(small)small.textContent=on?'ON':'OFF';const icon=qs('.fa-music',btn);if(icon)icon.className=`fa-solid ${on?'fa-volume-high':'fa-music'}`;});
    };
    const action=async()=>{const on=await engine.toggle();sync(on)};
    desktop?.addEventListener('click',action);mobile?.addEventListener('click',action);
    document.addEventListener('visibilitychange',()=>{if(document.hidden&&engine.playing){engine.toggle();sync(false)}});
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
    const steps=qs('.journey-steps');const active=qs('.journey-step.active',steps);if(!steps||!active||innerWidth>760)return;
    setTimeout(()=>active.scrollIntoView({behavior:reduce?'auto':'smooth',block:'nearest',inline:'center'}),450);
  };

  document.addEventListener('DOMContentLoaded',()=>{initHeroShards();initTypewriter();initBgm();initFilm();initJourneySnap();});
})();
