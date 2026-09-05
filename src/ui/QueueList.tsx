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
        <h2>Queue</h2>
        <p>
          {queue.tracks.length} track{queue.tracks.length === 1 ? "" : "s"}
          {current ? ` · ${current.title}` : ""}
        </p>
      </div>
      <ol>
        {queue.tracks.map((track, index) => {
          const active = track.id === currentId || index === queue.index;
          return (
            <li key={track.id} className={active ? "cue-on" : undefined}>
              <button type="button" className="cue-pick" onClick={() => onPick(index)}>
                <span className="cue-num">{index + 1}</span>
                <span className="cue-meta">
                  <strong>{track.title}</strong>
                  <em>
                    {track.artist} · {track.fileName}
                  </em>
                </span>
              </button>
              <button type="button" className="cue-drop" onClick={() => onDrop(track.id)}>
                Remove
              </button>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
