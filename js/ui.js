// ui.js — Scoreboard, display, battery visuals, range, bulbs

// Dot-matrix pixel font: 4 cols x 7 rows per digit
// 1 = lit bulb, 0 = dim bulb
var SB_FONT = {
  '0': [
    1,1,1,1,
    1,0,0,1,
    1,0,0,1,
    1,0,0,1,
    1,0,0,1,
    1,0,0,1,
    1,1,1,1
  ],
  '1': [
    0,0,1,0,
    0,1,1,0,
    0,0,1,0,
    0,0,1,0,
    0,0,1,0,
    0,0,1,0,
    0,1,1,1
  ],
  '2': [
    1,1,1,1,
    0,0,0,1,
    0,0,0,1,
    1,1,1,1,
    1,0,0,0,
    1,0,0,0,
    1,1,1,1
  ],
  '3': [
    1,1,1,1,
    0,0,0,1,
    0,0,0,1,
    1,1,1,1,
    0,0,0,1,
    0,0,0,1,
    1,1,1,1
  ],
  '4': [
    1,0,0,1,
    1,0,0,1,
    1,0,0,1,
    1,1,1,1,
    0,0,0,1,
    0,0,0,1,
    0,0,0,1
  ],
  '5': [
    1,1,1,1,
    1,0,0,0,
    1,0,0,0,
    1,1,1,1,
    0,0,0,1,
    0,0,0,1,
    1,1,1,1
  ],
  '6': [
    1,1,1,1,
    1,0,0,0,
    1,0,0,0,
    1,1,1,1,
    1,0,0,1,
    1,0,0,1,
    1,1,1,1
  ],
  '7': [
    1,1,1,1,
    0,0,0,1,
    0,0,0,1,
    0,0,1,0,
    0,0,1,0,
    0,0,1,0,
    0,0,1,0
  ],
  '8': [
    1,1,1,1,
    1,0,0,1,
    1,0,0,1,
    1,1,1,1,
    1,0,0,1,
    1,0,0,1,
    1,1,1,1
  ],
  '9': [
    1,1,1,1,
    1,0,0,1,
    1,0,0,1,
    1,1,1,1,
    0,0,0,1,
    0,0,0,1,
    1,1,1,1
  ],
  'A': [
    0,1,1,0,
    1,0,0,1,
    1,0,0,1,
    1,1,1,1,
    1,0,0,1,
    1,0,0,1,
    1,0,0,1
  ],
  'B': [
    1,1,1,0,
    1,0,0,1,
    1,0,0,1,
    1,1,1,0,
    1,0,0,1,
    1,0,0,1,
    1,1,1,0
  ],
  'C': [
    0,1,1,1,
    1,0,0,0,
    1,0,0,0,
    1,0,0,0,
    1,0,0,0,
    1,0,0,0,
    0,1,1,1
  ],
  'D': [
    1,1,1,0,
    1,0,0,1,
    1,0,0,1,
    1,0,0,1,
    1,0,0,1,
    1,0,0,1,
    1,1,1,0
  ],
  'E': [
    1,1,1,1,
    1,0,0,0,
    1,0,0,0,
    1,1,1,0,
    1,0,0,0,
    1,0,0,0,
    1,1,1,1
  ],
  'F': [
    1,1,1,1,
    1,0,0,0,
    1,0,0,0,
    1,1,1,0,
    1,0,0,0,
    1,0,0,0,
    1,0,0,0
  ],
  'G': [
    0,1,1,1,
    1,0,0,0,
    1,0,0,0,
    1,0,1,1,
    1,0,0,1,
    1,0,0,1,
    0,1,1,1
  ],
  'H': [
    1,0,0,1,
    1,0,0,1,
    1,0,0,1,
    1,1,1,1,
    1,0,0,1,
    1,0,0,1,
    1,0,0,1
  ],
  'I': [
    0,1,1,1,
    0,0,1,0,
    0,0,1,0,
    0,0,1,0,
    0,0,1,0,
    0,0,1,0,
    0,1,1,1
  ],
  'J': [
    0,0,1,1,
    0,0,0,1,
    0,0,0,1,
    0,0,0,1,
    0,0,0,1,
    1,0,0,1,
    0,1,1,0
  ],
  'K': [
    1,0,0,1,
    1,0,1,0,
    1,1,0,0,
    1,1,0,0,
    1,0,1,0,
    1,0,0,1,
    1,0,0,1
  ],
  'L': [
    1,0,0,0,
    1,0,0,0,
    1,0,0,0,
    1,0,0,0,
    1,0,0,0,
    1,0,0,0,
    1,1,1,1
  ],
  'M': [
    1,0,0,1,
    1,1,1,1,
    1,1,1,1,
    1,0,0,1,
    1,0,0,1,
    1,0,0,1,
    1,0,0,1
  ],
  'N': [
    1,0,0,1,
    1,1,0,1,
    1,1,0,1,
    1,0,1,1,
    1,0,1,1,
    1,0,0,1,
    1,0,0,1
  ],
  'O': [
    0,1,1,0,
    1,0,0,1,
    1,0,0,1,
    1,0,0,1,
    1,0,0,1,
    1,0,0,1,
    0,1,1,0
  ],
  'P': [
    1,1,1,0,
    1,0,0,1,
    1,0,0,1,
    1,1,1,0,
    1,0,0,0,
    1,0,0,0,
    1,0,0,0
  ],
  'Q': [
    0,1,1,0,
    1,0,0,1,
    1,0,0,1,
    1,0,0,1,
    1,0,1,1,
    1,0,0,1,
    0,1,1,1
  ],
  'R': [
    1,1,1,0,
    1,0,0,1,
    1,0,0,1,
    1,1,1,0,
    1,0,1,0,
    1,0,0,1,
    1,0,0,1
  ],
  'S': [
    0,1,1,1,
    1,0,0,0,
    1,0,0,0,
    0,1,1,0,
    0,0,0,1,
    0,0,0,1,
    1,1,1,0
  ],
  'T': [
    1,1,1,1,
    0,0,1,0,
    0,0,1,0,
    0,0,1,0,
    0,0,1,0,
    0,0,1,0,
    0,0,1,0
  ],
  'U': [
    1,0,0,1,
    1,0,0,1,
    1,0,0,1,
    1,0,0,1,
    1,0,0,1,
    1,0,0,1,
    0,1,1,0
  ],
  'V': [
    1,0,0,1,
    1,0,0,1,
    1,0,0,1,
    1,0,0,1,
    1,0,0,1,
    0,1,1,0,
    0,1,1,0
  ],
  'W': [
    1,0,0,1,
    1,0,0,1,
    1,0,0,1,
    1,0,0,1,
    1,1,1,1,
    1,1,1,1,
    1,0,0,1
  ],
  'X': [
    1,0,0,1,
    1,0,0,1,
    0,1,1,0,
    0,1,1,0,
    0,1,1,0,
    1,0,0,1,
    1,0,0,1
  ],
  'Y': [
    1,0,0,1,
    1,0,0,1,
    0,1,1,0,
    0,0,1,0,
    0,0,1,0,
    0,0,1,0,
    0,0,1,0
  ],
  'Z': [
    1,1,1,1,
    0,0,0,1,
    0,0,1,0,
    0,1,1,0,
    0,1,0,0,
    1,0,0,0,
    1,1,1,1
  ],
  '-': [
    0,0,0,0,
    0,0,0,0,
    0,0,0,0,
    1,1,1,1,
    0,0,0,0,
    0,0,0,0,
    0,0,0,0
  ]
};

