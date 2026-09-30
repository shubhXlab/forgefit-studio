'use strict';
/**
 * ForgeFit Athletic Club — Core Client Interactions & Animations
 * Professional, high-performance vanilla JS (60fps, zero jitter, zero vibe-coded tropes)
 */
(function () {
  // 1. Executive Masthead Scroll Elevation
  var siteHeader = document.getElementById('siteHeader');
  if (siteHeader) {
    var onScroll = function () {
      if (window.scrollY > 20) {
        siteHeader.classList.add('scrolled');
      } else {
        siteHeader.classList.remove('scrolled');
      }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  // 2. Responsive Mobile Navigation Drawer
  var navToggle = document.getElementById('navToggle');
  var mainNav = document.getElementById('mainNav');
  if (navToggle && mainNav) {
    navToggle.addEventListener('click', function () {
      var isOpen = mainNav.classList.toggle('open');
      navToggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    });

    // Close when clicking outside
    document.addEventListener('click', function (e) {
      if (mainNav.classList.contains('open') && !mainNav.contains(e.target) && !navToggle.contains(e.target)) {
        mainNav.classList.remove('open');
        navToggle.setAttribute('aria-expanded', 'false');
      }
    });
  }

  // 3. Smooth Numeric Counter Animation (requestAnimationFrame + ease-out exponential)
  function animateCounter(el) {
    var rawTarget = el.getAttribute('data-counter');
    if (!rawTarget) return;
    var target = parseFloat(rawTarget);
    var decimals = el.getAttribute('data-decimals') ? parseInt(el.getAttribute('data-decimals'), 10) : 0;
    var prefix = el.getAttribute('data-prefix') || '';
    var suffix = el.getAttribute('data-suffix') || '';
    var duration = parseInt(el.getAttribute('data-duration'), 10) || 1600;
    var startTime = null;

    function easeOutExpo(t) {
      return t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
    }

    function step(timestamp) {
      if (!startTime) startTime = timestamp;
      var elapsed = timestamp - startTime;
      var progress = Math.min(elapsed / duration, 1);
      var current = target * easeOutExpo(progress);

      if (decimals > 0) {
        el.textContent = prefix + current.toFixed(decimals) + suffix;
      } else {
        el.textContent = prefix + Math.floor(current).toLocaleString('en-IN') + suffix;
      }

      if (progress < 1) {
        window.requestAnimationFrame(step);
      } else {
        if (decimals > 0) {
          el.textContent = prefix + target.toFixed(decimals) + suffix;
        } else {
          el.textContent = prefix + Math.floor(target).toLocaleString('en-IN') + suffix;
        }
      }
    }

    window.requestAnimationFrame(step);
  }

  // 4. Butter-Smooth Scroll Reveals (IntersectionObserver)
  if ('IntersectionObserver' in window) {
    var revealObserver = new IntersectionObserver(function (entries, observer) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          var target = entry.target;
          target.classList.add('is-visible');

          // Trigger any counters inside or on this element
          var counters = target.querySelectorAll('[data-counter]');
          counters.forEach(function (c) {
            if (!c.dataset.animated) {
              c.dataset.animated = 'true';
              animateCounter(c);
            }
          });

          if (target.hasAttribute('data-counter') && !target.dataset.animated) {
            target.dataset.animated = 'true';
            animateCounter(target);
          }

          observer.unobserve(target);
        }
      });
    }, {
      rootMargin: '0px 0px -40px 0px',
      threshold: 0.1
    });

    document.querySelectorAll('.reveal, .stagger-group, [data-counter]').forEach(function (el) {
      revealObserver.observe(el);
    });
  } else {
    // Fallback for older browsers
    document.querySelectorAll('.reveal, .stagger-group').forEach(function (el) {
      el.classList.add('is-visible');
    });
    document.querySelectorAll('[data-counter]').forEach(function (el) {
      var raw = el.getAttribute('data-counter');
      var prefix = el.getAttribute('data-prefix') || '';
      var suffix = el.getAttribute('data-suffix') || '';
      el.textContent = prefix + raw + suffix;
    });
  }

  // 5. Interactive FAQ Accordions (Smooth Animated Expand/Collapse)
  document.querySelectorAll('.faq-item').forEach(function (item) {
    var question = item.querySelector('.faq-question');
    if (question) {
      question.addEventListener('click', function () {
        var isActive = item.classList.contains('active');
        // Close siblings for clean accordion behavior
        var parentGroup = item.closest('.faq-list') || item.parentElement;
        if (parentGroup) {
          parentGroup.querySelectorAll('.faq-item.active').forEach(function (openItem) {
            if (openItem !== item) openItem.classList.remove('active');
          });
        }
        item.classList.toggle('active', !isActive);
      });
    }
  });

  // 6. Interactive Class Timetable Filters (Disciplined Transitions)
  var filterBar = document.getElementById('filterBar');
  var classGrid = document.getElementById('classGrid');
  if (filterBar && classGrid) {
    var filterBtns = filterBar.querySelectorAll('.filter-btn');
    var cards = classGrid.querySelectorAll('.card-class');

    filterBtns.forEach(function (btn) {
      btn.addEventListener('click', function () {
        filterBtns.forEach(function (b) {
          b.classList.remove('active');
          b.classList.add('btn-ghost');
        });
        btn.classList.add('active');
        btn.classList.remove('btn-ghost');

        var filter = btn.getAttribute('data-filter');
        cards.forEach(function (card) {
          var category = card.getAttribute('data-category');
          if (filter === 'all' || category === filter) {
            card.style.display = 'flex';
            card.style.opacity = '0';
            card.style.transform = 'translateY(12px)';
            setTimeout(function () {
              card.style.transition = 'opacity 0.4s cubic-bezier(0.16, 1, 0.3, 1), transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)';
              card.style.opacity = '1';
              card.style.transform = 'translateY(0)';
            }, 30);
          } else {
            card.style.display = 'none';
          }
        });
      });
    });
  }

  // 7. Flash Notification Dismissal with Smooth Fade
  document.querySelectorAll('.flash-close').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var el = btn.closest('.flash');
      if (el) {
        el.style.opacity = '0';
        el.style.transform = 'translateY(-8px)';
        el.style.transition = 'opacity 0.25s ease, transform 0.25s ease';
        setTimeout(function () { el.remove(); }, 260);
      }
    });
  });

  setTimeout(function () {
    document.querySelectorAll('.flash-success .flash').forEach(function (el) {
      el.style.opacity = '0';
      el.style.transform = 'translateY(-8px)';
      el.style.transition = 'opacity 0.35s ease, transform 0.35s ease';
      setTimeout(function () { el.remove(); }, 360);
    });
  }, 6000);

  // 8. Confirm prompts
  document.querySelectorAll('[data-confirm]').forEach(function (el) {
    el.addEventListener('click', function (e) {
      if (!window.confirm(el.getAttribute('data-confirm'))) e.preventDefault();
    });
  });

  // 9. Password Strength Meter
  var pw = document.getElementById('password');
  var meter = document.getElementById('pwMeter');
  if (pw && meter) {
    var bar = meter.querySelector('i');
    pw.addEventListener('input', function () {
      var v = pw.value, score = 0;
      if (v.length >= 10) score++;
      if (v.length >= 14) score++;
      if (/[a-z]/.test(v) && /[A-Z]/.test(v)) score++;
      if (/\d/.test(v)) score++;
      if (/[^a-zA-Z0-9]/.test(v)) score++;
      var pct = Math.min(100, (score / 5) * 100);
      bar.style.width = pct + '%';
      bar.style.background = pct < 40 ? '#ef4444' : pct < 75 ? '#f59e0b' : '#10b981';
    });
  }

  // 10. Copy-to-clipboard buttons
  document.querySelectorAll('[data-copy]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var text = btn.getAttribute('data-copy');
      if (navigator.clipboard) {
        navigator.clipboard.writeText(text).then(function () {
          var original = btn.textContent;
          btn.textContent = 'Copied';
          btn.style.borderColor = 'var(--volt)';
          setTimeout(function () {
            btn.textContent = original;
            btn.style.borderColor = '';
          }, 1600);
        });
      }
    });
  });

  // 11. Auto-format OTP fields
  document.querySelectorAll('input[name="code"]').forEach(function (input) {
    input.setAttribute('inputmode', 'numeric');
    input.setAttribute('autocomplete', 'one-time-code');
  });

  // 12. Quick Search Timetable Modal Overlay
  var searchBtn = document.getElementById('searchBtn');
  var searchModal = document.getElementById('searchModal');
  var searchCloseBtn = document.getElementById('searchCloseBtn');
  var searchInput = document.getElementById('searchInput');
  var searchResults = document.getElementById('searchResults');

  function openSearch() {
    if (!searchModal) return;
    searchModal.classList.add('active');
    searchModal.setAttribute('aria-hidden', 'false');
    if (searchInput) {
      setTimeout(function () { searchInput.focus(); }, 100);
    }
  }

  function closeSearch() {
    if (!searchModal) return;
    searchModal.classList.remove('active');
    searchModal.setAttribute('aria-hidden', 'true');
  }

  if (searchBtn) {
    searchBtn.addEventListener('click', openSearch);
  }

  if (searchCloseBtn) {
    searchCloseBtn.addEventListener('click', closeSearch);
  }

  if (searchModal) {
    searchModal.addEventListener('click', function (e) {
      if (e.target === searchModal) {
        closeSearch();
      }
    });
  }

  // Live filter results in search modal
  if (searchInput && searchResults) {
    searchInput.addEventListener('input', function () {
      var query = searchInput.value.toLowerCase().trim();
      var items = searchResults.querySelectorAll('.search-item');
      items.forEach(function (item) {
        var text = item.textContent.toLowerCase();
        if (!query || text.indexOf(query) !== -1) {
          item.style.display = 'block';
        } else {
          item.style.display = 'none';
        }
      });
    });
  }

  // 13. Video Showcase Modal (Native HTML5 Video Player)
  var openVideoBtn = document.getElementById('openVideoBtn');
  var videoModal = document.getElementById('videoModal');
  var videoCloseBtn = document.getElementById('videoCloseBtn');
  var videoPlayer = document.getElementById('videoPlayer');

  function openVideo() {
    if (!videoModal) return;
    videoModal.classList.add('active');
    videoModal.setAttribute('aria-hidden', 'false');
    if (videoPlayer) {
      videoPlayer.currentTime = 0;
      var playPromise = videoPlayer.play();
      if (playPromise !== undefined) {
        playPromise.catch(function () {
          // Browser prevented autoplay with audio; player remains ready for user interaction
        });
      }
    }
  }

  function closeVideo() {
    if (!videoModal) return;
    videoModal.classList.remove('active');
    videoModal.setAttribute('aria-hidden', 'true');
    if (videoPlayer) {
      videoPlayer.pause();
    }
  }

  if (openVideoBtn) {
    openVideoBtn.addEventListener('click', openVideo);
  }

  if (videoCloseBtn) {
    videoCloseBtn.addEventListener('click', closeVideo);
  }

  if (videoModal) {
    videoModal.addEventListener('click', function (e) {
      if (e.target === videoModal) {
        closeVideo();
      }
    });
  }

  // Global keydown for search shortcut and Escape
  window.addEventListener('keydown', function (e) {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      if (searchModal && searchModal.classList.contains('active')) {
        closeSearch();
      } else {
        openSearch();
      }
    } else if (e.key === 'Escape') {
      closeSearch();
      closeVideo();
    }
  });

  // 14. Hero Showcase Card Carousel (Studio Spaces)
  var prevSlide = document.getElementById('prevSlide');
  var nextSlide = document.getElementById('nextSlide');
  var showcaseImg = document.getElementById('showcaseImg');
  var showcaseCard = document.querySelector('.showcase-glass-card');

  if (showcaseImg && (prevSlide || nextSlide)) {
    var slides = [
      {
        img: '/img/turf-showcase.jpg',
        badge: 'LIVE SESSION • HYROX TURF',
        title: 'Studio 01 — Olympic Bay & Turf',
        desc: 'Rigs, kettlebells, sleds, rowers, concept2 and more. Engineered for real progress.',
        pills: ['Strength', 'Conditioning', 'Community']
      },
      {
        img: '/img/program-strength.jpg',
        badge: 'COACHED ROSTER • ELEIKO BAY',
        title: 'Studio 02 — Barbell & Power Racks',
        desc: 'Olympic lifting platforms, calibrated plates, and precision bar-speed coaching.',
        pills: ['Olympic Lifting', 'Hypertrophy', 'Biomechanics']
      },
      {
        img: '/img/program-recovery.jpg',
        badge: 'SANCTUARY • CONTRAST THERAPY',
        title: 'Sanctuary — Contrast Thermal Suite',
        desc: 'Finnish cedar saunas, 8°C cold plunge tubs, and Normatec lymphatic compression.',
        pills: ['Recovery', 'Cold Plunge', 'Infrared Sauna']
      },
      {
        img: '/img/program-conditioning.jpg',
        badge: 'ENDURANCE • METABOLIC ENGINES',
        title: 'Studio 03 — Hyrox Turf & Sled Track',
        desc: 'High-intensity conditioning, skierg sprint intervals, and functional athletic endurance.',
        pills: ['Hyrox', 'Sprint Track', 'High Intensity']
      }
    ];

    var currentSlideIdx = 0;

    function renderSlide(idx) {
      var slide = slides[idx];
      if (!slide) return;

      showcaseImg.style.opacity = '0.3';
      showcaseImg.style.transform = 'scale(0.98)';
      showcaseImg.style.transition = 'all 0.25s ease';

      setTimeout(function () {
        showcaseImg.src = slide.img;
        showcaseImg.alt = slide.title;

        if (showcaseCard) {
          var liveBadgeText = showcaseCard.querySelector('.live-session-badge span:last-child');
          if (liveBadgeText) liveBadgeText.textContent = slide.badge;

          var cardTitle = showcaseCard.querySelector('.card-title');
          if (cardTitle) cardTitle.textContent = slide.title;

          var cardDesc = showcaseCard.querySelector('.card-desc');
          if (cardDesc) cardDesc.textContent = slide.desc;

          var pillsBar = showcaseCard.querySelector('.card-pills-bar');
          if (pillsBar) {
            pillsBar.innerHTML = slide.pills.map(function (p) {
              return '<span class="category-pill">' + p + '</span>';
            }).join('');
          }
        }

        showcaseImg.style.opacity = '1';
        showcaseImg.style.transform = 'scale(1)';
      }, 200);
    }

    if (prevSlide) {
      prevSlide.addEventListener('click', function () {
        currentSlideIdx = (currentSlideIdx - 1 + slides.length) % slides.length;
        renderSlide(currentSlideIdx);
      });
    }

    if (nextSlide) {
      nextSlide.addEventListener('click', function () {
        currentSlideIdx = (currentSlideIdx + 1) % slides.length;
        renderSlide(currentSlideIdx);
      });
    }
  }

  // 15. Far Right Vertical Navigation Rail Tracking
  var verticalRail = document.getElementById('verticalRail');
  if (verticalRail) {
    var railDot = document.getElementById('railDot');
    var railItems = verticalRail.querySelectorAll('.rail-item');
    var sections = [
      { id: 'top', el: document.getElementById('top') || document.body, dotTop: 12 },
      { id: 'programs', el: document.getElementById('programs'), dotTop: 52 },
      { id: 'standard', el: document.getElementById('standard') || document.getElementById('coaches'), dotTop: 96 },
      { id: 'plans', el: document.getElementById('plans'), dotTop: 140 }
    ];

    function updateRail() {
      var scrollPos = window.scrollY + 200;
      var activeIdx = 0;

      for (var i = sections.length - 1; i >= 0; i--) {
        var s = sections[i];
        if (s.el && s.el.offsetTop <= scrollPos) {
          activeIdx = i;
          break;
        }
      }

      railItems.forEach(function (item, idx) {
        if (idx === activeIdx) {
          item.classList.add('active');
        } else {
          item.classList.remove('active');
        }
      });

      if (railDot && sections[activeIdx]) {
        railDot.style.top = sections[activeIdx].dotTop + 'px';
      }
    }

    window.addEventListener('scroll', updateRail, { passive: true });
    updateRail();

    // Smooth click handling
    railItems.forEach(function (item) {
      item.addEventListener('click', function (e) {
        var targetId = item.getAttribute('data-target');
        var targetEl = document.getElementById(targetId);
        if (targetEl) {
          e.preventDefault();
          targetEl.scrollIntoView({ behavior: 'smooth' });
        }
      });
    });
  }
})();
