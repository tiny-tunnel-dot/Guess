// audio.js — AudioContext + all sound functions

var audioCtx = null;

function getAudioCtx() {
  if (!audioCtx) {
    try { audioCtx = new (window.AudioContext || window.webkitAudioContext)(); }
    catch(e) { return null; }
  }
  return audioCtx;
}

// withAudio: creates nodes immediately (scheduled against currentTime),
// then ensures context is running. Works whether ctx is suspended or not --
// scheduled nodes play as soon as ctx resumes.
function withAudio(fn) {
  var ctx = getAudioCtx();
  fn(ctx);
  if (ctx.state === 'suspended') ctx.resume();
}

function playClick(type) {
  withAudio(function(ctx) {
    var now = ctx.currentTime;

    var bufSize = ctx.sampleRate * 0.025;
    var buf = ctx.createBuffer(1, bufSize, ctx.sampleRate);
    var data = buf.getChannelData(0);
    for (var i = 0; i < bufSize; i++) data[i] = (Math.random() * 2 - 1);

    var noise = ctx.createBufferSource();
    noise.buffer = buf;

    var bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = type === 'enter' ? 5000 : 7000;
    bp.Q.value = type === 'enter' ? 2.0 : 3.0;

    var hp = ctx.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.value = type === 'enter' ? 2800 : 3500;

    var gain = ctx.createGain();
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(type === 'enter' ? 0.4 : 0.3, now + 0.001);
    gain.gain.exponentialRampToValueAtTime(0.001, now + (type === 'enter' ? 0.018 : 0.012));

    noise.connect(bp);
    bp.connect(hp);
    hp.connect(gain);
    gain.connect(ctx.destination);
    noise.start(now);
    noise.stop(now + 0.04);

    var osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(type === 'enter' ? 900 : 1400, now);
    osc.frequency.exponentialRampToValueAtTime(type === 'enter' ? 450 : 700, now + 0.015);

    var oscGain = ctx.createGain();
    oscGain.gain.setValueAtTime(type === 'enter' ? 0.06 : 0.04, now);
    oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.012);

    osc.connect(oscGain);
    oscGain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.015);
  });
}

function playChargeBlip(level) {
  withAudio(function(ctx) {
    var now = ctx.currentTime;

    // Base frequency rises with each cell
    var freq = level === 1 ? 80 : level === 2 ? 120 : 160;
    var blipFreq = level === 1 ? 440 : level === 2 ? 587 : 784;

    // Buzzing warmup hum: low sawtooth building up
    var hum = ctx.createOscillator();
    hum.type = 'sawtooth';
    hum.frequency.setValueAtTime(freq, now);
    hum.frequency.linearRampToValueAtTime(freq * 2, now + 0.3);

    var humGain = ctx.createGain();
    humGain.gain.setValueAtTime(0, now);
    humGain.gain.linearRampToValueAtTime(0.06 + level * 0.02, now + 0.25);
    humGain.gain.linearRampToValueAtTime(0, now + 0.35);

    // Electrical buzz texture: square wave at mains-like frequency
    var buzz = ctx.createOscillator();
    buzz.type = 'square';
    buzz.frequency.setValueAtTime(60, now);

    var buzzGain = ctx.createGain();
    buzzGain.gain.setValueAtTime(0, now);
    buzzGain.gain.linearRampToValueAtTime(0.015 + level * 0.005, now + 0.2);
    buzzGain.gain.linearRampToValueAtTime(0, now + 0.35);

    // Confirmation blip at the end of the warmup
    var blip = ctx.createOscillator();
    blip.type = 'square';
    blip.frequency.setValueAtTime(blipFreq, now + 0.28);
    blip.frequency.linearRampToValueAtTime(blipFreq * 1.05, now + 0.34);

    var blipGain = ctx.createGain();
    blipGain.gain.setValueAtTime(0, now + 0.28);
    blipGain.gain.linearRampToValueAtTime(0.1, now + 0.288);
    blipGain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

    var lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 1800;

    hum.connect(humGain);
    buzz.connect(buzzGain);
    blip.connect(blipGain);
    humGain.connect(lp);
    buzzGain.connect(lp);
    blipGain.connect(lp);
    lp.connect(ctx.destination);

    hum.start(now);
    hum.stop(now + 0.36);
    buzz.start(now);
    buzz.stop(now + 0.36);
    blip.start(now + 0.28);
    blip.stop(now + 0.42);
  });
}

