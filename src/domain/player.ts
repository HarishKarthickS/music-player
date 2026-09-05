import type { TrackId } from "./track";

export type PlayerStatus = "idle" | "loading" | "playing" | "paused" | "ended" | "error";

export interface PlayerState {
  status: PlayerStatus;
  currentId: TrackId | null;
  positionMs: number;
  durationMs: number | null;
  volume: number;
  muted: boolean;
  error: string | null;
}

export const DEFAULT_VOLUME = 0.72;

export function idlePlayer(): PlayerState {
  return {
    status: "idle",
    currentId: null,
    positionMs: 0,
    durationMs: null,
    volume: DEFAULT_VOLUME,
    muted: false,
    error: null,
  };
}

export function clampVolume(value: number): number {
  if (Number.isNaN(value)) {
    return DEFAULT_VOLUME;
  }
  return Math.min(1, Math.max(0, value));
}

export function formatClock(ms: number | null): string {
  if (ms === null || !Number.isFinite(ms) || ms < 0) {
    return "--:--";
  }
  const total = Math.floor(ms / 1000);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}
