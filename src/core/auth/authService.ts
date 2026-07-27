import { hashPassword, verifyPassword, type PasswordHash } from '../security/passwordHashing';
import { getSecureJSON, setSecureJSON } from '../security/secureStore';
import { validatePassword, validateUsername } from './validation';

const USERS_KEY = 'auth.users';
// Not a secret — just remembers which local account biometric login should
// unlock, since a fingerprint/face scan alone can't tell us *who*, only
// that it's the device owner.
const LAST_USERNAME_KEY = 'auth.lastUsername';

// Used when the username doesn't exist, so verifyPassword still pays its
// full PBKDF2 cost — otherwise a missing user would return faster than a
// wrong password and leak which usernames are registered via timing.
const DUMMY_PASSWORD_HASH: PasswordHash = {
  algorithm: 'PBKDF2-HMAC-SHA256',
  iterations: 210_000,
  saltHex: '00'.repeat(16),
  hashHex: '00'.repeat(32),
};

interface StoredUser {
  username: string;
  passwordHash: PasswordHash;
}

type UserDirectory = Record<string, StoredUser>;

export type AuthResult =
  | { success: true; username: string }
  | { success: false; error: 'USERNAME_INVALID' | 'PASSWORD_POLICY'; reasons: string[] }
  | { success: false; error: 'USERNAME_TAKEN'; reasons: string[] }
  | { success: false; error: 'INVALID_CREDENTIALS'; reasons: string[] };

function normalize(username: string): string {
  return username.trim().toLowerCase();
}

async function loadUsers(): Promise<UserDirectory> {
  return (await getSecureJSON<UserDirectory>(USERS_KEY)) ?? {};
}

export async function getLastAuthenticatedUsername(): Promise<string | null> {
  return getSecureJSON<string>(LAST_USERNAME_KEY);
}

export async function registerUser(username: string, password: string): Promise<AuthResult> {
  const usernameErrors = validateUsername(username);
  if (usernameErrors.length > 0) {
    return { success: false, error: 'USERNAME_INVALID', reasons: usernameErrors };
  }

  const passwordErrors = validatePassword(password);
  if (passwordErrors.length > 0) {
    return { success: false, error: 'PASSWORD_POLICY', reasons: passwordErrors };
  }

  const users = await loadUsers();
  const key = normalize(username);
  if (users[key]) {
    return { success: false, error: 'USERNAME_TAKEN', reasons: ['That username is already taken'] };
  }

  users[key] = { username, passwordHash: await hashPassword(password) };
  await setSecureJSON(USERS_KEY, users);
  await setSecureJSON(LAST_USERNAME_KEY, username);

  return { success: true, username };
}

export async function loginUser(username: string, password: string): Promise<AuthResult> {
  const users = await loadUsers();
  const stored = users[normalize(username)];

  const record = stored?.passwordHash ?? DUMMY_PASSWORD_HASH;
  const isValid = (await verifyPassword(password, record)) && stored !== undefined;
  if (!isValid) {
    return {
      success: false,
      error: 'INVALID_CREDENTIALS',
      reasons: ['Incorrect username or password'],
    };
  }

  await setSecureJSON(LAST_USERNAME_KEY, stored.username);

  return { success: true, username: stored.username };
}

/**
 * A biometric scan only proves device ownership, not which account to use,
 * so this logs back in as whichever account last authenticated successfully
 * on this device — the same single-user assumption most personal apps make
 * for biometric unlock.
 */
export async function loginWithBiometrics(): Promise<AuthResult> {
  const lastUsername = await getLastAuthenticatedUsername();
  const users = await loadUsers();
  const stored = lastUsername ? users[normalize(lastUsername)] : undefined;

  if (!stored) {
    return {
      success: false,
      error: 'INVALID_CREDENTIALS',
      reasons: ['No account found on this device'],
    };
  }

  return { success: true, username: stored.username };
}
