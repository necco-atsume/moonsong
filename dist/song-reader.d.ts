import { BufferStream } from "./stream";
import { Channel, OrganyaFile } from "./types";
import { WaveTable } from "./wavetable";
/**
 * Reader which reads a .org file stream in to a parsed song.
 * @example `(new SongReader()).read(songData)`;
 */
export declare class SongReader {
    private readonly _sampleRate;
    private readonly _wavetable;
    private readonly _drums;
    private readonly useAlgorithmicPitch;
    constructor(_sampleRate: number, waveData: WaveTable);
    parseChannelData: (stream: BufferStream) => Channel;
    parse: (songData: Uint8Array) => OrganyaFile;
}