// Build dot grid for each digit container on load
var SB_DOTS = [[],[],[]];
(function initScoreboardDots() {
  for (var pos = 0; pos < 3; pos++) {
    var container = document.getElementById('sbDigit' + pos);
    if (!container) continue;
    container.innerHTML = '';
    for (var i = 0; i < 28; i++) {
      var dot = document.createElement('div');
      dot.className = 'sb-dot';
      container.appendChild(dot);
      SB_DOTS[pos].push(dot);
    }
  }
})();

function updateScoreboard(str, colorClass) {
  var cls = colorClass || 'on';
  var raw = (str || '').slice(-3);
  var digits = raw.padStart(3, ' ').split('');

  for (var pos = 0; pos < 3; pos++) {
    var ch = digits[pos];
    var pattern = ch && SB_FONT[ch] ? SB_FONT[ch] : null;
    for (var i = 0; i < 28; i++) {
      var dot = SB_DOTS[pos][i];
      if (!dot) continue;
      dot.classList.remove('on', 'on-green');
      if (pattern && pattern[i]) {
        dot.classList.add(cls);
      }
    }
  }
}


var _scoreboardShowingCallsign = false;

function showCallsignOnScoreboard(callsign) {
  _scoreboardShowingCallsign = true;
  var letters = callsign.split('');
  var GLITCH = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  var delay = 0;

  // Clear scoreboard first
  updateScoreboard('', 'on-green');

  for (var p = 0; p < 3; p++) {
    (function(pos, target) {
      var cycles = 6 + Math.floor(Math.random() * 4); // 6-9 random flaps
      var step = 0;
      var interval;

      setTimeout(function() {
        interval = setInterval(function() {
          if (!_scoreboardShowingCallsign) { clearInterval(interval); return; }
          step++;
          if (step <= cycles) {
            // Show random letter (flapper cycling effect)
            var rand = GLITCH[Math.floor(Math.random() * GLITCH.length)];
            updateSingleScoreboardDigit(pos, rand, 'on-green');
          } else {
            // Land on the real letter
            clearInterval(interval);
            updateSingleScoreboardDigit(pos, target, 'on-green');
          }
        }, 60);
      }, delay);

      delay += 250; // stagger each letter
    })(p, letters[p]);
  }
}

