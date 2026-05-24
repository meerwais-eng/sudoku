/**
 * Sudoku Sound Engine - Web Audio API based sound effects
 * No external files needed - all sounds are synthesized
 */

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    try {
      audioCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    } catch {
      return null;
    }
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

/** Play a tone with given parameters */
function playTone(
  frequency: number,
  duration: number,
  type: OscillatorType = 'sine',
  volume: number = 0.15,
  detune: number = 0
) {
  const ctx = getAudioContext();
  if (!ctx) return;

  const oscillator = ctx.createOscillator();
  const gainNode = ctx.createGain();

  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, ctx.currentTime);
  oscillator.detune.setValueAtTime(detune, ctx.currentTime);

  // Smooth volume envelope
  gainNode.gain.setValueAtTime(0, ctx.currentTime);
  gainNode.gain.linearRampToValueAtTime(volume, ctx.currentTime + 0.01);
  gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

  oscillator.connect(gainNode);
  gainNode.connect(ctx.destination);

  oscillator.start(ctx.currentTime);
  oscillator.stop(ctx.currentTime + duration);
}

/** Play a sequence of tones */
function playSequence(notes: { freq: number; duration: number; delay: number; type?: OscillatorType; volume?: number }[]) {
  const ctx = getAudioContext();
  if (!ctx) return;

  notes.forEach(({ freq, duration, delay, type = 'sine', volume = 0.12 }) => {
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.type = type;
    oscillator.frequency.setValueAtTime(freq, ctx.currentTime + delay);

    gainNode.gain.setValueAtTime(0, ctx.currentTime + delay);
    gainNode.gain.linearRampToValueAtTime(volume, ctx.currentTime + delay + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + duration);

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.start(ctx.currentTime + delay);
    oscillator.stop(ctx.currentTime + delay + duration);
  });
}

// ========== PUBLIC SOUND EFFECTS ==========

/** Sound when a correct number is placed */
export function playPlaceSound() {
  playTone(600, 0.12, 'sine', 0.12);
  playTone(800, 0.08, 'sine', 0.06);
}

/** Sound when selecting a cell */
export function playSelectSound() {
  playTone(440, 0.06, 'sine', 0.05);
}

/** Sound when a wrong number is placed (error) */
export function playErrorSound() {
  playTone(200, 0.25, 'sawtooth', 0.1);
  playTone(180, 0.3, 'square', 0.06);
}

/** Sound when erasing a cell */
export function playEraseSound() {
  playTone(500, 0.08, 'sine', 0.08);
  playTone(350, 0.1, 'sine', 0.06);
}

/** Sound when toggling notes mode */
export function playNotesToggleSound(enabled: boolean) {
  if (enabled) {
    playTone(660, 0.08, 'sine', 0.08);
    playTone(880, 0.08, 'sine', 0.06);
  } else {
    playTone(880, 0.08, 'sine', 0.06);
    playTone(660, 0.08, 'sine', 0.08);
  }
}

/** Sound when using a hint */
export function playHintSound() {
  playSequence([
    { freq: 523, duration: 0.12, delay: 0 },
    { freq: 659, duration: 0.12, delay: 0.1 },
    { freq: 784, duration: 0.18, delay: 0.2 },
  ]);
}

/** Sound when undoing */
export function playUndoSound() {
  playTone(600, 0.08, 'sine', 0.08);
  playTone(400, 0.1, 'sine', 0.06);
}

/** Sound when the puzzle is won! */
export function playWinSound() {
  playSequence([
    { freq: 523, duration: 0.15, delay: 0, volume: 0.12 },
    { freq: 659, duration: 0.15, delay: 0.12, volume: 0.12 },
    { freq: 784, duration: 0.15, delay: 0.24, volume: 0.12 },
    { freq: 1047, duration: 0.4, delay: 0.36, volume: 0.15 },
    { freq: 784, duration: 0.15, delay: 0.5, volume: 0.08 },
    { freq: 1047, duration: 0.5, delay: 0.6, volume: 0.12 },
  ]);
}

