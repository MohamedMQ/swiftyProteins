let suppressCount = 0;

export function isAppLockSuppressed(): boolean {
  return suppressCount > 0;
}

export function beginAppLockSuppression(): void {
  suppressCount += 1;
}

export function endAppLockSuppression(): void {
  setTimeout(() => {
    suppressCount = Math.max(0, suppressCount - 1);
  }, 800);
}
