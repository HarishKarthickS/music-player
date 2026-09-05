export type TrackId = string;

export type TrackSource = "local" | "sample";

export interface Track {
  id: TrackId;
  title: string;
  artist: string;
  album: string;
  durationMs: number | null;
  source: TrackSource;
  fileName: string;
}

export function titleFromFileName(fileName: string): string {
  const base = fileName.replace(/\.[^.]+$/, "").replace(/[_-]+/g, " ").trim();
  return base.length > 0 ? base : "Untitled tape";
}
