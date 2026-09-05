import { titleFromFileName, type Track } from "../domain/track";

const AUDIO_EXT = /\.(mp3|wav|ogg|flac|m4a|aac|webm)$/i;

export function isAudioFile(file: File): boolean {
  if (file.type.startsWith("audio/")) {
    return true;
  }
  return AUDIO_EXT.test(file.name);
}

export function rejectReason(file: File): string {
  return `${file.name} is not an audio file this deck can cue.`;
}

export function tracksFromFiles(files: File[]): {
  accepted: Array<{ track: Track; file: File }>;
  rejected: string[];
} {
  const accepted: Array<{ track: Track; file: File }> = [];
  const rejected: string[] = [];
  for (const file of files) {
    if (!isAudioFile(file)) {
      rejected.push(rejectReason(file));
      continue;
    }
    accepted.push({
      file,
      track: {
        id: crypto.randomUUID(),
        title: titleFromFileName(file.name),
        artist: "Unknown press",
        album: "Local disc",
        durationMs: null,
        source: "local",
        fileName: file.name,
      },
    });
  }
  return { accepted, rejected };
}

export const SAMPLE_TRACK: Track = {
  id: "sample-a440",
  title: "A440 tuning burst",
  artist: "House oscillator",
  album: "Alignment disc",
  durationMs: 2000,
  source: "sample",
  fileName: "tuning-tone.wav",
};

export const SAMPLE_HREF = "/tuning-tone.wav";
