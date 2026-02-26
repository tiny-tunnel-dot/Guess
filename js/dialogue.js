// dialogue.js — Log function, dialogue pools, hint selection (Mastermind v7.0)

// === LOG FUNCTIONS ===

function log(type, message) {
  var el = document.createElement('div');
  el.className = 'log-line ' + type;
  el.textContent = message;
  var logEl = document.getElementById('log');
  logEl.appendChild(el);
  logEl.scrollTop = logEl.scrollHeight;
}

function logHTML(type, html) {
  var el = document.createElement('div');
  el.className = 'log-line ' + type;
  el.innerHTML = html;
  var logEl = document.getElementById('log');
  logEl.appendChild(el);
  logEl.scrollTop = logEl.scrollHeight;
}

function typeLog(type, message, speed) {
  speed = speed || 38;
  var el = document.createElement('div');
  el.className = 'log-line ' + type + ' typing';
  el.textContent = '';
  var logEl = document.getElementById('log');
  logEl.appendChild(el);

  var i = 0;
  function tick() {
    if (i < message.length) {
      el.textContent += message[i];
      i++;
      logEl.scrollTop = logEl.scrollHeight;
      setTimeout(tick, speed);
    } else {
      el.classList.remove('typing');
    }
  }
  tick();
}

function clearLog() {
  document.getElementById('log').innerHTML = '';
}

// === GUESS HISTORY DISPLAY ===

function logGuessResult(guessStr, score, attemptNum) {
  var digits = guessStr.split('');
  var html = '<span class="guess-num">' + attemptNum + '</span>';

  for (var i = 0; i < digits.length; i++) {
    html += '<span class="digit-cell digit-' + score.results[i] + '">' + digits[i] + '</span>';
  }

  html += '<span class="guess-summary">';
  if (score.locked > 0) html += '<span class="sum-locked">' + score.locked + 'L</span> ';
  if (score.found > 0) html += '<span class="sum-found">' + score.found + 'F</span> ';
  if (score.miss > 0) html += '<span class="sum-miss">' + score.miss + 'M</span>';
  html += '</span>';

  logHTML('guess-result', html);
}

// === 4-TIER ACCURACY-BASED DIALOGUE POOLS ===
// Hot:  2+ locked — "almost cracked it"
// Warm: 1 locked + found, or 2+ found — "making progress"
// Cool: 1 locked or 1 found only — "faint signal"
// Cold: 0 locked, 0 found — "nothing"

var hotPool = [
  '> NEARLY DECODED. two signals locked.',
  '> two positions confirmed. one digit remains.',
  '> strong lock. two channels aligned.',
  '> code nearly cracked. just one off.',
  '> 2/3 locked. the last digit is within reach.',
  '> transmission almost clear. one more correction.',
  '> so close. two locks holding. find the third.',
  '> nearly there. two digits seated perfectly.',
  '> partial decode successful. one signal outstanding.',
  '> two-thirds of the code is yours.'
];

var warmPool = [
  '> partial lock. signals detected but misaligned.',
  '> you have correct digits. some need repositioning.',
  '> data fragments found. keep rearranging.',
  '> the right pieces are in play. reorder them.',
  '> mixed signals. progress, but not complete.',
  '> some channels aligning. keep working.',
  '> you\'re carrying valid data. wrong slots.',
  '> signal improving. positions need work.',
  '> good digit selection. placement is off.',
  '> the code recognizes some of your input.'
];

var coolPool = [
  '> faint signal. fragments only.',
  '> scattered reading. slim evidence.',
  '> minimal contact. barely a trace.',
  '> thin data. not much to work with.',
  '> weak signal. the code barely noticed you.',
  '> trace detection. one thread to pull.',
  '> whisper of a signal. dig deeper.',
  '> partial contact. barely scratching the surface.',
  '> slim pickings. the code isn\'t impressed.',
  '> one small thread. follow it carefully.'
];

var coldPool = [
  '> nothing. dead silence across all channels.',
  '> total miss. none of those digits exist in the code.',
  '> void. these numbers are strangers to the signal.',
  '> three strikes. not a single match.',
  '> absolute blackout. try completely different digits.',
  '> the code doesn\'t recognize anything you sent.',
  '> empty. wrong digits entirely.',
  '> zero contact. start fresh with new numbers.',
  '> static. every digit was wrong.',
  '> the signal rejected everything. rethink.'
];

// === DIALOGUE POOL SELECTION HELPER ===

function selectDialoguePool(tier) {
  return tier === 'hot' ? hotPool
       : tier === 'warm' ? warmPool
       : tier === 'cool' ? coolPool
       : coldPool;
}

// === COMPARATIVE FEEDBACK ARRAYS (accuracy delta) ===

var compSame = [
  '> ...same accuracy. lateral move.',
  '> no improvement. try a different approach.',
  '> signal unchanged. reconsider your digits.',
  '> flat reading. you need new information.',
  '> treading water. break the pattern.'
];
var compCloser = [
  '> ...accuracy improving.',
  '> better read than last time.',
  '> signal strengthening. you\'re converging.',
  '> correction acknowledged. tighter lock.',
  '> narrowing the gap.',
  '> that moved the needle.',
  '> upgrade detected.',
  '> closer to the code.'
];
var compFarther = [
  '> ...accuracy dropped.',
  '> you had a better read before.',
  '> signal degraded. bad trade.',
  '> regression detected.',
  '> that was a step backward.',
  '> you lost ground. recalibrate.',
  '> worse than your last attempt.',
  '> you\'re drifting from the signal.'
];

// === STREAK RECOGNITION ARRAYS ===

var streakPositive = [
  '> you\'re cracking it open.',
  '> methodical. i respect that.',
  '> systematic approach. keep it up.',
  '> each guess tighter than the last.',
  '> the code is yielding to you.'
];
var streakNegative = [
  '> are you guessing or panicking?',
  '> strategy would help here.',
  '> you\'re spiraling. reset your approach.',
  '> each guess worse than the last.',
  '> the code is slipping further away.'
];

// === GUESS PRESSURE ARRAYS ===

var pressure3 = [
  '> 3 attempts remaining. narrow it down.',
  '> reserves depleting. choose wisely.',
  '> three shots left. make them surgical.'
];
var pressure2 = [
  '> 2 attempts remaining. make them count.',
  '> critical reserves. no room for error.',
  '> penultimate attempt. think.'
];
var pressure1 = [
  '> FINAL ATTEMPT. make it matter.',
  '> last signal. this is it.',
  '> one shot left. don\'t waste it.'
];