/** Sound when game over */
export function playGameOverSound() {
  playSequence([
    { freq: 400, duration: 0.2, delay: 0, type: 'sawtooth', volume: 0.08 },
    { freq: 300, duration: 0.2, delay: 0.2, type: 'sawtooth', volume: 0.08 },
    { freq: 200, duration: 0.4, delay: 0.4, type: 'sawtooth', volume: 0.1 },
  ]);
}

/** Sound when a number is completed (all 9 placed) */
export function playNumberCompleteSound() {
  playSequence([
    { freq: 880, duration: 0.1, delay: 0, volume: 0.1 },
    { freq: 1108, duration: 0.1, delay: 0.08, volume: 0.1 },
    { freq: 1320, duration: 0.15, delay: 0.16, volume: 0.12 },
  ]);
}

/** Initialize audio context on user interaction */
export function initAudio() {
  getAudioContext();
}

// ========== BACKGROUND MUSIC ENGINE ==========

/**
 * Background music state - all references kept in a single object
 * for clean lifecycle management.
 */
interface BgMusicState {
  masterGain: GainNode;
  padOscillators: OscillatorNode[];
  padGain: GainNode;
  chordInterval: ReturnType<typeof setInterval> | null;
  arpTimeout: ReturnType<typeof setTimeout> | null;
  shimmerTimeout: ReturnType<typeof setTimeout> | null;
  stopped: boolean;
}

let bgMusic: BgMusicState | null = null;

/**
 * Pentatonic scale for ambient arpeggios — C major pentatonic (C, D, E, G, A)
 * Covers C3 through A5 for a calm, zen-like feel.
 */
const PENTA = [
  130.81, 146.83, 164.81, 196.00, 220.00,   // C3-A3
  261.63, 293.66, 329.63, 392.00, 440.00,   // C4-A4
  523.25, 587.33, 659.25, 783.99, 880.00,   // C5-A5
];

/**
 * Chord voicings for the pad drone.
 * Each chord = [root, third/fifth intervals].
 * Uses low-register notes for a warm, full foundation.
 */
const CHORDS = [
  [130.81, 164.81, 196.00],   // C major (C, E, G)
  [146.83, 185.00, 220.00],   // Dm-ish (D, F#, A)
  [116.54, 146.83, 174.61],   // Bb major (Bb, D, F)
  [123.47, 155.56, 185.00],   // Somewhat mysterious (B, Eb, F#)
];

/**
 * Play a single arpeggio note with a soft bell-like timbre.
 * Returns the oscillators created so they can be tracked.
 */
function playArpNote(freq: number, masterGain: GainNode, volume: number = 0.18) {
  const ctx = audioCtx;
  if (!ctx) return;

  const now = ctx.currentTime;

  // Fundamental tone
  const osc = ctx.createOscillator();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(freq, now);

  const oscGain = ctx.createGain();
  oscGain.gain.setValueAtTime(0, now);
  oscGain.gain.linearRampToValueAtTime(volume, now + 0.04);
  oscGain.gain.exponentialRampToValueAtTime(0.001, now + 3.5);

  osc.connect(oscGain);
  oscGain.connect(masterGain);

  osc.start(now);
  osc.stop(now + 3.5);

  // Soft harmonic overtone (octave above)
  const osc2 = ctx.createOscillator();
  osc2.type = 'sine';
  osc2.frequency.setValueAtTime(freq * 2, now);

  const oscGain2 = ctx.createGain();
  oscGain2.gain.setValueAtTime(0, now);
  oscGain2.gain.linearRampToValueAtTime(volume * 0.25, now + 0.04);
  oscGain2.gain.exponentialRampToValueAtTime(0.001, now + 2.5);

  osc2.connect(oscGain2);
  oscGain2.connect(masterGain);

  osc2.start(now);
  osc2.stop(now + 2.5);
}

/**
 * Schedule the next arpeggio note using recursive setTimeout
 * for natural, varying timing.
 */
