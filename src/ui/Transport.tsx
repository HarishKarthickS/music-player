import { formatClock, type PlayerStatus } from "../domain/player";

interface TransportProps {
  hasDisc: boolean;
  status: PlayerStatus;
  volume: number;
  muted: boolean;
  positionMs: number;
  durationMs: number | null;
  onPlayPause: () => void;
  onStop: () => void;
  onPrev: () => void;
  onNext: () => void;
  onSeek: (ratio: number) => void;
  onVolume: (volume: number) => void;
  onMute: () => void;
}

export function Transport(props: TransportProps) {
  const ratio =
    props.durationMs && props.durationMs > 0 ? props.positionMs / props.durationMs : 0;
  const disabled = !props.hasDisc;

  return (
    <div className="player-bar">
      <div className="keys" role="group" aria-label="Playback">
        <button type="button" disabled={disabled} onClick={props.onPrev}>
          Previous
        </button>
        <button type="button" className="key-main" disabled={disabled} onClick={props.onPlayPause}>
          {props.status === "playing" ? "Pause" : "Play"}
        </button>
        <button type="button" disabled={disabled} onClick={props.onStop}>
          Stop
        </button>
        <button type="button" disabled={disabled} onClick={props.onNext}>
          Next
        </button>
      </div>
      <label className="seek">
        <span>{formatClock(props.positionMs)}</span>
        <input
          type="range"
          min={0}
          max={1000}
          value={Math.round(ratio * 1000)}
          disabled={disabled || !props.durationMs}
          onChange={(e) => props.onSeek(Number(e.target.value) / 1000)}
        />
        <span>{formatClock(props.durationMs)}</span>
      </label>
      <label className="vol">
        <span>Volume</span>
        <input
          type="range"
          min={0}
          max={100}
          value={Math.round(props.volume * 100)}
          onChange={(e) => props.onVolume(Number(e.target.value) / 100)}
        />
        <button type="button" className="mute" onClick={props.onMute}>
          {props.muted ? "Unmute" : "Mute"}
        </button>
      </label>
    </div>
  );
}
