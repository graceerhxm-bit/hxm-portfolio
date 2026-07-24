(function () {
  function initSiteInteractions() {

      /* TEXT REVEAL
         Section 3 and CTA are observed separately so delays do not leak
         from one section into the other. */
      var revealLines = document.querySelectorAll(
        '.text-reveal-wrap .text-reveal-line, .cta-section .cta-title'
      );

      var revealObserver = new IntersectionObserver(function(entries) {
        entries.forEach(function(entry) {
          var el = entry.target;

          if (entry.isIntersecting) {
            el.classList.remove('is-visible');
            requestAnimationFrame(function() {
              el.classList.add('is-visible');
            });
          } else {
            el.classList.remove('is-visible');
          }
        });
      }, {
        threshold: 0.25,
        rootMargin: '0px 0px -10% 0px'
      });

      document.querySelectorAll('.text-reveal-wrap').forEach(function(wrap) {
        wrap.querySelectorAll('.text-reveal-line').forEach(function(line, index) {
          line.style.transitionDelay = (index * 120) + 'ms';
          revealObserver.observe(line);
        });
      });

      document.querySelectorAll('.cta-section .cta-title').forEach(function(title) {
        title.style.transitionDelay = '0ms';
        revealObserver.observe(title);
      });


      /* VANILLA TILT */
      if (window.innerWidth > 991 && window.VanillaTilt) {
        VanillaTilt.init(document.querySelectorAll('.tilt-card'), {
          reverse: true,
          max: 5,
          speed: 1000,
          perspective: 1200,
          glare: true,
          'max-glare': 0.2,
          scale: 1.01
        });
      }

      /* MAIN MARQUEE */
      var marqueeTrack = document.querySelector('.marquee-track');
      if (marqueeTrack) {
        var mqPosition = 0;
        var baseSpeed = 1.2;
        var boost = 0;
        var direction = -1;
        var totalWidth = 0;

        function updateWidth() {
          totalWidth = marqueeTrack.scrollWidth / 2;
        }

        window.addEventListener('load', updateWidth);
        window.addEventListener('resize', updateWidth);
        updateWidth();

        window.addEventListener('wheel', function(e) {
          direction = e.deltaY > 0 ? -1 : 1;
          boost = Math.min(Math.abs(e.deltaY) * 0.05, 12);
        }, { passive: true });

        function animateMarquee() {
          boost *= 0.98;
          var speed = (baseSpeed + boost) * direction;
          mqPosition += speed;

          if (totalWidth > 0) {
            if (mqPosition <= -totalWidth) mqPosition += totalWidth;
            if (mqPosition >= 0) mqPosition -= totalWidth;
          }

          marqueeTrack.style.transform = 'translate3d(' + mqPosition + 'px,0,0)';
          requestAnimationFrame(animateMarquee);
        }

        animateMarquee();
      }

      /* SERVICES */
      document.querySelectorAll('.service-item').forEach(function(item) {
        var marquee = item.querySelector('.service-marquee');
        var titleEl = item.querySelector('.service-title');

        if (marquee && titleEl) {
          var text = titleEl.textContent.trim();
          var html = '';

          for (var k = 0; k < 8; k++) {
            html += '<span class="marquee-text">' + text + '</span>' +
              '<span class="marquee-arrow-svg"><span class="arrow-line"></span><span class="arrow-head"></span></span>';
          }

          marquee.innerHTML = html + html;
        }

        item.addEventListener('mouseenter', function() {
          item.classList.add('is-hovered');
        });

        item.addEventListener('mouseleave', function() {
          item.classList.remove('is-hovered');
        });
      });

      var svcPositionMap = new WeakMap();
      var svcBase = 2;
      var svcBoost = 0;
      var svcDirection = -1;

      window.addEventListener('wheel', function(e) {
        svcDirection = e.deltaY > 0 ? -1 : 1;
        svcBoost = Math.min(Math.abs(e.deltaY) * 0.02, 5);
      }, { passive: true });

      function animateServiceMarquee() {
        svcBoost *= 0.9;
        var svcSpeed = (svcBase + svcBoost) * svcDirection;

        document.querySelectorAll('.service-item.is-hovered .service-marquee').forEach(function(marquee) {
          var total = marquee.scrollWidth / 2;
          var pos = svcPositionMap.get(marquee) || 0;

          pos += svcSpeed;

          if (total > 0) {
            if (pos <= -total) pos += total;
            if (pos >= 0) pos -= total;
          }

          svcPositionMap.set(marquee, pos);
          marquee.style.transform = 'translate3d(' + pos + 'px,0,0)';
        });

        requestAnimationFrame(animateServiceMarquee);
      }

      animateServiceMarquee();

      /* CURSOR IMAGES - TRAIL EFFECT */
      var IMG_COUNT = 8;
      var SPAWN_DISTANCE = 200;
      var SHOW_DURATION = 600;
      var HIDE_DURATION = 400;

      var cursorImgs = document.querySelectorAll('.cursor-img');
      var section3 = document.querySelector('.section-3') || document.querySelector('[class*="section-3"]');
      var mouseImagesEnabled = false;

      var imgPool = [];
      for (var pi = 0; pi < IMG_COUNT; pi++) {
        imgPool.push({
          el: cursorImgs[pi] || null,
          showTimer: null,
          hideTimer: null,
          order: 0
        });
      }

      var lastSpawnX = null;
      var lastSpawnY = null;
      var poolIndex = 0;
      var spawnOrder = 0;

      function getDistance(x1, y1, x2, y2) {
        var dx = x2 - x1;
        var dy = y2 - y1;
        return Math.sqrt(dx * dx + dy * dy);
      }

      function triggerHide(img, state) {
        if (!img) return;

        img.style.transition =
          'opacity ' + (HIDE_DURATION / 1000) + 's ease, ' +
          'transform ' + (HIDE_DURATION / 1000) + 's ease';

        img.classList.remove('is-active');
        img.classList.add('is-hiding');

        state.hideTimer = setTimeout(function() {
          img.classList.remove('is-hiding');
          img.style.transition = 'none';
        }, HIDE_DURATION);
      }

      function showImg(img, state, x, y) {
        if (!img) return;

        if (state.showTimer) clearTimeout(state.showTimer);
        if (state.hideTimer) clearTimeout(state.hideTimer);

        img.classList.remove('is-hiding', 'is-active');
        img.style.transition = 'none';
        img.style.left = x + 'px';
        img.style.top = y + 'px';

        state.showTimer = setTimeout(function() {
          img.style.transition = 'opacity 0.25s ease, transform 0.25s ease';
          img.classList.add('is-active');
        }, 16);

        state.order = spawnOrder++;

        state.hideTimer = setTimeout(function() {
          triggerHide(img, state);
        }, SHOW_DURATION);
      }

      function spawnNext(x, y) {
        var state = imgPool[poolIndex % IMG_COUNT];
        poolIndex++;
        showImg(state.el, state, x, y);
      }

      if (section3) {
        section3.addEventListener('mousemove', function(e) {
          if (!mouseImagesEnabled) return;
          if (!cursorImgs.length) return;

          var x = e.clientX;
          var y = e.clientY;

          if (lastSpawnX === null) {
            lastSpawnX = x;
            lastSpawnY = y;
            spawnNext(x, y);
            return;
          }

          if (getDistance(x, y, lastSpawnX, lastSpawnY) >= SPAWN_DISTANCE) {
            spawnNext(x, y);
            lastSpawnX = x;
            lastSpawnY = y;
          }
        });

        section3.addEventListener('mouseleave', function() {
          lastSpawnX = null;
          lastSpawnY = null;

          imgPool.forEach(function(state) {
            if (state.el) {
              if (state.showTimer) clearTimeout(state.showTimer);
              if (state.hideTimer) clearTimeout(state.hideTimer);
              triggerHide(state.el, state);
            }
          });
        });
      }

      /*
        图片跟随不再只依赖最后一行文字的 transitionend。
        某些情况下文字在页面加载时已经进入可视区，或 transitionend 没有触发，
        会导致 mouseImagesEnabled 一直保持 false。
        现在改为：Section 3 进入视口时直接启用，离开视口时关闭。
      */
      if (section3) {
        var cursorSectionObserver = new IntersectionObserver(function(entries) {
          entries.forEach(function(entry) {
            mouseImagesEnabled = entry.isIntersecting;

            if (!entry.isIntersecting) {
              lastSpawnX = null;
              lastSpawnY = null;
            }
          });
        }, {
          threshold: 0.05
        });

        cursorSectionObserver.observe(section3);
      }

      /* 保留文字动画完成后的兜底启用。 */
      var lastRevealLine = revealLines[revealLines.length - 1];
      if (lastRevealLine) {
        lastRevealLine.addEventListener('transitionend', function(e) {
          if (
            (e.propertyName === 'opacity' || e.propertyName === 'transform') &&
            lastRevealLine.classList.contains('is-visible')
          ) {
            mouseImagesEnabled = true;
          }
        });
      }

      /* STICKY RELEASE */
      var stickyEl = document.querySelector('.sticky-side');
      var triggerEl = document.querySelector('.button-style');
      var scrollingList = document.querySelector('.scrolling-side');

      if (stickyEl && triggerEl && scrollingList) {
        window.addEventListener('scroll', function() {
          var listBottom = scrollingList.getBoundingClientRect().bottom;
          var btnBottom = triggerEl.getBoundingClientRect().bottom;

          if (listBottom <= btnBottom) {
            stickyEl.style.position = 'relative';
            stickyEl.style.top = 'auto';
          } else {
            stickyEl.style.position = 'sticky';
            stickyEl.style.top = '15vh';
          }
        }, { passive: true });
      }

      /* BUTTON HOVER FILL EFFECT */
      document.querySelectorAll('.button-style').forEach(function(btn) {
        var oldFill = btn.querySelector('.btn-fill-circle');
        if (oldFill) oldFill.remove();

        var fill = document.createElement('div');
        fill.className = 'btn-fill-circle';
        fill.style.cssText = [
          'position:absolute',
          'border-radius:50%',
          'background:#ffffff',
          'z-index:1',
          'pointer-events:none',
          'transform:translate(-50%,-50%) scale(0)',
          'transition:transform 1.1s cubic-bezier(0.22,1,0.36,1)',
          'will-change:transform'
        ].join(';');

        btn.appendChild(fill);

        function updateFillSize() {
          var w = btn.offsetWidth;
          var h = btn.offsetHeight;
          var size = Math.sqrt(w * w + h * h) * 2.2;

          fill.style.width = size + 'px';
          fill.style.height = size + 'px';
        }

        updateFillSize();
        window.addEventListener('resize', updateFillSize);

        var track = btn.querySelector('.button-track');

        if (track) {
          track.style.position = 'relative';
          track.style.overflow = 'hidden';
          track.style.zIndex = '2';
        }

        var defInner = btn.querySelector('.button-inner:not(.is-hover)');
        var hovInner = btn.querySelector('.button-inner.is-hover');

        if (!defInner || !hovInner) return;

        defInner.style.position = 'relative';
        defInner.style.zIndex = '2';
        defInner.style.transition = 'transform 0.55s cubic-bezier(0.22,1,0.36,1)';

        hovInner.style.position = 'absolute';
        hovInner.style.top = '0';
        hovInner.style.left = '0';
        hovInner.style.width = '100%';
        hovInner.style.height = '100%';
        hovInner.style.display = 'flex';
        hovInner.style.alignItems = 'center';
        hovInner.style.justifyContent = 'center';
        hovInner.style.transform = 'translateY(100%)';
        hovInner.style.transition = 'transform 0.55s cubic-bezier(0.22,1,0.36,1)';
        hovInner.style.zIndex = '3';

        var hovText = hovInner.querySelector('.button-text');
        if (hovText) {
          hovText.style.color = '#000';
        }

        hovInner.querySelectorAll('img,svg').forEach(function(el) {
          el.style.filter = 'brightness(0) saturate(100%)';
        });

        btn.addEventListener('mouseenter', function(e) {
          if (window.matchMedia('(hover: none)').matches) return;

          var rect = btn.getBoundingClientRect();
          var x = e.clientX - rect.left;
          var y = e.clientY - rect.top;

          fill.style.left = x + 'px';
          fill.style.top = y + 'px';
          fill.style.transform = 'translate(-50%,-50%) scale(0)';
          fill.getBoundingClientRect();
          fill.style.transition = 'transform 1.1s cubic-bezier(0.22,1,0.36,1)';
          fill.style.transform = 'translate(-50%,-50%) scale(1)';

          defInner.style.transform = 'translateY(-100%)';
          hovInner.style.transform = 'translateY(0%)';
        });

        btn.addEventListener('mouseleave', function(e) {
          if (window.matchMedia('(hover: none)').matches) return;

          var rect = btn.getBoundingClientRect();
          var x = e.clientX - rect.left;
          var y = e.clientY - rect.top;

          fill.style.left = x + 'px';
          fill.style.top = y + 'px';
          fill.style.transition = 'transform 0.7s cubic-bezier(0.22,1,0.36,1)';
          fill.style.transform = 'translate(-50%,-50%) scale(0)';

          defInner.style.transform = 'translateY(0%)';
          hovInner.style.transform = 'translateY(100%)';
        });
      });

      /* FOOTER REVEAL + LOGO LETTER ANIMATION */
      (function() {
        function clamp(value, min, max) {
          return Math.max(min, Math.min(max, value));
        }

        function easeOutCubic(t) {
          return 1 - Math.pow(1 - t, 3);
        }

        function setLetterColor(letter, value) {
          var color = 'rgb(' + value + ',' + value + ',' + value + ')';

          if (letter.tagName && letter.tagName.toLowerCase() === 'g') {
            letter.querySelectorAll('path').forEach(function(path) {
              path.style.fill = color;
            });
          } else {
            letter.style.fill = color;
          }
        }

        function initFooterReveal() {
          var cta = document.querySelector('.cta-section');
          var footerTrigger = document.querySelector('.footer-letter-trigger');
          var footer = document.querySelector('.footer');
          var logo = document.querySelector('.footer-logo-svg');
          var copyWrap = document.querySelector('.footer-copy-wrap');

          if (!cta || !footerTrigger || !footer || !logo) {
            console.warn('[Footer Reveal] Missing required footer elements');
            return;
          }

          /* CTA stays above the footer while it leaves the viewport. */
          cta.style.position = 'relative';
          cta.style.zIndex = '3';
          cta.style.backgroundColor = '#0a0a12';

          /* The trigger supplies exactly one viewport of scroll distance. */
          footerTrigger.style.position = 'relative';
          footerTrigger.style.width = '100%';
          footerTrigger.style.height = '100vh';
          footerTrigger.style.minHeight = '100vh';
          footerTrigger.style.overflow = 'clip';
          footerTrigger.style.zIndex = '1';
          footerTrigger.style.backgroundColor = '#111117';

          /* Keep the footer inside normal document flow to avoid a second scrollbar. */
          footer.style.position = 'sticky';
          footer.style.left = 'auto';
          footer.style.right = 'auto';
          footer.style.top = 'auto';
          footer.style.bottom = '0';
          footer.style.width = '100%';
          footer.style.height = '100vh';
          footer.style.minHeight = '100vh';
          footer.style.overflow = 'hidden';
          footer.style.zIndex = '1';
          footer.style.opacity = '1';
          footer.style.visibility = 'visible';
          footer.style.transform = 'none';

          var letters = logo.querySelectorAll('.footer-logo-letter');

          if (!letters.length) {
            console.warn('[Footer Reveal] No .footer-logo-letter elements found');
            return;
          }

          letters.forEach(function(letter) {
            letter.style.transformBox = 'fill-box';
            letter.style.transformOrigin = 'center bottom';
            letter.style.willChange = 'transform, fill';
            letter.style.transition = 'none';
          });

          if (copyWrap) {
            copyWrap.style.willChange = 'transform, opacity';
            copyWrap.style.transition = 'none';
          }

          var ticking = false;

          function update() {
            ticking = false;

            var vh = window.innerHeight || document.documentElement.clientHeight;
            var rect = footerTrigger.getBoundingClientRect();

            /*
              Animation range:
              progress 0 when the footer section is just below the viewport;
              progress 1 after it has travelled 70% of one viewport upward.
            */
            var start = vh;
            var end = vh * 0.30;
            var progress = clamp((start - rect.top) / (start - end), 0, 1);

            if (copyWrap) {
              var copyProgress = clamp((progress - 0.04) / 0.68, 0, 1);
              var copyEase = easeOutCubic(copyProgress);
              var copyY = 90 * (1 - copyEase);

              copyWrap.style.transform = 'translate3d(0,' + copyY + 'px,0)';
              copyWrap.style.opacity = String(0.2 + copyEase * 0.8);
            }

            var stagger = 0.36;

            letters.forEach(function(letter, index) {
              var delay = letters.length > 1
                ? (index / (letters.length - 1)) * stagger
                : 0;

              var letterProgress = clamp((progress - delay) / (1 - stagger), 0, 1);
              var eased = easeOutCubic(letterProgress);
              var y = 180 * (1 - eased);
              var colorValue = Math.round(55 + 200 * eased);

              letter.style.transform = 'translate3d(0,' + y + 'px,0)';
              setLetterColor(letter, colorValue);
            });
          }

          function requestUpdate() {
            if (ticking) return;
            ticking = true;
            requestAnimationFrame(update);
          }

          update();
          window.addEventListener('scroll', requestUpdate, { passive: true });
          window.addEventListener('resize', requestUpdate);
          window.addEventListener('load', requestUpdate);
        }

        initFooterReveal();
      })();
      }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSiteInteractions);
  } else {
    initSiteInteractions();
  }
})();
