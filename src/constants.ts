// Sample rate drums are recorded in - in hz.
export const DRUM_SAMPLE_RATE = 22050;

// Number of different channels in the file.
export const CHANNEL_COUNT = 16;

// Size of an entry in the wavetable.
export const WAVETABLE_ENTRY_SIZE = 256;

// The "PI" flag on an instrument sets the length to
// Probably short for 'Pizzacato.'
export const PI_NOTE_LENGTH_SAMPLES = 1024; // TODO: This is wrong: 'PI' determines how many periods of the wave play.
export const PITCH_BEND_NORMALIZATION_FACTOR = 1000;
export const CHANNEL_PRESCALE = 0.5;

export const ENVELOPE_CUTOFF_SAMPLES = 50;
export const DRUM_ENVELOPE_CUTOFF_SAMPLES = 15;

export const FADE_IN_SAMPLES = 1000;

export const PRE_SCALE_TRACK_VOLUME = 1 / 3;

export const USE_ENVELOPE = true;

export const DECAY_TO = .5;
