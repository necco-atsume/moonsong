export type OrganyaFile = {
  sampleRate: number;
  startSamples: number;
  endSamples: number;
  channels: Channel[];
  wavetable: number[][];
  drums: number[][];
  samplesPerBeat: number;
};

export type Channel = {
  voice: number;
  instrument: number;
  pi: boolean;

  notes: Note[];
  noteCount: number;

  loopNote: number;
};

export type Note = {
  start: number;
  end: number;
  length: number;

  pitch: number;

  volume: number;
  pan: number;

  sampleAdvance: number;

  // Precomputed volume values.
  leftVolume: number;
  rightVolume: number;
};
