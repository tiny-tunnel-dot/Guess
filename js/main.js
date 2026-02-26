// main.js — Game state, init, core game loop, event delegation

// === GAME STATE NAMESPACE ===
window.GUESS = {
  secretNumber: undefined,
  attempts: 0,
  bestScore: null,
  gamesPlayed: 0,
  batteryLives: 3,
  low: 100,
  high: 999,
  gameOver: false,
  currentUser: null,
  MAX_GUESSES: 8,
  maxRange: 999,
  peakRange: 999,
  _isStartup: false,
  prevAccuracy: null,
  convergenceStreak: 0,
  guessHistory: [],
  npBuffer: ''
};

// === INIT ===

function init() {
  GUESS.bestScore    = parseInt(storageGet(userKey('bestScore'))) || null;
  GUESS.gamesPlayed  = parseInt(storageGet(userKey('gamesPlayed'))) || 0;
  GUESS.batteryLives = parseInt(storageGet(userKey('batteryLives')));
  if (isNaN(GUESS.batteryLives) || GUESS.batteryLives < 0 || GUESS.batteryLives > 4) GUESS.batteryLives = 3;
  GUESS.maxRange     = 999;
  GUESS.peakRange    = 999;

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

  GUESS.secretNumber = generateTarget();
  GUESS.attempts     = 0;
  GUESS.low          = 100;
  GUESS.high         = 999;
  GUESS.gameOver     = false;
  GUESS.npBuffer     = '';
  GUESS.prevAccuracy = null;
  GUESS.convergenceStreak = 0;
  GUESS.guessHistory = [];

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
  typeLog('system', '> 3-digit code generated. all digits unique.');
  var initLines = [
    '> ' + GUESS.MAX_GUESSES + ' attempts to decode. proceed.',
    '> ' + GUESS.MAX_GUESSES + ' signals available. crack the code.',
    '> code locked. ' + GUESS.MAX_GUESSES + ' attempts remaining.',
    '> three unique digits. ' + GUESS.MAX_GUESSES + ' chances. begin.'
  ];
  setTimeout(function() {
    typeLog('system', initLines[Math.floor(Math.random() * initLines.length)]);
  }, 600);

  if (window.refreshStatsPanel) window.refreshStatsPanel();
}

// === TARGET GENERATION (3-digit, no duplicate digits) ===

function generateTarget() {
  var digits = [];
  // First digit: 1-9 (no leading zero)
  var first = Math.floor(Math.random() * 9) + 1;
  digits.push(first);

  // Build pool of remaining digits (0-9 excluding first)
  var pool = [];
  for (var d = 0; d <= 9; d++) {
    if (d !== first) pool.push(d);
  }

  // Pick 2 more unique digits via partial Fisher-Yates
  for (var i = 0; i < 2; i++) {
    var j = i + Math.floor(Math.random() * (pool.length - i));
    var temp = pool[i];
    pool[i] = pool[j];
    pool[j] = temp;
    digits.push(pool[i]);
  }

  return digits[0] * 100 + digits[1] * 10 + digits[2];
}

// === MASTERMIND SCORING ===

function scoreMastermind(guessStr, targetStr) {
  var guess = guessStr.split('').map(Number);
  var target = targetStr.split('').map(Number);
  var numDigits = guess.length;
  var locked = 0;
  var found = 0;
  var results = new Array(numDigits);
  var targetUsed = new Array(numDigits);
  var guessUsed = new Array(numDigits);

  for (var i = 0; i < numDigits; i++) {
    targetUsed[i] = false;
    guessUsed[i] = false;
  }

  // First pass: exact position matches (LOCKED)
  for (var i = 0; i < numDigits; i++) {
    if (guess[i] === target[i]) {
      results[i] = 'locked';
      locked++;
      targetUsed[i] = true;
      guessUsed[i] = true;
    }
  }

  // Second pass: right digit, wrong position (FOUND)
  for (var i = 0; i < numDigits; i++) {
    if (guessUsed[i]) continue;
    for (var j = 0; j < numDigits; j++) {
      if (targetUsed[j]) continue;
      if (guess[i] === target[j]) {
        results[i] = 'found';
        found++;
        targetUsed[j] = true;
        break;
      }
    }
  }

  // Remaining positions are MISS
  for (var i = 0; i < numDigits; i++) {
    if (!results[i]) results[i] = 'miss';
  }

  return {
    locked: locked,
    found: found,
    miss: numDigits - locked - found,
    results: results
  };
}

// === ACCURACY TIER ===

function getAccuracyTier(locked, found) {
  if (locked >= 2) return 'hot';
  if (locked === 1 && found >= 1) return 'warm';
  if (found >= 2) return 'warm';
  if (locked === 1 || found >= 1) return 'cool';
  return 'cold';
}

