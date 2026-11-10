export class GameAudio {
  constructor(manifest) {
    this.files = manifest.audio;
    this.buffers = new Map();
    this.muted = false;
    this.ready = false;
    this.active = new Set();
    this.lastCoin = 0;
  }
  async unlock() {
    if (!this.ctx) {
      this.ctx = new AudioContext();
      this.master = this.ctx.createGain();
      this.master.gain.value = this.muted ? 0 : 0.58;
      this.master.connect(this.ctx.destination);
    }
    if (this.ctx.state === "suspended") await this.ctx.resume();
    if (!this.loading) {
      this.loading = true;
      await Promise.all(
        Object.entries(this.files).map(async ([name, url]) => {
          try {
            const r = await fetch("/" + url);
            if (!r.ok) throw Error(url);
            const b = await this.ctx.decodeAudioData(await r.arrayBuffer());
            this.buffers.set(name, b);
          } catch (e) {
            console.warn("Audio unavailable", name, e.message);
          }
        }),
      );
      this.ready = true;
      this.play("Ambience", 0.17, 1, true, "ambience");
    }
  }
  play(name, volume = 0.5, rate = 1, loop = false, key = null) {
    if (!this.ctx || !this.buffers.has(name)) return null;
    if (name === "coin collect") {
      if (this.ctx.currentTime - this.lastCoin < 0.09) return;
      this.lastCoin = this.ctx.currentTime;
    }
    const source = this.ctx.createBufferSource(),
      gain = this.ctx.createGain();
    source.buffer = this.buffers.get(name);
    source.playbackRate.value = rate;
    source.loop = loop;
    gain.gain.value = volume;
    source.connect(gain);
    gain.connect(this.master);
    source.start();
    const item = { source, gain, key };
    this.active.add(item);
    source.onended = () => {
      source.disconnect();
      gain.disconnect();
      this.active.delete(item);
    };
    return item;
  }
  flight(speed, air) {
    if (!this.ready) return;
    if (!this.roll) this.roll = this.play("tire roll", 0.1, 1, true, "roll");
    if (!this.wind) this.wind = this.play("Flying", 0.1, 1, true, "wind");
    if (this.roll) {
      this.roll.gain.gain.setTargetAtTime(
        air ? 0.03 : Math.min(0.3, speed / 150),
        this.ctx.currentTime,
        0.15,
      );
      this.roll.source.playbackRate.setTargetAtTime(
        0.6 + speed / 40,
        this.ctx.currentTime,
        0.15,
      );
    }
    if (this.wind)
      this.wind.gain.gain.setTargetAtTime(
        air ? 0.12 : 0.015,
        this.ctx.currentTime,
        0.15,
      );
  }
  stopFlight() {
    for (const a of [this.roll, this.wind])
      if (a) {
        try {
          a.source.stop();
        } catch {}
      }
    this.roll = this.wind = null;
  }
  toggle() {
    this.muted = !this.muted;
    if (this.master) this.master.gain.value = this.muted ? 0 : 0.58;
    return this.muted;
  }
  pause(p) {
    if (this.ctx) {
      if (p) this.ctx.suspend();
      else this.ctx.resume();
    }
  }
}
