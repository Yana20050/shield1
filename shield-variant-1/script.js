// Shiny sweeping-border effect on CTA buttons
if (window.ShinyButton) {
  window.ShinyButton.initShinyButtons('.btn');
}

// Logo — scroll to the very top (header is sticky, so #top alone won't move the page)
document.querySelectorAll('.logo--home').forEach(logo => {
  logo.addEventListener('click', (e) => {
    e.preventDefault();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
});

// Mobile nav toggle
const navToggle = document.getElementById('navToggle');
const mainNav = document.getElementById('mainNav');
if (navToggle && mainNav) {
  navToggle.addEventListener('click', () => {
    mainNav.classList.toggle('is-open');
  });
  mainNav.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => mainNav.classList.remove('is-open'));
  });
}

// Accordions (services list + FAQ)
function setupAccordion(container, opts = {}) {
  if (!container) return;
  const items = Array.from(container.querySelectorAll('.accordion-item'));

  function sizeOpenPanel(item) {
    const panel = item.querySelector('.accordion-panel');
    panel.style.maxHeight = panel.scrollHeight + 'px';
  }

  items.forEach(item => {
    const trigger = item.querySelector('.accordion-trigger');
    const panel = item.querySelector('.accordion-panel');
    if (item.classList.contains('is-open')) {
      sizeOpenPanel(item);
    }
    trigger.addEventListener('click', () => {
      const isOpen = item.classList.contains('is-open');
      if (opts.singleOpen) {
        items.forEach(other => {
          if (other !== item) {
            other.classList.remove('is-open');
            other.querySelector('.accordion-panel').style.maxHeight = null;
          }
        });
      }
      if (isOpen) {
        item.classList.remove('is-open');
        panel.style.maxHeight = null;
      } else {
        item.classList.add('is-open');
        sizeOpenPanel(item);
      }
    });
  });

  window.addEventListener('resize', () => {
    items.forEach(item => {
      if (item.classList.contains('is-open')) sizeOpenPanel(item);
    });
  });
}

setupAccordion(document.getElementById('servicesAccordion'), { singleOpen: true });
setupAccordion(document.getElementById('faqAccordion'), { singleOpen: true });

// Consultation direction pills
const pillGroup = document.getElementById('pillGroup');
const directionInput = document.getElementById('directionInput');
if (pillGroup) {
  pillGroup.querySelectorAll('.pill').forEach(pill => {
    pill.addEventListener('click', () => {
      pillGroup.querySelectorAll('.pill').forEach(p => p.classList.remove('is-active'));
      pill.classList.add('is-active');
      directionInput.value = pill.dataset.value;
    });
  });
}

// Consultation form submit
const consultationForm = document.getElementById('consultationForm');
const formSuccess = document.getElementById('formSuccess');
if (consultationForm) {
  consultationForm.addEventListener('submit', (e) => {
    e.preventDefault();
    consultationForm.reset();
    pillGroup.querySelectorAll('.pill').forEach(p => p.classList.remove('is-active'));
    pillGroup.querySelector('.pill').classList.add('is-active');
    directionInput.value = pillGroup.querySelector('.pill').dataset.value;
    formSuccess.classList.add('is-visible');
  });
}

