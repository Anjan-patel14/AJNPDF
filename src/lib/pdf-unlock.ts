'use client';

/**
 * Legacy compatibility module.
 * Password guessing and browser-side decryption were intentionally removed.
 * Use src/lib/pdf-backend.ts with the online workflow instead.
 */
export async function detectPDFSecurity() {
  throw new Error('Security inspection requires the AJN PDF online workflow.');
}

export async function unlockWithPassword() {
  throw new Error('Real PDF decryption requires the AJN PDF online workflow.');
}

export async function removeRestrictionsOnly() {
  throw new Error('Restriction removal requires the AJN PDF online workflow.');
}

export class PasswordAttemptManager {
  canAttempt() { return { allowed: true }; }
  recordAttempt(success: boolean) { return { isLocked: false, attemptsRemaining: success ? 10 : 9 }; }
  reset() {}
}
