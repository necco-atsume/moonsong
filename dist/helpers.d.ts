/** Helper to clamp a value within [-1, 1]. */
export declare const clamp: (v: number) => number;
export declare const parseWavetable: (encodedWavetable: Uint8Array) => any[];
export declare const parseDrum: (encodedDrumSample: Uint8Array) => number[];
/** Helper to map from a beat number to a sample number, provided a wait value. */
export declare const beatToSample: (wait: number, sampleRate: number) => (beat: number) => number;
