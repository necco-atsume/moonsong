const load = async (url: string): Promise<Uint8Array> => {
  const response = await fetch(url);
  const contents = await response.body.getReader().read();
  return contents.value!;
};

export type WaveTable = {
  WAVE100: Uint8Array;
  DRUMS: readonly Uint8Array[];
};

/** Helper to, given a base url, pre-load the wave table and drums from a wave100.dat and 100-111.dat files. */
const loadWavetableAndDrums = async (baseUrl: string): Promise<WaveTable> => {
  const separator = !baseUrl.endsWith('/') ? '/' : '';
  const path = (name: string) => baseUrl + separator + name;

  const WAVE100 = await load(path('wave100.dat'));
  const DRUMS: Uint8Array[] = [
    await load(path('100.dat')),
    await load(path('101.dat')),
    await load(path('102.dat')),
    await load(path('103.dat')),
    await load(path('104.dat')),
    await load(path('105.dat')),
    await load(path('106.dat')),
    await load(path('107.dat')),
    await load(path('108.dat')),
    await load(path('109.dat')),
    await load(path('110.dat')),
    await load(path('111.dat')),
  ];

  return { WAVE100, DRUMS };
};