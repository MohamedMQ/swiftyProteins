# Swifty Protein

A mobile 3D ligand/protein visualizer for **Noachlly Global Pharmaceutics Drugs & Medicine Inc.**, built on top of the RCSB Protein Data Bank. It's a React Native (Expo) rewrite of the classic 42-school "Swifty Companion"-style subject: users authenticate (password or fingerprint/Face ID), search a bundled list of ~28,000 ligand codes, fetch the ligand's real structural data from RCSB, and inspect it as an interactive 3D molecule — rotate, zoom, tap atoms, measure distances, switch render styles, and export a screenshot.

## Table of contents

- [What the app does](#what-the-app-does)
- [Tech stack](#tech-stack)
- [Project structure](#project-structure)
- [Screen flow (`App.tsx`)](#screen-flow-apptsx)
- [Authentication & the fingerprint system](#authentication--the-fingerprint-system)
- [The 3D rendering pipeline](#the-3d-rendering-pipeline)
- [Networking & persistence](#networking--persistence)
- [Design system](#design-system)
- [Testing](#testing)
- [Getting started](#getting-started)

---

## What the app does

Proteins (and the small-molecule ligands that bind to them) are the workhorses of biology, and their 3D shape determines their function. This app lets a researcher type a ligand's PDB chemical component code (e.g. `HEM`, `ATP`, `ZN`), pull its structure straight from RCSB, and explore it in 3D to get a fast, intuitive read on molecular geometry — which atoms exist, how they're bonded, and how far apart they are.

Core user journey:

1. **Sign up / log in** — password account, or fingerprint/Face ID once an account exists on the device.
2. **Browse ligands** — a searchable, favoritable list of every ligand code in `assets/data/ligands.txt`.
3. **Fetch structure** — the app downloads `https://files.rcsb.org/ligands/view/{CODE}.cif` for the selected code.
4. **View in 3D** — the `.cif` is parsed, converted to an SDF molfile, and rendered by 3Dmol.js (WebGL) inside a WebView: ball-and-stick by default, with space-filling/wireframe/stick alternatives, atom tap-to-inspect, double-tap-to-center, a two-point distance-measurement tool, optional atom-label overlays, and PNG/JPEG sharing of the current view.

## Tech stack

| Concern | Library |
|---|---|
| App framework | React Native 0.86 + Expo SDK 57, TypeScript |
| 3D rendering | [3Dmol.js](https://3dmol.csb.pitt.edu/) running inside `react-native-webview` (WebGL needs a real browser DOM, which RN's JS runtime doesn't have) |
| Structure format | Custom hand-written `.cif` (mmCIF chemical-component dictionary) parser — **not** the legacy `.pdb` format, and not 3Dmol's own CIF reader (see [why](#the-3d-rendering-pipeline)) |
| Secure storage | `expo-secure-store` (iOS Keychain / Android Keystore) |
| Password hashing | PBKDF2-HMAC-SHA256 via `@noble/hashes`, 210k iterations |
| Biometrics | `expo-local-authentication` (Face ID / Touch ID / Android fingerprint & face unlock) |
| Networking | `fetch` + `@react-native-community/netinfo` for connectivity checks |
| 2D vector graphics | `react-native-svg` (per-row molecule glyph icons) |
| Tests | Jest + `jest-expo` |

## Project structure

```
src/
  core/                     # Framework-agnostic logic — no React, no RN UI
    auth/                   # Account registration/login rules
    chemistry/              # Element lookup table for display
    hooks/                  # useDebouncedValue
    networking/             # RCSB HTTP client, error classification, connectivity
    parsing/                # .cif tokenizer/parser + SDF serializer
    persistence/            # Everything read from/written to disk (secure or plain)
    security/               # Password hashing, secure storage, biometrics, app-lock
    vendor/                 # Loads the bundled 3Dmol.js script
    viewer/                 # VisualizationMode type shared across features
  design-system/            # Colors, spacing, typography, shared components
  features/                 # Screens, composed from core/ + design-system/
    app-lock/                # Privacy overlay shown when backgrounded
    auth/                    # Login / sign-up screens
    ligand-list/              # Searchable ligand list
    protein-view/              # The 3D viewer screen and its WebView bridge
    settings/                  # Default visualization mode & label preferences
    splash/                    # Boot splash
```

## Screen flow (`App.tsx`)

`App.tsx` is the only piece of navigation state in the app — there's no router, just a small state machine:

1. Waits for `loadLigandCodes()` (ligand list parsed from the bundled text asset) **and** a minimum 1.5s splash duration, whichever finishes last, before leaving `SplashScreen`.
2. If `useAppLock()` reports `isLocked`, shows `AuthFlow` (login/sign-up) — see below.
3. Otherwise shows `LigandListScreen`, or `ProteinViewScreen` if a ligand has been loaded, or `SettingsScreen` if the user tapped the gear icon. All three are mutually exclusive, driven by simple `useState`.
4. `PrivacyOverlay` is always mounted on top of everything and independently reacts to `AppState`, covering the screen the instant the app leaves the foreground (see below).

## Authentication & the fingerprint system

The subject requires accounts to be protected by a password **or** the device's biometric sensor — fingerprint, Face ID, or iris, depending on hardware. This app never stores a fingerprint template itself (that's physically impossible for an app — it never leaves the OS's secure enclave); instead it asks the OS "did the enrolled owner of this device just prove their identity?" and, if yes, logs back in as whichever account last logged in successfully on that device.

### `core/security/biometricService.ts`

- **`getBiometricCapability()`** — queries `expo-local-authentication` in parallel for `hasHardwareAsync()`, `isEnrolledAsync()`, and `supportedAuthenticationTypesAsync()`, and bundles them into one `BiometricCapability` object.
- **`isBiometricLoginAvailable(capability)`** — true only if the device both *has* a sensor and *has something enrolled* on it (a phone can have a fingerprint reader with nothing registered).
- **`getBiometricButtonLabel(types)`** — picks the button copy ("Use Touch ID" / "Use fingerprint" / "Use Face ID" / "Use face unlock" / "Use iris scan"). Fingerprint is checked before facial recognition because Android devices frequently report both types as *supported* even when only a fingerprint is actually *enrolled*; iPhones with no fingerprint sensor at all still fall through correctly to Face ID.
- **`authenticateWithBiometrics(promptMessage)`** — wraps `LocalAuthentication.authenticateAsync`, triggering the native OS biometric prompt. `disableDeviceFallback: true` and an empty `fallbackLabel` suppress the OS's own "enter device passcode" fallback, because the app already has its own password form for that — offering two unrelated fallback paths would be confusing. Returns the native `LocalAuthenticationResult` (`{ success: true }` or `{ success: false, error }`).

### `core/security/biometricErrorMessages.ts`

- **`mapBiometricError(error)`** — turns every possible `LocalAuthenticationError` code into user-facing copy (e.g. `'not_enrolled'` → "No biometrics are set up on this device. Use your password to log in."). Returns `null` for `user_cancel`/`user_fallback` specifically, since the user backing out of the prompt on purpose isn't an error worth surfacing — the UI just quietly falls back to the password form.

### `core/security/passwordHashing.ts`

Passwords are never stored or compared in plaintext.

- **`hashPassword(password)`** — generates a random 16-byte salt (`expo-crypto`), runs PBKDF2-HMAC-SHA256 at **210,000 iterations** (`@noble/hashes`, pure JS since Hermes has no native crypto fast path here — `pbkdf2Async` is used so the derivation yields periodically and doesn't freeze the UI thread) to derive a 32-byte key, and returns `{ algorithm, iterations, saltHex, hashHex }`.
- **`verifyPassword(password, record)`** — re-derives the hash with the same stored salt/iteration count and compares it to the stored hash using **`timingSafeEqual`** (constant-time XOR comparison), so a login attempt can't leak information about how many leading bytes matched via response-time differences.

### `core/security/secureStore.ts`

Thin JSON wrapper around `expo-secure-store`, i.e. the **iOS Keychain / Android Keystore** — hardware-backed secure storage, not `AsyncStorage`. `getSecureJSON`, `setSecureJSON`, `deleteSecureItem` — every credential in the app goes through this, never through the plain-file persistence layer used for favorites/preferences.

### `core/auth/authService.ts`

The account "database" itself: a single JSON object (`{ [normalizedUsername]: StoredUser }`) held in secure storage under the key `auth.users`.

- **`registerUser(username, password)`** — validates both fields (`core/auth/validation.ts`), rejects if the (case-insensitive) username is taken, otherwise hashes the password and writes the new user record, then remembers this username as `auth.lastUsername` (see below).
- **`loginUser(username, password)`** — looks up the user and calls `verifyPassword`. **Timing-attack mitigation:** if the username doesn't exist, it verifies against a hardcoded `DUMMY_PASSWORD_HASH` anyway, so a wrong password and a nonexistent username take the same amount of time — otherwise an attacker could enumerate valid usernames just by measuring response latency (a missing user would return immediately, skipping the ~expensive PBKDF2 call a real user forces).
- **`loginWithBiometrics()`** — the actual fingerprint/Face ID login path. A biometric scan only proves *device ownership*, not *which account* — it can't disambiguate between two accounts registered on the same phone — so this simply logs back in as whichever username is stored under `auth.lastUsername`, the same single-user assumption most personal-device apps make for biometric unlock. If no account has ever logged in on this device, it fails with `INVALID_CREDENTIALS`.
- **`getLastAuthenticatedUsername()`** — reads that remembered username (not a secret, just a pointer to *who* biometrics should unlock).

### `core/auth/validation.ts`

Pure, side-effect-free rule checks, each returning an array of human-readable error strings (empty = valid):

- **`validateUsername(username)`** — 3–24 characters, `[a-zA-Z0-9_.-]` only.
- **`validatePassword(password)`** — minimum 8 characters, at least one digit, at least one letter.

### `core/security/useAppLock.ts` & `features/app-lock/PrivacyOverlay.tsx`

Two independent, deliberately overlapping safeguards, both driven by React Native's `AppState`:

- **`useAppLock()`** — `isLocked` starts `true` (covers first launch) and is *only* ever cleared by an explicit `unlock()` call after a real login/registration. Whenever the app goes to `'background'` or `'inactive'`, it's forced back to `true` — the subject's requirement that the login screen must always reappear after backgrounding, regardless of prior authentication, with no "stay logged in" grace period.
- **`PrivacyOverlay`** — mounted at the very top of the component tree, independent of `isLocked`. It reacts to *any* non-`'active'` app state by immediately painting an opaque/blurred cover over the whole screen. This exists because `isLocked` alone isn't fast enough: by the time React re-renders the login screen in place of whatever was on-screen, the OS may have already taken its app-switcher snapshot of the *previous* screen (e.g. an open ligand). The overlay guarantees nothing sensitive is ever visible in the app switcher or during the brief gap before the lock screen mounts. It's an opaque dark fill on Android (no cheap native blur available) and a frosted `BlurView` on iOS.

## The 3D rendering pipeline

This is the heart of the app. React Native has no native WebGL context of its own, so **3Dmol.js** — a WebGL molecular-visualization library — runs inside a hidden `react-native-webview`, which is a real embedded browser with its own DOM and canvas. The RN side's job is: parse the raw RCSB data → convert it to a format 3Dmol understands → build one self-contained HTML page with 3Dmol's script inlined → hand it to the WebView → bridge events back out via `postMessage`.

### Why a custom `.cif` parser at all?

RCSB serves ligand definitions in the mmCIF **chemical-component dictionary** format (categories `_chem_comp_atom` / `_chem_comp_bond`) — not full crystallographic `_atom_site.*` records, and not legacy `.pdb`. 3Dmol.js's *own* built-in CIF reader only understands the `_atom_site.*` form, so it can't read RCSB's ligand-view files directly. The subject also specifically calls for writing a real `.cif` parser rather than falling back to the older `.pdb` format. So the pipeline is: **hand-written CIF parser → in-memory `Molecule` → hand-written SDF (MDL Molfile V2000) serializer → 3Dmol.js**, using SDF only as the final hand-off format 3Dmol natively supports.

#### `core/parsing/cifTokenizer.ts` — generic CIF line/category reader

- **`tokenizeCifLine(line)`** — splits one line into whitespace-separated tokens, respecting `'...'`/`"..."` quoted values that themselves contain whitespace or the *other* quote character (e.g. an atom name like `"O5'"`). A naive `split(' ')` would break on quoted chemical names like `"D-saccharide, beta linking"`.
- **`stripCifTextBlocks(rawText)`** — removes multi-line `;`-delimited free-text blocks (chemical synonyms, descriptions) before any other parsing happens, since line-based category scanning would otherwise misinterpret their contents as tags/rows.
- **`extractCifCategory(lines, category)`** — the core category reader. Handles *both* legal CIF representations found in real RCSB files:
  - **`loop_` form** — a `loop_` line, N `_category.tag` lines (one per column), then data rows that can wrap across multiple physical lines (tokens are accumulated and re-chunked by tag count, not by line boundary).
  - **flat form** — each tag on its own line with one inline value and no `loop_` keyword, which is what RCSB uses for single-atom ligands like `ZN` or `CA` (a "table" with exactly one row).
  Returns `null` if the category isn't present in either form (e.g. no bonds for a lone ion).

#### `core/parsing/cifValues.ts` — value-level helpers

- **`isMissingCifValue(value)`** — CIF uses `?` for "unknown" and `.` for "not applicable"; both are treated as missing.
- **`parseCifCoordinate(value)`** — parses a coordinate string to a finite number, or `null` if missing/unparseable.
- **`normalizeElementSymbol(typeSymbol)`** — RCSB stores symbols as `"FE"`, `"CL"`; this normalizes to standard casing (`"Fe"`, `"Cl"`) for both display and 3Dmol's Jmol color scheme lookup.

#### `core/parsing/cifAtomParser.ts`

- **`parseAtoms(atomTable)`** — maps each `_chem_comp_atom` row to a `ParsedAtom { id, element, position }`, where `position` can still be `null` at this stage.
- **`resolveAtomPosition(row)`** *(internal)* — prefers `model_Cartn_{x,y,z}` (the experimentally observed coordinates); falls back to `pdbx_model_Cartn_{x,y,z}_ideal` (Corina-computed idealized coordinates) when the model position is `?` — which happens for entries like `UNK` (unmodeled residues) that have no observed structure at all.

#### `core/parsing/cifBondParser.ts`

- **`parseBonds(bondTable)`** — maps each `_chem_comp_bond` row to a `Bond { atomIdA, atomIdB, order, isAromatic }`. `bondTable === null` (no bond category — true for single-atom ligands) simply yields `[]`, not an error. An unrecognized `value_order` code falls back to `'single'` rather than throwing.

#### `core/parsing/molecule.ts` — assembly

- **`parseMolecule(rawCif)`** — the top-level entry point. Strips text blocks, extracts the `chem_comp_atom` category (throwing `CifParseError` if absent — a hard failure), parses atoms and drops any without a resolvable position, throws again if *zero* atoms are left. Extracts `chem_comp_bond` (optional) and drops any bond whose endpoint atom got dropped. Returns a full `Molecule { atoms, bonds, formula, centroid }`.
- **`computeMolecularFormula(atoms)`** — builds the Hill-notation formula string (carbon first, then hydrogen, then everything else alphabetically; pure alphabetical if there's no carbon at all) — e.g. `C10H16N5O13P3` for ATP.
- **`computeCentroid(atoms)`** — arithmetic mean of all atom positions; not currently used for camera framing (3Dmol's own `zoomTo()` handles that) but available for future use / display.

#### `core/parsing/moleculeToSdf.ts`

- **`moleculeToSdf(molecule, name)`** — serializes the parsed `Molecule` into an **MDL Molfile (SDF V2000)** string: header lines, a fixed-width counts line (`aaa bbb  0  0...`), one fixed-width coordinate+element line per atom, one bond line per bond (`atom1 atom2 order 0`), terminated by `M  END`. Bond lines are computed *before* the counts line is written, because the declared atom/bond counts must exactly match the number of lines that follow or 3Dmol's V2000 reader will misparse the rest of the file — any bond referencing a dropped atom is excluded from both the count and the output.

### `core/vendor/load3DmolScript.ts`

- **`load3DmolScript()`** — loads the ~500KB 3Dmol.js source (bundled as a plain-text asset, `assets/vendor/3dmol.min.txt`) from disk via `expo-asset`/`expo-file-system`, so the app never depends on a CDN at runtime. The result is memoized in a module-level `Promise` so the file is only read from disk once, no matter how many protein views are opened.

### `features/protein-view/proteinViewerHtml.ts` — the WebView's world

- **`buildProteinViewerHtml(threeDmolScript, sdf, options)`** — builds the entire self-contained HTML page handed to the WebView. `threeDmolScript` is injected verbatim (trusted, bundled asset); `sdf` is passed through `JSON.stringify`, so any character it contains is safely escaped as a JS string literal rather than interpreted as HTML/script markup. `options` seeds the *initial* visualization mode and label visibility from the user's saved preferences, so the viewer opens directly in the right state instead of flashing hardcoded defaults first.

  Inside the generated page's script, per-render-style settings live in a `STYLES` table (`ballAndStick`, `spaceFilling`, `wireframe`, `stick`), all using 3Dmol's built-in **`'Jmol'`** color scheme — the standard CPK atom-coloring convention. Sphere/stick scale constants at the top of the module (`SPHERE_SCALE = 0.35`, `STICK_RADIUS = 0.08`, etc.) were tuned to match the proportions of an earlier native ball-and-stick renderer.

  Behavior wired up in that inline script:
  - **`viewer.addModel(sdf, 'sdf')`** loads the molecule once; every mode switch afterward just calls `viewer.setStyle()` again — the model is never re-parsed or re-added.
  - **`viewer.setClickable({}, true, handler)`** — the tap handler for every atom. On a normal tap it clears any previous selection, highlights *every* atom sharing the tapped atom's element (bonus "highlight same element" feature) at a smaller scale bump, then re-applies a stronger highlight to just the tapped atom so it still stands out from its own element group, and posts an `atomClick` message containing the atom's id/element/position plus a resolved list of its bonds (neighbor element, bond order, and Euclidean bond length in Å — computed directly from the SDF's own coordinates).
  - **Double-tap detection** — two taps on the same atom serial within 350ms re-centers the camera on that atom (`viewer.center(...)`, a 400ms animation) without changing zoom, unlike `zoomTo()`.
  - **Background-tap dismissal** — a container-level `click` listener posts `backgroundClick` to clear the selection, but only if it fires more than 50ms after the last atom-specific click — since a tap on an atom also bubbles to the container, and 3Dmol.js has no separate "background click" event of its own to distinguish the two.
  - **Measurement mode** (`window.__setMeasureModeEnabled(enabled)`) — while enabled, atom taps stop selecting/highlighting and instead pick two points: the first tap remembers an atom, the second draws a dashed yellow line (`viewer.addLine`) and a distance label in Ångströms (`viewer.addLabel`, straight-line Euclidean distance) between them, posting the result back. Tapping the same pending atom again cancels the pick.
  - **`window.__setVisualizationMode(mode)`** — swaps the active `STYLES` entry and reapplies it to the whole model in place (re-highlighting the currently-selected atom under the new style), without touching the underlying SDF model.
  - **`window.__setAtomLabelsVisible(visible)`** — removes all labels, then (if enabling) adds one per-atom element-symbol label per currently-loaded atom, re-derived live from the model's current atom positions each call so labels stay correct regardless of which visualization mode is active.
  - **`window.__captureSnapshot(format)`** — exports the current WebGL canvas exactly as rendered (rotation, zoom, selection highlight, and any drawn measurement line included): PNG via 3Dmol's own `viewer.pngURI()`, or JPEG via the canvas's own `toDataURL('image/jpeg', 0.92)` (3Dmol has no built-in JPEG export). Posts a `snapshot` message with the resulting data URI.
  - Every handler is wrapped in try/catch and posts an `{ type: 'error' }` message on failure instead of silently crashing the WebView.

### `features/protein-view/ProteinWebView.tsx`

The React Native bridge component. On mount (and whenever `code`/`raw` change — deliberately *not* re-triggered by live visualization-mode/label changes, so the switcher in the same screen doesn't force a full WebView rebuild): parses the raw CIF (`parseMolecule`), serializes it to SDF (`moleculeToSdf`), loads the bundled 3Dmol script (`load3DmolScript`), and builds the final HTML (`buildProteinViewerHtml`). Exposes an imperative handle (`ProteinWebViewHandle`) so the parent screen can call into the WebView's `window.__*` functions via `injectJavaScript`:

- `requestSnapshot(format)`, `setVisualizationMode(mode)`, `setAtomLabelsVisible(visible)`, `setMeasureModeEnabled(enabled)`.

`handleMessage` is the other direction of the bridge — it parses each `postMessage` payload and updates local state: `atomClick` → shows `AtomInfoCard`; `backgroundClick` → dismisses it; `snapshot` → writes the base64 data URI to a temp cache file (`expo-file-system`) and opens the native share sheet (`expo-sharing`), deleting the temp file afterward regardless of outcome; the `measure*` messages drive a small status banner ("Tap an atom to start measuring", "`C` selected — tap a second atom", "`C`–`O`: 1.43 Å").

### `features/protein-view/ProteinViewScreen.tsx`, `VisualizationModeSwitcher.tsx`, `AtomInfoCard.tsx`

- **`ProteinViewScreen`** — the screen chrome: back button, ligand code title, share button (native `Alert` to pick PNG vs JPEG), the mode switcher, an atom-labels toggle, and a measure-mode toggle, all driving the `ProteinWebView` via its ref.
- **`VisualizationModeSwitcher`** — a segmented control over the four `VisualizationMode` values (`core/viewer/visualizationMode.ts`), reused as-is on the Settings screen to pick the *default* mode.
- **`AtomInfoCard`** — the bottom-sheet-style popup shown on atom tap. `summarizeBonds` tallies bond orders into a string like `"2 single, 1 double"`; `bondOrderLabel` maps `1|2|3` → `single|double|triple`; `formatBondLength` renders `"1.43 Å"`. Element name/atomic-number/accent-color for the popup come from `core/chemistry/elementInfo.ts`'s **`getElementInfo(symbol)`** — a standalone display-only table (falls back to `{ name: 'Unknown', atomicNumber: 0, ... }` for unrecognized symbols), independent of the Jmol coloring used for the actual 3D render.

## Networking & persistence

### `core/networking/`

- **`rcsbClient.ts`** — **`fetchLigandCifResponse(code, externalSignal?)`** is the raw HTTP layer: fetches `https://files.rcsb.org/ligands/view/{code}.cif` with a 15s timeout, implemented via an internal `AbortController` that's also wired to an optional external abort signal (so navigating away mid-request cancels the fetch). A timeout specifically re-throws as `LigandRequestTimeoutError`, distinguishing "we gave up" from "the caller cancelled us on purpose."
- **`reachability.ts`** — **`isOffline()`** uses `@react-native-community/netinfo`; only a *definite* `false` on `isConnected`/`isInternetReachable` counts as offline (both fields can be `null` while still being determined, which shouldn't block a request that might succeed).
- **`ligandService.ts`** — **`fetchLigandCif(code, signal?)`** is the orchestration layer the UI actually calls: checks the on-disk cache first (`ligandCifCache.ts`), then `isOffline()`, then performs the HTTP fetch and classifies the outcome into a discriminated `LigandFetchResult` (`success` or a typed `LigandFetchError`), populating the cache on success. A genuine user-initiated abort is re-thrown rather than turned into a result, since it isn't a real failure worth showing.
- **`ligandFetchError.ts`** — pure presentation mapping from `LigandFetchError` (`noConnection | notFound | timeout | parseFailure | serverError`) to the exact required user-facing title/message/icon for each case.

### `core/persistence/`

- **`ligandCifCache.ts`** — best-effort on-disk cache of raw `.cif` text per ligand code (`Paths.cache/ligands/{CODE}.cif`), so a previously viewed ligand opens instantly and works offline. Read/write failures are swallowed — caching is a nice-to-have, never allowed to break a fetch that already succeeded.
- **`ligandRepository.ts`** — **`parseLigandCodes(raw)`** parses the bundled `ligands.txt` (one code per line, trimmed, deduplicated via a `Set`, sorted); **`filterLigandCodes(codes, query)`** does the case-insensitive substring search; **`applyFavoritesFilter(codes, favorites, onlyFavorites)`** optionally narrows to favorited codes; **`loadLigandCodes()`** ties it together by reading the asset off disk.
- **`favoritesRepository.ts`** / **`preferencesRepository.ts`** — plain-JSON (non-secure — nothing sensitive) persistence in the app's document directory for starred ligand codes and default-visualization-mode/label-visibility settings, respectively. Both follow the same pattern: a defensive `parse*Json` that falls back to a safe default on any malformed input, and a best-effort `save*` that swallows write errors.

## Design system

`src/design-system/` centralizes color tokens, spacing/radius/typography scales, and a handful of shared components (`PrimaryButton`, `TextField`, `AlertCard`). Worth calling out:

- **`moleculeGlyph.ts`** + **`avatarPalette.ts`** — deterministically generate the small SVG "molecule" icon shown next to each row in the ligand list (a hub atom, a few satellite atoms, bond lines), seeded from the ligand code itself via **`seededRandom.ts`** so the same code always renders the same glyph without needing to actually fetch or parse that ligand's real structure.

## Testing

`npm test` runs Jest (`jest-expo` preset). Coverage focuses on the parts of the app that are pure logic and worth locking down with fixtures: the CIF tokenizer/atom/bond parsers (against real fixture files pulled from RCSB — `ATP`, `CA`, `CLA`, `HEM`, `NAG`, `UNK`, `ZN`, covering both the `loop_` and flat single-atom category forms), `molecule.ts`, `moleculeToSdf.ts`, the persistence repositories, and the `proteinViewerHtml`/`AtomInfoCard` formatting helpers.

## Getting started

```bash
# install dependencies
npm install

# run on iOS
npm run ios

# run on Android
npm run android

# run on web
npm run web

# run the test suite
npm test
```

## License

Private project — all rights reserved.
