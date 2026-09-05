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
  const [librettoOpen, setLibrettoOpen] = useState(false);
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
        error: "The file handle for this cue is gone. Load the disc again.",
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
        error: "This chassis refused playback. Try another file.",
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
      setNotices(["No files made it onto the platter."]);
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
        error: "Playback blocked until you press a transport key again.",
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

  const windowTitle = playing?.title ?? "NO TAPE";
  const windowArtist = playing?.artist ?? "Slip a local file into the door";
  const clock = `${formatClock(player.positionMs)} / ${formatClock(player.durationMs ?? playing?.durationMs ?? null)}`;

  return (
    <div className="room">
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
            error: "The decoder choked. That file may be damaged or a format this browser skips.",
          }))
        }
      />

      <header className="mast">
        <p className="brand">Pocket Deck</p>
        <p className="model">WM-88 · stereo cassette</p>
      </header>

      <section className="chassis" aria-label="Walkman">
        <div className="rail rail-left" aria-hidden="true" />
        <div className="face">
          <div className="face-top">
            <VuMeters active={player.status === "playing"} level={player.volume} />
            <div className={`cassette ${playing ? "" : "cassette-empty"} ${player.status === "playing" ? "cassette-spin" : ""}`}>
              <span className="reel reel-l" aria-hidden="true" />
              <div className="cassette-label">
                <p className="lcd-label">Window</p>
                <p className="lcd-title">{windowTitle}</p>
                <p className="lcd-artist">{windowArtist}</p>
                <p className="lcd-clock">{clock}</p>
                <p className="lcd-status">
                  {player.status === "error"
                    ? "JAM"
                    : player.status === "playing"
                      ? "PLAY"
                      : player.status === "paused"
                        ? "PAUSE"
                        : player.status === "loading"
                          ? "LOAD"
                          : "STOP"}
                </p>
              </div>
              <span className="reel reel-r" aria-hidden="true" />
            </div>
          </div>

          {player.error ? (
            <p className="fault" role="alert">
              {player.error}
            </p>
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

          <div className="bay">
            <label className="load-key">
              Load tape
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
            <button type="button" className="ghost-key" onClick={loadSample}>
              Pocket tone
            </button>
            <button
              type="button"
              className={`ghost-key ${librettoOpen ? "ghost-on" : ""}`}
              onClick={() => setLibrettoOpen((v) => !v)}
            >
              J-card
            </button>
          </div>

          {notices.length > 0 ? (
            <ul className="notices">
              {notices.map((n) => (
                <li key={n}>{n}</li>
              ))}
            </ul>
          ) : null}

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
        </div>
        <div className="rail rail-right" aria-hidden="true" />
      </section>

      {librettoOpen ? (
        <LyricsPanel
          page={{ ...lyrics, trackHint: playing?.title ?? "" }}
          blank={lyricsAreBlank(lyrics)}
          onChange={(body) => {
            writeStoredLyrics(body);
            setLyrics((p) => ({ ...p, body }));
          }}
          onClose={() => setLibrettoOpen(false)}
        />
      ) : null}

      <p className="foot">Tapes stay in this browser. Nothing is uploaded.</p>
    </div>
  );
}
