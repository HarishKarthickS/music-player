import { useEffect, useMemo, useRef, useState } from "react";
import {
  appendTracks,
  currentTrack,
  emptyQueue,
  removeTrack,
  selectIndex,
  stepQueue,
  type QueueState,
} from "../domain/queue";
import {
  clampVolume,
  formatClock,
  idlePlayer,
  type PlayerState,
} from "../domain/player";
import type { LyricsPage } from "../domain/lyrics";
import { lyricsAreBlank } from "../domain/lyrics";
import type { Track } from "../domain/track";
import { ObjectUrlBank } from "../data/objectUrlBank";
import { SAMPLE_HREF, SAMPLE_TRACK, tracksFromFiles } from "../data/library";
import { readStoredLyrics, readStoredVolume, writeStoredLyrics, writeStoredVolume } from "../data/prefs";
import { EmptyDeck } from "./EmptyDeck";
import { LyricsPanel } from "./LyricsPanel";
import { QueueList } from "./QueueList";
import { Transport } from "./Transport";
import { VuMeters } from "./VuMeters";

function artworkHue(id: string): number {
  let hue = 0;
  for (let i = 0; i < id.length; i += 1) {
    hue = (hue * 33 + id.charCodeAt(i)) % 360;
  }
  return hue;
}

export function App() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const bank = useMemo(() => new ObjectUrlBank(), []);
  const fileById = useMemo(() => new Map<string, File>(), []);
  const [queue, setQueue] = useState<QueueState>(emptyQueue);
  const [player, setPlayer] = useState<PlayerState>(() => ({
    ...idlePlayer(),
    volume: readStoredVolume(),
  }));
  const [lyrics, setLyrics] = useState<LyricsPage>(() => ({
    trackHint: "",
    body: readStoredLyrics(),
  }));
  const [lyricsOpen, setLyricsOpen] = useState(false);
  const [notices, setNotices] = useState<string[]>([]);
  const playing = currentTrack(queue);

  useEffect(() => {
    return () => bank.clear();
  }, [bank]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) {
      return;
    }
    audio.volume = player.muted ? 0 : player.volume;
  }, [player.muted, player.volume]);

  function srcFor(track: Track): string | undefined {
    if (track.source === "sample") {
      return SAMPLE_HREF;
    }
    return bank.get(track.id);
  }

  async function cue(track: Track, autoplay: boolean) {
    const audio = audioRef.current;
    if (!audio) {
      return;
    }
    const src = srcFor(track);
    if (!src) {
      setPlayer((p) => ({
        ...p,
        status: "error",
        currentId: track.id,
        error: "This file is no longer available. Add it again.",
      }));
      return;
    }
    setPlayer((p) => ({
      ...p,
      status: "loading",
      currentId: track.id,
      positionMs: 0,
      error: null,
    }));
    audio.src = src;
    try {
      audio.load();
      if (autoplay) {
        await audio.play();
      }
    } catch {
      setPlayer((p) => ({
        ...p,
        status: "error",
        error: "Playback failed. Try another file.",
      }));
    }
  }

  function ingest(fileList: FileList | File[]) {
    const files = Array.from(fileList);
    const { accepted, rejected } = tracksFromFiles(files);
    for (const item of accepted) {
      fileById.set(item.track.id, item.file);
      bank.remember(item.track.id, item.file);
    }
    if (rejected.length > 0) {
      setNotices(rejected);
    } else if (accepted.length === 0) {
      setNotices(["No audio files were added."]);
    } else {
      setNotices([]);
    }
    if (accepted.length === 0) {
      return;
    }
    setQueue((q) => {
      const next = appendTracks(
        q,
        accepted.map((item) => item.track),
      );
      const wasEmpty = q.tracks.length === 0;
      if (wasEmpty && next.tracks[0]) {
        void cue(next.tracks[0], false);
      }
      return next;
    });
  }

  function loadSample() {
    setNotices([]);
    setQueue((q) => {
      if (q.tracks.some((t) => t.id === SAMPLE_TRACK.id)) {
        const idx = q.tracks.findIndex((t) => t.id === SAMPLE_TRACK.id);
        const next = selectIndex(q, idx);
        const track = currentTrack(next);
        if (track) {
          void cue(track, true);
        }
        return next;
      }
      const next = appendTracks(q, [SAMPLE_TRACK]);
      void cue(SAMPLE_TRACK, true);
      return next;
    });
  }

  function onPlayPause() {
    const audio = audioRef.current;
    const track = currentTrack(queue);
    if (!audio || !track) {
      return;
    }
    if (player.status === "playing") {
      audio.pause();
      return;
    }
    if (player.currentId !== track.id || !audio.src) {
      void cue(track, true);
      return;
    }
    void audio.play().catch(() => {
      setPlayer((p) => ({
        ...p,
        status: "error",
        error: "Playback was blocked. Press play again.",
      }));
    });
  }

  function onStop() {
    const audio = audioRef.current;
    if (!audio) {
      return;
    }
    audio.pause();
    audio.currentTime = 0;
    setPlayer((p) => ({ ...p, status: "paused", positionMs: 0 }));
  }

  function skip(direction: 1 | -1) {
    setQueue((q) => {
      const next = stepQueue(q, direction);
      const track = currentTrack(next);
      if (track) {
        void cue(track, true);
      }
      return next;
    });
  }

  function pickIndex(index: number) {
    setQueue((q) => {
      const next = selectIndex(q, index);
      const track = currentTrack(next);
      if (track) {
        void cue(track, true);
      }
      return next;
    });
  }

  function dropTrack(id: string) {
    const audio = audioRef.current;
    const wasCurrent = player.currentId === id;
    bank.forget(id);
    fileById.delete(id);
    setQueue((q) => {
      const next = removeTrack(q, id);
      if (wasCurrent) {
        const track = currentTrack(next);
        if (track) {
          void cue(track, player.status === "playing");
        } else if (audio) {
          audio.removeAttribute("src");
          audio.load();
          setPlayer((p) => ({ ...idlePlayer(), volume: p.volume, muted: p.muted }));
        }
      }
      return next;
    });
  }

  function setVolume(volume: number) {
    const next = clampVolume(volume);
    writeStoredVolume(next);
    setPlayer((p) => ({ ...p, volume: next, muted: next === 0 ? p.muted : false }));
  }

  const title = playing?.title ?? "Not playing";
  const artist = playing?.artist ?? "Add files or play the sample";
  const clock = `${formatClock(player.positionMs)} / ${formatClock(player.durationMs ?? playing?.durationMs ?? null)}`;
  const hue = playing ? artworkHue(playing.id) : 220;
  const mark = playing ? playing.title.slice(0, 1).toUpperCase() : "♪";
  const statusLabel =
    player.status === "error"
      ? "Error"
      : player.status === "playing"
        ? "Playing"
        : player.status === "paused"
          ? "Paused"
          : player.status === "loading"
            ? "Loading…"
            : "Stopped";

  return (
    <div className="app">
      <audio
        ref={audioRef}
        onPlay={() => setPlayer((p) => ({ ...p, status: "playing", error: null }))}
        onPause={() =>
          setPlayer((p) => ({
            ...p,
            status: p.status === "ended" ? "ended" : "paused",
          }))
        }
        onEnded={() => {
          setPlayer((p) => ({ ...p, status: "ended" }));
          skip(1);
        }}
        onTimeUpdate={(e) => {
          const el = e.currentTarget;
          setPlayer((p) => ({
            ...p,
            positionMs: el.currentTime * 1000,
            durationMs: Number.isFinite(el.duration) ? el.duration * 1000 : p.durationMs,
          }));
        }}
        onLoadedMetadata={(e) => {
          const el = e.currentTarget;
          setPlayer((p) => ({
            ...p,
            durationMs: Number.isFinite(el.duration) ? el.duration * 1000 : null,
          }));
        }}
        onError={() =>
          setPlayer((p) => ({
            ...p,
            status: "error",
            error: "This file could not be decoded.",
          }))
        }
      />

      <header className="topbar">
        <p className="brand">Listen</p>
        <div className="top-actions">
          <label className="add-files">
            Add files
            <input
              type="file"
              accept="audio/*"
              multiple
              onChange={(e) => {
                if (e.target.files) {
                  ingest(e.target.files);
                }
                e.target.value = "";
              }}
            />
          </label>
          <button type="button" className="chip" onClick={loadSample}>
            Play sample
          </button>
          <button
            type="button"
            className={`chip ${lyricsOpen ? "chip-on" : ""}`}
            onClick={() => setLyricsOpen((v) => !v)}
          >
            Lyrics
          </button>
        </div>
      </header>

      <div className={`workspace ${lyricsOpen ? "workspace-lyrics" : ""}`}>
        {queue.tracks.length === 0 ? (
          <EmptyDeck />
        ) : (
          <QueueList
            queue={queue}
            currentId={player.currentId}
            onPick={pickIndex}
            onDrop={dropTrack}
          />
        )}

        <section className="now-playing" aria-label="Now playing">
          <div
            className={`artwork ${playing ? "" : "artwork-empty"} ${player.status === "playing" ? "artwork-live" : ""}`}
            style={{
              background: `radial-gradient(120% 80% at 18% 0%, rgba(255,255,255,0.22), transparent 46%),
                linear-gradient(165deg, hsl(${hue} 42% 42%) 0%, hsl(${(hue + 40) % 360} 38% 22%) 52%, #121214 100%)`,
            }}
          >
            <span className="artwork-mark">{mark}</span>
            <VuMeters active={player.status === "playing"} level={player.volume} />
          </div>
          <div className="now-meta">
            <p className="now-kicker">{statusLabel}</p>
            <h1>{title}</h1>
            <p className="now-artist">{artist}</p>
            <p className="now-clock">{clock}</p>
          </div>
        </section>

        {lyricsOpen ? (
          <LyricsPanel
            page={{ ...lyrics, trackHint: playing?.title ?? "" }}
            blank={lyricsAreBlank(lyrics)}
            onChange={(body) => {
              writeStoredLyrics(body);
              setLyrics((p) => ({ ...p, body }));
            }}
            onClose={() => setLyricsOpen(false)}
          />
        ) : null}
      </div>

      {player.error ? (
        <p className="fault" role="alert">
          {player.error}
        </p>
      ) : null}

      {notices.length > 0 ? (
        <ul className="notices">
          {notices.map((n) => (
            <li key={n}>{n}</li>
          ))}
        </ul>
      ) : null}

      <Transport
        hasDisc={Boolean(playing)}
        status={player.status}
        volume={player.volume}
        muted={player.muted}
        positionMs={player.positionMs}
        durationMs={player.durationMs}
        onPlayPause={onPlayPause}
        onStop={onStop}
        onPrev={() => skip(-1)}
        onNext={() => skip(1)}
        onSeek={(ratio) => {
          const audio = audioRef.current;
          if (!audio || !Number.isFinite(audio.duration)) {
            return;
          }
          audio.currentTime = ratio * audio.duration;
        }}
        onVolume={setVolume}
        onMute={() => setPlayer((p) => ({ ...p, muted: !p.muted }))}
      />

      <p className="foot">Audio stays on this device. Nothing is uploaded.</p>
    </div>
  );
}
