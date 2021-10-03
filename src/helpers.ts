import { BufferStream } from "./stream";

/** Helper to clamp a value within [-1, 1]. */
export const clamp = (v: number): number => {
  if (v > 1) {
    return 1;
  } else if (v < -1) {
    return -1;
  } else {
    return v;
  }
};

/** Helper which takes a base64encoded string, and parses it to a byte buffer. */
export const base64ToByteBuffer = (base64EncodedData: string) => {
  const decoded = atob(base64EncodedData);
  const buffer = new Uint8Array(decoded.length);
  for (let i = 0; i < decoded.length; i++) {
    buffer[i] = decoded.charCodeAt(i);
  }
  return buffer;
};

export const parseWavetable = (encodedWavetable: Uint8Array) => {
  const instruments = [];
  const stream = new BufferStream(encodedWavetable);
  for (let i = 0; i < 100; i++) {
    const wavetableInstrument = stream.nextWavetable();
    instruments.push(wavetableInstrument.map((sbyte) => (1.0 * sbyte) / 256.0)); // FIXME: Off-by-one here because this is +127/-128?
  }
  return instruments;
};

export const parseDrum = (encodedDrumSample: Uint8Array) => {
  const stream = new BufferStream(encodedDrumSample);
  return stream.asDrumSample().map((short) => (1.0 * short) / 32767.0); // See above: Off by one? a
};

/** Helper to map from a beat number to a sample number, provided a wait value. */
export const beatToSample = (wait: number, sampleRate: number) => (beat: number) => {
  const samplesPerMsec = Math.floor(sampleRate / 1000);
  const samplesPerBeat = samplesPerMsec * wait;
  return beat * samplesPerBeat;
};
