export declare type WaveTable = {
    WAVE100: Uint8Array;
    DRUMS: readonly Uint8Array[];
};
/** Helper to, given a base url, pre-load the wave table and drums from a wave100.dat and 100-111.dat files. */
export declare const loadWavetableAndDrums: (baseUrl: string) => Promise<WaveTable>;
