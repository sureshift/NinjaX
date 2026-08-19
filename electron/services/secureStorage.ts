import { safeStorage } from "electron";

/**
 * Wraps Electron's safeStorage API, which encrypts using the OS's own
 * credential store (Keychain on macOS, DPAPI on Windows, libsecret on
 * Linux). This is how OAuth tokens and AI provider API keys are kept out
 * of the plaintext SQLite file - encrypt before insert, decrypt after read.
 */
export function encryptSecret(plaintext: string): string {
  if (!safeStorage.isEncryptionAvailable()) {
    throw new Error(
      "OS-level secure storage is not available on this machine. NinjaX will not store " +
        "API keys or tokens in plaintext - please check your OS keychain/credential manager."
    );
  }
  return safeStorage.encryptString(plaintext).toString("base64");
}

export function decryptSecret(encryptedBase64: string): string {
  return safeStorage.decryptString(Buffer.from(encryptedBase64, "base64"));
}
