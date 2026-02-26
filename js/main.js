// main.js — Game state, init, core game loop, event delegation

// === GAME STATE NAMESPACE ===
window.GUESS = {
  secretNumber: undefined,
  attempts: 0,
  bestScore: null,
  gamesPlayed: 0,
  batteryLives: 3,
  low: 1,
  high: 100,
  gameOver: false,
  currentUser: null,
  MAX_GUESSES: 7,
  BASE_RANGE: 100,
  RANGE_INCREMENT: 25,
  maxRange: 100,
  peakRange: 100,
  _isStartup: false,
  prevDistance: null,
  convergenceStreak: 0,
  npBuffer: ''
};

// === INIT ===

function init() {
  GUESS.bestScore    = parseInt(storageGet(userKey('bestScore'))) || null;
  GUESS.gamesPlayed  = parseInt(storageGet(userKey('gamesPlayed'))) || 0;
  GUESS.batteryLives = parseInt(storageGet(userKey('batteryLives')));
  if (isNaN(GUESS.batteryLives) || GUESS.batteryLives < 0 || GUESS.batteryLives > 4) GUESS.batteryLives = 3;
  GUESS.maxRange     = parseInt(storageGet(userKey('maxRange'))) || GUESS.BASE_RANGE;
  GUESS.peakRange    = parseInt(storageGet(userKey('peakRange'))) || GUESS.BASE_RANGE;

  // Start battery visually at 0, charge up to actual level
  var targetLives = GUESS.batteryLives;
  GUESS.batteryLives = 0;
  batterySetCharges(0);
  startupChargeSequence(targetLives);

  GUESS._isStartup = true;
  resetGame();
  GUESS._isStartup = false;

  // Restore batteryLives immediately for game logic (visual catches up via animation)
  GUESS.batteryLives = targetLives;

  if (window._startCRT) window._startCRT();
  if (window.refreshStatsPanel) window.refreshStatsPanel();
  document.getElementById('stats-panel').style.visibility = 'visible';
  document.getElementById('stats-handle').classList.add('visible');
}

// === RESET GAME ===

function resetGame() {
  var needsCharge = !GUESS._isStartup && GUESS.batteryLives === 0;

  // Reset range to base on total battery death
  if (needsCharge) {
    GUESS.maxRange = GUESS.BASE_RANGE;
    storageSet(userKey('maxRange'), GUESS.maxRange);
  }

  GUESS.secretNumber = Math.floor(Math.random() * GUESS.maxRange) + 1;
  GUESS.attempts     = 0;
  GUESS.low          = 1;
  GUESS.high         = GUESS.maxRange;
  GUESS.gameOver     = false;
  GUESS.npBuffer     = '';
  GUESS.prevDistance  = null;
  GUESS.convergenceStreak = 0;

  GUESS.gamesPlayed = (parseInt(storageGet(userKey('gamesPlayed'))) || 0) + 1;
  storageSet(userKey('gamesPlayed'), GUESS.gamesPlayed);

  // Restore enter key to normal mode
  var enterBtn = document.getElementById('guessBtn');
  enterBtn.querySelector('.key-face').textContent = 'ENTER';
  enterBtn.classList.remove('new-game');

  document.getElementById('cheatValue').classList.remove('visible');

  if (needsCharge) {
    // On total loss: stagger bulbs back one-by-one, then charge battery after
    resetBulbsSequence(function() {
      chargeBatterySequence();
    });
  } else if (!GUESS._isStartup) {
    resetBattery();
  }

  // Clear scoreboard (removes angry face or any leftover)
  updateScoreboard('');
  setNumpadDisabled(false);
  updateDisplay();
  updateRangeDisplay();
  clearLog();
  typeLog('system', '> system initialized. pick a number between 1 and ' + GUESS.maxRange + '.');
  if (GUESS.maxRange >= 200) {
    var rangeLines = [
      '> searching ' + GUESS.maxRange + ' integers with 7 guesses. bold.',
      '> range expansion detected. good luck out there.',
      '> ' + GUESS.maxRange + ' possibilities. 7 attempts. proceed.',
      '> operating beyond standard parameters. stay sharp.',
      '> extended range active. precision is everything now.'
    ];
    setTimeout(function() {
      typeLog('system', rangeLines[Math.floor(Math.random() * rangeLines.length)]);
    }, 600);
  } else if (GUESS.maxRange >= 150) {
    if (Math.random() < 0.5) {
      var midLines = [
        '> range is expanding. adjust your strategy.',
        '> wider field. same ammo. think carefully.'
      ];
      setTimeout(function() {
        typeLog('system', midLines[Math.floor(Math.random() * midLines.length)]);
      }, 600);
    }
  }

  if (window.refreshStatsPanel) window.refreshStatsPanel();
}