function scheduleArpNote(music: BgMusicState) {
  if (music.stopped) return;

  const ctx = audioCtx;
  if (!ctx) return;

  // Pick a random note from mid-range pentatonic (C4-A5)
  const arpNotes = PENTA.slice(5, 13);
  const noteFreq = arpNotes[Math.floor(Math.random() * arpNotes.length)];

  playArpNote(noteFreq, music.masterGain, 0.14 + Math.random() * 0.06);

  // Schedule next note with varying interval (1.8 - 3.5 seconds)
  const delay = 1800 + Math.random() * 1700;
  music.arpTimeout = setTimeout(() => scheduleArpNote(music), delay);
}

/**
 * Schedule the next shimmer tone.
 */
function scheduleShimmer(music: BgMusicState) {
  if (music.stopped) return;

  const ctx = audioCtx;
  if (!ctx) return;

  // High octave shimmer
  const shimmerNotes = PENTA.slice(10, 15);
  const noteFreq = shimmerNotes[Math.floor(Math.random() * shimmerNotes.length)];
  const now = ctx.currentTime;

  const osc = ctx.createOscillator();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(noteFreq, now);

  const oscGain = ctx.createGain();
  oscGain.gain.setValueAtTime(0, now);
  oscGain.gain.linearRampToValueAtTime(0.06, now + 0.1);
  oscGain.gain.exponentialRampToValueAtTime(0.001, now + 5);

  osc.connect(oscGain);
  oscGain.connect(music.masterGain);

  osc.start(now);
  osc.stop(now + 5);

  // Schedule next shimmer (5-12 seconds)
  const delay = 5000 + Math.random() * 7000;
  music.shimmerTimeout = setTimeout(() => scheduleShimmer(music), delay);
}

/**
 * Start the background ambient music.
 * Creates a layered ambient soundscape:
 * 1. Pad drone — warm oscillators with slow chord morphing
 * 2. Arpeggio — gentle bell-like pentatonic notes
 * 3. Shimmer — occasional high ethereal tones
 */
export function startBackgroundMusic() {
  // If already playing, do nothing
  if (bgMusic && !bgMusic.stopped) return;

  const ctx = getAudioContext();
  if (!ctx) return;

  // Ensure context is running (may need resume on some browsers)
  if (ctx.state === 'suspended') {
    ctx.resume();
  }

  // --- Master gain: controls overall music volume ---
  // Volume is 0.22 — clearly audible but not overwhelming
  const masterGain = ctx.createGain();
  masterGain.gain.setValueAtTime(0, ctx.currentTime);
  masterGain.gain.linearRampToValueAtTime(0.22, ctx.currentTime + 2.5);
  masterGain.connect(ctx.destination);

  // --- Layer 1: Pad Drone ---
  const padGain = ctx.createGain();
  padGain.gain.setValueAtTime(0.45, ctx.currentTime);
  padGain.connect(masterGain);

  const padOscillators: OscillatorNode[] = [];
  const initialChord = CHORDS[0];

  initialChord.forEach((freq, i) => {
    // Main oscillator
    const osc = ctx.createOscillator();
    osc.type = i === 0 ? 'sine' : 'triangle';
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    osc.detune.setValueAtTime(i * 4 - 4, ctx.currentTime);

    const oscGain = ctx.createGain();
    oscGain.gain.setValueAtTime(0.5, ctx.currentTime);

    osc.connect(oscGain);
    oscGain.connect(padGain);
    osc.start(ctx.currentTime);

    padOscillators.push(osc);

    // Detuned copy for lush chorus
    const osc2 = ctx.createOscillator();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(freq, ctx.currentTime);
    osc2.detune.setValueAtTime(i * 8 + 7, ctx.currentTime);

    const oscGain2 = ctx.createGain();
    oscGain2.gain.setValueAtTime(0.3, ctx.currentTime);

    osc2.connect(oscGain2);
    oscGain2.connect(padGain);
    osc2.start(ctx.currentTime);

    padOscillators.push(osc2);
  });

  // Create the music state object
  const music: BgMusicState = {
    masterGain,
    padOscillators,
    padGain,
    chordInterval: null,
    arpTimeout: null,
    shimmerTimeout: null,
    stopped: false,
  };

  bgMusic = music;

  // --- Chord progression: slowly morph between chords every 10-16 seconds ---
  let chordIndex = 0;
  music.chordInterval = setInterval(() => {
    if (music.stopped) return;
    const currentCtx = audioCtx;
    if (!currentCtx) return;

    chordIndex = (chordIndex + 1) % CHORDS.length;
    const chord = CHORDS[chordIndex];
    const now = currentCtx.currentTime;

    // Smoothly morph pad to new chord over 4 seconds
    chord.forEach((freq, i) => {
      const mainIdx = i * 2;
      const detuneIdx = i * 2 + 1;
      if (padOscillators[mainIdx]) {
        padOscillators[mainIdx].frequency.linearRampToValueAtTime(freq, now + 4);
      }
      if (padOscillators[detuneIdx]) {
        padOscillators[detuneIdx].frequency.linearRampToValueAtTime(freq, now + 4);
      }
    });
  }, 12000);

  // --- Layer 2: Start arpeggio after a brief delay ---
  // First note plays after 1 second, then recursively schedules
  music.arpTimeout = setTimeout(() => scheduleArpNote(music), 1000);

  // --- Layer 3: Start shimmer after a longer delay ---
  music.shimmerTimeout = setTimeout(() => scheduleShimmer(music), 4000);

  // --- Play a welcoming intro motif ---
  // A gentle ascending pentatonic phrase so the user knows music has started
  const introNotes = [261.63, 329.63, 392.00, 523.25];
  introNotes.forEach((freq, i) => {
    const delay = i * 0.4;
    const now = ctx.currentTime + delay;
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, now);

    const g = ctx.createGain();
    g.gain.setValueAtTime(0, now);
    g.gain.linearRampToValueAtTime(0.15, now + 0.04);
    g.gain.exponentialRampToValueAtTime(0.001, now + 1.8);

    osc.connect(g);
    g.connect(masterGain);
    osc.start(now);
    osc.stop(now + 1.8);
  });
}

