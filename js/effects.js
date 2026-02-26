// effects.js — Celebrations, fireworks, range animations, scoreboard effects

function triggerJackpotCelebration() {
    playJackpotSound();

    // Full-screen flash overlay
    var overlay = document.getElementById('jackpotOverlay');
    overlay.classList.remove('active');
    void overlay.offsetWidth;
    overlay.classList.add('active');
    overlay.addEventListener('animationend', function handler() {
      overlay.classList.remove('active');
      overlay.removeEventListener('animationend', handler);
    });

    // Housing glow
    var housing = document.querySelector('.housing');
    housing.classList.remove('jackpot-glow');
    void housing.offsetWidth;
    housing.classList.add('jackpot-glow');
    housing.addEventListener('animationend', function handler() {
      housing.classList.remove('jackpot-glow');
      housing.removeEventListener('animationend', handler);
    });

    // Screen flash on log
    var logEl = document.getElementById('log');
    logEl.classList.remove('jackpot-screen');
    void logEl.offsetWidth;
    logEl.classList.add('jackpot-screen');
    logEl.addEventListener('animationend', function handler() {
      logEl.classList.remove('jackpot-screen');
      logEl.removeEventListener('animationend', handler);
    });

    // Sweep bulbs to blue, then back to green
    var bulbs = document.querySelectorAll('.bulb');
    bulbs.forEach(function(bulb, i) {
      setTimeout(function() {
        bulb.classList.add('jackpot-blue');
        bulb.style.animation = 'jackpotBulbSweep 0.3s ease-out';
      }, i * 60);
    });
    // Revert bulbs after 2.5s
    setTimeout(function() {
      bulbs.forEach(function(bulb) {
        bulb.classList.remove('jackpot-blue');
        bulb.style.animation = '';
      });
    }, 2500);

    // Scoreboard: rapid blue-green-blue flicker across all dots
    setTimeout(function() {
      jackpotScoreboardBurst();
    }, 200);
  }

  function jackpotScoreboardBurst() {
    // Rapid burst across all 3 digit positions simultaneously
    for (var pos = 0; pos < 3; pos++) {
      var dots = SB_DOTS[pos];
      if (!dots || !dots.length) continue;
      for (var i = 0; i < 28; i++) {
        (function(dot, delay) {
          setTimeout(function() {
            dot.classList.add('on-green');
          }, delay);
          setTimeout(function() {
            dot.classList.remove('on-green');
          }, delay + 150);
          // Second burst
          setTimeout(function() {
            dot.classList.add('on-green');
          }, delay + 300);
          setTimeout(function() {
            dot.classList.remove('on-green');
          }, delay + 500);
        })(dots[i], Math.random() * 200);
      }
    }
  }

  function scoreboardFireworks() {
    // Burst each digit section one at a time
    var order = [0, 1, 2];
    for (var s = 0; s < 3; s++) {
      (function(pos, delay) {
        setTimeout(function() {
          playFireworkPop();
          burstDigit(pos);
        }, delay);
      })(order[s], s * 400);
    }
  }

  function burstDigit(pos) {
    var dots = SB_DOTS[pos];
    if (!dots || !dots.length) return;

    // Clear any existing lit dots first
    for (var d = 0; d < 28; d++) {
      if (dots[d]) dots[d].classList.remove('on', 'on-green');
    }

    // Center of the 4x7 grid
    var cx = 1.5, cy = 3;

    // Phase 1: burst outward from center (light up dots near center first)
    for (var i = 0; i < 28; i++) {
      (function(dot, idx) {
        var col = idx % 4;
        var row = Math.floor(idx / 4);
        var dist = Math.sqrt((col - cx) * (col - cx) + (row - cy) * (row - cy));
        var onDelay = dist * 30; // near center lights first
        var offDelay = onDelay + 200 + Math.random() * 150; // fade out staggered

        setTimeout(function() {
          dot.classList.add('on-green');
        }, onDelay);

        setTimeout(function() {
          dot.classList.remove('on-green');
        }, offDelay);
      })(dots[i], i);
    }
  }

  function animateRangeExpansion(oldMax, newMax) {
    var loEl = document.getElementById('rangeLow');
    var hiEl = document.getElementById('rangeHigh');
    var rangeBox = document.querySelector('.range-box');
    var termBody = document.querySelector('.terminal-body');

    // Phase 1 (delay 600ms after win): Reset range display, dim surroundings, scale up
    setTimeout(function() {
      loEl.textContent = 1;
      hiEl.textContent = oldMax;

      // Dim terminal content behind range box
      termBody.classList.add('range-dimmed');

      // Scale up the range box
      rangeBox.classList.add('takeover');
      playRangeTakeoverUp();

      // Phase 2 (400ms after scale): Start counting up
      setTimeout(function() {
        hiEl.classList.add('ticking');

        var current = oldMax;
        var step = 5;
        var totalSteps = (newMax - oldMax) / step;
        var stepIndex = 0;
        var interval = setInterval(function() {
          current += step;
          stepIndex++;
          if (current >= newMax) {
            current = newMax;
            clearInterval(interval);

            // Land: final number with glow
            hiEl.textContent = current;
            hiEl.classList.remove('ticking');
            hiEl.classList.remove('expand-land');
            void hiEl.offsetWidth;
            hiEl.classList.add('expand-land');
            playRangeLand();

            // Phase 3 (800ms hold, then scale back down)
            setTimeout(function() {
              rangeBox.classList.remove('takeover');
              rangeBox.classList.add('takeover-return');
              termBody.classList.remove('range-dimmed');

              // Clean up transition class after animation
              setTimeout(function() {
                rangeBox.classList.remove('takeover-return');
              }, 500);
            }, 800);
          } else {
            hiEl.textContent = current;
            playRangeTick(stepIndex / totalSteps);
          }
        }, 120);
      }, 400);
    }, 600);
  }

  function animateRangeCollapse(fromMax, toBase) {
    var loEl = document.getElementById('rangeLow');
    var hiEl = document.getElementById('rangeHigh');

    // Start after a short delay so trombone gets its first note in
    setTimeout(function() {
      loEl.textContent = 1;
      hiEl.textContent = fromMax;
      hiEl.classList.add('ticking');

      var current = fromMax;
      var step = 25;
      var totalSteps = (fromMax - toBase) / step;
      var stepIndex = 0;
      var interval = setInterval(function() {
        current -= step;
        stepIndex++;
        if (current <= toBase) {
          current = toBase;
          clearInterval(interval);

          hiEl.textContent = current;
          hiEl.classList.remove('ticking');
          hiEl.classList.remove('collapse-land');
          void hiEl.offsetWidth;
          hiEl.classList.add('collapse-land');
          playRangeThud();
        } else {
          hiEl.textContent = current;
          playRangeDropTick(stepIndex / totalSteps);
        }
      }, 200);
    }, 300);
  }

  // --- Angry face across all 3 scoreboard sections ---
  // Each section is 4 cols x 7 rows
  // Left section: left eye + left brow
  // Middle section: right eye + nose hint
  // Right section: right brow + mouth area

  var ANGRY_FACE = [
    // pos 0 (left): left angry brow + left eye + left mouth
    [
      0,0,0,0,
      1,1,0,0,
      0,0,1,0,
      0,0,0,0,
      0,1,1,0,
      0,0,0,0,
      0,0,1,1
    ],
    // pos 1 (center): nose gap + right brow start + mouth center
    [
      0,0,0,0,
      0,0,1,1,
      0,1,0,0,
      0,0,0,0,
      0,1,1,0,
      0,0,0,0,
      1,1,1,1
    ],
    // pos 2 (right): mouth end
    [
      0,0,0,0,
      0,0,0,0,
      0,0,0,0,
      0,0,0,0,
      0,0,0,0,
      0,0,0,0,
      1,1,0,0
    ]
  ];

  function scoreboardAngryFace() {
    for (var pos = 0; pos < 3; pos++) {
      var pattern = ANGRY_FACE[pos];
      for (var i = 0; i < 28; i++) {
        var dot = SB_DOTS[pos][i];
        if (!dot) continue;
        dot.classList.remove('on', 'on-green');
        if (pattern && pattern[i]) {
          dot.classList.add('on');
        }
      }
    }
  }
