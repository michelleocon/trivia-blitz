/**
 * Sound effects via Web Audio API
 * No external files needed — all tones are generated programmatically.
 */

let audioCtx = null;

function getCtx() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  return audioCtx;
}

/**
 * Play a simple synthesised tone.
 * @param {number} frequency - Hz
 * @param {number} duration  - seconds
 * @param {'sine'|'square'|'triangle'|'sawtooth'} type
 * @param {number} volume    - 0 to 1
 */
function playTone(frequency, duration, type = 'sine', volume = 0.3) {
  try {
    const ctx = getCtx();
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, ctx.currentTime);

    gainNode.gain.setValueAtTime(volume, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + duration);
  } catch {
    // Silently fail (e.g., browser autoplay policy)
  }
}

/** Upward "ding-ding" — correct answer */
export function playCorrect() {
  playTone(523, 0.15, 'sine', 0.4);   // C5
  setTimeout(() => playTone(784, 0.25, 'sine', 0.4), 120); // G5
}

/** Low buzz — wrong answer */
export function playWrong() {
  playTone(220, 0.3, 'square', 0.25);
}

/** Tick sound for timer countdown */
export function playTick() {
  playTone(880, 0.05, 'sine', 0.1);
}

/** Fanfare for the winner */
export function playWinner() {
  const notes = [523, 659, 784, 1047]; // C5 E5 G5 C6
  notes.forEach((note, i) => {
    setTimeout(() => playTone(note, 0.2, 'sine', 0.35), i * 150);
  });
}

/** Countdown beep */
export function playCountdown() {
  playTone(440, 0.1, 'sine', 0.2);
}