// === MAKE GUESS ===

function makeGuess() {
  if (GUESS.gameOver) return;
  if (GUESS.secretNumber === undefined) return;

  const guess = parseInt(GUESS.npBuffer);

  if (isNaN(guess) || guess < 1 || guess > GUESS.maxRange) {
    log('hint', '> enter a valid number between 1 and ' + GUESS.maxRange + '.');
    GUESS.npBuffer = '';
    updateDisplay();
    return;
  }

  GUESS.attempts++;
  updateBattery(GUESS.attempts);

  log('guess', `> you guessed: ${guess}`);

  if (guess === GUESS.secretNumber) {
    flashDisplay('correct');
    handleWin();
  } else if (GUESS.attempts >= GUESS.MAX_GUESSES) {
    flashDisplay('far');
    handleLoss();
  } else {
    var dist = Math.abs(guess - GUESS.secretNumber);
    var tier;
    if (dist <= 3) tier = 'burning';
    else if (dist <= 10) tier = 'hot';
    else if (dist <= 25) tier = 'warm';
    else if (dist <= 50) tier = 'cool';
    else tier = 'cold';

    flashDisplay((tier === 'cool' || tier === 'cold') ? 'far' : 'close');

    // === 5-TIER DIALOGUE POOLS ===
    var isLow = guess < GUESS.secretNumber;

    // Select pool (dialogue arrays are globals from dialogue.js)
    var pool = selectDialoguePool(tier, isLow);

    // Update range bounds
    if (isLow) {
      GUESS.low = Math.max(GUESS.low, guess + 1);
    } else {
      GUESS.high = Math.min(GUESS.high, guess - 1);
    }

    // Base message
    log('hint', pool[Math.floor(Math.random() * pool.length)]);

    // === COMPARATIVE LAYER ===
    if (GUESS.prevDistance !== null && Math.random() < 0.7) {
      var diff = dist - GUESS.prevDistance;
      var compPool;
      if (Math.abs(diff) <= 2) {
        compPool = compSame;
      } else if (diff < 0) {
        compPool = compCloser;
      } else {
        compPool = compFarther;
      }
      log('hint', compPool[Math.floor(Math.random() * compPool.length)]);
    }

    // === CONVERGENCE STREAK TRACKING ===
    if (GUESS.prevDistance !== null) {
      if (dist < GUESS.prevDistance - 2) {
        GUESS.convergenceStreak = GUESS.convergenceStreak > 0 ? GUESS.convergenceStreak + 1 : 1;
      } else if (dist > GUESS.prevDistance + 2) {
        GUESS.convergenceStreak = GUESS.convergenceStreak < 0 ? GUESS.convergenceStreak - 1 : -1;
      } else {
        GUESS.convergenceStreak = 0;
      }
    }

    // === STREAK RECOGNITION (3+ consecutive) ===
    if (Math.abs(GUESS.convergenceStreak) >= 3 && Math.random() < 0.3) {
      var streakPool;
      if (GUESS.convergenceStreak > 0) {
        streakPool = streakPositive;
      } else {
        streakPool = streakNegative;
      }
      log('hint', streakPool[Math.floor(Math.random() * streakPool.length)]);
    }

    // === GUESS COUNT PRESSURE LINES ===
    var remaining = GUESS.MAX_GUESSES - GUESS.attempts;
    if (remaining === 3 && Math.random() < 0.6) {
      setTimeout(function() {
        log('system', pressure3[Math.floor(Math.random() * pressure3.length)]);
      }, 400);
    } else if (remaining === 2) {
      setTimeout(function() {
        log('system', pressure2[Math.floor(Math.random() * pressure2.length)]);
      }, 400);
    } else if (remaining === 1) {
      setTimeout(function() {
        log('system', pressure1[Math.floor(Math.random() * pressure1.length)]);
      }, 400);
    }

    GUESS.prevDistance = dist;

    updateRangeDisplay();

    // Auto-resolve: only one possibility remains
    if (GUESS.low === GUESS.high) {
      if (GUESS.batteryLives > 0) {
        flashDisplay('correct');
        log('win', `> only one possibility remains. ${GUESS.low} confirmed.`);
        GUESS.secretNumber = GUESS.low;
        handleWin();
      } else {
        flashDisplay('far');
        log('hint', `> only one possibility remains. ${GUESS.low} confirmed. battery depleted.`);
        GUESS.secretNumber = GUESS.low;
        handleLoss();
      }
    }
  }

  GUESS.npBuffer = '';
  updateDisplay();
}

