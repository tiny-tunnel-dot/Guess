// dialogue.js — Log function, dialogue pools, hint selection

// === LOG FUNCTIONS ===

function log(type, message) {
  const el = document.createElement('div');
  el.className = `log-line ${type}`;
  el.textContent = message;
  const logEl = document.getElementById('log');
  logEl.appendChild(el);
  logEl.scrollTop = logEl.scrollHeight;
}

function typeLog(type, message, speed) {
  speed = speed || 38;
  const el = document.createElement('div');
  el.className = `log-line ${type} typing`;
  el.textContent = '';
  const logEl = document.getElementById('log');
  logEl.appendChild(el);

  let i = 0;
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

// === 5-TIER DIALOGUE POOLS ===

var burningLow = [
  '> PROXIMITY BREACH. target RIGHT above you.',
  '> signal deafening. increment. now.',
  '> you are on top of it. nudge higher.',
  '> contact imminent. barely above.',
  '> reading off the charts. push up.',
  '> the target can hear you. go up.',
  '> i — just a little higher.',
  '> interference. too close to resolve. up.',
  '> any lower and you pass through it.',
  '> SYSTEM OVERLOAD. just above current.'
];
var burningHigh = [
  '> PROXIMITY BREACH. target RIGHT below you.',
  '> signal deafening. decrement. now.',
  '> you are on top of it. nudge lower.',
  '> contact imminent. barely below.',
  '> reading off the charts. pull back.',
  '> the target can hear you. go down.',
  '> i — just a little lower.',
  '> interference. too close to resolve. down.',
  '> any higher and you pass through it.',
  '> SYSTEM OVERLOAD. just below current.'
];

var hotLow = [
  '> strong signal. you\'re close. higher.',
  '> almost locked on. adjust upward.',
  '> target near. single-digit correction. higher.',
  '> i can feel it from here. push up.',
  '> we\'re in the zone. go higher.',
  '> solid read. not far. increment.',
  '> signal clear and climbing. higher.',
  '> you\'re circling it. bump up.',
  '> nearly there. raise your position.',
  '> tight window. shift upward.'
];
var hotHigh = [
  '> strong signal. you\'re close. lower.',
  '> almost locked on. adjust downward.',
  '> target near. single-digit correction. lower.',
  '> i can feel it from here. pull back.',
  '> we\'re in the zone. go lower.',
  '> solid read. not far. decrement.',
  '> signal clear and descending. lower.',
  '> you\'re circling it. nudge down.',
  '> nearly there. drop your position.',
  '> tight window. shift downward.'
];

var warmLow = [
  '> signal detected. target above current position.',
  '> positive read. adjust upward.',
  '> you\'re in range. keep searching higher.',
  '> tracking. target is above you.',
  '> measurable signal. increment recommended.',
  '> contact ahead. raise trajectory.',
  '> reading moderate. push higher.',
  '> on approach. continue upward.',
  '> directional lock acquired. go higher.',
  '> target within operational range. higher.'
];
var warmHigh = [
  '> signal detected. target below current position.',
  '> positive read. adjust downward.',
  '> you\'re in range. keep searching lower.',
  '> tracking. target is below you.',
  '> measurable signal. decrement recommended.',
  '> contact below. lower trajectory.',
  '> reading moderate. pull lower.',
  '> on approach. continue downward.',
  '> directional lock acquired. go lower.',
  '> target within operational range. lower.'
];

var coolLow = [
  '> weak signal. target is higher.',
  '> insufficient. recalibrate upward.',
  '> below threshold. significant adjustment needed.',
  '> minimal read. target well above position.',
  '> you\'re not close. search higher.',
  '> faint trace. go up. considerably.',
  '> reading low-confidence. push higher.',
  '> scanner shows activity well above you.',
  '> not in range yet. keep climbing.',
  '> sparse data. target substantially higher.'
];
var coolHigh = [
  '> weak signal. target is lower.',
  '> exceeded. recalibrate downward.',
  '> above threshold. significant adjustment needed.',
  '> minimal read. target well below position.',
  '> you\'re not close. search lower.',
  '> faint trace. go down. considerably.',
  '> reading low-confidence. pull lower.',
  '> scanner shows activity well below you.',
  '> not in range yet. keep descending.',
  '> sparse data. target substantially lower.'
];

var coldLow = [
  '> nothing. target is much higher.',
  '> are you even trying? search higher.',
  '> signal void. nowhere near target. go up.',
  '> waste of a guess. considerably higher.',
  '> impressive. spectacularly wrong. higher.',
  '> i don\'t even have a read at this range.',
  '> you\'re searching in the dark. much higher.',
  '> did you forget we\'re looking for something?',
  '> that\'s not in the neighborhood. go up.',
  '> the target doesn\'t know you exist. higher.'
];
var coldHigh = [
  '> nothing. target is much lower.',
  '> are you even trying? search lower.',
  '> signal void. nowhere near target. go down.',
  '> waste of a guess. considerably lower.',
  '> impressive. spectacularly wrong. lower.',
  '> i don\'t even have a read at this range.',
  '> you\'re searching in the dark. much lower.',
  '> did you forget we\'re looking for something?',
  '> that\'s not in the neighborhood. go down.',
  '> the target doesn\'t know you exist. lower.'
];

// === DIALOGUE POOL SELECTION HELPER ===

function selectDialoguePool(tier, isLow) {
  if (isLow) {
    return tier === 'burning' ? burningLow
         : tier === 'hot' ? hotLow
         : tier === 'warm' ? warmLow
         : tier === 'cool' ? coolLow
         : coldLow;
  } else {
    return tier === 'burning' ? burningHigh
         : tier === 'hot' ? hotHigh
         : tier === 'warm' ? warmHigh
         : tier === 'cool' ? coolHigh
         : coldHigh;
  }
}

// === COMPARATIVE FEEDBACK ARRAYS ===

var compSame = [
  '> ...same distance. different side maybe?',
  '> lateral move. no closer, no farther.',
  '> delta unchanged. try a different angle.',
  '> you moved but the signal didn\'t.',
  '> parallel track. break the pattern.'
];
var compCloser = [
  '> ...closer than last time.',
  '> delta shrinking. keep going.',
  '> trajectory improving.',
  '> you\'re converging.',
  '> better. much better.',
  '> correction acknowledged. signal strengthening.',
  '> narrowing the gap.',
  '> that moved the needle.'
];
var compFarther = [
  '> ...farther than before.',
  '> wrong direction.',
  '> signal degrading. you overcorrected.',
  '> that was worse. recalibrate.',
  '> delta growing. reverse course.',
  '> you had a better read last time.',
  '> regression detected.',
  '> you\'re drifting.'
];

// === STREAK RECOGNITION ARRAYS ===

var streakPositive = [
  '> you\'re hunting it down.',
  '> methodical. i respect that.',
  '> systematic approach. keep it up.',
  '> you\'ve locked onto a vector.',
  '> the signal is following you now.'
];
var streakNegative = [
  '> are you guessing or panicking?',
  '> strategy would help here.',
  '> you\'re spiraling. reset your approach.',
  '> each guess worse than the last.',
  '> the target is running away from you.'
];

// === GUESS PRESSURE ARRAYS ===

var pressure3 = [
  '> 3 guesses left. narrow it down.',
  '> reserves depleting. choose wisely.',
  '> halfway through your ammo.'
];
var pressure2 = [
  '> 2 guesses remaining. make them count.',
  '> critical reserves. no room for error.',
  '> penultimate attempt. think.'
];
var pressure1 = [
  '> FINAL GUESS. make it matter.',
  '> last signal. this is it.',
  '> one shot left. don\'t waste it.'
];
