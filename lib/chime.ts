export function playChime() {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    // Two-tone "ding-dong" bell: E6 then C6
    const notes: { freq: number; start: number; dur: number }[] = [
      { freq: 1318.5, start: 0, dur: 0.35 },
      { freq: 1046.5, start: 0.18, dur: 0.6 },
    ];
    for (const n of notes) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = n.freq;
      const t0 = ctx.currentTime + n.start;
      gain.gain.setValueAtTime(0, t0);
      gain.gain.linearRampToValueAtTime(0.35, t0 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, t0 + n.dur);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t0);
      osc.stop(t0 + n.dur + 0.05);
    }
    setTimeout(() => ctx.close(), 1500);
  } catch {
    // audio is best-effort
  }
}
