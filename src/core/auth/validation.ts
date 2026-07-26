const USERNAME_PATTERN = /^[a-zA-Z0-9_.-]+$/;
const USERNAME_MIN_LENGTH = 3;
const USERNAME_MAX_LENGTH = 24;
const PASSWORD_MIN_LENGTH = 8;

export function validateUsername(username: string): string[] {
  const errors: string[] = [];

  if (username.length < USERNAME_MIN_LENGTH || username.length > USERNAME_MAX_LENGTH) {
    errors.push(`Must be ${USERNAME_MIN_LENGTH}-${USERNAME_MAX_LENGTH} characters`);
  }
  if (!USERNAME_PATTERN.test(username)) {
    errors.push('Only letters, numbers, "." "_" "-" are allowed');
  }

  return errors;
}

export function validatePassword(password: string): string[] {
  const errors: string[] = [];

  if (password.length < PASSWORD_MIN_LENGTH) {
    errors.push(`Must be at least ${PASSWORD_MIN_LENGTH} characters`);
  }
  if (!/[0-9]/.test(password)) {
    errors.push('Must include at least one number');
  }
  if (!/[a-zA-Z]/.test(password)) {
    errors.push('Must include at least one letter');
  }

  return errors;
}
