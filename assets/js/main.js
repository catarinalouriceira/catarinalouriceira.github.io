(() => {
  'use strict';

  const root = document.documentElement;
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const calm = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const save = (k, v) => { try { localStorage.setItem(k, v); } catch (e) { /* private mode */ } };

  /* ---------- shade + AM/PM ---------- */

  const SHADES = { roma: 'Romã', figo: 'Figo', pessego: 'Pêssego', matcha: 'Matcha' };
  const picks = $$('[data-shade-pick]');
  const shadeName = $('[data-shade-name]');
  const themeBtn = $('[data-theme-toggle]');
  const themeMeta = $('meta[name="theme-color"]');

  function setShade(shade, keep) {
    if (!SHADES[shade]) return;
    root.dataset.shade = shade;
    picks.forEach(b => {
      const on = b.dataset.shadePick === shade;
      b.setAttribute('aria-checked', on);
      b.tabIndex = on ? 0 : -1;
    });
    if (shadeName) shadeName.textContent = SHADES[shade];
    if (keep) save('cl-shade', shade);
  }

  function setTheme(theme, keep) {
    root.dataset.theme = theme;
    themeBtn.setAttribute('aria-pressed', theme === 'pm');
    themeMeta.content = theme === 'pm' ? '#161213' : '#F5EFE7';
    if (keep) save('cl-theme', theme);
  }

  picks.forEach(b => b.addEventListener('click', () => setShade(b.dataset.shadePick, true)));
  $$('[role="radiogroup"]').forEach(group => {
    group.addEventListener('keydown', e => {
      const step = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key];
      if (!step) return;
      e.preventDefault();
      const items = $$('[data-shade-pick]', group);
      const next = items[(items.indexOf(document.activeElement) + step + items.length) % items.length];
      setShade(next.dataset.shadePick, true);
      next.focus();
    });
  });
  themeBtn.addEventListener('click', () => setTheme(root.dataset.theme === 'pm' ? 'am' : 'pm', true));
  setShade(root.dataset.shade || 'roma');
  setTheme(root.dataset.theme || 'am');

  /* ---------- tabs (intro language, caption, routine shelf) ---------- */

  $$('[data-tabs]').forEach(box => {
    const tabs = $$('[role="tab"]', box);
    const select = (tab, focus) => {
      tabs.forEach(t => {
        const on = t === tab;
        t.setAttribute('aria-selected', on);
        t.tabIndex = on ? 0 : -1;
        document.getElementById(t.getAttribute('aria-controls')).classList.toggle('is-on', on);
      });
      if (focus) tab.focus();
    };
    tabs.forEach((tab, i) => {
      tab.addEventListener('click', () => select(tab));
      tab.addEventListener('keydown', e => {
        const to = { ArrowRight: i + 1, ArrowLeft: i - 1, Home: 0, End: tabs.length - 1 }[e.key];
        if (to === undefined) return;
        e.preventDefault();
        select(tabs[(to + tabs.length) % tabs.length], true);
      });
    });
  });

  /* ---------- header ---------- */

  const top = $('.top');
  const menuBtn = $('.menu-btn');
  const onScroll = () => top.classList.toggle('is-stuck', scrollY > 8);
  addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  const setMenu = open => {
    top.classList.toggle('is-open', open);
    document.documentElement.classList.toggle('menu-open', open);
    menuBtn.setAttribute('aria-expanded', open);
    menuBtn.textContent = open ? 'Close' : 'Menu';
  };
  menuBtn.addEventListener('click', () => setMenu(!top.classList.contains('is-open')));
  $$('.nav a').forEach(a => a.addEventListener('click', () => setMenu(false)));
  addEventListener('keydown', e => { if (e.key === 'Escape') setMenu(false); });

  if ('IntersectionObserver' in window) {
    const links = new Map($$('.nav a').map(a => [a.getAttribute('href').slice(1), a]));
    const spy = new IntersectionObserver(entries => {
      entries.forEach(en => {
        if (!en.isIntersecting) return;
        links.forEach(a => a.classList.remove('is-here'));
        links.get(en.target.id)?.classList.add('is-here');
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    $$('main section[id]').forEach(s => spy.observe(s));

    /* ---------- reveal ---------- */
    const seen = new IntersectionObserver(entries => {
      entries.forEach(en => {
        if (!en.isIntersecting) return;
        en.target.classList.add('is-in');
        seen.unobserve(en.target);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: .08 });
    $$('[data-reveal]').forEach(el => seen.observe(el));
  } else {
    $$('[data-reveal]').forEach(el => el.classList.add('is-in'));
  }

  /* ---------- label tilt ---------- */

  const label = $('[data-tilt]');
  if (label && !calm && matchMedia('(hover: hover) and (pointer: fine)').matches) {
    const card = $('.label-in', label);
    label.addEventListener('pointermove', e => {
      const r = label.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width;
      const y = (e.clientY - r.top) / r.height;
      label.classList.add('is-live');
      card.style.setProperty('--ry', `${(x - .5) * 9}deg`);
      card.style.setProperty('--rx', `${(.5 - y) * 7}deg`);
      card.style.setProperty('--mx', `${x * 100}%`);
      card.style.setProperty('--my', `${y * 100}%`);
    });
    label.addEventListener('pointerleave', () => {
      label.classList.remove('is-live');
      card.style.setProperty('--ry', '0deg');
      card.style.setProperty('--rx', '0deg');
    });
  }

  /* ---------- clocks + copy ---------- */

  const clocks = $$('[data-clock]').map(el => [el, new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: el.dataset.clock })]);
  const tick = () => { const now = new Date(); clocks.forEach(([el, f]) => { el.textContent = f.format(now); }); };
  tick();
  setInterval(tick, 15000);

  $$('[data-copy]').forEach(btn => {
    const label = btn.textContent;
    btn.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(btn.dataset.copy);
        btn.textContent = 'Copied';
      } catch (e) {
        btn.textContent = 'Press Ctrl/Cmd + C';
        getSelection().selectAllChildren($('.contact-mail'));
      }
      setTimeout(() => { btn.textContent = label; }, 1800);
    });
  });

  /* ---------- work viewer ---------- */

  const VIDEO = 'Angle, script and caption, with suggested shots, b-roll and imagery. Edited by Deloitte’s video team.';
  const COPY = 'Strategy and Portuguese copy, adapted from the global report for a local audience.';
  const ADAPT = 'Local rollout and Portuguese caption. Subtitle and translation review with the video team.';
  const li = (urn, slug) => ({ p: 'li', urn, url: `https://www.linkedin.com/posts/${slug}` });
  const ig = (t, code) => ({ p: 'ig', t, code });

  const PIECES = {
    'dct-genai': {
      title: 'Digital Consumer Trends 2025', kind: 'Reel', date: 'November 2025', role: VIDEO,
      hook: '85% dos portugueses com conhecimento de ferramentas de GenAI já utilizou pelo menos uma.',
      gloss: '85% of people in Portugal who know of GenAI tools have already used at least one.',
      src: [ig('reel', 'DRAvyotjSPV'), li('urn:li:ugcPost:7395067984551227392', 'deloitte_digital-consumer-trends-2025-portugal-edition-ugcPost-7395067984551227392-0WRT')],
    },
    'dct-social': {
      title: 'Digital Consumer Trends 2025', kind: 'Reel', date: 'November 2025', role: VIDEO,
      hook: '36% dos portugueses já acompanham notícias ou eventos atuais através das redes sociais.',
      gloss: '36% of people in Portugal already follow the news or current events through social media.',
      src: [ig('reel', 'DRH8UILgTnE'), li('urn:li:ugcPost:7396155148584210433', 'deloitte_digital-consumer-trends-2025-portugal-edition-activity-7396155149897080832-IcUu')],
    },
    sports: {
      title: '2026 Global Sports Outlook', kind: 'Reel', date: 'April 2026', role: VIDEO,
      hook: 'Como pode o crescimento das organizações desportivas elevar a experiência dos adeptos?',
      gloss: 'How can the growth of sports organisations lift the fan experience?',
      src: [ig('reel', 'DW89I77Em0S'), li('urn:li:ugcPost:7448686288095924224', 'deloitte_sports-outlook-diogo-henriques-ugcPost-7448686288095924224-gEHy')],
    },
    tmt26: {
      title: 'TMT Predictions 2026', kind: 'Carousel, 7 pages', date: 'February 2026', role: COPY,
      hook: 'As nossas 13 previsões para este ano em tópicos como GenAI, infraestruturas inteligentes, conectividade de satélite, e a colisão do streaming com conteúdos de redes sociais.',
      gloss: 'Our 13 predictions for the year: GenAI, smart infrastructure, satellite connectivity, and streaming colliding with social content.',
      src: [li('urn:li:ugcPost:7427758478431125504', 'deloitte_tmt-predictions-2026-ugcPost-7427758478431125504-79hs')],
    },
    tmt25: {
      title: 'TMT Predictions 2025', kind: 'Video teaser and launch post', date: 'December 2024 to March 2025', role: ADAPT,
      hook: 'Como podem as organizações de Technology, Media & Telecommunications preparar-se para o futuro?',
      gloss: 'How can Technology, Media & Telecommunications organisations prepare for the future?',
      src: [li('urn:li:ugcPost:7309665242567888897', 'deloitte_tmt2025-short4mp4-ugcPost-7309665242567888897-GGTu'), ig('p', 'DDQZentsGMJ')],
    },
    tmt24: {
      title: 'TMT Predictions 2024', kind: 'Post', date: 'May 2024', role: COPY,
      hook: 'A tecnologia e a conetividade podem ajudar a solucionar grandes problemas.',
      gloss: 'Technology and connectivity can help solve big problems.',
      src: [ig('p', 'C7Ib6FVt4gw')],
    },
    'cs-52': {
      title: 'ConsumerSignals', kind: 'Post', date: 'May 2025', role: COPY,
      hook: 'No final de 2024, 52% dos portugueses entre os 18 e 34 anos esperavam atingir uma melhor condição financeira em 2025.',
      gloss: 'At the end of 2024, 52% of 18-to-34-year-olds in Portugal expected to be better off in 2025.',
      src: [li('urn:li:activity:7332465479837528064', 'deloitte_deloitteportugal-consumersignals-consumo-activity-7332465479837528064-oih6')],
    },
    'cr-2026': {
      title: 'Consumer & Retail 2026', kind: 'Post', date: 'April 2026', role: COPY,
      hook: 'O que temos em vista para 2026 nos setores do consumo e retalho?',
      gloss: 'What do we have in sight for consumer and retail in 2026?',
      src: [li('urn:li:activity:7452023278094934016', 'deloitte_deloitteportugal-consumo-retalho-activity-7452023278094934016-JDJt')],
    },
    'cs-ig': {
      title: 'ConsumerSignals', kind: 'Carousel', date: 'June 2024', role: COPY,
      hook: 'Os hábitos e preferências de consumo dos portugueses estão em constante evolução.',
      gloss: 'How people in Portugal shop, and what they prefer, keeps changing.',
      src: [ig('p', 'C74PXc_NvpG')],
    },
    banking: {
      title: 'Banking Insights Summit 2024', kind: 'Event film', date: 'May 2024', role: VIDEO,
      hook: '', gloss: 'Recap film from the first edition of the summit, “Exploring new pathways”.',
      src: [li('urn:li:ugcPost:7192115678047277056', 'deloitte_banking-insights-summit-2024-exploring-ugcPost-7192115678047277056-o8fc')],
    },
    health: {
      title: 'Global Healthcare Sector Outlook 2024', kind: 'Expert video', date: 'May 2024', role: VIDEO,
      hook: 'Em Portugal, como no resto do mundo, a adoção de Inteligência Artificial tem o potencial de revolucionar o setor da saúde.',
      gloss: 'In Portugal, as everywhere else, adopting AI has the potential to transform healthcare.',
      src: [li('urn:li:ugcPost:7195497964327378944', 'deloitte_global-healthcare-sector-outlook-2024-ugcPost-7195497964327378944-pG8t')],
    },
    cre: {
      title: '2026 Commercial Real Estate Outlook', kind: 'Carousel, 6 pages', date: 'November 2025', role: COPY,
      hook: 'Será que estamos a assistir a uma pausa momentânea na recuperação do mercado imobiliário comercial a nível global?',
      gloss: 'Are we seeing a momentary pause in the global commercial property recovery?',
      src: [li('urn:li:ugcPost:7391519700486365185', 'deloitte_2026-commercial-real-estate-outlook-ugcPost-7391519700486365185-Fo6N')],
    },
  };

  const viewer = $('#viewer');
  const covers = $$('[data-piece]').filter(a => PIECES[a.dataset.piece]);
  if (viewer && typeof viewer.showModal === 'function' && covers.length) {
    const order = covers.map(a => a.dataset.piece);
    const frame = $('#viewer-frame');
    const tabs = $('#viewer-src');
    const out = $('#viewer-link');
    const NAME = { ig: 'Instagram', li: 'LinkedIn' };
    let at = 0;

    const embed = s => s.p === 'ig' ? `https://www.instagram.com/${s.t}/${s.code}/embed/` : `https://www.linkedin.com/embed/feed/update/${s.urn}`;
    const link = s => s.p === 'ig' ? `https://www.instagram.com/${s.t}/${s.code}/` : s.url;
    const width = s => s.p === 'li' ? '31.5rem' : s.t === 'reel' ? '22.5rem' : '25rem';

    function show(piece, n) {
      const s = piece.src[n];
      frame.querySelector('iframe')?.remove();
      frame.style.setProperty('--fw', width(s));
      const f = document.createElement('iframe');
      f.src = embed(s);
      f.title = `${piece.title} on ${NAME[s.p]}`;
      f.allow = 'autoplay; encrypted-media; picture-in-picture; web-share';
      f.allowFullscreen = true;
      frame.append(f);
      out.href = link(s);
      $('#viewer-link-t').textContent = `Open on ${NAME[s.p]}`;
      $$('button', tabs).forEach((b, i) => b.setAttribute('aria-selected', i === n));
    }

    function open(i) {
      at = (i + order.length) % order.length;
      const piece = PIECES[order[at]];
      $('#viewer-kind').textContent = piece.kind;
      $('#viewer-title').textContent = piece.title;
      $('#viewer-hook').textContent = piece.hook;
      $('#viewer-gloss').textContent = piece.gloss;
      $('#viewer-role').textContent = piece.role;
      $('#viewer-date').textContent = piece.date;
      $('#viewer-count').textContent = `${String(at + 1).padStart(2, '0')} / ${order.length}`;
      tabs.hidden = piece.src.length < 2;
      tabs.replaceChildren(...piece.src.map((s, n) => {
        const b = document.createElement('button');
        b.type = 'button';
        b.textContent = NAME[s.p];
        b.addEventListener('click', () => show(piece, n));
        return b;
      }));
      show(piece, 0);
      if (!viewer.open) viewer.showModal();
      viewer.scrollTop = 0;
    }

    covers.forEach((a, i) => a.addEventListener('click', e => {
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.button) return; // let people open the original in a new tab
      e.preventDefault();
      open(i);
    }));
    $$('[data-viewer-step]').forEach(b => b.addEventListener('click', () => open(at + Number(b.dataset.viewerStep))));
    $('[data-viewer-close]').addEventListener('click', () => viewer.close());
    viewer.addEventListener('click', e => { if (e.target === viewer) viewer.close(); });
    viewer.addEventListener('keydown', e => {
      if (e.key === 'ArrowRight') open(at + 1);
      if (e.key === 'ArrowLeft') open(at - 1);
    });
    viewer.addEventListener('close', () => {
      frame.querySelector('iframe')?.remove(); // stops any playing video
      covers[at].focus({ preventScroll: true });
    });
  }
})();