// === END GAME ===

function endGame() {
  GUESS.gameOver = true;
  setNumpadDisabled(true);
  setIdleCursor(false);
  var enterBtn = document.getElementById('guessBtn');
  enterBtn.querySelector('.key-face').textContent = 'NEW GAME';
  enterBtn.classList.add('new-game');
}

// === HANDLE WIN ===

function handleWin() {
  endGame();
  var isJackpot = GUESS.attempts === 1;

  if (isJackpot) {
    log('win', `> ✓ FIRST GUESS. ${GUESS.secretNumber} locked on contact.`);
    log('win', '> JACKPOT. overcharge initiated.');
  } else {
    log('win', `> ✓ correct! ${GUESS.secretNumber} found in ${GUESS.attempts} attempt${GUESS.attempts === 1 ? '' : 's'}.`);
  }

  if (!GUESS.bestScore || GUESS.attempts < GUESS.bestScore) {
    GUESS.bestScore = GUESS.attempts;
    storageSet(userKey('bestScore'), GUESS.bestScore);
    log('win', `> new best score: ${GUESS.bestScore}`);
  }

  // Expand range
  var oldMax = GUESS.maxRange;
  GUESS.maxRange += GUESS.RANGE_INCREMENT;
  storageSet(userKey('maxRange'), GUESS.maxRange);
  if (GUESS.maxRange > GUESS.peakRange) {
    GUESS.peakRange = GUESS.maxRange;
    storageSet(userKey('peakRange'), GUESS.peakRange);
  }
  log('win', `> search range expanded to 1-${GUESS.maxRange}.`);

  // Track wins and streak
  var wins = (parseInt(storageGet(userKey('wins'))) || 0) + 1;
  storageSet(userKey('wins'), wins);
  var streak = (parseInt(storageGet(userKey('currentStreak'))) || 0) + 1;
  storageSet(userKey('currentStreak'), streak);
  var bestStreak = parseInt(storageGet(userKey('bestStreak'))) || 0;
  if (streak > bestStreak) storageSet(userKey('bestStreak'), streak);

  if (isJackpot) {
    // JACKPOT: overcharge battery to blue (level 4) — real extra life
    GUESS.batteryLives = 4;
    batterySetCharges(4);
    triggerJackpotCelebration();
  } else if (GUESS.batteryLives >= 3) {
    shakeBattery();
  } else {
    GUESS.batteryLives = Math.min(3, GUESS.batteryLives + 1);
    updateBatteryLives();
  }

  scoreboardFireworks();
  animateRangeExpansion(oldMax, GUESS.maxRange);

  if (window.refreshStatsPanel) window.refreshStatsPanel();
}

// === HANDLE LOSS ===

function handleLoss() {
  GUESS.batteryLives = Math.max(0, GUESS.batteryLives - 1);
  updateBatteryLives();
  endGame();

  if (GUESS.batteryLives === 0) {
    document.getElementById('guessBtn').querySelector('.key-face').textContent = 'START OVER';
  }

  // Reset streak on loss
  storageSet(userKey('currentStreak'), 0);

  if (GUESS.batteryLives === 0) {
    log('hint', `> out of attempts. the number was ${GUESS.secretNumber}.`);
    log('hint', `> battery depleted. system failure. range reset to ${GUESS.BASE_RANGE}.`);
  } else {
    log('hint', `> out of attempts. the number was ${GUESS.secretNumber}.`);
  }

  scoreboardAngryFace();
  playSadTrombone(GUESS.batteryLives);

  // Animate range collapsing back to base on total depletion
  if (GUESS.batteryLives === 0 && GUESS.maxRange > GUESS.BASE_RANGE) {
    animateRangeCollapse(GUESS.maxRange, GUESS.BASE_RANGE);
  }

  if (window.refreshStatsPanel) window.refreshStatsPanel();
}

