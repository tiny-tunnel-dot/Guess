// tutorial.js — First-time player tutorial system

function showTutorial(callsign, onComplete) {
  var housing = document.querySelector('.housing');
  var stepIndex = 0;
  var advancing = false;
  var tutorialActive = true;

  // Add tutorial class to housing for stacking context
  housing.classList.add('tutorial-active');

  // Dim overlay inside housing (same stacking context)
  var dim = document.createElement('div');
  dim.className = 'tutorial-dim';
  housing.appendChild(dim);

  // Text box inside housing
  var textBox = document.createElement('div');
  textBox.className = 'tutorial-text-box';
  textBox.style.bottom = '20px';
  housing.appendChild(textBox);

  // Skip button inside housing
  var skipBtn = document.createElement('button');
  skipBtn.className = 'tutorial-skip';
  skipBtn.textContent = 'SKIP';
  housing.appendChild(skipBtn);

  function setMessage(msg, stepNum, totalSteps) {
    textBox.innerHTML =
      '<div class="tutorial-message">' + msg + '</div>' +
      '<div class="tutorial-tap">tap to continue</div>' +
      '<div class="tutorial-step-counter">' + stepNum + ' / ' + totalSteps + '</div>';
  }

  function setFinalMessage(msg) {
    textBox.innerHTML =
      '<div class="tutorial-message">' + msg + '</div>' +
      '<div class="tutorial-tap">tap to start</div>';
  }

  function highlightElement(el) {
    if (el) el.classList.add('tutorial-highlight');
  }
  function unhighlightAll() {
    document.querySelectorAll('.tutorial-highlight').forEach(function(el) {
      el.classList.remove('tutorial-highlight');
    });
    document.querySelectorAll('.tutorial-focus').forEach(function(el) {
      el.classList.remove('tutorial-focus');
    });
    document.querySelectorAll('.tutorial-scoreboard-pulse').forEach(function(el) {
      el.classList.remove('tutorial-scoreboard-pulse');
    });
  }

  function positionText(position, refElement) {
    textBox.style.top = '';
    textBox.style.bottom = '';
    textBox.style.left = '50%';
    textBox.style.right = '';
    textBox.style.transform = 'translateX(-50%)';
    textBox.style.maxWidth = '340px';
    if (position === 'belowElement' && refElement) {
      // Position right below a specific element
      var refRect = refElement.getBoundingClientRect();
      var housingRect = housing.getBoundingClientRect();
      var topOffset = refRect.bottom - housingRect.top + 6;
      textBox.style.top = topOffset + 'px';
    } else if (position === 'aboveElement' && refElement) {
      var refRect = refElement.getBoundingClientRect();
      var housingRect = housing.getBoundingClientRect();
      var bottomOffset = housingRect.bottom - refRect.top + 6;
      textBox.style.bottom = bottomOffset + 'px';
    } else if (position === 'top') {
      textBox.style.top = '12px';
    } else if (position === 'middle') {
      textBox.style.top = '50%';
      textBox.style.transform = 'translate(-50%, -50%)';
    } else {
      textBox.style.bottom = '20px';
    }
  }

  var TOTAL_STEPS = 7;
  var step3WaitingForInput = false;

  // === STEP DEFINITIONS ===

  function step1_searchRange() {
    var rangeBox = document.querySelector('.range-box');
    unhighlightAll();
    highlightElement(rangeBox);
    rangeBox.classList.add('tutorial-focus');
    positionText('belowElement', rangeBox);
    setMessage('This is your search range. It starts at 1–100 and expands +25 every time you win.', 1, TOTAL_STEPS);

    var hiEl = document.getElementById('rangeHigh');
    var loEl = document.getElementById('rangeLow');
    loEl.textContent = '1';
    hiEl.textContent = '100';

    setTimeout(function() {
      if (!tutorialActive || stepIndex !== 0) return;
      hiEl.classList.add('ticking');
      var current = 100;
      var iv = setInterval(function() {
        if (!tutorialActive || stepIndex !== 0) { clearInterval(iv); return; }
        current += 5;
        if (current >= 125) {
          current = 125;
          clearInterval(iv);
          hiEl.textContent = current;
          hiEl.classList.remove('ticking');
          hiEl.classList.remove('expand-land');
          void hiEl.offsetWidth;
          hiEl.classList.add('expand-land');
          playRangeLand();

          setTimeout(function() {
            if (!tutorialActive || stepIndex !== 0) return;
            hiEl.classList.add('ticking');
            var back = 125;
            var iv2 = setInterval(function() {
              if (!tutorialActive || stepIndex !== 0) { clearInterval(iv2); hiEl.classList.remove('ticking'); return; }
              back -= 5;
              if (back <= 100) {
                back = 100;
                clearInterval(iv2);
                hiEl.textContent = back;
                hiEl.classList.remove('ticking');
              } else {
                hiEl.textContent = back;
              }
            }, 80);
          }, 800);
        } else {
          hiEl.textContent = current;
          playRangeTick((current - 100) / 25);
        }
      }, 100);
    }, 500);
  }

  function step2_dialogueLog() {
    unhighlightAll();
    var logEl = document.getElementById('log');
    highlightElement(logEl);
    positionText('belowElement', logEl);
    setMessage('The system talks to you here. The tone changes based on how close your guess is. Learn to read it.', 2, TOTAL_STEPS);

    clearLog();
    setTimeout(function() {
      if (!tutorialActive || stepIndex !== 1) return;
      flashDisplay('far');
      typeLog('hint', '> nothing. target is much higher.', 30);
    }, 400);
    setTimeout(function() {
      if (!tutorialActive || stepIndex !== 1) return;
      flashDisplay('close');
      typeLog('hint', '> signal detected. target above current position.', 30);
    }, 1800);
    setTimeout(function() {
      if (!tutorialActive || stepIndex !== 1) return;
      flashDisplay('close');
      typeLog('hint', '> PROXIMITY BREACH. target RIGHT above you.', 30);
    }, 3200);
  }

  function step3_numpadScoreboard() {
    unhighlightAll();
    clearLog();
    var keypadWell = document.querySelector('.keypad-well');
    var scoreHousing = document.getElementById('scoreboardHousing');
    highlightElement(keypadWell);
    if (scoreHousing) highlightElement(scoreHousing);

    // Show amber dashes on scoreboard and pulse it
    updateScoreboard('---');
    if (scoreHousing) {
      scoreHousing.classList.add('tutorial-scoreboard-pulse');
    }

    // Position above keypad, aligned left so scoreboard stays visible
    var keypadRect = keypadWell.getBoundingClientRect();
    var housingRect = housing.getBoundingClientRect();
    var bottomOffset = housingRect.bottom - keypadRect.top + 6;
    textBox.style.top = '';
    textBox.style.bottom = bottomOffset + 'px';
    textBox.style.left = '16px';
    textBox.style.right = '';
    textBox.style.transform = 'none';
    textBox.style.maxWidth = '65%';

    setMessage('Type a number on the numpad, then press ENTER to continue.', 3, TOTAL_STEPS);
    textBox.querySelector('.tutorial-tap').textContent = 'waiting for input...';

    // Block tap-to-advance on this step, auto-advance on ENTER after input
    step3WaitingForInput = true;
  }

  function step4_powerBulbs() {
    unhighlightAll();
    GUESS.npBuffer = '';
    updateDisplay();
    var bulbCenter = document.querySelector('.bulb-strip-center');
    highlightElement(bulbCenter);
    positionText('belowElement', bulbCenter);
    setMessage('These 7 bulbs are your guesses. One burns out with each attempt. Run out and you lose the round.', 4, TOTAL_STEPS);

    var bulbs = document.querySelectorAll('.bulb');
    // Start all lit
    bulbs.forEach(function(b) {
      b.classList.remove('draining', 'tier-amber', 'tier-red');
      b.classList.add('active', 'tier-green');
    });
    var drainIndex = 0;

    function drainNext() {
      if (!tutorialActive || stepIndex !== 3) return;
      if (drainIndex >= bulbs.length) {
        setTimeout(function() {
          if (!tutorialActive || stepIndex !== 3) return;
          bulbs.forEach(function(b) {
            b.classList.remove('active', 'tier-green', 'tier-amber', 'tier-red', 'draining');
          });
          var ri = 0;
          var rIv = setInterval(function() {
            if (!tutorialActive || stepIndex !== 3) { clearInterval(rIv); return; }
            if (ri >= bulbs.length) { clearInterval(rIv); return; }
            bulbs[ri].classList.add('active', 'tier-green');
            ri++;
          }, 100);
        }, 600);
        return;
      }

      var remaining = bulbs.length - drainIndex;
      var tier = remaining <= 2 ? 'tier-red' : remaining <= 4 ? 'tier-amber' : 'tier-green';
      bulbs.forEach(function(b, i) {
        b.classList.remove('tier-green', 'tier-amber', 'tier-red', 'draining');
        if (i < remaining - 1) {
          b.classList.add('active', tier);
        } else if (i === remaining - 1) {
          b.classList.add('draining', tier);
        } else {
          b.classList.remove('active');
        }
      });
      drainIndex++;
      setTimeout(drainNext, 250);
    }

    setTimeout(drainNext, 600);
  }

  function step5_battery() {
    unhighlightAll();
    document.querySelectorAll('.bulb').forEach(function(b) {
      b.classList.remove('draining', 'tier-amber', 'tier-red');
      b.classList.add('active', 'tier-green');
    });

    var batteryEl = document.getElementById('batteryComponent');
    highlightElement(batteryEl);
    positionText('belowElement', batteryEl);
    setMessage('You have 3 lives. Lose a round and you lose a cell. Win and earn one back. Lose all 3 and your range and streak reset.', 5, TOTAL_STEPS);

    // Drain all 3 cells one by one, then recharge back up
    batterySetCharges(3);
    setTimeout(function() {
      if (!tutorialActive || stepIndex !== 4) return;
      batterySetCharges(2);
      playBatteryWarningStatic();
    }, 800);
    setTimeout(function() {
      if (!tutorialActive || stepIndex !== 4) return;
      batterySetCharges(1);
      playBatteryWarningStatic();
    }, 1600);
    setTimeout(function() {
      if (!tutorialActive || stepIndex !== 4) return;
      batterySetCharges(0);
      playBatteryWarningStatic();
    }, 2400);
    // Recharge back up
    setTimeout(function() {
      if (!tutorialActive || stepIndex !== 4) return;
      batterySetCharges(1);
      playChargeBlip(1);
    }, 3400);
    setTimeout(function() {
      if (!tutorialActive || stepIndex !== 4) return;
      batterySetCharges(2);
      playChargeBlip(2);
    }, 3900);
    setTimeout(function() {
      if (!tutorialActive || stepIndex !== 4) return;
      batterySetCharges(3);
      playChargeBlip(3);
    }, 4400);
  }

  function step6_statsPanel() {
    unhighlightAll();
    batterySetCharges(3);

    var statsPanel = document.getElementById('stats-panel');
    var statsHandle = document.getElementById('stats-handle');
    highlightElement(statsPanel);
    if (statsHandle) highlightElement(statsHandle);

    // Position text box on the left side, vertically centered in terminal
    var housingRect = housing.getBoundingClientRect();
    textBox.style.top = (housingRect.height * 0.25) + 'px';
    textBox.style.bottom = '';
    textBox.style.left = '12px';
    textBox.style.right = '';
    textBox.style.transform = 'none';
    textBox.style.maxWidth = '45%';

    setMessage('Your stats live here. Pull this tab anytime.', 6, TOTAL_STEPS);

    statsPanel.style.visibility = 'visible';
    statsHandle.classList.add('visible');
    if (window.refreshStatsPanel) window.refreshStatsPanel();

    setTimeout(function() {
      if (!tutorialActive || stepIndex !== 5) return;
      if (window.openStatsPanel) window.openStatsPanel();
    }, 500);

    setTimeout(function() {
      if (!tutorialActive || stepIndex !== 5) return;
      if (window.closeStatsPanel) window.closeStatsPanel();
    }, 3000);
  }

  function step7_go() {
    unhighlightAll();
    positionText('middle');
    setFinalMessage('Find the number. Read the signals. Good luck.');
    skipBtn.style.display = 'none';
  }

  var steps = [step1_searchRange, step2_dialogueLog, step3_numpadScoreboard, step4_powerBulbs, step5_battery, step6_statsPanel, step7_go];

  function advance() {
    if (advancing) return;
    advancing = true;

    stepIndex++;
    if (stepIndex >= steps.length) {
      finish();
      return;
    }

    setTimeout(function() {
      steps[stepIndex]();
      advancing = false;
    }, 200);
  }

  function finish() {
    tutorialActive = false;
    unhighlightAll();
    housing.classList.remove('tutorial-active');
    dim.remove();
    textBox.remove();
    skipBtn.remove();

    clearLog();
    document.getElementById('rangeLow').textContent = '1';
    document.getElementById('rangeHigh').textContent = '100';
    document.getElementById('rangeHigh').classList.remove('ticking', 'expand-land');
    batterySetCharges(0);
    document.querySelectorAll('.bulb').forEach(function(b) {
      b.classList.remove('active', 'tier-green', 'tier-amber', 'tier-red', 'draining');
    });
    GUESS.npBuffer = '';
    updateDisplay();

    document.getElementById('stats-panel').style.visibility = 'hidden';
    document.getElementById('stats-handle').classList.remove('visible');
    if (window.closeStatsPanel) window.closeStatsPanel();

    storageSet(userKey('tutorialDone'), '1');
    onComplete();
  }

  // Tap handlers - tapping anywhere advances (except step 3)
  function tutTapHandler(e) {
    if (!tutorialActive) {
      document.removeEventListener('click', tutTapHandler, true);
      return;
    }
    // Don't advance if tapping skip button
    if (skipBtn.contains(e.target)) return;
    // Step 3: only numpad keys and enter work, no tap-to-advance
    if (step3WaitingForInput) {
      var btn = e.target.closest('.np');
      if (btn && btn.dataset.action === 'enter' && GUESS.npBuffer.length > 0) {
        // They typed something and hit enter, advance
        step3WaitingForInput = false;
        advance();
        return;
      }
      // Allow numpad digit/backspace clicks to pass through (don't advance)
      return;
    }
    advance();
  }
  document.addEventListener('click', tutTapHandler, true);

  skipBtn.addEventListener('click', function(e) {
    e.stopPropagation();
    finish();
  });

  // Keyboard advance
  function tutKeyHandler(e) {
    if (!tutorialActive) {
      document.removeEventListener('keydown', tutKeyHandler);
      return;
    }
    if (step3WaitingForInput) {
      // Only advance on Enter if they've typed something
      if (e.key === 'Enter' && GUESS.npBuffer.length > 0) {
        e.preventDefault();
        step3WaitingForInput = false;
        advance();
      }
      return;
    }
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      advance();
    }
  }
  document.addEventListener('keydown', tutKeyHandler);

  // Start step 1
  steps[0]();
}
