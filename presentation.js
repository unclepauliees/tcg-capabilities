(() => {
  const root = document.documentElement;
  const media = matchMedia('(prefers-reduced-motion: reduce)');
  let preference;
  try { preference = localStorage.getItem('tcg-capes-motion'); } catch {}
  let reduced = preference === 'reduce' || media.matches;
  const toggle = document.querySelector('#motion-toggle');
  const video = document.querySelector('#hero-video');
  const videoButton = document.querySelector('#video-control');
  let userPaused = false;
  let videoVisible = true;
  const saveData = navigator.connection?.saveData;
  const chapterLinks = [...document.querySelectorAll('[data-chapter]')];
  const chapters = [...document.querySelectorAll('.chapter')];
  const progress = document.querySelector('.read-progress span');
  const drift = [...document.querySelectorAll('[data-drift]')];
  const containers = [...document.querySelectorAll('[data-container]')];
  const cases = [...document.querySelectorAll('[data-case]')];
  const scene = document.querySelector('.parallax-scene');
  const sceneCopy = document.querySelector('.scene-copy');
  const contents = document.querySelector('#contents');
  const contentsToggle = document.querySelector('#contents-toggle');
  function setMenu(open) {
    contents.hidden = !open;
    contentsToggle.setAttribute('aria-expanded', String(open));
    contentsToggle.querySelector('span').textContent = open ? '−' : '+';
  }
  contentsToggle.addEventListener('click', () => setMenu(contents.hidden));
  contents.addEventListener('click', (event) => {
    const link = event.target.closest('a');
    if (!link) return;
    setMenu(false);
    const destination = document.querySelector(link.hash);
    if (destination) {
      destination.tabIndex = -1;
      destination.focus({ preventScroll: true });
    }
  });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && !contents.hidden) { setMenu(false); contentsToggle.focus(); }
  });
  document.addEventListener('click', e => {
    if (!contents.hidden && !contents.contains(e.target) && !contentsToggle.contains(e.target)) setMenu(false);
  });
  function syncVideo() {
    if (reduced || saveData || userPaused || !videoVisible || document.hidden || video.ended) video.pause();
    else video.play().catch(() => { videoButton.textContent = 'Play film'; videoButton.setAttribute('aria-label', 'Play opening film'); });
  }
  function showVideoState() {
    const label = video.ended ? 'Replay film' : video.paused ? 'Play film' : 'Pause film';
    videoButton.textContent = label;
    videoButton.setAttribute('aria-label', label);
  }
  ['play','pause','ended'].forEach(name => video.addEventListener(name,showVideoState));
  video.addEventListener('error', () => { videoButton.hidden = true; });
  video.querySelector('source:last-of-type').addEventListener('error', () => { videoButton.hidden = true; });
  videoButton.addEventListener('click', () => {
    if (video.paused || video.ended) { userPaused = false; if(video.ended) video.currentTime = 0; video.play().catch(showVideoState); }
    else { userPaused = true; video.pause(); }
  });
  new IntersectionObserver(entries => { videoVisible = entries[0].isIntersecting; syncVideo(); }, {threshold:.1}).observe(video);
  document.addEventListener('visibilitychange', syncVideo);
  const landscapeVideo = document.querySelector('#landscape-video');
  const landscapeButton = document.querySelector('#landscape-control');
  let landscapeVisible = false;
  let landscapePaused = false;
  function landscapeState() {
    landscapeButton.textContent = landscapeVideo.paused ? 'Play film' : 'Pause film';
    landscapeButton.setAttribute('aria-label', landscapeVideo.paused ? 'Play background film' : 'Pause background film');
  }
  function syncLandscape() {
    if (reduced || saveData || landscapePaused || !landscapeVisible || document.hidden) landscapeVideo.pause();
    else landscapeVideo.play().catch(landscapeState);
  }
  ['play', 'pause'].forEach(name => landscapeVideo.addEventListener(name, landscapeState));
  landscapeButton.addEventListener('click', () => {
    landscapePaused = !landscapeVideo.paused;
    if (landscapePaused) landscapeVideo.pause();
    else landscapeVideo.play().catch(landscapeState);
  });
  function landscapeError() { landscapeButton.hidden = true; }
  landscapeVideo.addEventListener('error', landscapeError);
  landscapeVideo.querySelector('source:last-of-type').addEventListener('error', landscapeError);
  new IntersectionObserver(entries => {
    landscapeVisible = entries[0].isIntersecting;
    syncLandscape();
  }, {threshold: .1}).observe(landscapeVideo);
  document.addEventListener('visibilitychange', syncLandscape);
  const audienceVideo = document.querySelector('#audience-video');
  const audienceButton = document.querySelector('#audience-control');
  let audienceVisible = false;
  let audiencePaused = false;
  function audienceState() {
    audienceButton.textContent = audienceVideo.paused ? 'Play film' : 'Pause film';
    audienceButton.setAttribute('aria-label', audienceVideo.paused ? 'Play audience background film' : 'Pause audience background film');
  }
  function syncAudience() {
    if (reduced || saveData || audiencePaused || !audienceVisible || document.hidden) audienceVideo.pause();
    else audienceVideo.play().catch(audienceState);
  }
  ['play', 'pause'].forEach(name => audienceVideo.addEventListener(name, audienceState));
  audienceButton.addEventListener('click', () => {
    audiencePaused = !audienceVideo.paused;
    if (audiencePaused) audienceVideo.pause();
    else audienceVideo.play().catch(audienceState);
  });
  function audienceError() { audienceButton.hidden = true; }
  audienceVideo.addEventListener('error', audienceError);
  audienceVideo.querySelector('source:last-of-type').addEventListener('error', audienceError);
  new IntersectionObserver(entries => {
    audienceVisible = entries[0].isIntersecting;
    syncAudience();
  }, {threshold: .1}).observe(audienceVideo);
  document.addEventListener('visibilitychange', syncAudience);
  function applyMotion() {
    document.body.classList.toggle('reduce-motion', reduced);
    root.style.scrollBehavior = reduced ? 'auto' : '';
    toggle.setAttribute('aria-pressed', String(reduced));
    toggle.textContent = reduced ? 'Motion reduced' : 'Reduce motion';
    syncVideo(); syncLandscape(); syncAudience(); schedule();
  }
  toggle.addEventListener('click', () => {
    reduced = !reduced;
    try { localStorage.setItem('tcg-capes-motion', reduced ? 'reduce' : 'allow'); } catch {}
    applyMotion();
  });
  media.addEventListener('change', () => { reduced = media.matches; applyMotion(); });
  let queued = false;
  const clamp = (n,min,max) => Math.min(max,Math.max(min,n));
  function render() {
    queued = false;
    const h = innerHeight;
    const y = scrollY;
    const total = root.scrollHeight - h;
    progress.style.transform = `scaleX(${total > 0 ? y / total : 0})`;
    let active = chapters[0].id;
    for (const chapter of chapters) if (chapter.getBoundingClientRect().top < h*.42) active=chapter.id;
    for (const link of chapterLinks) {
      if(link.dataset.chapter===active) link.setAttribute('aria-current','location'); else link.removeAttribute('aria-current');
    }
    const small = innerWidth <= 760;
    for (const item of drift) {
      const r = item.getBoundingClientRect();
      const p = clamp((h-r.top)/(h+r.height),0,1)-.5;
      item.style.transform = reduced || small ? '' : `translateY(${p*Number(item.dataset.drift)}px)`;
    }
    for (const item of containers) {
      const r = item.getBoundingClientRect();
      const p = clamp((h-r.top)/(h*.8),0,1);
      item.style.transform = reduced ? '' : `scale(${.96+.04*p})`;
    }
    for (const item of cases) {
      const r=item.parentElement.getBoundingClientRect();
      const p=clamp(-r.top/Math.max(1,r.height-h*.4),0,1);
      item.style.transform=reduced ? '' : `scale(${1-.04*p})`;
    }
    const r=scene.getBoundingClientRect();
    const p=clamp(-r.top/Math.max(1,r.height-h),0,1);
    sceneCopy.style.transform=reduced ? '' : `translateY(${-p*(small?24:48)}px)`;
    video.style.transform=reduced || small ? '' : `translateY(${clamp(y*.08,0,80)}px)`;
  }
  function schedule() { if(!queued) { queued=true; requestAnimationFrame(render); } }
  // Mobile stacking: pin each chapter where its bottom meets the viewport bottom (or under the header if it fits).
  const stackQuery = matchMedia('(max-width: 760px)');
  function setStick() {
    const header = parseFloat(getComputedStyle(root).getPropertyValue('--header')) || 72;
    for (const chapter of chapters) {
      if (stackQuery.matches) chapter.style.setProperty('--stick', `${Math.min(header, innerHeight - chapter.offsetHeight)}px`);
      else chapter.style.removeProperty('--stick');
    }
  }
  new ResizeObserver(setStick).observe(document.body);
  addEventListener('resize', setStick, {passive:true});
  stackQuery.addEventListener('change', setStick);
  addEventListener('scroll',schedule,{passive:true});
  addEventListener('resize',schedule,{passive:true});
  applyMotion();
  document.fonts.ready.then(schedule);
})();
