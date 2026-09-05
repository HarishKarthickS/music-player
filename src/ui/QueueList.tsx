import { currentTrack, type QueueState } from "../domain/queue";

interface QueueListProps {
  queue: QueueState;
  currentId: string | null;
  onPick: (index: number) => void;
  onDrop: (id: string) => void;
}

export function QueueList({ queue, currentId, onPick, onDrop }: QueueListProps) {
  const current = currentTrack(queue);

  return (
    <div className="queue">
      <div className="queue-head">
        <h2>Tape stack</h2>
        <p>
          {queue.tracks.length} cue{queue.tracks.length === 1 ? "" : "s"} · now{" "}
          {current?.title ?? "none"}
        </p>
      </div>
      <ol>
        {queue.tracks.map((track, index) => {
          const active = track.id === currentId || index === queue.index;
          return (
            <li key={track.id} className={active ? "cue-on" : undefined}>
              <button type="button" className="cue-pick" onClick={() => onPick(index)}>
                <span className="cue-num">{String(index + 1).padStart(2, "0")}</span>
                <span className="cue-meta">
                  <strong>{track.title}</strong>
                  <em>
                    {track.artist} · {track.fileName}
                  </em>
                </span>
              </button>
              <button type="button" className="cue-drop" onClick={() => onDrop(track.id)}>
                Eject
              </button>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
