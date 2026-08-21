module.exports = {
  preset: 'jest-expo',
  transform: {
    '^.+\\.txt$': require.resolve('jest-expo/src/preset/assetFileTransformer.js'),
  },
};
