import { PI_NOTE_LENGTH_SAMPLES, PRE_SCALE_TRACK_VOLUME as PRE_SCALE_CHANNEL_VOLUME } from "./constants";
import { getAttackEnvelope, getFadeIn, getReleaseEnvelope } from "./envelope";
import { clamp } from "./helpers";
import { SongReader } from "./song-reader";
import { OrganyaFile } from "./types";
import { WaveTable } from "./wavetable";

type OutputStep = [number, number];

type InstrumentState = {
  noteIndex: number;
  wavetableOffset: number;
  samplesPlayed: number;
};

/**
 * .ORG file player. 
 */
export class OrganyaPlayer {
  private readonly song: OrganyaFile;

  // GC optimiztion: Preallocate these to ensure we don't create garbage each step.w
  // (Trying to do all I can to prevent stutter on mobile.)
  private readonly stepBuffer: OutputStep = [0, 0];
  private readonly channelBuffer: OutputStep = [0, 0];

  private sample: number;
  private readonly state: InstrumentState[];

  /**
   * Creates a new Organya file player with the given .org file data and sample rate.
   */
  constructor(songData: Uint8Array, private readonly waveData: WaveTable, private readonly sampleRate: number) {
    const songReader = new SongReader(sampleRate, waveData);

    // TODO: Actually, pass in a Song.
    this.song = songReader.parse(songData);

    this.sample = -4000; // HACK: Start a bit before the song actually does, to make sure that the browser doesn't stutter.
    this.state = [];
    for (let i = 0; i < 16; i++) {
      this.state.push({
        noteIndex: 0,
        wavetableOffset: 0,
        samplesPlayed: 0,
      });
    }
  }

  /**
   * Generates the provided number of samples, outputting them into a left / right array.
   */
  run = (stepCount: number, left: Float32Array, right: Float32Array) => {
    const buffer = [new Float32Array(stepCount), new Float32Array(stepCount)];

    for (let i = 0; i < stepCount; i++) {
      this.step(this.stepBuffer);
      left[i] = this.stepBuffer[0];
      right[i] = this.stepBuffer[1];
    }

    return buffer;
  };

  step = (stepBuffer: OutputStep) => {
    let left = 0;
    let right = 0;

    // Update each instrument.
    for (let i = 0; i < 16; i++) {
      this.stepChannel(i, this.channelBuffer);
      left += this.channelBuffer[0] * PRE_SCALE_CHANNEL_VOLUME;
      right += this.channelBuffer[1] * PRE_SCALE_CHANNEL_VOLUME;
    }

    this.sample++;

    // Have we looped around?
    if (this.sample >= this.song.endSamples) {
      for (let i = 0; i < 16; i++) {
        // Reset the sample count & the player states.
        this.state[i] = {
          noteIndex: this.song.channels[i].loopNote,
          wavetableOffset: 0,
          samplesPlayed: 0,
        };
      }

      // And rewind to the loop point.
      this.sample = this.song.startSamples;
    }
    const fadeIn = getFadeIn(this.sample);

    stepBuffer[0] = clamp(left) * fadeIn;
    stepBuffer[1] = clamp(right) * fadeIn;
  };

  stepChannel = (instrumentIndex: number, channelBuffer: OutputStep) => {
    const instrument = this.song.channels[instrumentIndex];
    const noteIndex = this.state[instrumentIndex].noteIndex;
    const isDrum = instrumentIndex >= 8;

    const note = noteIndex >= instrument.notes.length ? null : instrument.notes[noteIndex];

    let left = 0;
    let right = 0;

    if (note != null && this.sample > note.start) {
      const { pi } = instrument;
      const voiceIndex = instrument.instrument;

      // Play sample.
      if (!pi || this.state[instrumentIndex].samplesPlayed < PI_NOTE_LENGTH_SAMPLES) {
        const sample = !isDrum ? this.song.wavetable[voiceIndex] : this.song.drums[voiceIndex];
        const absoluteSamplePosition = this.state[instrumentIndex].wavetableOffset + note.sampleAdvance;

        const wavetableSample = this.getSample(sample, absoluteSamplePosition);

        left = wavetableSample * note.leftVolume;
        right = wavetableSample * note.rightVolume;

        this.state[instrumentIndex].wavetableOffset = absoluteSamplePosition;
        this.state[instrumentIndex].samplesPlayed++;

        // Apply a tiny envelope to the instruments, to prevent crackling.
        const envelope =
          getAttackEnvelope(isDrum, this.state[instrumentIndex].samplesPlayed) * getReleaseEnvelope(isDrum, this.state[instrumentIndex].samplesPlayed, note.end - note.start);

        left *= envelope;
        right *= envelope;
      }
    }

    // Advance the note index if it's finished playing.
    if (note != null && this.sample >= note.end) {
      this.state[instrumentIndex].wavetableOffset = 0;
      this.state[instrumentIndex].samplesPlayed = 0;
      this.state[instrumentIndex].noteIndex++;
    }

    channelBuffer[0] = left;
    channelBuffer[1] = right;
  };

  /**
   * Reads a single sample from a wavetable or drum sound buffer.
   *
   * @param wavetableOrDrum The sound to read the sample from.
   * @param offset The offset in samples of the sample to read.
   * @returns Returns the sample value (linearly interpolated.)
   */
  getSample = (wavetableOrDrum: number[], offset: number) => {
    // get the lerped value b/w the two samples.
    const v0 = wavetableOrDrum[Math.floor(offset) % wavetableOrDrum.length];
    const v1 = wavetableOrDrum[Math.ceil(offset) % wavetableOrDrum.length];
    const t = offset - Math.floor(offset);
    return v0 + t * (v1 - v0);
  };
}
