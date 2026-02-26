// splash.js — Splash screen, glitch animation, callsign entry, user system

var GLITCH_CHARS = '0123456789!@#$%^&*<>?/\\|[]{}01ﾊﾐﾋｰｳｼﾅﾓﾆｻﾜﾂｵﾘｱﾎﾃﾏｹﾒｴｶｷﾑﾕﾗｾﾈｽﾀﾇﾍ';

function glitchLetter(id, finalChar, callback) {
  const el = document.getElementById(id);
  el.classList.add('scrambling');
  let cycles = 0;
  const maxCycles = 18;
  let delay = 90;

  function tick() {
    el.textContent = GLITCH_CHARS[Math.floor(Math.random() * GLITCH_CHARS.length)];
    el.style.fontSize = (56 + Math.random() * 24) + 'px';
    el.style.opacity = 0.4 + Math.random() * 0.6;
    playSplashTick();
    cycles++;
    delay = Math.max(30, delay - 4);
    if (cycles >= maxCycles) {
      el.textContent = finalChar;
      el.style.fontSize = '';
      el.style.opacity = '';
      el.classList.remove('scrambling');
      el.classList.add('settled');
      if (callback) callback();
    } else {
      setTimeout(tick, delay);
    }
  }
  tick();
}

function checkUser() {
  var saved = storageGet('user:session');
  if (saved) {
    GUESS.currentUser = saved;
    showWelcomeScreen(saved);
  } else {
    showCallsignScreen();
  }
}

function showCallsignScreen() {
  var body   = document.querySelector('.terminal-body');
  var ALPHA  = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  var values = [0, 0, 0];   // index into ALPHA for each tile
  var active = 0;           // which slot is selected

  var screen = document.createElement('div');
  screen.id        = 'callsign-screen';
  screen.className = 'user-screen';

  // Build HTML for 3 arrow-based letter slots
  var slotsHtml = '<div class="cs-tiles">';
  for (var t = 0; t < 3; t++) {
    slotsHtml +=
      '<div class="cs-slot' + (t === 0 ? ' active' : '') + '" id="css' + t + '">' +
        '<button class="cs-arrow cs-arrow-up" data-slot="' + t + '" data-dir="1">&#9650;</button>' +
        '<div class="cs-letter-box" id="csl' + t + '">A</div>' +
        '<button class="cs-arrow cs-arrow-down" data-slot="' + t + '" data-dir="-1">&#9660;</button>' +
      '</div>';
  }
  slotsHtml += '</div>';

  screen.innerHTML =
    '<div class="user-screen-label">ID REQUIRED</div>' +
    '<div class="user-screen-title">ENTER CALLSIGN</div>' +
    slotsHtml +
    '<button class="cs-enter" id="cs-enter-btn">ENTER</button>';

  body.appendChild(screen);

  // --- helpers ---

  function mod(n, m) { return ((n % m) + m) % m; }

  function renderSlot(idx) {
    document.getElementById('csl' + idx).textContent = ALPHA[values[idx]];
  }

  function setActive(idx) {
    for (var i = 0; i < 3; i++) {
      document.getElementById('css' + i).classList.toggle('active', i === idx);
    }
    active = idx;
  }

  function cycleSlot(idx, direction) {
    values[idx] = mod(values[idx] + direction, 26);
    renderSlot(idx);
    setActive(idx);
  }

  var confirmed = false;
  function confirm() {
    if (confirmed) return;
    confirmed = true;
    var callsign = ALPHA[values[0]] + ALPHA[values[1]] + ALPHA[values[2]];
    document.removeEventListener('keydown', csKeyHandler);
    enterBtn.removeEventListener('click', csEnterClick);
    enterBtn.disabled = false;
    enterBtn.style.visibility = '';
    setNumpadDisabled(false);
    GUESS.currentUser = callsign;
    storageSet('user:session', callsign);
    screen.remove();

    // First-time users get the tutorial
    var tutorialDone = storageGet(userKey('tutorialDone'));
    if (!tutorialDone) {
      showTutorial(callsign, function() {
        init();
        showCallsignOnScoreboard(callsign);
      });
    } else {
      init();
      showCallsignOnScoreboard(callsign);
    }
  }

  // Initialise display
  for (var i = 0; i < 3; i++) renderSlot(i);

  // --- arrow button clicks ---
  var arrows = screen.querySelectorAll('.cs-arrow');
  for (var a = 0; a < arrows.length; a++) {
    arrows[a].addEventListener('click', function(e) {
      var slot = parseInt(this.getAttribute('data-slot'));
      var dir  = parseInt(this.getAttribute('data-dir'));
      cycleSlot(slot, dir);
    });
  }

  // --- keyboard (desktop) ---
  function csKeyHandler(e) {
    if (document.getElementById('callsign-screen') === null) return;
    if (e.key === 'ArrowUp')    { e.preventDefault(); cycleSlot(active,  1); }
    if (e.key === 'ArrowDown')  { e.preventDefault(); cycleSlot(active, -1); }
    if (e.key === 'ArrowRight') { e.preventDefault(); setActive(mod(active + 1, 3)); }
    if (e.key === 'ArrowLeft')  { e.preventDefault(); setActive(mod(active - 1, 3)); }
    if (e.key === 'Tab') {
      e.preventDefault();
      setActive(mod(active + (e.shiftKey ? -1 : 1), 3));
    }
    if (e.key === 'Enter') { e.preventDefault(); confirm(); }
  }
  document.addEventListener('keydown', csKeyHandler);

  // On-screen ENTER button
  document.getElementById('cs-enter-btn').addEventListener('click', function() {
    confirm();
  });

  // --- numpad ENTER: disable during callsign entry, restore on confirm ---
  var enterBtn = document.getElementById('guessBtn');
  enterBtn.disabled = true;
  enterBtn.style.visibility = '';
  setNumpadDisabled(true);

  function csEnterClick() { confirm(); }
  enterBtn.addEventListener('click', csEnterClick);
}

