# Swifty Protein

A mobile 3D ligand/protein visualizer for **Noachlly Global Pharmaceutics Drugs & Medicine Inc.**, built on top of the RCSB Protein Data Bank. Users authenticate with a password or biometrics, browse ligands, and inspect each one as an interactive 3D Ball-and-Stick model.

## Overview

Proteins are the workhorses of biological systems, and their 3D shape determines their function. This app lets researchers pull a ligand's structural data straight from RCSB and explore it in 3D — rotate, zoom, and inspect individual atoms — to get a fast, intuitive read on molecular structure.

## Features

### Authentication
- Account creation with a unique username and a password meeting a minimum strength policy.
- Login via biometrics (Face ID / Touch ID / fingerprint) with a password fallback when biometrics aren't available or fail.
- Credentials are never stored in plain text.
- For security, the login screen is always shown on launch and whenever the app returns from the background — regardless of prior authentication.

### Ligand list
- Full list of ligand codes loaded from `ligands.txt`.
- Real-time, case-insensitive search that filters as you type.
- Smooth scrolling even with large datasets.

### 3D protein view
- Fetches and parses the ligand's `.cif` file from `https://files.rcsb.org/ligands/view/{ligand}.cif`.
- Renders a Ball-and-Stick model with standard CPK atom coloring.
- Tap an atom to see its details; tap elsewhere to dismiss.
- Rotate by dragging, zoom by pinching.
- Share a screenshot of the current view via the native share sheet.
- Clear loading and error states for network failures, missing ligands, and malformed data.

## Tech stack

- **React Native** with TypeScript
- Custom `.cif` parser (no legacy `.pdb` format)
- WebGL-based 3D rendering (`three.js`)
- Platform secure storage for credentials (Keychain / Android Keystore)
- Native biometric APIs with password fallback
- `react-navigation` for app navigation

## Getting started

```bash
# install dependencies
npm install

# run on iOS
npm run ios

# run on Android
npm run android
```

## Project status

Early development — scaffolding and core screens are being built out incrementally, day by day.

## License

Private project — all rights reserved.
