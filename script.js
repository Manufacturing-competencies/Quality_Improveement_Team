// QIT Batch 9 FINAL6 — all-platform production build
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
  }

  /* ---------- popup: appears on every refresh ---------- */
  function initPopup() {
    const pop=qs("#welcomePop"), close=qs("#welcomeClose"), image=qs("#campaignPoster"), frame=qs("#campaignPosterFrame"), dots=qs("#popupDots"), prev=qs("#popupPrev"), next=qs("#popupNext"), loading=qs("#posterLoading"), fallback=qs("#posterFallback"), carousel=qs("#popupCarousel");
    if(!pop || !image || !carousel) return;

    const adminLink=qs(".poster-admin-link");
    if(adminLink){
      const adminUrl=`${APP_URL}?mode=popup-admin`;
      adminLink.href=adminUrl;
      adminLink.addEventListener("click",e=>{e.preventDefault();e.stopPropagation();window.open(adminUrl,"_blank","noopener,noreferrer")});
    }

    let items=[];
    let index=0;
    let timer=null;
    let touchX=0;

    const open=()=>{pop.classList.add("is-open");pop.setAttribute("aria-hidden","false");document.body.classList.add("popup-open")};
    const hide=()=>{pop.classList.remove("is-open");pop.setAttribute("aria-hidden","true");document.body.classList.remove("popup-open")};

    const renderDots=()=>{
      if(!dots) return;
      dots.innerHTML=items.map((_,i)=>`<button class="popup-dot${i===index?" active":""}" data-i="${i}" aria-label="Poster ${i+1}"></button>`).join("");
      dots.hidden=items.length<=1;
      prev?.classList.toggle("is-hidden",items.length<=1);
      next?.classList.toggle("is-hidden",items.length<=1);
    };

    const setBusy=on=>{
      if(loading) loading.hidden=!on;
      if(on && fallback) fallback.hidden=true;
    };

    const showLocalFallback=()=>{
      if(frame) frame.hidden=true;
      image.hidden=false;
      image.alt="Poster informasi QIT Batch 9";
      image.src=`POPUP.png?v=${Date.now()}`;
      image.onload=()=>{ if(fallback) fallback.hidden=true; setBusy(false); };
      image.onerror=()=>{ image.hidden=true; if(fallback) fallback.hidden=false; setBusy(false); };
    };

    const loadPoster=async i=>{
      if(!items.length) return showLocalFallback();
      index=(i+items.length)%items.length;
      const item=items[index];
      renderDots();
      setBusy(true);

      if(!frame) return showLocalFallback();
      image.hidden=true;
      frame.hidden=false;
      frame.setAttribute("aria-label",`Poster QIT - ${item.name||index+1}`);

      await new Promise(resolve=>{
        let done=false;
        const finish=ok=>{
          if(done) return; done=true;
          clearTimeout(t);
          if(ok){ if(fallback) fallback.hidden=true; }
          else showLocalFallback();
          setBusy(false);
          resolve();
        };
        const t=setTimeout(()=>finish(false),22000);
        frame.onload=()=>finish(true);
        frame.onerror=()=>finish(false);
        frame.src=`${APP_URL}?mode=popup-view&id=${encodeURIComponent(item.id)}&v=${encodeURIComponent(item.updated||Date.now())}`;
      });
    };

    const restart=()=>{
      clearInterval(timer);
      if(items.length>1) timer=setInterval(()=>loadPoster(index+1),POPUP_AUTO_MS);
    };

    close?.addEventListener("click",hide);
    pop.addEventListener("click",e=>{if(e.target===pop)hide()});
    document.addEventListener("keydown",e=>{if(e.key==="Escape"&&pop.classList.contains("is-open"))hide()});
    prev?.addEventListener("click",()=>{loadPoster(index-1);restart()});
    next?.addEventListener("click",()=>{loadPoster(index+1);restart()});
    dots?.addEventListener("click",e=>{const b=e.target.closest("[data-i]");if(b){loadPoster(Number(b.dataset.i));restart()}});
    carousel.addEventListener("touchstart",e=>touchX=e.changedTouches[0]?.clientX||0,{passive:true});
    carousel.addEventListener("touchend",e=>{const d=(e.changedTouches[0]?.clientX||0)-touchX;if(Math.abs(d)>45)loadPoster(index+(d<0?1:-1));restart()},{passive:true});

    setTimeout(open,180);
    setBusy(true);

    jsonpRetry(APP_URL,{action:"popup-list"},{attempts:3,timeout:16000,delay:900})
      .then(data=>{
        const files=Array.isArray(data?.files)?data.files.filter(f=>String(f.mimeType||"").toLowerCase()==="image/png"&&f.id):[];
        if(!files.length) throw new Error("Belum ada poster aktif");
        items=files.sort((a,b)=>String(a.name||"").localeCompare(String(b.name||""),undefined,{numeric:true,sensitivity:"base"}));
        renderDots();
        return loadPoster(0);
      })
      .then(restart)
      .catch(err=>{console.warn("QIT Popup list error:",err);showLocalFallback();});
  }

  /* ---------- galleries: arrows + drag/swipe + auto 5s, resume after 10s ---------- */
  function prepGallery(el) {
    const slides=qsa(".swiper-slide",el);
    const empty=el.closest(".media-showcase")?.querySelector(".media-empty");
    const wrapper=qs(".swiper-wrapper",el);
    const prev=qs(".media-prev",el);
    const next=qs(".media-next",el);
    if(!wrapper) return Promise.resolve();

    const tasks=slides.map(slide=>new Promise(resolve=>{
      const img=qs("img",slide);
      if(!img){slide.remove();return resolve()}
      const finish=ok=>{if(!ok)slide.remove();resolve()};
      if(img.complete)return finish(!!img.naturalWidth);
      img.addEventListener("load",()=>finish(true),{once:true});
      img.addEventListener("error",()=>finish(false),{once:true});
    }));

    return Promise.all(tasks).then(()=>{
      const remain=qsa(".swiper-slide",el);
      if(!remain.length){
        el.hidden=true;
        if(empty) empty.hidden=false;
        return;
      }
      el.hidden=false;
      if(empty) empty.hidden=true;

      let autoTimer=null, resumeTimer=null, down=false, startX=0, startLeft=0, moved=false;
      const maxScroll=()=>Math.max(0,wrapper.scrollWidth-wrapper.clientWidth);
      const step=()=>{
        const first=qs(".swiper-slide",wrapper);
        if(!first) return Math.max(300,wrapper.clientWidth*.86);
        const styles=getComputedStyle(wrapper);
        const gap=parseFloat(styles.columnGap||styles.gap||0)||24;
        return first.getBoundingClientRect().width+gap;
      };
      const go=(dir,manual=false)=>{
        const max=maxScroll();
        if(max<=2)return;
        let target=wrapper.scrollLeft+dir*step();
        if(dir>0 && target>=max-10) target=0;
        if(dir<0 && target<=10) target=max;
        wrapper.scrollTo({left:target,behavior:reduceMotion?"auto":"smooth"});
        if(manual) userInteracted();
      };
      const stopAuto=()=>{clearInterval(autoTimer);autoTimer=null};
      const startAuto=()=>{
        stopAuto();
        if(reduceMotion || remain.length<=1)return;
        autoTimer=setInterval(()=>go(1,false),GALLERY_AUTO_MS);
      };
      const userInteracted=()=>{
        stopAuto();clearTimeout(resumeTimer);
        resumeTimer=setTimeout(startAuto,GALLERY_RESUME_MS);
      };

      prev?.addEventListener("click",e=>{e.preventDefault();e.stopPropagation();go(-1,true)});
      next?.addEventListener("click",e=>{e.preventDefault();e.stopPropagation();go(1,true)});

      wrapper.addEventListener("pointerdown",e=>{
        if(e.pointerType==="mouse" && e.button!==0)return;
        down=true;moved=false;startX=e.clientX;startLeft=wrapper.scrollLeft;
        wrapper.classList.add("is-dragging");stopAuto();clearTimeout(resumeTimer);
        try{wrapper.setPointerCapture(e.pointerId)}catch(_){}
      });
      wrapper.addEventListener("pointermove",e=>{
        if(!down)return;
        const dx=e.clientX-startX;
        if(Math.abs(dx)>4)moved=true;
        wrapper.scrollLeft=startLeft-dx;
      });
      const stop=e=>{
        if(!down)return;
        down=false;wrapper.classList.remove("is-dragging");
        try{wrapper.releasePointerCapture(e.pointerId)}catch(_){}
        userInteracted();
      };
      wrapper.addEventListener("pointerup",stop);
      wrapper.addEventListener("pointercancel",stop);
      wrapper.addEventListener("pointerleave",e=>{if(down&&e.pointerType==="mouse")stop(e)});
      wrapper.addEventListener("wheel",userInteracted,{passive:true});
      wrapper.addEventListener("touchend",userInteracted,{passive:true});
      wrapper.addEventListener("click",e=>{if(moved){e.preventDefault();e.stopPropagation();moved=false}},true);
      wrapper.addEventListener("mouseenter",stopAuto);
      wrapper.addEventListener("mouseleave",()=>{clearTimeout(resumeTimer);resumeTimer=setTimeout(startAuto,GALLERY_RESUME_MS)});
      document.addEventListener("visibilitychange",()=>{if(document.hidden)stopAuto();else userInteracted()});
      startAuto();
    });
  }
  function initGalleries(){qsa(".gallery-swiper").forEach(prepGallery)}

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

  /* ---------- BGM ---------- */
  function initMusic(){
    const audio=qs("#bgMusic"), buttons=[qs("#bgmToggle"),qs("#mobileBgmToggle"),qs("#welcomeSound")].filter(Boolean); if(!audio)return;
    audio.volume=.38;
    const sync=()=>buttons.forEach(btn=>{const on=!audio.paused;btn.classList.toggle("playing",on);btn.setAttribute("aria-pressed",String(on));const small=qs("small",btn);if(small)small.textContent=on?"ON":"OFF";if(btn.id==="welcomeSound")btn.innerHTML=`<i class="fa-solid ${on?"fa-volume-high":"fa-volume-xmark"}"></i> BGM ${on?"ON":"OFF"}`});
    buttons.forEach(btn=>btn.addEventListener("click",async e=>{e.stopPropagation();try{if(audio.paused)await audio.play();else audio.pause()}catch(_){}sync()}));
    audio.addEventListener("play",sync);audio.addEventListener("pause",sync);sync();
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
    initFullscreen();
    initMusic();
    initAbout();
    initParticles();
    initHeroLivingMotion();
  });
})();
