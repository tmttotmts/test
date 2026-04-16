/* =========================================================
  LP script.js template
  - 1 file, but organized by "sections"
  - No global pollution
  - Safe init timing
========================================================= */
'use strict';

/* =========================
0) Config / Selectors
========================= */
const CONFIG = {
headerShrinkOffset: 24,
smoothScrollOffset: 72,
scrollSpyOffset: 80,
};

const SELECTORS = {
header: '[data-header]',
hamburger: '[data-hamburger]',
nav: '[data-nav]',
navLink: '[data-nav-link]',
accordion: '[data-accordion]',
accordionTrigger: '[data-accordion-trigger]',
accordionPanel: '[data-accordion-panel]',
modal: '[data-modal]',
modalOpen: '[data-modal-open]',
modalClose: '[data-modal-close]',
form: '[data-form]',
lazyImg: 'img[data-src]',
};

/* =========================
1) Utilities (small helpers)
========================= */
const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));

const on = (el, event, handler, options) => el?.addEventListener(event, handler, options);
const clamp = (n, min, max) => Math.min(max, Math.max(min, n));

const prefersReducedMotion = () =>
window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches ?? false;

const isInPageLink = (a) => a?.getAttribute?.('href')?.startsWith('#');

const getScrollTop = () => window.pageYOffset || document.documentElement.scrollTop || 0;

const scrollToY = (y) => {
const top = Math.max(0, y);
window.scrollTo({
    top,
    behavior: prefersReducedMotion() ? 'auto' : 'smooth',
});
};

const safeFocus = (el) => {
if (!el) return;
el.setAttribute('tabindex', '-1');
el.focus({ preventScroll: true });
el.addEventListener('blur', () => el.removeAttribute('tabindex'), { once: true });
};

/* =========================
2) State
========================= */
const state = {
isNavOpen: false,
rafId: null,
};

/* =========================
3) DOM Cache
========================= */
const dom = {
header: null,
hamburger: null,
nav: null,
navLinks: [],
accordions: [],
modals: [],
form: null,
lazyImgs: [],
};

const cacheDom = () => {
dom.header = $(SELECTORS.header);
dom.hamburger = $(SELECTORS.hamburger);
dom.nav = $(SELECTORS.nav);
dom.navLinks = $$(SELECTORS.navLink);
dom.accordions = $$(SELECTORS.accordion);
dom.modals = $$(SELECTORS.modal);
dom.form = $(SELECTORS.form);
dom.lazyImgs = $$(SELECTORS.lazyImg);
};

/* =========================
4) Features
========================= */

// 4-1) Header shrink on scroll (optional)
const headerShrink = () => {
if (!dom.header) return;

const update = () => {
    const y = getScrollTop();
    dom.header.classList.toggle('is-shrink', y > CONFIG.headerShrinkOffset);
};

update();
on(window, 'scroll', () => {
    // rAF throttle (LP向けに軽量)
    if (state.rafId) return;
    state.rafId = requestAnimationFrame(() => {
    update();
    state.rafId = null;
    });
}, { passive: true });
};

// 4-2) Hamburger menu
const navMenu = () => {
if (!dom.hamburger || !dom.nav) return;

const open = () => {
    state.isNavOpen = true;
    dom.hamburger.setAttribute('aria-expanded', 'true');
    dom.nav.classList.add('is-open');
    document.documentElement.classList.add('is-nav-open');
};

const close = () => {
    state.isNavOpen = false;
    dom.hamburger.setAttribute('aria-expanded', 'false');
    dom.nav.classList.remove('is-open');
    document.documentElement.classList.remove('is-nav-open');
};

const toggle = () => (state.isNavOpen ? close() : open());

on(dom.hamburger, 'click', toggle);

// Close when clicking link
dom.navLinks.forEach((a) => {
    on(a, 'click', () => {
    if (state.isNavOpen) close();
    });
});

// Close on ESC
on(document, 'keydown', (e) => {
    if (e.key === 'Escape' && state.isNavOpen) close();
});
};

// 4-3) Smooth scroll for in-page anchors
const smoothScroll = () => {
on(document, 'click', (e) => {
    const a = e.target.closest('a');
    if (!a || !isInPageLink(a)) return;

    const id = a.getAttribute('href');
    const target = $(id);
    if (!target) return;

    e.preventDefault();

    const rect = target.getBoundingClientRect();
    const y = getScrollTop() + rect.top - CONFIG.smoothScrollOffset;
    scrollToY(y);

    // a11y: focus target after scroll
    setTimeout(() => safeFocus(target), prefersReducedMotion() ? 0 : 400);
});
};

// 4-4) Accordion
const accordion = () => {
if (dom.accordions.length === 0) return;

dom.accordions.forEach((root) => {
    const trigger = $(SELECTORS.accordionTrigger, root);
    const panel = $(SELECTORS.accordionPanel, root);
    if (!trigger || !panel) return;

    const setOpen = (open) => {
    trigger.setAttribute('aria-expanded', String(open));
    panel.hidden = !open;
    root.classList.toggle('is-open', open);
    };

    // initial (aria-expanded=trueなら開く)
    const initiallyOpen = trigger.getAttribute('aria-expanded') === 'true';
    setOpen(initiallyOpen);

    on(trigger, 'click', () => {
    const isOpen = trigger.getAttribute('aria-expanded') === 'true';
    setOpen(!isOpen);
    });
});
};