// AJAX equipment kit builder — 3-step wizard: premise type -> parameters -> generated kit
(function () {
  const V = '20261002a';

  const PREMISE_TYPES = [
    { id: 'apartment', label: 'Квартира', icon: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none"><rect x="4" y="3" width="16" height="18" rx="1" stroke="currentColor" stroke-width="1.6"/><path d="M8 7h2M14 7h2M8 11h2M14 11h2M8 15h2M14 15h2" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>' },
    { id: 'house', label: 'Будинок', icon: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M4 11 12 4l8 7" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/><path d="M6 10v9a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1v-9" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/><path d="M10 20v-5h4v5" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/></svg>' },
    { id: 'office', label: 'Офіс', icon: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none"><rect x="7" y="3" width="10" height="18" rx="1" stroke="currentColor" stroke-width="1.6"/><path d="M10 7h1M13 7h1M10 11h1M13 11h1M10 15h1M13 15h1" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>' },
    { id: 'business', label: "Бізнес (магазин, склад, кафе тощо)", icon: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M4 9V6l1.5-2h13L20 6v3" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/><path d="M4 9h16v10a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V9Z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/><path d="M9 20v-5h6v5" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/></svg>' },
  ];

  const PARAMS = [
    { key: 'rooms', label: "Кімнати, зокрема кухня", hint: 'Безпеку й автоматизацію в кожній кімнаті гарантують пристрої різного призначення', icon: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M3 3v18M3 3h13l5 5v13" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/><path d="M3 14h8v7H3z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/></svg>', min: 1, def: 1 },
    { key: 'entries', label: 'Входи', hint: 'Кожен вхід у приміщення має бути захищений', icon: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M6 3v18l11-3V6L6 3Z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/><circle cx="9.3" cy="12" r=".9" fill="currentColor"/></svg>', min: 1, def: 1 },
    { key: 'windows', label: 'Вікна', hint: 'Кожне вікно, до якого можна дістатися на вулиці, має бути захищене', icon: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none"><rect x="4" y="4" width="16" height="16" stroke="currentColor" stroke-width="1.6"/><path d="M12 4v16M4 12h16" stroke="currentColor" stroke-width="1.6"/></svg>', min: 0, def: 1 },
  ];

  // Base kit generated automatically from the parameters
  const BASE_CATALOG = [
    { id: 'hub', name: 'Hub 2 (2G) Jeweller', desc: 'Бездротова централь з підтримкою фотоверифікації. Працює з Ethernet та двома SIM-картами (2G)', img: 'media/ajax-products/hub.webp', price: 8699, qty: () => 1 },
    { id: 'motion', name: 'MotionProtect Jeweller', desc: 'Бездротовий ІЧ датчик руху', img: 'media/ajax-products/motion.webp', price: 1799, qty: (p) => Math.max(1, p.rooms) },
    { id: 'door', name: 'DoorProtect Jeweller', desc: 'Бездротовий датчик відчинення з герконом', img: 'media/ajax-products/door.webp', price: 1329, qty: (p) => Math.max(1, p.entries) },
    { id: 'window', name: 'GlassProtect Jeweller', desc: 'Бездротовий датчик розбиття скла з мікрофоном', img: 'media/ajax-products/door.webp', price: 2179, qty: (p) => p.windows },
    { id: 'siren', name: 'HomeSiren Jeweller', desc: 'Бездротова сирена', img: 'media/ajax-products/siren.webp', price: 2179, qty: () => 1 },
    { id: 'keypad', name: 'KeyPad Jeweller', desc: 'Клавіатура керування режимами охорони', img: 'media/ajax-products/keypad.webp', price: 2419, qty: () => 1 },
  ];

  const ADDON_CATALOG = [
    { id: 'fire', name: 'FireProtect Jeweller', desc: 'Дим, температура, чадний газ', img: 'media/ajax-products/fire.webp', price: 2069 },
    { id: 'leak', name: 'LeaksProtect Jeweller', desc: 'Прорив труби, протікання техніки', img: 'media/ajax-products/leak.webp', price: 1379 },
    { id: 'button', name: 'Button Jeweller', desc: "Тривожна кнопка виклику допомоги", img: 'media/ajax-products/button.webp', price: 859 },
    { id: 'socket', name: 'Socket', desc: 'Розумна розетка для автоматизації сценаріїв', img: 'media/ajax-products/socket.webp', price: 1209 },
    { id: 'rex', name: 'ReX 2 Jeweller', desc: 'Підсилювач покриття радіомережі', img: 'media/ajax-products/rex.webp', price: 3449 },
  ];

  const ajaxPicker = document.getElementById('ajaxPicker');
  if (!ajaxPicker) return;

  const ajaxPickerOpen = document.getElementById('ajaxPickerOpen');
  const ajaxPickerClose = document.getElementById('ajaxPickerClose');
  const ajaxPickerBackdrop = document.getElementById('ajaxPickerBackdrop');
  const ajaxPickerContact = document.getElementById('ajaxPickerContact');
  const typeList = document.getElementById('ajaxTypeList');
  const paramList = document.getElementById('ajaxParamList');
  const kitList = document.getElementById('ajaxPickerList');
  const addonList = document.getElementById('ajaxAddonList');
  const addonToggle = document.getElementById('ajaxAddToggle');
  const stepsNav = document.getElementById('ajaxPickerSteps');
  const backBtn = document.getElementById('ajaxPickerBack');
  const nextBtn = document.getElementById('ajaxPickerNext');
  const footer = document.getElementById('ajaxPickerFooter');
  const totalEl = document.getElementById('ajaxPickerTotal');
  const screens = ajaxPicker.querySelectorAll('.ajax-picker-screen');

  const state = {
    step: 1,
    premise: null,
    params: { rooms: 1, entries: 1, windows: 1 },
    kit: {}, // id -> qty, populated when entering step 3
    generated: false,
  };

  function formatUAH(n) {
    return n.toLocaleString('uk-UA') + ' грн';
  }

  // ---------- Step 1: premise type ----------
  PREMISE_TYPES.forEach((type) => {
    const row = document.createElement('button');
    row.type = 'button';
    row.className = 'ajax-type-item';
    row.dataset.id = type.id;
    row.innerHTML = `
      <span class="ajax-type-radio" aria-hidden="true"></span>
      <span class="ajax-type-icon">${type.icon}</span>
      <span class="ajax-type-label">${type.label}</span>
    `;
    row.addEventListener('click', () => {
      state.premise = type.id;
      typeList.querySelectorAll('.ajax-type-item').forEach((el) => el.classList.remove('is-active'));
      row.classList.add('is-active');
      nextBtn.disabled = false;
    });
    typeList.appendChild(row);
  });

  // ---------- Step 2: parameters ----------
  PARAMS.forEach((param) => {
    state.params[param.key] = param.def;
    const row = document.createElement('div');
    row.className = 'ajax-param-item';
    row.innerHTML = `
      <span class="ajax-param-icon">${param.icon}</span>
      <div class="ajax-param-info">
        <h4>${param.label}</h4>
        <span>${param.hint}</span>
      </div>
      <div class="ajax-picker-stepper">
        <button type="button" data-action="minus" aria-label="Менше">−</button>
        <input type="text" inputmode="numeric" value="${param.def}" readonly>
        <button type="button" data-action="plus" aria-label="Більше">+</button>
      </div>
    `;
    const input = row.querySelector('input');
    row.querySelector('[data-action="minus"]').addEventListener('click', () => {
      state.params[param.key] = Math.max(param.min, state.params[param.key] - 1);
      input.value = state.params[param.key];
    });
    row.querySelector('[data-action="plus"]').addEventListener('click', () => {
      state.params[param.key] = Math.min(30, state.params[param.key] + 1);
      input.value = state.params[param.key];
    });
    paramList.appendChild(row);
  });

  // ---------- Step 3: generated kit ----------
  function renderTotal() {
    let total = 0;
    BASE_CATALOG.forEach((p) => { total += p.price * (state.kit[p.id] || 0); });
    ADDON_CATALOG.forEach((p) => { total += p.price * (state.kit[p.id] || 0); });
    totalEl.textContent = formatUAH(total);
  }

  function buildRow(product, qty) {
    const row = document.createElement('div');
    row.className = 'ajax-picker-item';
    row.dataset.id = product.id;
    row.innerHTML = `
      <img class="ajax-picker-item-thumb" src="${product.img}?v=${V}" alt="" aria-hidden="true">
      <div class="ajax-picker-item-info">
        <h4>${product.name}</h4>
        <span>${product.desc}</span>
      </div>
      <div class="ajax-picker-stepper">
        <button type="button" data-action="minus" aria-label="Менше">−</button>
        <input type="text" inputmode="numeric" value="${qty}" readonly>
        <button type="button" data-action="plus" aria-label="Більше">+</button>
      </div>
      <div class="ajax-picker-item-price">
        <b>${formatUAH(product.price * qty)}</b>
      </div>
      <button type="button" class="ajax-picker-item-remove" aria-label="Видалити">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2m2 0-1 13a1 1 0 0 1-1 1H8a1 1 0 0 1-1-1L6 7" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>
      </button>
    `;
    const input = row.querySelector('input');
    const priceB = row.querySelector('.ajax-picker-item-price b');
    function sync() {
      input.value = state.kit[product.id];
      priceB.textContent = formatUAH(product.price * state.kit[product.id]);
      renderTotal();
    }
    row.querySelector('[data-action="minus"]').addEventListener('click', () => {
      state.kit[product.id] = Math.max(0, (state.kit[product.id] || 0) - 1);
      sync();
    });
    row.querySelector('[data-action="plus"]').addEventListener('click', () => {
      state.kit[product.id] = Math.min(50, (state.kit[product.id] || 0) + 1);
      sync();
    });
    row.querySelector('.ajax-picker-item-remove').addEventListener('click', () => {
      delete state.kit[product.id];
      row.remove();
      renderTotal();
    });
    return row;
  }

  function generateKit() {
    kitList.innerHTML = '';
    BASE_CATALOG.forEach((product) => {
      const qty = product.qty(state.params);
      if (qty <= 0) return;
      state.kit[product.id] = qty;
      kitList.appendChild(buildRow(product, qty));
    });
    renderTotal();
    state.generated = true;
  }

  addonList.innerHTML = '';
  ADDON_CATALOG.forEach((product) => {
    const row = document.createElement('button');
    row.type = 'button';
    row.className = 'ajax-addon-item';
    row.innerHTML = `
      <img src="${product.img}?v=${V}" alt="" aria-hidden="true">
      <span class="ajax-addon-info"><b>${product.name}</b><em>${formatUAH(product.price)}</em></span>
      <span class="ajax-addon-plus">+</span>
    `;
    row.addEventListener('click', () => {
      if (kitList.querySelector(`[data-id="${product.id}"]`)) return;
      state.kit[product.id] = 1;
      kitList.appendChild(buildRow(product, 1));
      renderTotal();
    });
    addonList.appendChild(row);
  });
  if (addonToggle) {
    addonToggle.addEventListener('click', () => {
      const hidden = addonList.hasAttribute('hidden');
      if (hidden) addonList.removeAttribute('hidden'); else addonList.setAttribute('hidden', '');
      addonToggle.textContent = hidden ? '− Сховати список' : '+ Додати ще пристрій';
    });
  }

  // ---------- Wizard navigation ----------
  function showStep(n) {
    state.step = n;
    screens.forEach((s) => s.classList.toggle('is-active', Number(s.dataset.screen) === n));
    stepsNav.querySelectorAll('.ajax-picker-step').forEach((s) => s.classList.toggle('is-active', Number(s.dataset.step) === n));
    backBtn.hidden = n === 1;
    nextBtn.hidden = n === 3;
    footer.hidden = n !== 3;
    if (n === 1) nextBtn.disabled = !state.premise;
    if (n === 3 && !state.generated) generateKit();
  }

  nextBtn.addEventListener('click', () => {
    if (state.step === 1 && !state.premise) return;
    if (state.step < 3) showStep(state.step + 1);
  });
  backBtn.addEventListener('click', () => {
    if (state.step > 1) showStep(state.step - 1);
  });

  // ---------- Open / close ----------
  function openPicker() {
    ajaxPicker.classList.add('is-open');
    ajaxPicker.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    state.step = 1;
    state.generated = false;
    showStep(1);
  }
  function closePicker() {
    ajaxPicker.classList.remove('is-open');
    ajaxPicker.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  if (ajaxPickerOpen) ajaxPickerOpen.addEventListener('click', openPicker);
  if (ajaxPickerClose) ajaxPickerClose.addEventListener('click', closePicker);
  if (ajaxPickerBackdrop) ajaxPickerBackdrop.addEventListener('click', closePicker);
  if (ajaxPickerContact) ajaxPickerContact.addEventListener('click', closePicker);
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && ajaxPicker.classList.contains('is-open')) closePicker();
  });

  var servicesBgVideo = document.querySelector('.services-bg-video');
  if (servicesBgVideo) {
    servicesBgVideo.addEventListener('loadedmetadata', function () {
      servicesBgVideo.playbackRate = 1.6;
    });
    servicesBgVideo.playbackRate = 1.6;
  }

  // Auto-scrolling horizontal carousel (mobile only): slowly drifts sideways
  // on its own, pauses while the user is touching/scrolling it, loops back
  // to the start once it reaches the end.
  function autoScrollCarousel(selector, speed) {
    var el = document.querySelector(selector);
    if (!el) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    if (!window.matchMedia('(max-width: 768px)').matches) return;

    var paused = false;
    var resumeTimer;
    ['touchstart', 'mousedown', 'wheel'].forEach(function (evt) {
      el.addEventListener(evt, function () {
        paused = true;
        clearTimeout(resumeTimer);
        resumeTimer = setTimeout(function () { paused = false; }, 3500);
      }, { passive: true });
    });

    function step() {
      if (!paused) {
        el.scrollLeft += speed;
        if (el.scrollLeft + el.clientWidth >= el.scrollWidth - 1) {
          el.scrollLeft = 0;
        }
      }
      requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  autoScrollCarousel('.reviews-grid', 0.9);
  autoScrollCarousel('.service-grid', 0.9);

  // Arrow buttons for the services carousel (mobile only)
  (function () {
    var grid = document.querySelector('.service-grid');
    if (!grid || !window.matchMedia('(max-width: 768px)').matches) return;
    var wrap = document.createElement('div');
    wrap.className = 'carousel-wrap';
    grid.parentNode.insertBefore(wrap, grid);
    wrap.appendChild(grid);
    function mk(dir) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'carousel-arrow carousel-arrow--' + (dir < 0 ? 'prev' : 'next');
      b.setAttribute('aria-label', dir < 0 ? 'Назад' : 'Вперед');
      b.innerHTML = '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="' + (dir < 0 ? 'M15 5l-7 7 7 7' : 'M9 5l7 7-7 7') + '"/></svg>';
      b.addEventListener('click', function () {
        grid.dispatchEvent(new Event('touchstart'));
        var card = grid.querySelector('.service-card');
        var step = card ? card.getBoundingClientRect().width + 14 : 232;
        grid.scrollBy({ left: dir * step, behavior: 'smooth' });
      });
      wrap.appendChild(b);
    }
    mk(-1);
    mk(1);
  })();
})();