function playBatteryWarningStatic() {
  withAudio(function(ctx) {
    var now = ctx.currentTime;

    // Sharp noise burst — the zap body
    var bufSize = Math.floor(ctx.sampleRate * 0.08);
    var buf = ctx.createBuffer(1, bufSize, ctx.sampleRate);
    var data = buf.getChannelData(0);
    for (var j = 0; j < bufSize; j++) data[j] = (Math.random() * 2 - 1);
    var noise = ctx.createBufferSource();
    noise.buffer = buf;

    // High bandpass — cuts the low rumble, keeps the crackle bite
    var hp = ctx.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.value = 3000;

    var bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = 6000;
    bp.Q.value = 1.5;

    var noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0, now);
    noiseGain.gain.linearRampToValueAtTime(0.8, now + 0.001); // instant attack
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.07); // fast decay

    noise.connect(hp);
    hp.connect(bp);
    bp.connect(noiseGain);
    noiseGain.connect(ctx.destination);
    noise.start(now);
    noise.stop(now + 0.09);

    // Tonal zap — pitch-swept sine that drops fast
    var osc = ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(1800, now);
    osc.frequency.exponentialRampToValueAtTime(120, now + 0.08); // pitch drop

    var oscGain = ctx.createGain();
    oscGain.gain.setValueAtTime(0, now);
    oscGain.gain.linearRampToValueAtTime(0.18, now + 0.001);
    oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

    osc.connect(oscGain);
    oscGain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.09);
  });
}

function playSadTrombone(livesRemaining) {
  // livesRemaining after decrement: 2 = mild, 1 = worse, 0 = devastating
  var noteSet;
  if (livesRemaining >= 2) {
    // Mild: quick 2-note drop
    noteSet = [
      { freq: 311, start: 0,    dur: 0.20, droop: 0 },
      { freq: 247, start: 0.22, dur: 0.30, droop: 0.06 }
    ];
  } else if (livesRemaining === 1) {
    // Worse: 3-note descending, slower, more droop
    noteSet = [
      { freq: 293, start: 0,    dur: 0.25, droop: 0 },
      { freq: 247, start: 0.28, dur: 0.25, droop: 0.04 },
      { freq: 196, start: 0.56, dur: 0.40, droop: 0.12 }
    ];
  } else {
    // Devastating: full sad trombone, 5 notes, long final droop
    noteSet = [
      { freq: 349, start: 0,    dur: 0.24, droop: 0 },
      { freq: 311, start: 0.26, dur: 0.24, droop: 0 },
      { freq: 293, start: 0.52, dur: 0.24, droop: 0 },
      { freq: 261, start: 0.78, dur: 0.28, droop: 0.05 },
      { freq: 196, start: 1.10, dur: 0.70, droop: 0.20 }
    ];
  }

  withAudio(function(ctx) {
    var now = ctx.currentTime;

      for (var n = 0; n < noteSet.length; n++) {
        (function(note) {
          var t = now + note.start;

          var osc = ctx.createOscillator();
          osc.type = 'square';
          osc.frequency.setValueAtTime(note.freq, t);
          if (note.droop > 0) {
            osc.frequency.linearRampToValueAtTime(note.freq * (1 - note.droop), t + note.dur);
          }

          var osc2 = ctx.createOscillator();
          osc2.type = 'sawtooth';
          osc2.frequency.setValueAtTime(note.freq * 1.003, t);
          if (note.droop > 0) {
            osc2.frequency.linearRampToValueAtTime(note.freq * (1 - note.droop) * 1.003, t + note.dur);
          }

          var gain = ctx.createGain();
          gain.gain.setValueAtTime(0, t);
          gain.gain.linearRampToValueAtTime(0.12, t + 0.015);
          gain.gain.setValueAtTime(0.12, t + note.dur - 0.04);
          gain.gain.linearRampToValueAtTime(0, t + note.dur);

          var gain2 = ctx.createGain();
          gain2.gain.setValueAtTime(0, t);
          gain2.gain.linearRampToValueAtTime(0.05, t + 0.015);
          gain2.gain.setValueAtTime(0.05, t + note.dur - 0.04);
          gain2.gain.linearRampToValueAtTime(0, t + note.dur);

          var lp = ctx.createBiquadFilter();
          lp.type = 'lowpass';
          lp.frequency.value = livesRemaining >= 2 ? 1400 : livesRemaining === 1 ? 1000 : 800;

          osc.connect(gain);
          osc2.connect(gain2);
          gain.connect(lp);
          gain2.connect(lp);
          lp.connect(ctx.destination);

          osc.start(t);
          osc.stop(t + note.dur + 0.01);
          osc2.start(t);
          osc2.stop(t + note.dur + 0.01);
        })(noteSet[n]);
      }
    });
}

