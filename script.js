(() => {
  "use strict";
  const qs=(s,r=document)=>r.querySelector(s);
  const qsa=(s,r=document)=>[...r.querySelectorAll(s)];
  const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
  const openUrl=url=>{if(url) window.open(url,'_blank','noopener,noreferrer')};

  function initNav(){
    const toggle=qs('#menuToggle'), menu=qs('#mainNav');
    if(toggle&&menu){
      const close=()=>{menu.classList.remove('active');toggle.setAttribute('aria-expanded','false');const i=qs('i',toggle);if(i)i.className='fa-solid fa-bars'};
      toggle.addEventListener('click',e=>{e.stopPropagation();const on=menu.classList.toggle('active');toggle.setAttribute('aria-expanded',String(on));const i=qs('i',toggle);if(i)i.className=`fa-solid ${on?'fa-xmark':'fa-bars'}`});
      document.addEventListener('click',e=>{if(innerWidth<=1100&&menu.classList.contains('active')&&!menu.contains(e.target)&&!toggle.contains(e.target))close()});
      qsa('a[href^="#"]',menu).forEach(a=>a.addEventListener('click',()=>{if(innerWidth<=1100)close()}));
    }
    qsa('[data-scroll-to]').forEach(el=>el.addEventListener('click',()=>{const id=el.dataset.scrollTo;if(id==='top')scrollTo({top:0,behavior:reduce?'auto':'smooth'});else document.getElementById(id)?.scrollIntoView({behavior:reduce?'auto':'smooth',block:'start'})}));
    qsa('a[href^="#"]').forEach(a=>a.addEventListener('click',e=>{const id=a.getAttribute('href').slice(1),t=document.getElementById(id);if(t){e.preventDefault();t.scrollIntoView({behavior:reduce?'auto':'smooth',block:'start'})}}));
  }

  function initScrollSpy(){
    const links=qsa('#mainNav a[href^="#"]'); if(!links.length||!('IntersectionObserver'in window))return;
    const items=links.map(a=>({a,el:document.querySelector(a.getAttribute('href'))})).filter(x=>x.el);
    const obs=new IntersectionObserver(entries=>{const v=entries.filter(e=>e.isIntersecting).sort((a,b)=>b.intersectionRatio-a.intersectionRatio)[0];if(!v)return;links.forEach(a=>a.classList.toggle('active',a.getAttribute('href')===`#${v.target.id}`));},{rootMargin:'-28% 0px -58% 0px',threshold:[.08,.2,.4]});
    items.forEach(x=>obs.observe(x.el));
  }

  function initActions(){
    qsa('.mission-card[data-url],.quick-card[data-url],.current-open[data-url]').forEach(el=>el.addEventListener('click',()=>openUrl(el.dataset.url)));
    const finderBtn=qs('#toggleMissionFinder'), tools=qs('.mission-tools');
    finderBtn?.addEventListener('click',()=>{const on=tools?.classList.toggle('open');finderBtn.classList.toggle('open',!!on);finderBtn.setAttribute('aria-expanded',String(!!on));if(on)setTimeout(()=>qs('#missionSearch')?.focus(),100)});
    const show=qs('#showAllMissions'), shell=qs('#mission-control');
    show?.addEventListener('click',()=>{const on=shell?.classList.toggle('show-all');show.classList.toggle('open',!!on);const span=qs('span',show);if(span)span.textContent=on?'Show Less':'Show All Missions'});
  }

  function initFinder(){
    const input=qs('#missionSearch'),clear=qs('#clearMissionSearch'),result=qs('#missionResult'),chips=qsa('.filter-chip'),cards=qsa('.mission-card'); if(!input)return;
    const cat=card=>{const c=(qs('.card-code',card)?.textContent||'').toLowerCase();if(c.includes('challenge')||c.includes('scoreboard'))return'challenge';if(c.includes('learning'))return'learning';if(c.includes('reference')||c.includes('best practice')||c.includes('toolkit'))return'reference';return'mission'};
    cards.forEach(c=>c.dataset.category=cat(c)); let active='all';
    const apply=()=>{const q=input.value.trim().toLowerCase();let n=0;cards.forEach(c=>{const show=(!q||c.textContent.toLowerCase().includes(q))&&(active==='all'||c.dataset.category===active);c.classList.toggle('is-hidden',!show);if(show)n++});if(result)result.textContent=`${n} menu tersedia`};
    input.addEventListener('input',apply);clear?.addEventListener('click',()=>{input.value='';input.focus();apply()});chips.forEach(ch=>ch.addEventListener('click',()=>{chips.forEach(x=>x.classList.remove('active'));ch.classList.add('active');active=ch.dataset.filter||'all';apply()}));apply();
  }

  function initReveal(){
    const items=qsa('.reveal-on-scroll'); if(reduce||!('IntersectionObserver'in window)){items.forEach(x=>x.classList.add('visible'));return}
    const obs=new IntersectionObserver((entries,o)=>entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add('visible');o.unobserve(e.target)}}),{threshold:.08,rootMargin:'0px 0px -8% 0px'});items.forEach(x=>obs.observe(x));
  }

  function initProgress(){
    const bar=qs('#scrollProgressBar'),top=qs('.back-to-top');const update=()=>{const max=document.documentElement.scrollHeight-innerHeight;const p=max>0?Math.min(100,scrollY/max*100):0;if(bar)bar.style.width=p+'%';top?.classList.toggle('show',scrollY>700)};addEventListener('scroll',update,{passive:true});addEventListener('resize',update);top?.addEventListener('click',()=>scrollTo({top:0,behavior:reduce?'auto':'smooth'}));update();
  }

  function initParticles(){
    if(reduce)return;const wrap=qs('#particles');if(wrap&&!wrap.children.length){const f=document.createDocumentFragment();for(let i=0;i<Math.min(30,Math.max(16,Math.floor(innerWidth/60)));i++){const p=document.createElement('span');p.className='particle';p.style.left=Math.random()*100+'%';p.style.animationDuration=(8+Math.random()*10)+'s';p.style.animationDelay=(-Math.random()*14)+'s';p.style.opacity=.2+Math.random()*.55;f.append(p)}wrap.append(f)}
    const spark=qs('#sparkleField');if(spark&&!spark.children.length){const f=document.createDocumentFragment();for(let i=0;i<28;i++){const s=document.createElement('span');s.className='sparkle';const size=1+Math.random()*3;s.style.width=s.style.height=size+'px';s.style.left=Math.random()*100+'%';s.style.top=Math.random()*100+'%';s.style.animationDuration=(9+Math.random()*15)+'s';s.style.animationDelay=(-Math.random()*12)+'s';f.append(s)}spark.append(f)}
    const shards=qs('#heroShards');if(shards&&!shards.children.length){for(let i=0;i<18;i++){const s=document.createElement('span');s.style.left=Math.random()*100+'%';s.style.top=(35+Math.random()*60)+'%';s.style.animationDuration=(5+Math.random()*7)+'s';s.style.animationDelay=(-Math.random()*7)+'s';shards.append(s)}}
  }

  function initStats(){
    const stats=qsa('.stat .number[data-target],.stat .number');if(!stats.length)return;const run=el=>{if(el.querySelector('i'))return;const target=Number(el.dataset.target||(el.textContent||'').replace(/\D/g,''));if(!target)return;let start=null;const dur=700;const tick=t=>{start??=t;const p=Math.min(1,(t-start)/dur);const e=1-Math.pow(1-p,3);el.textContent=Math.max(1,Math.round(target*e)).toLocaleString('id-ID');if(p<1)requestAnimationFrame(tick);else el.textContent=target.toLocaleString('id-ID')};requestAnimationFrame(tick)};if(!('IntersectionObserver'in window)){stats.forEach(run);return}const obs=new IntersectionObserver((entries,o)=>entries.forEach(e=>{if(e.isIntersecting){run(e.target);o.unobserve(e.target)}}),{threshold:.45});stats.forEach(s=>obs.observe(s));
  }

  function initTypewriter(){
    const el=qs('#qitTypewriter');if(!el)return;const text=el.dataset.text||'';if(reduce){el.textContent=text;return}let done=false;const run=()=>{if(done)return;done=true;el.textContent='';let i=0;const id=setInterval(()=>{el.textContent=text.slice(0,++i);if(i>=text.length)clearInterval(id)},20)};if('IntersectionObserver'in window){const o=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){run();o.disconnect()}}),{threshold:.35});o.observe(el)}else run();
  }

  function initGallery(){
    const overlay=qs('#fullscreenOverlay'),img=qs('figure img',overlay),cap=qs('figcaption',overlay);if(!overlay||!img)return;const imgs=qsa('.quality-tools img,#galeri .film-frame img');let idx=-1;const render=()=>{const x=imgs[idx];if(!x)return;img.src=x.currentSrc||x.src;img.alt=x.alt||'Preview';if(cap)cap.textContent=x.alt||''};const open=x=>{idx=imgs.indexOf(x);if(idx<0)return;render();overlay.classList.add('open');overlay.setAttribute('aria-hidden','false');document.body.style.overflow='hidden'};const close=()=>{overlay.classList.remove('open');overlay.setAttribute('aria-hidden','true');document.body.style.overflow=''};const move=d=>{if(!imgs.length)return;idx=(idx+d+imgs.length)%imgs.length;render()};imgs.forEach(x=>x.addEventListener('click',()=>open(x)));qs('.fs-close',overlay)?.addEventListener('click',close);qs('.fs-prev',overlay)?.addEventListener('click',()=>move(-1));qs('.fs-next',overlay)?.addEventListener('click',()=>move(1));overlay.addEventListener('click',e=>{if(e.target===overlay)close()});document.addEventListener('keydown',e=>{if(!overlay.classList.contains('open'))return;if(e.key==='Escape')close();if(e.key==='ArrowLeft')move(-1);if(e.key==='ArrowRight')move(1)});
    qsa('.quality-tools img').forEach(x=>x.addEventListener('error',()=>{x.classList.add('image-missing');x.closest('li')?.classList.add('missing')},{once:true}));
  }

  function initRipple(){qsa('.mission-card,.quick-card,.filter-chip,.mobile-dock button').forEach(el=>el.addEventListener('pointerdown',e=>{const r=el.getBoundingClientRect(),size=Math.max(r.width,r.height)*.45,s=document.createElement('span');s.className='ripple';s.style.width=s.style.height=size+'px';s.style.left=e.clientX-r.left-size/2+'px';s.style.top=e.clientY-r.top-size/2+'px';el.append(s);s.addEventListener('animationend',()=>s.remove(),{once:true})}))}

  function initBgm(){
    const audio=qs('#bgMusic'),desktop=qs('#bgmToggle'),mobile=qs('#mobileBgmToggle'),welcome=qs('#welcomeSound');if(!audio)return;audio.volume=.42;const buttons=[desktop,mobile,welcome].filter(Boolean);const sync=()=>{const on=!audio.paused;buttons.forEach(btn=>{btn.classList.toggle('playing',on);btn.setAttribute('aria-pressed',String(on));const sm=qs('small',btn);if(sm)sm.textContent=on?'ON':'OFF';const icon=qs('i.fa-solid',btn);if(icon)icon.className=`fa-solid ${on?'fa-volume-high':'fa-volume-xmark'}`;if(btn===welcome)btn.innerHTML=`<i class="fa-solid ${on?'fa-volume-high':'fa-volume-xmark'}"></i> BGM ${on?'ON':'OFF'}`})};const play=async()=>{try{await audio.play();sync();return true}catch{sync();return false}};const toggle=e=>{e?.stopPropagation();audio.paused?play():(audio.pause(),sync())};buttons.forEach(b=>b.addEventListener('click',toggle));audio.addEventListener('play',sync);audio.addEventListener('pause',sync);window.addEventListener('load',play,{once:true});const unlock=()=>{if(audio.paused)play();document.removeEventListener('pointerdown',unlock,true)};document.addEventListener('pointerdown',unlock,true);sync();
  }

  function initPopup(){
    const pop=qs('#welcomePop'),close=qs('#welcomeClose'),poster=qs('#campaignPoster'),fallback=qs('#posterFallback');if(!pop)return;const show=()=>{pop.classList.add('is-open');pop.setAttribute('aria-hidden','false');document.body.classList.add('popup-open')};const hide=()=>{pop.classList.remove('is-open');pop.setAttribute('aria-hidden','true');document.body.classList.remove('popup-open')};close?.addEventListener('click',hide);pop.addEventListener('click',e=>{if(e.target===pop)hide()});document.addEventListener('keydown',e=>{if(e.key==='Escape'&&pop.classList.contains('is-open'))hide()});poster?.addEventListener('error',()=>{poster.style.display='none';if(fallback)fallback.hidden=false},{once:true});window.addEventListener('load',()=>setTimeout(show,120),{once:true});
  }

  function initMobileDock(){const btns=qsa('.mobile-dock [data-scroll-to]');if(!btns.length||!('IntersectionObserver'in window))return;const ids=['current-mission','qit-journey','tentang'];const set=id=>btns.forEach(b=>b.classList.toggle('active',b.dataset.scrollTo===id));const obs=new IntersectionObserver(es=>{const v=es.filter(e=>e.isIntersecting).sort((a,b)=>b.intersectionRatio-a.intersectionRatio)[0];if(v)set(v.target.id);else if(scrollY<300)set('top')},{rootMargin:'-28% 0px -56% 0px',threshold:[.08,.2,.4]});ids.map(id=>document.getElementById(id)).filter(Boolean).forEach(el=>obs.observe(el));addEventListener('scroll',()=>{if(scrollY<300)set('top')},{passive:true})}

  document.addEventListener('DOMContentLoaded',()=>{initNav();initScrollSpy();initActions();initFinder();initReveal();initProgress();initParticles();initStats();initTypewriter();initGallery();initRipple();initBgm();initPopup();initMobileDock()});
})();
