import { CHANNEL_COUNT, PITCH_BEND_NORMALIZATION_FACTOR } from "./constants";
import { beatToSample, parseDrum, parseWavetable } from "./helpers";
import { BufferStream } from "./stream";
import { Channel, OrganyaFile } from "./types";
import { WAVE100, DRUMS } from "./wavetable";

// Accurate volume and pan from http://rnhart.net/orgmaker, NXEngine-Evo

const FrequenciesByNote = [262, 277, 294, 311, 330, 349, 370, 392, 415, 440, 466, 494];
const OctavePeriod = [32, 64, 64, 128, 128, 128, 128, 128];
const WaveLengthsByOctave = [256, 256, 128, 128, 64, 32, 16, 8];
const Pan = [0, 43, 86, 129, 172, 215, 256, 297, 340, 383, 426, 469, 512];

const getAccurateVolumeScaleFactor = (noteVolume: number): number => {
  // i.cur_vol = powf(10.0, ((event.volume - 255) * 8) / 2000.0) / 128.0;
  const relativeVolume = noteVolume - 255;
  return Math.pow(10, (relativeVolume * 8) / 2000);
};

const getAccuratePanningScaleFactor = (pan: number): [number, number] => {
  const panIndex = Math.floor(Math.min(12, Math.max(0, pan)));
  const panValue = (Pan[panIndex] - 256) * 10;
  let left = 1;
  let right = 1;

  if (panValue < 0) {
    right = Math.pow(10, panValue / 2000);
  } else if (pan > 0) {
    left = Math.pow(10, -panValue / 2000);
  }
  return [left, right];
};

/**
 * Reader which reads a .org file stream in to a parsed song.
 * @example `(new SongReader()).read(songData)`;
 */
export class SongReader {
  private readonly _wavetable: number[][];
  private readonly _drums: number[][];

  private readonly useAlgorithmicPitch = true;

  constructor(private readonly _sampleRate: number) {
    this._wavetable = parseWavetable(WAVE100);
    this._drums = DRUMS.map(parseDrum);
  }

  parseChannelData = (stream: BufferStream): Channel => {
    const voice = stream.nextSignedShort();
    const instrument = stream.nextByte();
    const pi = stream.nextByte() != 0;
    const noteCount = stream.nextShort();

    return { voice, instrument, pi, noteCount, notes: [], loopNote: 0 };
  };