function playFireworkPop() {
  withAudio(function(ctx) {
    var now = ctx.currentTime;

    // Bright noise burst (the pop)
    var bufSize = Math.floor(ctx.sampleRate * 0.12);
    var buf = ctx.createBuffer(1, bufSize, ctx.sampleRate);
    var data = buf.getChannelData(0);
    for (var j = 0; j < bufSize; j++) data[j] = (Math.random() * 2 - 1);
    var noise = ctx.createBufferSource();
    noise.buffer = buf;

    var bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = 4000 + Math.random() * 2000;
    bp.Q.value = 1.2;

    var noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0, now);
    noiseGain.gain.linearRampToValueAtTime(0.25, now + 0.003);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);

    noise.connect(bp);
    bp.connect(noiseGain);
    noiseGain.connect(ctx.destination);
    noise.start(now);
    noise.stop(now + 0.12);

    // Rising tone (the whistle)
    var osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(800 + Math.random() * 400, now);
    osc.frequency.exponentialRampToValueAtTime(2000 + Math.random() * 1000, now + 0.04);
    osc.frequency.exponentialRampToValueAtTime(200, now + 0.1);

    var oscGain = ctx.createGain();
    oscGain.gain.setValueAtTime(0, now);
    oscGain.gain.linearRampToValueAtTime(0.08, now + 0.005);
    oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);

    osc.connect(oscGain);
    oscGain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.12);
  });
}

function playRangeTick(progress) {
  // progress: 0-1, pitch rises as we approach target
  withAudio(function(ctx) {
    var now = ctx.currentTime;
    var freq = 600 + progress * 600; // 600Hz → 1200Hz

    var osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, now);

    var gain = ctx.createGain();
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.06, now + 0.005);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.1);
  });
}

function playRangeLand() {
  withAudio(function(ctx) {
    var now = ctx.currentTime;

    // Bright two-tone chime
    var osc1 = ctx.createOscillator();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(1320, now);

    var osc2 = ctx.createOscillator();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(1760, now + 0.04);

    var gain = ctx.createGain();
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.1, now + 0.008);
    gain.gain.setValueAtTime(0.1, now + 0.06);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.15);
    osc2.start(now + 0.04);
    osc2.stop(now + 0.3);
  });
}

function playRangeTakeoverUp() {
  withAudio(function(ctx) {
    var now = ctx.currentTime;

    // Rising whoosh
    var osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(200, now);
    osc.frequency.exponentialRampToValueAtTime(800, now + 0.35);

    var gain = ctx.createGain();
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.06, now + 0.05);
    gain.gain.linearRampToValueAtTime(0.08, now + 0.2);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

    var lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.setValueAtTime(600, now);
    lp.frequency.exponentialRampToValueAtTime(3000, now + 0.35);

    osc.connect(lp);
    lp.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.45);

    // Subtle noise whoosh layer
    var bufSize = Math.floor(ctx.sampleRate * 0.3);
    var buf = ctx.createBuffer(1, bufSize, ctx.sampleRate);
    var data = buf.getChannelData(0);
    for (var j = 0; j < bufSize; j++) data[j] = (Math.random() * 2 - 1);
    var noise = ctx.createBufferSource();
    noise.buffer = buf;
    var bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.setValueAtTime(1000, now);
    bp.frequency.exponentialRampToValueAtTime(4000, now + 0.3);
    bp.Q.value = 0.8;
    var noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0, now);
    noiseGain.gain.linearRampToValueAtTime(0.04, now + 0.1);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
    noise.connect(bp);
    bp.connect(noiseGain);
    noiseGain.connect(ctx.destination);
    noise.start(now);
    noise.stop(now + 0.35);
  });
}

