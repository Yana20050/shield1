/* Premium scroll/entrance animations powered by GSAP + ScrollTrigger.
   Progressive enhancement: elements are visible by default in CSS, so if GSAP
   fails to load or prefers-reduced-motion is set, nothing is hidden — we simply
   skip animating and the page renders in its final state.

   Every tween clears its inline transform on completion (clearProps) so CSS
   :hover lift effects on the same elements (service-card, price-card, etc.)
   regain control instead of being permanently overridden by GSAP's inline style. */
(function () {
  "use strict";

  var reduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduced || typeof gsap === "undefined") return;

  gsap.registerPlugin(ScrollTrigger);
  gsap.config({ nullTargetWarn: false });

  var CLEAR = "transform";
  var isMobile = window.matchMedia("(max-width: 768px)").matches;

  // ---------- Hero parallax (subtle) ----------
  // Skipped on mobile: the hero is short there, so the moving video/logo
  // only adds visual noise right at the top of the page.
  var heroVideo = isMobile ? null : document.querySelector(".hero-video");
  var heroGlow = isMobile ? null : document.querySelector(".hero-glow");
  if (heroVideo) {
    gsap.to(heroVideo, {
      yPercent: 12,
      ease: "none",
      scrollTrigger: {
        trigger: ".hero",
        start: "top top",
        end: "bottom top",
        scrub: true,
      },
    });
  }
  if (heroGlow) {
    gsap.to(heroGlow, {
      yPercent: -18,
      ease: "none",
      scrollTrigger: {
        trigger: ".hero",
        start: "top top",
        end: "bottom top",
        scrub: true,
      },
    });
  }

  // ---------- Locations map parallax (mobile) ----------
  // Desktop fakes the "pinned map" look with background-attachment:fixed,
  // which mobile browsers don't honor — so on mobile we drive the same
  // reveal with a real scroll-linked transform instead.
  var locationsMapImg = document.querySelector(".locations-map-img");
  if (locationsMapImg && window.matchMedia("(max-width: 768px)").matches) {
    gsap.fromTo(
      locationsMapImg,
      { yPercent: -18 },
      {
        yPercent: 18,
        ease: "none",
        scrollTrigger: {
          trigger: ".locations-map",
          start: "top bottom",
          end: "bottom top",
          scrub: true,
        },
      }
    );
  }

  // ---------- Hero entrance ----------
  var heroStats = gsap.utils.toArray(".stat-card");
  if (heroStats.length) {
    gsap.from(heroStats, {
      y: 28,
      opacity: 0,
      duration: 0.9,
      ease: "power3.out",
      stagger: 0.12,
      delay: 0.15,
      clearProps: CLEAR,
    });
  }

  // ---------- Count-up for numeric stats (e.g. "702+", "1315+") ----------
  // Strict pattern: digits optionally followed by "+" only — skips "24/7", "4 роки", etc.
  document.querySelectorAll(".stat-num").forEach(function (el) {
    var match = el.textContent.trim().match(/^(\d+)(\+?)$/);
    if (!match) return;
    var target = parseInt(match[1], 10);
    if (isNaN(target)) return;
    var suffix = match[2] || "";
    var counter = { val: 0 };
    var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // After the count-up finishes the number keeps creeping up on its own,
    // one step at a time, at a slightly random pace.
    function keepTicking() {
      if (reduceMotion) return;
      var current = target;
      (function tick() {
        var wait = 3500 + Math.random() * 5500;
        setTimeout(function () {
          if (!document.hidden) {
            current += 1;
            el.textContent = current + suffix;
          }
          tick();
        }, wait);
      })();
    }

    el.style.fontVariantNumeric = "tabular-nums";
    gsap.to(counter, {
      val: target,
      duration: 3.4,
      ease: "power2.out",
      delay: 0.5,
      onUpdate: function () {
        el.textContent = Math.round(counter.val) + suffix;
      },
      onComplete: keepTicking,
    });
  });

  // ---------- Generic scroll reveal ----------
  function revealHeading(section) {
    var eyebrow = section.querySelector(".eyebrow");
    var title = section.querySelector(".section-title");
    var targets = [eyebrow, title].filter(Boolean);
    if (!targets.length) return;
    gsap.from(targets, {
      y: 24,
      opacity: 0,
      duration: 0.7,
      ease: "power3.out",
      stagger: 0.08,
      clearProps: CLEAR,
      scrollTrigger: {
        trigger: section,
        start: "top 82%",
        once: true,
      },
    });
  }

  function revealGrid(selector, opts) {
    var items = gsap.utils.toArray(selector);
    if (!items.length) return;

    var groups = new Map();
    items.forEach(function (el) {
      var trigger = el.closest("section") || el.parentElement;
      if (!groups.has(trigger)) groups.set(trigger, []);
      groups.get(trigger).push(el);
    });

    groups.forEach(function (els, trigger) {
      gsap.from(els, Object.assign({
        y: 26,
        opacity: 0,
        duration: 0.6,
        ease: "power3.out",
        stagger: 0.08,
        clearProps: CLEAR,
        scrollTrigger: {
          trigger: trigger,
          start: "top 80%",
          once: true,
        },
      }, opts || {}));
    });
  }

  document.querySelectorAll(".section").forEach(revealHeading);

  revealGrid(".service-card");
  revealGrid(".price-card", { y: 34, duration: 0.75, stagger: 0.1, scale: 0.97 });
  revealGrid(".logo-card", { duration: 0.4, stagger: 0.04, y: 16 });
  revealGrid(".review-card");
  revealGrid(".location-card");
  revealGrid(".accordion-item", { y: 14, duration: 0.5, stagger: 0.06 });

  // Horizon divider at the top of the process section: draws the glowing
  // curve and fades in the dark fill once the section scrolls into view.
  (function processHorizon() {
    var section = document.querySelector(".process");
    if (!section || !section.querySelector(".process-horizon")) return;
    ScrollTrigger.create({
      trigger: section,
      start: "top 85%",
      once: true,
      onEnter: function () { section.classList.add("is-inview"); },
    });
  })();


  // Process section — chain-reaction reveal: step 01's text appears first,
  // then a glowing dot + drawing line travel the curved connector to step
  // 02 — the instant the beam arrives, step 02's text appears. Repeats
  // through step 04. Plain text, no card backgrounds, so each step's
  // number/rule/heading/paragraph fade in together as one unit.
  (function processFlow() {
    var cards = gsap.utils.toArray(".process-card");
    var paths = gsap.utils.toArray(".process-flow-path");
    var dot = document.querySelector(".process-flow-dot");
    if (!cards.length) return;

    // Phone layout: one column, so the beam travels down a winding curved
    // line (not a straight rail) and each step appears the moment it arrives.
    if (window.matchMedia("(max-width: 768px)").matches) {
      var grid = document.querySelector(".process-grid");
      var centers = cards.map(function (c) { return c.offsetTop + 30; });
      var gridH = grid.offsetHeight;

      // Build a wavy vertical path shaped like the desktop connector's
      // smooth arch (endpoints aligned, a gentle bulge in between),
      // just rotated to vertical, with a smaller bend and flipped side.
      var railW = 32;
      var xBase = railW / 2;
      var bulgeAmt = 7;
      var d = "M" + xBase + "," + centers[0];
      for (var i = 0; i < centers.length - 1; i++) {
        var y0 = centers[i];
        var y1 = centers[i + 1];
        var bulgeX = i % 2 === 0 ? xBase + bulgeAmt : xBase - bulgeAmt;
        var c1y = y0 + (y1 - y0) / 3;
        var c2y = y0 + ((y1 - y0) * 2) / 3;
        d += " C" + bulgeX + "," + c1y + " " + bulgeX + "," + c2y + " " + xBase + "," + y1;
      }

      var svgNS = "http://www.w3.org/2000/svg";
      var svg = document.createElementNS(svgNS, "svg");
      svg.setAttribute("class", "process-rail-svg");
      svg.setAttribute("viewBox", "0 0 " + railW + " " + gridH);
      svg.setAttribute("preserveAspectRatio", "none");
      svg.setAttribute("fill", "none");

      var trackPath = document.createElementNS(svgNS, "path");
      trackPath.setAttribute("d", d);
      trackPath.setAttribute("class", "process-rail-track");
      svg.appendChild(trackPath);

      var litPath = document.createElementNS(svgNS, "path");
      litPath.setAttribute("d", d);
      litPath.setAttribute("class", "process-rail-lit");
      svg.appendChild(litPath);

      var rdot = document.createElementNS(svgNS, "circle");
      rdot.setAttribute("class", "process-rail-dot-svg");
      rdot.setAttribute("r", "5");
      rdot.setAttribute("cx", xBase);
      rdot.setAttribute("cy", centers[0]);
      rdot.setAttribute("opacity", "0");
      svg.appendChild(rdot);

      grid.appendChild(svg);

      var railLen = litPath.getTotalLength();
      litPath.style.strokeDasharray = railLen;
      litPath.style.strokeDashoffset = railLen;

      var mtl = gsap.timeline({ scrollTrigger: { trigger: grid, start: "top 80%", once: true } });
      function showCard(card, pos) {
        mtl.from(card.querySelectorAll(".process-num, .process-rule, h3, p"), {
          opacity: 0, y: 14, duration: 0.35, ease: "power2.out", stagger: 0.03, clearProps: CLEAR
        }, pos);
      }
      mtl.to(rdot, { attr: { opacity: 1 }, duration: 0.2 });
      showCard(cards[0], "<");
      cards.forEach(function (card, i) {
        var nextCard = cards[i + 1];
        if (!nextCard) return;
        var segStart = i === 0 ? 0 : (centers[i] / centers[centers.length - 1]) * railLen;
        var proxy = { t: 0 };
        mtl.to(proxy, {
          t: 1,
          duration: 0.45,
          ease: "power1.inOut",
          onUpdate: function () {
            var lenAtY = railLen * (centers[i] + (centers[i + 1] - centers[i]) * proxy.t) / centers[centers.length - 1];
            var pt = litPath.getPointAtLength(Math.min(lenAtY, railLen));
            rdot.setAttribute("cx", pt.x);
            rdot.setAttribute("cy", pt.y);
            litPath.style.strokeDashoffset = railLen - lenAtY;
          },
        }, ">");
        mtl.call(function () {
          nextCard.classList.add("process-card--hit");
          gsap.delayedCall(0.9, function () {
            nextCard.classList.remove("process-card--hit");
          });
        }, null, ">");
        showCard(nextCard, "<");
      });
      mtl.to(rdot, { attr: { opacity: 0 }, duration: 0.4 }, ">");
      return;
    }

    var lengths = paths.map(function (p) { return p.getTotalLength(); });

    // Hidden until the beam draws each segment in; once the dot arrives the
    // line fades from lit back to dark instead of staying on permanently.
    paths.forEach(function (p, i) {
      p.style.strokeDasharray = lengths[i];
      p.style.strokeDashoffset = lengths[i];
    });

    var tl = gsap.timeline({
      scrollTrigger: {
        trigger: ".process-grid",
        start: "top 75%",
        once: true,
      },
    });

    function revealCard(card, position) {
      var els = card.querySelectorAll(".process-num, .process-rule, h3, p");
      tl.from(els, {
        opacity: 0,
        y: 14,
        duration: 0.35,
        ease: "power2.out",
        stagger: 0.03,
        clearProps: CLEAR,
      }, position);
    }

    cards.forEach(function (card, i) {
      // First step just appears; the rest are revealed exactly when the
      // beam travelling toward them completes (see below).
      if (i === 0) revealCard(card, undefined);

      var path = paths[i];
      var len = lengths[i];
      var nextCard = cards[i + 1];
      if (path && dot) {
        var proxy = { t: 0 };
        tl.to(proxy, {
          t: 1,
          duration: 0.4,
          ease: "power1.inOut",
          onStart: function () {
            dot.setAttribute("opacity", "1");
          },
          onUpdate: function () {
            var pt = path.getPointAtLength(proxy.t * len);
            dot.setAttribute("cx", pt.x);
            dot.setAttribute("cy", pt.y);
            path.style.strokeDasharray = len;
            path.style.strokeDashoffset = String(len * (1 - proxy.t));
          },
          onComplete: function () {
            dot.setAttribute("opacity", "0");
            gsap.to(path, { opacity: 0, duration: 0.6, ease: "power2.in" });
            if (nextCard) {
              nextCard.classList.add("process-card--hit");
              gsap.delayedCall(0.9, function () {
                nextCard.classList.remove("process-card--hit");
              });
            }
          },
        });

        if (nextCard) revealCard(nextCard, ">");
      }
    });
  })();

  // AJAX banner
  var ajaxCard = document.querySelector(".ajax-card");
  if (ajaxCard) {
    gsap.from(ajaxCard, {
      y: 30,
      opacity: 0,
      duration: 0.8,
      ease: "power3.out",
      clearProps: CLEAR,
      scrollTrigger: {
        trigger: ajaxCard,
        start: "top 82%",
        once: true,
      },
    });
  }

  // AJAX media panel — gentle scale/fade reveal as the video comes into view.
  var ajaxMedia = document.querySelector(".ajax-media");
  if (ajaxMedia) {
    gsap.from(ajaxMedia, {
      scale: 0.94,
      opacity: 0,
      duration: 0.8,
      ease: "power3.out",
      clearProps: CLEAR,
      scrollTrigger: {
        trigger: ajaxMedia,
        start: "top 78%",
        once: true,
      },
    });
  }

  // Consultation form + text column
  var consultationText = document.querySelector(".consultation-text");
  var consultationForm = document.querySelector(".consultation-form");
  if (consultationText && consultationForm) {
    gsap.from(consultationText, {
      x: -24,
      opacity: 0,
      duration: 0.8,
      ease: "power3.out",
      clearProps: CLEAR,
      scrollTrigger: { trigger: consultationText, start: "top 80%", once: true },
    });
    gsap.from(consultationForm, {
      x: 24,
      opacity: 0,
      duration: 0.8,
      ease: "power3.out",
      clearProps: CLEAR,
      scrollTrigger: { trigger: consultationForm, start: "top 80%", once: true },
    });
  }

  // FAQ brand panel
  var faqBrand = document.querySelector(".faq-brand");
  if (faqBrand) {
    gsap.from(faqBrand, {
      x: -20,
      opacity: 0,
      duration: 0.7,
      ease: "power3.out",
      clearProps: CLEAR,
      scrollTrigger: { trigger: faqBrand, start: "top 82%", once: true },
    });
  }

})();