function updateSingleScoreboardDigit(pos, ch, colorClass) {
  var cls = colorClass || 'on';
  var pattern = ch && SB_FONT[ch] ? SB_FONT[ch] : null;
  for (var i = 0; i < 28; i++) {
    var dot = SB_DOTS[pos][i];
    if (!dot) continue;
    dot.classList.remove('on', 'on-green');
    if (pattern && pattern[i]) {
      dot.classList.add(cls);
    }
  }
}

function clearCallsignFromScoreboard() {
  if (!_scoreboardShowingCallsign) return;
  _scoreboardShowingCallsign = false;
  updateScoreboard('');
}


function setIdleCursor(on) {
  // display-row removed; no-op for backward compatibility
}

function setNumpadDisabled(disabled) {
  document.querySelectorAll('.np').forEach(function(b) {
    // Keep enter key enabled (it becomes NEW GAME when gameOver)
    if (b.dataset.action === 'enter') return;
    b.disabled = disabled;
  });
}

function updateDisplay() {
  updateScoreboard(GUESS.npBuffer);
}

function npPress(digit) {
  if (GUESS.gameOver) return;
  var maxDigits = String(GUESS.maxRange).length;
  if (GUESS.npBuffer.length >= maxDigits) return;
  if (digit === '0' && GUESS.npBuffer === '') return; // block leading zero
  clearCallsignFromScoreboard();
  GUESS.npBuffer += digit;
  updateDisplay();
}

function npBackspace() {
  if (GUESS.gameOver) return;
  GUESS.npBuffer = GUESS.npBuffer.slice(0, -1);
  updateDisplay();
}

function updateRangeDisplay() {
  var lo = document.getElementById('rangeLow');
  var hi = document.getElementById('rangeHigh');
  lo.textContent = '100';
  hi.textContent = '999';
}

function updateBattery(attemptsUsed) {
  var remaining = GUESS.MAX_GUESSES - attemptsUsed;
  var cells = document.querySelectorAll('.bulb');
  cells.forEach(function(cell, i) {
    cell.classList.remove('active', 'draining', 'tier-green', 'tier-amber', 'tier-red', 'last-bulb');
    var tier;
    if (remaining <= 2)      tier = 'tier-red';
    else if (remaining <= 4) tier = 'tier-amber';
    else                     tier = 'tier-green';
    cell.classList.add(tier);

    if (i < remaining) {
      cell.classList.add('active');
    } else if (i === remaining && attemptsUsed > 0) {
      cell.classList.add('draining');
    }
  });

  // Mark the sole surviving bulb for critical strobe
  if (remaining === 1) {
    cells[0].classList.add('last-bulb');
  }

}

function resetBattery() {
  var cells = document.querySelectorAll('.bulb');
  cells.forEach(function(cell) {
    cell.classList.remove('draining', 'last-bulb');
    cell.classList.add('active', 'tier-green');
    cell.classList.remove('tier-amber', 'tier-red');
  });
}

function resetBulbsSequence(onComplete) {
  var cells = document.querySelectorAll('.bulb');
  // Start all bulbs dark
  cells.forEach(function(cell) {
    cell.classList.remove('active', 'draining', 'last-bulb', 'tier-green', 'tier-amber', 'tier-red');
  });

  var delay = 150; // faster than battery's 500ms
  for (var i = 0; i < cells.length; i++) {
    (function(cell, d) {
      setTimeout(function() {
        cell.classList.add('active', 'tier-green');
      }, d);
    })(cells[i], (i + 1) * delay);
  }

  // Fire callback after all bulbs are lit
  var totalTime = (cells.length + 1) * delay;
  if (onComplete) {
    setTimeout(onComplete, totalTime);
  }
}