function playRangeDropTick(progress) {
  // progress: 0-1, pitch descends as we fall
  withAudio(function(ctx) {
    var now = ctx.currentTime;
    var freq = 1000 - progress * 500; // 1000Hz → 500Hz

    var osc = ctx.createOscillator();
    osc.type = 'square';
    osc.frequency.setValueAtTime(freq, now);

    var gain = ctx.createGain();
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.04, now + 0.005);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);

    var lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 1500;

    osc.connect(gain);
    gain.connect(lp);
    lp.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.08);
  });
}

function playRangeThud() {
  withAudio(function(ctx) {
    var now = ctx.currentTime;

    // Low dull thud
    var osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(120, now);
    osc.frequency.exponentialRampToValueAtTime(50, now + 0.15);

    var gain = ctx.createGain();
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.15, now + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.3);

    // Noise layer for impact texture
    var bufSize = Math.floor(ctx.sampleRate * 0.06);
    var buf = ctx.createBuffer(1, bufSize, ctx.sampleRate);
    var data = buf.getChannelData(0);
    for (var j = 0; j < bufSize; j++) data[j] = (Math.random() * 2 - 1);
    var noise = ctx.createBufferSource();
    noise.buffer = buf;

    var nGain = ctx.createGain();
    nGain.gain.setValueAtTime(0, now);
    nGain.gain.linearRampToValueAtTime(0.06, now + 0.003);
    nGain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);

    var lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 400;

    noise.connect(nGain);
    nGain.connect(lp);
    lp.connect(ctx.destination);
    noise.start(now);
    noise.stop(now + 0.08);
  });
}

function playJackpotSound() {
  withAudio(function(ctx) {
    var now = ctx.currentTime;

    // Rising power surge
    var surge = ctx.createOscillator();
    surge.type = 'sawtooth';
    surge.frequency.setValueAtTime(100, now);
    surge.frequency.exponentialRampToValueAtTime(2000, now + 0.5);
    var surgeGain = ctx.createGain();
    surgeGain.gain.setValueAtTime(0, now);
    surgeGain.gain.linearRampToValueAtTime(0.08, now + 0.1);
    surgeGain.gain.linearRampToValueAtTime(0.12, now + 0.4);
    surgeGain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
    var surgeLp = ctx.createBiquadFilter();
    surgeLp.type = 'lowpass';
    surgeLp.frequency.setValueAtTime(800, now);
    surgeLp.frequency.exponentialRampToValueAtTime(6000, now + 0.5);
    surge.connect(surgeLp);
    surgeLp.connect(surgeGain);
    surgeGain.connect(ctx.destination);
    surge.start(now);
    surge.stop(now + 0.6);

    // Big impact chord at 0.5s
    var chordFreqs = [523.25, 659.25, 783.99, 1046.5]; // C5 E5 G5 C6
    chordFreqs.forEach(function(f, i) {
      var osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(f, now + 0.5);
      var g = ctx.createGain();
      g.gain.setValueAtTime(0, now + 0.5);
      g.gain.linearRampToValueAtTime(0.1, now + 0.52);
      g.gain.exponentialRampToValueAtTime(0.001, now + 2.0);
      osc.connect(g);
      g.connect(ctx.destination);
      osc.start(now + 0.5);
      osc.stop(now + 2.0);
    });

    // Electric crackle noise
    var bufSize = Math.floor(ctx.sampleRate * 0.3);
    var buf = ctx.createBuffer(1, bufSize, ctx.sampleRate);
    var data = buf.getChannelData(0);
    for (var j = 0; j < bufSize; j++) data[j] = (Math.random() * 2 - 1);
    var noise = ctx.createBufferSource();
    noise.buffer = buf;
    var bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = 8000;
    bp.Q.value = 0.5;
    var noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0, now + 0.45);
    noiseGain.gain.linearRampToValueAtTime(0.15, now + 0.52);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.8);
    noise.connect(bp);
    bp.connect(noiseGain);
    noiseGain.connect(ctx.destination);
    noise.start(now + 0.45);
    noise.stop(now + 0.8);
  });
}

