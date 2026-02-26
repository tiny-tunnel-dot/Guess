// stats.js — localStorage helpers, stats panel

function storageGet(key) {
  try { return localStorage.getItem(key); } catch(e) { return null; }
}
function storageSet(key, val) {
  try { localStorage.setItem(key, val); } catch(e) {}
}
function storageRemove(key) {
  try { localStorage.removeItem(key); } catch(e) {}
}

// Namespace all game data under the active user
function userKey(key) {
  return 'user:' + GUESS.currentUser + ':' + key;
}

// Stats panel
(function() {
  var panel  = document.getElementById('stats-panel');
  var handle = document.getElementById('stats-handle');
  var isOpen = false;

  function openPanel() {
    panel.classList.add('open');
    handle.classList.add('open');
    isOpen = true;
    updateStatsPanel();
  }
  function closePanel() {
    panel.classList.remove('open');
    handle.classList.remove('open');
    isOpen = false;
  }
  function updateStatsPanel() {
    document.getElementById('stats-callsign').textContent = GUESS.currentUser || '---';
    document.getElementById('stats-best').textContent =
      GUESS.currentUser ? (storageGet(userKey('bestScore')) || '--') : '--';
    document.getElementById('stats-played').textContent =
      GUESS.currentUser ? (storageGet(userKey('gamesPlayed')) || '0') : '0';

    // Win rate
    if (GUESS.currentUser) {
      var played = parseInt(storageGet(userKey('gamesPlayed'))) || 0;
      var wins = parseInt(storageGet(userKey('wins'))) || 0;
      var rate = played > 0 ? Math.round((wins / played) * 100) : 0;
      document.getElementById('stats-winrate').textContent = rate + '%';
    } else {
      document.getElementById('stats-winrate').textContent = '--%';
    }

    // Current streak
    if (GUESS.currentUser) {
      var streak = parseInt(storageGet(userKey('currentStreak'))) || 0;
      document.getElementById('stats-streak').textContent = streak;
    } else {
      document.getElementById('stats-streak').textContent = '--';
    }

    // Mode and best streak
    document.getElementById('stats-maxrange').textContent = '3-DIGIT';
    if (GUESS.currentUser) {
      var bestStreak = parseInt(storageGet(userKey('bestStreak'))) || 0;
      document.getElementById('stats-peakrange').textContent = bestStreak;
    } else {
      document.getElementById('stats-peakrange').textContent = '0';
    }
  }

  handle.addEventListener('click', function(e) {
    e.stopPropagation();
    isOpen ? closePanel() : openPanel();
  });

  document.addEventListener('click', function(e) {
    if (isOpen && !panel.contains(e.target)) closePanel();
  });

  var swipeStartX = 0;
  panel.addEventListener('pointerdown', function(e) { swipeStartX = e.clientX; });
  panel.addEventListener('pointerup', function(e) {
    if (e.clientX - swipeStartX > 40) closePanel();
  });

  window.refreshStatsPanel = updateStatsPanel;
  window.openStatsPanel = openPanel;
  window.closeStatsPanel = closePanel;
})();
