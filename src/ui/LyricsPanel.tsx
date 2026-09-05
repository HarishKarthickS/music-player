import type { LyricsPage } from "../domain/lyrics";

interface LyricsPanelProps {
  page: LyricsPage;
  blank: boolean;
  onChange: (body: string) => void;
  onClose: () => void;
}

export function LyricsPanel({ page, blank, onChange, onClose }: LyricsPanelProps) {
  return (
    <aside className="lyrics" aria-label="Lyrics">
      <div className="lyrics-head">
        <div>
          <p className="now-kicker">Lyrics</p>
          <h2>{page.trackHint || "No track"}</h2>
        </div>
        <button type="button" className="chip" onClick={onClose}>
          Close
        </button>
      </div>
      {blank ? (
        <p className="lyrics-hint">No lyrics yet. Paste them here — they stay in this browser.</p>
      ) : null}
      <textarea
        value={page.body}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Paste lyrics for the current track"
        rows={14}
      />
    </aside>
  );
}
