import { Asset } from 'expo-asset';
import { File } from 'expo-file-system';

import threeDmolScriptAsset from '../../../assets/vendor/3dmol.min.txt';

let cachedScript: Promise<string> | null = null;

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