// ---- SPLASH AUDIO ----

// Bass nodes pre-built at page load -- oscillators NOT started yet.
// triggerSplashBass() calls .start() and sets gain envelope simultaneously.
var _bassNodes = []; // { osc, gain, peak }
var _bassNoise = null;
var _bassNoiseGain = null;
var _bassReady = false;

function preBuildBass() {
  try {
    var ctx = getAudioCtx();
    var freqs = [52, 54.5, 104];
    var peaks = [0.38, 0.32, 0.09];

    freqs.forEach(function(freq, i) {
      var osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = freq;

      var ws = ctx.createWaveShaper();
      var curve = new Float32Array(256);
      for (var k = 0; k < 256; k++) {
        var x = (k * 2) / 256 - 1;
        curve[k] = (Math.PI + 180) * x / (Math.PI + 180 * Math.abs(x));
      }
      ws.curve = curve;

      var g = ctx.createGain();
      g.gain.value = 0;

      osc.connect(ws); ws.connect(g); g.connect(ctx.destination);
      // NOT calling osc.start() yet

      _bassNodes.push({ osc: osc, gain: g, peak: peaks[i] });
    });

    // Pre-build noise buffer
    var bufSize = Math.floor(ctx.sampleRate * 4.0);
    var buf = ctx.createBuffer(1, bufSize, ctx.sampleRate);
    var data = buf.getChannelData(0);
    for (var i = 0; i < bufSize; i++) data[i] = (Math.random() * 2 - 1);

    var noise = ctx.createBufferSource();
    noise.buffer = buf;

    var lp = ctx.createBiquadFilter();
    lp.type = 'lowpass'; lp.frequency.value = 90; lp.Q.value = 1.2;

    var ng = ctx.createGain();
    ng.gain.value = 0;

    noise.connect(lp); lp.connect(ng); ng.connect(ctx.destination);
    // NOT calling noise.start() yet

    _bassNoise = noise;
    _bassNoiseGain = ng;
    _bassReady = true;
  } catch(e) {}
}

function triggerSplashBass() {
  if (!_bassReady) return;
  try {
    var ctx = getAudioCtx();
    var now = ctx.currentTime;

    _bassNodes.forEach(function(item) {
      item.osc.start(now);
      item.osc.stop(now + 3.5);
      item.gain.gain.setValueAtTime(0, now);
      item.gain.gain.linearRampToValueAtTime(item.peak, now + 0.6);
      item.gain.gain.setValueAtTime(item.peak, now + 1.6);
      item.gain.gain.exponentialRampToValueAtTime(0.001, now + 2.8);
    });

    _bassNoise.start(now);
    _bassNoise.stop(now + 3.5);
    _bassNoiseGain.gain.setValueAtTime(0, now);
    _bassNoiseGain.gain.linearRampToValueAtTime(0.12, now + 0.8);
    _bassNoiseGain.gain.exponentialRampToValueAtTime(0.001, now + 2.6);
  } catch(e) {}
}

function playSplashTick() {
  withAudio(function(ctx) {
    var now = ctx.currentTime;

    var bufSize = Math.floor(ctx.sampleRate * 0.018);
    var buf = ctx.createBuffer(1, bufSize, ctx.sampleRate);
    var data = buf.getChannelData(0);
    for (var i = 0; i < bufSize; i++) data[i] = (Math.random() * 2 - 1);

    var noise = ctx.createBufferSource();
    noise.buffer = buf;

    var bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = 4200 + Math.random() * 1800;
    bp.Q.value = 4.0;

    var g = ctx.createGain();
    g.gain.setValueAtTime(0.18, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.016);

    noise.connect(bp);
    bp.connect(g);
    g.connect(ctx.destination);
    noise.start(now);
    noise.stop(now + 0.02);

    var osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1800 + Math.random() * 600, now);
    osc.frequency.exponentialRampToValueAtTime(400, now + 0.04);

    var og = ctx.createGain();
    og.gain.setValueAtTime(0.07, now);
    og.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

    osc.connect(og);
    og.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.05);
  });
}