// === MAKE GUESS ===

function makeGuess() {
  if (GUESS.gameOver) return;
  if (GUESS.secretNumber === undefined) return;

  var guess = parseInt(GUESS.npBuffer);

  if (isNaN(guess) || guess < 100 || guess > 999) {
    log('hint', '> enter a valid 3-digit number (100-999).');
    GUESS.npBuffer = '';
    updateDisplay();
    return;
  }

  GUESS.attempts++;
  updateBattery(GUESS.attempts);

  // Mastermind scoring
  var guessStr = String(guess);
  var targetStr = String(GUESS.secretNumber);
  var score = scoreMastermind(guessStr, targetStr);

  // Add to guess history
  GUESS.guessHistory.push({ guess: guessStr, score: score });

  // Display colored guess result in log
  logGuessResult(guessStr, score, GUESS.attempts);

  if (guess === GUESS.secretNumber) {
    flashDisplay('correct');
    handleWin();
  } else if (GUESS.attempts >= GUESS.MAX_GUESSES) {
    flashDisplay('far');
    handleLoss();
  } else {
    var tier = getAccuracyTier(score.locked, score.found);

    flashDisplay((tier === 'cool' || tier === 'cold') ? 'far' : 'close');

    // === ACCURACY-BASED DIALOGUE ===
    var pool = selectDialoguePool(tier);
    log('hint', pool[Math.floor(Math.random() * pool.length)]);

    // === COMPARATIVE LAYER (accuracy delta) ===
    if (GUESS.prevAccuracy !== null && Math.random() < 0.7) {
      var lockDiff = score.locked - GUESS.prevAccuracy.locked;
      var foundDiff = score.found - GUESS.prevAccuracy.found;
      var improvement = lockDiff * 2 + foundDiff;

      var compPool;
      if (improvement === 0) {
        compPool = compSame;
      } else if (improvement > 0) {
        compPool = compCloser;
      } else {
        compPool = compFarther;
      }
      log('hint', compPool[Math.floor(Math.random() * compPool.length)]);
    }

    // === CONVERGENCE STREAK TRACKING ===
    if (GUESS.prevAccuracy !== null) {
      var curScore = score.locked * 2 + score.found;
      var prevScore = GUESS.prevAccuracy.locked * 2 + GUESS.prevAccuracy.found;

      if (curScore > prevScore) {
        GUESS.convergenceStreak = GUESS.convergenceStreak > 0 ? GUESS.convergenceStreak + 1 : 1;
      } else if (curScore < prevScore) {
        GUESS.convergenceStreak = GUESS.convergenceStreak < 0 ? GUESS.convergenceStreak - 1 : -1;
      } else {
        GUESS.convergenceStreak = 0;
      }
    }

    // === STREAK RECOGNITION (3+ consecutive) ===
    if (Math.abs(GUESS.convergenceStreak) >= 3 && Math.random() < 0.3) {
      var streakPool = GUESS.convergenceStreak > 0 ? streakPositive : streakNegative;
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

    GUESS.prevAccuracy = { locked: score.locked, found: score.found };
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
    log('win', '> \u2713 FIRST GUESS. ' + GUESS.secretNumber + ' cracked on contact.');
    log('win', '> JACKPOT. overcharge initiated.');
  } else {
    log('win', '> \u2713 CODE CRACKED. ' + GUESS.secretNumber + ' decoded in ' + GUESS.attempts + ' attempt' + (GUESS.attempts === 1 ? '' : 's') + '.');
  }

  if (!GUESS.bestScore || GUESS.attempts < GUESS.bestScore) {
    GUESS.bestScore = GUESS.attempts;
    storageSet(userKey('bestScore'), GUESS.bestScore);
    log('win', '> new best score: ' + GUESS.bestScore);
  }

  // Track wins and streak
  var wins = (parseInt(storageGet(userKey('wins'))) || 0) + 1;
  storageSet(userKey('wins'), wins);
  var streak = (parseInt(storageGet(userKey('currentStreak'))) || 0) + 1;
  storageSet(userKey('currentStreak'), streak);
  var bestStreak = parseInt(storageGet(userKey('bestStreak'))) || 0;
  if (streak > bestStreak) storageSet(userKey('bestStreak'), streak);

  if (isJackpot) {
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

  log('hint', '> DECODE FAILED. the code was ' + GUESS.secretNumber + '.');
  if (GUESS.batteryLives === 0) {
    log('hint', '> battery depleted. system failure.');
  }

  scoreboardAngryFace();
  playSadTrombone(GUESS.batteryLives);

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
