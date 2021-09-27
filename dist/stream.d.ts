/** Helper array "stream" wrapper, for reading the binary .org files. */
export declare class BufferStream {
    private readonly data;
    private readonly view;
    private position;
    constructor(buffer: Uint8Array);
    next: (reader: (position: number) => number, size: 1 | 2 | 4) => () => number;
    /** Skips the next n bytes in the stream. */
    skip: (bytes: number) => number;
    /** Reads the next unsigned byte from the stream. */
    nextByte: () => number;
    /** Reads the next signed byte from the stream. */
    nextSignedByte: () => number;
    /** Reads the next 16 bit integer from the stream, little endian. */
    nextShort: () => number;
    /** Reads the next signed 16 bit integer from the stream, little endian. */
    nextSignedShort: () => number;
    /** Reads a big endian signed 16 bit integer from the stream. */
    nextBigEndianSignedShort: () => number;
    /** Reads the next 32 bit integer from the stream, little endian. */
    nextInt: () => number;
    /** Reads a whole wavetable from the stream. */
    nextWavetable: () => number[];
    /** Reads the whole stream as a drum sample. */
    asDrumSample: () => number[];
}