// 4-5) Modal (optional)
const modal = () => {
if (dom.modals.length === 0) return;

const openModal = (modalEl) => {
    modalEl.classList.add('is-open');
    modalEl.setAttribute('aria-hidden', 'false');
    document.documentElement.classList.add('is-modal-open');
    const focusTarget = $(SELECTORS.modalClose, modalEl) || modalEl;
    safeFocus(focusTarget);
};

const closeModal = (modalEl) => {
    modalEl.classList.remove('is-open');
    modalEl.setAttribute('aria-hidden', 'true');
    document.documentElement.classList.remove('is-modal-open');
};

// open
$$(SELECTORS.modalOpen).forEach((btn) => {
    on(btn, 'click', () => {
    const id = btn.getAttribute('data-modal-open');
    const modalEl = $(`[data-modal="${id}"]`);
    if (modalEl) openModal(modalEl);
    });
});

// close (btn or backdrop)
dom.modals.forEach((modalEl) => {
    on(modalEl, 'click', (e) => {
    const isCloseBtn = e.target.closest(SELECTORS.modalClose);
    const isBackdrop = e.target === modalEl;
    if (isCloseBtn || isBackdrop) closeModal(modalEl);
    });

    on(document, 'keydown', (e) => {
    if (e.key === 'Escape' && modalEl.classList.contains('is-open')) closeModal(modalEl);
    });
});
};

// 4-6) Lazy load images (data-src)
const lazyLoadImages = () => {
if (dom.lazyImgs.length === 0) return;

// IntersectionObserver対応があればそれを使う
if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const img = entry.target;
        img.src = img.dataset.src;
        img.removeAttribute('data-src');
        observer.unobserve(img);
    });
    }, { rootMargin: '200px 0px' });

    dom.lazyImgs.forEach((img) => io.observe(img));
    return;
}

// フォールバック: 即時読み込み
dom.lazyImgs.forEach((img) => {
    img.src = img.dataset.src;
    img.removeAttribute('data-src');
});
};

// 4-7) Form (simple validation / submit hook)
const form = () => {
if (!dom.form) return;

on(dom.form, 'submit', (e) => {
    // 例: 必須チェック（HTMLのrequiredと併用）
    const requiredEls = $$('[required]', dom.form);
    const invalid = requiredEls.find((el) => !el.value?.trim());

    if (invalid) {
    e.preventDefault();
    invalid.focus();
    return;
    }

    // ここに計測や送信前処理を書く（例: dataLayer, GA, etc）
    // console.log('submit');
});
};

// 4-8) Hero heading: split text only (triggered by scrollEffect via .is-effect)
const heroHeadingAnim = () => {
  const root = $('[data-hero-heading]');
  if (!root) return;

  const splitText = (el) => {
    if (!el || el.dataset.splitted === 'true') return;

    const text = el.textContent ?? '';
    el.textContent = '';

    const frag = document.createDocumentFragment();
    Array.from(text).forEach((ch, i) => {
      // 半角スペースも崩れないように
      if (ch === ' ') {
        frag.appendChild(document.createTextNode('\u00A0'));
        return;
      }
      const span = document.createElement('span');
      span.className = 'char';
      span.style.setProperty('--i', String(i));
      span.textContent = ch;
      frag.appendChild(span);
    });

    el.appendChild(frag);
    el.dataset.splitted = 'true';
  };

  $$('.heading-text[data-split]', root).forEach(splitText);
};


// 4-9) Scroll effect: add .is-effect when in view
const scrollEffect = () => {
  const targets = $$('[data-effect]');
  if (targets.length === 0) return;

  // 動き減らす設定なら即付与（チラつき防止）
  if (prefersReducedMotion()) {
    targets.forEach((el) => el.classList.add('is-effect'));
    return;
  }

  // IntersectionObserverが使えるならそれで
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add('is-effect');
          observer.unobserve(entry.target); // 1回だけ発火（必要なら外してOK）
        });
      },
      {
        root: null,
        threshold: 0.15,
        rootMargin: '0px 0px -10% 0px', // 少し早めに付与したい時の調整
      }
    );

    targets.forEach((el) => io.observe(el));
    return;
  }

  // フォールバック（IntersectionObserverなし）
  const onScroll = () => {
    const vh = window.innerHeight || document.documentElement.clientHeight;
    targets.forEach((el) => {
      if (el.classList.contains('is-effect')) return;
      const rect = el.getBoundingClientRect();
      const inView = rect.top < vh * 0.9 && rect.bottom > 0;
      if (inView) el.classList.add('is-effect');
    });
  };

  onScroll();
  on(window, 'scroll', onScroll, { passive: true });
  on(window, 'resize', onScroll);
};

/* =========================
5) Init
========================= */
const init = () => {
cacheDom();

// Features (必要なものだけ有効化)
headerShrink();
navMenu();
smoothScroll();
accordion();
modal();
lazyLoadImages();
form();
heroHeadingAnim();
scrollEffect();
};

// DOM ready
if (document.readyState === 'loading') {
document.addEventListener('DOMContentLoaded', init, { once: true });
} else {
init();
}
