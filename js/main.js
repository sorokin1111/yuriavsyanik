/* ============================================================
   Юрий Авсянник — лендинг-воронка
   Модальные окна · Формы с UTM · Аналитика · Webhook
   ============================================================ */
(function () {
  'use strict';

  /* ======== КОНФИГУРАЦИЯ ========
     Впишите свои значения перед деплоем. */
  var CONFIG = {
    webhookUrl: '/api/telegram', // Эндпоинт приёма заявок. Telegram-бот шлёт в env TELEGRAM_CHAT_ID
    paymentUrl: {
      audit: '',           // ссылка на оплату Auditu (если есть)
      capital: '',         // ссылка на оплату «Капитал Роста»
      premium: ''          // ссылка на оплату «Личное сопровождение»
    },
    analytics: {
      metaPixelId: '',     // Meta Pixel ID, напр. '1234567890'
      ga4Id: '',           // GA4 Measurement ID, напр. 'G-XXXXXXXXXX'
      yandexCounterId: ''  // Яндекс.Метрика счётчик, напр. 98765432
    }
  };
  window.LANDING_CONFIG = CONFIG;

  var $ = function (sel, ctx) { return (ctx || document).querySelector(sel); };
  var $$ = function (sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); };

  /* ======== Путь страницы ======== */
  function pagePath() {
    return location.pathname + location.search;
  }

  /* ======== UTM ======== */
  function getUTMParams() {
    var params = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'];
    var out = {};
    params.forEach(function (k) {
      var v = new URLSearchParams(location.search).get(k);
      if (v) out[k] = v;
    });
    return out;
  }

  /* ======== Аналитика ======== */

  function loadMetaPixel() {
    var id = CONFIG.analytics.metaPixelId;
    if (!id || window.metaPixelLoaded) return;
    window.metaPixelLoaded = true;
    !function (f, b, e, v, n, t, s) {
      if (f.fbq) return; n = f.fbq = function () {
        n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
      };
      if (!f._fbq) f._fbq = n; n.push = n; n.loaded = !0; n.version = '2.0';
      n.queue = []; t = b.createElement(e); t.async = !0;
      t.src = v; s = b.getElementsByTagName(e)[0]; s.parentNode.insertBefore(t, s);
    }(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');
    fbq('init', id);
    fbq('track', 'PageView');
  }

  function loadGA4() {
    var id = CONFIG.analytics.ga4Id;
    if (!id || window.ga4Loaded) return;
    window.ga4Loaded = true;
    window.dataLayer = window.dataLayer || [];
    function gtag() { dataLayer.push(arguments); }
    gtag('js', new Date());
    gtag('config', id);
    var s = document.createElement('script');
    s.async = true;
    s.src = 'https://www.googletagmanager.com/gtag/js?id=' + id;
    document.head.appendChild(s);
  }

  function loadYandexMetrica() {
    var id = CONFIG.analytics.yandexCounterId;
    if (!id || window.ymLoaded) return;
    window.ymLoaded = true;
    (function (m, e, t, r, i, k, a) {
      m[i] = m[i] || function () { (m[i].a = m[i].a || []).push(arguments); };
      m[i].l = 1 * new Date();
      k = e.createElement(t); a = e.getElementsByTagName(t)[0]; k.async = 1;
      k.src = r; a.parentNode.insertBefore(k, a);
    })(window, document, 'script', 'https://mc.yandex.ru/metrika/tag.js', 'ym');
    ym(id, 'init', { clickmap: true, trackLinks: true, accurateTrackBounce: true });
  }

  function track(event, params) {
    params = params || {};
    if (CONFIG.analytics.metaPixelId && window.fbq) fbq('trackCustom', event, params);
    if (CONFIG.analytics.yandexCounterId && window.ym) ym(CONFIG.analytics.yandexCounterId, 'reachGoal', event, params);
    if (CONFIG.analytics.ga4Id && window.gtag) {
      gtag('event', event, { page_path: pagePath(), ...params });
    }
  }
  function trackLead(params) {
    params = params || {};
    if (window.fbq) fbq('track', 'Lead', params);
    if (CONFIG.analytics.yandexCounterId && window.ym) ym(CONFIG.analytics.yandexCounterId, 'reachGoal', 'lead');
  }

  function loadAnalytics() {
    loadMetaPixel();
    loadGA4();
    loadYandexMetrica();
  }
  if (window.requestIdleCallback) {
    requestIdleCallback(loadAnalytics, { timeout: 2500 });
  } else {
    setTimeout(loadAnalytics, 1200);
  }

  /* ======== Toast ======== */
  var toastEl = $('[data-toast]');
  var toastTimer = null;
  function toast(msg) {
    toastEl.textContent = msg;
    toastEl.hidden = false;
    requestAnimationFrame(function () { toastEl.classList.add('show'); });
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () {
      toastEl.classList.remove('show');
      setTimeout(function () { toastEl.hidden = true; }, 350);
    }, 4200);
  }

  /* ======== Header / mobile menu ======== */
  var burger = $('[data-burger]');
  var mobileMenu = $('[data-mobile-menu]');
  if (burger) {
    burger.addEventListener('click', function () {
      var open = mobileMenu.classList.toggle('open');
      burger.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    $$('a', mobileMenu).forEach(function (a) {
      a.addEventListener('click', function () {
        mobileMenu.classList.remove('open');
        burger.setAttribute('aria-expanded', 'false');
      });
    });
  }

  /* Header тень при скролле */
  var header = $('[data-header]');
  if (header) {
    var onScroll = function () {
      header.classList.toggle('is-scrolled', window.scrollY > 8);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  /* ======== Reveal on scroll ======== */
  var revealEls = $$('.reveal');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var el = entry.target;
        var delay = parseInt(el.getAttribute('data-reveal-delay') || '0', 10);
        setTimeout(function () { el.classList.add('is-visible'); }, delay);
        io.unobserve(el);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add('is-visible'); });
  }

  /* ======== Счётчики ======== */
  $$('[data-counter]').forEach(function (el) {
    var target = parseInt(el.textContent, 10) || parseInt(el.getAttribute('data-counter'), 10) || 0;
    if (!target || !el.getAttribute('data-counter')) return;
    var dur = 1400, start = null;
    var step = function (ts) {
      if (!start) start = ts;
      var p = Math.min((ts - start) / dur, 1);
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(eased * target);
      if (p < 1) requestAnimationFrame(step);
    };
    var obs = new IntersectionObserver(function (entries, ob) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { requestAnimationFrame(step); ob.unobserve(e.target); }
      });
    }, { threshold: 0.4 });
    obs.observe(el);
  });

  /* ======== FAQ ======== */
  $$('details.faq-item').forEach(function (d, i) {
    d.addEventListener('toggle', function () {
      /* закрываем остальные, чтобы работал accordion-режим */
      if (!d.open) return;
      $$('details.faq-item').forEach(function (other, j) {
        if (j !== i && other.open) other.open = false;
      });
    });
  });

  /* ======== Год в футере ======== */
  var yearEl = $('[data-year]');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ======== Модальные окна ======== */
  var modals = {};
  $$('[data-modal]').forEach(function (m) { modals[m.id] = m; });

  function openModal(id, focusSel) {
    var m = modals[id];
    if (!m) return;
    /* сброс шагов */
    resetModalSteps(m);
    m.classList.add('open');
    document.body.classList.add('no-scroll');
    track('modal_open', { modal: id, page_path: pagePath() });
    var focus = focusSel ? $(focusSel, m) : $('input, button, [href]', m);
    if (focus) {
      setTimeout(function () { (focus.focus ? focus : null) && focus.focus(); }, 60);
    }
  }
  function closeModal(m) {
    if (!m) return;
    m.classList.remove('open');
    if (!$$('.modal.open').length) document.body.classList.remove('no-scroll');
  }

  function resetModalSteps(m) {
    sending = false;
    $$('button[type="submit"], [data-submit]', m).forEach(function (b) { b.disabled = false; });
    $$('[data-form-step]', m).forEach(function (step) {
      var isFirst = step.getAttribute('data-form-step') === '1';
      step.hidden = !isFirst;
      if (isFirst) {
        $$('input[type="text"], input[type="tel"], input[type="url"], textarea', step).forEach(function (f) { f.value = ''; });
        $$('.field', step).forEach(function (f) { f.classList.remove('has-error'); });
      }
    });
    var success = $('[data-success]', m);
    if (success) success.hidden = true;
    var first = $('[data-form-step="1"]', m);
    if (first) first.hidden = false;
  }

  function showStep(m, num) {
    $$('[data-form-step]', m).forEach(function (s) { s.hidden = s.getAttribute('data-form-step') !== String(num); });
    track('fr_step', { modal: m.id, step: num });
  }
  function showSuccess(m) {
    $$('[data-form-step]', m).forEach(function (s) { s.hidden = true; });
    var ok = $('[data-success]', m);
    if (ok) ok.hidden = false;
  }

  /* Клики: открыть/закрыть */
  document.addEventListener('click', function (e) {
    var openBtn = e.target.closest('[data-open]');
    if (openBtn) {
      e.preventDefault();
      var id = openBtn.getAttribute('data-open');
      /* второй шаг Pop-up аудита открывается по первому шагу формы */
      openModal(id);
      return;
    }
    var closeEl = e.target.closest('[data-close]');
    if (closeEl) {
      closeModal(modals[closeEl.getAttribute('data-close')]);
      return;
    }
    var backBtn = e.target.closest('[data-back]');
    if (backBtn) {
      var modal = backBtn.closest('[data-modal]');
      if (modal) showStep(modal, parseInt(backBtn.getAttribute('data-back'), 10));
    }
    if (e.target.classList.contains('modal__backdrop')) closeModal(e.target.closest('[data-modal]'));
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      $$('.modal.open').forEach(closeModal);
    }
  });

  /* ======== Сбор данных формы ======== */
  function collectForm(form) {
    var data = {};
    var fd = new FormData(form);
    fd.forEach(function (v, k) { data[k] = v; });
    /* UTM-проброс в скрытые поля для webhook/CRM */
    var utm = getUTMParams();
    Object.keys(utm).forEach(function (k) { data[k] = utm[k]; });
    data.page = location.origin + pagePath();
    data.referrer = document.referrer || '';
    data.ts = new Date().toISOString();
    return data;
  }

  /* Сбор данных всей модалки (нужно для многошаговых форм:
     имя/контакт на шаге 1, описание/сумма на шаге 2) */
  function collectAll(modal) {
    var data = {};
    $$('input, textarea', modal).forEach(function (f) {
      if (f.name) data[f.name] = f.value;
    });
    var utm = getUTMParams();
    Object.keys(utm).forEach(function (k) { data[k] = utm[k]; });
    data.page = location.origin + pagePath();
    data.referrer = document.referrer || '';
    data.ts = new Date().toISOString();
    return data;
  }

  var sending = false;

  function sendLead(source, type) {
    if (sending) return;
    sending = true;

    var data = source.hasAttribute('data-modal') ? collectAll(source) : collectForm(source);
    var payload = JSON.stringify(data);

    track('initiate_checkout', { offer: data.offer, price: data.price, page_path: pagePath() });
    trackLead({ offer: data.offer, price: data.price, contact: data.contact ? 'yes' : 'no' });

    var modal = source.closest('[data-modal]');
    if (modal) $$('button[type="submit"], [data-submit]', modal).forEach(function (b) { b.disabled = true; });

    if (CONFIG.webhookUrl) {
      var controller = new AbortController();
      var timeout = setTimeout(function () { controller.abort(); }, 8000);
      fetch(CONFIG.webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: payload,
        signal: controller.signal,
        keepalive: true
      })
        .then(function (res) {
          clearTimeout(timeout);
          if (!res.ok) throw new Error('HTTP ' + res.status);
          finishLead(modal, data);
        })
        .catch(function (err) {
          clearTimeout(timeout);
          sending = false;
          if (modal) $$('button[type="submit"], [data-submit]', modal).forEach(function (b) { b.disabled = false; });
          if (modal) setFormError(modal, 'Не удалось отправить заявку. Повторите попытку или напишите в Telegram: @Deus_Tech');
          else toast('Не удалось отправить заявку. Повторите попытку или напишите в Telegram: @Deus_Tech');
        });
    } else {
      sending = false;
      if (modal) setFormError(modal, 'Не удалось отправить заявку. Повторите попытку или напишите в Telegram: @Deus_Tech');
      else toast('Не удалось отправить заявку. Повторите попытку или напишите в Telegram: @Deus_Tech');
    }

    return data;
  }

  function setFormError(modal, message) {
    var note = $('.modal__note', modal);
    if (note) {
      note.textContent = message;
      note.classList.add('modal__note--error');
    }
  }

  function finishLead(modal, data) {
    if (modal) showSuccess(modal);
    toast('Заявка отправлена! Свяжемся в ближайшие часы.');

    /* Если кнопка «оформления» ведёт напрямую на оплату — открываем ссылку */
    if (data.offer === 'capital-growth') {
      if (CONFIG.paymentUrl.capital) window.open(CONFIG.paymentUrl.capital, '_blank');
    } else if (data.offer === 'premium') {
      if (CONFIG.paymentUrl.premium) window.open(CONFIG.paymentUrl.premium, '_blank');
    } else {
      if (CONFIG.paymentUrl.audit) window.open(CONFIG.paymentUrl.audit, '_blank');
    }
  }

  /* ======== Валидация и сабмиты ======== */
  function setError(field, has) {
    var wrap = field.closest('.field');
    if (wrap) wrap.classList.toggle('has-error', has);
  }

  function validateField(field) {
    var v = (field.value || '').trim();
    var ok = true;
    if (field.required) {
      ok = v.length > 0;
    }
    if (ok && field.type === 'url' && v) {
      try { new URL(v); } catch (e) { ok = false; }
    }
    return ok;
  }

  function bindForm(form) {
    if (!form) return;
    $$('input, textarea', form).forEach(function (f) {
      f.addEventListener('input', function () { setError(f, false); });
    });
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var valid = true;
      $$('input, textarea', form).forEach(function (f) {
        var ok = validateField(f);
        setError(f, !ok);
        if (!ok) valid = false;
      });
      if (!valid) return;

      var modal = form.closest('[data-modal]');
      var offer = modal && modal.id === 'modal-capital' ? 'capital' : (modal && modal.id === 'modal-premium' ? 'premium' : 'audit');
      var stepNum = form.getAttribute('data-form-step');

      if (offer === 'capital' || offer === 'premium') {
        /* Капитал: шаг 1 → шаг 2; шаг 2 → отправка (собираем всю модалку: имя, контакт, описание, сумму) */
        if (stepNum === '2') {
          track('fr_step', { modal: modal.id, step: 2 });
          sendLead(modal, offer);
        } else {
          showStep(modal, 2);
        }
      } else {
        /* Аудит: форма → шаг оформления */
        var d = collectForm(form);
        if (CONFIG.paymentUrl.audit) {
          finishLead(modal, d);
          sendWebhookQuiet(d);
        } else {
          showStep(modal, 2);
        }
      }
    });
  }

  function sendWebhookQuiet(data) {
    if (!CONFIG.webhookUrl) return;
    try {
      navigator.sendBeacon(CONFIG.webhookUrl, new Blob([JSON.stringify(data)], { type: 'application/json' }));
    } catch (e) { /* noop */ }
  }

  /* Шаг 2 аудита: кнопка подтверждения заявки */
  var auditStep2 = document.querySelector('#modal-audit [data-submit="audit"]');
  if (auditStep2) {
    auditStep2.addEventListener('click', function () {
      var step1 = $('#modal-audit [data-form-step="1"]');
      sendLead(step1, 'audit');
    });
  }

  /* Подписка форм: шаги капитала, премиума и аудита */
  bindForm($('#modal-capital [data-form-step="1"]'));
  bindForm($('#modal-capital [data-form-step="2"]'));
  bindForm($('#modal-premium [data-form-step="1"]'));
  bindForm($('#modal-premium [data-form-step="2"]'));
  bindForm($('#modal-audit [data-form-step="1"]'));

  /* ======== data-track для CTA-кликов ======== */
  document.addEventListener('click', function (e) {
    var el = e.target.closest('[data-track]');
    if (el && !el.closest('[data-modal]')) {
      track('cta_click', { cta: el.getAttribute('data-track'), page_path: pagePath() });
    }
  });

  /* ======== Фото ======== */
  /* Основной портрет в hero — img/slide1.webp (альтернатива img/slide2.webp).
     Позиционирование лица настраивается через .portrait__img object-position в css/styles.css */
})();