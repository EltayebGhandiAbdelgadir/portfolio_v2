// Theme toggle and reveal animations
(() => {
  const doc = document.documentElement;
  const themeToggle = document.getElementById('theme-toggle');
  const saved = localStorage.getItem('theme');
  if (saved === 'light') doc.classList.add('light');

  themeToggle?.addEventListener('click', () => {
    const isLight = doc.classList.toggle('light');
    localStorage.setItem('theme', isLight ? 'light' : 'dark');
    themeToggle.textContent = isLight ? '☀️' : '🌙';
  });

  // Mobile nav toggle
  const navToggle = document.querySelector('.nav-toggle');
  const navLinks = document.querySelector('.nav-links');
  navToggle?.addEventListener('click', () => {
    navLinks.classList.toggle('open');
  });

  // Nav indicator movement (top bar)
  const navIndicator = document.querySelector('.nav-indicator');
  const navAnchors = Array.from(document.querySelectorAll('.nav-links a'));
  function moveIndicatorTo(el){
    if (!navIndicator || !el) return;
    const rect = el.getBoundingClientRect();
    const parentRect = el.closest('.nav-inner').getBoundingClientRect();
    const left = rect.left - parentRect.left + (rect.width - Math.min(120, rect.width)) / 2;
    const width = Math.min(120, rect.width);
    navIndicator.style.transform = `translateX(${left}px)`;
    navIndicator.style.width = width + 'px';
  }
  // initialize under current hash or first anchor
  const initial = navAnchors.find(a => a.getAttribute('href') === location.hash) || navAnchors[0];
  if (initial) moveIndicatorTo(initial);
  navAnchors.forEach(a => {
    a.addEventListener('mouseenter', () => moveIndicatorTo(a));
    a.addEventListener('click', () => { setTimeout(()=> moveIndicatorTo(a), 80); });
  });
  window.addEventListener('resize', () => { const active = document.querySelector('.nav-links a[href="'+location.hash+'"]') || navAnchors[0]; if(active) moveIndicatorTo(active); });

  // Hide nav on scroll: hide when scrolling down, show when scrolling up
  const navEl = document.querySelector('.nav');
  let lastY = window.scrollY;
  let tickingNav = false;
  function onScrollNav(){
    const y = window.scrollY;
    // don't hide if mobile nav is open
    const mobileOpen = navLinks.classList.contains('open');
    if (mobileOpen) { navEl.classList.remove('nav-hidden'); lastY = y; return; }
    if (Math.abs(y - lastY) < 8) return;
    if (y > lastY && y > 80) {
      navEl.classList.add('nav-hidden');
    } else {
      navEl.classList.remove('nav-hidden');
    }
    lastY = y;
    tickingNav = false;
  }
  window.addEventListener('scroll', () => {
    if (tickingNav) return;
    tickingNav = true;
    requestAnimationFrame(onScrollNav);
  }, { passive: true });

  // Intersection reveal
  const reveal = (el) => el.classList.add('show');
  const io = new IntersectionObserver((items) => {
    items.forEach(i => { if (i.isIntersecting) reveal(i.target); });
  }, { threshold: 0.12 });
  document.querySelectorAll('.section, .project-card, .skill-card').forEach(n => io.observe(n));

  // Contact form -> mailto fallback
  const form = document.getElementById('contact-form');
  form?.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = form.name.value.trim();
    const email = form.email.value.trim();
    const message = form.message.value.trim();
    const subjectField = form.subject?.value?.trim();
    if (!name || !email || !message) return alert('Please complete the required fields.');
    const subject = encodeURIComponent(subjectField || `Portfolio message from ${name}`);
    const body = encodeURIComponent(`Name: ${name}%0AEmail: ${email}%0A%0A${message}`);
    window.location.href = `mailto:eltayeb.ghandi@example.com?subject=${subject}&body=${body}`;
  });

  // Certificates lightbox
  const lightbox = document.getElementById('lightbox');
  const lbImg = document.getElementById('lightbox-img');
  const lbCaption = document.getElementById('lightbox-caption');
  const lbClose = document.querySelector('.lightbox-close');

  document.querySelectorAll('.cert-thumb').forEach(btn => {
    btn.addEventListener('click', () => {
      const img = btn.querySelector('img');
      lbImg.src = img.src;
      lbImg.alt = img.alt || '';
      lbCaption.textContent = btn.dataset.title || '';
      lightbox.setAttribute('aria-hidden', 'false');
    });
  });

  const closeLightbox = () => {
    lightbox.setAttribute('aria-hidden', 'true');
    lbImg.src = '';
    lbCaption.textContent = '';
  };

  lbClose?.addEventListener('click', closeLightbox);
  lightbox?.addEventListener('click', (e) => { if (e.target === lightbox) closeLightbox(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeLightbox(); });
})();

