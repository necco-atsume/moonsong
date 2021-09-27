/** Helper to clamp a value within [-1, 1]. */
export declare const clamp: (v: number) => number;
/** Helper which takes a base64encoded string, and parses it to a byte buffer. */
export declare const base64ToByteBuffer: (base64EncodedData: string) => Uint8Array;
export declare const parseWavetable: (encodedWavetable: string) => any[];
export declare const parseDrum: (encodedDrumSample: string) => number[];
/** Helper to map from a beat number to a sample number, provided a wait value. */
export declare const beatToSample: (wait: number, sampleRate: number) => (beat: number) => number;