  parse = (songData: Uint8Array): OrganyaFile => {
    const stream = new BufferStream(songData);
    const drumLengths = this._drums.map((a) => a.length);

    stream.skip(6); // Header

    // Wait in msec between beats.
    const wait = stream.nextShort();

    const sampleTime = beatToSample(wait, this._sampleRate);
    const beatLengthSamples = sampleTime(1);

    stream.skip(2); // Time signature isn't important for playback.

    const songStart = sampleTime(stream.nextInt());
    const songEnd = sampleTime(stream.nextInt());

    const channelData: Channel[] = [];

    // Read all 16 instrument blocks
    for (let i = 0; i < CHANNEL_COUNT; i++) {
      channelData.push(this.parseChannelData(stream));
    }

    // Read each of the note blocks for every instrument.
    for (let i = 0; i < CHANNEL_COUNT; i++) {
      // Org format interprets 0xff as what was on the previous note.
      let lastPitch = 95;
      let lastLength = 1;
      let lastVolume = 254;
      let lastPan = 6;

      // Beat: uint32, start of the note, in beats.
      for (let n = 0; n < channelData[i].noteCount; n++) {
        const beat = stream.nextInt(); // # of beat in the song.
        channelData[i].notes.push({ start: Math.floor(sampleTime(beat)), end: 0, leftVolume: 0, rightVolume: 0, pan: 0, pitch: 0, sampleAdvance: 0, volume: 0, length: 0 });
      }

      // Pitch
      for (let n = 0; n < channelData[i].noteCount; n++) {
        let pitch = stream.nextByte();
        if (pitch == 0xff) pitch = lastPitch;
        lastPitch = pitch;
        channelData[i].notes[n].pitch = pitch;
      }

      // Length: uint8, 0-254
      for (let n = 0; n < channelData[i].noteCount; n++) {
        let length = stream.nextByte();
        if (length == 0xff) length = lastLength;
        lastLength = length;
        channelData[i].notes[n].end = channelData[i].notes[n].start + sampleTime(length);
        channelData[i].notes[n].length = length;
      }

      // Volume: uint8, 0-254.
      for (let n = 0; n < channelData[i].noteCount; n++) {
        let volume = stream.nextByte();
        if (volume == 0xff) volume = lastVolume;
        lastVolume = volume;
        channelData[i].notes[n].volume = volume;
      }

      // Pan: uint8, 0-12.
      for (let n = 0; n < channelData[i].noteCount; n++) {
        let pan = stream.nextByte();
        if (pan == 0xff) pan = lastPan;
        lastPan = pan;
        channelData[i].notes[n].pan = pan;
      }

      // Do some pre-calculations here - get the octave / point speed for the note.
      for (let n = 0; n < channelData[i].noteCount; n++) {
        const note = channelData[i].notes[n];
        const pitch = note.pitch;
        const isDrum = i >= 8;

        const pitchBend = channelData[i].voice / PITCH_BEND_NORMALIZATION_FACTOR;

        let freq = 0;
        // Note: frequency algorithm & lookups referenced from: https://github.com/nxengine/nxengine-evo/blob/master/src/sound/Organya.cpp
        if (this.useAlgorithmicPitch) {
          // Algorithmi
          freq = Math.pow(2, (pitch + pitchBend + 155.376) / 12);
        } else {
          // TODO: Figure out what NxEngine's doing here. This is supposed to be "more accurate".
          const note = Math.floor(pitch % 12);
          const octave = Math.floor(pitch / 12);
          freq = FrequenciesByNote[note] * OctavePeriod[octave] + (channelData[i].voice - 1000);
        }

        const speed = freq / this._sampleRate;

        const [panLeft, panRight] = getAccuratePanningScaleFactor(note.pan);
        const volumeScale = getAccurateVolumeScaleFactor(note.volume);

        note.leftVolume = panLeft * volumeScale;
        note.rightVolume = panRight * volumeScale;

        note.sampleAdvance = speed;

        // And set the correct note length for drum notes.
        if (isDrum) {
          // Also referencing NxEngine here: Drum frequencies are different than instrument ones in a way that's not obvious.
          // And drums don't care about the length? (???)
          note.sampleAdvance = (note.pitch * 800 + 100) / this._sampleRate;

          // Clip drum length.
          note.end = Math.floor(note.start + Math.min(drumLengths[channelData[i].instrument] / note.sampleAdvance, (beatLengthSamples * note.length) / note.sampleAdvance));

          // Kill the note early if there's another drum before the end of this one.
          const nextNote = channelData[i].notes[n + 1];
          if (!!nextNote) {
            note.end = Math.floor(Math.min(note.end, nextNote.start - 1));
          }
        }

        if (channelData[i].pi) {
          // Sourced from: http://rnhart.net/orgmaker/vol-pan-pi.htm & NXEngine-Evo
          const octave = Math.floor(pitch / 12);
          const noteLengthSamples = (octave + 1) * 4 * WaveLengthsByOctave[octave];
          note.end = note.start + noteLengthSamples;
        }
      }

      channelData[i].notes.sort((l, r) => l.start - r.start); // Sanity check just in case they're not sorted.

      // Now, calculate loop notes for each of the instruments. When the song loops, it'll set this as the active one.
      for (let n = 0; n < channelData[i].noteCount; n++) {
        const loopNote = channelData[i].notes.findIndex((n) => n.end > songStart);

        if (loopNote != -1) {
          // Check if we loop _within_ a note. If we do, then play that note.
          channelData[i].loopNote = loopNote;
        } else {
          channelData[i].loopNote = 0;
        }
      }
    }
    return { startSamples: songStart, endSamples: songEnd, channels: channelData, sampleRate: this._sampleRate, drums: this._drums, wavetable: this._wavetable };
  };
}