// === EVENT DELEGATION ===

(function() {
  var numpad = document.getElementById('numpad');

  numpad.addEventListener('click', function(e) {
    var btn = e.target.closest('.np');
    if (!btn || btn.disabled) return;

    if (btn.dataset.digit)           npPress(btn.dataset.digit);
    else if (btn.dataset.action === 'backspace') npBackspace();
    else if (btn.dataset.action === 'enter') {
      if (GUESS.gameOver) resetGame();
      else makeGuess();
    }
  });

  numpad.addEventListener('pointerdown', function(e) {
    var btn = e.target.closest('.np');
    if (!btn) return;
    btn.classList.add('pressed');
    if (!btn.disabled) {
      var type = btn.dataset.action === 'enter' ? 'enter'
               : btn.dataset.action === 'backspace' ? 'backspace'
               : 'key';
      playClick(type);
    }
  });
  numpad.addEventListener('pointerup', function(e) {
    var btn = e.target.closest('.np');
    if (btn) setTimeout(function() { btn.classList.remove('pressed'); }, 100);
  });
  numpad.addEventListener('pointerleave', function(e) {
    var btn = e.target.closest('.np');
    if (btn) btn.classList.remove('pressed');
  }, true);
})();

// === CHEAT DOT HANDLER ===

document.getElementById('cheatDot').addEventListener('click', function() {
  var el = document.getElementById('cheatValue');
  if (el.classList.contains('visible')) {
    el.classList.remove('visible');
  } else {
    el.textContent = GUESS.secretNumber;
    el.classList.add('visible');
  }
});

// === RESET SPLIT FLAP ===

function resetSplitFlap() {
  for (var i = 0; i < 3; i++) {
    var el = document.getElementById('sf' + i);
    if (el) {
      el.textContent = '\u00a0'; // non-breaking space
      el.parentElement.classList.remove('flipping');
    }
  }
}

// === RESET DOT HANDLER ===

// Dev reset: top-right screw wipes all data and restarts callsign flow
document.getElementById('resetDot').addEventListener('click', function() {
  // Flash RESET label for 3 seconds
  var label = document.getElementById('reset-label');
  label.classList.add('visible');
  clearTimeout(label._hideTimer);
  label._hideTimer = setTimeout(function() {
    label.classList.remove('visible');
  }, 3000);

  // Wipe everything
  try { localStorage.clear(); } catch(e) {}
  GUESS.currentUser = null;

  // Power down battery, bulbs, and scoreboard
  GUESS.batteryLives = 0;
  batterySetCharges(0);
  document.querySelectorAll('.bulb').forEach(function(cell) {
    cell.classList.remove('active', 'tier-green', 'tier-amber', 'tier-red', 'draining', 'last-bulb');
  });
  updateScoreboard('');
  document.getElementById('stats-panel').style.visibility = 'hidden';
  document.getElementById('stats-handle').classList.remove('visible');

  resetSplitFlap();

  // Remove any active overlay screens
  var existing = document.getElementById('callsign-screen') || document.getElementById('welcome-screen');
  if (existing) existing.remove();

  // Hide cheat value if visible
  document.getElementById('cheatValue').classList.remove('visible');

  // Re-enter user flow
  checkUser();
});

// === KEYBOARD HANDLER ===

document.addEventListener('keydown', function(e) {
  // Yield to callsign screen if it's active
  if (document.getElementById('callsign-screen')) return;
  if (e.key === 'Enter') {
    playClick('enter');
    if (GUESS.gameOver) resetGame();
    else makeGuess();
    return;
  }
  if (GUESS.gameOver) return;
  if (e.key >= '0' && e.key <= '9') { playClick('key'); npPress(e.key); }
  if (e.key === 'Backspace') { playClick('backspace'); npBackspace(); }
});

// === INIT LAYOUT ===

initLayout();

// === CRT CANVAS EFFECTS ===