// Show "WELCOME BACK / [NAME]" for 3 seconds then launch game
function showWelcomeScreen(callsign) {
  var body = document.querySelector('.terminal-body');

  var screen = document.createElement('div');
  screen.id = 'welcome-screen';
  screen.className = 'user-screen';
  screen.innerHTML =
    '<div class="user-screen-label">SYSTEM ONLINE</div>' +
    '<div class="user-screen-title">WELCOME BACK</div>' +
    '<div class="welcome-callsign"></div>';
  screen.querySelector('.welcome-callsign').textContent = callsign;

  body.appendChild(screen);

  setTimeout(function() {
    screen.remove();
    init();
    showCallsignOnScoreboard(callsign);
  }, 3000);
}

// Splash sequence
(function() {
  var splashEl  = document.getElementById('splash');
  var contentEl = document.getElementById('splash-content');
  var prompt    = document.getElementById('splash-prompt');
  var started   = false;

  function startSequence() {
    if (started) return;
    started = true;

    // Hide prompt immediately (visual feedback on tap)
    if (prompt) prompt.classList.add('hidden-prompt');

    // Build bass nodes now (not at page load) so we don't waste memory
    // if the user never taps
    preBuildBass();

    var ctx = getAudioCtx();
    var bassFired = false;
    function safeBass() {
      if (bassFired) return;
      bassFired = true;
      triggerSplashBass();
    }

    function go() {
      contentEl.classList.remove('pre-tap');
      contentEl.classList.add('post-tap');

      setTimeout(function() {
        var titleEl = document.querySelector('.splash-title');
        var digits  = '0123456789';
        var rand    = function() { return digits[Math.floor(Math.random() * digits.length)]; };

        splashEl.classList.add('glitch-active');
        titleEl.setAttribute('data-text', 'GUESS');
        titleEl.classList.add('glitching');
        contentEl.classList.add('tearing');

        var letters = [
          { id: 'gl0', delay: 0 },
          { id: 'gl1', delay: 150 },
          { id: 'gl2', delay: 280 },
          { id: 'gl3', delay: 420 },
          { id: 'gl4', delay: 560 },
        ];

        letters.forEach(function(l, i) {
          setTimeout(function() {
            var isLast = i === letters.length - 1;
            glitchLetter(l.id, rand(), isLast ? function() {
              setTimeout(function() {
                titleEl.classList.remove('glitching');
                contentEl.classList.remove('tearing');
                splashEl.classList.remove('glitch-active');
                setTimeout(function() {
                  splashEl.classList.add('hidden');
                  // Init game when splash actually exits, not on a fixed timer
                  checkUser();
                  setTimeout(function() { splashEl.remove(); }, 900);
                }, 300);
              }, 200);
            } : null);
          }, l.delay);
        });
      }, 1800);
    }

    var goFired = false;
    function safeGo() {
      if (goFired) return;
      goFired = true;
      go();
    }

    if (ctx.state === 'running') {
      safeBass();
      safeGo();
    } else {
      ctx.resume().then(function() {
        safeBass();
        safeGo();
      }).catch(function() {
        safeBass();
        safeGo();
      });
      setTimeout(function() {
        safeBass();
        safeGo();
      }, 200);
    }
  }

  splashEl.addEventListener('pointerdown', startSequence, { once: true });
  splashEl.addEventListener('keydown',     startSequence, { once: true });
})();