function flashDisplay(type) {
  var el = document.getElementById('log');
  el.classList.remove('flash-correct', 'flash-close', 'flash-far');
  void el.offsetWidth;
  el.classList.add('flash-' + type);
  el.addEventListener('animationend', function handler() {
    el.classList.remove('flash-correct', 'flash-close', 'flash-far');
    el.removeEventListener('animationend', handler);
  });
}

function batterySetCharges(n) {
  n = Math.max(0, Math.min(4, n));
  var housing = document.getElementById('batteryComponent');
  if (!housing) return;
  var prev = parseInt(housing.dataset.charges) || 0;
  housing.dataset.charges = n;
  // Fire static burst when dropping specifically to 2
  if (n === 2 && prev > 2) playBatteryWarningStatic();
  var isOvercharge = n === 4;
  var activeCells  = isOvercharge ? 3 : n;
  var mode = isOvercharge ? 'overcharge'
           : n === 3     ? 'charged'
           : n === 2     ? 'amber'
           : n === 1     ? 'red'
           : null;
  housing.classList.toggle('overcharge-active', isOvercharge);
  for (var i = 1; i <= 3; i++) {
    var cell = document.getElementById('cell-' + i);
    var dot  = document.getElementById('dot-' + i);
    if (!cell || !dot) continue;
    cell.classList.remove('charged', 'amber', 'red', 'overcharge', 'depleted');
    dot.classList.remove('charged', 'amber', 'red', 'overcharge', 'depleted');
    if (i <= activeCells && mode) {
      cell.classList.add(mode);
      dot.classList.add(mode);
    } else {
      cell.classList.add('depleted');
      dot.classList.add('depleted');
    }
  }
  storageSet(userKey('batteryLives'), GUESS.batteryLives);
}

function updateBatteryLives() {
  batterySetCharges(GUESS.batteryLives);
}

function chargeBatterySequence() {
  // Stagger: 0 → 1 → 2 → 3, each step ~500ms apart
  var steps = [1, 2, 3];
  for (var s = 0; s < steps.length; s++) {
    (function(level, delay) {
      setTimeout(function() {
        GUESS.batteryLives = level;
        batterySetCharges(level);
        playChargeBlip(level);
      }, delay);
    })(steps[s], (s + 1) * 500);
  }
}

function startupChargeSequence(targetLevel) {
  // Light up bulbs first (fast), then battery charges alongside
  var cells = document.querySelectorAll('.bulb');
  // Start all bulbs dark
  cells.forEach(function(cell) {
    cell.classList.remove('active', 'draining', 'last-bulb', 'tier-green', 'tier-amber', 'tier-red');
  });

  var bulbDelay = 120;
  for (var b = 0; b < cells.length; b++) {
    (function(cell, d) {
      setTimeout(function() {
        cell.classList.add('active', 'tier-green');
      }, d);
    })(cells[b], (b + 1) * bulbDelay);
  }

  // Charge battery cells up to targetLevel, starting after bulbs begin
  var batteryStart = 400;
  for (var s = 0; s < targetLevel; s++) {
    (function(level, delay) {
      setTimeout(function() {
        GUESS.batteryLives = level;
        batterySetCharges(level);
        playChargeBlip(level);
      }, delay);
    })(s + 1, batteryStart + s * 500);
  }
}

function shakeBattery() {
  var el = document.getElementById('batteryComponent');
  if (!el) return;
  el.classList.remove('shake');
  void el.offsetWidth;
  el.classList.add('shake');
  el.addEventListener('animationend', function handler() {
    el.classList.remove('shake');
    el.removeEventListener('animationend', handler);
  });
}

function initLayout() {
  // Start battery and bulbs visually empty -- will charge up on game start
  batterySetCharges(0);
  document.querySelectorAll('.bulb').forEach(function(cell) {
    cell.classList.remove('active', 'tier-green', 'tier-amber', 'tier-red', 'draining', 'last-bulb');
  });
  document.getElementById('rangeLow').textContent = '100';
  document.getElementById('rangeHigh').textContent = '999';
  setNumpadDisabled(true);
}
