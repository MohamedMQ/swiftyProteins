module.exports = {
  preset: 'jest-expo',
  // metro.config.js registers `.txt` as a custom Metro asset extension
  // (used for ligands.txt and the bundled 3dmol.js script); jest-expo's
  // own asset extension list is hardcoded and doesn't know about it, so
  // any test that imports (even transitively) a module which imports a
  // `.txt` asset needs this to avoid a "Jest encountered an unexpected
  // token" parse failure.
  transform: {
    '^.+\\.txt$': require.resolve('jest-expo/src/preset/assetFileTransformer.js'),
  },
};