/** Stop the background music with a smooth fade-out */
export function stopBackgroundMusic() {
  if (!bgMusic) return;

  const music = bgMusic;
  music.stopped = true;

  // Clear all scheduled timers
  if (music.chordInterval) {
    clearInterval(music.chordInterval);
    music.chordInterval = null;
  }
  if (music.arpTimeout) {
    clearTimeout(music.arpTimeout);
    music.arpTimeout = null;
  }
  if (music.shimmerTimeout) {
    clearTimeout(music.shimmerTimeout);
    music.shimmerTimeout = null;
  }

  // Fade out over 0.8 seconds
  const ctx = audioCtx;
  if (ctx && music.masterGain) {
    try {
      music.masterGain.gain.cancelScheduledValues(ctx.currentTime);
      music.masterGain.gain.setValueAtTime(music.masterGain.gain.value, ctx.currentTime);
      music.masterGain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.8);
    } catch {
      // Ignore scheduling errors
    }

    // Stop oscillators after fade completes
    setTimeout(() => {
      music.padOscillators.forEach(osc => {
        try { osc.stop(); } catch { /* already stopped */ }
      });
      try { music.masterGain.disconnect(); } catch { /* ignore */ }
    }, 1000);
  }

  bgMusic = null;
}

/** Check if background music is currently playing */
export function isBackgroundMusicPlaying(): boolean {
  return bgMusic !== null && !bgMusic.stopped;
}

/** Set the background music volume (0-1) */
export function setBackgroundMusicVolume(volume: number) {
  if (!bgMusic || bgMusic.stopped) return;
  const ctx = audioCtx;
  if (!ctx) return;

  const clamped = Math.max(0, Math.min(1, volume));
  try {
    bgMusic.masterGain.gain.cancelScheduledValues(ctx.currentTime);
    bgMusic.masterGain.gain.setValueAtTime(bgMusic.masterGain.gain.value, ctx.currentTime);
    bgMusic.masterGain.gain.linearRampToValueAtTime(clamped * 0.22, ctx.currentTime + 0.3);
  } catch {
    // Ignore scheduling errors
  }
}