// Hero fullscreen behavior: start fullscreen, shrink when user scrolls
(function(){
  const hero = document.querySelector('.hero');
  if (!hero) return;
  const splashEl = document.querySelector('.hero-splash');
  let prevIsFullscreen = true;
  let splashTriggered = false;
  function setState(){
    const isNowFullscreen = window.scrollY <= 40;
    if (!isNowFullscreen) {
      hero.classList.remove('fullscreen');
      hero.classList.add('scrolled');
    } else {
      hero.classList.add('fullscreen');
      hero.classList.remove('scrolled');
    }
    // trigger splash only once when going from fullscreen -> scrolled
    if (prevIsFullscreen && !isNowFullscreen && splashEl && !splashTriggered) {
      splashTriggered = true;
      splashEl.classList.remove('splash-animate');
      // force reflow then add
      void splashEl.offsetWidth;
      splashEl.classList.add('splash-animate');
      // remove after animation completes
      setTimeout(()=> splashEl.classList.remove('splash-animate'), 600);
    }
    prevIsFullscreen = isNowFullscreen;
  }
  hero.classList.add('fullscreen');
  setState();
  let raf = null;
  window.addEventListener('scroll', () => {
    if (raf) return;
    raf = requestAnimationFrame(() => { setState(); raf = null; });
  }, { passive: true });
})();

// Background particle animation
(function(){
  const canvas = document.getElementById('bg-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let W = canvas.width = innerWidth;
  let H = canvas.height = innerHeight;
  const DPR = Math.min(devicePixelRatio || 1, 2);
  canvas.width = W * DPR; canvas.height = H * DPR; canvas.style.width = W + 'px'; canvas.style.height = H + 'px'; ctx.scale(DPR, DPR);
  canvas.classList.add('bg-canvas-visible');

  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReduced) { canvas.classList.add('bg-canvas-hidden'); return; }

  const particles = [];
  const PARTICLE_COUNT = Math.max(25, Math.floor((W*H)/80000));

  function rand(min,max){ return Math.random()*(max-min)+min }

  class P{
    constructor(){
      this.reset();
    }
    reset(){
      this.x = rand(0,W); this.y = rand(0,H);
      this.vx = rand(-0.3,0.3); this.vy = rand(-0.2,0.2);
      this.r = rand(1,2.6);
      this.alpha = rand(0.15,0.6);
      this.h = rand(180,200);
    }
    step(){
      this.x += this.vx; this.y += this.vy;
      if (this.x < -10 || this.x > W+10 || this.y < -10 || this.y > H+10) this.reset();
    }
    draw(){
      ctx.beginPath();
      const grad = ctx.createRadialGradient(this.x,this.y,0,this.x,this.y,this.r*6);
      grad.addColorStop(0, `rgba(225,40,40,${this.alpha})`);
      grad.addColorStop(1, `rgba(183,28,28,0)`);
      ctx.fillStyle = grad; ctx.arc(this.x,this.y,this.r,0,Math.PI*2); ctx.fill();
    }
  }

  for(let i=0;i<PARTICLE_COUNT;i++) particles.push(new P());

  function draw(){
    ctx.clearRect(0,0,W,H);
    // subtle vignette
    particles.forEach(p=>{ p.step(); p.draw(); });
    // connect nearby particles with faint lines
    for(let i=0;i<particles.length;i++){
      for(let j=i+1;j<particles.length;j++){
        const a = particles[i], b = particles[j];
        const dx = a.x-b.x, dy = a.y-b.y, d = Math.hypot(dx,dy);
        if (d < 120){
          ctx.strokeStyle = `rgba(225,40,40,${(120-d)/600})`;
          ctx.lineWidth = 0.6; ctx.beginPath(); ctx.moveTo(a.x,a.y); ctx.lineTo(b.x,b.y); ctx.stroke();
        }
      }
    }
    requestAnimationFrame(draw);
  }

  window.addEventListener('resize', ()=>{
    W = canvas.width = innerWidth; H = canvas.height = innerHeight;
    canvas.width = W * DPR; canvas.height = H * DPR; canvas.style.width = W + 'px'; canvas.style.height = H + 'px'; ctx.scale(DPR, DPR);
  });

  draw();
})();
