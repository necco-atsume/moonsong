import { DECAY_TO, DRUM_ENVELOPE_CUTOFF_SAMPLES, ENVELOPE_CUTOFF_SAMPLES, FADE_IN_SAMPLES, USE_ENVELOPE } from "./constants";

export const getFadeIn = (absoluteSamples: number): number => {
  if (absoluteSamples > FADE_IN_SAMPLES) return 1.0;
  else return absoluteSamples / FADE_IN_SAMPLES;
};

// TODO: These are not sample-rate independent!
// Remove some crackling with a really small envelope (100 samples)
export const getAttackEnvelope = (isDrum: boolean, samples: number): number => {
  if (!USE_ENVELOPE) return 1;
  const cutoff = isDrum ? DRUM_ENVELOPE_CUTOFF_SAMPLES : ENVELOPE_CUTOFF_SAMPLES;
  if (samples > cutoff) return 1.0;
  else {
    return samples / cutoff;
  }
};

export const getReleaseEnvelope = (isDrum: boolean, samples: number, length: number): number => {
  return getAttackEnvelope(isDrum, length - samples);
};

export const getDecayEnvelope = (fadeoffOverSamples: number, samplesPlayed: number): number => {
  // From looking at recordings in audacity, this drop off is sharp. 
  // This sounds correct too. I _think_ it's held a single beat.
  if (samplesPlayed > fadeoffOverSamples) return DECAY_TO;
  else return 1;
};

