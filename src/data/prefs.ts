import { clampVolume, DEFAULT_VOLUME } from "../domain/player";

const VOLUME_KEY = "music-player:volume";
const LYRICS_KEY = "music-player:lyrics";

export function readStoredVolume(): number {
  try {
    const raw = localStorage.getItem(VOLUME_KEY);
    if (!raw) {
      return DEFAULT_VOLUME;
    }
    return clampVolume(Number(raw));
  } catch {
    return DEFAULT_VOLUME;
  }
}

export function writeStoredVolume(volume: number): void {
  try {
    localStorage.setItem(VOLUME_KEY, String(clampVolume(volume)));
  } catch {
    /* private mode */
  }
}

export function readStoredLyrics(): string {
  try {
    return localStorage.getItem(LYRICS_KEY) ?? "";
  } catch {
    return "";
  }
}

export function writeStoredLyrics(body: string): void {
  try {
    localStorage.setItem(LYRICS_KEY, body);
  } catch {
    /* private mode */
  }
}
