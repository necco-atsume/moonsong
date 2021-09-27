import { WAVETABLE_ENTRY_SIZE } from "./constants";

/** Helper array "stream" wrapper, for reading the binary .org files. */
export class BufferStream {
  private readonly data: Uint8Array;
  private readonly view: DataView;
  private position: number;

  constructor(buffer: Uint8Array) {
    this.data = buffer;
    this.view = new DataView(buffer.buffer);
    this.position = 0;
  }

  next = (reader: (position: number) => number, size: 1 | 2 | 4) => () => {
    const value = reader(this.position);
    this.position += size;
    return value;
  };

  /** Skips the next n bytes in the stream. */
  skip = (bytes: number) => (this.position += bytes);

  /** Reads the next unsigned byte from the stream. */
  nextByte = this.next((pos) => this.view.getUint8(pos), 1);

  /** Reads the next signed byte from the stream. */
  nextSignedByte = this.next((pos) => this.view.getInt8(pos), 1);

  /** Reads the next 16 bit integer from the stream, little endian. */
  nextShort = this.next((pos) => this.view.getUint16(pos, true), 2);

  /** Reads the next signed 16 bit integer from the stream, little endian. */
  nextSignedShort = this.next((pos) => this.view.getInt16(pos, true), 2);

  /** Reads a big endian signed 16 bit integer from the stream. */
  nextBigEndianSignedShort = this.next((pos) => this.view.getInt16(pos, false), 2);

  /** Reads the next 32 bit integer from the stream, little endian. */
  nextInt = this.next((pos) => this.view.getInt32(pos, true), 4);

  /** Reads a whole wavetable from the stream. */
  nextWavetable = (): number[] => {
    const samples = [];

    for (let i = 0; i < WAVETABLE_ENTRY_SIZE; i++) {
      samples.push(this.nextSignedByte());
    }

    return samples;
  };

  /** Reads the whole stream as a drum sample. */
  asDrumSample = (): number[] => {
    const samples = [];
    while (this.position < this.data.length) {
      samples.push(this.nextBigEndianSignedShort());
    }
    return samples;
  };
}