(function() {
  var canvas = document.getElementById('crtCanvas');
  var ctx = canvas.getContext('2d');
  var terminal = document.querySelector('.terminal');
  var w = 0, h = 0;
  var frameCount = 0;

  // Pre-allocate an ImageData buffer for noise.
  // We write RGBA values directly into this pixel array
  // every frame, which is much faster than individual
  // fillRect calls for thousands of tiny dots.
  var noiseData = null;

  // Flicker state: random full-screen brightness bursts
  var flickerAlpha = 0;
  var nextFlickerFrame = randomInt(180, 400);

  function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  // Resize canvas to match its container.
  // Canvas pixel dimensions must equal its CSS display
  // size, or everything draws blurry/stretched.
  function resize() {
    var rect = terminal.getBoundingClientRect();
    // Using 1:1 pixels for a chunky CRT look (no devicePixelRatio scaling)
    w = Math.floor(rect.width);
    h = Math.floor(rect.height);
    canvas.width = w;
    canvas.height = h;
    // Create a fresh pixel buffer at the new size
    noiseData = ctx.createImageData(w, h);
  }

  // Call resize on load and when the window changes (debounced)
  resize();
  var resizeTimer = null;
  window.addEventListener('resize', function() {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(resize, 100);
  });

  // ---- THE RENDER LOOP ----
  // requestAnimationFrame calls this ~60fps.
  // Each frame we clear the canvas and redraw
  // all effects from scratch. This is the core
  // pattern for any Canvas animation.
  function render() {
    frameCount++;

    // Clear the entire canvas (transparent)
    ctx.clearRect(0, 0, w, h);

    // EFFECT 1: SCANLINES
    // Horizontal dark bars every 4px, just like a CRT
    // electron gun skipping every other line.
    // We offset them by a tiny crawl so they drift slowly.
    var scanOffset = (frameCount * 0.3) % 4;
    ctx.fillStyle = 'rgba(0, 0, 0, 0.13)';
    for (var y = scanOffset; y < h; y += 4) {
      ctx.fillRect(0, Math.floor(y), w, 2);
    }

    // EFFECT 2: STATIC NOISE
    // Random bright/dark pixels scattered across the
    // screen. We write directly into the ImageData pixel
    // buffer for speed. Each pixel is 4 array slots: R,G,B,A.
    var data = noiseData.data;
    var len = data.length;
    // Zero out the buffer using a 32-bit view (4x faster than byte-by-byte)
    new Uint32Array(noiseData.data.buffer).fill(0);
    // Sprinkle noise: ~3% of pixels get a random green-tinted dot
    var pixelCount = w * h;
    var noiseAmount = Math.floor(pixelCount * 0.03);
    for (var n = 0; n < noiseAmount; n++) {
      var px = Math.floor(Math.random() * pixelCount);
      var idx = px * 4;
      var brightness = Math.floor(Math.random() * 40);
      data[idx]     = Math.floor(brightness * 0.4);  // R (dim)
      data[idx + 1] = brightness;                      // G (dominant, CRT green)
      data[idx + 2] = Math.floor(brightness * 0.2);  // B (very dim)
      data[idx + 3] = Math.floor(Math.random() * 50) + 15; // A (semi-transparent)
    }
    ctx.putImageData(noiseData, 0, 0);

    // EFFECT 3: SCREEN FLICKER
    // Every few hundred frames, flash a faint green wash
    // across the whole screen for 2-3 frames, simulating
    // the CRT capacitor discharge flutter.
    if (frameCount >= nextFlickerFrame) {
      flickerAlpha = 0.04 + Math.random() * 0.03;
      nextFlickerFrame = frameCount + randomInt(200, 500);
    }
    if (flickerAlpha > 0) {
      ctx.fillStyle = 'rgba(57, 255, 20, ' + flickerAlpha + ')';
      ctx.fillRect(0, 0, w, h);
      flickerAlpha -= 0.015;
      if (flickerAlpha < 0) flickerAlpha = 0;
    }

    // EFFECT 4: HORIZONTAL TEAR LINE
    // A rare single-pixel bright bar that zips across
    // the screen vertically, like a sync glitch.
    if (Math.random() < 0.005) {
      var tearY = Math.floor(Math.random() * h);
      ctx.fillStyle = 'rgba(57, 255, 20, 0.08)';
      ctx.fillRect(0, tearY, w, 1);
      // Slight offset band below it
      ctx.fillStyle = 'rgba(0, 0, 0, 0.12)';
      ctx.fillRect(0, tearY + 1, w, 2);
    }

    // Schedule next frame
    requestAnimationFrame(render);
  }

  // Expose start function -- called from init() after splash exits
  window._startCRT = function() {
    resize();
    requestAnimationFrame(render);
  };
})();
