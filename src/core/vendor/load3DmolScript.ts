import { Asset } from 'expo-asset';
import { File } from 'expo-file-system';

import threeDmolScriptAsset from '../../../assets/vendor/3dmol.min.txt';

let cachedScript: Promise<string> | null = null;

/**
 * 3Dmol.js needs a real browser DOM (it's WebGL + canvas + DOM based), so
 * it runs inside the WebView, not React Native's own JS runtime — this
 * loads its bundled source text so it can be inlined into the HTML we
 * hand the WebView, avoiding any runtime dependency on a CDN. Cached
 * in-memory since the script is ~500KB and every protein view would
 * otherwise re-read it from disk.
 */
export function load3DmolScript(): Promise<string> {
  if (cachedScript === null) {
    cachedScript = (async () => {
      const asset = Asset.fromModule(threeDmolScriptAsset);
      await asset.downloadAsync();
      const uri = asset.localUri ?? asset.uri;
      return new File(uri).text();
    })();
  }
  return cachedScript;
}
