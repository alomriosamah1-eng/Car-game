export class AudioManager {
  private context: AudioContext | null = null;
  private master: GainNode | null = null;
  private idleGain: GainNode | null = null;
  private lowGain: GainNode | null = null;
  private highGain: GainNode | null = null;
  private idleOsc: OscillatorNode | null = null;
  private lowOsc: OscillatorNode | null = null;
  private highOsc: OscillatorNode | null = null;
  private music: HTMLAudioElement | null = null;
  private engineEnabled = true;
  private masterVolume = 0.44;
  private musicVolume = 0.5;
  private effectsVolume = 0.52;

  unlock() {
    if (this.context) {
      if (this.context.state === "suspended") void this.context.resume();
      return;
    }
    const AudioContextClass = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    this.context = new AudioContextClass();
    this.master = this.context.createGain();
    this.master.gain.value = this.masterVolume * this.effectsVolume;
    this.master.connect(this.context.destination);

    this.idleGain = this.context.createGain();
    this.lowGain = this.context.createGain();
    this.highGain = this.context.createGain();
    this.idleOsc = this.makeOscillator(62, "sawtooth", this.idleGain);
    this.lowOsc = this.makeOscillator(108, "triangle", this.lowGain);
    this.highOsc = this.makeOscillator(224, "sine", this.highGain);
    this.idleGain.connect(this.master);
    this.lowGain.connect(this.master);
    this.highGain.connect(this.master);
    this.idleGain.gain.value = 0.08;
    this.lowGain.gain.value = 0.02;
    this.highGain.gain.value = 0;
  }

  private makeOscillator(frequency: number, type: OscillatorType, gain: GainNode) {
    const oscillator = this.context!.createOscillator();
    oscillator.type = type;
    oscillator.frequency.value = frequency;
    oscillator.connect(gain);
    oscillator.start();
    return oscillator;
  }

  update(rpm: number, throttle: number, braking: number) {
    if (!this.context || !this.idleOsc || !this.lowOsc || !this.highOsc || !this.idleGain || !this.lowGain || !this.highGain) return;
    const now = this.context.currentTime;
    const normalized = Math.min(1, Math.max(0, (rpm - 820) / 5450));
    const ramp = 0.08;
    this.idleOsc.frequency.setTargetAtTime(62 + normalized * 23, now, ramp);
    this.lowOsc.frequency.setTargetAtTime(105 + normalized * 110, now, ramp);
    this.highOsc.frequency.setTargetAtTime(210 + normalized * 260, now, ramp);
    this.idleGain.gain.setTargetAtTime(this.engineEnabled ? 0.085 - normalized * 0.04 : 0, now, ramp);
    this.lowGain.gain.setTargetAtTime(this.engineEnabled ? normalized * 0.13 + throttle * 0.035 : 0, now, ramp);
    this.highGain.gain.setTargetAtTime(this.engineEnabled ? Math.max(0, normalized - 0.55) * 0.15 + braking * 0.02 : 0, now, ramp);
  }

  setEngineEnabled(enabled: boolean) {
    this.engineEnabled = enabled;
    if (this.master) this.master.gain.value = enabled ? this.masterVolume * this.effectsVolume : 0;
  }

  setEffectsVolume(value: number) {
    this.effectsVolume = value;
    if (this.master) this.master.gain.value = this.engineEnabled ? this.masterVolume * this.effectsVolume : 0;
  }

  setMusicVolume(value: number) {
    this.musicVolume = value;
    if (this.music) this.music.volume = value;
  }

  setMusicFile(file: File) {
    if (this.music) {
      this.music.pause();
      URL.revokeObjectURL(this.music.src);
    }
    this.music = new Audio(URL.createObjectURL(file));
    this.music.loop = true;
    this.music.volume = this.musicVolume;
    void this.music.play().catch(() => undefined);
  }

  toggleMusic() {
    if (!this.music) return false;
    if (this.music.paused) {
      void this.music.play().catch(() => undefined);
      return true;
    }
    this.music.pause();
    return false;
  }

  dispose() {
    this.music?.pause();
    if (this.music?.src.startsWith("blob:")) URL.revokeObjectURL(this.music.src);
    this.music = null;
    this.idleOsc?.stop();
    this.lowOsc?.stop();
    this.highOsc?.stop();
    void this.context?.close();
    this.context = null;
  }

  get unlocked() {
    return Boolean(this.context);
  }

  get hasMusic() {
    return Boolean(this.music);
  }
}
