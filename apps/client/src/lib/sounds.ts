// Web Audio API sound effects — zero dependencies, no assets needed

let ctx: AudioContext | null = null;

function getCtx(): AudioContext {
  if (!ctx) ctx = new AudioContext();
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

function tone(freq: number, duration: number, vol = 0.15, type: OscillatorType = 'sine') {
  try {
    const c = getCtx();
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.connect(gain);
    gain.connect(c.destination);
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(vol, c.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + duration);
    osc.start(c.currentTime);
    osc.stop(c.currentTime + duration);
  } catch { /* audio blocked */ }
}

function noise(duration: number, vol = 0.08) {
  try {
    const c = getCtx();
    const bufSize = c.sampleRate * duration;
    const buf = c.createBuffer(1, bufSize, c.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < bufSize; i++) data[i] = (Math.random() * 2 - 1);
    const src = c.createBufferSource();
    src.buffer = buf;
    const gain = c.createGain();
    src.connect(gain);
    gain.connect(c.destination);
    gain.gain.setValueAtTime(vol, c.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + duration);
    src.start(c.currentTime);
  } catch { /* audio blocked */ }
}

export const sounds = {
  deal() {
    // Soft whoosh for each card
    noise(0.08, 0.06);
    tone(220, 0.08, 0.05, 'sine');
  },

  cardPlay() {
    // Card slap on table
    noise(0.05, 0.12);
    tone(180, 0.06, 0.08, 'triangle');
  },

  bid() {
    tone(523, 0.12, 0.1, 'sine');   // C5
    setTimeout(() => tone(659, 0.1, 0.08, 'sine'), 80); // E5
  },

  trickWon() {
    // Quick ascending chime
    tone(523, 0.1, 0.12, 'sine');
    setTimeout(() => tone(659, 0.1, 0.1, 'sine'), 80);
    setTimeout(() => tone(784, 0.15, 0.1, 'sine'), 160);
  },

  trickLost() {
    tone(330, 0.12, 0.08, 'sine');
    setTimeout(() => tone(277, 0.15, 0.08, 'sine'), 100);
  },

  yourTurn() {
    tone(880, 0.06, 0.12, 'sine');
    setTimeout(() => tone(1108, 0.1, 0.1, 'sine'), 60);
  },

  gameWon() {
    const notes = [523, 659, 784, 1047];
    notes.forEach((f, i) => setTimeout(() => tone(f, 0.25, 0.12, 'sine'), i * 120));
  },

  gameLost() {
    const notes = [392, 330, 277];
    notes.forEach((f, i) => setTimeout(() => tone(f, 0.3, 0.1, 'sine'), i * 150));
  },

  buttonClick() {
    tone(440, 0.05, 0.07, 'square');
  },

  error() {
    tone(220, 0.15, 0.1, 'sawtooth');
  },
};
