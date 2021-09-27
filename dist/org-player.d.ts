declare type OutputStep = [number, number];
/**
 *
 */
export declare class OrganyaPlayer {
    private readonly sampleRate;
    private readonly song;
    private readonly stepBuffer;
    private readonly channelBuffer;
    private sample;
    private readonly state;
    /**
     * Creates a new Organya file player with the given .org file data and sample rate.
     */
    constructor(songData: Uint8Array, sampleRate: number);
    /**
     * Generates the provided number of samples, outputting them into a left / right array.
     */
    run: (stepCount: number, left: Float32Array, right: Float32Array) => Float32Array[];
    step: (stepBuffer: OutputStep) => void;
    stepChannel: (instrumentIndex: number, channelBuffer: OutputStep) => void;
    /**
     * Reads a single sample from a wavetable or drum sound buffer.
     *
     * @param wavetableOrDrum The sound to read the sample from.
     * @param offset The offset in samples of the sample to read.
     * @returns Returns the sample value (linearly interpolated.)
     */
    getSample: (wavetableOrDrum: number[], offset: number) => number;
}
export {};
